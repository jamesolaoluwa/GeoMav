"""Unit tests for enrichment.py — no network, no Supabase."""

import json
import pytest

from app.agents.enrichment import (
    generate_business_summary,
    generate_llms_txt,
    generate_json_ld,
    generate_faq,
    _get_field,
)


class TestGetField:
    def test_returns_value_when_present(self):
        assert _get_field({"name": "Acme"}, "name", "Default") == "Acme"

    def test_returns_fallback_when_empty(self):
        assert _get_field({"name": ""}, "name", "Default") == "Default"

    def test_returns_fallback_when_none(self):
        assert _get_field({"name": None}, "name", "Default") == "Default"

    def test_returns_fallback_when_missing(self):
        assert _get_field({}, "name", "Default") == "Default"

    def test_strips_whitespace(self):
        assert _get_field({"name": "  Acme  "}, "name", "Default") == "Acme"

    def test_none_string_treated_as_empty(self):
        assert _get_field({"name": "none"}, "name", "Default") == "Default"


class TestGenerateBusinessSummary:
    def test_uses_real_fields(self):
        biz = {
            "name": "TestCo",
            "category": "SaaS",
            "website": "https://testco.com",
            "description": "We build great tools",
            "services": "API, Dashboard, Analytics",
            "pricing": "$49/month",
            "hours": "24/7",
            "location": "Austin, TX",
        }
        result = generate_business_summary(biz)
        assert "TestCo" in result
        assert "$49/month" in result
        assert "24/7" in result
        assert "Austin, TX" in result
        assert "API, Dashboard, Analytics" in result

    def test_uses_fallbacks_for_empty_fields(self):
        biz = {"name": "TestCo", "category": "SaaS", "website": "https://testco.com"}
        result = generate_business_summary(biz)
        assert "TestCo" in result
        assert "Contact for pricing" in result

    def test_handles_list_services(self):
        biz = {
            "name": "TestCo",
            "services": ["Web Design", "SEO", "Hosting"],
        }
        result = generate_business_summary(biz)
        assert "Web Design" in result
        assert "SEO" in result


class TestGenerateLlmsTxt:
    def test_includes_real_pricing(self):
        biz = {"name": "BizCo", "pricing": "$19/mo starter"}
        result = generate_llms_txt(biz)
        assert "$19/mo starter" in result

    def test_includes_hours(self):
        biz = {"name": "BizCo", "hours": "Mon-Sat 8am-10pm"}
        result = generate_llms_txt(biz)
        assert "Mon-Sat 8am-10pm" in result

    def test_handles_list_services(self):
        biz = {"name": "BizCo", "services": ["API", "Dashboard"]}
        result = generate_llms_txt(biz)
        assert "- API" in result
        assert "- Dashboard" in result


class TestGenerateJsonLd:
    def test_valid_json(self):
        biz = {"name": "JsonCo", "category": "Tech"}
        result = generate_json_ld(biz)
        parsed = json.loads(result)
        assert parsed["@context"] == "https://schema.org"
        assert parsed["name"] == "JsonCo"

    def test_includes_address_when_location_set(self):
        biz = {"name": "Co", "location": "NYC"}
        result = json.loads(generate_json_ld(biz))
        assert "address" in result
        assert result["address"]["description"] == "NYC"

    def test_includes_hours(self):
        biz = {"name": "Co", "hours": "24/7"}
        result = json.loads(generate_json_ld(biz))
        assert result["openingHours"] == "24/7"

    def test_includes_pricing_offer(self):
        biz = {"name": "Co", "pricing": "$10/mo"}
        result = json.loads(generate_json_ld(biz))
        assert len(result["offers"]) == 1
        assert "$10/mo" in result["offers"][0]["description"]


class TestGenerateFaq:
    def test_returns_list(self):
        biz = {"name": "FaqCo", "category": "Tech"}
        result = generate_faq(biz)
        assert isinstance(result, list)
        assert len(result) >= 3

    def test_uses_real_pricing(self):
        biz = {"name": "FaqCo", "pricing": "$5/mo"}
        result = generate_faq(biz)
        pricing_faq = [f for f in result if "cost" in f["question"].lower()]
        assert any("$5/mo" in f["answer"] for f in pricing_faq)

    def test_uses_real_services(self):
        biz = {"name": "FaqCo", "services": ["AI Tools", "Web Hosting"]}
        result = generate_faq(biz)
        services_faq = [f for f in result if "services" in f["question"].lower()]
        assert any("AI Tools" in f["answer"] for f in services_faq)

    def test_uses_real_hours(self):
        biz = {"name": "FaqCo", "hours": "Mon-Fri 8-6"}
        result = generate_faq(biz)
        hours_faq = [f for f in result if "hours" in f["question"].lower()]
        assert any("Mon-Fri 8-6" in f["answer"] for f in hours_faq)
