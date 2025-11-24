"""
Pytest configuration and fixtures for API tests
"""
import os
import sys
from typing import Generator
import pytest
from starlette.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import models to register them with Base.metadata
from app.models import user, blog, event  # noqa: F401
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app

# Use SQLite in-memory database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a test database session with SQLite in-memory database.
    
    Yields:
        SQLAlchemy database session
    """
    # Create in-memory SQLite engine
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session factory
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with overridden database dependency.
    
    Args:
        db_session: Test database session fixture
        
    Yields:
        FastAPI test client
    """
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        # Clean up dependency overrides
        app.dependency_overrides.clear()


@pytest.fixture
def test_user_data() -> dict:
    """Sample user data for testing"""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "phone": "0123456789",
        "date_of_birth": "1990-01-01",
        "gender": "male",
        "address": "123 Test Street",
        "running_experience": "beginner",
        "goals": "Run a marathon"
    }


@pytest.fixture
def test_user(db_session: Session, test_user_data: dict):
    """
    Create a test user in the database.
    
    Args:
        db_session: Test database session
        test_user_data: User data fixture
        
    Returns:
        Created User model instance
    """
    import uuid
    from app.models.user import User, GenderEnum, RunningExperienceEnum
    from datetime import datetime
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(test_user_data["password"])
    
    test_user = User(
        id=user_id,
        email=test_user_data["email"],
        hashed_password=hashed_password,
        full_name=test_user_data["full_name"],
        phone=test_user_data["phone"],
        date_of_birth=datetime(1990, 1, 1),
        gender=GenderEnum.MALE,
        address=test_user_data["address"],
        running_experience=RunningExperienceEnum.BEGINNER,
        goals=test_user_data["goals"],
        role="user",
        is_active="true"
    )
    
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    
    return test_user


@pytest.fixture
def admin_user(db_session: Session):
    """
    Create an admin user in the database.
    
    Args:
        db_session: Test database session
        
    Returns:
        Created Admin User model instance
    """
    import uuid
    from app.models.user import User
    
    admin_id = str(uuid.uuid4())
    hashed_password = get_password_hash("admin123")
    
    admin = User(
        id=admin_id,
        email="admin@example.com",
        hashed_password=hashed_password,
        full_name="Admin User",
        role="admin",
        is_active="true"
    )
    
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    
    return admin


@pytest.fixture
def auth_token(test_user) -> str:
    """
    Create an access token for the test user.
    
    Args:
        test_user: Test user fixture
        
    Returns:
        JWT access token string
    """
    from datetime import timedelta
    token_data = {"sub": test_user.id}
    token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=30)
    )
    return token


@pytest.fixture
def admin_token(admin_user) -> str:
    """
    Create an access token for the admin user.
    
    Args:
        admin_user: Admin user fixture
        
    Returns:
        JWT access token string
    """
    from datetime import timedelta
    token_data = {"sub": admin_user.id}
    token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=30)
    )
    return token


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """
    Create authorization headers with bearer token.
    
    Args:
        auth_token: JWT token fixture
        
    Returns:
        Dictionary with Authorization header
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_headers(admin_token: str) -> dict:
    """
    Create authorization headers for admin user.
    
    Args:
        admin_token: Admin JWT token fixture
        
    Returns:
        Dictionary with Authorization header
    """
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_blog_post(db_session: Session, test_user):
    """
    Create a test blog post in the database.
    
    Args:
        db_session: Test database session
        test_user: Test user fixture
        
    Returns:
        Created BlogPost model instance
    """
    import uuid
    from app.models.blog import BlogPost
    
    post_id = str(uuid.uuid4())
    post = BlogPost(
        id=post_id,
        title="Test Blog Post",
        content="This is test content for a blog post.",
        excerpt="Test excerpt",
        category="training",
        status="pending",
        author_id=test_user.id
    )
    
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)
    
    return post


@pytest.fixture
def test_event(db_session: Session, test_user):
    """
    Create a test event in the database.
    
    Args:
        db_session: Test database session
        test_user: Test user fixture
        
    Returns:
        Created Event model instance
    """
    import uuid
    from app.models.event import Event
    from datetime import datetime, timedelta
    
    event_id = str(uuid.uuid4())
    event_date = datetime.now() + timedelta(days=30)
    deadline = datetime.now() + timedelta(days=20)
    
    test_event = Event(
        id=event_id,
        title="Test Running Event",
        description="A test running event",
        full_description="This is a full description of the test running event.",
        date=event_date,
        time="06:00",
        location="Test Location",
        address="123 Test Street, Test City",
        max_participants=100,
        registration_deadline=deadline,
        categories=["5K", "10K"],
        status="pending",
        organizer_id=test_user.id
    )
    
    db_session.add(test_event)
    db_session.commit()
    db_session.refresh(test_event)
    
    return test_event

