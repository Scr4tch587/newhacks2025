import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

load_dotenv()

key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not key_path or not os.path.isfile(key_path):
    raise FileNotFoundError("Service account key not found or not defined in .env")

cred = credentials.Certificate(key_path)

# Initialize Firebase Admin only once
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

print("Firebase Auth client initialized successfully")
