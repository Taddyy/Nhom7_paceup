import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_admin():
    db: Session = SessionLocal()
    try:
        admin_email = "admin@gmail.com"
        admin_password = "123456"
        
        user = db.query(User).filter(User.email == admin_email).first()
        
        if not user:
            logger.info(f"Creating admin user {admin_email}...")
            new_admin = User(
                id=str(uuid.uuid4()),
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                full_name="System Admin",
                role="admin",
                is_active="true"
            )
            db.add(new_admin)
            db.commit()
            logger.info("Admin user created successfully.")
        else:
            logger.info(f"Admin user {admin_email} already exists. Updating role...")
            user.role = "admin"
            user.hashed_password = get_password_hash(admin_password) # Reset password just in case
            db.commit()
            logger.info("Admin user updated.")
            
    except Exception as e:
        logger.error(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()

