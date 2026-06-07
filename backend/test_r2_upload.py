import requests
from app.services.storage import generate_presigned_upload_url

post_data = generate_presigned_upload_url("test/file.jpg", "image/jpeg")
url = post_data["url"]
fields = post_data["fields"]

files = {'file': ('test.jpg', b'dummy content', 'image/jpeg')}

print("Posting to:", url)
response = requests.post(url, data=fields, files=files)

print("Status Code:", response.status_code)
print("Response Body:", response.text)
