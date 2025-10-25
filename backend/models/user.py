from pydantic import BaseModel, EmailStr

class User(BaseModel):
    username: str
    email: EmailStr
    role: str  # "tourist" or "business"
    points: int = 0
