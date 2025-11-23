"""
User model
"""
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class GenderEnum(str, enum.Enum):
    """Gender enumeration"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class RunningExperienceEnum(str, enum.Enum):
    """Running experience level enumeration"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(String(255), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    date_of_birth = Column(DateTime)
    gender = Column(SQLEnum(GenderEnum))
    address = Column(String(500))
    running_experience = Column(SQLEnum(RunningExperienceEnum))
    goals = Column(String(1000))
    avatar = Column(String(500))
    role = Column(String(20), default="user")  # user, admin
    is_active = Column(String(10), default="true")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    blog_posts = relationship("BlogPost", back_populates="author")
    event_registrations = relationship("EventRegistration", back_populates="user")

