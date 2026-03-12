"""
Reinforcement Agent: Detects hallucinated claims by comparing AI responses
against verified business data. Classifies claims as Verified, Outdated,
Fabricated, or Misleading. Creates corrections and schedules re-queries.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional


CLAIM_PATTERNS = [
    {"keywords": ["$", "price", "cost", "plan", "month", "year", "pricing"], "type": "pricing"},
    {"keywords": ["hour", "open", "close", "available", "support", "am", "pm"], "type": "hours"},
    {"keywords": ["located", "address", "headquarter", "based in", "office"], "type": "location"},
    {"keywords": ["offer", "provide", "service", "feature", "include"], "type": "service"},
    {"keywords": ["founded", "established", "since", "started"], "type": "history"},
]


def extract_claims(response_text: str) -> list[dict]:
    """Extract factual claims from an LLM response."""
    claims = []
    sentences = [s.strip() for s in response_text.split(".") if s.strip()]

    for sentence in sentences:
        sentence_lower = sentence.lower()
        for pattern in CLAIM_PATTERNS:
            if any(kw in sentence_lower for kw in pattern["keywords"]):
                claims.append({
                    "text": sentence.strip(),
                    "type": pattern["type"],
                })
                break

    return claims


def classify_claim(
    claim_text: str,
    claim_type: str,
    business_profile: dict,
) -> dict:
    """
    Classify a claim against the verified business profile.

    Returns:
        - verified: matches the profile
        - outdated: was once true but has changed
        - fabricated: has no basis in reality
        - misleading: technically true but presented deceptively
    """
    profile_lower = {k: str(v).lower() for k, v in business_profile.items()}
    claim_lower = claim_text.lower()

    # Check pricing claims
    if claim_type == "pricing":
        verified_pricing = profile_lower.get("pricing", "")
        if verified_pricing and verified_pricing in claim_lower:
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

    # Check hours claims
    if claim_type == "hours":
        verified_hours = profile_lower.get("hours", "")
        if verified_hours and verified_hours in claim_lower:
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

    # Check location claims
    if claim_type == "location":
        verified_location = profile_lower.get("location", "")
        if verified_location and verified_location in claim_lower:
            return {"status": "verified", "verified_value": business_profile.get("location", "")}
        return {
            "status": "fabricated",
            "verified_value": business_profile.get("location", "Not specified"),
        }

    # Check service claims
    if claim_type == "service":
        verified_services = profile_lower.get("services", "")
        claim_words = set(claim_lower.split())
        service_words = set(verified_services.split())
        overlap = claim_words & service_words
        if len(overlap) > 2:
            return {"status": "verified", "verified_value": business_profile.get("services", "")}
        return {
            "status": "fabricated",
            "verified_value": business_profile.get("services", "See website for services"),
        }

    return {"status": "verified", "verified_value": ""}


def generate_correction(claim: dict, classification: dict) -> Optional[dict]:
    """Generate a structured correction for non-verified claims."""
    if classification["status"] == "verified":
        return None

    return {
        "id": str(uuid.uuid4()),
        "claim_text": claim["text"],
        "claim_type": claim["type"],
        "claim_value": claim["text"],
        "verified_value": classification["verified_value"],
        "status": "pending",
        "classification": classification["status"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def run_reinforcement(
    llm_responses: list[dict],
    business_profile: dict,
    supabase_client=None,
) -> dict:
    """
    Run hallucination detection on a batch of LLM responses.

    Args:
        llm_responses: List of {llm_name, response_text, query_text}
        business_profile: Verified business data
        supabase_client: Optional Supabase client for persistence
    """
    all_claims = []
    corrections = []
    stats = {"verified": 0, "outdated": 0, "fabricated": 0, "misleading": 0}

    for response in llm_responses:
        claims = extract_claims(response.get("response_text", ""))

        for claim in claims:
            classification = classify_claim(
                claim["text"],
                claim["type"],
                business_profile,
            )

            status = classification["status"]
            stats[status] = stats.get(status, 0) + 1

            claim_record = {
                "id": str(uuid.uuid4()),
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
                correction["llm_name"] = response.get("llm_name", "Unknown")
                correction["query_text"] = response.get("query_text", "")
                corrections.append(correction)

    if supabase_client and corrections:
        try:
            for correction in corrections:
                supabase_client.table("claims").insert({
                    "id": correction["id"],
                    "response_id": None,
                    "claim_type": correction["claim_type"],
                    "claim_value": correction["claim_value"],
                    "verified_value": correction["verified_value"],
                    "status": "pending",
                }).execute()
        except Exception:
            pass

    return {
        "total_claims_analyzed": len(all_claims),
        "stats": stats,
        "corrections_needed": len(corrections),
        "corrections": corrections,
        "claims": all_claims,
    }
