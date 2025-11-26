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

## Media Storage Configuration

The upload pipeline now relies on two external providers:

### Cloudinary (images)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (optional, defaults to `paceup`)

These variables are used by the Next.js API route (`app/api/upload/route.ts`) to store avatars/post thumbnails. When unset, the route falls back to inline base64 strings for local development.

### Cloudflare R2 (documents + previews)
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ENDPOINT` (optional, inferred from account ID)
- `CLOUDFLARE_R2_PUBLIC_DOMAIN` (optional CDN/domain for serving files)

Endpoints under `/api/v1/documents` now stream uploads to R2 and fall back to base64 previews if the bucket is temporarily unavailable.

