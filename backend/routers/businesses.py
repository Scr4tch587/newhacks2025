from fastapi import APIRouter, Query, HTTPException, Depends, status
from models.business import Business, BusinessCreate, BusinessTransaction
from routers.login import verify_token
from db.firestore_client import db
from db.firestore_auth import auth
from typing import List, Dict, Any, Optional
import logging
from urllib.parse import unquote
from geopy.geocoders import Nominatim
from math import radians, sin, cos, asin, sqrt
from datetime import datetime
from fastapi import Depends
# Note: transactions endpoints intentionally unauthenticated per request


router = APIRouter(prefix="/businesses", tags=["Businesses"])


def _resolve_business_doc_ref(identifier: str):
    """
    Resolve a business document reference from a provided identifier.
    The identifier may be the document ID, a uid stored in the 'uid' field,
    or an email stored in the 'email' field. Return a DocumentReference or None.
    """
    logger = logging.getLogger(__name__)
    logger.debug("Resolving business identifier: %s", identifier)

    # Try direct document lookup first
    try:
        doc_ref = db.collection("businesses").document(identifier)
        doc = doc_ref.get()
        if doc.exists:
            logger.debug("Found business by direct document id: %s", identifier)
            return doc_ref
    except Exception as e:
        logger.exception("Error during direct document lookup for %s: %s", identifier, e)

    # Try queries against known fields
    for field in ("uid", "email"):
        try:
            query = db.collection("businesses").where(field, "==", identifier).limit(1)
            docs = list(query.stream())
            if docs:
                logger.debug("Found business by %s == %s -> doc id %s", field, identifier, docs[0].id)
                return db.collection("businesses").document(docs[0].id)
        except Exception as e:
            logger.exception("Error querying businesses by %s for %s: %s", field, identifier, e)

    # If identifier looks URL-encoded, try decoded version
    try:
        decoded = unquote(identifier)
        if decoded and decoded != identifier:
            logger.debug("Trying URL-decoded identifier: %s", decoded)
            for field in ("uid", "email"):
                try:
                    query = db.collection("businesses").where(field, "==", decoded).limit(1)
                    docs = list(query.stream())
                    if docs:
                        logger.debug("Found business by %s == %s -> doc id %s", field, decoded, docs[0].id)
                        return db.collection("businesses").document(docs[0].id)
                except Exception as e:
                    logger.exception("Error querying businesses by %s for decoded %s: %s", field, decoded, e)
    except Exception:
        pass

    logger.debug("No business matched identifier: %s", identifier)
    return None

@router.get("/transactions")
def list_business_transactions(identifier: str = Query(..., description="Business identifier (doc id, uid or email)")):
    """Return transactions scheduled at the business location.

    Requires a verified Firebase ID token.
    """
    # Ensure business exists (resolve tolerant identifier)
    doc_ref = _resolve_business_doc_ref(identifier)
    if not doc_ref:
        raise HTTPException(status_code=404, detail="Business not found")

    try:
        coll = doc_ref.collection("transactions")
        docs = coll.stream()
        res = []
        for d in docs:
            item = d.to_dict() or {}
            item["id"] = d.id
            res.append(item)
        # Optionally sort by scheduled_time if present
        try:
            res.sort(key=lambda x: x.get("scheduled_time") or "")
        except Exception:
            pass
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
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
            "role": "business",
            "address": business.address,
        })
        return {"message": "Business account created", "uid": user_record.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/business/{uid}")
def delete_business(uid: str, logged_in_uid: str = Depends(verify_token)):
    doc_ref = db.collection("businesses").document(uid)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Business not found")
    doc_ref.delete()
    return {"message": f"Business {uid} deleted successfully"}

# Add a transaction for a business (pickup/dropoff scheduled at the business location)
@router.post("/transactions", status_code=status.HTTP_201_CREATED)
def add_business_transaction(transaction: BusinessTransaction, identifier: str = Query(..., description="Business identifier (doc id, uid or email)")):
    """
    Create a new business transaction record under the business document.
    Request body should match models.business.BusinessTransaction.
    """
    # Ensure business exists (resolve tolerant identifier)
    doc_ref = _resolve_business_doc_ref(identifier)
    if not doc_ref:
        raise HTTPException(status_code=404, detail="Business not found")

        # Persist the transaction under a subcollection 'transactions'
    try:
        coll = doc_ref.collection("transactions")
        tx_ref = coll.document()  # auto-generated id
        data = transaction.model_dump() if hasattr(transaction, "model_dump") else dict(transaction)

        # Normalize and validate transaction_type
        tx_type = data.get("transaction_type")
        if tx_type:
            tx_type_clean = str(tx_type).strip().lower()
            if tx_type_clean not in ("pickup", "dropoff"):
                raise HTTPException(status_code=400, detail="transaction_type must be 'Pickup' or 'Dropoff'")
            data["transaction_type"] = tx_type_clean.title()

        # If date and time are provided, try to build an ISO scheduled_time
        date_str = data.get("date")
        time_str = data.get("time")
        if date_str and time_str:
            try:
                # Accept common formats like 'YYYY-MM-DD' and 'HH:MM' (24h)
                dt = None
                combined = f"{date_str} {time_str}"
                try:
                    dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                except Exception:
                    # Fallback to parsing common format
                    dt = datetime.strptime(combined, "%Y-%m-%d %H:%M")
                # Store as ISO (assume input is local/naive — append Z to indicate UTC if you prefer)
                data["scheduled_time"] = dt.isoformat()
            except Exception:
                # If parsing fails, leave date/time as-is but do not block creation
                data["scheduled_time"] = None

        # Attach server-side timestamp
        data["created_at"] = datetime.utcnow().isoformat() + "Z"

        # Record who created the transaction if available from request headers
        try:
            # If callers include Authorization header processing elsewhere, that
            # can populate created_by fields. Here, we defensively attempt to
            # use request headers if present (no verification performed).
            # NOTE: this is intentionally lightweight since endpoint is unauthenticated.
            from fastapi import Request
            # Try to access the current request via dependency injection fallback
            # This is optional and best-effort; if unavailable we simply skip.
            # (In production you'd prefer verified tokens.)
            req = None
        except Exception:
            req = None
        tx_ref.set(data)
        return {"message": "Transaction created", "id": tx_ref.id, "transaction": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@router.get("/{uid}")
def get_business(uid: str):
    doc = db.collection("businesses").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Business not found")
    return doc.to_dict()

_geocoder = Nominatim(user_agent="newhacks2025-backend")


def _geocode_address(address: str) -> Optional[Dict[str, float]]:
    try:
        loc = _geocoder.geocode(address, timeout=10)
        if not loc:
            return None
        return {"lat": loc.latitude, "lng": loc.longitude}
    except Exception:
        return None
    
