from fastapi import APIRouter
from models.business import Business
from db.firestore_client import db

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
