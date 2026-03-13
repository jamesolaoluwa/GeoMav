"""
Estimator Agent: Uses OpenAI to generate realistic, industry-specific
dashboard metrics and competitor data. Returns estimates only; never writes
to Supabase so real scan data is not polluted.
"""

import json
import logging
import re
import uuid

from app.config import get_settings

logger = logging.getLogger(__name__)

ESTIMATION_PROMPT = """You are a GEO (Generative Engine Optimization) analyst.
Given a business profile, produce a realistic competitive landscape and AI-visibility report.

Business:
- Name: {name}
- Category: {category}
- Description: {description}
- Services: {services}
- Location: {location}

Return ONLY a valid JSON object (no markdown fences) with these exact keys:

{{
  "truth_score": <number 50-95>,
  "truth_score_change": <number -5 to 5>,
  "claim_accuracy": <number 40-90>,
  "claim_accuracy_change": <number -5 to 5>,
  "visibility_score": <number 20-80>,
  "visibility_change": <number -5 to 5>,
  "brand_ranking": <number 1-6>,
  "brand_ranking_total": <number 5-8>,
  "active_hallucinations": <number 2-12>,
  "competitors": [
    {{"name": "<REAL competitor business name>", "visibility_score": <20-85>, "change": <-5 to 5>}},
    ... exactly 4 real competitors in the same industry and region
  ],
  "topic_rankings": [
    {{"topic": "<industry topic>", "status": "strong|needs_work|not_ranked",
      "rankings": [{{"rank": 1, "brand": "<name>"}}, {{"rank": 2, "brand": "<name>"}}, ...]}},
    ... 3-5 topics relevant to the category
  ],
  "query_responses": [
    {{"query": "<realistic user query about this category>",
      "llm_name": "<ChatGPT|Gemini|Claude|Perplexity>",
      "brand_mentioned": true|false,
      "rank": <number or null>,
      "sentiment": "positive|neutral|negative"}},
    ... 8-12 entries mixing true/false mentions
  ],
  "sentiment_overview": {{"positive": <0-1>, "neutral": <0-1>, "negative": <0-1>}}
}}

IMPORTANT:
- Competitors MUST be real businesses that operate in the same category and region.
  For a florist in Little Rock AR, name actual local/regional florists or national floral brands.
  NEVER use placeholder names like "Competitor A".
- The business itself ("{name}") should NOT appear in the competitors array.
- Make sure visibility scores vary realistically between competitors.
- topic_rankings should include the business itself in the rankings array.
- Be specific: use real city names, real brand names, real query patterns."""

FLORIST_COMPETITORS = [
    {"name": "1-800-Flowers", "visibility_score": 72, "change": 2.1},
    {"name": "FTD", "visibility_score": 65, "change": -1.3},
    {"name": "ProFlowers", "visibility_score": 58, "change": 0.8},
    {"name": "The Bouqs Co.", "visibility_score": 44, "change": 3.2},
]

CATEGORY_COMPETITORS = {
    "Florist": FLORIST_COMPETITORS,
    "Flower Shop": FLORIST_COMPETITORS,
    "Software": [
        {"name": "GitHub", "visibility_score": 78, "change": 1.5},
        {"name": "GitLab", "visibility_score": 62, "change": -0.8},
        {"name": "Atlassian", "visibility_score": 55, "change": 2.1},
        {"name": "JetBrains", "visibility_score": 48, "change": 0.3},
    ],
    "Restaurant": [
        {"name": "Chipotle", "visibility_score": 74, "change": 1.2},
        {"name": "Panera Bread", "visibility_score": 61, "change": -0.5},
        {"name": "Sweetgreen", "visibility_score": 53, "change": 2.8},
        {"name": "Cava", "visibility_score": 45, "change": 1.1},
    ],
    "E-commerce": [
        {"name": "Shopify", "visibility_score": 82, "change": 0.9},
        {"name": "WooCommerce", "visibility_score": 64, "change": -1.1},
        {"name": "BigCommerce", "visibility_score": 51, "change": 1.4},
        {"name": "Magento", "visibility_score": 43, "change": -0.6},
    ],
    "Agency": [
        {"name": "Accenture", "visibility_score": 76, "change": 0.7},
        {"name": "Deloitte Digital", "visibility_score": 68, "change": 1.3},
        {"name": "WPP", "visibility_score": 54, "change": -0.4},
        {"name": "Publicis", "visibility_score": 47, "change": 0.9},
    ],
    "Retail": [
        {"name": "Amazon", "visibility_score": 89, "change": 0.3},
        {"name": "Target", "visibility_score": 71, "change": 1.1},
        {"name": "Walmart", "visibility_score": 68, "change": -0.2},
        {"name": "Best Buy", "visibility_score": 52, "change": -1.0},
    ],
    "Bakery": [
        {"name": "Nothing Bundt Cakes", "visibility_score": 63, "change": 2.5},
        {"name": "Crumbl Cookies", "visibility_score": 58, "change": 3.1},
        {"name": "Panera Bread", "visibility_score": 72, "change": 0.4},
        {"name": "Magnolia Bakery", "visibility_score": 49, "change": 1.2},
    ],
    "Dental": [
        {"name": "Aspen Dental", "visibility_score": 69, "change": 1.0},
        {"name": "Heartland Dental", "visibility_score": 56, "change": -0.7},
        {"name": "Pacific Dental", "visibility_score": 48, "change": 1.8},
        {"name": "Smile Direct Club", "visibility_score": 42, "change": -2.1},
    ],
    "Legal": [
        {"name": "LegalZoom", "visibility_score": 75, "change": 0.5},
        {"name": "Avvo", "visibility_score": 61, "change": -1.2},
        {"name": "FindLaw", "visibility_score": 53, "change": 0.8},
        {"name": "Justia", "visibility_score": 44, "change": 1.6},
    ],
    "Auto Detailing": [
        {"name": "Meineke", "visibility_score": 62, "change": 0.9},
        {"name": "Maaco", "visibility_score": 55, "change": -0.3},
        {"name": "DetailXPerts", "visibility_score": 41, "change": 2.4},
        {"name": "Ziebart", "visibility_score": 38, "change": 0.6},
    ],
}

LLMS = ["ChatGPT", "Gemini", "Claude", "Perplexity"]


def _mock_estimate(business_name: str, category: str) -> dict:
    """Deterministic fallback when no LLM key is available."""
    comp_templates = CATEGORY_COMPETITORS.get(category)
    if not comp_templates:
        for key in CATEGORY_COMPETITORS:
            if key.lower() in category.lower() or category.lower() in key.lower():
                comp_templates = CATEGORY_COMPETITORS[key]
                break
    if not comp_templates:
        comp_templates = [
            {"name": f"Top {category} Brand A", "visibility_score": 68, "change": 1.2},
            {"name": f"Top {category} Brand B", "visibility_score": 55, "change": -0.8},
            {"name": f"Top {category} Brand C", "visibility_score": 44, "change": 2.1},
            {"name": f"Top {category} Brand D", "visibility_score": 36, "change": 0.4},
        ]

    own_visibility = 38.0
    competitors = [{"name": c["name"], "visibility_score": c["visibility_score"],
                     "change": c["change"], "is_own": False} for c in comp_templates]
    competitors.append({"name": business_name, "visibility_score": own_visibility, "change": 2.8, "is_own": True})
    competitors.sort(key=lambda c: c["visibility_score"], reverse=True)

    all_brands = [c["name"] for c in competitors]

    topics = [
        {"topic": f"Best {category}", "status": "needs_work",
         "rankings": [{"rank": i + 1, "brand": b} for i, b in enumerate(all_brands[:5])]},
        {"topic": f"{category} Reviews", "status": "needs_work",
         "rankings": [{"rank": i + 1, "brand": b} for i, b in enumerate(all_brands[:5])]},
        {"topic": f"{category} Near Me", "status": "not_ranked",
         "rankings": [{"rank": i + 1, "brand": b} for i, b in enumerate(all_brands[:5])]},
    ]

    query_templates = [
        f"best {category.lower()} near me",
        f"top {category.lower()} 2026",
        f"is {business_name} good",
        f"{business_name} reviews",
        f"recommend a {category.lower()}",
        f"{business_name} vs {comp_templates[0]['name']}",
        f"affordable {category.lower()}",
        f"{business_name} pricing",
    ]
    sentiments = ["positive", "neutral", "positive", "neutral", "negative", "positive", "neutral", "positive"]
    query_responses = []
    for i, qt in enumerate(query_templates):
        mentioned = i % 3 != 2
        query_responses.append({
            "id": f"est-{i}",
            "query": qt,
            "llm_name": LLMS[i % len(LLMS)],
            "brand_mentioned": mentioned,
            "rank": (i % 5) + 1 if mentioned else None,
            "sentiment": sentiments[i % len(sentiments)],
        })

    brand_ranking = next((i + 1 for i, c in enumerate(competitors) if c["is_own"]), len(competitors))

    return {
        "truth_score": 68.0,
        "truth_score_change": 2.4,
        "claim_accuracy": 61.0,
        "claim_accuracy_change": 1.8,
        "visibility_score": own_visibility,
        "visibility_change": 2.8,
        "brand_ranking": brand_ranking,
        "brand_ranking_total": len(competitors),
        "active_hallucinations": 7,
        "competitors": competitors,
        "topic_rankings": topics,
        "query_responses": query_responses,
        "sentiment_overview": {"positive": 0.50, "neutral": 0.35, "negative": 0.15},
        "estimated": True,
    }


async def estimate_metrics(business_profile: dict) -> dict:
    """Generate estimated metrics using LLM, then fall back to deterministic data."""
    name = business_profile.get("name", "Your Brand")
    category = business_profile.get("category", "Business")

    settings = get_settings()
    if not settings.openai_api_key:
        return _mock_estimate(name, category)

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=30)
        prompt = ESTIMATION_PROMPT.format(
            name=name,
            category=category,
            description=business_profile.get("description", ""),
            services=business_profile.get("services", ""),
            location=business_profile.get("location", ""),
        )

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7,
        )

        content = (response.choices[0].message.content or "").strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

        data = json.loads(content)
        data["estimated"] = True

        for comp in data.get("competitors", []):
            comp["is_own"] = False
        own_vis = data.get("visibility_score", 38)
        data["competitors"].append({
            "name": name,
            "visibility_score": own_vis,
            "change": data.get("visibility_change", 0),
            "is_own": True,
        })
        data["competitors"].sort(key=lambda c: c["visibility_score"], reverse=True)

        brand_ranking = next(
            (i + 1 for i, c in enumerate(data["competitors"]) if c.get("is_own")),
            len(data["competitors"]),
        )
        data["brand_ranking"] = brand_ranking
        data["brand_ranking_total"] = len(data["competitors"])

        for qr in data.get("query_responses", []):
            if "id" not in qr:
                qr["id"] = f"est-{uuid.uuid4().hex[:6]}"

        return data

    except Exception as exc:
        logger.warning("LLM estimation failed, using mock: %s", exc)
        return _mock_estimate(name, category)


