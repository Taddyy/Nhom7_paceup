"""
Integration tests for end-to-end flows
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta


class TestBlogPostFlow:
    """Test complete blog post creation and approval flow"""
    
    def test_register_login_create_post_admin_approve_view(
        self, client, admin_user, db_session
    ):
        """Test complete flow: register → login → create post → admin approve → view"""
        # Step 1: Register new user
        user_data = {
            "email": "newuser@example.com",
            "password": "password123",
            "full_name": "New User",
            "phone": "0123456789",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "running_experience": "beginner"
        }
        register_response = client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == status.HTTP_200_OK
        user_token = register_response.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        user_id = register_response.json()["user"]["id"]
        
        # Step 2: Login (verify token works)
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": user_data["email"], "password": user_data["password"]}
        )
        assert login_response.status_code == status.HTTP_200_OK
        
        # Step 3: Create blog post
        post_data = {
            "title": "Integration Test Post",
            "content": "This is a test post created during integration testing.",
            "category": "training",
            "image_url": "https://example.com/image.jpg"
        }
        create_response = client.post(
            "/api/v1/blog/posts",
            headers=user_headers,
            json=post_data
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        post_id = create_response.json()["id"]
        assert create_response.json()["status"] == "pending"
        
        # Step 4: Admin views pending posts
        from app.core.security import create_access_token
        admin_token = create_access_token(
            data={"sub": admin_user.id},
            expires_delta=timedelta(minutes=30)
        )
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        pending_posts_response = client.get(
            "/api/v1/admin/posts?status=pending",
            headers=admin_headers
        )
        assert pending_posts_response.status_code == status.HTTP_200_OK
        pending_posts = pending_posts_response.json()
        assert any(post["id"] == post_id for post in pending_posts)
        
        # Step 5: Admin approves post
        approve_response = client.put(
            f"/api/v1/admin/posts/{post_id}/status?status_update=approved",
            headers=admin_headers
        )
        assert approve_response.status_code == status.HTTP_200_OK
        
        # Step 6: User views approved post
        view_response = client.get(f"/api/v1/blog/posts/{post_id}")
        assert view_response.status_code == status.HTTP_200_OK
        post_data = view_response.json()
        assert post_data["status"] == "approved"
        assert post_data["title"] == "Integration Test Post"
        
        # Step 7: Post appears in approved posts list (default filter is approved)
        approved_posts_response = client.get("/api/v1/blog/posts")
        assert approved_posts_response.status_code == status.HTTP_200_OK
        approved_posts = approved_posts_response.json()["posts"]
        assert any(post["id"] == post_id for post in approved_posts)


class TestEventFlow:
    """Test complete event creation and registration flow"""
    
    def test_register_login_create_event_admin_approve_register(
        self, client, admin_user, db_session
    ):
        """Test complete flow: register → login → create event → admin approve → register"""
        # Step 1: Register new user
        user_data = {
            "email": "eventuser@example.com",
            "password": "password123",
            "full_name": "Event User",
            "phone": "0123456789",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "running_experience": "beginner"
        }
        register_response = client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == status.HTTP_200_OK
        user_token = register_response.json()["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Step 2: Create event
        event_date = datetime.now() + timedelta(days=30)
        deadline = datetime.now() + timedelta(days=20)
        event_data = {
            "title": "Integration Test Event",
            "description": "A test event",
            "full_description": "Full description of integration test event",
            "date": event_date.isoformat(),
            "time": "06:00",
            "location": "Test Location",
            "address": "123 Test Street",
            "max_participants": 100,
            "registration_deadline": deadline.isoformat(),
            "categories": ["5K", "10K"],
            "image_url": "https://example.com/image.jpg"
        }
        create_response = client.post(
            "/api/v1/events",
            headers=user_headers,
            json=event_data
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        event_id = create_response.json()["id"]
        
        # Step 3: Admin views pending events
        from app.core.security import create_access_token
        admin_token = create_access_token(
            data={"sub": admin_user.id},
            expires_delta=timedelta(minutes=30)
        )
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        pending_events_response = client.get(
            "/api/v1/admin/events?status=pending",
            headers=admin_headers
        )
        assert pending_events_response.status_code == status.HTTP_200_OK
        pending_events = pending_events_response.json()
        assert any(event["id"] == event_id for event in pending_events)
        
        # Step 4: Admin approves event
        approve_response = client.put(
            f"/api/v1/admin/events/{event_id}/status?status_update=approved",
            headers=admin_headers
        )
        assert approve_response.status_code == status.HTTP_200_OK
        
        # Step 5: User registers for event
        register_event_response = client.post(
            "/api/v1/events/register",
            headers=user_headers,
            json={"event_id": event_id, "category": "5K"}
        )
        assert register_event_response.status_code == status.HTTP_200_OK
        
        # Step 6: User views joined events
        joined_events_response = client.get(
            "/api/v1/auth/joined-events",
            headers=user_headers
        )
        assert joined_events_response.status_code == status.HTTP_200_OK
        joined_events = joined_events_response.json()
        assert any(event["id"] == event_id for event in joined_events)


class TestAdminDashboardFlow:
    """Test admin dashboard complete flow"""
    
    def test_admin_login_view_stats_manage_posts_events(
        self, client, admin_user, db_session, test_blog_post, test_event
    ):
        """Test admin flow: login → view stats → manage posts → manage events"""
        # Step 1: Admin login
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": admin_user.email, "password": "admin123"}
        )
        assert login_response.status_code == status.HTTP_200_OK
        admin_token = login_response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Step 2: View admin stats
        stats_response = client.get("/api/v1/admin/stats", headers=admin_headers)
        assert stats_response.status_code == status.HTTP_200_OK
        stats = stats_response.json()
        assert stats["total_users"] >= 1
        assert stats["total_posts"] >= 1
        assert stats["total_events"] >= 1
        
        # Step 3: Approve a post
        approve_post_response = client.put(
            f"/api/v1/admin/posts/{test_blog_post.id}/status?status_update=approved",
            headers=admin_headers
        )
        assert approve_post_response.status_code == status.HTTP_200_OK
        
        # Verify stats updated
        updated_stats_response = client.get("/api/v1/admin/stats", headers=admin_headers)
        assert updated_stats_response.status_code == status.HTTP_200_OK
        updated_stats = updated_stats_response.json()
        assert updated_stats["pending_posts"] < stats["pending_posts"]
        
        # Step 4: Approve an event
        approve_event_response = client.put(
            f"/api/v1/admin/events/{test_event.id}/status?status_update=approved",
            headers=admin_headers
        )
        assert approve_event_response.status_code == status.HTTP_200_OK
        
        # Verify stats updated again
        final_stats_response = client.get("/api/v1/admin/stats", headers=admin_headers)
        assert final_stats_response.status_code == status.HTTP_200_OK
        final_stats = final_stats_response.json()
        assert final_stats["pending_events"] < updated_stats["pending_events"]

