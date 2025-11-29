"""
Payment sandbox endpoints tests.
"""
from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi import status


def test_create_payment_session_requires_auth(client, test_event):
  """Creating payment session without auth should fail."""
  payload = {
      "event_id": test_event.id,
      "category": "5K",
      "amount": 100000,
  }
  response = client.post("/api/v1/payment/session", json=payload)

  assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_and_confirm_payment_session_flow(client, auth_headers, admin_headers, db_session, test_event, test_user):
  """Happy-path sandbox payment flow: create session -> confirm -> admin can see amount."""
  # Ensure event allows the category
  test_event.categories = ["5K"]
  test_event.status = "approved"
  test_event.registration_deadline = datetime.now() + timedelta(days=1)
  db_session.commit()

  payload = {
      "event_id": test_event.id,
      "category": "5K",
      "amount": 150000,
  }

  # Create payment session
  response = client.post(
      "/api/v1/payment/session",
      headers=auth_headers,
      json=payload,
  )

  assert response.status_code == status.HTTP_201_CREATED
  session_data = response.json()
  assert session_data["event_id"] == test_event.id
  assert session_data["amount"] == 150000
  session_id = session_data["id"]

  # Confirm payment from "mobile"
  confirm_response = client.post(
      "/api/v1/payment/confirm",
      json={"session_id": session_id, "action": "confirm"},
  )
  assert confirm_response.status_code == status.HTTP_200_OK
  assert confirm_response.json()["status"] == "success"

  # Poll status
  status_response = client.get(f"/api/v1/payment/session/{session_id}")
  assert status_response.status_code == status.HTTP_200_OK
  assert status_response.json()["status"] == "success"

  # Admin can see registration + amount
  admin_resp = client.get(
      f"/api/v1/admin/events/{test_event.id}/registrations",
      headers=admin_headers,
  )
  assert admin_resp.status_code == status.HTTP_200_OK
  regs = admin_resp.json()
  assert len(regs) >= 1
  # First registration corresponds to our flow
  assert any(reg.get("amount") == 150000 for reg in regs)


def test_payment_session_expiry_time_is_5_minutes(client, auth_headers, db_session, test_event):
  """Verify payment session expires after 5 minutes (not 10)."""
  test_event.categories = ["5K"]
  test_event.status = "approved"
  test_event.registration_deadline = datetime.now() + timedelta(days=1)
  db_session.commit()

  payload = {
      "event_id": test_event.id,
      "category": "5K",
      "amount": 100000,
  }

  # Create payment session
  response = client.post(
      "/api/v1/payment/session",
      headers=auth_headers,
      json=payload,
  )

  assert response.status_code == status.HTTP_201_CREATED
  session_data = response.json()
  session_id = session_data["id"]
  
  # Check expires_at is set
  assert session_data.get("expires_at") is not None
  
  # Parse expires_at
  expires_at_str = session_data["expires_at"]
  expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
  
  # Calculate expected expiry (5 minutes from now)
  now = datetime.utcnow()
  expected_expiry = now + timedelta(minutes=5)
  
  # Allow 10 seconds tolerance for test execution time
  time_diff = abs((expires_at - expected_expiry).total_seconds())
  assert time_diff < 10, f"Expiry time should be ~5 minutes from now, got {time_diff} seconds difference"


def test_payment_session_auto_expires_after_5_minutes(client, auth_headers, db_session, test_event):
  """Verify payment session automatically expires after 5 minutes."""
  test_event.categories = ["5K"]
  test_event.status = "approved"
  test_event.registration_deadline = datetime.now() + timedelta(days=1)
  db_session.commit()

  payload = {
      "event_id": test_event.id,
      "category": "5K",
      "amount": 100000,
  }

  # Create payment session
  response = client.post(
      "/api/v1/payment/session",
      headers=auth_headers,
      json=payload,
  )

  assert response.status_code == status.HTTP_201_CREATED
  session_data = response.json()
  session_id = session_data["id"]
  
  # Mock time to be 6 minutes later (past expiry)
  future_time = datetime.utcnow() + timedelta(minutes=6)
  
  with patch("app.api.v1.endpoints.payment.datetime") as mock_datetime:
    mock_datetime.utcnow.return_value = future_time
    
    # Poll status - should auto-update to expired
    status_response = client.get(f"/api/v1/payment/session/{session_id}")
    assert status_response.status_code == status.HTTP_200_OK
    status_data = status_response.json()
    assert status_data["status"] == "expired"


