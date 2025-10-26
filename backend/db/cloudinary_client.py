import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_file(file_content, public_id):
    """Uploads a file to Cloudinary"""
    return cloudinary.uploader.upload(
        file_content,
        public_id=public_id,
        folder="items"  # optional folder in Cloudinary
    )