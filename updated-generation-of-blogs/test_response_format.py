import requests
import json
from blog_platform.config import Config

url = f'{Config.MEGALLM_BASE_URL}/chat/completions'
headers = {'Authorization': f'Bearer {Config.MEGALLM_API_KEY}', 'Content-Type': 'application/json'}

# Test WITH response_format: json
payload = {
    'model': 'google-gemma-4-26b',
    'messages': [{'role': 'user', 'content': 'Return JSON: {"test": "value"}'}],
    'response_format': {'type': 'json_object'},
    'max_tokens': 100,
    'temperature': 0
}
r = requests.post(url, headers=headers, json=payload, timeout=60)
print('With response_format:')
msg = r.json()['choices'][0]['message']
print('content:', msg.get('content')[:100] if msg.get('content') else 'NONE')
print('reasoning:', msg.get('reasoning')[:100] if msg.get('reasoning') else 'NONE')
