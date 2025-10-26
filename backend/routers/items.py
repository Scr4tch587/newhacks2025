from fastapi import APIRouter, Query, UploadFile, File, HTTPException, Form
from models.item import Item
from db.firestore_client import db
from typing import List, Dict, Any, Optional
from geopy.geocoders import Nominatim
from math import radians, sin, cos, asin, sqrt
import requests
import os
from dotenv import load_dotenv
from db import cloudinary_client
import uuid
from db.cloudinary_client import upload_file
import qrcode
import io
import base64


router = APIRouter(prefix="/items", tags=["Items"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points (in kilometers)."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371
    return r * c

_geocoder = Nominatim(user_agent="newhacks2025-backend")


def _geocode_address(address: str) -> Optional[Dict[str, float]]:
    try:
        loc = _geocoder.geocode(address, timeout=10)
        if not loc:
            return None
        return {"lat": loc.latitude, "lng": loc.longitude}
    except Exception:
        return None

@router.post("/")
async def create_item(
    name: str = Form(...),
    description: str = Form(...),
    owner_email: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    """
    Creates an item and uploads image to Cloudinary (if provided).
    Returns QR code + item info.
    """

    # ✅ Verify owner (tourist or business)
    owner_doc = db.collection("tourists").document(owner_email).get()
    if not owner_doc.exists:
        owner_doc = db.collection("businesses").document(owner_email).get()
        if not owner_doc.exists:
            raise HTTPException(status_code=404, detail="Owner not found")

    # ✅ Upload image to Cloudinary (if provided)
    image_url = None
    if file:
        try:
            file_content = await file.read()
            public_id = f"items/{uuid.uuid4()}"
            result = upload_file(file_content, public_id)
            image_url = result.get("secure_url")
            if not image_url:
                raise Exception("Cloudinary upload failed")
        except Exception as e:
            print("Cloudinary upload failed:", e)
            raise HTTPException(status_code=400, detail="Image upload failed")

    # ✅ Generate QR code ID
    qr_code_id = str(uuid.uuid4())

    # ✅ Create Firestore item
    item_data = {
        "name": name,
        "description": description,
        "qr_code_id": qr_code_id,
        "owner_email": owner_email,
        "status": "available",
        "image_url": image_url,
        "created_by": "user"
    }
    db.collection("items").document(qr_code_id).set(item_data)

    # ✅ Generate QR code image
    qr_payload = {"qr_code_id": qr_code_id, "owner_email": owner_email}
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()

    return {
        "message": "Item created successfully",
        "qr_code_id": qr_code_id,
        "qr_code_base64": qr_base64,
        "image_url": image_url,
    }
@router.get("/")
def list_items():
    return [doc.to_dict() for doc in db.collection("items").stream()]


@router.get("/nearby")
def items_nearby(lat: float = Query(..., description="Origin latitude"), lng: float = Query(..., description="Origin longitude"), limit: int = Query(20, ge=1, le=100)) -> List[Dict[str, Any]]:
    """
    Return items whose owners are businesses with known addresses, sorted by distance to the given coordinates.
    Provide `lat` and `lng` for the origin. Response items include qr_code_id as `id`, name, description,
    owner_email, address, lat, lng, distance_km.
    """
    origin = {"lat": float(lat), "lng": float(lng)}

    # Collect tuples of (distance, original_item_dict) so we can sort by proximity
    distance_items: List[tuple[float, Dict[str, Any]]] = []
    for doc in db.collection("items").stream():
        item = doc.to_dict()
        owner_email = item.get("owner_email")
        if not owner_email:
            continue

        # Owner must be a business with an address to compute location
        owner_doc = db.collection("businesses").document(owner_email).get()
        if not owner_doc.exists:
            continue
        owner = owner_doc.to_dict()
        addr = owner.get("address")
        if not addr:
            continue

        coords = _geocode_address(addr)
        if not coords:
            # Skip owners we cannot geocode
            continue

        dist_km = _haversine_km(origin["lat"], origin["lng"], coords["lat"], coords["lng"])
        distance_items.append((dist_km, item))

    # Sort by distance and return the original item dicts for the closest `limit` items
    distance_items.sort(key=lambda x: x[0])
    closest = [itm for _, itm in distance_items[:limit]]
    return closest

@router.get("/{qr_code_id}")
def get_item(qr_code_id: str):
    doc = db.collection("items").document(qr_code_id).get()
    if not doc.exists:
        return {"error": "Item not found"}
    return doc.to_dict()

# --- Pickup/Dropoff endpoints ---

@router.post("/pickup/{qr_code_id}/{tourist_email}")
def pickup_item(qr_code_id: str, tourist_email: str):
    tourist_doc = db.collection("tourists").document(tourist_email).get()
    if not tourist_doc.exists:
        return {"error": "Tourist not found"}
    tourist = tourist_doc.to_dict()

    item_doc = db.collection("items").document(qr_code_id).get()
    if not item_doc.exists:
        return {"error": "Item not found"}
    item = item_doc.to_dict()

    cost = 5
    if tourist["points"] < cost:
        return {"error": "Not enough points to pick up item"}

    db.collection("tourists").document(tourist_email).update({"points": tourist["points"] - cost})
    db.collection("items").document(qr_code_id).update({"status": "unavailable", "owner_email": tourist_email})

    return {"message": f"{tourist_email} picked up {qr_code_id}", "remaining_points": tourist["points"] - cost}





@router.post("/dropoff/{qr_code_id}/{business_email}")
def dropoff_item(qr_code_id: str, business_email: str):
    business_doc = db.collection("businesses").document(business_email).get()
    if not business_doc.exists:
        return {"error": "Business not found"}
    business = business_doc.to_dict()

    item_doc = db.collection("items").document(qr_code_id).get()
    if not item_doc.exists:
        return {"error": "Item not found"}
    item = item_doc.to_dict()

    owner_email = item.get("owner_email")
    if owner_email:
        owner_doc = db.collection("tourists").document(owner_email).get()
        if owner_doc.exists:
            points_awarded = 10
            new_points = owner_doc.to_dict()["points"] + points_awarded
            db.collection("tourists").document(owner_email).update({"points": new_points})

    db.collection("items").document(qr_code_id).update({"status": "available", "owner_email": business_email})

    return {"message": f"{qr_code_id} dropped off at {business_email}"}

