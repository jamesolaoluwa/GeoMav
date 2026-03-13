"""Unit tests for reinforcement.py — no network, no Supabase."""

import pytest

from app.agents.reinforcement import extract_claims, classify_claim, generate_correction


class TestExtractClaims:
    def test_pricing_claim(self):
        text = "The monthly plan costs $29 per month."
        claims = extract_claims(text)
        assert len(claims) >= 1
        assert any(c["type"] == "pricing" for c in claims)

    def test_hours_claim(self):
        text = "They are open from 9am to 5pm Monday through Friday."
        claims = extract_claims(text)
        assert any(c["type"] == "hours" for c in claims)

    def test_location_claim(self):
        text = "The company is headquartered in San Francisco."
        claims = extract_claims(text)
        assert any(c["type"] == "location" for c in claims)

    def test_service_claim(self):
        text = "They offer custom web design and hosting services."
        claims = extract_claims(text)
        assert any(c["type"] == "service" for c in claims)

    def test_history_claim(self):
        text = "The company was founded in 2015."
        claims = extract_claims(text)
        assert any(c["type"] == "history" for c in claims)

    def test_no_claims_in_generic_text(self):
        text = "The weather is nice today. Birds are singing."
        claims = extract_claims(text)
        assert len(claims) == 0

    def test_multiple_claims(self):
        text = (
            "The service costs $10 per month. "
            "They are located in Austin. "
            "The company was founded in 2020."
        )
        claims = extract_claims(text)
        types = {c["type"] for c in claims}
        assert "pricing" in types
        assert "location" in types
        assert "history" in types


class TestClassifyClaim:
    FULL_PROFILE = {
        "pricing": "$29/month",
        "old_pricing": "$19/month",
        "hours": "Mon-Fri 9am-6pm",
        "location": "San Francisco, CA",
        "services": "web design hosting email marketing seo tools",
        "description": "A leading web platform",
        "founded_year": "2015",
    }

    def test_pricing_verified(self):
        result = classify_claim(
            "Plans start at $29/month for the basic tier",
            "pricing",
            self.FULL_PROFILE,
        )
        assert result["status"] == "verified"

    def test_pricing_outdated(self):
        result = classify_claim(
            "Their plan is $19/month",
            "pricing",
            self.FULL_PROFILE,
        )
        assert result["status"] == "outdated"

    def test_pricing_fabricated(self):
        result = classify_claim(
            "It costs $99/month for the enterprise plan",
            "pricing",
            self.FULL_PROFILE,
        )
        assert result["status"] == "fabricated"

    def test_pricing_empty_profile_fabricated(self):
        result = classify_claim(
            "It costs $10/month",
            "pricing",
            {"pricing": ""},
        )
        assert result["status"] == "fabricated"

    def test_hours_verified(self):
        result = classify_claim(
            "Open Mon-Fri 9am-6pm",
            "hours",
            self.FULL_PROFILE,
        )
        assert result["status"] == "verified"

    def test_hours_fabricated_24_7(self):
        result = classify_claim(
            "Available 24/7 around the clock",
            "hours",
            self.FULL_PROFILE,
        )
        assert result["status"] == "fabricated"

    def test_location_verified(self):
        result = classify_claim(
            "Based in San Francisco, CA",
            "location",
            self.FULL_PROFILE,
        )
        assert result["status"] == "verified"

    def test_location_fabricated(self):
        result = classify_claim(
            "Located in New York City",
            "location",
            self.FULL_PROFILE,
        )
        assert result["status"] == "fabricated"

    def test_service_verified_overlap(self):
        result = classify_claim(
            "They provide web design and hosting solutions",
            "service",
            self.FULL_PROFILE,
        )
        assert result["status"] == "verified"

    def test_service_fabricated_no_overlap(self):
        result = classify_claim(
            "They specialize in quantum computing and blockchain",
            "service",
            self.FULL_PROFILE,
        )
        assert result["status"] == "fabricated"

    def test_service_misleading_single_overlap(self):
        result = classify_claim(
            "They specialize in quantum email computing",
            "service",
            self.FULL_PROFILE,
        )
        assert result["status"] == "misleading"

    def test_history_verified_year(self):
        result = classify_claim(
            "The company was established in 2015",
            "history",
            self.FULL_PROFILE,
        )
        assert result["status"] == "verified"

    def test_history_fabricated_wrong_year(self):
        result = classify_claim(
            "Founded in 2010",
            "history",
            self.FULL_PROFILE,
        )
        assert result["status"] == "fabricated"

    def test_history_fabricated_no_data(self):
        result = classify_claim(
            "Founded in 2018",
            "history",
            {"description": ""},
        )
        assert result["status"] == "fabricated"

    def test_unknown_type_fabricated(self):
        result = classify_claim(
            "Some random claim",
            "unknown_type",
            self.FULL_PROFILE,
        )
        assert result["status"] == "fabricated"


class TestGenerateCorrection:
    def test_verified_returns_none(self):
        claim = {"text": "test", "type": "pricing"}
        classification = {"status": "verified", "verified_value": "$29"}
        assert generate_correction(claim, classification) is None

    def test_fabricated_returns_correction(self):
        claim = {"text": "costs $99", "type": "pricing"}
        classification = {"status": "fabricated", "verified_value": "$29/month"}
        result = generate_correction(claim, classification)
        assert result is not None
        assert result["status"] == "pending"
        assert result["claim_type"] == "pricing"
        assert result["verified_value"] == "$29/month"

    def test_outdated_returns_correction(self):
        claim = {"text": "costs $19", "type": "pricing"}
        classification = {"status": "outdated", "verified_value": "$29/month"}
        result = generate_correction(claim, classification)
        assert result is not None
        assert result["classification"] == "outdated"

    def test_misleading_returns_correction(self):
        claim = {"text": "only costs $29", "type": "pricing"}
        classification = {"status": "misleading", "verified_value": "$29/month"}
        result = generate_correction(claim, classification)
        assert result is not None
        assert result["classification"] == "misleading"
