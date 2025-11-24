"""
Events endpoints tests
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta


class TestListEvents:
    """Test listing events"""
    
    def test_list_events_empty(self, client):
        """Test listing events when there are none"""
        response = client.get("/api/v1/events")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "events" in data
        assert "total" in data
        assert isinstance(data["events"], list)
        assert data["total"] == 0
    
    def test_list_events_with_pagination(self, client, test_event):
        """Test listing events with pagination"""
        response = client.get("/api/v1/events?page=1&limit=10")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        assert len(data["events"]) >= 1
    
    def test_list_events_filter_by_organizer(self, client, test_event, test_user):
        """Test listing events filtered by organizer"""
        response = client.get(f"/api/v1/events?organizer_id={test_user.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        assert all(event["organizer_id"] == test_user.id for event in data["events"])


class TestGetEvent:
    """Test getting a single event"""
    
    def test_get_event_by_id(self, client, test_event):
        """Test getting an event by ID"""
        response = client.get(f"/api/v1/events/{test_event.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_event.id
        assert data["title"] == test_event.title
        assert data["description"] == test_event.description
    
    def test_get_event_not_found(self, client):
        """Test getting a non-existent event"""
        import uuid
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/events/{fake_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateEvent:
    """Test creating events"""
    
    def test_create_event_authenticated(self, client, auth_headers, test_user):
        """Test creating an event when authenticated"""
        event_date = datetime.now() + timedelta(days=30)
        deadline = datetime.now() + timedelta(days=20)
        
        event_data = {
            "title": "New Running Event",
            "description": "A new running event",
            "full_description": "Full description of the event",
            "date": event_date.isoformat(),
            "time": "06:00",
            "location": "Test Location",
            "address": "123 Test Street",
            "max_participants": 100,
            "registration_deadline": deadline.isoformat(),
            "categories": ["5K", "10K"],
            "image_url": "https://example.com/image.jpg"
        }
        response = client.post("/api/v1/events", headers=auth_headers, json=event_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == event_data["title"]
        assert data["organizer_id"] == test_user.id
        assert "participants_count" in data
    
    def test_create_event_no_token(self, client):
        """Test creating an event without authentication"""
        event_date = datetime.now() + timedelta(days=30)
        deadline = datetime.now() + timedelta(days=20)
        
        event_data = {
            "title": "New Event",
            "description": "Description",
            "full_description": "Full description",
            "date": event_date.isoformat(),
            "time": "06:00",
            "location": "Location",
            "address": "Address",
            "max_participants": 50,
            "registration_deadline": deadline.isoformat(),
            "categories": ["5K"]
        }
        response = client.post("/api/v1/events", json=event_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateEvent:
    """Test updating events"""
    
    def test_update_own_event(self, client, auth_headers, test_event):
        """Test updating own event"""
        update_data = {
            "title": "Updated Event Title",
            "description": "Updated description"
        }
        response = client.put(
            f"/api/v1/events/{test_event.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Event Title"
        assert data["description"] == "Updated description"
    
    def test_update_other_user_event(self, client, db_session, auth_headers):
        """Test updating another user's event (should fail)"""
        import uuid
        from app.models.user import User
        from app.models.event import Event
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
        
        # Create event by other user
        event_date = datetime.now() + timedelta(days=30)
        deadline = datetime.now() + timedelta(days=20)
        other_event = Event(
            id=str(uuid.uuid4()),
            title="Other User's Event",
            description="Description",
            full_description="Full description",
            date=event_date,
            time="06:00",
            location="Location",
            address="Address",
            max_participants=50,
            registration_deadline=deadline,
            categories=["5K"],
            organizer_id=other_user.id,
            status="pending"
        )
        db_session.add(other_event)
        db_session.commit()
        
        # Try to update other user's event
        update_data = {"title": "Hacked Title"}
        response = client.put(
            f"/api/v1/events/{other_event.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestDeleteEvent:
    """Test deleting events"""
    
    def test_delete_own_event(self, client, auth_headers, db_session, test_user):
        """Test deleting own event"""
        import uuid
        from app.models.event import Event
        
        event_date = datetime.now() + timedelta(days=30)
        deadline = datetime.now() + timedelta(days=20)
        event_to_delete = Event(
            id=str(uuid.uuid4()),
            title="Event to Delete",
            description="Description",
            full_description="Full description",
            date=event_date,
            time="06:00",
            location="Location",
            address="Address",
            max_participants=50,
            registration_deadline=deadline,
            categories=["5K"],
            organizer_id=test_user.id,
            status="pending"
        )
        db_session.add(event_to_delete)
        db_session.commit()
        
        response = client.delete(
            f"/api/v1/events/{event_to_delete.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify event is deleted
        get_response = client.get(f"/api/v1/events/{event_to_delete.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND


class TestRegisterForEvent:
    """Test event registration"""
    
    def test_register_for_event_success(self, client, auth_headers, test_event, db_session):
        """Test successfully registering for an event"""
        # Approve event first (events need to be approved before registration)
        test_event.status = "approved"
        db_session.commit()
        
        registration_data = {
            "event_id": test_event.id,
            "category": "5K"
        }
        response = client.post(
            "/api/v1/events/register",
            headers=auth_headers,
            json=registration_data
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "successfully" in data["message"].lower() or "registered" in data["message"].lower()
    
    def test_register_for_event_already_registered(self, client, auth_headers, db_session, test_event, test_user):
        """Test registering for an event twice (should fail)"""
        import uuid
        from app.models.event import EventRegistration
        
        # Approve event first
        test_event.status = "approved"
        db_session.commit()
        
        # Register once
        registration_data = {
            "event_id": test_event.id,
            "category": "5K"
        }
        client.post("/api/v1/events/register", headers=auth_headers, json=registration_data)
        
        # Try to register again
        response = client.post(
            "/api/v1/events/register",
            headers=auth_headers,
            json=registration_data
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "already" in data["detail"].lower() or "registered" in data["detail"].lower()
    
    def test_register_for_event_full(self, client, auth_headers, db_session, test_user):
        """Test registering for a full event (should fail)"""
        import uuid
        from app.models.user import User
        from app.models.event import Event, EventRegistration
        from app.core.security import get_password_hash
        
        # Create event with max 1 participant
        event_date = datetime.now() + timedelta(days=30)
        deadline = datetime.now() + timedelta(days=20)
        full_event = Event(
            id=str(uuid.uuid4()),
            title="Full Event",
            description="Description",
            full_description="Full description",
            date=event_date,
            time="06:00",
            location="Location",
            address="Address",
            max_participants=1,
            registration_deadline=deadline,
            categories=["5K"],
            organizer_id=test_user.id,
            status="approved"
        )
        db_session.add(full_event)
        
        # Create another user and register them
        other_user = User(
            id=str(uuid.uuid4()),
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Other User",
            role="user",
            is_active="true"
        )
        db_session.add(other_user)
        
        registration = EventRegistration(
            id=str(uuid.uuid4()),
            event_id=full_event.id,
            user_id=other_user.id,
            category="5K"
        )
        db_session.add(registration)
        db_session.commit()
        
        # Try to register - should fail because event is full
        registration_data = {
            "event_id": full_event.id,
            "category": "5K"
        }
        response = client.post(
            "/api/v1/events/register",
            headers=auth_headers,
            json=registration_data
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "full" in data["detail"].lower()
    
    def test_register_for_event_past_deadline(self, client, auth_headers, db_session, test_user):
        """Test registering for an event past deadline (should fail)"""
        import uuid
        from app.models.event import Event
        
        # Create event with past deadline
        event_date = datetime.now() + timedelta(days=10)
        deadline = datetime.now() - timedelta(days=1)  # Deadline passed
        
        past_event = Event(
            id=str(uuid.uuid4()),
            title="Past Deadline Event",
            description="Description",
            full_description="Full description",
            date=event_date,
            time="06:00",
            location="Location",
            address="Address",
            max_participants=100,
            registration_deadline=deadline,
            categories=["5K"],
            organizer_id=test_user.id,
            status="approved"
        )
        db_session.add(past_event)
        db_session.commit()
        
        registration_data = {
            "event_id": past_event.id,
            "category": "5K"
        }
        response = client.post(
            "/api/v1/events/register",
            headers=auth_headers,
            json=registration_data
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "deadline" in data["detail"].lower()
    
    def test_register_for_event_invalid_category(self, client, auth_headers, test_event, db_session):
        """Test registering with invalid category"""
        # Approve event first
        test_event.status = "approved"
        db_session.commit()
        
        registration_data = {
            "event_id": test_event.id,
            "category": "InvalidCategory"
        }
        response = client.post(
            "/api/v1/events/register",
            headers=auth_headers,
            json=registration_data
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "category" in data["detail"].lower() or "invalid" in data["detail"].lower()
    
    def test_register_for_event_no_token(self, client, test_event):
        """Test registering without token"""
        registration_data = {
            "event_id": test_event.id,
            "category": "5K"
        }
        response = client.post("/api/v1/events/register", json=registration_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCancelRegistration:
    """Test canceling event registration"""
    
    def test_cancel_registration_success(self, client, auth_headers, db_session, test_event, test_user):
        """Test successfully canceling event registration"""
        import uuid
        from app.models.event import EventRegistration
        
        # Approve event first
        test_event.status = "approved"
        db_session.commit()
        
        # Register first
        registration = EventRegistration(
            id=str(uuid.uuid4()),
            event_id=test_event.id,
            user_id=test_user.id,
            category="5K"
        )
        db_session.add(registration)
        db_session.commit()
        
        # Cancel registration
        response = client.delete(
            f"/api/v1/events/{test_event.id}/register",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "cancelled" in data["message"].lower() or "cancel" in data["message"].lower()
    
    def test_cancel_registration_not_found(self, client, auth_headers, test_event):
        """Test canceling registration that doesn't exist"""
        response = client.delete(
            f"/api/v1/events/{test_event.id}/register",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "not found" in data["detail"].lower()

