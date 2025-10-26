from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tourists, businesses, items

app = FastAPI(title="NewHacks2025 Backend")

# Include routers
app.include_router(tourists.router)
app.include_router(businesses.router)
app.include_router(items.router)

origins = [
    "http://localhost:5173",  # your frontend origin
]

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # must be the exact frontend origin
    allow_credentials=True,     # required if your requests use cookies/auth
    allow_methods=["*"],        # allow all HTTP methods
    allow_headers=["*"],        # allow all headers
)


