import asyncio
from app.services.storage import generate_presigned_upload_url
from app.core.config import get_settings

settings = get_settings()
print("Endpoint:", settings.r2_endpoint_url)

try:
    post_data = generate_presigned_upload_url("test/file.jpg", "image/jpeg")
    print("URL:", post_data["url"])
    print("Fields:", post_data["fields"])
except Exception as e:
    print("Error:", e)
