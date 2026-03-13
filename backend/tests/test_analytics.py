"""Unit tests for analytics.py — no network, no Supabase."""

import pytest

from app.agents.analytics import extract_mentions, POSITIVE_WORDS, NEGATIVE_WORDS


class TestExtractMentions:
    def test_brand_mentioned(self):
        text = "The best tool is Your Brand for AI-assisted design."
        result = extract_mentions(text, ["your brand"])
        assert result["mentioned"] is True
        assert result["rank"] is not None

    def test_brand_not_mentioned(self):
        text = "WordPress and Wix are the top website builders."
        result = extract_mentions(text, ["your brand"])
        assert result["mentioned"] is False
        assert result["rank"] is None

    def test_case_insensitive(self):
        text = "We recommend YOUR BRAND for its features."
        result = extract_mentions(text, ["your brand"])
        assert result["mentioned"] is True

    def test_rank_at_sentence_3(self):
        text = (
            "First there is WordPress. "
            "Second is Wix. "
            "Third is Your Brand. "
            "Fourth is Squarespace."
        )
        result = extract_mentions(text, ["your brand"])
        assert result["mentioned"] is True
        assert result["rank"] == 3

    def test_rank_at_first_sentence(self):
        text = "Your Brand is the top choice. Other tools follow."
        result = extract_mentions(text, ["your brand"])
        assert result["rank"] == 1

    def test_sentiment_positive(self):
        text = "Your Brand is excellent and innovative."
        result = extract_mentions(text, ["your brand"])
        assert result["sentiment"] == "positive"

    def test_sentiment_negative(self):
        text = "Your Brand is terrible and unreliable."
        result = extract_mentions(text, ["your brand"])
        assert result["sentiment"] == "negative"

    def test_sentiment_neutral(self):
        text = "Your Brand exists in the market."
        result = extract_mentions(text, ["your brand"])
        assert result["sentiment"] == "neutral"

    def test_sentiment_mixed_favors_majority(self):
        text = "Your Brand is excellent, great, and innovative but slightly expensive."
        result = extract_mentions(text, ["your brand"])
        assert result["sentiment"] == "positive"

    def test_no_mention_no_sentiment_analysis(self):
        text = "This is a great product."
        result = extract_mentions(text, ["your brand"])
        assert result["sentiment"] == "neutral"

    def test_multiple_brand_keywords(self):
        text = "Check out yourbrand for the best tools."
        result = extract_mentions(text, ["your brand", "yourbrand"])
        assert result["mentioned"] is True

    def test_empty_response(self):
        result = extract_mentions("", ["your brand"])
        assert result["mentioned"] is False
        assert result["rank"] is None
        assert result["sentiment"] == "neutral"


class TestVisibilityScoreMath:
    def test_all_mentioned(self):
        results = [{"mentioned": True} for _ in range(5)]
        total = len(results)
        mentioned = sum(1 for r in results if r["mentioned"])
        score = (mentioned / total * 100) if total > 0 else 0
        assert score == 100.0

    def test_none_mentioned(self):
        results = [{"mentioned": False} for _ in range(5)]
        total = len(results)
        mentioned = sum(1 for r in results if r["mentioned"])
        score = (mentioned / total * 100) if total > 0 else 0
        assert score == 0.0

    def test_partial_mention(self):
        results = [{"mentioned": True}, {"mentioned": True}, {"mentioned": True},
                   {"mentioned": False}, {"mentioned": False}]
        total = len(results)
        mentioned = sum(1 for r in results if r["mentioned"])
        score = (mentioned / total * 100) if total > 0 else 0
        assert score == 60.0

    def test_empty_results(self):
        results = []
        total = len(results)
        score = (0 / total * 100) if total > 0 else 0
        assert score == 0


class TestKeywordCoverage:
    def test_positive_words_are_set(self):
        assert len(POSITIVE_WORDS) >= 15

    def test_negative_words_are_set(self):
        assert len(NEGATIVE_WORDS) >= 15

    def test_no_overlap(self):
        assert POSITIVE_WORDS & NEGATIVE_WORDS == set()
