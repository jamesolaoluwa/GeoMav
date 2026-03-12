from fastapi import APIRouter
from typing import Optional

router = APIRouter(tags=["shopping"])


@router.get("/shopping")
def get_shopping(filter: Optional[str] = None):
    """Returns shopping/product visibility results.
    Optional filter: all_time, daily, weekly."""
    return {
        "product_visibility": [
            {
                "product": "GeoMav Pro",
                "visibility_score": 82,
                "mentions": 45,
                "ranking": 2,
                "category": "enterprise",
            },
            {
                "product": "GeoMav API",
                "visibility_score": 76,
                "mentions": 38,
                "ranking": 3,
                "category": "developer",
            },
            {
                "product": "GeoMav Lite",
                "visibility_score": 68,
                "mentions": 28,
                "ranking": 4,
                "category": "starter",
            },
        ],
        "shopping_queries": [
            {"query": "best GIS software to buy", "appearance_rate": 0.72},
            {"query": "geospatial mapping software pricing", "appearance_rate": 0.65},
            {"query": "GIS tools for small business", "appearance_rate": 0.58},
        ],
        "filter_applied": filter or "all_time",
    }
