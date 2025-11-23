"""
Common dependencies for API endpoints
"""
from fastapi import Header, HTTPException, status
from typing import Optional
from app.core.security import decode_access_token
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User


def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = get_db()
) -> User:
    """Get current authenticated user from token"""
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
    
    return user

