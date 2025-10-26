from fastapi import APIRouter, HTTPException, Header, Depends
from db.firestore_auth import auth
from db.firestore_client import db

router = APIRouter(prefix="/login", tags=["Login"])

# Dependency to verify Firebase ID token
def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        return uid
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.get("/profile")
def get_profile(uid: str = Depends(verify_token)):
    """Return the caller's role and profile.
    Preference: business > retailer > tourist when multiple exist.
    """
    # Business (by uid doc id)
    doc = db.collection("businesses").document(uid).get()
    if doc.exists:
        return {"role": "business", "profile": doc.to_dict()}

    # Retailer (by email)
    try:
        user_record = auth.get_user(uid)
        email = user_record.email if user_record else None
        if email:
            # Some older business docs may be keyed by email — prefer business role if found
            legacy_biz = db.collection("businesses").document(email).get()
            if legacy_biz.exists:
                return {"role": "business", "profile": legacy_biz.to_dict()}

            q = db.collection("retailers").where("email", "==", email).limit(1)
            results = list(q.stream())
            if results:
                return {"role": "retailer", "profile": results[0].to_dict()}
    except Exception:
        pass

    # Tourist (by uid)
    doc = db.collection("tourists").document(uid).get()
    if doc.exists:
        return {"role": "tourist", "profile": doc.to_dict()}

    raise HTTPException(status_code=404, detail="User not found")

