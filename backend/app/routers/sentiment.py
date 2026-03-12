from fastapi import APIRouter
from typing import Optional

router = APIRouter(tags=["sentiment"])


@router.get("/sentiment")
def get_sentiment(filter: Optional[str] = None):
    """Returns sentiment trends over time and sentiment by LLM breakdown.
    Optional filter: all_time, daily, weekly."""
    return {
        "sentiment_trends": [
            {"date": "2025-03-06", "positive": 0.65, "neutral": 0.28, "negative": 0.07},
            {"date": "2025-03-07", "positive": 0.68, "neutral": 0.25, "negative": 0.07},
            {"date": "2025-03-08", "positive": 0.70, "neutral": 0.24, "negative": 0.06},
            {"date": "2025-03-09", "positive": 0.72, "neutral": 0.23, "negative": 0.05},
            {"date": "2025-03-10", "positive": 0.72, "neutral": 0.22, "negative": 0.06},
        ],
        "sentiment_by_llm": [
            {"llm": "GPT-4", "positive": 0.78, "neutral": 0.18, "negative": 0.04},
            {"llm": "Claude", "positive": 0.75, "neutral": 0.20, "negative": 0.05},
            {"llm": "Gemini", "positive": 0.68, "neutral": 0.26, "negative": 0.06},
            {"llm": "Llama", "positive": 0.65, "neutral": 0.28, "negative": 0.07},
        ],
        "overall_sentiment": {
            "positive": 0.72,
            "neutral": 0.22,
            "negative": 0.06,
        },
        "filter_applied": filter or "all_time",
    }
