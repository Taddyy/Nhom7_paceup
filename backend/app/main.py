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

# Don't create tables on import - use /api/v1/init-db endpoint instead
# This prevents import errors if database is not ready
logger.info("Production mode: Tables will be created via /api/v1/init-db endpoint")

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
# Note: Vercel serverless functions have read-only file system
# Static file serving is handled by Vercel's static file system
# Only create directory if not in serverless environment
if not os.getenv("VERCEL"):
    try:
        os.makedirs("public/uploads", exist_ok=True)
        app.mount("/uploads", StaticFiles(directory="public/uploads"), name="uploads")
    except OSError:
        # Read-only file system (e.g., Vercel serverless)
        logger.warning("Cannot create uploads directory (read-only file system). Static files will be handled by Vercel.")
else:
    logger.info("Vercel environment detected: skipping local uploads directory creation")

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "PaceUp API", "version": "1.0.0"}


@app.get("/health")
async def health_check_root():
    """Health check endpoint at root level"""
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


# ============================================================================
# TEMPORARY ENDPOINTS FOR DATABASE INITIALIZATION
# NOTE: Keep these endpoints for now as they may be needed for re-initialization
# Consider removing or securing them in production
# ============================================================================

@app.get("/api/v1/init-db")
@app.post("/api/v1/init-db")
async def init_database_endpoint():
    """
    Initialize database tables (TEMPORARY - Remove after use)
    
    This endpoint creates all required database tables.
    Only use this once after first deployment.
    """
    try:
        logger.info("Initializing database tables...")
        # Import all models to register them with Base.metadata
        from app.models import user, event, blog
        
        Base.metadata.create_all(bind=engine)
        
        tables_created = list(Base.metadata.tables.keys())
        logger.info(f"✅ Database tables created: {tables_created}")
        
        return {
            "status": "success",
            "message": "Database tables created successfully",
            "tables": tables_created
        }
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}", exc_info=True)
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Full traceback: {error_trace}")
        return {
            "status": "error",
            "message": f"Failed to create database tables: {str(e)}",
            "error_type": type(e).__name__
        }


@app.get("/api/v1/seed-admin")
@app.post("/api/v1/seed-admin")
async def seed_admin_endpoint():
    """
    Create admin user (TEMPORARY - Keep for now, may need for re-seeding)
    
    Creates admin user with email: admin@gmail.com, password: admin123
    Only use this once after database initialization.
    NOTE: Consider securing this endpoint in production or removing it.
    """
    try:
        import uuid
        from app.core.database import SessionLocal
        from app.core.security import get_password_hash
        from app.models.user import User
        
        db = SessionLocal()
        try:
            # Check if admin already exists
            admin = db.query(User).filter(User.email == "admin@gmail.com").first()
            
            if admin:
                logger.info("Admin user already exists")
                return {
                    "status": "success",
                    "message": "Admin user already exists",
                    "email": admin.email,
                    "role": admin.role
                }
            
            # Create admin user
            admin_id = str(uuid.uuid4())
            hashed_password = get_password_hash("admin123")
            
            new_admin = User(
                id=admin_id,
                email="admin@gmail.com",
                hashed_password=hashed_password,
                full_name="Administrator",
                role="admin",
                is_active="true",
            )
            
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            
            logger.info("✅ Admin user created successfully!")
            return {
                "status": "success",
                "message": "Admin user created successfully",
                "email": new_admin.email,
                "password": "admin123",
                "role": new_admin.role,
                "warning": "⚠️ IMPORTANT: Change the admin password after first login!"
            }
        finally:
            db.close()
    except Exception as e:
        logger.error(f"❌ Failed to create admin user: {e}", exc_info=True)
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Full traceback: {error_trace}")
        return {
            "status": "error",
            "message": f"Failed to create admin user: {str(e)}",
            "error_type": type(e).__name__
        }
