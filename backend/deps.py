from typing import Optional, Dict
from fastapi import Header, HTTPException
from db.firestore_auth import auth


def verify_firebase_token(authorization: Optional[str] = Header(None)) -> Dict:
    """FastAPI dependency to verify Firebase ID token from Authorization header.

    Expects header: Authorization: Bearer <idToken>
    Returns decoded token dict on success, raises HTTPException(401) on failure.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    id_token = parts[1]
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        # Keep error message generic in production; include for debugging here
        raise HTTPException(status_code=401, detail=f"Invalid or expired ID token: {e}")
