from pydantic import BaseModel

class Item(BaseModel):
    name: str
    description: str
    qr_code_id: str
    owner_email: str  # current owner (business or tourist)
    status: str = "available"  # "available" or "unavailable"
