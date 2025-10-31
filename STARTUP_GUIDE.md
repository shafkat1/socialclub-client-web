# 🚀 SocialClub Complete Startup Guide

**Date**: October 31, 2025  
**Status**: ✅ All Critical Fixes Applied - Ready for Startup  
**Environment**: Local Development  

---

## 📋 PREREQUISITES

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ PostgreSQL running locally (or AWS RDS connection string)
- ✅ Redis running locally (optional for MVP)
- ✅ Git installed
- ✅ Three terminal windows available

---

## 🚀 STARTUP SEQUENCE

### Step 1: Backend Setup (5 minutes)

**Terminal 1:**

```bash
# Navigate to backend
cd C:\ai4\desh\socialclub-client-web\backend

# Environment file is already created (.env)
# Verify DATABASE_URL (optional - for local PostgreSQL)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/socialclub_dev"

# Generate Prisma Client (already done, but you can re-run)
npx prisma generate

# Create database migrations (first time only)
npx prisma migrate dev --name init

# Expected output:
# ✔ Generated Prisma Client
# ✔ Your database is now in sync with your schema
```

**⚠️ If database doesn't exist:**
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE socialclub_dev;
\q
```

### Step 2: Start Backend (Terminal 1)

**Terminal 1:**

```bash
# From socialclub-client-web/backend directory
npm run dev

# Expected output:
# ✅ API running on http://localhost:3001/api
# 📚 Docs available at http://localhost:3001/api/docs
# [Nest] Starting Nest application...
# [Nest] InstanceLoader dependencies loaded...
```

**Key Signs of Success:**
- ✅ All 9 modules loaded (Auth, Users, Venues, Orders, Messages, Groups, Presence, Redemptions, Health)
- ✅ No TypeScript compilation errors
- ✅ Server listening on port 3001
- ✅ Database connection successful

### Step 3: Start Frontend (Terminal 2)

**Terminal 2:**

```bash
# Navigate to frontend
cd C:\ai4\desh\socialclub-client-web

# Environment file already created (.env.local)
# VITE_API_URL=http://localhost:3001/api

# Start development server
npm run dev

# Expected output:
# VITE v6.3.5 ready in 800 ms
# ➜ Local: http://localhost:5176/
# ➜ Network: use --host to expose
```

**Key Signs of Success:**
- ✅ Vite server starts on port 5176
- ✅ No import errors
- ✅ Frontend can see backend API

### Step 4: Verify Integration (Terminal 3)

**Terminal 3:**

```bash
# Test backend health
curl http://localhost:3001/api/health

# Expected response (success):
# {"status":"ok"}

# Expected response (failure):
# Connection refused or timeout
```

### Step 5: Access Applications

**Open in Browser:**

| App | URL | Purpose |
|-----|-----|---------|
| **Frontend** | http://localhost:5176 | Main social networking app |
| **Swagger Docs** | http://localhost:3001/api/docs | API documentation |
| **Swagger JSON** | http://localhost:3001/api/docs-json | API schema |

---

## ✅ VERIFICATION CHECKLIST

After all apps are running, verify:

### Backend Verification
- [ ] Backend starts without errors
- [ ] All 9 modules loaded in logs
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Swagger docs accessible at http://localhost:3001/api/docs
- [ ] Database connection shows in console logs
- [ ] No TypeScript compilation errors

### Frontend Verification
- [ ] Frontend loads at http://localhost:5176
- [ ] Welcome screen displays
- [ ] No red errors in browser console
- [ ] No CORS errors
- [ ] Network tab shows requests going to http://localhost:3001/api

### Integration Verification
- [ ] Can click "Sign In" on welcome screen
- [ ] Authentication form loads
- [ ] No 404 errors in network tab
- [ ] API calls complete successfully

---

## 🔧 COMMON ISSUES & SOLUTIONS

### Backend Issues

#### Issue: "PORT 3001 is already in use"
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
PORT=3002 npm run dev
```

#### Issue: "DATABASE_URL is not set"
```bash
# Check .env file exists
dir backend\.env

# If missing, copy from template
copy backend\.env.example backend\.env

# Edit with your database URL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/socialclub_dev"
```

#### Issue: "Unable to resolve @nestjs/..."
```bash
# Reinstall dependencies
cd backend
npm install

# Clear node_modules if still failing
rm -r node_modules package-lock.json
npm install
```

#### Issue: "Prisma client error"
```bash
# Regenerate Prisma Client
npx prisma generate

# Verify database connection
npx prisma db execute --stdin < nul

# Clear Prisma cache
rm -r node_modules\.prisma
npx prisma generate
```

### Frontend Issues

#### Issue: "Failed to resolve import ../utils/api"
```bash
# Verify .env.local exists
dir .env.local

# Check it has correct content
type .env.local
# Should show: VITE_API_URL=http://localhost:3001/api
```

#### Issue: "Cannot GET /api/health"
```bash
# Backend is not running
# Start backend first: npm run dev (from backend directory)

# Or port is wrong - verify:
# VITE_API_URL should be http://localhost:3001/api (not 3000)
```

#### Issue: "CORS error in browser console"
```bash
# Backend CORS already configured, but verify:
# Check backend is running on 3001
# Check frontend is running on 5176
# Check VITE_API_URL environment variable

# If still failing, restart both servers
```

---

## 📊 LOGS TO MONITOR

### Backend Console
Watch for:
```
✅ [Nest] Starting Nest application...
✅ [InstanceLoader] HealthModule dependencies loaded...
✅ [InstanceLoader] AuthModule dependencies loaded...
✅ [InstanceLoader] UsersModule dependencies loaded...
✅ [InstanceLoader] VenuesModule dependencies loaded...
✅ [InstanceLoader] OrdersModule dependencies loaded...
✅ [InstanceLoader] MessagesModule dependencies loaded...
✅ [InstanceLoader] GroupsModule dependencies loaded...
✅ [InstanceLoader] PresenceModule dependencies loaded...
✅ [InstanceLoader] RedemptionsModule dependencies loaded...
✅ API running on http://localhost:3001/api
```

### Frontend Console
Watch for:
```
✅ VITE v6.3.5 ready in XX ms
✅ ➜ Local: http://localhost:5176/
✅ (no red errors in console)
```

---

## 🎯 WHAT TO TEST FIRST

### Welcome Screen
1. Open http://localhost:5176
2. See "Welcome to SocialClub" screen
3. See feature cards and call-to-action buttons

### Authentication
1. Click "Sign In" button
2. See authentication form
3. Enter test credentials
4. Click "Sign In" with test account
5. Should navigate to main app

### Main App Features
1. **Map View** - See interactive map with venues
2. **Discover** - Browse user cards
3. **Offers** - View drink offers tab
4. **Messages** - Check messages tab
5. **Profile** - Access profile settings

---

## 🚨 CRITICAL CHECKS

If any of these fail, the integration is broken:

```bash
# 1. Health check must pass
curl http://localhost:3001/api/health
# Expected: {"status":"ok"}

# 2. Frontend must load
# Browser: http://localhost:5176
# Expected: Welcome screen displays

# 3. No API errors
# Browser DevTools → Network tab
# Expected: /api calls return 200 status

# 4. No CORS errors
# Browser DevTools → Console
# Expected: No "CORS", "Access-Control", or "blocked" errors
```

---

## 📁 ENVIRONMENT FILES

### Backend (.env)
Located at: `backend/.env`

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/socialclub_dev"
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5176"
JWT_SECRET="dev-secret-key-change-in-production"
```

### Frontend (.env.local)
Located at: `.env.local`

```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK_DATA=false
```

---

## 🎉 SUCCESS INDICATORS

When everything is working:

✅ **Terminal 1 (Backend)**
- Shows "API running on http://localhost:3001/api"
- No red errors in logs
- Responds to health check

✅ **Terminal 2 (Frontend)**
- Shows "Local: http://localhost:5176/"
- No import or compilation errors
- Browser shows welcome screen

✅ **Browser**
- http://localhost:5176 displays welcome screen
- http://localhost:3001/api/docs shows Swagger documentation
- Network requests complete successfully

---

## 🚀 NEXT STEPS AFTER STARTUP

1. **Test All Features** - Navigate through all tabs and screens
2. **Check Backend Logs** - Watch for any errors
3. **Monitor Network** - Check API calls in browser DevTools
4. **Test Database** - Try creating/reading data
5. **Deploy to AWS** - Follow deployment guide when ready

---

## 📚 RELATED DOCUMENTATION

- `CRITICAL_FIXES_IMPLEMENTED.md` - Details of all fixes applied
- `CRITICAL_ISSUES_FIX.md` - Troubleshooting guide
- `QUICK_START_MVP.md` - MVP deployment guide
- `AWS_MVP_COST_OPTIMIZATION.md` - AWS setup guide

---

## ⏱️ EXPECTED STARTUP TIMES

| Component | Time |
|-----------|------|
| Backend startup | 5-10 seconds |
| Frontend startup | 3-5 seconds |
| Database migration | 2-5 seconds |
| Health check response | <100ms |
| Page load | 1-2 seconds |

---

## 🆘 GETTING HELP

If something goes wrong:

1. **Check logs** - Backend and Frontend console
2. **Verify .env files** - Both backend/.env and .env.local
3. **Check ports** - 3001 (backend), 5176 (frontend)
4. **Restart servers** - Kill and restart both terminal windows
5. **Clear cache** - Remove node_modules and reinstall
6. **Read logs** - Check CRITICAL_ISSUES_FIX.md for detailed troubleshooting

---

**Status**: ✅ Ready to Start  
**Date**: October 31, 2025  
**Last Updated**: Implementation Complete

🎯 **Ready to launch! Open three terminals and follow the startup sequence above.**
