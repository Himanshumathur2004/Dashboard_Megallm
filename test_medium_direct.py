#!/usr/bin/env python3
"""Direct test of Medium generation to identify the issue."""

import sys
import os
sys.path.insert(0, r"e:\unified_dashboard\blog_generation_pipeline")
sys.path.insert(0, r"e:\unified_dashboard\blog_generation_pipeline\blog_platform")

# Load environment
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "blog_generation_pipeline"))

from blog_platform.config import Config
from blog_platform.blog_generator import BlogGenerator
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

print("=" * 80)
print("MEDIUM GENERATION TEST")
print("=" * 80)

try:
    print("\n1. Initializing BlogGenerator...")
    generator = BlogGenerator(
        api_key=Config.MEGALLM_API_KEY,
        base_url=Config.MEGALLM_BASE_URL,
        model=Config.MODEL,
        fallback_providers=Config.FALLBACK_PROVIDERS,
    )
    print("[OK] Generator initialized")
    
    print("\n2. Generating blog content...")
    blog_data = generator.generate_blog(
        topic="Performance Optimization",
        topic_description="Tips and tricks for optimizing system performance",
        keywords=["performance", "optimization", "speed"]
    )
    
    if not blog_data:
        print("[FAIL] Blog generation returned None")
        sys.exit(1)
    
    print("[OK] Blog generated")
    print(f"   Title: {blog_data.get('title', 'N/A')[:60]}...")
    print(f"   Body length: {len(blog_data.get('body', ''))} chars")
    
    print("\n3. Packaging for Medium...")
    medium_settings = {
        "author_name": Config.MEDIUM_AUTHOR_NAME,
        "author_handle": Config.MEDIUM_AUTHOR_HANDLE,
        "author_twitter": Config.MEDIUM_AUTHOR_TWITTER,
        "publication_slug": Config.MEDIUM_PUBLICATION_SLUG,
        "hero_image_url": Config.MEDIUM_HERO_IMAGE_URL,
        "hero_image_alt": "MegaLLM deep-dive article cover",
        "backlink_url": Config.MEGALLM_BACKLINK_URL,
    }
    
    print(f"   Settings: {medium_settings}")
    
    medium_post = generator.package_medium_post(
        title=blog_data.get("title", ""),
        body=blog_data.get("body", ""),
        keywords=["performance", "optimization"],
        topic="Performance Optimization",
        medium_settings=medium_settings,
    )
    
    if not medium_post:
        print("[FAIL] Medium packaging returned None")
        sys.exit(1)
    
    print("[OK] Medium post packaged successfully!")
    print(f"   Keys: {list(medium_post.keys())}")
    if "title" in medium_post:
        print(f"   Title: {medium_post['title'][:60]}...")
    if "body" in medium_post:
        print(f"   Body length: {len(medium_post.get('body', ''))} chars")
    
    print("\n" + "=" * 80)
    print("SUCCESS: Medium generation completed without errors!")
    print("=" * 80)
    
except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    logger.exception("Full traceback:")
    sys.exit(1)
