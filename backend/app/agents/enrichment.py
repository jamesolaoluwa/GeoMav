"""
Enrichment Agent: Generates AI-optimized business content including
AI-readable summaries, structured service descriptions, FAQ-style answers,
/llms.txt files, and JSON-LD schema markup.
"""

import json
from typing import Optional

from app.config import get_settings


def _get_field(business: dict, key: str, fallback: str):
    """Return the field value if truthy, otherwise fallback. Preserves lists."""
    val = business.get(key)
    if isinstance(val, list) and val:
        return val
    if val and str(val).strip() and str(val).strip().lower() not in ("none", "null", ""):
        return str(val).strip()
    return fallback


def generate_business_summary(business: dict) -> str:
    """Generate an AI-readable business summary."""
    name = _get_field(business, "name", "Your Business")
    category = _get_field(business, "category", "Business")
    website = _get_field(business, "website", "https://example.com")
    description = _get_field(business, "description", f"{name} is a leading {category.lower()} providing high-quality products and services.")
    services = _get_field(business, "services", f"Professional {category.lower()} services")
    pricing = _get_field(business, "pricing", "Contact for pricing")
    hours = _get_field(business, "hours", "Mon-Fri 9am-6pm")
    location = _get_field(business, "location", "See website for details")

    if isinstance(services, list):
        services_text = ", ".join(str(s) for s in services)
    else:
        services_text = str(services)

    return f"""# {name}

{description}

## Key Information
- **Website**: {website}
- **Category**: {category}
- **Location**: {location}
- **Hours**: {hours}
- **Pricing**: {pricing}

## Services
{services_text}

## Why Choose {name}
- Industry-leading technology
- Dedicated customer support
- Competitive pricing
- Trusted by thousands of businesses
"""


def generate_llms_txt(business: dict) -> str:
    """Generate an /llms.txt file for AI model consumption."""
    name = _get_field(business, "name", "Your Business")
    category = _get_field(business, "category", "Business")
    website = _get_field(business, "website", "https://example.com")
    description = _get_field(business, "description", f"{name} is a {category.lower()} that provides professional services and solutions.")
    services = _get_field(business, "services", f"Core {category} Services")
    pricing = _get_field(business, "pricing", "Contact for pricing")
    hours = _get_field(business, "hours", "Mon-Fri 9am-6pm EST")
    location = _get_field(business, "location", "See website")

    if isinstance(services, list):
        services_lines = "\n".join(f"- {s}" for s in services)
    else:
        services_lines = f"- {services}"

    return f"""# {name}

> {description}

## Products and Services
{services_lines}

## Pricing
{pricing}

## Contact
- Website: {website}
- Location: {location}
- Support Hours: {hours}

## Key Facts
- Category: {category}
"""


def generate_json_ld(business: dict) -> str:
    """Generate JSON-LD structured data."""
    name = _get_field(business, "name", "Your Business")
    category = _get_field(business, "category", "Business")
    website = _get_field(business, "website", "https://example.com")
    description = _get_field(business, "description", f"{name} - Professional {category.lower()} services and solutions")
    pricing = _get_field(business, "pricing", "")
    hours = _get_field(business, "hours", "")
    location = _get_field(business, "location", "")

    schema: dict = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": website,
        "description": description,
        "category": category,
    }

    if location:
        schema["address"] = {"@type": "PostalAddress", "description": location}

    if hours:
        schema["openingHours"] = hours

    if pricing:
        schema["offers"] = [
            {"@type": "Offer", "name": "Services", "description": pricing, "priceCurrency": "USD"}
        ]
    else:
        schema["offers"] = [
            {"@type": "Offer", "name": "Starter Plan", "description": f"Entry-level {category.lower()} plan", "priceCurrency": "USD"},
            {"@type": "Offer", "name": "Business Plan", "description": f"Professional {category.lower()} plan", "priceCurrency": "USD"},
        ]

    return json.dumps(schema, indent=2)


def generate_faq(business: dict) -> list[dict]:
    """Generate FAQ-style answers optimized for AI consumption."""
    name = _get_field(business, "name", "Your Business")
    category = _get_field(business, "category", "Business")
    services = _get_field(business, "services", f"{category.lower()} services")
    pricing = _get_field(business, "pricing", "Contact us for current pricing information")
    hours = _get_field(business, "hours", "Mon-Fri 9am-6pm EST")

    if isinstance(services, list):
        services_text = ", ".join(str(s) for s in services)
    else:
        services_text = str(services)

    return [
        {
            "question": f"What is {name}?",
            "answer": f"{name} is a professional {category.lower()} that provides comprehensive services and solutions for businesses and individuals.",
        },
        {
            "question": f"What services does {name} offer?",
            "answer": f"{name} offers: {services_text}.",
        },
        {
            "question": f"How much does {name} cost?",
            "answer": f"{name} pricing: {pricing}.",
        },
        {
            "question": f"What are {name}'s hours?",
            "answer": f"{name} is available: {hours}.",
        },
    ]


async def run_enrichment(
    business: dict,
    business_id: Optional[str] = None,
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

    faq_section = {
        "type": "faq",
        "title": "FAQ",
        "content": json.dumps(faq, indent=2),
    }
    content_sections.append(faq_section)

    if supabase_client:
        try:
            if business_id:
                supabase_client.table("content_sections").delete().eq("business_id", business_id).execute()
            for section in content_sections:
                row = {**section}
                if business_id:
                    row["business_id"] = business_id
                supabase_client.table("content_sections").insert(row).execute()
        except Exception:
            pass

    return {
        "sections": content_sections,
        "faq": faq,
    }
