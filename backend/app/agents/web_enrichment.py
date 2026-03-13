"""
Web Enrichment Agent: Crawls a business's website and Google search results
to extract verified facts (pricing, hours, location, services, description).
Merges extracted data into the businesses table so the Reinforcement Agent
has a reliable source of truth for hallucination classification.
"""

import json
import logging
import re
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

PAGE_TIMEOUT = 15
TOKEN_BUDGET_PER_PAGE = 2000
TOKEN_BUDGET_TOTAL = 6000
CHAR_PER_TOKEN_ESTIMATE = 4

KEY_SUBPATHS = ["/about", "/pricing", "/plans", "/contact", "/services", "/menu"]

EXTRACTION_SYSTEM_PROMPT = (
    "You extract structured business information from web page text. "
    "Return ONLY a valid JSON object with these optional fields: "
    "name, category, description (1-2 sentences), pricing (string describing plans/prices), "
    "hours (opening hours string), location (city, state or full address), "
    "services (comma-separated list of services/products offered). "
    "Omit any field not found in the text. Return only JSON, no markdown fences."
)


def _truncate_text(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[truncated]"


def _strip_html_to_text(html: str) -> str:
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "img"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text
    except Exception:
        text = re.sub(r"<[^>]+>", " ", html)
        return re.sub(r"\s{2,}", " ", text).strip()


async def fetch_page(url: str) -> tuple[str, str]:
    """Fetch a URL and return (raw_html, plain_text). Returns empty on failure."""
    max_chars = TOKEN_BUDGET_PER_PAGE * CHAR_PER_TOKEN_ESTIMATE
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=PAGE_TIMEOUT,
            headers={"User-Agent": "GeoMavBot/1.0 (business-enrichment)"},
        ) as client:
            resp = await client.get(url)
            if resp.status_code >= 400:
                return "", ""
            html = resp.text
            text = _strip_html_to_text(html)
            return html, _truncate_text(text, max_chars)
    except Exception as exc:
        logger.debug("fetch_page failed for %s: %s", url, exc)
        return "", ""


def extract_schema_org(html: str) -> dict:
    """Parse <script type='application/ld+json'> blocks for LocalBusiness/Organization data."""
    results: dict = {}
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        scripts = soup.find_all("script", attrs={"type": "application/ld+json"})

        for script in scripts:
            try:
                data = json.loads(script.string or "")
                items = data if isinstance(data, list) else [data]
                for item in items:
                    item_type = item.get("@type", "")
                    if item_type in ("LocalBusiness", "Organization", "Store", "Restaurant"):
                        if item.get("name"):
                            results["name"] = item["name"]
                        if item.get("description"):
                            results["description"] = item["description"]
                        if item.get("address"):
                            addr = item["address"]
                            if isinstance(addr, dict):
                                parts = [
                                    addr.get("addressLocality", ""),
                                    addr.get("addressRegion", ""),
                                ]
                                results["location"] = ", ".join(p for p in parts if p)
                            elif isinstance(addr, str):
                                results["location"] = addr
                        if item.get("openingHours"):
                            hours = item["openingHours"]
                            results["hours"] = hours if isinstance(hours, str) else ", ".join(hours)
                        if item.get("priceRange"):
                            results["pricing"] = item["priceRange"]
                        if item.get("telephone"):
                            results["phone"] = item["telephone"]
                        if item.get("category"):
                            results["category"] = item["category"]
            except (json.JSONDecodeError, AttributeError):
                continue
    except Exception as exc:
        logger.debug("extract_schema_org error: %s", exc)

    return results


async def fetch_key_pages(website: str) -> list[tuple[str, str]]:
    """Fetch homepage + key subpages. Returns list of (html, plain_text) tuples."""
    parsed = urlparse(website)
    base = f"{parsed.scheme}://{parsed.netloc}"
    if not parsed.scheme:
        base = f"https://{website.split('/')[0]}"
        website = f"https://{website}"

    pages: list[tuple[str, str]] = []

    html, text = await fetch_page(website)
    if text:
        pages.append((html, text))

    for subpath in KEY_SUBPATHS:
        url = urljoin(base, subpath)
        sub_html, sub_text = await fetch_page(url)
        if sub_text:
            pages.append((sub_html, sub_text))

    return pages


async def fetch_google_knowledge(business_name: str, website: str) -> str:
    """Fetch Google search results and extract visible text from the knowledge panel."""
    query = f'"{business_name}" site:{urlparse(website).netloc}'
    search_url = f"https://www.google.com/search?q={query}"
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=PAGE_TIMEOUT,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
            },
        ) as client:
            resp = await client.get(search_url)
            if resp.status_code >= 400:
                return ""
            text = _strip_html_to_text(resp.text)
            max_chars = TOKEN_BUDGET_PER_PAGE * CHAR_PER_TOKEN_ESTIMATE
            return _truncate_text(text, max_chars)
    except Exception as exc:
        logger.debug("fetch_google_knowledge failed: %s", exc)
        return ""


async def llm_extract_profile(
    page_texts: list[str],
    existing_profile: dict,
) -> dict:
    """Use an LLM to extract structured business fields from page text."""
    settings = get_settings()
    max_total = TOKEN_BUDGET_TOTAL * CHAR_PER_TOKEN_ESTIMATE
    combined = "\n\n---\n\n".join(page_texts)
    combined = _truncate_text(combined, max_total)

    user_prompt = (
        f"Here is text from a business website. The business is currently listed as: "
        f"{json.dumps({k: v for k, v in existing_profile.items() if v and k != 'id'})}\n\n"
        f"Extract all factual business information from the following text:\n\n{combined}"
    )

    if settings.openai_api_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=30)
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=800,
                temperature=0,
            )
            raw = response.choices[0].message.content or "{}"
            raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
            raw = re.sub(r"\s*```$", "", raw)
            return json.loads(raw)
        except Exception as exc:
            logger.warning("OpenAI extraction failed: %s", exc)

    if settings.anthropic_api_key:
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=settings.anthropic_api_key, timeout=30)
            message = await client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=800,
                system=EXTRACTION_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            raw = message.content[0].text
            raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
            raw = re.sub(r"\s*```$", "", raw)
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Anthropic extraction failed: %s", exc)

    logger.warning("No LLM API key available for web enrichment extraction")
    return {}


def merge_profile(existing: dict, schema_org: dict, llm_extracted: dict) -> dict:
    """
    Merge extracted data into the business profile.
    Priority: existing manual fields > schema.org > LLM-extracted.
    Only fills in fields that are currently empty/null.
    """
    enrichable_fields = ["name", "category", "description", "pricing", "hours", "location", "services"]
    updates: dict = {}

    for field in enrichable_fields:
        current_val = existing.get(field)
        if current_val and str(current_val).strip():
            continue

        schema_val = schema_org.get(field)
        if schema_val and str(schema_val).strip():
            updates[field] = str(schema_val).strip()
            continue

        llm_val = llm_extracted.get(field)
        if llm_val and str(llm_val).strip():
            updates[field] = str(llm_val).strip()

    return updates


async def run_web_enrichment(
    business: dict,
    supabase_client=None,
) -> dict:
    """
    Orchestrate web enrichment: fetch pages, extract schema.org,
    run LLM extraction, merge, and update the businesses table.
    """
    website = business.get("website", "")
    business_name = business.get("name", "")

    if not website:
        logger.warning("No website URL provided for web enrichment")
        return {"status": "skipped", "reason": "no_website"}

    if not website.startswith("http"):
        website = f"https://{website}"

    logger.info("Starting web enrichment for %s (%s)", business_name, website)

    pages = await fetch_key_pages(website)
    logger.info("Fetched %d pages from %s", len(pages), website)

    all_schema_org: dict = {}
    for html, _ in pages:
        if html:
            extracted = extract_schema_org(html)
            for k, v in extracted.items():
                if v and not all_schema_org.get(k):
                    all_schema_org[k] = v

    if all_schema_org:
        logger.info("Schema.org data found: %s", list(all_schema_org.keys()))

    page_texts = [text for _, text in pages if text]

    google_text = await fetch_google_knowledge(business_name, website)
    if google_text:
        page_texts.append(google_text)
        logger.info("Google knowledge panel text retrieved")

    llm_extracted: dict = {}
    if page_texts:
        llm_extracted = await llm_extract_profile(page_texts, business)
        if llm_extracted:
            logger.info("LLM extracted fields: %s", list(llm_extracted.keys()))

    updates = merge_profile(business, all_schema_org, llm_extracted)

    if updates and supabase_client:
        business_id = business.get("id")
        if business_id:
            try:
                supabase_client.table("businesses").update(updates).eq("id", business_id).execute()
                logger.info("Business profile enriched with fields: %s", list(updates.keys()))
            except Exception as exc:
                logger.error("Failed to update business profile: %s", exc)

    return {
        "status": "completed",
        "pages_fetched": len(pages),
        "schema_org_fields": list(all_schema_org.keys()),
        "llm_extracted_fields": list(llm_extracted.keys()),
        "fields_updated": list(updates.keys()),
        "updates": updates,
    }
