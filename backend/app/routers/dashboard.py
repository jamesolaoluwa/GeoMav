from fastapi import APIRouter

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard():
    """Returns mock dashboard metrics."""
    return {
        "visibility_score": 78,
        "brand_ranking": 3,
        "claim_accuracy": 92,
        "active_hallucinations": 2,
        "visibility_trend": [
            {"date": "2025-03-06", "score": 72},
            {"date": "2025-03-07", "score": 74},
            {"date": "2025-03-08", "score": 75},
            {"date": "2025-03-09", "score": 76},
            {"date": "2025-03-10", "score": 77},
            {"date": "2025-03-11", "score": 78},
        ],
        "llm_breakdown": [
            {"llm": "GPT-4", "visibility": 85, "mentions": 120},
            {"llm": "Claude", "visibility": 82, "mentions": 98},
            {"llm": "Gemini", "visibility": 71, "mentions": 65},
            {"llm": "Llama", "visibility": 68, "mentions": 45},
        ],
        "competitors": [
            {"name": "Competitor A", "ranking": 1, "visibility": 92},
            {"name": "Competitor B", "ranking": 2, "visibility": 84},
            {"name": "GeoMav", "ranking": 3, "visibility": 78},
        ],
    }
