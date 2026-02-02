import requests

print("Testing feed-plans endpoint...")
try:
    response = requests.get("http://192.168.1.124:8000/api/v1/livestock/feed-plans")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("\nSUCCESS! The endpoint is now working correctly.")
    else:
        print(f"\nERROR: Got status code {response.status_code}")
        print(f"Response text: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")
