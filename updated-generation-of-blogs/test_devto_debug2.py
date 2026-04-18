#!/usr/bin/env python3
"""
Direct test of dev.to generation with detailed debugging
"""
import sys
sys.path.insert(0, 'blog_platform')

from blog_generator import BlogGenerator
from config import Config
import logging

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG)

# Initialize generator
gen = BlogGenerator(
    model=Config.MODEL,
    base_url=Config.MEGALLM_BASE_URL,
    api_key=Config.MEGALLM_API_KEY,
    fallback_providers=Config.FALLBACK_PROVIDERS
)

# Test dev.to generation with a sample article
article_title = "How AI is Changing Web Development"
article_content = """
Web development is undergoing a massive shift with AI integration. 
Machine learning models can now predict user behavior and optimize site performance.
AI-powered code generation tools like GitHub Copilot are helping developers write code faster.
However, there are concerns about code quality and security when relying on AI-generated snippets.
The future of web development will likely involve a hybrid approach with AI assistance and human oversight.
"""
article_source = "dev.to"

print("=" * 80)
print("Testing dev.to article generation with detailed debugging")
print("=" * 80)
print(f"Title: {article_title}")
print(f"Content length: {len(article_content)} chars")
print()

# Monkey-patch the method to capture raw response
original_make_chat = gen._make_chat_completion_with_fallback

def debug_make_chat(payload, timeout=60):
    result = original_make_chat(payload, timeout)
    if result:
        print("\n[DEBUG] Raw API Response:")
        print(f"  Status Code: {result.get('status_code', 'N/A')}")
        if 'choices' in result:
            choice = result['choices'][0]
            print(f"  Message: {choice.get('message', {})}")
            content = choice.get('message', {}).get('content', '')
            print(f"  Content length: {len(content)}")
            print(f"  Content preview: {content[:200]}")
    return result

gen._make_chat_completion_with_fallback = debug_make_chat

try:
    result = gen._generate_devto_article_from_source(
        article_title=article_title,
        article_content=article_content,
        article_source=article_source
    )
    
    if result:
        print("\n✅ GENERATION SUCCESSFUL")
        print(f"\nGenerated Title: {result.get('title')}")
        print(f"Generated Body Length: {len(result.get('body', ''))} chars")
        print(f"Tags: {result.get('tags')}")
        body = result.get('body', '')
        print(f"\nBody Preview (first 300 chars):")
        print(body[:300])
    else:
        print("\n❌ GENERATION FAILED - returned None")
        
except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
