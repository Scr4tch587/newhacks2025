from fastapi import APIRouter, HTTPException, Depends
from models.tourist import Tourist, TouristCreate
from db.firestore_client import db
from db.firestore_auth import auth


router = APIRouter(prefix="/tourists", tags=["Tourists"])




# Create a tourist
@router.post("/")
def create_tourist(tourist: Tourist):
    doc_ref = db.collection("tourists").document(tourist.email)  # UID = email
    doc_ref.set(tourist.model_dump())
    return {"message": "Tourist created", "tourist": tourist}

# List all tourists
@router.get("/")
def list_tourists():
    docs = db.collection("tourists").stream()
    return [doc.to_dict() for doc in docs]

# Get by UID (document ID)
@router.get("/uid/{uid}")
def get_tourist_by_uid(uid: str):
    doc = db.collection("tourists").document(uid).get()
    if not doc.exists:
        return {"error": "Tourist not found"}
    return doc.to_dict()

# Get by email (query)
@router.get("/email/{email}")
def get_tourist_by_email(email: str):
    docs = db.collection("tourists").where("email", "==", email).stream()
    results = [doc.to_dict() for doc in docs]
    if not results:
        return {"error": "Tourist not found"}
    return results[0]

@router.post("/register")
def register_tourist(tourist: TouristCreate):
    try:
        user_record = auth.create_user(
            email=tourist.email,
            password=tourist.password,
            display_name=tourist.name
        )
        # Save additional info to Firestore
        db.collection("tourists").document(user_record.uid).set({
            "email": tourist.email,
            "name": tourist.name,
            "uid": user_record.uid,
            "role": "tourist"
        })
        return {"message": "Tourist account created", "uid": user_record.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{uid}")
def get_tourist(uid: str):
    doc = db.collection("tourists").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Tourist not found")
    return doc.to_dict()

