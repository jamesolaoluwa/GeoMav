"""Async tests for fetch_page, fetch_key_pages, fetch_google_knowledge,
and llm_extract_profile using mocked HTTP and LLM clients."""

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.agents.web_enrichment import (
    CHAR_PER_TOKEN_ESTIMATE,
    TOKEN_BUDGET_PER_PAGE,
    fetch_google_knowledge,
    fetch_key_pages,
    fetch_page,
    llm_extract_profile,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _html_page(body_text: str, json_ld: dict | None = None) -> str:
    ld_block = ""
    if json_ld:
        ld_block = f'<script type="application/ld+json">{json.dumps(json_ld)}</script>'
    return f"<html><head>{ld_block}</head><body><p>{body_text}</p></body></html>"



# ---------------------------------------------------------------------------
# fetch_page
# ---------------------------------------------------------------------------

class _FakeResponse:
    """Minimal httpx.Response stand-in."""
    def __init__(self, status_code: int, text: str):
        self.status_code = status_code
        self.text = text


class _FakeAsyncClient:
    """Fake httpx.AsyncClient that resolves URLs from a route map."""
    def __init__(self, routes: dict[str, tuple[int, str]]):
        self._routes = routes

    async def get(self, url, **kwargs):
        from urllib.parse import urlparse
        path = urlparse(str(url)).path or "/"
        if path in self._routes:
            status, body = self._routes[path]
            return _FakeResponse(status, body)
        return _FakeResponse(404, "Not found")

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


class TestFetchPage:
    @pytest.mark.asyncio
    async def test_200_returns_html_and_text(self):
        html = _html_page("Hello World")
        fake_client = _FakeAsyncClient({"/": (200, html)})

        with patch("app.agents.web_enrichment.httpx.AsyncClient", return_value=fake_client):
            raw_html, text = await fetch_page("https://example.com/")

        assert "Hello World" in text
        assert "<html>" in raw_html

    @pytest.mark.asyncio
    async def test_404_returns_empty(self):
        fake_client = _FakeAsyncClient({"/gone": (404, "Not found")})

        with patch("app.agents.web_enrichment.httpx.AsyncClient", return_value=fake_client):
            raw_html, text = await fetch_page("https://example.com/gone")

        assert raw_html == ""
        assert text == ""

    @pytest.mark.asyncio
    async def test_timeout_returns_empty(self):
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("timed out")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.agents.web_enrichment.httpx.AsyncClient", return_value=mock_client):
            raw_html, text = await fetch_page("https://example.com/")

        assert raw_html == ""
        assert text == ""

    @pytest.mark.asyncio
    async def test_large_page_truncated(self):
        big_body = "x" * 50_000
        html = _html_page(big_body)
        max_chars = TOKEN_BUDGET_PER_PAGE * CHAR_PER_TOKEN_ESTIMATE
        fake_client = _FakeAsyncClient({"/": (200, html)})

        with patch("app.agents.web_enrichment.httpx.AsyncClient", return_value=fake_client):
            _, text = await fetch_page("https://example.com/")

        assert len(text) <= max_chars + len("\n[truncated]") + 10


# ---------------------------------------------------------------------------
# fetch_key_pages
# ---------------------------------------------------------------------------

class TestFetchKeyPages:
    @pytest.mark.asyncio
    async def test_fetches_homepage_and_subpages(self):
        pages_returned = []

        async def mock_fetch_page(url: str):
            pages_returned.append(url)
            if "/404" in url:
                return "", ""
            return _html_page(f"Content for {url}"), f"Content for {url}"

        with patch("app.agents.web_enrichment.fetch_page", side_effect=mock_fetch_page):
            result = await fetch_key_pages("https://example.com")

        assert len(result) >= 1
        assert any("example.com" in url for url in pages_returned)

    @pytest.mark.asyncio
    async def test_bare_domain_gets_https_prefix(self):
        urls_called = []

        async def mock_fetch_page(url: str):
            urls_called.append(url)
            return _html_page("text"), "text"

        with patch("app.agents.web_enrichment.fetch_page", side_effect=mock_fetch_page):
            await fetch_key_pages("example.com")

        assert all(u.startswith("https://") for u in urls_called)

    @pytest.mark.asyncio
    async def test_skips_pages_returning_empty(self):
        call_count = 0

        async def mock_fetch_page(url: str):
            nonlocal call_count
            call_count += 1
            if "/about" in url:
                return "", ""
            return _html_page("ok"), "ok"

        with patch("app.agents.web_enrichment.fetch_page", side_effect=mock_fetch_page):
            result = await fetch_key_pages("https://example.com")

        assert call_count >= 2
        for _, text in result:
            assert text != ""


# ---------------------------------------------------------------------------
# fetch_google_knowledge
# ---------------------------------------------------------------------------

class TestFetchGoogleKnowledge:
    @pytest.mark.asyncio
    async def test_returns_text_on_success(self):
        google_html = _html_page("Acme Corp is a leading provider of widgets.")
        fake_client = _FakeAsyncClient({"/search": (200, google_html)})

        with patch("app.agents.web_enrichment.httpx.AsyncClient", return_value=fake_client):
            result = await fetch_google_knowledge("Acme Corp", "https://acme.com")

        assert "leading provider" in result

    @pytest.mark.asyncio
    async def test_returns_empty_on_error(self):
        mock_client = AsyncMock()
        mock_client.get.side_effect = Exception("network error")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.agents.web_enrichment.httpx.AsyncClient", return_value=mock_client):
            result = await fetch_google_knowledge("Acme Corp", "https://acme.com")

        assert result == ""


# ---------------------------------------------------------------------------
# llm_extract_profile
# ---------------------------------------------------------------------------

def _fake_openai_response(json_content: str):
    """Build a fake OpenAI response structure."""
    msg = SimpleNamespace(content=json_content)
    choice = SimpleNamespace(message=msg)
    return SimpleNamespace(choices=[choice])


def _fake_anthropic_response(text_content: str):
    """Build a fake Anthropic response structure."""
    block = SimpleNamespace(text=text_content)
    return SimpleNamespace(content=[block])


class TestLlmExtractProfile:
    @pytest.mark.asyncio
    async def test_openai_success(self):
        expected = {"name": "Acme", "pricing": "$10/mo"}
        fake_resp = _fake_openai_response(json.dumps(expected))

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=fake_resp)

        with patch("app.agents.web_enrichment.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                openai_api_key="sk-test", anthropic_api_key=""
            )
            with patch("openai.AsyncOpenAI", return_value=mock_client):
                result = await llm_extract_profile(["Some page text"], {"name": ""})

        assert result == expected

    @pytest.mark.asyncio
    async def test_openai_with_markdown_fences(self):
        expected = {"name": "Acme"}
        raw_with_fences = f"```json\n{json.dumps(expected)}\n```"
        fake_resp = _fake_openai_response(raw_with_fences)

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=fake_resp)

        with patch("app.agents.web_enrichment.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                openai_api_key="sk-test", anthropic_api_key=""
            )
            with patch("openai.AsyncOpenAI", return_value=mock_client):
                result = await llm_extract_profile(["text"], {})

        assert result == expected

    @pytest.mark.asyncio
    async def test_openai_fails_falls_back_to_anthropic(self):
        expected = {"category": "SaaS"}
        fake_resp = _fake_anthropic_response(json.dumps(expected))

        mock_anthropic = AsyncMock()
        mock_anthropic.messages.create = AsyncMock(return_value=fake_resp)

        with patch("app.agents.web_enrichment.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                openai_api_key="sk-test", anthropic_api_key="sk-ant-test"
            )
            with patch("openai.AsyncOpenAI") as MockOpenAI:
                mock_oai_client = AsyncMock()
                mock_oai_client.chat.completions.create = AsyncMock(
                    side_effect=Exception("OpenAI down")
                )
                MockOpenAI.return_value = mock_oai_client

                with patch("anthropic.AsyncAnthropic", return_value=mock_anthropic):
                    result = await llm_extract_profile(["text"], {})

        assert result == expected

    @pytest.mark.asyncio
    async def test_no_keys_returns_empty(self):
        with patch("app.agents.web_enrichment.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                openai_api_key="", anthropic_api_key=""
            )
            result = await llm_extract_profile(["text"], {})

        assert result == {}
