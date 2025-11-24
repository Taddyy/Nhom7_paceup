"""
Notification models
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Notification(Base):
    """Notification model for user notifications"""
    __tablename__ = "notifications"

    id = Column(String(255), primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # post_liked, post_commented, event_approved, event_rejected, blog_approved, blog_rejected
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    related_id = Column(String(255), nullable=True)  # ID of related post, event, blog, etc.
    is_read = Column(Boolean, default=False, nullable=False)
    metadata = Column(Text, nullable=True)  # JSON string for additional data (rejection reasons, etc.)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

