"""
Authentication endpoints
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.config import settings
from app.models.user import User, RunningExperienceEnum
from app.models.event import EventRegistration, Event
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse
from app.schemas.user import UserResponse, UserStats, UserUpdate
from app.schemas.event import EventResponse
import uuid
from datetime import datetime
from typing import Optional, List

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint"""
    import logging
    import traceback
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Login attempt for email: {credentials.email}")
        
        # Test database connection first
        try:
            db.execute(text("SELECT 1"))
        except Exception as db_error:
            logger.error(f"Database connection error: {db_error}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failed"
            )
        
        # Query user from database
        try:
            user = db.query(User).filter(User.email == credentials.email).first()
        except Exception as query_error:
            logger.error(f"Database query error: {query_error}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to query user"
            )
        
        if not user:
            logger.warning(f"User not found: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        try:
            password_valid = verify_password(credentials.password, user.hashed_password)
        except Exception as pwd_error:
            logger.error(f"Password verification error: {pwd_error}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password verification failed"
            )
        
        if not password_valid:
            logger.warning(f"Invalid password for user: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if user.is_active != "true":
            logger.warning(f"Inactive user attempted login: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )
        
        # Create access token
        try:
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.id}, expires_delta=access_token_expires
            )
        except Exception as token_error:
            logger.error(f"Token creation error: {token_error}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create access token"
            )
        
        logger.info(f"Login successful for user: {credentials.email}")
        
        # Convert is_active from string to bool
        is_active_bool = user.is_active == "true" if user.is_active else False
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": is_active_bool,
                "created_at": user.created_at if user.created_at else datetime.utcnow(),
                "updated_at": user.updated_at,
                "phone": user.phone,
                "date_of_birth": user.date_of_birth,
                "gender": user.gender.value if user.gender else None,
                "address": user.address,
                "running_experience": user.running_experience.value if user.running_experience else None,
                "goals": user.goals,
                "avatar": user.avatar,
            },
        )
    except HTTPException:
        # Re-raise HTTP exceptions (401, 403, etc.)
        raise
    except Exception as e:
        # Log unexpected errors with full traceback
        error_trace = traceback.format_exc()
        logger.error(f"Unexpected error during login: {e}\n{error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/register", response_model=AuthResponse)
async def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    # Parse date_of_birth
    date_of_birth = None
    if user_data.date_of_birth:
        try:
            date_of_birth = datetime.fromisoformat(user_data.date_of_birth.replace('Z', '+00:00'))
        except:
            try:
                date_of_birth = datetime.strptime(user_data.date_of_birth, "%Y-%m-%d")
            except:
                pass
    
    new_user = User(
        id=user_id,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        date_of_birth=date_of_birth,
        gender=user_data.gender,
        address=user_data.address,
        running_experience=user_data.running_experience,
        goals=user_data.goals,
        is_active="true",
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.id}, expires_delta=access_token_expires
    )
    
    # Convert is_active from string to bool
    is_active_bool = new_user.is_active == "true" if new_user.is_active else False
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "is_active": is_active_bool,
            "created_at": new_user.created_at if new_user.created_at else datetime.utcnow(),
            "updated_at": new_user.updated_at,
            "phone": new_user.phone,
            "date_of_birth": new_user.date_of_birth,
            "gender": new_user.gender.value if new_user.gender else None,
            "address": new_user.address,
            "running_experience": new_user.running_experience.value if new_user.running_experience else None,
            "goals": new_user.goals,
            "avatar": new_user.avatar,
        },
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_info(
    user_update: UserUpdate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.get("/joined-events", response_model=List[EventResponse])
async def get_joined_events(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Get events joined by the authenticated user"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user_id = payload.get("sub")
    
    registrations = db.query(EventRegistration).filter(
        EventRegistration.user_id == user_id
    ).all()
    
    event_ids = [reg.event_id for reg in registrations]
    events = db.query(Event).filter(Event.id.in_(event_ids)).all()
    
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
            created_at=event.created_at,
            updated_at=event.updated_at,
        ))
        
    return result


@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """Get authenticated user's running statistics"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    events_joined = db.query(EventRegistration).filter(
        EventRegistration.user_id == user_id
    ).count()
    
    experience_distance_map = {
        RunningExperienceEnum.BEGINNER: 3.2,
        RunningExperienceEnum.INTERMEDIATE: 10.0,
        RunningExperienceEnum.ADVANCED: 21.0,
        RunningExperienceEnum.EXPERT: 42.0,
    }
    distance_per_event = experience_distance_map.get(user.running_experience, 3.2)
    total_distance = round(events_joined * distance_per_event, 1)
    
    return UserStats(total_distance_km=total_distance, events_joined=events_joined)
