import requests
import json

url = "http://localhost:8000/api/auth/register"
data = {
    "email": "testscript@example.com",
    "password": "password123",
    "full_name": "Test Script",
    "phone": "1234567890",
    "date_of_birth": "2000-01-01",
    "gender": "male",
    "running_experience": "beginner"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

