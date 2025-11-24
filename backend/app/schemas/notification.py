"""
Notification schemas
"""
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    """Schema for notification response"""
    id: str
    type: str
    title: str
    message: str
    related_id: Optional[str] = None
    is_read: bool
    metadata: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

