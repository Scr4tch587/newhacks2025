from fastapi import APIRouter
from models.tourist import Tourist
from db.firestore_client import db

router = APIRouter(prefix="/tourists", tags=["Tourists"])



@router.post("/")
def create_tourist(tourist: Tourist):
    doc_ref = db.collection("tourists").document(tourist.email)
    doc_ref.set(tourist.model_dump()) 
    return {"message": "Tourist created", "tourist": tourist}

@router.get("/")
def list_tourists():
    docs = db.collection("tourists").stream()
    return [doc.to_dict() for doc in docs]

@router.get("/{email}")
def get_tourist(email: str):
    doc = db.collection("tourists").document(email).get()
    if not doc.exists:
        return {"error": "Tourist not found"}
    return doc.to_dict()
