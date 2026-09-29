"""Centralized application settings — reads from backend/.env via main.py load_dotenv."""
import os


class Settings:
    # OpenRouter (LLM)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    # Hindsight Cloud
    HINDSIGHT_API_KEY: str = os.getenv("HINDSIGHT_API_KEY", "")
    HINDSIGHT_BASE_URL: str = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
    HINDSIGHT_BANK_ID: str = os.getenv("HINDSIGHT_BANK_ID", "Triangle")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./triangle.db")

    # Application
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8443")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    @property
    def hindsight_available(self) -> bool:
        return bool(self.HINDSIGHT_API_KEY)

    @property
    def openrouter_available(self) -> bool:
        return bool(self.OPENROUTER_API_KEY)


settings = Settings()
