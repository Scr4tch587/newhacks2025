from fastapi import APIRouter
from models.item import Item
from db.firestore_client import db

router = APIRouter(prefix="/items", tags=["Items"])

@router.post("/")
def create_item(item: Item):
    doc_ref = db.collection("items").document(item.qr_code_id)
    doc_ref.set(item.model_dump())  # Pydantic v2
    return {"message": "Item created", "item": item}

@router.get("/")
def list_items():
    return [doc.to_dict() for doc in db.collection("items").stream()]

@router.get("/{qr_code_id}")
def get_item(qr_code_id: str):
    doc = db.collection("items").document(qr_code_id).get()
    if not doc.exists:
        return {"error": "Item not found"}
    return doc.to_dict()

# --- Pickup/Dropoff endpoints ---

@router.post("/pickup/{qr_code_id}/{tourist_email}")
def pickup_item(qr_code_id: str, tourist_email: str):
    tourist_doc = db.collection("tourists").document(tourist_email).get()
    if not tourist_doc.exists:
        return {"error": "Tourist not found"}
    tourist = tourist_doc.to_dict()

    item_doc = db.collection("items").document(qr_code_id).get()
    if not item_doc.exists:
        return {"error": "Item not found"}
    item = item_doc.to_dict()

    cost = 5
    if tourist["points"] < cost:
        return {"error": "Not enough points to pick up item"}

    db.collection("tourists").document(tourist_email).update({"points": tourist["points"] - cost})
    db.collection("items").document(qr_code_id).update({"status": "unavailable", "owner_email": tourist_email})

    return {"message": f"{tourist_email} picked up {qr_code_id}", "remaining_points": tourist["points"] - cost}

@router.post("/dropoff/{qr_code_id}/{business_email}")
def dropoff_item(qr_code_id: str, business_email: str):
    business_doc = db.collection("businesses").document(business_email).get()
    if not business_doc.exists:
        return {"error": "Business not found"}
    business = business_doc.to_dict()

    item_doc = db.collection("items").document(qr_code_id).get()
    if not item_doc.exists:
        return {"error": "Item not found"}
    item = item_doc.to_dict()

    owner_email = item.get("owner_email")
    if owner_email:
        owner_doc = db.collection("tourists").document(owner_email).get()
        if owner_doc.exists:
            points_awarded = 10
            new_points = owner_doc.to_dict()["points"] + points_awarded
            db.collection("tourists").document(owner_email).update({"points": new_points})

    db.collection("items").document(qr_code_id).update({"status": "available", "owner_email": business_email})

    return {"message": f"{qr_code_id} dropped off at {business_email}"}
