from fastapi import APIRouter
from models.business import Business

router = APIRouter(prefix="/businesses", tags=["Businesses"])

# In-memory DB
fake_businesses_db = {}

@router.post("/")
def create_business(business: Business):
    fake_businesses_db[business.email] = business
    return {"message": "Business created", "business": business}

@router.get("/")
def list_businesses():
    return list(fake_businesses_db.values())

@router.get("/{email}")
def get_business(email: str):
    business = fake_businesses_db.get(email)
    if not business:
        return {"error": "Business not found"}
    return business
