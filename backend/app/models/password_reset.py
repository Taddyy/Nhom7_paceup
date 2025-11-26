"""
Password reset token model
"""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey, Index
from sqlalchemy.sql import func

from app.core.config import settings
from app.core.database import Base


DEFAULT_RESET_TOKEN_MINUTES = 15


class PasswordResetToken(Base):
    """Store one-time password reset codes for users."""

    __tablename__ = "password_reset_tokens"

    id = Column(String(255), primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(32), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_password_reset_email_code", "email", "code"),
    )

    @staticmethod
    def default_expiry() -> datetime:
        """Return default expiry time."""
        minutes = DEFAULT_RESET_TOKEN_MINUTES
        try:
            # allow override via env if needed
            override = int(getattr(settings, "PASSWORD_RESET_MINUTES", minutes))
            minutes = max(1, override)
        except Exception:
            pass
        return datetime.utcnow() + timedelta(minutes=minutes)


