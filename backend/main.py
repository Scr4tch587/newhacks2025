from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tourists, businesses, items

app = FastAPI(title="NewHacks2025 Backend")

# Include routers
app.include_router(tourists.router)
app.include_router(businesses.router)
app.include_router(items.router)

# Allow CORS for local frontend dev
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],  # for demo; restrict in production
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


