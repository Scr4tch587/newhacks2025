from dotenv import load_dotenv
import os
from google.cloud import firestore

# Load .env in current folder
load_dotenv()

# Get the key path
key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not key_path:
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS not found in .env!")

# Optional: check if the file exists
if not os.path.isfile(key_path):
    raise FileNotFoundError(f"Service account key not found at {key_path}")

# Set environment variable for Firestore
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path

# Initialize Firestore
db = firestore.Client()
print("Firestore client initialized successfully")
