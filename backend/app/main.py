import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    dashboard,
    visibility,
    hallucinations,
    prompts,
    competitors,
    sentiment,
    shopping,
    opportunities,
    content,
    business,
    scans,
    onboard,
    user,
    notifications,
    export,
    history,
    journey,
    agents,
    ethics,
    corrections,
    roi,
    estimator,
)

logger = logging.getLogger(__name__)

scheduler = None


def _start_scheduler():
    global scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
        from app.services.reports import run_weekly_reports

        scheduler = BackgroundScheduler()
        scheduler.add_job(
            run_weekly_reports,
            CronTrigger(day_of_week="mon", hour=9, minute=0),
            id="weekly_report",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("APScheduler started — weekly reports scheduled for Monday 09:00 UTC")
    except Exception as exc:
        logger.warning("Failed to start scheduler: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _start_scheduler()
    yield
    if scheduler:
        scheduler.shutdown(wait=False)


app = FastAPI(title="GeoMav API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(visibility.router, prefix="/api")
app.include_router(hallucinations.router, prefix="/api")
app.include_router(prompts.router, prefix="/api")
app.include_router(competitors.router, prefix="/api")
app.include_router(sentiment.router, prefix="/api")
app.include_router(shopping.router, prefix="/api")
app.include_router(opportunities.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(business.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
app.include_router(onboard.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(journey.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(ethics.router, prefix="/api")
app.include_router(corrections.router, prefix="/api")
app.include_router(roi.router, prefix="/api")
app.include_router(estimator.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
