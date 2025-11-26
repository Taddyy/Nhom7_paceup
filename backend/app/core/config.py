"""
Application configuration
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    # Database connection URL - reads from DATABASE_URL environment variable
    # Default to local MySQL if not set in environment (for local development)
    # In production (Vercel), DATABASE_URL is set in environment variables
    # Database name is specified in the connection string (e.g., /paceup)
    # Example format: mysql+pymysql://user:password@host:port/database_name?charset=utf8mb4
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
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "https://paceup.vercel.app",
        "https://nhom7-paceup.vercel.app",
        "https://nhom7-paceup-git-main-taddyuiux-4154s-projects.vercel.app",
    ]
    
    # Cloudinary (used by frontend, documented here for completeness)
    CLOUDINARY_CLOUD_NAME: str | None = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str | None = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str | None = os.getenv("CLOUDINARY_API_SECRET")

    # SMTP / email (password reset, notifications)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD")
    SMTP_FROM: str | None = os.getenv("SMTP_FROM")

    # Cloudflare R2
    CLOUDFLARE_R2_ACCOUNT_ID: str | None = os.getenv("CLOUDFLARE_R2_ACCOUNT_ID")
    CLOUDFLARE_R2_ACCESS_KEY_ID: str | None = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: str | None = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    CLOUDFLARE_R2_BUCKET: str | None = os.getenv("CLOUDFLARE_R2_BUCKET")
    CLOUDFLARE_R2_ENDPOINT: str | None = os.getenv("CLOUDFLARE_R2_ENDPOINT")
    CLOUDFLARE_R2_PUBLIC_DOMAIN: str | None = os.getenv("CLOUDFLARE_R2_PUBLIC_DOMAIN")

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
