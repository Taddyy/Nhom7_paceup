"""
Simple email sending utilities using SMTP.
"""
from email.message import EmailMessage
import smtplib
from typing import Optional

from app.core.config import settings


def _get_smtp_connection() -> smtplib.SMTP:
  """Create and return an authenticated SMTP connection."""
  host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
  port = int(getattr(settings, "SMTP_PORT", 587))
  user = getattr(settings, "SMTP_USER", None)
  password = getattr(settings, "SMTP_PASSWORD", None)

  if not user or not password:
    raise RuntimeError("SMTP_USER/SMTP_PASSWORD are not configured")

  server = smtplib.SMTP(host, port)
  server.starttls()
  server.login(user, password)
  return server


def send_reset_code_email(to_email: str, code: str, minutes_valid: int = 15) -> None:
  """
  Send a simple password reset email with a 6-character code.

  Parameters
  ----------
  to_email: Recipient email.
  code: The reset code to include.
  minutes_valid: How long the code is valid for (for display only).
  """
  subject = "PaceUp - Mã đặt lại mật khẩu của bạn"
  body = (
    "Xin chào,\n\n"
    "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản PaceUp.\n"
    f"Mã xác nhận của bạn là: {code}\n\n"
    f"Mã này có hiệu lực trong khoảng {minutes_valid} phút. "
    "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.\n\n"
    "Trân trọng,\n"
    "Đội ngũ PaceUp"
  )

  message = EmailMessage()
  message["Subject"] = subject
  message["From"] = getattr(settings, "SMTP_FROM", getattr(settings, "SMTP_USER", "noreply.paceup@gmail.com"))
  message["To"] = to_email
  message.set_content(body)

  server: Optional[smtplib.SMTP] = None
  try:
    server = _get_smtp_connection()
    server.send_message(message)
  finally:
    if server is not None:
      server.quit()


