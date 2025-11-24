# Test Documentation - PaceUp Backend API

## Overview

This document describes the test suite for the PaceUp Backend API. The tests are written using `pytest` and cover all major endpoints and functionality of the API.

## Test Structure

```
backend/tests/
├── __init__.py           # Test package initialization
├── conftest.py           # Pytest fixtures and configuration
├── test_auth.py          # Authentication endpoint tests
├── test_blog.py          # Blog CRUD and like/unlike tests
├── test_events.py        # Events CRUD and registration tests
├── test_admin.py         # Admin endpoints and role-based access tests
├── test_integration.py   # End-to-end flow tests
└── test_health.py        # Health check and system endpoint tests
```

## Test Framework

- **pytest** - Main testing framework
- **httpx/TestClient** - HTTP client for API testing (via FastAPI TestClient)
- **pytest-asyncio** - Async test support (if needed in future)
- **pytest-cov** - Code coverage reporting

## Test Database

Tests use an **SQLite in-memory database** (`sqlite:///:memory:`) to ensure:
- Fast test execution
- Isolation between tests
- No need for external database setup
- Automatic cleanup after each test

## Running Tests

### Prerequisites

Install test dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_auth.py
```

### Run Specific Test Class

```bash
pytest tests/test_auth.py::TestLogin
```

### Run Specific Test Function

```bash
pytest tests/test_auth.py::TestLogin::test_login_success
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html --cov-report=term
```

This will generate:
- Terminal coverage report
- HTML coverage report in `htmlcov/index.html`

### Run with Verbose Output

```bash
pytest -v
```

### Run with Output Capture Disabled

```bash
pytest -s
```

## Test Coverage

### Authentication Tests (`test_auth.py`)

Tests for `/api/v1/auth` endpoints:

- **Register** (`TestRegister`)
  - Register new user
  - Register with duplicate email
  - Register with invalid email format

- **Login** (`TestLogin`)
  - Successful login
  - Wrong password
  - Wrong email
  - Inactive user login

- **Get Current User** (`TestGetCurrentUser`)
  - Get user info with valid token
  - Get user info without token
  - Get user info with invalid token

- **Update Profile** (`TestUpdateProfile`)
  - Update profile successfully
  - Update profile without token

- **User Stats** (`TestUserStats`)
  - Get user statistics
  - Get stats without token

- **Joined Events** (`TestJoinedEvents`)
  - Get joined events (empty list)
  - Get joined events without token

### Blog Tests (`test_blog.py`)

Tests for `/api/v1/blog` endpoints:

- **List Posts** (`TestListBlogPosts`)
  - List posts when empty
  - List posts with pagination
  - Filter posts by author

- **Get Post** (`TestGetBlogPost`)
  - Get post by ID
  - Get non-existent post

- **Create Post** (`TestCreateBlogPost`)
  - Create post when authenticated
  - Create post without token

- **Update Post** (`TestUpdateBlogPost`)
  - Update own post
  - Update another user's post (403 Forbidden)
  - Update post without token

- **Delete Post** (`TestDeleteBlogPost`)
  - Delete own post
  - Delete another user's post (403 Forbidden)

- **Like/Unlike Post** (`TestLikeBlogPost`)
  - Like a post
  - Unlike a post
  - Like post without token
  - Like non-existent post

### Events Tests (`test_events.py`)

Tests for `/api/v1/events` endpoints:

- **List Events** (`TestListEvents`)
  - List events when empty
  - List events with pagination
  - Filter events by organizer

- **Get Event** (`TestGetEvent`)
  - Get event by ID
  - Get non-existent event

- **Create Event** (`TestCreateEvent`)
  - Create event when authenticated
  - Create event without token

- **Update Event** (`TestUpdateEvent`)
  - Update own event
  - Update another user's event (403 Forbidden)

- **Delete Event** (`TestDeleteEvent`)
  - Delete own event

- **Register for Event** (`TestRegisterForEvent`)
  - Register successfully
  - Register when already registered
  - Register for full event
  - Register past deadline
  - Register with invalid category
  - Register without token

- **Cancel Registration** (`TestCancelRegistration`)
  - Cancel registration successfully
  - Cancel non-existent registration

### Admin Tests (`test_admin.py`)

Tests for `/api/v1/admin` endpoints:

- **Admin Stats** (`TestAdminStats`)
  - Get stats with admin token
  - Get stats with user token (403 Forbidden)
  - Get stats without token (401 Unauthorized)

- **Admin Posts** (`TestAdminPosts`)
  - List all posts
  - List pending posts
  - List approved posts
  - List without token
  - List with user token (403 Forbidden)

- **Approve/Reject Post** (`TestApproveRejectPost`)
  - Approve post
  - Reject post
  - Update status with user token (403 Forbidden)
  - Update status of non-existent post

- **Admin Events** (`TestAdminEvents`)
  - List all events
  - List pending events
  - List without token

- **Approve/Reject Event** (`TestApproveRejectEvent`)
  - Approve event
  - Reject event
  - Update status with user token (403 Forbidden)
  - Update status of non-existent event

### Health Tests (`test_health.py`)

Tests for system endpoints:

- **Health Check** (`TestHealthCheck`)
  - Health check at `/health`
  - Health check at `/api/health`
  - Health check at `/api/v1/health`

- **Check Database** (`TestCheckDatabase`)
  - Database verification endpoint

- **Root Endpoint** (`TestRootEndpoint`)
  - Root endpoint response

### Integration Tests (`test_integration.py`)

End-to-end flow tests:

- **Blog Post Flow** (`TestBlogPostFlow`)
  - Complete flow: register → login → create post → admin approve → view

- **Event Flow** (`TestEventFlow`)
  - Complete flow: register → login → create event → admin approve → register

- **Admin Dashboard Flow** (`TestAdminDashboardFlow`)
  - Complete flow: admin login → view stats → manage posts → manage events

## Test Fixtures

### Database Fixtures

- `db_session` - SQLite in-memory database session (created fresh for each test)

### Client Fixtures

- `client` - FastAPI TestClient with overridden database dependency

### User Fixtures

- `test_user_data` - Sample user data dictionary
- `test_user` - Created test user in database
- `admin_user` - Created admin user in database
- `auth_token` - JWT token for test user
- `admin_token` - JWT token for admin user
- `auth_headers` - Authorization headers with test user token
- `admin_headers` - Authorization headers with admin token

### Content Fixtures

- `test_blog_post` - Created blog post in database
- `test_event` - Created event in database

## Writing New Tests

### Example Test Structure

```python
class TestNewFeature:
    """Test description"""
    
    def test_feature_success(self, client, auth_headers):
        """Test successful feature execution"""
        response = client.get("/api/v1/endpoint", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "expected_field" in data
    
    def test_feature_failure(self, client):
        """Test feature failure case"""
        response = client.get("/api/v1/endpoint")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

### Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **One assertion per test** - Or group related assertions logically
3. **Use fixtures** - Leverage pytest fixtures for common setup
4. **Test both success and failure cases** - Include positive and negative test cases
5. **Test edge cases** - Include boundary conditions and error scenarios
6. **Keep tests isolated** - Each test should be independent and not rely on other tests

## Continuous Integration

Tests can be integrated into CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v2
        with:
          file: ./backend/coverage.xml
```

## Troubleshooting

### Tests Failing with Database Errors

- Ensure all models are imported in `conftest.py`
- Check that Base.metadata.create_all() is called before tests

### Tests Failing with Import Errors

- Verify Python path includes backend directory
- Check that all dependencies are installed

### Tests Failing with Authentication Errors

- Verify token creation and validation logic
- Check that test fixtures create users correctly

## Coverage Goals

- **Target Coverage**: 80%+
- **Critical Paths**: 100% coverage for authentication and authorization
- **Business Logic**: 90%+ coverage for core features

## Future Improvements

- [ ] Add performance tests
- [ ] Add load testing with locust
- [ ] Add API contract testing
- [ ] Add mutation testing
- [ ] Add test data factories for easier test setup
- [ ] Add test coverage badges to README

