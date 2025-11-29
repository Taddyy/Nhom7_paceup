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

## Payment Sandbox (QR + Cross-device)

For the course project, the payment step is implemented as a **sandbox** using a cross-device flow similar to Zalo/Telegram QR login:

- The web app (PC) creates a `PaymentSession` via `POST /api/v1/payment/session` and shows a QR code.
- The mobile device scans the QR and opens `/payment/confirm?session_id=...`, where the user presses "**Xác nhận thanh toán giả lập**".
- The backend updates the `PaymentSession` status to `success`, creates an `EventRegistration`, and the PC polls `GET /api/v1/payment/session/{id}` until it sees `success`.
- Admins can open the Admin Dashboard → tab **Sự kiện** → button **"Xem đăng ký & tổng tiền"** to see all registrations for an event and the **total sandbox amount** collected.

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

