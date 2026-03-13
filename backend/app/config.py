from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    next_public_supabase_url: str = ""
    next_public_supabase_anon_key: str = ""

    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_gemini_api_key: str = ""
    perplexity_api_key: str = ""

    resend_api_key: str = ""
    notification_from_email: str = "noreply@geomav.com"

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def has_llm_keys(self) -> bool:
        return any([
            self.openai_api_key,
            self.anthropic_api_key,
            self.google_gemini_api_key,
            self.perplexity_api_key,
        ])


@lru_cache
def get_settings() -> Settings:
    return Settings()
