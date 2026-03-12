from fastapi import APIRouter
import uuid

router = APIRouter(tags=["scans"])


@router.post("/run-scan")
def run_scan():
    """Triggers a scan. Returns job_id and status for now."""
    job_id = str(uuid.uuid4())
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Scan has been queued for execution",
    }
