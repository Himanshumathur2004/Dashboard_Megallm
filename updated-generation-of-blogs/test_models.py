"""Test multiple Chutes AI models to find which ones work."""

import os
import sys
import requests
import json

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

CHUTES_API_TOKEN = "cpk_6875eccdc50d4419b5fa5ce18ed2b0a3.5cb40fdd47a353d7bbf18cc4cd54e682.TYU5n5aAuP7fOuSeJrRnm4jvn7qSABd4"
BASE_URL = "https://llm.chutes.ai/v1"

# Models to test
MODELS_TO_TEST = [
    "unsloth/gemma-3-27b-it",
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "Qwen/Qwen3-Next-80B-A3B-Instruct",
    "deepseek-ai/DeepSeek-V3.1-TEE",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    "unsloth/Mistral-Nemo-Instruct-2407",
    "unsloth/Llama-3.2-3B-Instruct",
    "Qwen/Qwen3-30B-A3B",
    "NousResearch/Hermes-4-14B",
]

print("=" * 70)
print("TESTING MULTIPLE MODELS ON CHUTES AI")
print("=" * 70)
print(f"API Token: {CHUTES_API_TOKEN[:20]}...{CHUTES_API_TOKEN[-10:]}")
print("=" * 70)

def test_model(model_name):
    """Test a single model with a simple request."""
    headers = {
        "Authorization": f"Bearer {CHUTES_API_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": "Write a one-sentence blog title about AI cost optimization."}
        ],
        "max_tokens": 100,
        "temperature": 0.7
    }

    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return "OK", content[:80] + "..." if len(content) > 80 else content
        elif response.status_code == 402:
            return "TIER", "Requires higher subscription tier"
        elif response.status_code == 404:
            return "NOT FOUND", "Model not available"
        else:
            return f"ERROR {response.status_code}", response.text[:50]
    except Exception as e:
        return "EXCEPTION", str(e)[:50]

print(f"\n{'Model':<45} {'Status':<12} {'Response'}")
print("-" * 70)

working_models = []
failed_models = []

for model in MODELS_TO_TEST:
    status, response = test_model(model)
    status_icon = "[OK]" if status == "OK" else "[FAIL]"
    print(f"{status_icon} {model:<42} {status:<12} {response}")

    if status == "OK":
        working_models.append(model)
    else:
        failed_models.append((model, status, response))

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"\nWorking models ({len(working_models)}):")
for m in working_models:
    print(f"  [OK] {m}")

if failed_models:
    print(f"\nFailed models ({len(failed_models)}):")
    for m, s, r in failed_models:
        print(f"  [FAIL] {m} - {s}")

print("\n" + "=" * 70)
print("RECOMMENDED FOR BLOG GENERATION:")
print("=" * 70)
if working_models:
    # Prefer larger models for content generation
    preferred = ["Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen3-Next-80B-A3B-Instruct",
                 "deepseek-ai/DeepSeek-V3.1-TEE", "unsloth/gemma-3-27b-it"]
    for p in preferred:
        if p in working_models:
            print(f"Best choice: {p}")
            break
    else:
        print(f"Best available: {working_models[0]}")