"""
Enrichment Agent: Generates AI-optimized business content including
AI-readable summaries, structured service descriptions, FAQ-style answers,
/llms.txt files, and JSON-LD schema markup.
"""

import json
from typing import Optional

from app.config import get_settings


def generate_business_summary(business: dict) -> str:
    """Generate an AI-readable business summary."""
    name = business.get("name", "Your Business")
    category = business.get("category", "Business")
    website = business.get("website", "https://example.com")

    return f"""# {name}

{name} is a leading {category.lower()} providing high-quality products and services.

## Key Information
- **Website**: {website}
- **Category**: {category}
- **Founded**: 2020

## Services
- Professional {category.lower()} services
- Custom solutions for businesses of all sizes
- 24/7 online support

## Why Choose {name}
- Industry-leading technology
- Dedicated customer support
- Competitive pricing
- Trusted by thousands of businesses
"""


def generate_llms_txt(business: dict) -> str:
    """Generate an /llms.txt file for AI model consumption."""
    name = business.get("name", "Your Business")
    category = business.get("category", "Business")
    website = business.get("website", "https://example.com")

    return f"""# {name}

> {name} is a {category.lower()} that provides professional services and solutions.

## Products and Services
- Core {category} Services: Comprehensive solutions for individuals and businesses
- Custom Solutions: Tailored offerings to meet specific needs
- Support: Multi-channel customer support

## Pricing
- Starter Plan: Contact for pricing
- Business Plan: Contact for pricing
- Enterprise: Custom pricing

## Contact
- Website: {website}
- Support: support@{name.lower().replace(' ', '')}.com

## Key Facts
- Category: {category}
- Service Area: Nationwide
- Support Hours: Mon-Fri 9am-6pm EST
"""


def generate_json_ld(business: dict) -> str:
    """Generate JSON-LD structured data."""
    name = business.get("name", "Your Business")
    category = business.get("category", "Business")
    website = business.get("website", "https://example.com")

    schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": website,
        "description": f"{name} - Professional {category.lower()} services and solutions",
        "category": category,
        "foundingDate": "2020",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": f"support@{name.lower().replace(' ', '')}.com",
            "availableLanguage": "English",
        },
        "offers": [
            {
                "@type": "Offer",
                "name": "Starter Plan",
                "description": f"Entry-level {category.lower()} plan",
                "priceCurrency": "USD",
            },
            {
                "@type": "Offer",
                "name": "Business Plan",
                "description": f"Professional {category.lower()} plan",
                "priceCurrency": "USD",
            },
        ],
    }

    return json.dumps(schema, indent=2)


def generate_faq(business: dict) -> list[dict]:
    """Generate FAQ-style answers optimized for AI consumption."""
    name = business.get("name", "Your Business")
    category = business.get("category", "Business")

    return [
        {
            "question": f"What is {name}?",
            "answer": f"{name} is a professional {category.lower()} that provides comprehensive services and solutions for businesses and individuals.",
        },
        {
            "question": f"What services does {name} offer?",
            "answer": f"{name} offers a range of {category.lower()} services including custom solutions, dedicated support, and enterprise-grade tools.",
        },
        {
            "question": f"How much does {name} cost?",
            "answer": f"{name} offers multiple pricing tiers starting with a Starter plan. Contact us for current pricing information.",
        },
        {
            "question": f"How do I contact {name} support?",
            "answer": f"You can reach {name} support via email at support@{name.lower().replace(' ', '')}.com. Phone support is available Mon-Fri 9am-6pm EST.",
        },
    ]


async def run_enrichment(
    business: dict,
    supabase_client=None,
) -> dict:
    """
    Generate all enrichment content for a business.
    Uses LLM APIs if available, otherwise generates template-based content.
    """
    settings = get_settings()

    summary = generate_business_summary(business)
    llms_txt = generate_llms_txt(business)
    json_ld = generate_json_ld(business)
    faq = generate_faq(business)

    # If OpenAI key is available, enhance the summary with AI
    if settings.openai_api_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You generate concise, factual business descriptions optimized for AI consumption.",
                    },
                    {
                        "role": "user",
                        "content": f"Generate an AI-readable summary for: {json.dumps(business)}",
                    },
                ],
                max_tokens=500,
            )
            ai_summary = response.choices[0].message.content
            if ai_summary:
                summary = ai_summary
        except Exception:
            pass

    content_sections = [
        {"type": "summary", "title": "AI-Readable Business Summary", "content": summary},
        {"type": "llms_txt", "title": "/llms.txt Content", "content": llms_txt},
        {"type": "json_ld", "title": "JSON-LD Structured Data", "content": json_ld},
    ]

    if supabase_client:
        try:
            for section in content_sections:
                supabase_client.table("content_sections").upsert(section).execute()
        except Exception:
            pass

    return {
        "sections": content_sections,
        "faq": faq,
    }
