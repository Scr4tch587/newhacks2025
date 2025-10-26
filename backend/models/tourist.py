from pydantic import BaseModel, EmailStr


class TouristCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class Tourist(BaseModel):
    username: str
    email: EmailStr
    points: int = 10  # starting points

