"""
Application configuration
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    # Default to local MySQL if not set in environment
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:062103@localhost:3306/paceup?charset=utf8mb4")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    # Allow dynamic origins for Vercel deployments
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://paceup.vercel.app",
        "https://nhom7-paceup.vercel.app",
        "https://nhom7-paceup-git-main-taddyuiux-4154s-projects.vercel.app",
    ]
    
    # Pydantic v2 config
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


# Create settings instance
settings = Settings()

# Allow adding custom domains via env var (comma separated)
# e.g. https://paceup.vn,https://www.paceup.vn
if os.getenv("ADDITIONAL_CORS_ORIGINS"):
    settings.CORS_ORIGINS.extend(os.getenv("ADDITIONAL_CORS_ORIGINS").split(","))
