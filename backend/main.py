from fastapi import FastAPI
from routers import users, items

app = FastAPI(title="NewHacks2025 Backend")

app.include_router(users.router)
app.include_router(items.router)

@app.get("/")
def root():
    return {"message": "Hello from NewHacks2025 backend"}
