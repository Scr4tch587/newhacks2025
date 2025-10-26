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