"""
Database initialization script

Run this script after provisioning your MySQL database to create all required tables.

Usage:
    python backend/init_db.py

Or with environment variable:
    DATABASE_URL=mysql+pymysql://user:pass@host:port/db python backend/init_db.py
"""
import os
import sys
import logging

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine
from app.core.config import settings
from app.models import user, event, blog  # Import all models to register them

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_database():
    """Initialize database by creating all tables"""
    try:
        logger.info(f"Connecting to database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'hidden'}")
        logger.info("Creating database tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ Database tables created successfully!")
        logger.info("Tables created:")
        for table_name in Base.metadata.tables.keys():
            logger.info(f"  - {table_name}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        logger.error("Please check:")
        logger.error("  1. DATABASE_URL is set correctly")
        logger.error("  2. Database server is accessible")
        logger.error("  3. Database user has CREATE TABLE permissions")
        return False


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)

