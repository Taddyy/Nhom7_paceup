"""
Admin endpoints
"""
from typing import List, Optional, List as TypingList
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.blog import BlogPost
from app.models.event import Event, EventRegistration
from app.models.payment import PaymentSession
from app.models.report import Report
from app.schemas.blog import BlogPostResponse
from app.schemas.event import EventResponse
from app.schemas.report import ReportResponse
from app.core.notifications import notify_blog_approved, notify_blog_rejected, notify_event_approved, notify_event_rejected
from pydantic import BaseModel

router = APIRouter()

class AdminStats(BaseModel):
    total_users: int
    pending_posts: int
    pending_events: int
    total_posts: int
    total_events: int
    pending_reports: int
    pending_registrations: int

class EventRegistrationResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    user_name: Optional[str] = None
    event_title: Optional[str] = None
    category: str
    status: str
    rejection_reasons: Optional[TypingList[str]] = None
    rejection_description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EventRegistrationWithPaymentResponse(EventRegistrationResponse):
    """Extended registration response with payment-related information."""

    amount: Optional[int] = None


class RejectEventRegistrationRequest(BaseModel):
    reasons: TypingList[str]
    description: Optional[str] = None

def get_current_admin(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
) -> User:
    """Extract user from token and verify admin role"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    return user

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    total_users = db.query(User).count()
    pending_posts = db.query(BlogPost).filter(BlogPost.status == "pending").count()
    pending_events = db.query(Event).filter(Event.status == "pending").count()
    total_posts = db.query(BlogPost).count()
    total_events = db.query(Event).count()
    pending_reports = db.query(Report).filter(Report.status == "pending").count()
    pending_registrations = db.query(EventRegistration).filter(EventRegistration.status == "pending").count()
    
    return AdminStats(
        total_users=total_users,
        pending_posts=pending_posts,
        pending_events=pending_events,
        total_posts=total_posts,
        total_events=total_events,
        pending_reports=pending_reports,
        pending_registrations=pending_registrations
    )

@router.get("/posts", response_model=List[BlogPostResponse])
async def get_admin_posts(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get posts for admin management"""
    offset = (page - 1) * limit
    query = db.query(BlogPost)
    
    if status and status != "all":
        query = query.filter(BlogPost.status == status)
        
    posts = query.order_by(BlogPost.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        result.append(BlogPostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            excerpt=post.excerpt,
            category=post.category,
            image_url=post.image_url,
            author_id=post.author_id,
            author_name=author.full_name if author else "Unknown",
            status=post.status,
            created_at=post.created_at,
            updated_at=post.updated_at
        ))
    return result

@router.put("/posts/{post_id}/status")
async def update_post_status(
    post_id: str,
    status_update: str = Query(..., regex="^(approved|rejected|pending)$"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject a post"""
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post.status = status_update
    db.commit()
    
    # Create notification for the author
    if status_update == "approved":
        notify_blog_approved(db, post.author_id, post.title, post.id)
    elif status_update == "rejected":
        notify_blog_rejected(db, post.author_id, post.title, post.id)
    
    return {"message": f"Post status updated to {status_update}"}

@router.get("/events", response_model=List[EventResponse])
async def get_admin_events(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get events for admin management"""
    offset = (page - 1) * limit
    query = db.query(Event)
    
    if status and status != "all":
        query = query.filter(Event.status == status)
        
    events = query.order_by(Event.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for event in events:
        # Simplified response logic, similar to events.py but lighter if needed
        organizer = db.query(User).filter(User.id == event.organizer_id).first()
        result.append(EventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            full_description=event.full_description,
            date=event.date,
            time=event.time,
            location=event.location,
            address=event.address,
            image_url=event.image_url,
            max_participants=event.max_participants,
            registration_deadline=event.registration_deadline,
            categories=event.categories,
            organizer_id=event.organizer_id,
            organizer_name=organizer.full_name if organizer else "Unknown",
            status=event.status,
            bank_name=event.bank_name,
            account_number=event.account_number,
            account_holder_name=event.account_holder_name,
            created_at=event.created_at,
            updated_at=event.updated_at
        ))
    return result

@router.put("/events/{event_id}/status")
async def update_event_status(
    event_id: str,
    status_update: str = Query(..., regex="^(approved|rejected|pending)$"),
    rejection_reasons: Optional[TypingList[str]] = None,
    rejection_description: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = status_update
    db.commit()
    
    # Create notification for the organizer
    if status_update == "approved":
        notify_event_approved(db, event.organizer_id, event.title, event.id)
    elif status_update == "rejected":
        notify_event_rejected(
            db,
            event.organizer_id,
            event.title,
            event.id,
            rejection_reasons or [],
            rejection_description
        )
    
    return {"message": f"Event status updated to {status_update}"}

@router.put("/events/{event_id}/reject")
async def reject_event_with_reasons(
    event_id: str,
    rejection_data: RejectEventRegistrationRequest = Body(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject an event with reasons"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = "rejected"
    db.commit()
    
    # Create notification with rejection reasons
    notify_event_rejected(
        db,
        event.organizer_id,
        event.title,
        event.id,
        rejection_data.reasons,
        rejection_data.description
    )
    
    return {"message": "Event rejected"}

# Reports endpoints
@router.get("/reports", response_model=List[ReportResponse])
async def get_admin_reports(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get reports for admin management"""
    offset = (page - 1) * limit
    query = db.query(Report)
    
    if status and status != "all":
        query = query.filter(Report.status == status)
    else:
        query = query.filter(Report.status == "pending")  # Default to pending
    
    reports = query.order_by(Report.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for report in reports:
        reporter = db.query(User).filter(User.id == report.reporter_id).first()
        result.append(ReportResponse(
            id=report.id,
            post_id=report.post_id,
            reporter_id=report.reporter_id,
            reporter_name=reporter.full_name if reporter else "Unknown",
            reasons=report.reasons,
            description=report.description,
            status=report.status,
            created_at=report.created_at,
            updated_at=report.updated_at,
        ))
    return result

@router.put("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Resolve report by deleting the post"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    post = db.query(BlogPost).filter(BlogPost.id == report.post_id).first()
    if post:
        db.delete(post)  # Delete the reported post
    
    report.status = "resolved"
    db.commit()
    return {"message": "Report resolved and post deleted"}

@router.put("/reports/{report_id}/dismiss")
async def dismiss_report(
    report_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Dismiss report (delete the report, keep the post)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = "dismissed"
    db.commit()
    return {"message": "Report dismissed"}

@router.get("/registrations", response_model=List[EventRegistrationResponse])
async def get_admin_registrations(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get event registrations for admin management."""
    offset = (page - 1) * limit
    query = db.query(EventRegistration)

    if status and status != "all":
        query = query.filter(EventRegistration.status == status)
    else:
        query = query.filter(EventRegistration.status == "pending")  # Default to pending

    registrations = (
        query.order_by(EventRegistration.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    result: List[EventRegistrationResponse] = []
    for registration in registrations:
        user = db.query(User).filter(User.id == registration.user_id).first()
        event = db.query(Event).filter(Event.id == registration.event_id).first()
        result.append(
            EventRegistrationResponse(
                id=registration.id,
                event_id=registration.event_id,
                user_id=registration.user_id,
                user_name=user.full_name if user else "Unknown",
                event_title=event.title if event else "Unknown",
                category=registration.category,
                status=registration.status,
                rejection_reasons=registration.rejection_reasons,
                rejection_description=registration.rejection_description,
                created_at=registration.created_at,
                updated_at=registration.updated_at,
            )
        )
    return result


@router.get(
    "/events/{event_id}/registrations",
    response_model=List[EventRegistrationWithPaymentResponse],
)
async def get_event_registrations_with_payments(
    event_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get registrations for a specific event including sandbox payment amount."""
    registrations = (
        db.query(EventRegistration)
        .filter(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.created_at.desc())
        .all()
    )

    result: List[EventRegistrationWithPaymentResponse] = []

    for registration in registrations:
        user = db.query(User).filter(User.id == registration.user_id).first()

        # Use first successful payment session for this user/event/category
        payment_session = (
            db.query(PaymentSession)
            .filter(
                PaymentSession.event_id == registration.event_id,
                PaymentSession.user_id == registration.user_id,
                PaymentSession.category == registration.category,
                PaymentSession.status == "success",
            )
            .order_by(PaymentSession.created_at.desc())
            .first()
        )

        amount = payment_session.amount if payment_session else None

        result.append(
            EventRegistrationWithPaymentResponse(
                id=registration.id,
                event_id=registration.event_id,
                user_id=registration.user_id,
                user_name=user.full_name if user else "Unknown",
                event_title=None,
                category=registration.category,
                status=registration.status,
                rejection_reasons=registration.rejection_reasons,
                rejection_description=registration.rejection_description,
                created_at=registration.created_at,
                updated_at=registration.updated_at,
                amount=amount,
            )
        )

    return result

@router.put("/registrations/{registration_id}/approve")
async def approve_registration(
    registration_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve an event registration"""
    registration = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    registration.status = "approved"
    db.commit()
    return {"message": "Registration approved"}

@router.put("/registrations/{registration_id}/reject")
async def reject_registration(
    registration_id: str,
    rejection_data: RejectEventRegistrationRequest = Body(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject an event registration with reasons"""
    registration = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    registration.status = "rejected"
    registration.rejection_reasons = rejection_data.reasons
    registration.rejection_description = rejection_data.description
    db.commit()
    return {"message": "Registration rejected"}

