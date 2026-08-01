# Render Deployment - Complete Step-by-Step Guide

**Status**: Ready to deploy  
**Tasks**: #6-10 (Create services, configure environment, test)  
**Time Expected**: 30-45 minutes

---

## Prerequisites Checklist

Before starting, verify you have:

- ✅ GitHub account and Pragyan repository pushed (commit 8d8f5d2)
- ✅ MongoDB Atlas cluster created with connection string
- ✅ Production secrets generated (JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET)
- ✅ Render account created ([render.com](https://render.com))
- ✅ OAuth credentials (Google/GitHub - if using)
- ✅ Email credentials for notifications (Gmail app password - if using)

**If missing any:** Complete the corresponding guide first
- MongoDB Atlas → `MONGODB_ATLAS_SETUP.md`
- Secrets → `GENERATE_PRODUCTION_SECRETS.md`
- Frontend/Backend ready → `FRONTEND_DEPLOYMENT_CHECKLIST.md`

---

## Task #6: Create Render Static Site for Frontend

### Step 6.1: Start Creating Service

1. Go to [render.com](https://render.com) and **log in**
2. Click **New +** in top-right corner
3. Select **Static Site**

### Step 6.2: Connect GitHub Repository

1. **Select "GitHub"** as the repository source
2. **Search and select** `Pragyan` repository
3. Click **Connect**

Render will now show you the build configuration screen.

### Step 6.3: Configure Build Settings

Fill in the deployment settings:

| Setting | Value |
|---------|-------|
| **Name** | `pragyan-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Environment** | (auto-detected as Node) |

✅ Leave other settings as default

### Step 6.4: Add Environment Variable (Optional but Recommended)

1. Click **Add Environment Variable**
2. **Key**: `VITE_BACKEND_URL`
3. **Value**: (leave blank for now - we'll update after backend is deployed)
   - Or if you already have backend URL: `https://pragyan-backend.onrender.com`
4. Click **Add**

### Step 6.5: Create the Service

1. Click **Create Static Site** (blue button)
2. Render will:
   - Clone your GitHub repo
   - Install dependencies
   - Build the project
   - Deploy to CDN

**Wait for deployment (~5 minutes)**

### Step 6.6: Get Your Frontend URL

Once deployment completes:
- You'll see: **Frontend URL**: `https://pragyan-frontend.onrender.com` (or similar)
- Save this URL - you'll need it for:
  - Backend CORS configuration
  - OAuth redirect URIs

### Step 6.7: Test Frontend Load

```bash
curl https://pragyan-frontend.onrender.com
```

Or open in browser: `https://pragyan-frontend.onrender.com`

Should load React app (may show login screen or home page).

---

## Task #7: Create Render Web Service for Backend

### Step 7.1: Start Creating Service

1. Click **New +** again
2. Select **Web Service**

### Step 7.2: Connect GitHub Repository

1. Select **GitHub** as source
2. Search and select `Pragyan` repository
3. Click **Connect**

### Step 7.3: Configure Build Settings

Fill in the deployment settings:

| Setting | Value |
|---------|-------|
| **Name** | `pragyan-backend` |
| **Environment** | `Node` (select from dropdown) |
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` or `Pro` (Free is fine for testing) |

✅ Leave other settings as default

### Step 7.4: Create Service (Without Environment Variables Yet)

1. Click **Create Web Service**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Compile TypeScript
   - Start the server

**Wait for build and startup (~8-10 minutes)**

⚠️ **It will likely fail** because environment variables aren't set yet. That's expected.

---

## Task #8: Configure Environment Variables on Render

### Step 8.1: Add Backend Environment Variables

Once backend service is created (whether it failed or not):

1. Go to backend service dashboard
2. Click **Environment** tab
3. Click **Add Environment Variable** for each:

### Step 8.2: Add Required Variables

Add these variables one by one:

```
# Server Configuration
NODE_ENV=production
PORT=3000
API_BASE_URL=https://pragyan-backend.onrender.com

# Database (from MongoDB Atlas setup)
DATABASE_URL=mongodb+srv://pragyan_prod_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan

# JWT Secrets (from secret generation)
JWT_SECRET=<your_jwt_secret_from_step_2>
JWT_REFRESH_SECRET=<your_jwt_refresh_secret_from_step_2>
SESSION_SECRET=<your_session_secret_from_step_2>

# JWT Configuration
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# CORS
CORS_ORIGINS=https://pragyan-frontend.onrender.com,https://yourdomain.com

# Frontend URL
FRONTEND_URL=https://pragyan-frontend.onrender.com

# Bcrypt
BCRYPT_ROUNDS=10

# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=<your_gemini_key_from_Google_AI_Studio>
GROQ_API_KEY=<your_groq_key_if_available>
LLM_PROVIDER=gemini

# OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GITHUB_CLIENT_ID=<your_github_client_id>
GITHUB_CLIENT_SECRET=<your_github_client_secret>

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your_gmail_address>
EMAIL_PASSWORD=<your_gmail_app_password>
EMAIL_FROM=Pragyan <your_gmail_address>
```

### Step 8.3: Process for Each Variable

For each variable:

1. Click **Add Environment Variable** (or **+** button)
2. **Key**: (e.g., `DATABASE_URL`)
3. **Value**: (paste the value)
4. Click **Add** or **Save**

**Note**: Values will be hidden as `••••••••` for security

### Step 8.4: Verify All Variables Added

1. Check the list shows:
   - ✅ DATABASE_URL (production connection string)
   - ✅ JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET
   - ✅ CORS_ORIGINS (includes your frontend URL)
   - ✅ FRONTEND_URL (your frontend URL)
   - ✅ GEMINI_API_KEY and other API keys

---

## Task #9: Update CORS and API URLs

### Step 9.1: Verify Backend CORS Variable

In Render backend **Environment**:

```
CORS_ORIGINS=https://pragyan-frontend.onrender.com
```

✅ Make sure this matches your **actual** frontend URL (not placeholder)

### Step 9.2: Update Frontend with Backend URL

1. Go to Render frontend service
2. Click **Environment** (if available for Static Sites)
3. Update or add:
   ```
   VITE_BACKEND_URL=https://pragyan-backend.onrender.com
   ```

4. If Environment isn't available, manually update:
   - Go to **Settings** → **Deploy Hook**
   - Click **Manual Deploy** to redeploy with env variable

### Step 9.3: Update OAuth Redirect URLs

#### For Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add **Authorized redirect URIs**:
   ```
   https://pragyan-backend.onrender.com/auth/google/callback
   https://pragyan-backend.onrender.com/auth/oauth/google/callback
   ```
6. Click **Save**

#### For GitHub OAuth

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Edit your app
3. Update **Authorization callback URL**:
   ```
   https://pragyan-backend.onrender.com/auth/github/callback
   https://pragyan-backend.onrender.com/auth/oauth/github/callback
   ```
4. Click **Save**

### Step 9.4: Trigger Redeployment

Both services need to restart with updated environment:

1. **Frontend Service**:
   - Click **Manual Deploy** → **Deploy latest commit**
   - Wait for build (~2-3 minutes)

2. **Backend Service**:
   - Go to **Logs** tab
   - Click **Redeploy** (if restart button available)
   - Or push a new commit to GitHub to trigger redeploy
   - Wait for restart (~1-2 minutes)

---

## Task #10: Test End-to-End

### Step 10.1: Health Check (Backend Running)

Test that backend is responding:

```bash
# Replace with your actual backend URL
curl https://pragyan-backend.onrender.com/health
```

Expected response:
```json
{"status":"OK","timestamp":"2026-07-14T12:34:56.789Z"}
```

❌ If error: Check backend logs on Render → **Logs** tab

### Step 10.2: Frontend Loads

Open in browser: `https://pragyan-frontend.onrender.com`

Expected:
- ✅ Page loads without errors
- ✅ No CORS errors in browser console
- ✅ Landing page or login screen visible

❌ If CORS error: Check `CORS_ORIGINS` in backend environment

### Step 10.3: Login Test

1. Click **Login** on frontend
2. Enter test credentials or click "Continue with Google"
3. Expected:
   - ✅ Redirects to login/OAuth flow
   - ✅ After login, redirects to dashboard
   - ✅ User profile loads
   - ✅ No 401/403 errors

❌ If authentication fails:
- Check JWT secrets are set
- Check MongoDB connection works
- Check logs: Backend → **Logs** tab

### Step 10.4: Assessment Test

1. Click **Take Assessment** (if available)
2. Answer a few questions
3. Click **Submit**
4. Expected:
   - ✅ Data saves to database
   - ✅ Roadmap generated and displays
   - ✅ No errors in console

❌ If assessment fails:
- Check MongoDB connection in logs
- Verify DATABASE_URL is correct
- Check assessment routes are deployed

### Step 10.5: Check Backend Logs

1. Go to backend service on Render
2. Click **Logs** tab
3. Look for:
   - ✅ "Server running on port 3000"
   - ✅ "Database connected" or similar
   - ✅ No error messages

⚠️ Expected warnings:
- "RAPID_API_KEY is not set" - OK if not using
- "Redis not configured" - OK, using in-memory cache

### Step 10.6: API Connectivity Test

In browser console (F12), test API calls:

```javascript
// Test health endpoint
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('Health:', data))

// Test auth - get current user (requires login first)
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('User:', data))
```

Expected:
- ✅ Returns JSON response
- ✅ No CORS errors
- ✅ No network errors

---

## Troubleshooting Guide

### Frontend won't load

**Symptoms**: Blank page, can't reach domain

**Fix**:
1. Check Render frontend **Logs**:
   ```
   Failed to find a valid build
   ```
2. Verify Root Directory is `frontend`
3. Verify Build Command is `npm install && npm run build`
4. Click **Manual Deploy** to retry

### Backend won't start

**Symptoms**: "Build successful" but service won't start

**Check logs for:**

1. **"Cannot find module 'X'"**
   ```
   npm install && npm run build
   Check backend/package.json has dependencies
   Push new commit to trigger rebuild
   ```

2. **"DATABASE_URL not set"**
   ```
   Go to Environment tab
   Add DATABASE_URL with MongoDB Atlas connection string
   Redeploy
   ```

3. **"Cannot connect to MongoDB"**
   ```
   Verify DATABASE_URL is correct
   Check MongoDB Atlas IP allowlist (should include 0.0.0.0/0)
   Verify cluster is running
   Test locally with same connection string
   ```

### Frontend can't reach backend (CORS error)

**Error in browser console**:
```
Access to XMLHttpRequest at 'https://pragyan-backend.onrender.com/api/...'
from origin 'https://pragyan-frontend.onrender.com' has been blocked by CORS policy
```

**Fix**:
1. Go to backend → **Environment**
2. Find `CORS_ORIGINS` variable
3. Verify it includes `https://pragyan-frontend.onrender.com`
4. Redeploy backend
5. Clear browser cache and reload

### Login redirects to wrong URL

**Check OAuth credentials**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Verify redirect URIs in Google Cloud Console include your backend URL
3. Verify `FRONTEND_URL` in backend environment is correct

### Assessment won't save

**Check logs for**: Database error

1. Backend logs → Look for MongoDB error
2. Verify `DATABASE_URL` is correct
3. Verify `JWT_SECRET` and `SESSION_SECRET` are set
4. Restart backend (redeploy)

### 502 Bad Gateway error

**Means**: Backend is not responding

**Fix**:
1. Check backend logs (Backend → **Logs**)
2. Look for startup errors
3. If no errors, backend is running but requests timing out
4. Increase response timeout or optimize queries
5. Check database connection status

---

## Post-Deployment Checklist

Once everything is working:

- [ ] Frontend loads: `https://pragyan-frontend.onrender.com`
- [ ] Backend health: `https://pragyan-backend.onrender.com/health` → OK
- [ ] Login works (email/password)
- [ ] OAuth works (Google/GitHub)
- [ ] Assessment completes and saves
- [ ] User profile loads
- [ ] No sensitive data in logs
- [ ] Error handling works (try invalid login)
- [ ] Mobile view works (responsive)
- [ ] Performance acceptable (< 3s load)

---

## Monitor Production

### Daily

1. Check **Render Dashboard** for errors
2. Monitor backend **Logs** for exceptions
3. Test critical flows (login, assessment)

### Weekly

1. Review performance metrics
2. Check for 5xx errors in logs
3. Test all features
4. Check MongoDB Atlas metrics

### Monthly

1. Review access logs
2. Update dependencies if needed
3. Rotate secrets (if policy requires)
4. Backup production data

---

## Scaling for Production

### When traffic increases

1. **Upgrade Render plan**:
   - Free tier: Limited resources, may get slow
   - Pro tier: $7/month, better resources

2. **Monitor performance**:
   - Backend → **Metrics** tab
   - MongoDB Atlas → **Metrics** tab

3. **Optimize code**:
   - Add caching headers
   - Optimize database queries
   - Use Redis (add to backend)

### Custom Domain

1. Go to frontend service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS setup instructions
4. Wait for SSL certificate (~5 minutes)

---

## Rollback to Previous Version

If deployment breaks production:

1. Go to service (Frontend or Backend)
2. Click **Deployments** tab
3. Find previous successful deployment
4. Click **Redeploy**
5. Frontend: ~2 minutes to rollback
6. Backend: ~2 minutes to rollback

---

## Next Steps After Deployment

1. ✅ All services deployed and tested
2. ⏭️ Set up monitoring and alerts (optional)
3. ⏭️ Configure custom domain (optional)
4. ⏭️ Add staging environment for testing
5. ⏭️ Set up CI/CD pipeline (auto-deploy on push)

---

## Support & Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **MongoDB Atlas Support**: [support.mongodb.com](https://support.mongodb.com)
- **Node.js Best Practices**: [nodejs.org/en/docs/guides](https://nodejs.org/en/docs/guides)

---

## Deployment Summary

**Frontend**:
- URL: `https://pragyan-frontend.onrender.com`
- Type: Static Site (Vite + React)
- Build: `npm install && npm run build`
- Publish: `dist/`

**Backend**:
- URL: `https://pragyan-backend.onrender.com`
- Type: Web Service (Node + Express)
- Build: `npm install && npm run build`
- Start: `npm start`

**Database**:
- MongoDB Atlas (cloud-hosted)
- Connection: `mongodb+srv://...`
- Database: `Pragyan`

**Everything deployed and production-ready!** 🚀

