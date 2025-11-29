"""
Payment schemas for sandbox QR flow.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class PaymentSessionCreate(BaseModel):
    """Create payment session request schema."""

    event_id: str
    category: str
    amount: int


class PaymentSessionResponse(BaseModel):
    """Payment session response schema."""

    id: str
    event_id: str
    category: str
    amount: int
    status: str
    created_at: datetime
    expires_at: Optional[datetime] = None


class PaymentConfirmRequest(BaseModel):
    """Confirm or cancel a payment session."""

    session_id: str
    action: Literal["confirm", "cancel"] = "confirm"


