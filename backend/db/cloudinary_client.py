import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Configure Cloudinary
# Configure Cloudinary (values may be None if .env not set)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

def _ensure_configured():
    if not cloudinary.config().cloud_name or not cloudinary.config().api_key or not cloudinary.config().api_secret:
        raise RuntimeError("Missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment or .env file.")

def upload_file(file_content: bytes, public_id: str, folder: str = "items"):
    """Upload a file's bytes to Cloudinary under the given folder and public_id.
    Returns Cloudinary's response dict. Raises RuntimeError with a clear message on misconfiguration.
    """
    _ensure_configured()
    # Do not embed folder in public_id; pass folder separately to avoid double paths
    return cloudinary.uploader.upload(
        file_content,
        public_id=public_id,
        folder=folder,
        resource_type="image",
    )