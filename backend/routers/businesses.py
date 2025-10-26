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
from routers.login import verify_token


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
def list_business_transactions(
    identifier: str = Query(..., description="Business identifier (doc id, uid or email)"),
    uid: str = Depends(verify_token),
):
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

        # Determine current user's display name (fallback to email)
        try:
            user_record = auth.get_user(uid)
            current_name = (user_record.display_name or user_record.email or "").strip()
        except Exception:
            current_name = ""

        for d in docs:
            item = d.to_dict() or {}
            item["id"] = d.id
            # Include only transactions where the 'name' equals the current user's name
            tx_name = str(item.get("name") or "").strip()
            if current_name and tx_name == current_name:
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
        # Save Business class-shaped document to Firestore under the user's UID
        # Conform to models.business.Business: name, email, points, address
        business_doc = {
            "name": business.business_name,
            "email": business.email,
            "points": 0,
            "address": business.address,
            # extra bookkeeping fields
            "uid": user_record.uid,
            "role": "business",
        }
        db.collection("businesses").document(user_record.uid).set(business_doc)
        return {"message": "Business account created", "uid": user_record.uid}
    except Exception as e:
        # Log to server console for debugging and return clear reason to client
        print("Error creating business:", e)
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
def add_business_transaction(payload: Dict[str, Any], identifier: str = Query(..., description="Business identifier (doc id, uid or email)")):
    """Create a new business transaction record under the business document.

    Accepts a flexible payload from the client (e.g., { transaction_type, date, time, item_id }),
    then normalizes and persists a BusinessTransaction (name, item_name, qr_code_id, date, time, transaction_type).
    """
    # Ensure business exists (resolve tolerant identifier)
    doc_ref = _resolve_business_doc_ref(identifier)
    if not doc_ref:
        raise HTTPException(status_code=404, detail="Business not found")

        # Persist the transaction under a subcollection 'transactions'
    try:
        coll = doc_ref.collection("transactions")
        tx_ref = coll.document()  # auto-generated id

        # Resolve business name
        try:
            biz_doc = doc_ref.get()
            biz = biz_doc.to_dict() if biz_doc and biz_doc.exists else {}
            business_name = (biz.get("name") or biz.get("business_name") or biz.get("email") or "").strip()
        except Exception:
            business_name = ""

        # Normalize incoming payload
        qr_id = payload.get("qr_code_id") or payload.get("item_id") or payload.get("id") or ""
        # Try to get item name from items collection
        item_name = str(payload.get("item_name") or "").strip()
        try:
            if qr_id and not item_name:
                i_doc = db.collection("items").document(qr_id).get()
                if i_doc.exists:
                    item_name = (i_doc.to_dict() or {}).get("name") or item_name
        except Exception:
            pass

        tx_type_raw = payload.get("transaction_type") or "Pickup"
        tx_type_clean = str(tx_type_raw).strip().lower()
        if tx_type_clean not in ("pickup", "dropoff"):
            raise HTTPException(status_code=400, detail="transaction_type must be 'Pickup' or 'Dropoff'")

        # Construct a BusinessTransaction object to ensure schema
        tx_obj = BusinessTransaction(
            name=business_name or "",
            item_name=item_name or "",
            qr_code_id=str(qr_id or ""),
            date=str(payload.get("date") or ""),
            time=str(payload.get("time") or ""),
            transaction_type=tx_type_clean.title(),
        )

        data = tx_obj.model_dump()

        # If date and time are provided, try to build an ISO scheduled_time
        date_str = data.get("date")
        time_str = data.get("time")
        if date_str and time_str:
            try:
                combined = f"{date_str} {time_str}"
                try:
                    dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                except Exception:
                    dt = datetime.strptime(combined, "%Y-%m-%d %H:%M")
                data["scheduled_time"] = dt.isoformat()
            except Exception:
                data["scheduled_time"] = None

        data["created_at"] = datetime.utcnow().isoformat() + "Z"
        tx_ref.set(data)
        return {"message": "Transaction created", "id": tx_ref.id, "transaction": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/transactions/{transaction_id}")
def delete_business_transaction(
    transaction_id: str,
    identifier: str = Query(..., description="Business identifier (doc id, uid or email)"),
    uid: str = Depends(verify_token),
):
    """Delete a business transaction by id under the resolved business document.

    Requires a verified Firebase ID token.
    """
    doc_ref = _resolve_business_doc_ref(identifier)
    if not doc_ref:
        raise HTTPException(status_code=404, detail="Business not found")

    try:
        tx_ref = doc_ref.collection("transactions").document(transaction_id)
        if not tx_ref.get().exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        tx_ref.delete()
        return {"message": "Transaction deleted", "id": transaction_id}
    except HTTPException:
        raise
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
    
@router.get("/items/{email}")
def get_held_items(email: str):
    """
    Get all items currently owned by a business.
    """
    try:
        # Query Firestore for items with matching owner_email
        docs = db.collection("items").where("owner_email", "==", email).stream()
        results = [doc.to_dict() for doc in docs]

        if not results:
            raise HTTPException(status_code=404, detail="No items found for this business")

        return {"business_email": email, "items": results}

    except Exception as e:
        print("Error retrieving items:", e)
        raise HTTPException(status_code=500, detail=str(e))
