# Vercel Backend Troubleshooting Guide

## Current Issue
Backend endpoints return 500 Internal Server Error. The `api/index.py` file cannot import `app.main` from the backend directory.

## Error Symptoms
- All `/api/v1/*` endpoints return 500
- Error message: "Error importing api/index.py"

## Possible Causes

### 1. File Structure Issue
Vercel serverless functions may not have access to the `backend/` directory structure as expected.

### 2. Python Path Issue
The sys.path modification might not work correctly in Vercel's serverless environment.

### 3. Import Dependencies
Some dependencies might be missing or not installed correctly.

## Solutions to Try

### Solution 1: Check Vercel Logs
1. Go to Vercel dashboard → Your deployment → Logs
2. Look for the detailed error message from `api/index.py`
3. The error should show:
   - Import error details
   - Backend path
   - Python path
   - Full traceback

### Solution 2: Alternative Structure
If the current structure doesn't work, consider:
- Moving backend code into `api/` directory
- Using a single-file approach
- Using Vercel's Python runtime differently

### Solution 3: Use Railway/Render for Backend
If Vercel continues to have issues with Python/FastAPI:
- Deploy backend separately on Railway or Render
- Update frontend API client to point to separate backend URL
- This is actually a common pattern for monorepos

## Next Steps

1. **Get Error Logs**: Check Vercel deployment logs for detailed error message
2. **Share Error**: Provide the full error traceback
3. **Fix Based on Error**: Adjust code based on actual error message

## Temporary Workaround

While fixing the Vercel backend issue, you can:
1. Run backend locally for testing
2. Use `python backend/init_db.py` locally with `DATABASE_URL` from Vercel
3. Use `python backend/seed_admin.py` locally
4. Test frontend against local backend (update `NEXT_PUBLIC_API_URL`)

## Testing Locally

```bash
# Set environment variables
$env:DATABASE_URL="<your-tidb-connection-string>"
$env:SECRET_KEY="<your-secret-key>"
$env:ENVIRONMENT="production"

# Initialize database
python backend/init_db.py

# Seed admin user
python backend/seed_admin.py

# Run backend
python backend/run.py
```

Then test endpoints:
- http://localhost:8000/api/v1/health
- http://localhost:8000/api/v1/init-db
- http://localhost:8000/api/v1/seed-admin

