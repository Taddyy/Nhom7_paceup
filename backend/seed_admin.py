"""
Seed admin user script

Creates an admin user with email admin@gmail.com if it doesn't exist.

Usage:
    python backend/seed_admin.py
"""
import os
import sys
import logging
import uuid

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_admin():
    """Create admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        
        if admin:
            logger.info("✅ Admin user already exists")
            logger.info(f"   Email: {admin.email}")
            logger.info(f"   Role: {admin.role}")
            return True
        
        # Create admin user
        admin_id = str(uuid.uuid4())
        hashed_password = get_password_hash("admin123")  # Change this password!
        
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
        logger.info(f"   Email: {new_admin.email}")
        logger.info(f"   Password: admin123 (CHANGE THIS IN PRODUCTION!)")
        logger.info(f"   Role: {new_admin.role}")
        logger.warning("⚠️  IMPORTANT: Change the admin password after first login!")
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = seed_admin()
    sys.exit(0 if success else 1)
