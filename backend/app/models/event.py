"""
Event models
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Event(Base):
    """Event model"""
    __tablename__ = "events"

    id = Column(String(255), primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=False)
    full_description = Column(Text, nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String(50), nullable=False)
    location = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    image_url = Column(String(500))
    max_participants = Column(Integer, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    categories = Column(JSON, nullable=False)  # MySQL uses JSON instead of ARRAY
    status = Column(String(20), default="pending")  # pending, approved, rejected
    organizer_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    # Bank account information for payment processing
    bank_name = Column(String(255), nullable=True)  # Tên ngân hàng
    account_number = Column(String(100), nullable=True)  # Số tài khoản
    account_holder_name = Column(String(255), nullable=True)  # Tên chủ tài khoản
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")

    @property
    def participants_count(self) -> int:
        """Get participants count"""
        return len(self.registrations)


class EventRegistration(Base):
    """Event registration model"""
    __tablename__ = "event_registrations"

    id = Column(String(255), primary_key=True, index=True)
    event_id = Column(String(255), ForeignKey("events.id"), nullable=False)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    rejection_reasons = Column(JSON, nullable=True)  # List of rejection reasons
    rejection_description = Column(Text, nullable=True)  # Additional rejection description
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="event_registrations")

