"""
User schemas
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models.user import GenderEnum, RunningExperienceEnum


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[GenderEnum] = None
    address: Optional[str] = None
    running_experience: Optional[RunningExperienceEnum] = None
    goals: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "user"


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[GenderEnum] = None
    address: Optional[str] = None
    running_experience: Optional[RunningExperienceEnum] = None
    goals: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(UserBase):
    """User response schema"""
    id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserResponse):
    """Full user schema"""
    pass


class UserStats(BaseModel):
    """User statistics schema"""
    total_distance_km: float = 0.0
    events_joined: int = 0
