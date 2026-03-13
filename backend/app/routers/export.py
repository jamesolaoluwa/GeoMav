import csv
import io
import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["export"])

EXPORT_TYPES = {"mentions", "claims", "competitors", "visibility", "full"}


def _query_table(supabase, table: str, date_from: Optional[str], date_to: Optional[str]):
    try:
        q = supabase.table(table).select("*")
        date_col = "snapshot_date" if table == "visibility_snapshots" else "created_at"
        if date_from:
            q = q.gte(date_col, date_from)
        if date_to:
            q = q.lte(date_col, date_to)
        return q.execute().data or []
    except Exception as exc:
        err_msg = str(exc)
        if "PGRST205" in err_msg or "schema cache" in err_msg:
            logger.warning("Table '%s' not yet migrated, returning empty", table)
            return []
        raise


def _rows_to_csv(rows: list[dict]) -> str:
    if not rows:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


@router.get("/export")
def export_data(
    type: str = "full",
    format: str = "json",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    if type not in EXPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of: {', '.join(EXPORT_TYPES)}")
    if format not in ("csv", "json"):
        raise HTTPException(status_code=400, detail="Format must be csv or json")

    try:
        supabase = get_supabase()
        result: dict = {}

        if type in ("mentions", "full"):
            result["mentions"] = _query_table(supabase, "mentions", date_from, date_to)

        if type in ("claims", "full"):
            result["claims"] = _query_table(supabase, "claims", date_from, date_to)

        if type in ("competitors", "full"):
            result["competitors"] = _query_table(supabase, "competitors", date_from, date_to)

        if type in ("visibility", "full"):
            result["visibility_snapshots"] = _query_table(supabase, "visibility_snapshots", date_from, date_to)

        if type == "full":
            result["llm_responses"] = _query_table(supabase, "llm_responses", date_from, date_to)

        if format == "json":
            body = result if type == "full" else result.get(type, result.get("visibility_snapshots", []))
            return StreamingResponse(
                iter([json.dumps(body, indent=2, default=str)]),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=geomav-{type}-export.json"},
            )

        if type == "full":
            sections = []
            for section_name, rows in result.items():
                if rows:
                    sections.append(f"--- {section_name} ---\n")
                    sections.append(_rows_to_csv(rows))
                    sections.append("\n")
            csv_content = "\n".join(sections)
        else:
            rows = result.get(type, result.get("visibility_snapshots", []))
            csv_content = _rows_to_csv(rows)

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=geomav-{type}-export.csv"},
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Export failed: %s", exc)
        raise HTTPException(status_code=500, detail="Export failed")
