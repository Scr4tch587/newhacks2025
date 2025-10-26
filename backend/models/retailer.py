from pydantic import BaseModel, EmailStr

class Retailer(BaseModel):
    name: str
    email: EmailStr
    points: int = 0
    address: str

class RetailerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    address: str

class RetailProfile(BaseModel):
    retailer_email: str
    item_name: str
    description: str
    address: str
    image_url: str