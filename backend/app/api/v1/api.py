"""
API v1 router
"""
import re
from fastapi import APIRouter
from sqlalchemy import text
from app.api.v1.endpoints import auth, blog, content, events, documents, admin, reports, notifications, email_subscriptions, password_reset
from app.core.database import SessionLocal
from app.core.config import settings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(email_subscriptions.router, prefix="/email", tags=["email-subscriptions"])
api_router.include_router(password_reset.router, prefix="/password", tags=["password-reset"])


def extract_db_name_from_url(database_url: str) -> str:
    """
    Extract database name from DATABASE_URL connection string.
    
    Args:
        database_url: Database connection string (e.g., mysql+pymysql://user:pass@host:port/dbname?params)
    
    Returns:
        Database name if found, otherwise 'unknown'
    """
    try:
        match = re.search(r'/([^/?]+)(?:\?|$)', database_url)
        if match:
            return match.group(1)
        return "unknown"
    except Exception:
        return "unknown"


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@api_router.get("/check-db")
async def check_database():
    """
    Verify which database is currently being used.
    
    This endpoint extracts the database name from DATABASE_URL and also
    queries the actual database to verify the connection is using the correct database.
    
    Returns:
        - database_name_from_url: Database name extracted from DATABASE_URL
        - database_name_from_db: Actual database name from SELECT DATABASE()
        - match: Whether both names match
    """
    try:
        # Extract database name from DATABASE_URL
        db_name_from_url = extract_db_name_from_url(settings.DATABASE_URL)
        
        # Query actual database name from database
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT DATABASE()"))
            db_name_from_db = result.scalar()
            if db_name_from_db is None:
                db_name_from_db = "unknown"
        except Exception as e:
            db_name_from_db = f"error: {str(e)}"
        finally:
            db.close()
        
        # Check if they match
        match = (db_name_from_url == db_name_from_db)
        
        return {
            "status": "success",
            "database_name_from_url": db_name_from_url,
            "database_name_from_db": db_name_from_db,
            "match": match,
            "message": "Database verified successfully" if match else "Database name mismatch detected"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "database_name_from_url": extract_db_name_from_url(settings.DATABASE_URL)
        }

