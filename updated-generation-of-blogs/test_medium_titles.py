#!/usr/bin/env python3
"""
Test Medium title generation variety
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

# Test with different body content
test_cases = [
    {
        "title": "AI Latency Optimization",
        "body": """I discovered that model routing can reduce latency by 47%. 
        After testing various approaches, I learned that most teams were doing it wrong.
        The mistake everyone makes is not considering the trade-offs.""",
        "topic": "AI latency"
    },
    {
        "title": "Cost Optimization",
        "body": """Building efficient systems is hard. I tested different approaches and found significant cost savings.
        The real truth about cost optimization is that you need to monitor constantly.
        This guide will help you deploy better infrastructure.""",
        "topic": "cost optimization"
    },
    {
        "title": "Inference Speed",
        "body": """I was wrong about inference speeds vs batch processing. After building a new system,
        I realized the comparison is not fair. Faster inference is not always better.""",
        "topic": "inference"
    },
]

print("=" * 80)
print("Testing Medium Title Generation - Should show VARIETY")
print("=" * 80)

for i, test in enumerate(test_cases, 1):
    print(f"\n--- Test Case {i}: {test['title']} ---")
    print(f"Topic: {test['topic']}")
    
    # Generate 5 different titles for each case
    titles = set()
    for j in range(5):
        title = gen._generate_medium_title_variants(test['title'], test['body'], test['topic'])
        titles.add(title)
        print(f"  {j+1}. {title}")
    
    print(f"  Unique titles generated: {len(titles)} out of 5")
    if len(titles) == 1:
        print("  WARNING: Only 1 unique title - check if randomization is working")

print("\n" + "=" * 80)
print("Test complete!")
