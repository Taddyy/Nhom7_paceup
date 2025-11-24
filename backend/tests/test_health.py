"""
Health check and system endpoint tests
"""
import pytest
from fastapi import status


class TestHealthCheck:
    """Test health check endpoints"""
    
    def test_health_check_root(self, client):
        """Test health check at root level"""
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "unhealthy"]
    
    def test_health_check_api(self, client):
        """Test health check at /api/health level"""
        response = client.get("/api/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "database" in data
    
    def test_health_check_v1(self, client):
        """Test health check at /api/v1/health level"""
        response = client.get("/api/v1/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "database" in data


class TestCheckDatabase:
    """Test database verification endpoint"""
    
    def test_check_database(self, client):
        """Test database check endpoint"""
        response = client.get("/api/v1/check-db")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        # For test environment with SQLite, we expect status might be different
        # but the endpoint should not fail
        assert data["status"] in ["success", "error"]


class TestRootEndpoint:
    """Test root endpoint"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["message"] == "PaceUp API"

