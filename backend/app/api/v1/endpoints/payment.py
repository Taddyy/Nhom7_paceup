"""
Payment endpoints for sandbox QR flow.
"""
from datetime import datetime, timedelta
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.event import Event, EventRegistration
from app.models.payment import PaymentSession
from app.models.user import User
from app.schemas.payment import (
    PaymentConfirmRequest,
    PaymentSessionCreate,
    PaymentSessionResponse,
)

router = APIRouter()


def get_current_user_id(authorization: Optional[str] = None) -> Optional[str]:
    """Extract user ID from authorization token."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None


def to_response_model(session: PaymentSession) -> PaymentSessionResponse:
    """Convert PaymentSession ORM model to response schema."""
    return PaymentSessionResponse(
        id=session.id,
        event_id=session.event_id,
        category=session.category,
        amount=session.amount,
        status=session.status,
        created_at=session.created_at or datetime.utcnow(),
        expires_at=session.expires_at,
    )


@router.post("/session", response_model=PaymentSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_session(
    data: PaymentSessionCreate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> PaymentSessionResponse:
    """Create a new payment session for sandbox QR flow."""
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    event = db.query(Event).filter(Event.id == data.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if data.category not in event.categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category",
        )

    # Sandbox: simple expiry window (5 minutes for QR scanning)
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    session_id = str(uuid.uuid4())

    session = PaymentSession(
        id=session_id,
        event_id=data.event_id,
        user_id=user_id,
        category=data.category,
        amount=data.amount,
        status="pending",
        expires_at=expires_at,
    )

    db.add(session)
    db.commit()

    # Refresh to get created_at from DB
    db.refresh(session)

    return to_response_model(session)


@router.post("/confirm", status_code=status.HTTP_200_OK)
async def confirm_payment(
    payload: PaymentConfirmRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Confirm or cancel a payment session from mobile sandbox page."""
    session = (
        db.query(PaymentSession)
        .filter(PaymentSession.id == payload.session_id)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment session not found",
        )

    if session.status in {"success", "cancelled", "expired"}:
        # Idempotent behaviour
        return {"status": session.status}

    # Check expiry
    if session.expires_at and datetime.utcnow() > session.expires_at:
        session.status = "expired"
        db.commit()
        return {"status": "expired"}

    if payload.action == "cancel":
        session.status = "cancelled"
        db.commit()
        return {"status": "cancelled"}

    # Mark as success and create event registration if not exists
    session.status = "success"

    existing_registration = (
        db.query(EventRegistration)
        .filter(
            EventRegistration.event_id == session.event_id,
            EventRegistration.user_id == session.user_id,
            EventRegistration.category == session.category,
        )
        .first()
    )

    if not existing_registration:
        registration_id = str(uuid.uuid4())
        registration = EventRegistration(
            id=registration_id,
            event_id=session.event_id,
            user_id=session.user_id,
            category=session.category,
            status="pending",  # still requires admin approval
        )
        db.add(registration)

    db.commit()
    return {"status": "success"}


@router.get("/session/{session_id}", response_model=PaymentSessionResponse)
async def get_payment_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> PaymentSessionResponse:
    """Get current status of a payment session for polling on PC."""
    session = (
        db.query(PaymentSession)
        .filter(PaymentSession.id == session_id)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment session not found",
        )

    # Update to expired if needed
    if session.status == "pending" and session.expires_at and datetime.utcnow() > session.expires_at:
        session.status = "expired"
        db.commit()
        db.refresh(session)

    return to_response_model(session)


