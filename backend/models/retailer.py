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
