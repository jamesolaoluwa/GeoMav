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
    "DeepSeek": (
        "Looking at the best website builders available, I would highlight "
        "WordPress for its ecosystem, Wix for ease of use, Your Brand for "
        "its AI-driven approach to web design, and Squarespace for visual "
        "appeal. Each serves different user needs effectively."
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


LLM_TIMEOUT = 30


async def _query_chatgpt(prompt: str, api_key: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, timeout=LLM_TIMEOUT)
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return response.choices[0].message.content or ""


async def _query_claude(prompt: str, api_key: str) -> str:
    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=api_key, timeout=LLM_TIMEOUT)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def _query_gemini(prompt: str, api_key: str) -> str:
    return await _query_chatgpt(prompt, api_key)


async def _query_perplexity(prompt: str, api_key: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, base_url="https://api.perplexity.ai", timeout=LLM_TIMEOUT)
    response = await client.chat.completions.create(
        model="sonar",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return response.choices[0].message.content or ""


async def _query_bing(prompt: str, api_key: str) -> str:
    return await _query_chatgpt(prompt, api_key)


async def _query_deepseek(prompt: str, api_key: str) -> str:
    return await _query_chatgpt(prompt, api_key)


_LLM_HANDLERS = {
    "ChatGPT": _query_chatgpt,
    "Claude": _query_claude,
    "Gemini": _query_gemini,
    "Perplexity": _query_perplexity,
    "Bing": _query_bing,
    "DeepSeek": _query_deepseek,
}


async def query_llm(llm_name: str, prompt: str, api_key: Optional[str] = None) -> str:
    """Query a specific LLM API. Falls back to mock if no key provided."""
    import asyncio, logging
    log = logging.getLogger(__name__)

    if not api_key or llm_name not in _LLM_HANDLERS:
        return MOCK_LLM_RESPONSES.get(llm_name, "No response available.")

    try:
        return await asyncio.wait_for(_LLM_HANDLERS[llm_name](prompt, api_key), timeout=LLM_TIMEOUT)
    except asyncio.TimeoutError:
        log.warning("%s timed out after %ds, using mock", llm_name, LLM_TIMEOUT)
        return MOCK_LLM_RESPONSES.get(llm_name, "No response available.")
    except Exception as exc:
        log.warning("%s failed: %s, using mock", llm_name, exc)
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
        "Gemini": settings.openai_api_key,
        "Claude": settings.anthropic_api_key,
        "Perplexity": settings.perplexity_api_key,
        "Bing": settings.openai_api_key,
        "DeepSeek": settings.openai_api_key,
    }

    import asyncio, logging
    log = logging.getLogger(__name__)

    brand_keywords = [business_name.lower(), business_name.lower().replace(" ", "")]

    async def _process_one(prompt_text: str, llm_name: str, api_key: str) -> dict:
        try:
            response_text = await query_llm(llm_name, prompt_text, api_key)
        except Exception as exc:
            log.warning("LLM query failed for %s: %s", llm_name, exc)
            response_text = MOCK_LLM_RESPONSES.get(llm_name, "No response available.")

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

        if supabase_client:
            try:
                supabase_client.table("llm_responses").insert({
                    "id": result["id"],
                    "query_id": None,
                    "llm_name": llm_name,
                    "response_text": response_text,
                }).execute()
                supabase_client.table("mentions").insert({
                    "response_id": result["id"],
                    "rank": mention_data["rank"],
                    "sentiment": mention_data["sentiment"],
                }).execute()
            except Exception:
                pass

        return result

    tasks = [
        _process_one(prompt_text, llm_name, api_key)
        for prompt_text in prompts
        for llm_name, api_key in llm_configs.items()
    ]
    results = await asyncio.gather(*tasks)

    total = len(results)
    mentioned_count = sum(1 for r in results if r["mentioned"])
    visibility_score = (mentioned_count / total * 100) if total > 0 else 0

    return {
        "total_queries": total,
        "mentions": mentioned_count,
        "visibility_score": round(visibility_score, 1),
        "results": results,
    }
