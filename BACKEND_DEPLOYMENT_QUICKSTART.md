# Backend & MySQL Deployment - Quick Start

## ✅ What's Been Done

1. **Backend Audit Completed**
   - ✅ CORS configured with Vercel domains
   - ✅ Logging added to main.py
   - ✅ Health check endpoint enhanced
   - ✅ Production-ready configuration

2. **Database Scripts Created**
   - ✅ `backend/init_db.py` - Initialize database tables
   - ✅ `backend/seed_admin.py` - Create admin user

3. **Documentation Created**
   - ✅ `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide

---

## 🚀 Next Steps (Do These Now)

### Step 1: Provision MySQL Database

Choose one option:

**Option A: PlanetScale (Recommended)**
1. Go to https://planetscale.com
2. Sign up (free tier available)
3. Create database: `paceup`
4. Create branch: `main`
5. Copy connection string from dashboard

**Option B: Railway**
1. Go to https://railway.app
2. Sign up (free tier available)
3. Create new project
4. Add MySQL service
5. Copy connection string from service variables

### Step 2: Set Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add these variables:

```
DATABASE_URL=mysql+pymysql://user:password@host:port/database?charset=utf8mb4
SECRET_KEY=<generate-a-random-secret-key>
ENVIRONMENT=production
```

**Generate SECRET_KEY:**
```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# On Linux/Mac:
openssl rand -hex 32
```

### Step 3: Initialize Database

**Option A: Run locally (if you have Python environment)**

```bash
# Set DATABASE_URL environment variable
$env:DATABASE_URL="mysql+pymysql://user:pass@host:port/db?charset=utf8mb4"

# Initialize tables
python backend/init_db.py

# Create admin user
python backend/seed_admin.py
```

**Option B: Run via Vercel Function (after deployment)**

Create a temporary endpoint in `backend/app/main.py`:

```python
@app.post("/init-db")
async def init_db_endpoint():
    """Initialize database (remove after first run!)"""
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    return {"status": "tables created"}
```

Then call: `POST https://your-app.vercel.app/api/v1/init-db`

**⚠️ IMPORTANT: Remove this endpoint after initialization!**

### Step 4: Verify Deployment

1. **Check Health Endpoint:**
   ```
   https://your-app.vercel.app/api/v1/health
   ```
   Should return: `{"status": "healthy", "database": "connected"}`

2. **Test Frontend:**
   - Open your Vercel frontend URL
   - Try logging in with `admin@gmail.com` / `admin123`
   - Check if admin dashboard appears

3. **Check Vercel Logs:**
   - Go to Vercel dashboard → Your deployment → Logs
   - Look for any database connection errors

---

## 🔧 Troubleshooting

### Database Connection Fails

**Symptoms:**
- Health check returns `"database": "disconnected"`
- Vercel logs show connection errors

**Solutions:**
1. Verify `DATABASE_URL` format is correct
2. Check database provider allows connections from Vercel IPs
3. For PlanetScale: Ensure `?ssl-mode=REQUIRED` is in connection string
4. Test connection string locally first

### CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail with CORS messages

**Solutions:**
1. Verify frontend domain is in `CORS_ORIGINS` in `backend/app/core/config.py`
2. Or add to `ADDITIONAL_CORS_ORIGINS` environment variable
3. Check Vercel deployment URL matches configured origins

### Admin Login Doesn't Work

**Symptoms:**
- Can't login with `admin@gmail.com`

**Solutions:**
1. Run `python backend/seed_admin.py` to create admin user
2. Verify admin user exists in database
3. Check admin role is set to `"admin"` in database

---

## 📋 Checklist

Before considering deployment complete:

- [ ] MySQL database provisioned
- [ ] `DATABASE_URL` set in Vercel
- [ ] `SECRET_KEY` set in Vercel (random, secure)
- [ ] `ENVIRONMENT=production` set in Vercel
- [ ] Database tables initialized
- [ ] Admin user created
- [ ] Health check endpoint returns healthy
- [ ] Frontend can call backend APIs
- [ ] Login/register works
- [ ] Admin dashboard accessible
- [ ] Event creation works
- [ ] Blog post creation works

---

## 🆘 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed information
2. Review Vercel deployment logs
3. Test database connection independently
4. Verify all environment variables are set correctly

---

## 🎯 Current Status

- ✅ Backend code is production-ready
- ✅ Frontend is deployed on Vercel
- ⏳ **Waiting for:** MySQL database provisioning
- ⏳ **Waiting for:** Environment variables configuration
- ⏳ **Waiting for:** Database initialization

Once you complete the steps above, your full-stack application will be live! 🚀

