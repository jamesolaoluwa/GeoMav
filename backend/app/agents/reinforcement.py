"""
Reinforcement Agent: Detects hallucinated claims by comparing AI responses
against verified business data. Classifies claims as Verified, Outdated,
Fabricated, or Misleading. Creates corrections and schedules re-queries.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

log = logging.getLogger(__name__)

CLAIM_PATTERNS = [
    {"keywords": ["$", "price", "cost", "plan", "month", "year", "pricing"], "type": "pricing"},
    {"keywords": ["hour", "open", "close", "am", "pm", "24/7", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], "type": "hours"},
    {"keywords": ["located", "address", "headquarter", "based in", "office in"], "type": "location"},
    {"keywords": ["founded", "established", "since", "started in"], "type": "history"},
    {"keywords": ["offer", "provide", "specialize"], "type": "service"},
]

VAGUE_INDICATORS = {
    "check their website", "contact them", "visit their", "i'm not sure",
    "i don't have", "not available", "no information", "for more details",
    "i recommend", "you should", "you might", "consider", "it depends",
    "based on my analysis", "looking at the best", "according to recent",
    "for this category", "popular options", "i would highlight",
    "several other", "various features", "different needs",
    "these recommendations", "without a specified", "most profitable",
}

GENERIC_RESPONSE_INDICATORS = {
    "most profitable options", "high-margin", "saas", "affiliate marketing",
    "online courses", "food trucks", "recurring revenue", "proven demand",
    "digital scalability", "aging populations", "wellness demand",
    "low-overhead", "[1]", "[2]", "[3]", "**",
}


def _is_generic_response(response_text: str) -> bool:
    """Detect responses that are generic/off-topic rather than business-specific."""
    text_lower = response_text.lower()
    hits = sum(1 for ind in GENERIC_RESPONSE_INDICATORS if ind in text_lower)
    return hits >= 3


def _clean_claim_text(text: str) -> str:
    """Clean up claim text for display — strip markdown, citations, and truncate."""
    import re
    cleaned = re.sub(r"\*\*", "", text)
    cleaned = re.sub(r"\[[\d,\s]+\]", "", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    if len(cleaned) > 200:
        cleaned = cleaned[:197] + "..."
    return cleaned


def extract_claims(response_text: str, brand_keywords: list[str] | None = None) -> list[dict]:
    """Extract factual claims from an LLM response.

    Only sentences that reference the business by name and contain a specific
    factual assertion pattern are treated as claims. Generic advice and vague
    suggestions are skipped.
    """
    if _is_generic_response(response_text):
        return []

    claims = []
    sentences = [s.strip() for s in response_text.split(".") if len(s.strip()) > 15]

    for sentence in sentences:
        sentence_lower = sentence.lower()

        if any(v in sentence_lower for v in VAGUE_INDICATORS):
            continue

        if brand_keywords and not any(kw in sentence_lower for kw in brand_keywords):
            continue

        for pattern in CLAIM_PATTERNS:
            if any(kw in sentence_lower for kw in pattern["keywords"]):
                claims.append({
                    "text": _clean_claim_text(sentence.strip()),
                    "type": pattern["type"],
                })
                break

    return claims


def classify_claim(
    claim_text: str,
    claim_type: str,
    business_profile: dict,
) -> Optional[dict]:
    """
    Classify a claim against the verified business profile.

    Returns None when the profile lacks data to verify, or a dict with:
        - verified: matches the profile
        - outdated: was once true but has changed
        - fabricated: has no basis in reality
        - misleading: technically true but presented deceptively
    """
    profile_lower = {k: str(v).lower() for k, v in business_profile.items()}
    claim_lower = claim_text.lower()

    if claim_type == "pricing":
        verified_pricing = profile_lower.get("pricing", "")
        if not verified_pricing:
            return None

        if verified_pricing in claim_lower:
            claim_words = set(claim_lower.split())
            misleading_qualifiers = {"only", "just", "starting", "from", "as low as", "free"}
            if claim_words & misleading_qualifiers and "starting" not in verified_pricing:
                return {"status": "misleading", "verified_value": business_profile.get("pricing", "")}
            return {"status": "verified", "verified_value": business_profile.get("pricing", "")}

        old_pricing = profile_lower.get("old_pricing", "")
        if old_pricing and old_pricing in claim_lower:
            return {
                "status": "outdated",
                "verified_value": business_profile.get("pricing", "Contact for pricing"),
            }

        return {
            "status": "fabricated",
            "verified_value": business_profile.get("pricing", "Contact for pricing"),
        }

    if claim_type == "hours":
        verified_hours = profile_lower.get("hours", "")
        if not verified_hours:
            return None

        if verified_hours in claim_lower:
            return {"status": "verified", "verified_value": business_profile.get("hours", "")}
        if "24/7" in claim_lower and "24/7" not in verified_hours:
            return {
                "status": "fabricated",
                "verified_value": business_profile.get("hours", "Mon-Fri 9am-6pm"),
            }
        return {
            "status": "outdated",
            "verified_value": business_profile.get("hours", "Mon-Fri 9am-6pm"),
        }

    if claim_type == "location":
        verified_location = profile_lower.get("location", "")
        if not verified_location:
            return None

        if verified_location in claim_lower:
            return {"status": "verified", "verified_value": business_profile.get("location", "")}
        return {
            "status": "fabricated",
            "verified_value": business_profile.get("location", "Not specified"),
        }

    if claim_type == "service":
        verified_services = profile_lower.get("services", "")
        if not verified_services:
            return None

        claim_words = set(claim_lower.split())
        service_words = set(verified_services.split())
        overlap = claim_words & service_words
        if len(overlap) > 2:
            return {"status": "verified", "verified_value": business_profile.get("services", "")}
        if len(overlap) == 1:
            return {"status": "misleading", "verified_value": business_profile.get("services", "")}
        return {
            "status": "fabricated",
            "verified_value": business_profile.get("services", "See website for services"),
        }

    if claim_type == "history":
        verified_desc = profile_lower.get("description", "")
        founded_year = profile_lower.get("founded_year", "")
        if not founded_year and not verified_desc:
            return None
        if founded_year and founded_year in claim_lower:
            return {"status": "verified", "verified_value": founded_year}
        if founded_year:
            import re
            year_match = re.search(r'\b(19|20)\d{2}\b', claim_lower)
            if year_match and year_match.group() != founded_year:
                return {"status": "fabricated", "verified_value": f"Founded {founded_year}"}
        return None

    return None


def _summarize_verified_value(verified_value: str, claim_type: str) -> str:
    """Produce a concise verified value suitable for display."""
    if not verified_value:
        return "Not specified"
    cleaned = verified_value.strip()
    if len(cleaned) > 150:
        items = [s.strip() for s in cleaned.replace("\n", ",").split(",") if s.strip()]
        if len(items) > 5:
            cleaned = ", ".join(items[:5]) + f" (+{len(items) - 5} more)"
        else:
            cleaned = cleaned[:147] + "..."
    return cleaned


def generate_correction(claim: dict, classification: dict) -> Optional[dict]:
    """Generate a structured correction for non-verified claims."""
    if classification["status"] == "verified":
        return None

    return {
        "id": str(uuid.uuid4()),
        "claim_text": claim["text"],
        "claim_type": claim["type"],
        "claim_value": _clean_claim_text(claim["text"]),
        "verified_value": _summarize_verified_value(classification["verified_value"], claim["type"]),
        "status": "pending",
        "classification": classification["status"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def run_reinforcement(
    llm_responses: list[dict],
    business_profile: dict,
    business_id: Optional[str] = None,
    supabase_client=None,
) -> dict:
    """
    Run hallucination detection on a batch of LLM responses.

    Args:
        llm_responses: List of {id, llm_name, response_text, query_text, query_id}
        business_profile: Verified business data
        supabase_client: Optional Supabase client for persistence
    """
    all_claims = []
    corrections = []
    stats = {"verified": 0, "outdated": 0, "fabricated": 0, "misleading": 0}

    biz_name = business_profile.get("name", "")
    brand_keywords = [biz_name.lower(), biz_name.lower().replace(" ", "")] if biz_name else None

    for response in llm_responses:
        claims = extract_claims(response.get("response_text", ""), brand_keywords)

        for claim in claims:
            classification = classify_claim(
                claim["text"],
                claim["type"],
                business_profile,
            )

            if classification is None:
                continue

            status = classification["status"]
            stats[status] = stats.get(status, 0) + 1

            claim_record = {
                "id": str(uuid.uuid4()),
                "response_id": response.get("id"),
                "llm_name": response.get("llm_name", "Unknown"),
                "query_text": response.get("query_text", ""),
                "claim_text": claim["text"],
                "claim_type": claim["type"],
                "classification": status,
                "verified_value": classification["verified_value"],
            }
            all_claims.append(claim_record)

            correction = generate_correction(claim, classification)
            if correction:
                correction["response_id"] = response.get("id")
                correction["llm_name"] = response.get("llm_name", "Unknown")
                correction["query_text"] = response.get("query_text", "")
                corrections.append(correction)

    if supabase_client and corrections:
        try:
            claim_rows = [
                {
                    "id": c["id"],
                    "response_id": c["response_id"],
                    "claim_type": c["claim_type"],
                    "claim_value": c["claim_value"],
                    "verified_value": c["verified_value"],
                    "status": "pending",
                }
                for c in corrections
            ]
            supabase_client.table("claims").insert(claim_rows).execute()
        except Exception as exc:
            log.warning("Batch claims insert failed: %s", exc)

    return {
        "total_claims_analyzed": len(all_claims),
        "stats": stats,
        "corrections_needed": len(corrections),
        "corrections": corrections,
        "claims": all_claims,
    }
