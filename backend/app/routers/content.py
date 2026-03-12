from fastapi import APIRouter, HTTPException

from app.schemas import ContentUpdate, DeployCorrection

router = APIRouter(tags=["content"])

MOCK_CONTENT = [
    {"id": "content-001", "section": "summary", "content": "GeoMav is a leading geospatial mapping platform..."},
    {"id": "content-002", "section": "llms_txt", "content": "GeoMav provides GIS solutions for enterprises..."},
    {"id": "content-003", "section": "json_ld", "content": '{"@type": "Organization", "name": "GeoMav"...}'},
]


@router.get("/content")
def get_content():
    """Returns content sections (summary, llms_txt, json_ld)."""
    return {"sections": MOCK_CONTENT}


@router.put("/content/{content_id}")
def update_content(content_id: str, update: ContentUpdate):
    """Updates content using ContentUpdate schema."""
    for section in MOCK_CONTENT:
        if section["id"] == content_id:
            section["content"] = update.content
            return {"section": section, "message": "Content updated successfully"}
    raise HTTPException(status_code=404, detail=f"Content {content_id} not found")


@router.post("/deploy-correction")
def deploy_correction(correction: DeployCorrection):
    """Deploys correction using DeployCorrection schema."""
    return {
        "message": "Correction deployed successfully",
        "claim_id": correction.claim_id,
        "correction_type": correction.correction_type,
        "deployment_id": "deploy-001",
        "status": "deployed",
    }
