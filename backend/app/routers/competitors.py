from fastapi import APIRouter

router = APIRouter(tags=["competitors"])


@router.get("/competitors")
def get_competitors():
    """Returns competitor visibility data with rankings and sentiment."""
    return {
        "competitors": [
            {
                "id": "comp-001",
                "name": "Competitor A",
                "visibility_score": 92,
                "ranking": 1,
                "sentiment": "positive",
                "sentiment_score": 0.85,
                "mentions": 156,
                "trend": "up",
            },
            {
                "id": "comp-002",
                "name": "Competitor B",
                "visibility_score": 84,
                "ranking": 2,
                "sentiment": "positive",
                "sentiment_score": 0.78,
                "mentions": 124,
                "trend": "stable",
            },
            {
                "id": "comp-003",
                "name": "GeoMav",
                "visibility_score": 78,
                "ranking": 3,
                "sentiment": "positive",
                "sentiment_score": 0.72,
                "mentions": 98,
                "trend": "up",
            },
        ],
        "market_leader": "Competitor A",
        "your_ranking": 3,
    }
