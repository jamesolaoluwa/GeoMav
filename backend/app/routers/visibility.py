from fastapi import APIRouter
from typing import Optional

router = APIRouter(tags=["visibility"])


@router.get("/visibility")
def get_visibility(filter: Optional[str] = None):
    """Returns visibility history, brand rankings, topic rankings, query responses.
    Optional filter: all_time, daily, weekly."""
    return {
        "visibility_history": [
            {"date": "2025-03-01", "score": 65},
            {"date": "2025-03-02", "score": 67},
            {"date": "2025-03-03", "score": 69},
            {"date": "2025-03-04", "score": 71},
            {"date": "2025-03-05", "score": 73},
            {"date": "2025-03-06", "score": 75},
            {"date": "2025-03-07", "score": 76},
            {"date": "2025-03-08", "score": 77},
            {"date": "2025-03-09", "score": 78},
        ],
        "brand_rankings": [
            {"brand": "GeoMav", "rank": 3, "score": 78},
            {"brand": "Competitor A", "rank": 1, "score": 92},
            {"brand": "Competitor B", "rank": 2, "score": 84},
        ],
        "topic_rankings": [
            {"topic": "geospatial software", "rank": 2, "mentions": 45},
            {"topic": "mapping solutions", "rank": 4, "mentions": 32},
            {"topic": "GIS tools", "rank": 3, "mentions": 28},
        ],
        "query_responses": [
            {"query": "best geospatial mapping software", "response_rate": 0.85},
            {"query": "GIS solutions for businesses", "response_rate": 0.72},
            {"query": "mapping API providers", "response_rate": 0.68},
        ],
        "filter_applied": filter or "all_time",
    }
