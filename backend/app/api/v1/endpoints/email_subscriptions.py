from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin_optional
from app.models.email_subscription import EmailSubscription
from app.schemas.email_subscription import (
  EmailSubscriptionCreate,
  EmailSubscriptionList,
  EmailSubscriptionRead,
)

router = APIRouter()


@router.post(
  "/subscriptions",
  response_model=EmailSubscriptionRead,
  status_code=201,
  summary="Create a new email subscription entry from public form",
)
def create_email_subscription(
  payload: EmailSubscriptionCreate,
  db: Session = Depends(get_db),
) -> Any:
  """Store a new email address submitted from CTA / marketing forms.

  This endpoint is public and does not require authentication.
  Duplicate emails will simply return the existing record.
  """
  existing = (
    db.query(EmailSubscription)
    .filter(EmailSubscription.email == payload.email)
    .first()
  )
  if existing:
    return existing

  subscription = EmailSubscription(
    id=str(uuid4()),
    email=payload.email,
    source=payload.source,
  )
  db.add(subscription)
  db.commit()
  db.refresh(subscription)
  return subscription


@router.get(
  "/admin/subscriptions",
  response_model=EmailSubscriptionList,
  summary="List email subscriptions (admin only)",
)
def list_email_subscriptions(
  skip: int = 0,
  limit: int = Query(50, le=200),
  db: Session = Depends(get_db),
  current_admin=Depends(get_current_admin_optional),
) -> Any:
  """Return paginated list of stored email addresses for admins."""
  if current_admin is None:
    raise HTTPException(status_code=403, detail="Admin access required")

  query = db.query(EmailSubscription).order_by(EmailSubscription.created_at.desc())
  total = query.count()
  items = query.offset(skip).limit(limit).all()
  return EmailSubscriptionList(items=items, total=total)


@router.delete(
  "/admin/subscriptions/{subscription_id}",
  status_code=204,
  summary="Delete an email subscription (admin only)",
)
def delete_email_subscription(
  subscription_id: str,
  db: Session = Depends(get_db),
  current_admin=Depends(get_current_admin_optional),
) -> None:
  if current_admin is None:
    raise HTTPException(status_code=403, detail="Admin access required")

  subscription = (
    db.query(EmailSubscription)
    .filter(EmailSubscription.id == subscription_id)
    .first()
  )
  if not subscription:
    raise HTTPException(status_code=404, detail="Subscription not found")

  db.delete(subscription)
  db.commit()


