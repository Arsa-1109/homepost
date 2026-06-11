import asyncio
import httpx
from app.services.storage import generate_presigned_upload_url

async def main():
    print("Generating presigned POST url...")
    post_data = generate_presigned_upload_url("test_uploads/test_file.txt", "text/plain")
    
    url = post_data["url"]
    fields = post_data["fields"]
    
    print("Uploading file to R2...")
    # Add the file to the fields
    files = {"file": ("test_file.txt", b"Hello, R2!", "text/plain")}
    
    # We must use httpx or requests to perform the POST
    # We send `fields` as data, and `files` as files
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=fields, files=files)
        
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
if __name__ == "__main__":
    asyncio.run(main())
