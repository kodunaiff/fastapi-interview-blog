from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "QABlog"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # JWT
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # DB
    DATABASE_ASYNC_URL: str
    ## DATABASE_SYNC_URL: str
    DB_ECHO: bool = False

    # CORS
    CORS_ORIGINS: List[str] = []

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
