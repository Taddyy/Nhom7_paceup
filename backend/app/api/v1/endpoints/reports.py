"""
Report endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.report import Report
from app.models.blog import BlogPost
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate
import uuid

router = APIRouter()


def get_current_user_id(authorization: Optional[str] = None) -> Optional[str]:
    """Extract user ID from authorization token"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Create a new report"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    # Check if post exists
    post = db.query(BlogPost).filter(BlogPost.id == report_data.post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Check if user already reported this post
    existing_report = db.query(Report).filter(
        Report.post_id == report_data.post_id,
        Report.reporter_id == user_id,
        Report.status == "pending"
    ).first()
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reported this post",
        )
    
    report_id = str(uuid.uuid4())
    new_report = Report(
        id=report_id,
        post_id=report_data.post_id,
        reporter_id=user_id,
        reasons=report_data.reasons,
        description=report_data.description,
        status="pending",
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    reporter = db.query(User).filter(User.id == user_id).first()
    
    return ReportResponse(
        id=new_report.id,
        post_id=new_report.post_id,
        reporter_id=new_report.reporter_id,
        reporter_name=reporter.full_name if reporter else "Unknown",
        reasons=new_report.reasons,
        description=new_report.description,
        status=new_report.status,
        created_at=new_report.created_at,
        updated_at=new_report.updated_at,
    )

