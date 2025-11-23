# PaceUp Backend

FastAPI backend for PaceUp running community platform.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials and settings.

4. Run database migrations:
```bash
alembic upgrade head
```

5. Run the server:
```bash
python run.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database

The application uses MySQL. Make sure MySQL is installed and running before starting the application.

**Important**: The database must use `utf8mb4` charset to support Vietnamese characters and emojis.

To create a new migration:
```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

