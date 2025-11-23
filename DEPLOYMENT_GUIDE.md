# PaceUp Deployment Guide

## Backend Audit Summary

### ✅ Completed Improvements

1. **CORS Configuration**
   - Added actual Vercel domains to `backend/app/core/config.py`:
     - `https://nhom7-paceup.vercel.app`
     - `https://nhom7-paceup-git-main-taddyuiux-4154s-projects.vercel.app`
   - Dynamic CORS support via `ADDITIONAL_CORS_ORIGINS` environment variable

2. **Logging**
   - Added structured logging to `backend/app/main.py`
   - Logs include timestamps, module names, and log levels
   - Health check endpoint now includes database connection status

3. **Database Table Creation**
   - Modified to skip automatic table creation in production
   - Production should use Alembic migrations instead

4. **Health Check Endpoint**
   - Enhanced `/health` endpoint to test database connectivity
   - Returns detailed status including database connection state

### Current Backend Status

- ✅ FastAPI application structure is production-ready
- ✅ CORS middleware configured
- ✅ JWT authentication implemented
- ✅ Error handling via HTTPException
- ✅ Database models defined (User, Event, EventRegistration, BlogPost)
- ✅ API routers organized (auth, blog, events, admin, documents)
- ✅ Vercel serverless entry point configured (`api/index.py`)

### Known Limitations

- ⚠️ No Alembic migrations directory exists (using `Base.metadata.create_all()` for now)
- ⚠️ No global exception handler (using per-endpoint HTTPException)
- ⚠️ Static file serving may need adjustment for Vercel serverless

---

## MySQL Database Provisioning

### Option 1: PlanetScale (Recommended for Serverless)

**Pros:**
- Serverless MySQL with auto-scaling
- Free tier available
- Built-in connection pooling
- Branching for schema changes
- Works well with Vercel serverless functions

**Steps:**
1. Sign up at https://planetscale.com
2. Create a new database (e.g., `paceup`)
3. Create a branch (e.g., `main`)
4. Copy the connection string from the dashboard
5. Format: `mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED`

### Option 2: Railway

**Pros:**
- Simple MySQL provisioning
- Free tier available
- Easy environment variable management
- Good for development and small production

**Steps:**
1. Sign up at https://railway.app
2. Create a new project
3. Add MySQL service
4. Copy connection string from service variables

### Option 3: Supabase (PostgreSQL)

**Note:** Requires changing from MySQL to PostgreSQL

**Pros:**
- Generous free tier
- Built-in authentication (can replace JWT if desired)
- Real-time subscriptions
- Auto-generated REST API

**Steps:**
1. Sign up at https://supabase.com
2. Create a new project
3. Copy PostgreSQL connection string
4. Update SQLAlchemy dialect from `pymysql` to `psycopg2`

### Option 4: AWS RDS / Google Cloud SQL

**Pros:**
- Enterprise-grade reliability
- Full control over configuration
- Better for high-traffic applications

**Cons:**
- More complex setup
- Costs money (no free tier for production)

---

## Environment Variables Setup

### Vercel Project Settings

Navigate to your Vercel project → Settings → Environment Variables

#### Required Variables:

```
DATABASE_URL=mysql+pymysql://user:password@host:port/database?charset=utf8mb4
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ENVIRONMENT=production
ADDITIONAL_CORS_ORIGINS=https://your-custom-domain.com,https://www.your-custom-domain.com
```

#### Optional Variables:

```
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Backend-Specific Notes

- `DATABASE_URL`: Full MySQL connection string from your database provider
- `SECRET_KEY`: Generate a secure random string (e.g., `openssl rand -hex 32`)
- `ENVIRONMENT`: Set to `production` to disable automatic table creation
- `ADDITIONAL_CORS_ORIGINS`: Comma-separated list of additional allowed origins

---

## Database Schema Initialization

### Option A: Using Base.metadata.create_all() (Current)

**For Development:**
- Tables are created automatically when backend starts
- Set `ENVIRONMENT` to anything other than `production`

**For Production:**
- Set `ENVIRONMENT=production` to skip automatic creation
- Manually run table creation script or use migrations

### Option B: Using Alembic Migrations (Recommended for Production)

**Initial Setup:**
```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

**Update alembic.ini:**
```ini
sqlalchemy.url = ${DATABASE_URL}
```

**Run Migrations:**
```bash
alembic upgrade head
```

---

## Backend Deployment on Vercel

### Current Setup

The backend is configured as a Vercel serverless function:

- **Entry Point:** `api/index.py`
- **Configuration:** `vercel.json` rewrites `/api/v1/*` to `/api/index.py`
- **Dependencies:** `requirements.txt` (root level)

### Deployment Steps

1. **Ensure all files are committed:**
   ```bash
   git add .
   git commit -m "Backend production readiness updates"
   git push origin main
   ```

2. **Vercel will automatically deploy** when you push to `main`

3. **Set environment variables** in Vercel dashboard (see above)

4. **Verify deployment:**
   - Check `https://your-app.vercel.app/api/v1/health`
   - Should return: `{"status": "healthy", "database": "connected"}`

### Troubleshooting

**Issue: Database connection fails**
- Verify `DATABASE_URL` is set correctly in Vercel
- Check database provider allows connections from Vercel IPs
- For PlanetScale, ensure SSL mode is set: `?ssl-mode=REQUIRED`

**Issue: CORS errors**
- Verify frontend domain is in `CORS_ORIGINS` or `ADDITIONAL_CORS_ORIGINS`
- Check browser console for specific CORS error details

**Issue: Static files not serving**
- Vercel serverless functions have limited file system access
- Consider using Vercel Blob Storage or external CDN for uploads

---

## Frontend Integration

### Current Configuration

The frontend API client (`lib/api/client.ts`) is already configured to:
- Use relative paths (`/api/v1`) in production (works with Vercel rewrites)
- Use `NEXT_PUBLIC_API_URL` for server-side rendering
- Fall back to `http://localhost:8000` for local development

### No Changes Required

The frontend should automatically connect to the backend once:
1. Backend is deployed on Vercel
2. Environment variables are set
3. Database is provisioned and connected

---

## Verification Checklist

After deployment, verify:

- [ ] Backend health check: `https://your-app.vercel.app/api/v1/health`
- [ ] Database connection is working (check health endpoint response)
- [ ] Frontend can call backend APIs (check browser network tab)
- [ ] Authentication flow works (login/register)
- [ ] CORS is configured correctly (no CORS errors in browser console)
- [ ] Admin dashboard accessible for `admin@gmail.com`
- [ ] Event creation and listing works
- [ ] Blog post creation and listing works

---

## Monitoring & Logging

### Vercel Logs

- View runtime logs in Vercel dashboard → Deployment → Logs
- Check for database connection errors
- Monitor API response times

### Application Logs

- Backend logs are configured via Python `logging` module
- Logs appear in Vercel function logs
- Consider integrating with external logging service (e.g., Sentry) for production

---

## Next Steps

1. **Provision MySQL database** (choose one of the options above)
2. **Set environment variables** in Vercel dashboard
3. **Initialize database schema** (run migrations or table creation)
4. **Deploy backend** (push to GitHub, Vercel auto-deploys)
5. **Test end-to-end** (verify all features work)
6. **Set up custom domain** (optional, via Vercel dashboard)

---

## Support & Troubleshooting

For issues:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test database connection independently
4. Check CORS configuration matches frontend domain
5. Review backend code for any hardcoded localhost URLs

