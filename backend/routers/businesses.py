from fastapi import APIRouter, Query, HTTPException, Depends
from models.business import Business, BusinessCreate
from db.firestore_client import db
from db.firestore_auth import auth
from typing import List, Dict, Any, Optional
from geopy.geocoders import Nominatim
from math import radians, sin, cos, asin, sqrt


router = APIRouter(prefix="/businesses", tags=["Businesses"])

# Create a business
@router.post("/")
def create_business(business: Business):
    doc_ref = db.collection("businesses").document(business.email)  # UID = email
    doc_ref.set(business.model_dump())
    return {"message": "Business created", "business": business}

# List all businesses
@router.get("/")
def list_businesses():
    docs = db.collection("businesses").stream()
    return [doc.to_dict() for doc in docs]

@router.get("/nearby")
def businesses_nearby(address: str = Query(..., description="User's address to compute proximity"), limit: int = Query(20, ge=1, le=100)) -> List[Dict[str, Any]]:
    """
    Return businesses sorted by distance to the given address.
    Response items include name, email, address, and distance_km.
    """
    origin = _geocode_address(address)
    if not origin:
        # Could not geocode the user's address; return empty list so frontend shows no locations
        return []

    results: List[Dict[str, Any]] = []

    # Iterate documents and compute distance. If a business document already contains
    # cached coordinates ('lat' and 'lng'), use them. Otherwise attempt to geocode
    # the business address and write the coords back to Firestore for future calls.
    for doc in db.collection("businesses").stream():
        business = doc.to_dict()
        addr = business.get("address")
        name = business.get("name")
        email = business.get("email")
        if not addr or not name or not email:
            continue

        # Geocode the business address (Business model does not include lat/lng)
        coords = _geocode_address(addr)
        if not coords:
            # Skip businesses we can't obtain coordinates for
            continue

        dist_km = _haversine_km(origin["lat"], origin["lng"], coords["lat"], coords["lng"])
        results.append({
            "id": doc.id,
            "name": name,
            "email": email,
            "address": addr,
            "distance_km": round(dist_km, 2),
        })

    results.sort(key=lambda x: x["distance_km"])  # nearest first
    return results[:limit]



# Get by email
@router.get("/email/{email}")
def get_business_by_email(email: str):
    docs = db.collection("businesses").where("email", "==", email).stream()
    results = [doc.to_dict() for doc in docs]
    if not results:
        return {"error": "Business not found"}
    return results[0]

# Get by address
@router.get("/address/{address}")
def get_business_by_address(address: str):
    docs = db.collection("businesses").where("address", "==", address).stream()
    results = [doc.to_dict() for doc in docs]
    if not results:
        return {"error": "Business not found"}
    return results

@router.post("/register")
def register_business(business: BusinessCreate):
    try:
        user_record = auth.create_user(
            email=business.email,
            password=business.password,
            display_name=business.business_name
        )
        # Save additional info to Firestore
        db.collection("businesses").document(user_record.uid).set({
            "email": business.email,
            "business_name": business.business_name,
            "uid": user_record.uid,
            "role": "business"
        })
        return {"message": "Business account created", "uid": user_record.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{uid}")
def get_business(uid: str):
    doc = db.collection("businesses").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Business not found")
    return doc.to_dict()


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points (in kilometers)."""
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
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