from fastapi import APIRouter, Query
from models.business import Business
from db.firestore_client import db
from typing import List, Dict, Any, Optional
from geopy.geocoders import Nominatim
from math import radians, sin, cos, asin, sqrt

router = APIRouter(prefix="/businesses", tags=["Businesses"])

@router.post("/")
def create_business(business: Business):
    doc_ref = db.collection("businesses").document(business.email)
    doc_ref.set(business.model_dump())  # Pydantic v2
    return {"message": "Business created", "business": business}

@router.get("/")
def list_businesses():
    docs = db.collection("businesses").stream()
    return [doc.to_dict() for doc in docs]

@router.get("/{email}")
def get_business(email: str):
    doc = db.collection("businesses").document(email).get()
    if not doc.exists:
        return {"error": "Business not found"}
    return doc.to_dict()

@router.get("/search")
def search_business(address_query: str):
    results = []
    for doc in db.collection("businesses").stream():
        business = doc.to_dict()
        if address_query.lower() in business["address"].lower():
            results.append(business)
    return {"results": results}


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


@router.get("/nearby")
def businesses_nearby(address: str = Query(..., description="User's address to compute proximity"), limit: int = Query(20, ge=1, le=100)) -> List[Dict[str, Any]]:
    """
    Return businesses sorted by distance to the given address.
    Response items include name, email, address, and distance_km.
    """
    origin = _geocode_address(address)
    if not origin:
        return []

    results: List[Dict[str, Any]] = []
    for doc in db.collection("businesses").stream():
        business = doc.to_dict()
        addr = business.get("address")
        name = business.get("name")
        email = business.get("email")
        if not addr or not name or not email:
            continue
        coords = _geocode_address(addr)
        if not coords:
            continue
        dist_km = _haversine_km(origin["lat"], origin["lng"], coords["lat"], coords["lng"])
        results.append({
            "id": email,  # doc id is email in this schema
            "name": name,
            "email": email,
            "address": addr,
            "distance_km": round(dist_km, 2),
        })

    results.sort(key=lambda x: x["distance_km"])  # nearest first
    return results[:limit]
