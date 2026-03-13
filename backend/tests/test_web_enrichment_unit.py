"""Unit tests for pure functions in web_enrichment.py — no network, no Supabase."""

import json

from app.agents.web_enrichment import (
    _strip_html_to_text,
    _truncate_text,
    extract_schema_org,
    merge_profile,
)


# ---------------------------------------------------------------------------
# _truncate_text
# ---------------------------------------------------------------------------

class TestTruncateText:
    def test_short_text_unchanged(self):
        assert _truncate_text("hello", 100) == "hello"

    def test_long_text_truncated(self):
        result = _truncate_text("a" * 200, 50)
        assert result == "a" * 50 + "\n[truncated]"

    def test_exact_boundary(self):
        text = "x" * 100
        assert _truncate_text(text, 100) == text


# ---------------------------------------------------------------------------
# _strip_html_to_text
# ---------------------------------------------------------------------------

class TestStripHtmlToText:
    def test_removes_script_and_style(self):
        html = "<html><script>var x=1;</script><style>body{}</style><p>Hello</p></html>"
        text = _strip_html_to_text(html)
        assert "var x=1" not in text
        assert "body{}" not in text
        assert "Hello" in text

    def test_removes_nav_footer_header(self):
        html = (
            "<html>"
            "<nav><a href='/'>Home</a></nav>"
            "<header>Header Content</header>"
            "<main><p>Main Content</p></main>"
            "<footer>Footer Content</footer>"
            "</html>"
        )
        text = _strip_html_to_text(html)
        assert "Main Content" in text
        assert "Home" not in text
        assert "Header Content" not in text
        assert "Footer Content" not in text

    def test_collapses_multiple_newlines(self):
        html = "<p>Line 1</p><br><br><br><br><p>Line 2</p>"
        text = _strip_html_to_text(html)
        assert "\n\n\n" not in text

    def test_plain_text_passthrough(self):
        text = _strip_html_to_text("no html here")
        assert "no html here" in text

    def test_removes_svg_and_img(self):
        html = "<div><svg><circle/></svg><img src='x.png'/><p>Visible</p></div>"
        text = _strip_html_to_text(html)
        assert "Visible" in text
        assert "circle" not in text


# ---------------------------------------------------------------------------
# extract_schema_org
# ---------------------------------------------------------------------------

class TestExtractSchemaOrg:
    def _make_html(self, schema: dict | list) -> str:
        return (
            f'<html><head><script type="application/ld+json">'
            f"{json.dumps(schema)}</script></head><body></body></html>"
        )

    def test_local_business_full(self):
        schema = {
            "@type": "LocalBusiness",
            "name": "Joe's Bakery",
            "description": "Fresh bread daily",
            "address": {
                "addressLocality": "Austin",
                "addressRegion": "TX",
            },
            "openingHours": "Mo-Fr 08:00-18:00",
            "priceRange": "$$",
            "telephone": "512-555-0100",
            "category": "Bakery",
        }
        result = extract_schema_org(self._make_html(schema))
        assert result["name"] == "Joe's Bakery"
        assert result["description"] == "Fresh bread daily"
        assert result["location"] == "Austin, TX"
        assert result["hours"] == "Mo-Fr 08:00-18:00"
        assert result["pricing"] == "$$"
        assert result["phone"] == "512-555-0100"
        assert result["category"] == "Bakery"

    def test_organization_type(self):
        schema = {"@type": "Organization", "name": "Acme Corp"}
        result = extract_schema_org(self._make_html(schema))
        assert result["name"] == "Acme Corp"

    def test_array_of_schemas_picks_local_business(self):
        schemas = [
            {"@type": "WebSite", "name": "My Website"},
            {"@type": "LocalBusiness", "name": "My Store", "priceRange": "$$$"},
        ]
        result = extract_schema_org(self._make_html(schemas))
        assert result["name"] == "My Store"
        assert result["pricing"] == "$$$"

    def test_opening_hours_as_list(self):
        schema = {
            "@type": "Restaurant",
            "name": "Pasta Place",
            "openingHours": ["Mo-Fr 11:00-22:00", "Sa-Su 12:00-23:00"],
        }
        result = extract_schema_org(self._make_html(schema))
        assert "Mo-Fr" in result["hours"]
        assert "Sa-Su" in result["hours"]

    def test_address_as_string(self):
        schema = {
            "@type": "Store",
            "name": "Shop",
            "address": "123 Main St, Springfield, IL",
        }
        result = extract_schema_org(self._make_html(schema))
        assert result["location"] == "123 Main St, Springfield, IL"

    def test_invalid_json_returns_empty(self):
        html = '<html><script type="application/ld+json">NOT VALID JSON</script></html>'
        result = extract_schema_org(html)
        assert result == {}

    def test_no_matching_type_returns_empty(self):
        schema = {"@type": "Person", "name": "Jane"}
        result = extract_schema_org(self._make_html(schema))
        assert result == {}

    def test_empty_html_returns_empty(self):
        assert extract_schema_org("") == {}
        assert extract_schema_org("<html></html>") == {}


# ---------------------------------------------------------------------------
# merge_profile
# ---------------------------------------------------------------------------

class TestMergeProfile:
    def test_all_empty_existing_uses_schema_org(self):
        existing = {"id": "1", "name": "", "pricing": "", "hours": ""}
        schema_org = {"name": "Acme", "pricing": "$$", "hours": "9-5"}
        llm = {"name": "Acme Corp", "pricing": "$$$"}
        result = merge_profile(existing, schema_org, llm)
        assert result["name"] == "Acme"
        assert result["pricing"] == "$$"
        assert result["hours"] == "9-5"

    def test_manual_fields_never_overwritten(self):
        existing = {"name": "My Bakery", "pricing": "$5/loaf", "hours": ""}
        schema_org = {"name": "Different Name", "pricing": "Free", "hours": "Mon-Fri 9-5"}
        llm = {"description": "A great bakery"}
        result = merge_profile(existing, schema_org, llm)
        assert "name" not in result
        assert "pricing" not in result
        assert result["hours"] == "Mon-Fri 9-5"
        assert result["description"] == "A great bakery"

    def test_llm_fills_gaps_left_by_schema_org(self):
        existing = {"name": "", "pricing": "", "services": "", "location": ""}
        schema_org = {"name": "Acme"}
        llm = {"pricing": "$10/mo", "services": "Web hosting, Email", "location": "NYC"}
        result = merge_profile(existing, schema_org, llm)
        assert result["name"] == "Acme"
        assert result["pricing"] == "$10/mo"
        assert result["services"] == "Web hosting, Email"
        assert result["location"] == "NYC"

    def test_none_treated_as_empty(self):
        existing = {"name": None, "pricing": None}
        schema_org = {}
        llm = {"name": "Extracted Name"}
        result = merge_profile(existing, schema_org, llm)
        assert result["name"] == "Extracted Name"

    def test_whitespace_only_treated_as_empty(self):
        existing = {"name": "  ", "category": "  "}
        schema_org = {"name": "Real Name"}
        llm = {"category": "SaaS"}
        result = merge_profile(existing, schema_org, llm)
        assert result["name"] == "Real Name"
        assert result["category"] == "SaaS"

    def test_no_updates_when_all_fields_filled(self):
        existing = {
            "name": "A", "category": "B", "description": "C",
            "pricing": "D", "hours": "E", "location": "F", "services": "G",
        }
        result = merge_profile(existing, {"name": "X"}, {"pricing": "Y"})
        assert result == {}

    def test_empty_sources_return_no_updates(self):
        existing = {"name": "", "pricing": ""}
        result = merge_profile(existing, {}, {})
        assert result == {}
