#!/usr/bin/env python3
"""Direct test of Medium blog generation without API."""

import sys
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent / "blog_generation_pipeline"))
sys.path.insert(0, str(Path(__file__).parent))

from blog_generation_pipeline.blog_platform.config import Config
from blog_generation_pipeline.blog_platform.blog_generator import BlogGenerator

def test_blog_generator_directly():
    """Test blog generation directly."""
    print("Direct BlogGenerator Test")
    print("=" * 60)
    
    try:
        # Initialize blog generator
        generator = BlogGenerator(
            api_key=Config.MEGALLM_API_KEY,
            base_url=Config.MEGALLM_BASE_URL,
            model=Config.MODEL,
            fallback_providers=Config.FALLBACK_PROVIDERS,
        )
        print("[OK] BlogGenerator initialized")
        
        # Get AI trends topic
        topic_info = Config.TOPICS.get("cost_optimization")
        if not topic_info:
            print("[ERROR] Topic 'ai_trends' not found")
            return
        
        print("\nGenerating blog for topic: " + topic_info['name'])
        print("Topic description: " + topic_info['description'][:100] + "...")
        
        # Generate a basic blog
        print("\n1. Generating basic blog...")
        blog_data = generator.generate_blog(
            topic=topic_info["name"],
            topic_description=topic_info["description"],
            keywords=topic_info.get("keywords", [])
        )
        
        if blog_data:
            print("[OK] Blog generated!")
            print("  Title: " + blog_data.get('title', 'N/A'))
            body = blog_data.get('body', '')
            word_count = len(body.split())
            print("  Word Count: " + str(word_count))
            print("  Body (first 300 chars): " + body[:300] + "...")
            
            # Now package for Medium
            print("\n2. Packaging for Medium...")
            medium_data = generator.package_medium_post(
                title=blog_data.get("title", ""),
                body=blog_data.get("body", ""),
                keywords=topic_info.get("keywords", []),
                topic=topic_info["name"],
                medium_settings={},
            )
            
            if medium_data:
                print("[OK] Medium packaging successful!")
                print("  Packaged title: " + medium_data.get('title', 'N/A'))
                packaged_body = medium_data.get('body', '')
                packaged_word_count = len(packaged_body.split())
                print("  Packaged word count: " + str(packaged_word_count))
                print("  Packaged body (first 300 chars): " + packaged_body[:300] + "...")
                
                # Check key metrics
                print("\n3. Verification:")
                print("  Word count reduction: " + str(word_count) + " to " + str(packaged_word_count))
                if packaged_word_count < word_count:
                    print("  [OK] Blog was simplified (" + str(packaged_word_count) + "/" + str(word_count) + ")")
                else:
                    print("  [FAIL] Blog was not simplified")
                    
                if 250 <= packaged_word_count <= 350:
                    print("  [OK] Target word count met (250-350 words)")
                else:
                    print("  [FAIL] Word count outside target range (target: 250-350)")
                    
                if "https://megallm.io" in packaged_body:
                    print("  [OK] MegaLLM backlink present")
                else:
                    print("  [FAIL] MegaLLM backlink missing")
                
            else:
                print("[ERROR] Medium packaging failed")
        else:
            print("[ERROR] Blog generation failed")
            
    except Exception as e:
        print("[ERROR] Error: " + str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_blog_generator_directly()

