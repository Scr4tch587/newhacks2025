from fastapi import APIRouter
from models.item import Item

router = APIRouter(prefix="/items", tags=["Items"])

# In-memory DB
fake_items_db = {}

# These will be linked from main.py
fake_tourists_db = {}
fake_businesses_db = {}

@router.post("/")
def add_item(item: Item):
    """
    Add a new item (dropoff by tourist or business)
    """
    item.status = "available"
    fake_items_db[item.qr_code_id] = item
    return {"message": "Item added", "item": item}

@router.get("/")
def list_items():
    return list(fake_items_db.values())

@router.get("/{qr_code_id}")
def get_item(qr_code_id: str):
    item = fake_items_db.get(qr_code_id)
    if not item:
        return {"error": "Item not found"}
    return item

@router.post("/pickup/{qr_code_id}")
def pickup_item(qr_code_id: str, tourist_email: str):
    """
    Tourist picks up an item (spends points)
    """
    item = fake_items_db.get(qr_code_id)
    tourist = fake_tourists_db.get(tourist_email)

    if not item:
        return {"error": "Item not found"}
    if not tourist:
        return {"error": "Tourist not found"}
    if item.status != "available":
        return {"error": "Item is currently unavailable"}

    cost = 5
    if tourist.points < cost:
        return {"error": f"Not enough points. You need {cost} points to pick up this item."}

    tourist.points -= cost
    item.owner_email = tourist_email
    item.status = "unavailable"
    return {"message": f"{tourist.username} picked up {item.name} (-{cost} points)", "item": item, "tourist": tourist}

@router.post("/dropoff/{qr_code_id}")
def dropoff_item(qr_code_id: str, business_email: str):
    """
    Tourist drops off item at a business (gains points)
    """
    item = fake_items_db.get(qr_code_id)
    business = fake_businesses_db.get(business_email)

    if not item:
        return {"error": "Item not found"}
    if not business:
        return {"error": "Business not found"}

    reward = 10
    business.points += reward
    item.owner_email = business_email
    item.status = "available"
    return {"message": f"{item.name} dropped off at {business.name} (+{reward} points)", "item": item, "business": business}
