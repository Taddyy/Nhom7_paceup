"""
Payment models
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class PaymentSession(Base):
    """Payment session model used for sandbox QR payment flow."""

    __tablename__ = "payment_sessions"

    id = Column(String(255), primary_key=True, index=True)
    event_id = Column(String(255), ForeignKey("events.id"), nullable=False)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(
        String(20),
        nullable=False,
        default="pending",
    )  # pending, success, cancelled, expired
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    expires_at = Column(DateTime, nullable=True)


