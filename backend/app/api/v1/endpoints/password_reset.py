"""
Password reset endpoints.
"""
from datetime import datetime
import secrets
import string
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.email import send_reset_code_email
from app.core.security import get_password_hash
from app.models.password_reset import PasswordResetToken, DEFAULT_RESET_TOKEN_MINUTES
from app.models.user import User
from app.schemas.password_reset import (
  PasswordResetPerform,
  PasswordResetRequest,
  PasswordResetTokenRead,
  PasswordResetVerify,
)

router = APIRouter()


def _generate_code(length: int = 6) -> str:
  """Generate a simple 6-character verification code."""
  alphabet = string.digits
  return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("/forgot", status_code=status.HTTP_200_OK)
def request_password_reset(
  payload: PasswordResetRequest,
  db: Session = Depends(get_db),
) -> dict:
  """
  Request a password reset code.

  Always returns 200 even if email is not found, to avoid leaking user existence.
  """
  user: Optional[User] = db.query(User).filter(User.email == payload.email).first()
  if not user:
    # Do not leak information about whether user exists.
    return {"message": "If this email exists, a reset code has been sent."}

  # Invalidate previous tokens for this user/email (optional hardening)
  db.query(PasswordResetToken).filter(
    PasswordResetToken.user_id == user.id,
    PasswordResetToken.used.is_(False),
  ).update({"used": True})

  code = _generate_code()
  token = PasswordResetToken(
    id=str(uuid4()),
    user_id=user.id,
    email=user.email,
    code=code,
    expires_at=PasswordResetToken.default_expiry(),
    used=False,
  )
  db.add(token)
  db.commit()

  # Send reset code via email; failures should surface as server errors so the UI can show a message.
  send_reset_code_email(user.email, code, minutes_valid=DEFAULT_RESET_TOKEN_MINUTES)

  return {"message": "If this email exists, a reset code has been sent."}


@router.post("/verify", response_model=PasswordResetTokenRead)
def verify_reset_code(
  payload: PasswordResetVerify,
  db: Session = Depends(get_db),
) -> PasswordResetTokenRead:
  """Verify a reset code and return a reset session id if valid."""
  token: Optional[PasswordResetToken] = (
    db.query(PasswordResetToken)
    .filter(
      PasswordResetToken.email == payload.email,
      PasswordResetToken.code == payload.code,
      PasswordResetToken.used.is_(False),
      PasswordResetToken.expires_at >= datetime.utcnow(),
    )
    .order_by(PasswordResetToken.created_at.desc())
    .first()
  )

  if not token:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Mã xác nhận không hợp lệ hoặc đã hết hạn.",
    )

  return PasswordResetTokenRead.model_validate(token)


@router.post("/reset", status_code=status.HTTP_200_OK)
def perform_password_reset(
  payload: PasswordResetPerform,
  db: Session = Depends(get_db),
) -> dict:
  """Reset the password using a previously verified token."""
  token: Optional[PasswordResetToken] = (
    db.query(PasswordResetToken)
    .filter(
      PasswordResetToken.id == payload.reset_session_id,
      PasswordResetToken.used.is_(False),
      PasswordResetToken.expires_at >= datetime.utcnow(),
    )
    .first()
  )

  if not token:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
    )

  user: Optional[User] = db.query(User).filter(User.id == token.user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Không tìm thấy người dùng tương ứng.",
    )

  # Update password and mark token used
  user.hashed_password = get_password_hash(payload.new_password)
  token.used = True
  db.commit()

  return {"message": "Mật khẩu đã được cập nhật thành công."}


