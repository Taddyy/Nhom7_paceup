"""
Admin endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.blog import BlogPost
from app.models.event import Event
from app.schemas.blog import BlogPostResponse
from app.schemas.event import EventResponse
from pydantic import BaseModel

router = APIRouter()

class AdminStats(BaseModel):
    total_users: int
    pending_posts: int
    pending_events: int
    total_posts: int
    total_events: int

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
    
    return AdminStats(
        total_users=total_users,
        pending_posts=pending_posts,
        pending_events=pending_events,
        total_posts=total_posts,
        total_events=total_events
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
            created_at=event.created_at,
            updated_at=event.updated_at
        ))
    return result

@router.put("/events/{event_id}/status")
async def update_event_status(
    event_id: str,
    status_update: str = Query(..., regex="^(approved|rejected|pending)$"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject an event"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = status_update
    db.commit()
    return {"message": f"Event status updated to {status_update}"}

