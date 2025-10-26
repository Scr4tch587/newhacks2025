# main.py

import os
from dotenv import load_dotenv

# 1️⃣ Load the .env file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# 2️⃣ Configure Cloudinary
import cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tourists, businesses, items, retailers


app = FastAPI(title="NewHacks2025 Backend")

# Include routers
app.include_router(tourists.router)
app.include_router(businesses.router)
app.include_router(items.router)
app.include_router(retailers.router)

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



@app.get("/")
def root():
    return {"message": "Welcome to the NewHacks2025 Backend!"}

