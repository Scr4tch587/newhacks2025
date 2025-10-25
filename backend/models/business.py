from pydantic import BaseModel, EmailStr

class Business(BaseModel):
    name: str
    email: EmailStr
    points: int = 0
