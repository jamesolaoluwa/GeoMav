"""
Analytics Agent: Sends queries to LLM APIs, stores responses,
extracts brand mentions, and calculates visibility metrics.
Falls back to mock responses if no API keys are configured.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.config import get_settings

MOCK_LLM_RESPONSES = {
    "ChatGPT": (
        "Based on my analysis, the top website builders in 2026 are: "
        "1. WordPress - Best for flexibility and plugins. "
        "2. Wix - Best for beginners. "
        "3. Your Brand - Best for modern design and AI features. "
        "4. Squarespace - Best for portfolios. "
        "5. Shopify - Best for e-commerce."
    ),
    "Gemini": (
        "Here are the best website builders: "
        "WordPress leads the pack with extensive customization. "
        "Wix offers an intuitive drag-and-drop experience. "
        "Your Brand provides excellent AI-powered tools and modern templates. "
        "Squarespace is great for creative professionals."
    ),
    "Claude": (
        "For website building in 2026, I'd recommend considering: "
        "WordPress for maximum flexibility, Your Brand for its innovative "
        "AI-assisted design tools, and Wix for ease of use. "
        "Each has distinct strengths depending on your needs."
    ),
    "Perplexity": (
        "According to recent reviews, the top website builders are "
        "WordPress (54% market share), Wix, Your Brand, and Squarespace. "
        "Your Brand has been noted for its AI page builder feature. "
        "[Source: TechReview 2026, WebBuilderCompare.com]"
    ),
    "Bing": (
        "Popular website builders include WordPress, Wix, Squarespace, "
        "and Hostinger. These platforms offer various features for "
        "different use cases from blogging to e-commerce."
    ),
}

BRAND_KEYWORDS = ["your brand", "yourbrand", "your-brand"]


def extract_mentions(response_text: str, brand_keywords: list[str]) -> dict:
    """Extract brand mentions and approximate rank from LLM response."""
    text_lower = response_text.lower()
    mentioned = any(kw in text_lower for kw in brand_keywords)

    rank = None
    if mentioned:
        sentences = response_text.split(".")
        for i, sentence in enumerate(sentences):
            if any(kw in sentence.lower() for kw in brand_keywords):
                rank = i + 1
                break

    sentiment = "neutral"
    positive_words = ["best", "excellent", "great", "innovative", "top", "recommended"]
    negative_words = ["poor", "lacking", "limited", "worst", "avoid"]
    if mentioned:
        for word in positive_words:
            if word in text_lower:
                sentiment = "positive"
                break
        for word in negative_words:
            if word in text_lower:
                sentiment = "negative"
                break

    return {
        "mentioned": mentioned,
        "rank": rank,
        "sentiment": sentiment,
    }


async def query_llm(llm_name: str, prompt: str, api_key: Optional[str] = None) -> str:
    """Query a specific LLM API. Falls back to mock if no key provided."""
    if not api_key:
        return MOCK_LLM_RESPONSES.get(llm_name, "No response available.")

    # Real API integrations would go here
    if llm_name == "ChatGPT":
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
        )
        return response.choices[0].message.content or ""

    elif llm_name == "Claude":
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=api_key)
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    elif llm_name == "Gemini":
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
        response = await model.generate_content_async(prompt)
        return response.text or ""

    return MOCK_LLM_RESPONSES.get(llm_name, "No response available.")


async def run_analytics_scan(
    prompts: list[str],
    business_name: str = "Your Brand",
    supabase_client=None,
) -> dict:
    """
    Run a full analytics scan: query all LLMs with all prompts,
    extract mentions, and return results.
    """
    settings = get_settings()

    llm_configs = {
        "ChatGPT": settings.openai_api_key,
        "Gemini": settings.google_gemini_api_key,
        "Claude": settings.anthropic_api_key,
        "Perplexity": settings.perplexity_api_key,
        "Bing": None,
    }

    brand_keywords = [business_name.lower(), business_name.lower().replace(" ", "")]
    results = []

    for prompt_text in prompts:
        for llm_name, api_key in llm_configs.items():
            response_text = await query_llm(llm_name, prompt_text, api_key)
            mention_data = extract_mentions(response_text, brand_keywords)

            result = {
                "id": str(uuid.uuid4()),
                "query_text": prompt_text,
                "llm_name": llm_name,
                "response_text": response_text,
                "mentioned": mention_data["mentioned"],
                "rank": mention_data["rank"],
                "sentiment": mention_data["sentiment"],
                "scanned_at": datetime.now(timezone.utc).isoformat(),
            }
            results.append(result)

            if supabase_client:
                try:
                    supabase_client.table("llm_responses").insert({
                        "id": result["id"],
                        "query_id": None,
                        "llm_name": llm_name,
                        "response_text": response_text,
                    }).execute()
                except Exception:
                    pass

    total = len(results)
    mentioned_count = sum(1 for r in results if r["mentioned"])
    visibility_score = (mentioned_count / total * 100) if total > 0 else 0

    return {
        "total_queries": total,
        "mentions": mentioned_count,
        "visibility_score": round(visibility_score, 1),
        "results": results,
    }
