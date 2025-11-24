"""
Events endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.event import Event, EventRegistration
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventResponse, EventRegistrationRequest
import uuid
from datetime import datetime

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


@router.get("", response_model=dict)
async def get_events(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    organizer_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all events with pagination"""
    offset = (page - 1) * limit
    
    query = db.query(Event)
    if organizer_id:
        query = query.filter(Event.organizer_id == organizer_id)
    
    events = query.order_by(Event.date.asc()).offset(offset).limit(limit).all()
    total = query.count()
    
    result = []
    for event in events:
        organizer = db.query(User).filter(User.id == event.organizer_id).first()
        participants_count = db.query(EventRegistration).filter(
            EventRegistration.event_id == event.id
        ).count()
        
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
            participants_count=participants_count,
            bank_name=event.bank_name,
            account_number=event.account_number,
            account_holder_name=event.account_holder_name,
            created_at=event.created_at,
            updated_at=event.updated_at,
        ))
    
    return {
        "events": result,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: Session = Depends(get_db)):
    """Get single event by ID"""
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    organizer = db.query(User).filter(User.id == event.organizer_id).first()
    participants_count = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id
    ).count()
    
    return EventResponse(
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
        participants_count=participants_count,
        bank_name=event.bank_name,
        account_number=event.account_number,
        account_holder_name=event.account_holder_name,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Create new event"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    event_id = str(uuid.uuid4())
    new_event = Event(
        id=event_id,
        title=event_data.title,
        description=event_data.description,
        full_description=event_data.full_description,
        date=event_data.date,
        time=event_data.time,
        location=event_data.location,
        address=event_data.address,
        image_url=event_data.image_url,
        max_participants=event_data.max_participants,
        registration_deadline=event_data.registration_deadline,
        categories=event_data.categories,
        organizer_id=user_id,
        bank_name=event_data.bank_name,
        account_number=event_data.account_number,
        account_holder_name=event_data.account_holder_name,
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    organizer = db.query(User).filter(User.id == user_id).first()
    
    return EventResponse(
        id=new_event.id,
        title=new_event.title,
        description=new_event.description,
        full_description=new_event.full_description,
        date=new_event.date,
        time=new_event.time,
        location=new_event.location,
        address=new_event.address,
        image_url=new_event.image_url,
        max_participants=new_event.max_participants,
        registration_deadline=new_event.registration_deadline,
        categories=new_event.categories,
        organizer_id=new_event.organizer_id,
        organizer_name=organizer.full_name if organizer else "Unknown",
        participants_count=0,
        bank_name=new_event.bank_name,
        account_number=new_event.account_number,
        account_holder_name=new_event.account_holder_name,
        created_at=new_event.created_at,
        updated_at=new_event.updated_at,
    )


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Update event"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    if event.organizer_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this event",
        )
    
    # Update fields
    update_data = event_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    
    organizer = db.query(User).filter(User.id == event.organizer_id).first()
    participants_count = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id
    ).count()
    
    return EventResponse(
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
        participants_count=participants_count,
        bank_name=event.bank_name,
        account_number=event.account_number,
        account_holder_name=event.account_holder_name,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Delete event"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    if event.organizer_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this event",
        )
    
    db.delete(event)
    db.commit()


@router.post("/register", status_code=status.HTTP_200_OK)
async def register_for_event(
    registration_data: EventRegistrationRequest,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Register for an event"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    event = db.query(Event).filter(Event.id == registration_data.event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    # Check registration deadline
    if datetime.now() > event.registration_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration deadline has passed",
        )
    
    # Check if event is full
    participants_count = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id
    ).count()
    
    if participants_count >= event.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is full",
        )
    
    # Check if category is valid
    if registration_data.category not in event.categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category",
        )
    
    # Check if already registered
    existing_registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == registration_data.event_id,
        EventRegistration.user_id == user_id
    ).first()
    
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event",
        )
    
    # Create registration
    registration_id = str(uuid.uuid4())
    new_registration = EventRegistration(
        id=registration_id,
        event_id=registration_data.event_id,
        user_id=user_id,
        category=registration_data.category,
    )
    
    db.add(new_registration)
    db.commit()
    
    return {"message": "Successfully registered for event"}


@router.delete("/{event_id}/register", status_code=status.HTTP_200_OK)
async def cancel_event_registration(
    event_id: str,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Cancel event registration"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == user_id
    ).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )
    
    db.delete(registration)
    db.commit()
    
    return {"message": "Registration cancelled"}

