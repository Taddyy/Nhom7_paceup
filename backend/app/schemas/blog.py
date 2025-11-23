"""
Blog schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BlogPostBase(BaseModel):
    """Base blog post schema"""
    title: str
    content: str
    category: str
    image_url: Optional[str] = None


class BlogPostCreate(BlogPostBase):
    """Blog post creation schema"""
    pass


class BlogPostUpdate(BaseModel):
    """Blog post update schema"""
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None


class BlogPostResponse(BlogPostBase):
    """Blog post response schema"""
    id: str
    author_id: str
    author_name: str
    excerpt: Optional[str] = None
    status: str
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BlogPost(BlogPostResponse):
    """Full blog post schema"""
    pass

