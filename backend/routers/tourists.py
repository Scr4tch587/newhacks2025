from fastapi import APIRouter
from models.tourist import Tourist

router = APIRouter(prefix="/tourists", tags=["Tourists"])

# In-memory DB
fake_tourists_db = {}

@router.post("/")
def create_tourist(tourist: Tourist):
    fake_tourists_db[tourist.email] = tourist
    return {"message": "Tourist created", "tourist": tourist}

@router.get("/")
def list_tourists():
    return list(fake_tourists_db.values())

@router.get("/{email}")
def get_tourist(email: str):
    tourist = fake_tourists_db.get(email)
    if not tourist:
        return {"error": "Tourist not found"}
    return tourist
