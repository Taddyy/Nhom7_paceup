"""
Notification service utilities
"""
import json
import uuid
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    related_id: str = None,
    metadata: dict = None
) -> Notification:
    """Create a new notification"""
    notification_id = str(uuid.uuid4())
    metadata_str = json.dumps(metadata) if metadata else None
    
    notification = Notification(
        id=notification_id,
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_id=related_id,
        metadata=metadata_str,
        is_read=False
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


def notify_post_liked(db: Session, post_author_id: str, liker_name: str, post_id: str):
    """Create notification when someone likes a post"""
    return create_notification(
        db=db,
        user_id=post_author_id,
        notification_type="post_liked",
        title="Bài viết của bạn được thích",
        message=f"{liker_name} đã thích bài viết của bạn",
        related_id=post_id
    )


def notify_post_commented(db: Session, post_author_id: str, commenter_name: str, post_id: str):
    """Create notification when someone comments on a post"""
    return create_notification(
        db=db,
        user_id=post_author_id,
        notification_type="post_commented",
        title="Bài viết của bạn có bình luận mới",
        message=f"{commenter_name} đã bình luận bài viết của bạn",
        related_id=post_id
    )


def notify_event_approved(db: Session, organizer_id: str, event_title: str, event_id: str):
    """Create notification when an event is approved"""
    return create_notification(
        db=db,
        user_id=organizer_id,
        notification_type="event_approved",
        title="Sự kiện của bạn đã được duyệt",
        message=f"Sự kiện '{event_title}' của bạn đã được duyệt",
        related_id=event_id
    )


def notify_event_rejected(
    db: Session,
    organizer_id: str,
    event_title: str,
    event_id: str,
    rejection_reasons: list = None,
    rejection_description: str = None
):
    """Create notification when an event is rejected"""
    metadata = {}
    if rejection_reasons:
        metadata["reasons"] = rejection_reasons
    if rejection_description:
        metadata["description"] = rejection_description
    
    return create_notification(
        db=db,
        user_id=organizer_id,
        notification_type="event_rejected",
        title="Sự kiện của bạn bị từ chối",
        message=f"Sự kiện '{event_title}' của bạn đã bị từ chối",
        related_id=event_id,
        metadata=metadata if metadata else None
    )


def notify_blog_approved(db: Session, author_id: str, blog_title: str, blog_id: str):
    """Create notification when a blog post is approved"""
    return create_notification(
        db=db,
        user_id=author_id,
        notification_type="blog_approved",
        title="Bài viết của bạn đã được duyệt",
        message=f"Bài viết '{blog_title}' của bạn đã được duyệt",
        related_id=blog_id
    )


def notify_blog_rejected(
    db: Session,
    author_id: str,
    blog_title: str,
    blog_id: str
):
    """Create notification when a blog post is rejected"""
    return create_notification(
        db=db,
        user_id=author_id,
        notification_type="blog_rejected",
        title="Bài viết của bạn bị từ chối",
        message=f"Bài viết '{blog_title}' của bạn đã bị từ chối",
        related_id=blog_id
    )

