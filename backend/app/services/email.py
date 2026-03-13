import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


def _get_resend():
    settings = get_settings()
    if not settings.resend_api_key:
        return None
    import resend
    resend.api_key = settings.resend_api_key
    return resend


def send_hallucination_alert(to_email: str, claims: list[dict[str, Any]]) -> bool:
    """Send an email alerting the user about new hallucinations found during a scan."""
    settings = get_settings()
    claims_html = "".join(
        f"<tr><td style='padding:8px;border:1px solid #e2e8f0'>{c.get('claim_value','')}</td>"
        f"<td style='padding:8px;border:1px solid #e2e8f0'>{c.get('verified_value','')}</td>"
        f"<td style='padding:8px;border:1px solid #e2e8f0'>{c.get('claim_type','')}</td></tr>"
        for c in claims
    )

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e293b">New Hallucinations Detected</h2>
      <p style="color:#475569">GeoMav found <strong>{len(claims)}</strong> new hallucination(s) during the latest scan.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Incorrect Claim</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Correct Value</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Type</th>
          </tr>
        </thead>
        <tbody>{claims_html}</tbody>
      </table>
      <p style="color:#475569">Log in to your <a href="http://localhost:3000/dashboard/hallucinations">GeoMav dashboard</a> to review and address these issues.</p>
    </div>
    """

    resend_mod = _get_resend()
    if resend_mod is None:
        logger.info("[DEV] Hallucination alert email to %s:\n%s", to_email, html)
        return True

    try:
        resend_mod.Emails.send({
            "from": settings.notification_from_email,
            "to": [to_email],
            "subject": f"GeoMav: {len(claims)} New Hallucination(s) Detected",
            "html": html,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send hallucination alert: %s", exc)
        return False


def send_weekly_report(to_email: str, report_data: dict[str, Any]) -> bool:
    """Send the weekly visibility report email."""
    settings = get_settings()
    score = report_data.get("visibility_score", "N/A")
    mention_count = report_data.get("mention_count", 0)
    new_claims = report_data.get("new_claims", 0)
    pending_claims = report_data.get("pending_claims", 0)

    opportunities = report_data.get("top_opportunities", [])
    opps_html = "".join(
        f"<li style='margin:4px 0'>{o.get('title', '')}</li>" for o in opportunities[:5]
    ) or "<li>No new opportunities</li>"

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e293b">Your Weekly GeoMav Report</h2>
      <div style="display:flex;gap:16px;margin:16px 0">
        <div style="flex:1;padding:16px;background:#f1f5f9;border-radius:8px;text-align:center">
          <p style="margin:0;color:#64748b;font-size:12px">Visibility Score</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1e293b">{score}</p>
        </div>
        <div style="flex:1;padding:16px;background:#f1f5f9;border-radius:8px;text-align:center">
          <p style="margin:0;color:#64748b;font-size:12px">Mentions</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1e293b">{mention_count}</p>
        </div>
        <div style="flex:1;padding:16px;background:#f1f5f9;border-radius:8px;text-align:center">
          <p style="margin:0;color:#64748b;font-size:12px">New Claims</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1e293b">{new_claims}</p>
        </div>
        <div style="flex:1;padding:16px;background:#f1f5f9;border-radius:8px;text-align:center">
          <p style="margin:0;color:#64748b;font-size:12px">Pending</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1e293b">{pending_claims}</p>
        </div>
      </div>
      <h3 style="color:#1e293b">Top Opportunities</h3>
      <ul style="color:#475569">{opps_html}</ul>
      <p style="color:#475569;margin-top:24px">
        View your full dashboard at <a href="http://localhost:3000/dashboard">GeoMav</a>.
      </p>
    </div>
    """

    resend_mod = _get_resend()
    if resend_mod is None:
        logger.info("[DEV] Weekly report email to %s:\n%s", to_email, html)
        return True

    try:
        resend_mod.Emails.send({
            "from": settings.notification_from_email,
            "to": [to_email],
            "subject": "GeoMav: Your Weekly Visibility Report",
            "html": html,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send weekly report: %s", exc)
        return False
