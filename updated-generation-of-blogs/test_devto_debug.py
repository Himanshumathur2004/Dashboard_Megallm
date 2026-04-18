#!/usr/bin/env python3
"""
Direct test of dev.to generation to debug issues
"""
import sys
sys.path.insert(0, 'blog_platform')

from blog_generator import BlogGenerator
from config import Config

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
print("Testing dev.to article generation")
print("=" * 80)
print(f"Title: {article_title}")
print(f"Content length: {len(article_content)} chars")
print()

try:
    result = gen._generate_devto_article_from_source(
        article_title=article_title,
        article_content=article_content,
        article_source=article_source
    )
    
    if result:
        print("✅ GENERATION SUCCESSFUL")
        print(f"\nGenerated Title: {result.get('title')}")
        print(f"Generated Body Length: {len(result.get('body', ''))} chars")
        print(f"Tags: {result.get('tags')}")
        body = result.get('body', '')
        print(f"\nBody Preview (first 300 chars):")
        print(body[:300])
        print(f"\nBody type: {type(body)}")
        print(f"Body starts with {{ : {body.startswith('{')}")
    else:
        print("❌ GENERATION FAILED - returned None")
        
except Exception as e:
    print(f"❌ EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
