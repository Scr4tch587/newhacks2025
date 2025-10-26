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
    # Check if tourist
    doc = db.collection("tourists").document(uid).get()
    if doc.exists:
        return {"role": "tourist", "profile": doc.to_dict()}

    # Check if business
    doc = db.collection("businesses").document(uid).get()
    if doc.exists:
        return {"role": "business", "profile": doc.to_dict()}

    raise HTTPException(status_code=404, detail="User not found")

