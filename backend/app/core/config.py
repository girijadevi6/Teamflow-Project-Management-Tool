from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    SECRET_KEY: str = "teamflow-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./teamflow.db"

    # Kept for backwards compatibility with existing .env files.
    FRONTEND_URL: str = "http://localhost:5173"

    # Comma-separated list of additional allowed origins, e.g.
    # "https://teamflow.onrender.com,https://teamflow-frontend.onrender.com"
    CORS_ORIGINS: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> List[str]:
        """Build the final list of allowed CORS origins from FRONTEND_URL + CORS_ORIGINS."""
        origins = {
            self.FRONTEND_URL,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        }
        if self.CORS_ORIGINS:
            for origin in self.CORS_ORIGINS.split(","):
                origin = origin.strip()
                if origin:
                    origins.add(origin)
        return [o for o in origins if o]


settings = Settings()
