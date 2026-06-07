import requests
from app.services.storage import generate_presigned_upload_url

post_data = generate_presigned_upload_url("test/file.jpg", "image/jpeg")
url = post_data["url"]

print("URL:", url)

headers = {
    "Origin": "http://localhost:3000",
    "Access-Control-Request-Method": "PUT",
    "Access-Control-Request-Headers": "content-type"
}

resp = requests.options(url, headers=headers)
print("OPTIONS Status Code:", resp.status_code)
print("OPTIONS Headers:", resp.headers)
print("OPTIONS Body:", resp.text)
