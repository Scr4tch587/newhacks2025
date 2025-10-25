from fastapi import FastAPI
from routers import users

app = FastAPI(title="NewHacks2025 Backend")

# include routers
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "Hello from backend team"}
