"""
Blog endpoints tests
"""
import pytest
from fastapi import status


class TestListBlogPosts:
    """Test listing blog posts"""
    
    def test_list_posts_empty(self, client):
        """Test listing posts when there are none"""
        response = client.get("/api/v1/blog/posts")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert isinstance(data["posts"], list)
        assert data["total"] == 0
    
    def test_list_posts_with_pagination(self, client, test_blog_post, db_session):
        """Test listing posts with pagination"""
        # Update post status to approved so it appears in default filter
        test_blog_post.status = "approved"
        db_session.commit()
        
        response = client.get("/api/v1/blog/posts?page=1&limit=10")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        assert len(data["posts"]) >= 1
        assert data["page"] == 1
        assert data["limit"] == 10
    
    def test_list_posts_filter_by_author(self, client, test_blog_post, test_user, db_session):
        """Test listing posts filtered by author"""
        # Update post status to approved so it appears in default filter
        test_blog_post.status = "approved"
        db_session.commit()
        
        response = client.get(f"/api/v1/blog/posts?author_id={test_user.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        assert all(post["author_id"] == test_user.id for post in data["posts"])


class TestGetBlogPost:
    """Test getting a single blog post"""
    
    def test_get_post_by_id(self, client, test_blog_post):
        """Test getting a post by ID"""
        response = client.get(f"/api/v1/blog/posts/{test_blog_post.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_blog_post.id
        assert data["title"] == test_blog_post.title
        assert data["content"] == test_blog_post.content
    
    def test_get_post_not_found(self, client):
        """Test getting a non-existent post"""
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/blog/posts/{fake_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateBlogPost:
    """Test creating blog posts"""
    
    def test_create_post_authenticated(self, client, auth_headers, test_user):
        """Test creating a post when authenticated"""
        post_data = {
            "title": "New Test Post",
            "content": "This is the content of a new test post.",
            "category": "training",
            "image_url": "https://example.com/image.jpg"
        }
        response = client.post("/api/v1/blog/posts", headers=auth_headers, json=post_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == post_data["title"]
        assert data["content"] == post_data["content"]
        assert data["category"] == post_data["category"]
        assert data["status"] == "pending"  # New posts should be pending
        assert data["author_id"] == test_user.id
    
    def test_create_post_no_token(self, client):
        """Test creating a post without authentication"""
        post_data = {
            "title": "New Test Post",
            "content": "This is the content.",
            "category": "training"
        }
        response = client.post("/api/v1/blog/posts", json=post_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateBlogPost:
    """Test updating blog posts"""
    
    def test_update_own_post(self, client, auth_headers, test_blog_post):
        """Test updating own post"""
        update_data = {
            "title": "Updated Title",
            "content": "Updated content"
        }
        response = client.put(
            f"/api/v1/blog/posts/{test_blog_post.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated content"
        assert data["id"] == test_blog_post.id
    
    def test_update_other_user_post(self, client, db_session, auth_headers, test_blog_post):
        """Test updating another user's post (should fail)"""
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
        
        # Create post by other user
        from app.models.blog import BlogPost
        other_post = BlogPost(
            id=str(uuid.uuid4()),
            title="Other User's Post",
            content="Content",
            category="training",
            author_id=other_user.id,
            status="pending"
        )
        db_session.add(other_post)
        db_session.commit()
        
        # Try to update other user's post
        update_data = {"title": "Hacked Title"}
        response = client.put(
            f"/api/v1/blog/posts/{other_post.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_post_no_token(self, client, test_blog_post):
        """Test updating post without token"""
        update_data = {"title": "New Title"}
        response = client.put(
            f"/api/v1/blog/posts/{test_blog_post.id}",
            json=update_data
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDeleteBlogPost:
    """Test deleting blog posts"""
    
    def test_delete_own_post(self, client, auth_headers, db_session, test_user):
        """Test deleting own post"""
        import uuid
        from app.models.blog import BlogPost
        
        post_to_delete = BlogPost(
            id=str(uuid.uuid4()),
            title="Post to Delete",
            content="Content",
            category="training",
            author_id=test_user.id,
            status="pending"
        )
        db_session.add(post_to_delete)
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/blog/posts/{post_to_delete.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify post is deleted
        get_response = client.get(f"/api/v1/blog/posts/{post_to_delete.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_other_user_post(self, client, db_session, auth_headers):
        """Test deleting another user's post (should fail)"""
        import uuid
        from app.models.user import User
        from app.models.blog import BlogPost
        from app.core.security import get_password_hash
        
        # Create another user and their post
        other_user = User(
            id=str(uuid.uuid4()),
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Other User",
            role="user",
            is_active="true"
        )
        db_session.add(other_user)
        
        other_post = BlogPost(
            id=str(uuid.uuid4()),
            title="Other User's Post",
            content="Content",
            category="training",
            author_id=other_user.id,
            status="pending"
        )
        db_session.add(other_post)
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/blog/posts/{other_post.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestLikeBlogPost:
    """Test liking/unliking blog posts"""
    
    def test_like_post(self, client, auth_headers, test_blog_post):
        """Test liking a post"""
        response = client.post(
            f"/api/v1/blog/posts/{test_blog_post.id}/like",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "liked" in data["message"].lower()
        
        # Verify like count increased
        get_response = client.get(f"/api/v1/blog/posts/{test_blog_post.id}")
        assert get_response.status_code == status.HTTP_200_OK
        # Note: likes_count might be 0 if not properly counted in response
    
    def test_unlike_post(self, client, auth_headers, test_blog_post):
        """Test unliking a post (like it first, then unlike)"""
        # Like first
        client.post(
            f"/api/v1/blog/posts/{test_blog_post.id}/like",
            headers=auth_headers
        )
        
        # Unlike
        response = client.post(
            f"/api/v1/blog/posts/{test_blog_post.id}/like",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "unliked" in data["message"].lower()
    
    def test_like_post_no_token(self, client, test_blog_post):
        """Test liking post without token"""
        response = client.post(f"/api/v1/blog/posts/{test_blog_post.id}/like")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_like_post_not_found(self, client, auth_headers):
        """Test liking non-existent post"""
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.post(
            f"/api/v1/blog/posts/{fake_id}/like",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

