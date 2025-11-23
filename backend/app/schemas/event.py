"""
Event schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class EventBase(BaseModel):
    """Base event schema"""
    title: str
    description: str
    full_description: str
    date: datetime
    time: str
    location: str
    address: str
    image_url: Optional[str] = None
    max_participants: int
    registration_deadline: datetime
    categories: List[str]


class EventCreate(EventBase):
    """Event creation schema"""
    pass


class EventUpdate(BaseModel):
    """Event update schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    full_description: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    max_participants: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    categories: Optional[List[str]] = None


class EventResponse(EventBase):
    """Event response schema"""
    id: str
    organizer_id: str
    organizer_name: str
    status: str = "pending"
    participants_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Event(EventResponse):
    """Full event schema"""
    pass


class EventRegistrationRequest(BaseModel):
    """Event registration request schema"""
    event_id: str
    category: str

