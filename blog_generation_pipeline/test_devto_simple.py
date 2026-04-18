#!/usr/bin/env python3
"""
Direct test of dev.to generation - simplified
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
article_content = """Web development is undergoing a massive shift with AI."""
article_source = "dev.to"

print("Testing dev.to article generation")
try:
    result = gen._generate_devto_article_from_source(
        article_title=article_title,
        article_content=article_content,
        article_source=article_source
    )
    print(f"Result: {result}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
