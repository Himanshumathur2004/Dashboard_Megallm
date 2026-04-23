#!/usr/bin/env python3
"""Test Medium blog generation with simplified content."""

import requests
import json
import time

# The Medium account ID from config.py
MEDIUM_ACCOUNT_ID = "account_5"
API_URL = "http://localhost:5000/api/blogs/generate"

def test_medium_blog_generation():
    """Generate a test Medium blog."""
    print("Testing Medium blog generation...")
    print(f"Endpoint: {API_URL}")
    print(f"Account ID: {MEDIUM_ACCOUNT_ID}")
    
    # Request payload
    payload = {
        "account_id": MEDIUM_ACCOUNT_ID,
        "topics": {
            "ai_trends": 1  # Generate 1 blog for AI trends topic
        }
    }
    
    print(f"\nRequest payload: {json.dumps(payload, indent=2)}")
    
    try:
        print("\nSending request...")
        response = requests.post(API_URL, json=payload, timeout=60)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ SUCCESS!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            # Check if blogs were generated
            if "generated_blogs" in result:
                blogs = result["generated_blogs"]
                print(f"\n✓ Generated {len(blogs)} blog(s)")
                
                for i, blog in enumerate(blogs):
                    print(f"\n--- Blog {i+1} ---")
                    print(f"Title: {blog.get('title', 'N/A')}")
                    body = blog.get('body', '')
                    word_count = len(body.split())
                    print(f"Word Count: {word_count}")
                    print(f"Body Preview (first 300 chars):\n{body[:300]}...")
                    
        else:
            print(f"\n✗ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("✗ Request timed out (60s)")
    except requests.exceptions.ConnectionError:
        print("✗ Connection failed - is the server running?")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_medium_blog_generation()
