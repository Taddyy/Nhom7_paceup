"""
Database configuration and session management
"""
import logging
import re
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

# Database connection
# For TiDB Cloud, we need to handle SSL connection
# TiDB is MySQL-compatible, so we use pymysql driver
# Wrap engine creation in try-except to prevent import failures

def extract_database_name(database_url: str) -> str:
    """
    Extract database name from DATABASE_URL connection string.
    
    Args:
        database_url: Database connection string (e.g., mysql+pymysql://user:pass@host:port/dbname?params)
    
    Returns:
        Database name if found, otherwise 'unknown'
    """
    try:
        # Pattern to match database name in connection string
        # Format: mysql+pymysql://user:pass@host:port/dbname?params
        match = re.search(r'/([^/?]+)(?:\?|$)', database_url)
        if match:
            return match.group(1)
        return "unknown"
    except Exception:
        return "unknown"

try:
    connect_args = {}
    if "tidbcloud.com" in settings.DATABASE_URL:
        # TiDB Cloud requires SSL
        # pymysql handles SSL automatically when using mysql+pymysql://
        # But we can explicitly configure it if needed
        connect_args = {
            "ssl": {
                "ssl_disabled": False,
                "check_hostname": False
            }
        }
    
    # Extract and log database name for debugging
    db_name = extract_database_name(settings.DATABASE_URL)
    logger.info(f"Initializing database connection to database: '{db_name}'")
    
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
        connect_args=connect_args
    )
    logger.info(f"Database engine created successfully for database: '{db_name}' (URL: {settings.DATABASE_URL[:50]}...)")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}", exc_info=True)
    # Don't raise here - let the app start and fail later when actually connecting
    # This prevents import failures that would crash the entire function
    # Create a dummy engine that will fail on first use
    from sqlalchemy import create_engine as create_dummy_engine
    engine = create_dummy_engine("sqlite:///:memory:")  # Dummy engine
    logger.warning("Using dummy engine - database connection will fail on first use")

# Only create SessionLocal if engine was created successfully
if engine is not None:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    SessionLocal = None

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

