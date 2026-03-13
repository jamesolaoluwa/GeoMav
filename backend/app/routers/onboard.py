import json
import logging
import re
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(tags=["onboard"])


class OnboardRequest(BaseModel):
    url: str


class OnboardSaveRequest(BaseModel):
    name: str
    website: str
    category: str
    description: Optional[str] = ""
    services: Optional[str] = ""
    pricing: Optional[str] = ""
    hours: Optional[str] = ""
    location: Optional[str] = ""
    user_id: Optional[str] = None


class OnboardScanRequest(BaseModel):
    business_id: str


def normalize_url(url: str) -> str:
    url = url.strip().rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url
    return url


def parse_llms_txt(text: str) -> dict:
    """Parse /llms.txt markdown format into structured business data."""
    result = {
        "name": "",
        "description": "",
        "category": "",
        "services": "",
        "pricing": "",
        "hours": "",
        "location": "",
    }

    lines = text.strip().split("\n")

    # Extract name from first heading
    for line in lines:
        if line.startswith("# ") and not line.startswith("## "):
            result["name"] = line[2:].strip()
            break

    # Extract description from blockquote
    for line in lines:
        if line.startswith("> "):
            result["description"] = line[2:].strip()
            break

    # Parse sections
    current_section = ""
    section_lines: list[str] = []

    for line in lines:
        if line.startswith("## "):
            if current_section and section_lines:
                content = "\n".join(section_lines).strip()
                section_lower = current_section.lower()
                if "product" in section_lower or "service" in section_lower:
                    result["services"] = content
                elif "pricing" in section_lower or "price" in section_lower:
                    result["pricing"] = content
                elif "hour" in section_lower or "schedule" in section_lower:
                    result["hours"] = content
                elif "location" in section_lower or "address" in section_lower or "contact" in section_lower:
                    result["location"] = content
                elif "about" in section_lower or "description" in section_lower:
                    if not result["description"]:
                        result["description"] = content

            current_section = line[3:].strip()
            section_lines = []
        elif current_section:
            section_lines.append(line)

    # Flush last section
    if current_section and section_lines:
        content = "\n".join(section_lines).strip()
        section_lower = current_section.lower()
        if "product" in section_lower or "service" in section_lower:
            result["services"] = content
        elif "pricing" in section_lower or "price" in section_lower:
            result["pricing"] = content
        elif "hour" in section_lower or "schedule" in section_lower:
            result["hours"] = content
        elif "location" in section_lower or "address" in section_lower or "contact" in section_lower:
            result["location"] = content

    return result


def parse_html_meta(html: str, url: str) -> dict:
    """Extract business info from HTML meta tags."""
    result = {
        "name": "",
        "description": "",
        "category": "",
        "services": "",
        "pricing": "",
        "hours": "",
        "location": "",
    }

    # Title
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()
        title = re.sub(r"\s*[|\-–—].*$", "", title)
        result["name"] = title

    # Meta description
    desc_match = re.search(
        r'<meta\s+(?:name=["\']description["\']\s+content=["\']([^"\']*)["\']|content=["\']([^"\']*)["\'].*?name=["\']description["\'])',
        html,
        re.IGNORECASE,
    )
    if desc_match:
        result["description"] = (desc_match.group(1) or desc_match.group(2) or "").strip()

    # OG title (fallback for name)
    og_title = re.search(
        r'<meta\s+(?:property=["\']og:title["\']\s+content=["\']([^"\']*)["\']|content=["\']([^"\']*)["\'].*?property=["\']og:title["\'])',
        html,
        re.IGNORECASE,
    )
    if og_title and not result["name"]:
        result["name"] = (og_title.group(1) or og_title.group(2) or "").strip()

    # OG description (fallback)
    og_desc = re.search(
        r'<meta\s+(?:property=["\']og:description["\']\s+content=["\']([^"\']*)["\']|content=["\']([^"\']*)["\'].*?property=["\']og:description["\'])',
        html,
        re.IGNORECASE,
    )
    if og_desc and not result["description"]:
        result["description"] = (og_desc.group(1) or og_desc.group(2) or "").strip()

    # Try to guess category from description keywords
    desc_lower = result["description"].lower()
    category_keywords = {
        "restaurant": "Restaurant",
        "bakery": "Bakery",
        "plumber": "Plumbing",
        "lawyer": "Legal",
        "dentist": "Dental",
        "salon": "Beauty",
        "gym": "Fitness",
        "hotel": "Hospitality",
        "agency": "Agency",
        "software": "Software",
        "consulting": "Consulting",
        "real estate": "Real Estate",
        "ecommerce": "E-commerce",
        "e-commerce": "E-commerce",
        "shop": "Retail",
        "store": "Retail",
    }
    for keyword, cat in category_keywords.items():
        if keyword in desc_lower:
            result["category"] = cat
            break

    if not result["category"]:
        result["category"] = "Business"

    return result


def strip_html_to_text(html: str) -> str:
    """Strip HTML to plain readable text, removing scripts, styles, and boilerplate."""
    text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<nav[^>]*>.*?</nav>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<footer[^>]*>.*?</footer>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<header[^>]*>.*?</header>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&#\d+;", "", text)
    text = re.sub(r"&\w+;", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:4000]


EXTRACTION_PROMPT = """You are a business information extractor. Given the text content from a business website, extract the following information and return it as a JSON object. Only include information you can actually find or confidently infer from the text. Leave fields empty ("") if the information is not available.

Return ONLY a valid JSON object with these exact keys:
{
  "name": "Business name",
  "category": "Business category (e.g., Restaurant, Bakery, Plumbing, Software, Agency, Retail, etc.)",
  "description": "A 1-2 sentence description of what the business does",
  "services": "Comma-separated list of main services or products offered",
  "pricing": "Any pricing information found (e.g., '$19/mo - $99/mo' or 'Contact for pricing')",
  "hours": "Business hours if found (e.g., 'Mon-Fri 9am-6pm')",
  "location": "Business location if found (e.g., 'Austin, TX')"
}

Do NOT include any explanation or markdown. Return ONLY the JSON object."""


async def extract_with_ai(website_text: str, url: str) -> Optional[dict]:
    """Use GPT-4o-mini to extract structured business info from website text."""
    settings = get_settings()
    if not settings.openai_api_key:
        return None

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": EXTRACTION_PROMPT},
                {"role": "user", "content": f"Website URL: {url}\n\nWebsite content:\n{website_text}"},
            ],
            max_tokens=500,
            temperature=0.1,
        )

        content = response.choices[0].message.content or ""
        content = content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

        parsed = json.loads(content)

        result = {
            "name": str(parsed.get("name", "") or ""),
            "category": str(parsed.get("category", "") or "Business"),
            "description": str(parsed.get("description", "") or ""),
            "services": str(parsed.get("services", "") or ""),
            "pricing": str(parsed.get("pricing", "") or ""),
            "hours": str(parsed.get("hours", "") or ""),
            "location": str(parsed.get("location", "") or ""),
        }

        logger.info(f"AI extraction successful for {url}: {result.get('name')}")
        return result

    except json.JSONDecodeError as e:
        logger.warning(f"AI returned invalid JSON for {url}: {e}")
        return None
    except Exception as e:
        logger.warning(f"AI extraction failed for {url}: {e}")
        return None


FALLBACK_TEMPLATES = [
    "best {category} near me",
    "best {category} 2026",
    "top {category} services",
    "{name} reviews",
    "is {name} good",
    "what is {name}",
    "tell me about {name}",
    "{name} vs competitors",
    "recommend a {category}",
    "{name} pricing",
]

QUERY_GEN_PROMPT = """You are a GEO (Generative Engine Optimization) expert. Given a business profile, generate 15 realistic search queries that a potential customer would type into an AI assistant (ChatGPT, Claude, Perplexity, etc.) when looking for this type of business or its specific services.

The queries should:
- Be natural language questions/searches a real person would ask
- Cover the business name directly (e.g. "is [name] good", "tell me about [name]")
- Cover the business category and services (e.g. "best [service] in [location]")
- Cover comparison and recommendation queries (e.g. "top [category] companies")
- Include location if provided
- Be specific to what this business actually offers, not generic

Return ONLY a JSON array of strings. No explanation, no markdown. Example:
["query one", "query two", "query three"]

Business profile:
- Name: {name}
- Category: {category}
- Description: {description}
- Services: {services}
- Location: {location}
- Pricing: {pricing}"""


async def generate_smart_queries(profile: dict) -> list[str]:
    """Use GPT to generate business-specific queries from the full profile."""
    settings = get_settings()
    if not settings.openai_api_key:
        return []

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=20)

        prompt = QUERY_GEN_PROMPT.format(
            name=profile.get("name", ""),
            category=profile.get("category", "Business"),
            description=profile.get("description", ""),
            services=profile.get("services", ""),
            location=profile.get("location", ""),
            pricing=profile.get("pricing", ""),
        )

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7,
        )

        content = (response.choices[0].message.content or "").strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

        queries = json.loads(content)
        if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
            return queries[:15]
    except Exception as e:
        logger.warning("AI query generation failed: %s", e)

    return []


@router.post("/onboard")
async def analyze_website(req: OnboardRequest):
    """Fetch and parse /llms.txt or fall back to HTML meta tags."""
    url = normalize_url(req.url)
    source = "unknown"
    profile = None

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        # Try /llms.txt first
        try:
            llms_resp = await client.get(f"{url}/llms.txt")
            if llms_resp.status_code == 200 and len(llms_resp.text.strip()) > 20:
                profile = parse_llms_txt(llms_resp.text)
                source = "llms.txt"
        except Exception:
            pass

        # Fallback: fetch HTML, try AI extraction, then fall back to meta tags
        if not profile or not profile.get("name"):
            try:
                html_resp = await client.get(url)
                if html_resp.status_code == 200:
                    html_text = html_resp.text

                    # Try AI extraction first
                    plain_text = strip_html_to_text(html_text)
                    if plain_text and len(plain_text) > 50:
                        ai_profile = await extract_with_ai(plain_text, url)
                        if ai_profile and ai_profile.get("name"):
                            profile = ai_profile
                            source = "ai_extraction"

                    # Fall back to meta tag parsing
                    if not profile or not profile.get("name"):
                        profile = parse_html_meta(html_text, url)
                        source = "meta_tags"
            except Exception as e:
                logger.warning(f"Failed to fetch {url}: {e}")

        # Also try robots.txt for sitemap info
        robots_info = ""
        try:
            robots_resp = await client.get(f"{url}/robots.txt")
            if robots_resp.status_code == 200:
                robots_info = robots_resp.text[:500]
        except Exception:
            pass

    if not profile:
        profile = {
            "name": "",
            "description": "",
            "category": "Business",
            "services": "",
            "pricing": "",
            "hours": "",
            "location": "",
        }

    profile["website"] = url
    if robots_info:
        profile["robots_txt_found"] = True

    return {
        "profile": profile,
        "source": source,
        "url": url,
    }


@router.post("/onboard/save")
async def save_profile(req: OnboardSaveRequest):
    """Save the business profile and generate initial queries."""
    try:
        supabase = get_supabase()

        biz_data = {
            "name": req.name,
            "website": req.website,
            "category": req.category,
            "description": req.description,
            "services": req.services,
            "pricing": req.pricing,
            "hours": req.hours,
            "location": req.location,
        }
        if req.user_id:
            biz_data["user_id"] = req.user_id

        result = supabase.table("businesses").insert(biz_data).execute()
        business = result.data[0] if result.data else None

        if not business:
            raise HTTPException(status_code=500, detail="Failed to create business")

        business_id = business["id"]

        profile = {
            "name": req.name,
            "category": req.category,
            "description": req.description or "",
            "services": req.services or "",
            "location": req.location or "",
            "pricing": req.pricing or "",
        }
        smart_queries = await generate_smart_queries(profile)

        if not smart_queries:
            location = req.location or ""
            smart_queries = []
            for template in FALLBACK_TEMPLATES:
                if "{location}" in template and not location:
                    continue
                smart_queries.append(template.format(
                    category=req.category.lower(),
                    name=req.name,
                    location=location,
                ))

        queries = [
            {"text": q, "category": req.category, "business_id": business_id}
            for q in smart_queries
        ]

        if queries:
            supabase.table("queries").insert(queries).execute()

        try:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            supabase.table("business_journey").insert({
                "business_id": business_id,
                "current_phase": 2,
                "phase1_completed_at": now,
            }).execute()
        except Exception:
            pass

        return {
            "business_id": business_id,
            "business": business,
            "queries_generated": len(queries),
            "queries": smart_queries,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboard save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/onboard/scan")
async def run_initial_scan(req: OnboardScanRequest, background_tasks: BackgroundTasks):
    """Run initial AI visibility scan for the onboarded business."""
    try:
        supabase = get_supabase()

        # Get business info
        biz_result = supabase.table("businesses").select("*").eq("id", req.business_id).execute()
        if not biz_result.data:
            raise HTTPException(status_code=404, detail="Business not found")
        business = biz_result.data[0]

        queries_result = supabase.table("queries").select("id, text").eq("business_id", req.business_id).execute()
        query_rows = queries_result.data or []
        prompts = [q["text"] for q in query_rows]
        query_ids = [q["id"] for q in query_rows]

        if not prompts:
            prompts = [f"best {business.get('category', 'business')} near me"]
            query_ids = []

        scan_prompts = prompts[:10]
        scan_query_ids = query_ids[:10] if len(query_ids) >= len(scan_prompts) else []

        from app.agents.analytics import run_analytics_scan

        async def _run_scan():
            try:
                result = await run_analytics_scan(
                    prompts=scan_prompts,
                    business_name=business.get("name", ""),
                    business_id=req.business_id,
                    query_ids=scan_query_ids,
                    supabase_client=supabase,
                    query_ids=scan_query_ids,
                    business_id=req.business_id,
                )
                logger.info(f"Initial scan complete: {result.get('visibility_score', 0)}% visibility")
            except Exception as e:
                logger.error(f"Initial scan failed: {e}")

        background_tasks.add_task(_run_scan)

        job_id = str(uuid.uuid4())

        return {
            "job_id": job_id,
            "status": "scanning",
            "business_name": business.get("name", ""),
            "queries_count": len(scan_prompts),
            "queries": scan_prompts,
            "llms": ["ChatGPT", "Gemini", "Claude", "Perplexity", "Bing", "DeepSeek"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboard scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
