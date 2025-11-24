"""
Report models
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Report(Base):
    """Report model for content moderation"""
    __tablename__ = "reports"

    id = Column(String(255), primary_key=True, index=True)
    post_id = Column(String(255), ForeignKey("blog_posts.id"), nullable=False, index=True)
    reporter_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    reasons = Column(JSON, nullable=False)  # List of report reasons
    description = Column(Text, nullable=True)  # Additional description
    status = Column(String(20), default="pending", nullable=False)  # pending, resolved, dismissed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    post = relationship("BlogPost", foreign_keys=[post_id])
    reporter = relationship("User", foreign_keys=[reporter_id])

