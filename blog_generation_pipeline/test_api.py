"""Test script to verify Chutes AI API key works with google-gemma-4-26b model."""

import os
import sys
import requests
from dotenv import load_dotenv
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load .env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Chutes AI API
CHUTES_API_TOKEN = "cpk_6875eccdc50d4419b5fa5ce18ed2b0a3.5cb40fdd47a353d7bbf18cc4cd54e682.TYU5n5aAuP7fOuSeJrRnm4jvn7qSABd4"
BASE_URL = "https://llm.chutes.ai/v1"
MODEL = "moonshotai/Kimi-K2.5-TEE"

print("=" * 60)
print("CHUTES AI API TEST")
print("=" * 60)
print(f"Base URL: {BASE_URL}")
print(f"Model: {MODEL}")
print(f"API Token: {CHUTES_API_TOKEN[:20]}...{CHUTES_API_TOKEN[-10:]}")
print("=" * 60)

def test_api():
    """Test the API with a simple chat completion request."""

    headers = {
        "Authorization": f"Bearer {CHUTES_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Simple test request
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": "Say 'Hello, API test successful!' in exactly those words."}
        ],
        "max_tokens": 50,
        "temperature": 0.1
    }

    print(f"\nSending test request to: {BASE_URL}/chat/completions")
    print(f"Model: {MODEL}")
    print("-" * 60)

    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("\n[SUCCESS] API Key is working.")
            print(f"\nResponse:")
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0].get("message", {}).get("content", "")
                print(f"  Content: {content}")
            else:
                print(f"  Full response: {data}")
            return True
        else:
            print(f"\n[FAILED] Status: {response.status_code}")
            print(f"Response Body: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("\n[FAILED] Request timed out after 60 seconds.")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"\n[FAILED] Connection error: {e}")
        return False
    except Exception as e:
        print(f"\n[FAILED] Error: {type(e).__name__}: {e}")
        return False

def test_models_endpoint():
    """Test the /models endpoint to see available models."""
    headers = {
        "Authorization": f"Bearer {CHUTES_API_TOKEN}",
        "Content-Type": "application/json"
    }

    print("\n" + "=" * 60)
    print("TESTING /models ENDPOINT")
    print("=" * 60)

    try:
        response = requests.get(
            f"{BASE_URL}/models",
            headers=headers,
            timeout=30
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("\n[SUCCESS] Models endpoint accessible.")
            if "data" in data:
                models = [m.get("id", m) for m in data["data"]]
                print(f"\nAvailable models ({len(models)}):")
                for m in models[:50]:  # Show first 50
                    print(f"  - {m}")
                if len(models) > 50:
                    print(f"  ... and {len(models) - 50} more")

                # Check if google-gemma models are available
                gemma_models = [m for m in models if 'gemma' in m.lower()]
                if gemma_models:
                    print(f"\nGemma models found:")
                    for m in gemma_models:
                        print(f"  [OK] {m}")
                else:
                    print("\n[WARN] No Gemma models found in the list")
            else:
                print(f"Response: {data}")
            return True
        else:
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"Error: {e}")
        return False

def test_with_streaming():
    """Test with streaming enabled (like the curl example)."""
    import json

    headers = {
        "Authorization": f"Bearer {CHUTES_API_TOKEN}",
        "Content-Type": "application/json"
    }

    print("\n" + "=" * 60)
    print("TESTING STREAMING REQUEST")
    print("=" * 60)

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": "Tell me a short 50 word story."}
        ],
        "stream": True,
        "max_tokens": 200,
        "temperature": 0.7
    }

    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
            stream=True
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            print("\n[SUCCESS] Streaming works! Content:")
            print("-" * 40)
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            break
                        try:
                            chunk = json.loads(data)
                            if "choices" in chunk and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    print(content, end='', flush=True)
                        except json.JSONDecodeError:
                            pass
            print("\n" + "-" * 40)
            return True
        else:
            print(f"\n[FAILED] Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Test chat completion
    success = test_api()

    # Test models endpoint
    test_models_endpoint()

    # Test streaming
    if success:
        test_with_streaming()

    print("\n" + "=" * 60)
    if success:
        print("RESULT: [SUCCESS] Chutes AI API Key is VALID and working!")
    else:
        print("RESULT: [FAILED] API Key test FAILED. Check credentials.")
    print("=" * 60)