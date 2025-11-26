"""
Schemas for password reset flow.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class PasswordResetRequest(BaseModel):
    """Request a password reset code for a given email address."""

    email: EmailStr


class PasswordResetVerify(BaseModel):
    """Verify a reset code that was sent to a user's email."""

    email: EmailStr
    code: str = Field(min_length=4, max_length=32)


class PasswordResetPerform(BaseModel):
    """Reset the user's password using a previously issued token."""

    reset_session_id: str
    new_password: str = Field(min_length=6, max_length=255)


class PasswordResetTokenRead(BaseModel):
    """Minimal view of a reset token (for debugging or admin)."""

    id: str
    email: EmailStr
    expires_at: datetime
    used: bool

    class Config:
        from_attributes = True


