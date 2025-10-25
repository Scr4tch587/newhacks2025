from fastapi import FastAPI
from routers import tourists, businesses, items

app = FastAPI(title="NewHacks2025 Backend")

# Include routers
app.include_router(tourists.router)
app.include_router(businesses.router)
app.include_router(items.router)


