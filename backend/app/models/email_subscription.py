from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, String

from app.core.database import Base


class EmailSubscription(Base):
  """Store email addresses submitted from CTA / marketing forms."""

  __tablename__ = "email_subscriptions"

  id: str = Column(String(36), primary_key=True, index=True)
  email: str = Column(String(255), unique=True, index=True, nullable=False)
  created_at: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
  source: Optional[str] = Column(String(100), nullable=True, default=None)


