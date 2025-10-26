from pydantic import BaseModel, EmailStr

class Business(BaseModel):
    name: str
    email: EmailStr
    points: int = 0
    address: str

class BusinessCreate(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    address: str

class BusinessTransaction(BaseModel):
    name: str
    item_name: str
    qr_code_id: str
    date: str
    time: str
    transaction_type: str # "Pickup" or "Dropoff"