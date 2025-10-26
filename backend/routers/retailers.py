from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Depends
from typing import List, Dict, Any, Optional
from models.retailer import Retailer, RetailerCreate
from routers.login import verify_token
from db.firestore_client import db
from db.firestore_auth import auth
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
    """Create a Firebase Auth user for the retailer and persist a retailer profile document.
    The retailer Firestore document is keyed by email for backward compatibility and includes the Firebase uid.
    """
    # Clean password (Firebase supports up to 128 chars; we still sanitize whitespace)
    password = (retailer.password or "").strip()
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    # Check if a retailer doc already exists under this email
    doc_ref = db.collection("retailers").document(retailer.email)
    if doc_ref.get().exists:
        raise HTTPException(status_code=400, detail="Retailer already exists")

    # Create Firebase Auth user
    try:
        user_record = auth.create_user(
            email=retailer.email,
            password=password,
            display_name=retailer.name,
        )
    except Exception as e:
        # If Firebase rejects, do not write any Firestore document
        raise HTTPException(status_code=400, detail=str(e))

    # Save retailer profile document (keyed by email; include uid and role for consistency)
    try:
        doc_ref.set({
            "name": retailer.name,
            "email": retailer.email,
            "address": retailer.address,
            "points": 0,
            "uid": user_record.uid,
            "role": "retailer",
        })
    except Exception:
        # Best-effort rollback of the auth user if Firestore write fails
        try:
            auth.delete_user(user_record.uid)
        except Exception:
            pass
        raise

    return {"message": "Retailer account created", "uid": user_record.uid}

@router.delete("/{retailer_email}")
def delete_retailer(retailer_email: str, logged_in_uid: str = Depends(verify_token)):
    doc_ref = db.collection("retailers").document(retailer_email)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Retailer not found")
    doc_ref.delete()
    return {"message": f"Retailer {retailer_email} deleted successfully"}

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
async def create_item_for_retailer(
    name: str = Form(...),
    description: str = Form(...),
    retailer_email: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    Allows a retailer to create a product listing.
    - Uploads image to Cloudinary
    - Generates QR code
    - Stores in Firestore under 'retailer_items'
    """

    # ✅ Check retailer exists
    retailer_doc = db.collection("retailers").document(retailer_email).get()
    if not retailer_doc.exists:
        raise HTTPException(status_code=404, detail="Retailer not found")

    # ✅ Upload image to Cloudinary (if provided)
    image_url = None
    if file:
        try:
            file_content = await file.read()
            public_id = str(uuid.uuid4())
            upload_result = upload_file(file_content, public_id, folder="retailer_items")
            image_url = upload_result.get("secure_url")
        except Exception as e:
            print("Cloudinary upload failed:", e)
            raise HTTPException(status_code=400, detail=str(e) if isinstance(e, RuntimeError) else "Image upload failed")

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
        "created_by": "retailer"
    }
    db.collection("retailer_items").document(qr_code_id).set(item_data)

    # ✅ Generate QR code with embedded data
    qr_payload = {"qr_code_id": qr_code_id}
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # ✅ Convert QR code image to Base64 for frontend display
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()

    return {
        "message": "Retail item created successfully",
        "qr_code_id": qr_code_id,
        "qr_code_base64": qr_base64,
        "image_url": image_url
    }
# ----------------------------
# Scan item QR (awards points + updates item)
# ----------------------------
@router.post("/scan_item_qr")
def scan_item_qr(qr_code_id: str, scanner_email: str):
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

    # Return QR code ID so frontend can display it
    return {
        "message": "Points awarded",
        "scanner_points": scanner_points,
        "qr_code_id": qr_code_id  # <-- frontend should use this
    }


@router.delete("/item/{qr_code_id}")
def delete_retail_item(qr_code_id: str, logged_in_uid: str = Depends(verify_token)):
    doc_ref = db.collection("retailer_items").document(qr_code_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Retail item not found")
    doc_ref.delete()
    return {"message": f"Retail item {qr_code_id} deleted successfully"}


@router.get("/profiles")
def list_retail_profiles(email: str = Query(...)):
    """List retail profiles owned by the given retailer email."""
    q = db.collection("retail_profiles").where("retailer_email", "==", email)
    return [doc.to_dict() for doc in q.stream()]

@router.post("/profiles")
async def create_retail_profile(
    name: str = Form(...),
    description: str = Form(...),
    image: Optional[UploadFile] = File(None),
    uid: str = Depends(verify_token),
):
    """Create a retail profile for the logged-in retailer.
    - Derives retailer email from Firebase uid
    - Uploads image to Cloudinary and stores the URL
    - Stores profile under 'retail_profiles'
    """
    # Resolve caller's email from uid
    try:
        user_record = auth.get_user(uid)
        retailer_email = user_record.email
    except Exception:
        retailer_email = None
    if not retailer_email:
        raise HTTPException(status_code=400, detail="Could not resolve retailer email")

    # Ensure retailer exists
    retailer_doc = db.collection("retailers").document(retailer_email).get()
    if not retailer_doc.exists:
        # Fallback: try lookup by uid field
        matches = list(db.collection("retailers").where("uid", "==", uid).limit(1).stream())
        if not matches:
            raise HTTPException(status_code=404, detail="Retailer not found")

    # Upload image (optional)
    image_url = None
    if image is not None:
        try:
            content = await image.read()
            public_id = str(uuid.uuid4())
            result = upload_file(content, public_id, folder="retail_profiles")
            image_url = result.get("secure_url")
        except Exception as e:
            print("Cloudinary upload failed:", e)
            raise HTTPException(status_code=400, detail=str(e) if isinstance(e, RuntimeError) else "Image upload failed")

    store_id = str(uuid.uuid4())
    data = {
        "store_id": store_id,
        "retailer_email": retailer_email,
        "name": name,
        "description": description,
        "image_url": image_url,
        "points": 0,
    }
    db.collection("retail_profiles").document(store_id).set(data)
    return {"message": "Retail profile created successfully", "store_id": store_id, "profile": data}

@router.delete("/profile/{store_id}")
def delete_retail_profile(store_id: str, logged_in_uid: str = Depends(verify_token)):
    doc_ref = db.collection("retail_profiles").document(store_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Retail profile not found")
    doc_ref.delete()
    return {"message": f"Retail profile {store_id} deleted successfully"}


