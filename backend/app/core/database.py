"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Database connection
# For TiDB Cloud, we need to handle SSL connection
# TiDB is MySQL-compatible, so we use pymysql driver
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

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

