"""
Admin endpoints tests
"""
import pytest
from fastapi import status


class TestAdminStats:
    """Test admin statistics endpoint"""
    
    def test_get_admin_stats_with_admin_token(self, client, admin_headers, admin_user, test_user):
        """Test getting admin stats with admin token"""
        response = client.get("/api/v1/admin/stats", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_users" in data
        assert "pending_posts" in data
        assert "pending_events" in data
        assert "total_posts" in data
        assert "total_events" in data
        assert data["total_users"] >= 2  # admin + test_user
    
    def test_get_admin_stats_with_user_token(self, client, auth_headers):
        """Test getting admin stats with regular user token (should fail)"""
        response = client.get("/api/v1/admin/stats", headers=auth_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_admin_stats_no_token(self, client):
        """Test getting admin stats without token"""
        response = client.get("/api/v1/admin/stats")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminPosts:
    """Test admin posts management"""
    
    def test_list_admin_posts_all(self, client, admin_headers, test_blog_post):
        """Test listing all posts as admin"""
        response = client.get("/api/v1/admin/posts?status=all", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_list_admin_posts_pending(self, client, admin_headers, test_blog_post):
        """Test listing pending posts as admin"""
        response = client.get("/api/v1/admin/posts?status=pending", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert all(post["status"] == "pending" for post in data)
    
    def test_list_admin_posts_approved(self, client, admin_headers, db_session, test_blog_post):
        """Test listing approved posts as admin"""
        # Update post status to approved
        test_blog_post.status = "approved"
        db_session.commit()
        
        response = client.get("/api/v1/admin/posts?status=approved", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert all(post["status"] == "approved" for post in data)
    
    def test_list_admin_posts_no_token(self, client):
        """Test listing admin posts without token"""
        response = client.get("/api/v1/admin/posts")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_admin_posts_with_user_token(self, client, auth_headers):
        """Test listing admin posts with regular user token (should fail)"""
        response = client.get("/api/v1/admin/posts", headers=auth_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestApproveRejectPost:
    """Test approving and rejecting posts"""
    
    def test_approve_post(self, client, admin_headers, test_blog_post):
        """Test approving a post as admin"""
        assert test_blog_post.status == "pending"
        
        response = client.put(
            f"/api/v1/admin/posts/{test_blog_post.id}/status?status_update=approved",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "approved" in data["message"].lower()
        
        # Verify post is approved
        get_response = client.get(f"/api/v1/blog/posts/{test_blog_post.id}")
        assert get_response.status_code == status.HTTP_200_OK
        post_data = get_response.json()
        assert post_data["status"] == "approved"
    
    def test_reject_post(self, client, admin_headers, test_blog_post):
        """Test rejecting a post as admin"""
        response = client.put(
            f"/api/v1/admin/posts/{test_blog_post.id}/status?status_update=rejected",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "rejected" in data["message"].lower()
    
    def test_update_post_status_with_user_token(self, client, auth_headers, test_blog_post):
        """Test updating post status with regular user token (should fail)"""
        response = client.put(
            f"/api/v1/admin/posts/{test_blog_post.id}/status?status_update=approved",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_post_status_post_not_found(self, client, admin_headers):
        """Test updating status of non-existent post"""
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.put(
            f"/api/v1/admin/posts/{fake_id}/status?status_update=approved",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestAdminEvents:
    """Test admin events management"""
    
    def test_list_admin_events_all(self, client, admin_headers, test_event):
        """Test listing all events as admin"""
        response = client.get("/api/v1/admin/events?status=all", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_list_admin_events_pending(self, client, admin_headers, test_event):
        """Test listing pending events as admin"""
        response = client.get("/api/v1/admin/events?status=pending", headers=admin_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert all(event.get("status") == "pending" for event in data)
    
    def test_list_admin_events_no_token(self, client):
        """Test listing admin events without token"""
        response = client.get("/api/v1/admin/events")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestApproveRejectEvent:
    """Test approving and rejecting events"""
    
    def test_approve_event(self, client, admin_headers, test_event, db_session):
        """Test approving an event as admin"""
        assert test_event.status == "pending"
        
        response = client.put(
            f"/api/v1/admin/events/{test_event.id}/status?status_update=approved",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "approved" in data["message"].lower()
        
        # Verify event is approved
        db_session.refresh(test_event)
        assert test_event.status == "approved"
    
    def test_reject_event(self, client, admin_headers, test_event):
        """Test rejecting an event as admin"""
        response = client.put(
            f"/api/v1/admin/events/{test_event.id}/status?status_update=rejected",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "rejected" in data["message"].lower()
    
    def test_update_event_status_with_user_token(self, client, auth_headers, test_event):
        """Test updating event status with regular user token (should fail)"""
        response = client.put(
            f"/api/v1/admin/events/{test_event.id}/status?status_update=approved",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_event_status_event_not_found(self, client, admin_headers):
        """Test updating status of non-existent event"""
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.put(
            f"/api/v1/admin/events/{fake_id}/status?status_update=approved",
            headers=admin_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

