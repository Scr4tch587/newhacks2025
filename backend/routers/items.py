from fastapi import APIRouter
from models.item import Item

router = APIRouter(prefix="/items", tags=["Items"])

fake_items_db = {}

@router.post("/")
def add_item(item: Item):
    fake_items_db[item.qr_code_id] = item
    return {"message": "Item added", "item": item}

@router.get("/")
def list_items():
    return list(fake_items_db.values())
