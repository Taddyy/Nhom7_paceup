"""
Report schemas
"""
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ReportCreate(BaseModel):
    """Schema for creating a report"""
    post_id: str
    reasons: List[str]
    description: Optional[str] = None


class ReportResponse(BaseModel):
    """Schema for report response"""
    id: str
    post_id: str
    reporter_id: str
    reporter_name: Optional[str] = None
    reasons: List[str]
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportUpdate(BaseModel):
    """Schema for updating report status"""
    status: str  # pending, resolved, dismissed

