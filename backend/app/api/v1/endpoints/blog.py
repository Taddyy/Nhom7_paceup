"""
Blog endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.blog import BlogPost, BlogPostLike
from app.models.user import User
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse
import uuid
from datetime import datetime

router = APIRouter()


def get_current_user_id(authorization: str = None) -> str:
    """Extract user ID from authorization token"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None


@router.get("/posts", response_model=dict)
async def get_blog_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    author_id: Optional[str] = None,
    status_filter: str = "approved", # Default to approved
    db: Session = Depends(get_db)
):
    """Get all blog posts with pagination"""
    offset = (page - 1) * limit
    
    query = db.query(BlogPost)
    
    # Filter by status (unless specifically asking for all, mainly for admin later)
    if status_filter != "all":
        query = query.filter(BlogPost.status == status_filter)
        
    if author_id:
        query = query.filter(BlogPost.author_id == author_id)
    
    posts = query.order_by(BlogPost.created_at.desc()).offset(offset).limit(limit).all()
    total = query.count()
    
    result = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        likes_count = db.query(BlogPostLike).filter(BlogPostLike.post_id == post.id).count()
        
        # Generate excerpt from content if not set
        excerpt = post.excerpt
        if not excerpt and post.content:
            excerpt = post.content[:200] + "..." if len(post.content) > 200 else post.content
        
        result.append(BlogPostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            excerpt=excerpt,
            category=post.category,
            image_url=post.image_url,
            author_id=post.author_id,
            author_name=author.full_name if author else "Unknown",
            status=post.status,
            likes_count=likes_count,
            comments_count=0,
            created_at=post.created_at,
            updated_at=post.updated_at,
        ))
    
    return {
        "posts": result,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def get_blog_post(post_id: str, db: Session = Depends(get_db)):
    """Get single blog post by ID"""
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    
    author = db.query(User).filter(User.id == post.author_id).first()
    likes_count = db.query(BlogPostLike).filter(BlogPostLike.post_id == post.id).count()
    
    return BlogPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        excerpt=post.excerpt,
        category=post.category,
        image_url=post.image_url,
        author_id=post.author_id,
        author_name=author.full_name if author else "Unknown",
        status=post.status,
        likes_count=likes_count,
        comments_count=0,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    post_data: BlogPostCreate,
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """Create new blog post"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    post_id = str(uuid.uuid4())
    new_post = BlogPost(
        id=post_id,
        title=post_data.title,
        content=post_data.content,
        category=post_data.category,
        image_url=post_data.image_url,
        status="pending",
        author_id=user_id,
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    author = db.query(User).filter(User.id == user_id).first()
    
    return BlogPostResponse(
        id=new_post.id,
        title=new_post.title,
        content=new_post.content,
        excerpt=new_post.excerpt,
        category=new_post.category,
        image_url=new_post.image_url,
        author_id=new_post.author_id,
        author_name=author.full_name if author else "Unknown",
        status=new_post.status,
        likes_count=0,
        comments_count=0,
        created_at=new_post.created_at,
        updated_at=new_post.updated_at,
    )


@router.put("/posts/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: str,
    post_data: BlogPostUpdate,
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """Update blog post"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    
    if post.author_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post",
        )
    
    # Update fields
    update_data = post_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    
    db.commit()
    db.refresh(post)
    
    author = db.query(User).filter(User.id == post.author_id).first()
    likes_count = db.query(BlogPostLike).filter(BlogPostLike.post_id == post.id).count()
    
    return BlogPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        excerpt=post.excerpt,
        category=post.category,
        image_url=post.image_url,
        author_id=post.author_id,
        author_name=author.full_name if author else "Unknown",
        status=post.status,
        likes_count=likes_count,
        comments_count=0,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    post_id: str,
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """Delete blog post"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    
    if post.author_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post",
        )
    
    db.delete(post)
    db.commit()


@router.post("/posts/{post_id}/like", status_code=status.HTTP_200_OK)
async def like_blog_post(
    post_id: str,
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """Like a blog post"""
    user_id = get_current_user_id(authorization)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )
    
    # Check if already liked
    existing_like = db.query(BlogPostLike).filter(
        BlogPostLike.post_id == post_id,
        BlogPostLike.user_id == user_id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        db.commit()
        return {"message": "Post unliked"}
    
    # Like
    like_id = str(uuid.uuid4())
    new_like = BlogPostLike(
        id=like_id,
        post_id=post_id,
        user_id=user_id,
    )
    
    db.add(new_like)
    db.commit()
    
    return {"message": "Post liked"}

