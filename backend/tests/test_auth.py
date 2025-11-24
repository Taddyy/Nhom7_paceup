"""
Authentication endpoint tests
"""
import pytest
from fastapi import status


class TestRegister:
    """Test user registration"""
    
    def test_register_new_user(self, client, test_user_data):
        """Test registering a new user successfully"""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_user_data["email"]
        assert data["user"]["full_name"] == test_user_data["full_name"]
        assert "id" in data["user"]
    
    def test_register_duplicate_email(self, client, test_user, test_user_data):
        """Test registering with an email that already exists"""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "already registered" in data["detail"].lower()
    
    def test_register_invalid_email(self, client):
        """Test registering with invalid email format"""
        invalid_data = {
            "email": "not-an-email",
            "password": "test123",
            "full_name": "Test User",
            "phone": "0123456789",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "running_experience": "beginner"
        }
        response = client.post("/api/v1/auth/register", json=invalid_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestLogin:
    """Test user login"""
    
    def test_login_success(self, client, test_user, test_user_data):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_user_data["email"]
    
    def test_login_wrong_password(self, client, test_user, test_user_data):
        """Test login with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "incorrect" in data["detail"].lower() or "invalid" in data["detail"].lower()
    
    def test_login_wrong_email(self, client):
        """Test login with non-existent email"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "testpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "incorrect" in data["detail"].lower() or "not found" in data["detail"].lower()
    
    def test_login_inactive_user(self, client, db_session, test_user_data):
        """Test login with inactive user"""
        import uuid
        from app.models.user import User, GenderEnum, RunningExperienceEnum
        from datetime import datetime
        from app.core.security import get_password_hash
        
        # Create inactive user
        inactive_user = User(
            id=str(uuid.uuid4()),
            email="inactive@example.com",
            hashed_password=get_password_hash(test_user_data["password"]),
            full_name="Inactive User",
            is_active="false",
            role="user"
        )
        db_session.add(inactive_user)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "inactive@example.com",
                "password": test_user_data["password"]
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetCurrentUser:
    """Test getting current user information"""
    
    def test_get_current_user_with_valid_token(self, client, auth_headers, test_user):
        """Test getting current user with valid token"""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user without token"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateProfile:
    """Test updating user profile"""
    
    def test_update_profile_success(self, client, auth_headers, test_user):
        """Test successfully updating user profile"""
        update_data = {
            "full_name": "Updated Name",
            "phone": "9876543210"
        }
        response = client.put("/api/v1/auth/me", headers=auth_headers, json=update_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["phone"] == "9876543210"
        assert data["email"] == test_user.email  # Email should not change
    
    def test_update_profile_no_token(self, client):
        """Test updating profile without token"""
        update_data = {"full_name": "New Name"}
        response = client.put("/api/v1/auth/me", json=update_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserStats:
    """Test getting user statistics"""
    
    def test_get_user_stats_success(self, client, auth_headers, test_user):
        """Test getting user stats successfully"""
        response = client.get("/api/v1/auth/stats", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_distance_km" in data
        assert "events_joined" in data
        assert isinstance(data["total_distance_km"], (int, float))
        assert isinstance(data["events_joined"], int)
        assert data["events_joined"] >= 0
    
    def test_get_user_stats_no_token(self, client):
        """Test getting stats without token"""
        response = client.get("/api/v1/auth/stats")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestJoinedEvents:
    """Test getting joined events"""
    
    def test_get_joined_events_empty(self, client, auth_headers):
        """Test getting joined events when user has none"""
        response = client.get("/api/v1/auth/joined-events", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_joined_events_no_token(self, client):
        """Test getting joined events without token"""
        response = client.get("/api/v1/auth/joined-events")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

