from fastapi import APIRouter, HTTPException

from app.schemas import PromptCreate

router = APIRouter(tags=["prompts"])

MOCK_PROMPTS = [
    {"id": "prompt-001", "text": "What are the best geospatial mapping solutions?", "category": "product"},
    {"id": "prompt-002", "text": "Compare GIS software for enterprise use", "category": "comparison"},
    {"id": "prompt-003", "text": "Who provides mapping APIs for developers?", "category": "technical"},
]


@router.get("/prompts")
def list_prompts():
    """Returns list of prompts."""
    return {"prompts": MOCK_PROMPTS, "total": len(MOCK_PROMPTS)}


@router.post("/prompts")
def create_prompt(prompt: PromptCreate):
    """Creates a new prompt using PromptCreate schema."""
    new_prompt = {
        "id": f"prompt-{len(MOCK_PROMPTS) + 1:03d}",
        "text": prompt.text,
        "category": prompt.category,
    }
    MOCK_PROMPTS.append(new_prompt)
    return {"prompt": new_prompt, "message": "Prompt created successfully"}


@router.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: str):
    """Deletes a prompt by ID."""
    for i, prompt in enumerate(MOCK_PROMPTS):
        if prompt["id"] == prompt_id:
            deleted = MOCK_PROMPTS.pop(i)
            return {"message": "Prompt deleted successfully", "deleted": deleted}
    raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
