"""
Blog models
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class BlogPost(Base):
    """Blog post model"""
    __tablename__ = "blog_posts"

    id = Column(String(255), primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)
    excerpt = Column(Text)
    category = Column(String(100), nullable=False)
    image_url = Column(String(500))
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    post_type = Column(String(20), default="blog", nullable=False, index=True)  # blog, content - to distinguish between blog posts and content posts
    author_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="blog_posts")
    likes = relationship("BlogPostLike", back_populates="post", cascade="all, delete-orphan")

    @property
    def likes_count(self) -> int:
        """Get likes count"""
        return len(self.likes)

    @property
    def comments_count(self) -> int:
        """Get comments count (placeholder for future implementation)"""
        return 0


class BlogPostLike(Base):
    """Blog post like model"""
    __tablename__ = "blog_post_likes"

    id = Column(String(255), primary_key=True, index=True)
    post_id = Column(String(255), ForeignKey("blog_posts.id"), nullable=False)
    user_id = Column(String(255), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    post = relationship("BlogPost", back_populates="likes")

