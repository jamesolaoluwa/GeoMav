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
)

app = FastAPI(title="GeoMav API", version="0.1.0")

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


@app.get("/health")
def health_check():
    return {"status": "ok"}
