from fastapi import APIRouter

from app.schemas import BusinessUpdate

router = APIRouter(tags=["business"])

MOCK_BUSINESS = {
    "id": "biz-001",
    "name": "GeoMav",
    "website": "https://geomav.com",
    "category": "Geospatial Software",
    "description": "Leading provider of GIS and mapping solutions",
    "founded": "2020",
    "headquarters": "Austin, TX",
}


@router.get("/business")
def get_business():
    """Returns business profile."""
    return MOCK_BUSINESS


@router.put("/business")
def update_business(update: BusinessUpdate):
    """Updates business using BusinessUpdate schema."""
    if update.name is not None:
        MOCK_BUSINESS["name"] = update.name
    if update.website is not None:
        MOCK_BUSINESS["website"] = update.website
    if update.category is not None:
        MOCK_BUSINESS["category"] = update.category
    return {"business": MOCK_BUSINESS, "message": "Business updated successfully"}
