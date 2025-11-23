"""
Authentication schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Register request schema"""
    email: EmailStr
    password: str
    full_name: str
    phone: str
    date_of_birth: str
    gender: str
    address: Optional[str] = None
    running_experience: str
    goals: Optional[str] = None


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data schema"""
    user_id: Optional[str] = None


class AuthResponse(Token):
    """Authentication response schema"""
    user: UserResponse

