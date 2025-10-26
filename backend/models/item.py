from pydantic import BaseModel

class Item(BaseModel):
    name: str
    description: str
    qr_code_id: str
    image_link: str
    owner_email: str  # current owner (business or tourist)
    retailer: str  # retailer associated with the item
    status: str = "available"  # "available" or "unavailable"
