from pydantic import BaseModel, EmailStr

class Tourist(BaseModel):
    username: str
    email: EmailStr
    points: int = 10  # starting points
