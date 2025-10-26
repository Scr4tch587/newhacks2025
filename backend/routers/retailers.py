from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List, Dict, Any, Optional
from models.retailer import Retailer, RetailerCreate
from db.firestore_client import db
from passlib.context import CryptContext
from geopy.geocoders import Nominatim
from math import radians, sin, cos, asin, sqrt
import io
import qrcode
import base64
import uuid
from db.cloudinary_client import upload_file

router = APIRouter(prefix="/retailers", tags=["Retailers"])

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
_geocoder = Nominatim(user_agent="newhacks2025-backend")

# ----------------------------
# Helper functions
# ----------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return 2 * 6371 * asin(sqrt(a))

def _geocode_address(address: str) -> Optional[Dict[str, float]]:
    try:
        loc = _geocoder.geocode(address, timeout=10)
        if not loc:
            return None
        return {"lat": loc.latitude, "lng": loc.longitude}
    except Exception:
        return None

# ----------------------------
# Registration & Login
# ----------------------------
@router.post("/register")
def register_retailer(retailer: RetailerCreate):
    # Clean and validate password
    password = retailer.password.strip()
    if len(password.encode("utf-8")) > 72:
        password = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")

    try:
        hashed_pw = pwd_context.hash(password)
    except Exception as e:
        print(f"Password hashing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Password hashing failed: {str(e)}")

    # Check for duplicates
    doc_ref = db.collection("retailers").document(retailer.email)
    if doc_ref.get().exists:
        raise HTTPException(status_code=400, detail="Retailer already exists")

    # Save retailer
    doc_ref.set({
        "name": retailer.name,
        "email": retailer.email,
        "password": hashed_pw,
        "address": retailer.address,
        "points": 0
    })

    return {"message": "Retailer registered successfully"}

# ----------------------------
# Nearby retailers
# ----------------------------
@router.get("/nearby")
def retailers_nearby(address: str = Query(...), limit: int = Query(20, ge=1, le=100)) -> List[Dict[str, Any]]:
    origin = _geocode_address(address)
    if not origin:
        return []

    results = []
    for doc in db.collection("retailers").stream():
        r = doc.to_dict()
        coords = _geocode_address(r["address"])
        if not coords:
            continue
        dist_km = _haversine_km(origin["lat"], origin["lng"], coords["lat"], coords["lng"])
        results.append({
            "id": r["email"],
            "name": r["name"],
            "address": r["address"],
            "points": r["points"],
            "distance_km": round(dist_km, 2)
        })

    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]

# ----------------------------
# Create item for retailer (QR + item record)
# ----------------------------
@router.post("/create_item")
def create_item_for_retailer(
    name: str,
    description: str,
    retailer_email: str,
    image_url: str | None = None
):
    # ✅ Check retailer exists
    retailer_doc = db.collection("retailers").document(retailer_email).get()
    if not retailer_doc.exists:
        raise HTTPException(status_code=404, detail="Retailer not found")

    # ✅ Generate a new QR code ID for the item
    qr_code_id = str(uuid.uuid4())

    # ✅ Create item record in Firestore
    item_data = {
        "name": name,
        "description": description,
        "qr_code_id": qr_code_id,
        "owner_email": retailer_email,
        "status": "available",
        "image_url": image_url,
        # remove the business_email link entirely
        "created_by": "retailer",
    }
    db.collection("items").document(qr_code_id).set(item_data)

    # ✅ Generate QR code with embedded data
    qr_payload = {"qr_code_id": qr_code_id, "retailer_email": retailer_email}
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # ✅ Convert QR to base64 for frontend display
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()

    return {
        "message": "Item created successfully",
        "qr_code_id": qr_code_id,
        "qr_code_base64": qr_base64,
    }
# ----------------------------
# Scan item QR (awards points + updates item)
# ----------------------------
@router.post("/scan_item_qr")
def scan_item_qr(qr_code_id: str, scanner_email: str):
    # Fetch item
    item_doc = db.collection("items").document(qr_code_id).get()
    if not item_doc.exists:
        raise HTTPException(status_code=404, detail="Item not found")
    item = item_doc.to_dict()
    if item["status"] != "available":
        raise HTTPException(status_code=400, detail="Item not available")

    # Award points to original business
    business_email = item.get("original_business_email")
    if business_email:
        business_doc = db.collection("businesses").document(business_email).get()
        if business_doc.exists:
            new_points = business_doc.to_dict()["points"] + 1
            db.collection("businesses").document(business_email).update({"points": new_points})

    # Award points to scanner retailer
    scanner_doc = db.collection("retailers").document(scanner_email).get()
    if not scanner_doc.exists:
        raise HTTPException(status_code=404, detail="Retailer not found")
    scanner_points = scanner_doc.to_dict()["points"] + 1
    db.collection("retailers").document(scanner_email).update({"points": scanner_points})

    # Update item ownership
    db.collection("items").document(qr_code_id).update({"owner_email": scanner_email, "status": "unavailable"})

    return {"message": "Points awarded", "scanner_points": scanner_points}