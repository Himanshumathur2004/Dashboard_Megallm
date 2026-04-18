import requests
import json

r = requests.post('http://localhost:5000/api/blogs/generate', 
                  json={'account_id': 'account_4', 'topics': {'cost_optimization': 1}}, 
                  timeout=180)

print(f'Status: {r.status_code}')
data = r.json()
print(f"\nFull response:")
print(json.dumps(data, indent=2))

