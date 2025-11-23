"""
Main FastAPI application entry point
"""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create tables (only in development, use migrations in production)
if os.getenv("ENVIRONMENT") != "production":
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
else:
    logger.info("Production mode: skipping table creation (use migrations)")

app = FastAPI(
    title="PaceUp API",
    description="API for PaceUp running community platform",
    version="1.0.0",
)

logger.info("Starting PaceUp API...")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploads)
# Ensure directory exists
os.makedirs("public/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="public/uploads"), name="uploads")

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "PaceUp API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from app.core.database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
