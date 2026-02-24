from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "BetaGen Boulder Analyzer"
    api_v1_prefix: str = "/api/v1"
    frontend_origin: str = "http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
