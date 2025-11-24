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
    
    # Validate DATABASE_URL format - must use mysql+pymysql:// for pymysql driver
    db_url = settings.DATABASE_URL
    if not db_url.startswith("mysql+pymysql://"):
        if db_url.startswith("mysql://"):
            # Replace mysql:// with mysql+pymysql://
            db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
            logger.warning(f"DATABASE_URL format corrected: changed mysql:// to mysql+pymysql://")
        else:
            logger.error(f"Invalid DATABASE_URL format. Must start with mysql+pymysql://")
            logger.error(f"DATABASE_URL starts with: {db_url[:20]}...")
            raise ValueError(f"Invalid DATABASE_URL format. Must start with 'mysql+pymysql://'")
    
    logger.info(f"Using DATABASE_URL format: {db_url[:30]}... (truncated for security)")
    
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
        connect_args=connect_args
    )
    logger.info(f"Database engine created successfully for database: '{db_name}' (URL: {settings.DATABASE_URL[:50]}...)")
    # Create SessionLocal after successful engine creation
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"Failed to create database engine: {e}", exc_info=True)
    # Set engine and SessionLocal to None to indicate failure
    # This will be checked in get_db() to provide a clear error message
    engine = None
    SessionLocal = None
    logger.error("Database engine creation failed. The application will not be able to connect to the database.")

Base = declarative_base()


def get_db():
    """
    Dependency for getting database session.
    
    Raises:
        RuntimeError: If database session factory is not available
    """
    if SessionLocal is None:
        error_msg = "Database session factory is not available. Check database configuration and connection."
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    db = SessionLocal()
    try:
        yield db
    except Exception:
        # Rollback on exception
        db.rollback()
        raise
    finally:
        db.close()

