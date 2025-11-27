"""
Content endpoints tests

Content posts are automatically approved, unlike blog posts which require admin approval.
"""
import pytest
from fastapi import status


class TestListContentPosts:
    """Test listing content posts"""
    
    def test_list_content_posts_empty(self, client):
        """Test listing content posts when there are none"""
        response = client.get("/api/v1/content/posts")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert isinstance(data["posts"], list)
        assert data["total"] == 0
    
    def test_list_content_posts_with_pagination(self, client, test_blog_post, db_session):
        """Test listing content posts with pagination"""
        # Update post to be a content post (approved and post_type="content")
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        response = client.get("/api/v1/content/posts?page=1&limit=10")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        assert len(data["posts"]) >= 1
        assert data["page"] == 1
        assert data["limit"] == 10
    
    def test_list_content_posts_filter_by_author(self, client, test_blog_post, test_user, db_session):
        """Test listing content posts filtered by author"""
        # Update post to be a content post (approved and post_type="content")
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        response = client.get(f"/api/v1/content/posts?author_id={test_user.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        assert all(post["author_id"] == test_user.id for post in data["posts"])
    
    def test_list_content_posts_only_approved(self, client, test_blog_post, db_session):
        """Test that content posts only return approved posts"""
        # Set post to pending
        test_blog_post.status = "pending"
        db_session.commit()
        
        response = client.get("/api/v1/content/posts")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Pending posts should not appear
        assert all(post["status"] == "approved" for post in data["posts"])


class TestGetContentPost:
    """Test getting single content post"""
    
    def test_get_content_post_by_id(self, client, test_blog_post, db_session):
        """Test getting content post by ID"""
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        response = client.get(f"/api/v1/content/posts/{test_blog_post.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_blog_post.id
        assert data["title"] == test_blog_post.title
    
    def test_get_content_post_not_found(self, client):
        """Test getting non-existent content post"""
        response = client.get("/api/v1/content/posts/non-existent-id")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateContentPost:
    """Test creating content posts"""
    
    def test_create_content_post_authenticated(self, client, auth_headers, test_user):
        """Test creating content post when authenticated"""
        post_data = {
            "title": "Test Content Post",
            "content": "<p>This is a test content post</p>",
            "category": "general"
        }
        
        response = client.post(
            "/api/v1/content/posts",
            json=post_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == post_data["title"]
        assert data["content"] == post_data["content"]
        assert data["status"] == "approved"  # Content posts are auto-approved
        assert data["author_id"] == test_user.id
    
    def test_create_content_post_no_token(self, client):
        """Test creating content post without authentication"""
        post_data = {
            "title": "Test Content Post",
            "content": "<p>This is a test content post</p>",
            "category": "general"
        }
        
        response = client.post("/api/v1/content/posts", json=post_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_content_post_with_image(self, client, auth_headers, test_user):
        """Test creating content post with image URL"""
        post_data = {
            "title": "Test Content Post with Image",
            "content": "<p>This is a test content post with image</p>",
            "category": "general",
            "image_url": "https://example.com/image.jpg"
        }
        
        response = client.post(
            "/api/v1/content/posts",
            json=post_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["image_url"] == post_data["image_url"]
        assert data["status"] == "approved"


class TestUpdateContentPost:
    """Test updating content posts"""
    
    def test_update_own_content_post(self, client, auth_headers, test_blog_post, db_session):
        """Test updating own content post"""
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        update_data = {
            "title": "Updated Content Post Title"
        }
        
        response = client.put(
            f"/api/v1/content/posts/{test_blog_post.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == update_data["title"]
    
    def test_update_other_user_content_post(self, client, auth_headers, test_blog_post, db_session):
        """Test updating another user's content post"""
        import uuid
        from app.models.user import User
        from app.core.security import get_password_hash
        
        # Create another user
        other_user = User(
            id=str(uuid.uuid4()),
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Other User",
            role="user",
            is_active="true"
        )
        db_session.add(other_user)
        
        # Update post to belong to other user
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        test_blog_post.author_id = other_user.id
        db_session.commit()
        
        update_data = {
            "title": "Updated Content Post Title"
        }
        
        response = client.put(
            f"/api/v1/content/posts/{test_blog_post.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_content_post_no_token(self, client, test_blog_post, db_session):
        """Test updating content post without authentication"""
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        update_data = {
            "title": "Updated Content Post Title"
        }
        
        response = client.put(
            f"/api/v1/content/posts/{test_blog_post.id}",
            json=update_data
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDeleteContentPost:
    """Test deleting content posts"""
    
    def test_delete_own_content_post(self, client, auth_headers, test_blog_post, db_session):
        """Test deleting own content post"""
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/content/posts/{test_blog_post.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify post is deleted
        get_response = client.get(f"/api/v1/content/posts/{test_blog_post.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_other_user_content_post(self, client, auth_headers, test_blog_post, db_session):
        """Test deleting another user's content post"""
        import uuid
        from app.models.user import User
        from app.core.security import get_password_hash
        
        # Create another user
        other_user = User(
            id=str(uuid.uuid4()),
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Other User",
            role="user",
            is_active="true"
        )
        db_session.add(other_user)
        
        # Update post to belong to other user
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        test_blog_post.author_id = other_user.id
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/content/posts/{test_blog_post.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_content_post_no_token(self, client, test_blog_post, db_session):
        """Test deleting content post without authentication"""
        test_blog_post.status = "approved"
        test_blog_post.post_type = "content"
        db_session.commit()
        
        response = client.delete(f"/api/v1/content/posts/{test_blog_post.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

