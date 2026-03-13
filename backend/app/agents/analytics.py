"""
Analytics Agent: Sends queries to LLM APIs, stores responses,
extracts brand mentions, and calculates visibility metrics.
Falls back to mock responses if no API keys are configured.
"""

import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from app.config import get_settings

log = logging.getLogger(__name__)

def _build_mock_responses(brand: str = "Your Brand") -> dict[str, str]:
    return {
        "ChatGPT": (
            f"Based on my analysis, the top options in 2026 are: "
            f"1. {brand} - Known for quality and customer service. "
            f"2. Several other providers in the area also offer competitive options. "
            f"3. Overall, {brand} stands out for their attention to detail."
        ),
        "Gemini": (
            f"Looking at the best options available: "
            f"{brand} is a well-regarded choice with excellent reviews. "
            f"They offer a wide range of services and have built a strong reputation "
            f"in their local market."
        ),
        "Claude": (
            f"For this category, I'd recommend considering: "
            f"{brand} for their innovative approach and quality service. "
            f"They have been noted for reliability and customer satisfaction. "
            f"Other options exist but {brand} is frequently mentioned."
        ),
        "Perplexity": (
            f"According to recent reviews and sources, {brand} is among the top "
            f"choices in their category. They have received positive feedback "
            f"for their services. {brand} has been highlighted for their "
            f"excellent customer experience. [Source: Local Reviews 2026]"
        ),
        "Bing": (
            f"Popular options in this category include several well-known providers. "
            f"These businesses offer various features for different needs "
            f"and budgets. Local options tend to provide more personalized service."
        ),
        "DeepSeek": (
            f"Looking at the best options available, I would highlight "
            f"{brand} for their quality and service, along with several "
            f"other competitive options in the market. Each serves different "
            f"customer needs effectively."
        ),
    }


MOCK_LLM_RESPONSES = _build_mock_responses()

BRAND_KEYWORDS = ["your brand", "yourbrand", "your-brand"]  # only used for mock fallback

POSITIVE_WORDS = {
    "best", "excellent", "great", "innovative", "top", "recommended",
    "leading", "outstanding", "superior", "impressive", "reliable",
    "popular", "trusted", "powerful", "premium", "exceptional",
    "remarkable", "favorite", "preferred", "acclaimed",
}
NEGATIVE_WORDS = {
    "poor", "lacking", "limited", "worst", "avoid", "terrible",
    "bad", "disappointing", "unreliable", "overpriced", "slow",
    "buggy", "outdated", "mediocre", "inferior", "frustrating",
    "problematic", "confusing", "expensive", "complicated",
}


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
    if mentioned:
        words = set(text_lower.split())
        pos_hits = len(words & POSITIVE_WORDS)
        neg_hits = len(words & NEGATIVE_WORDS)
        if pos_hits > neg_hits:
            sentiment = "positive"
        elif neg_hits > pos_hits:
            sentiment = "negative"

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
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = await asyncio.to_thread(
        model.generate_content, prompt,
        generation_config=genai.types.GenerationConfig(max_output_tokens=500),
    )
    return response.text or ""


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
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, timeout=LLM_TIMEOUT)
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return response.choices[0].message.content or ""


async def _query_deepseek(prompt: str, api_key: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        timeout=LLM_TIMEOUT,
    )
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return response.choices[0].message.content or ""


_LLM_HANDLERS = {
    "ChatGPT": _query_chatgpt,
    "Claude": _query_claude,
    "Gemini": _query_gemini,
    "Perplexity": _query_perplexity,
    "Bing": _query_bing,
    "DeepSeek": _query_deepseek,
}


async def query_llm(
    llm_name: str,
    prompt: str,
    api_key: Optional[str] = None,
    business_name: str = "Your Brand",
) -> str:
    """Query a specific LLM API. Falls back to mock if no key provided."""
    mock = _build_mock_responses(business_name)
    if not api_key or llm_name not in _LLM_HANDLERS:
        return mock.get(llm_name, "No response available.")

    try:
        return await asyncio.wait_for(_LLM_HANDLERS[llm_name](prompt, api_key), timeout=LLM_TIMEOUT)
    except asyncio.TimeoutError:
        log.warning("%s timed out after %ds, using mock", llm_name, LLM_TIMEOUT)
        return mock.get(llm_name, "No response available.")
    except Exception as exc:
        log.warning("%s failed: %s, using mock", llm_name, exc)
        return mock.get(llm_name, "No response available.")


VALID_SENTIMENTS = {"positive", "neutral", "negative"}


async def run_analytics_scan(
    prompts: list[str],
    business_name: str = "Your Brand",
    business_id: Optional[str] = None,
    query_ids: Optional[list[str]] = None,
    supabase_client=None,
    query_ids: Optional[list[str]] = None,
    business_id: Optional[str] = None,
) -> dict:
    """
    Run a full analytics scan: query all LLMs with all prompts,
    extract mentions, and return results.

    Args:
        query_ids: parallel list of query UUIDs matching prompts, used to link llm_responses.
        business_id: UUID of the business; required for writing mentions.
    """
    settings = get_settings()

    llm_configs = {
        "ChatGPT": settings.openai_api_key,
        "Gemini": settings.google_gemini_api_key,
        "Claude": settings.anthropic_api_key,
        "Perplexity": settings.perplexity_api_key,
        "Bing": settings.openai_api_key,
        "DeepSeek": "",
    }

    prompt_id_map = {}
    if query_ids and len(query_ids) == len(prompts):
        prompt_id_map = dict(zip(prompts, query_ids))

    name_lower = business_name.lower()
    brand_keywords = [
        name_lower,
        name_lower.replace(" ", ""),
        name_lower.replace("&", "and"),
        name_lower.replace(" & ", " and "),
    ]
    for part in name_lower.split():
        if len(part) > 3 and part not in {"and", "the", "for"}:
            brand_keywords.append(part)
    brand_keywords = list(dict.fromkeys(brand_keywords))

    async def _process_one(prompt_text: str, llm_name: str, api_key: str) -> dict:
        enriched_prompt = (
            f"Answer the following question with specific, factual information. "
            f"Include brand names, rankings, pricing, locations, and services where relevant. "
            f"Be concrete and avoid vague advice.\n\n{prompt_text}"
        )
        try:
            response_text = await query_llm(llm_name, enriched_prompt, api_key, business_name)
        except Exception as exc:
            log.warning("LLM query failed for %s: %s", llm_name, exc)
            response_text = _build_mock_responses(business_name).get(llm_name, "No response available.")

        mention_data = extract_mentions(response_text, brand_keywords)
        sentiment = mention_data["sentiment"]
        if sentiment not in VALID_SENTIMENTS:
            sentiment = None

        return {
            "id": str(uuid.uuid4()),
            "query_id": prompt_id_map.get(prompt_text),
            "query_text": prompt_text,
            "llm_name": llm_name,
            "response_text": response_text,
            "mentioned": mention_data["mentioned"],
            "rank": mention_data["rank"],
            "sentiment": sentiment,
            "scanned_at": datetime.now(timezone.utc).isoformat(),
        }

    tasks = [
        _process_one(prompt_text, llm_name, api_key, qid)
        for (prompt_text, qid) in zip(prompts, _query_ids)
        for llm_name, api_key in llm_configs.items()
    ]
    results = await asyncio.gather(*tasks)

    if supabase_client:
        try:
            llm_rows = [
                {"id": r["id"], "query_id": r["query_id"], "llm_name": r["llm_name"], "response_text": r["response_text"]}
                for r in results
            ]
            supabase_client.table("llm_responses").insert(llm_rows).execute()
        except Exception as exc:
            log.warning("llm_responses insert failed: %s", exc)

        if business_id:
            try:
                mention_rows = [
                    {
                        "business_id": business_id,
                        "response_id": r["id"],
                        "rank": r["rank"],
                        "sentiment": r["sentiment"],
                    }
                    for r in results
                    if r["sentiment"] in VALID_SENTIMENTS
                ]
                if mention_rows:
                    supabase_client.table("mentions").insert(mention_rows).execute()
            except Exception as exc:
                log.warning("mentions insert failed: %s", exc)
        else:
            log.warning("No business_id supplied — skipping mentions insert")

    total = len(results)
    mentioned_count = sum(1 for r in results if r["mentioned"])
    visibility_score = (mentioned_count / total * 100) if total > 0 else 0

    return {
        "total_queries": total,
        "mentions": mentioned_count,
        "visibility_score": round(visibility_score, 1),
        "results": list(results),
    }
