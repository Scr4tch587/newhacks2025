from fastapi import APIRouter
from models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

# In-memory storage
fake_users_db = {}

@router.post("/")
def create_user(user: User):
    fake_users_db[user.email] = user
    return {"message": "User created", "user": user}

@router.get("/{email}")
def get_user(email: str):
    user = fake_users_db.get(email)
    if not user:
        return {"error": "User not found"}
    return user
