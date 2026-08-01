# 🚀 Pragyan AI - Complete Render Deployment Guide

**Date**: July 14, 2026  
**Status**: Ready for Production Deployment  
**Architecture**: Separate Frontend (Static) + Backend (Web Service)

---

## ⚠️ SECURITY ALERT - ACTION REQUIRED

Your `backend/.env` currently contains **real MongoDB credentials**:

```
ap17052005_db_user:Pragyan123@cluster0.7fsqglj.mongodb.net
```

**Before deploying:**
1. ✅ Rotate your MongoDB password immediately (in Atlas dashboard)
2. ✅ Never commit `.env` (already in `.gitignore` ✓)
3. ✅ Use Render environment variables dashboard for production secrets
4. ✅ Create separate credentials for production MongoDB

---

## Step 1: Prepare MongoDB Atlas for Production

### 1.1 Create Production MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **new project** for production (or use existing)
3. Create a **new cluster** (or reuse if separate database)
4. Click **Connect** → Select **Drivers**
5. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/Pragyan`

### 1.2 Create Production Database User

1. Go to **Database Access** in Atlas
2. Click **Add New Database User**
3. Create user (e.g., `pragyan_prod_user`)
4. Generate strong password (copy it - you'll need it)
5. Assign role: **readWriteAnyDatabase**
6. Click **Add User**

### 1.3 Configure Network Access

1. Go to **Network Access** in Atlas
2. Click **Add IP Address**
3. Select **Allow from anywhere** (Render uses dynamic IPs)
4. Confirm

### 1.4 Get Your Connection String

Connection string format:
```
mongodb+srv://pragyan_prod_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan
```

**Save this** - you'll need it in Step 6.

---

## Step 2: Generate Production Secrets

Run this command in PowerShell to generate 3 secure secrets:

```powershell
Write-Host "Generate 3 production secrets (32+ chars each):" -ForegroundColor Green
Write-Host ""
Write-Host "JWT_SECRET:" -ForegroundColor Cyan
[System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
Write-Host ""
Write-Host "JWT_REFRESH_SECRET:" -ForegroundColor Cyan
[System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
Write-Host ""
Write-Host "SESSION_SECRET:" -ForegroundColor Cyan
[System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
```

**Save these 3 secrets** - you'll add them to Render in Step 8.

---

## Step 3: Update Frontend Configuration

### 3.1 Check Frontend API URL

Your frontend needs to know the backend URL. Update `frontend/src/services/api.ts` or wherever your API client is configured:

```typescript
// Development
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// Production (Render will inject this)
```

Or in your `.env.production`:

```
VITE_API_URL=https://pragyan-backend.onrender.com
```

### 3.2 Verify Frontend Build

```bash
cd frontend
npm run build
```

Should output to `frontend/dist/` without errors.

---

## Step 4: Push Code to GitHub

**Backend and frontend must be in the same GitHub repository** (in separate folders: `backend/`, `frontend/`).

```bash
# From root of project
git add .
git commit -m "chore: prepare for Render deployment"
git push origin main
```

---

## Step 5: Deploy Frontend to Render (Static Site)

### 5.1 Create Static Site

1. Go to [render.com](https://render.com)
2. Click **New +** → **Static Site**
3. Connect your GitHub repo
4. Select the repo (must have `frontend/` folder)

### 5.2 Configure Static Site

| Setting | Value |
|---------|-------|
| **Name** | `pragyan-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 5.3 Deploy

Click **Create Static Site**. Wait for build to complete (~2 minutes).

**Result**: Frontend URL like `https://pragyan-frontend.onrender.com`

---

## Step 6: Deploy Backend to Render (Web Service)

### 6.1 Create Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Select the same repo

### 6.2 Configure Web Service

| Setting | Value |
|---------|-------|
| **Name** | `pragyan-backend` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 6.3 Add Environment Variables

Click **Environment** → Add these variables:

```
NODE_ENV=production
PORT=3000

DATABASE_URL=mongodb+srv://pragyan_prod_user:PASSWORD@cluster0.xxxxx.mongodb.net/Pragyan?retryWrites=true&w=majority&appName=Pragyan

JWT_SECRET=<paste from Step 2>
JWT_REFRESH_SECRET=<paste from Step 2>
SESSION_SECRET=<paste from Step 2>

API_BASE_URL=https://pragyan-backend.onrender.com
FRONTEND_URL=https://pragyan-frontend.onrender.com

CORS_ORIGINS=https://pragyan-frontend.onrender.com,https://yourdomain.com

GEMINI_API_KEY=<your key>
GROQ_API_KEY=<your key>

GOOGLE_CLIENT_ID=<your key>
GOOGLE_CLIENT_SECRET=<your key>
GITHUB_CLIENT_ID=<your key>
GITHUB_CLIENT_SECRET=<your key>

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your email>
EMAIL_PASSWORD=<your app password>
EMAIL_FROM=Pragyan <your email>
```

### 6.4 Deploy

Click **Create Web Service**. Wait for build and deployment (~5 minutes).

**Result**: Backend URL like `https://pragyan-backend.onrender.com`

---

## Step 7: Update Frontend with Backend URL

Once backend is deployed, update frontend environment:

### 7.1 Add Environment Variable to Frontend

In Render dashboard for your frontend:

1. Click **Environment** (if available for Static Sites)
2. Or create `frontend/.env.production`:

```env
VITE_API_URL=https://pragyan-backend.onrender.com
```

### 7.2 Rebuild Frontend

If you added environment variable, manually trigger a rebuild:

1. Go to frontend service
2. Click **Manual Deploy** or push a new commit
3. Build will use the new environment variables

---

## Step 8: Update OAuth Redirect URLs

For Google OAuth and GitHub OAuth, add your Render URLs:

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth app
5. Add **Authorized redirect URIs**:
   - `https://pragyan-backend.onrender.com/auth/google/callback`
   - `https://pragyan-backend.onrender.com/auth/oauth/google/callback` (if different)

### GitHub OAuth

1. Go to your GitHub profile → **Settings** → **Developer settings** → **OAuth Apps**
2. Edit your OAuth app
3. Update **Authorization callback URL**:
   - `https://pragyan-backend.onrender.com/auth/github/callback`
   - `https://pragyan-backend.onrender.com/auth/oauth/github/callback` (if different)

---

## Step 9: Test Deployment

### 9.1 Health Check

```bash
curl https://pragyan-backend.onrender.com/health
```

Expected response:
```json
{"status":"OK","timestamp":"2026-07-14T..."}
```

### 9.2 Frontend Access

Open browser: `https://pragyan-frontend.onrender.com`

Should load without errors.

### 9.3 Login Flow

1. Click "Login" on frontend
2. Enter credentials or use Google/GitHub
3. Should redirect to dashboard
4. Verify profile page loads

### 9.4 Assessment Flow

1. Click "Take Assessment"
2. Complete a few questions
3. Check backend logs: `tail -f <logs>` for data persistence
4. Submit and verify roadmap appears

---

## Step 10: Configure Custom Domain (Optional)

### 10.1 Frontend Custom Domain

1. Go to frontend service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS setup instructions
4. Update `FRONTEND_URL` in backend environment

### 10.2 Backend Custom Domain

1. Go to backend service → **Settings** → **Custom Domains**
2. Add your API domain (e.g., `api.yourdomain.com`)
3. Follow DNS setup instructions
4. Update `API_BASE_URL` in frontend environment

---

## Step 11: Monitor & Troubleshoot

### Logs

- **Frontend**: No backend logs (static site)
- **Backend**: Render dashboard → service → **Logs**

### Common Issues

#### Backend won't start: "Cannot find module 'X'"

- Check `backend/package.json` has all dependencies
- Run `npm install` locally and commit `package-lock.json`
- Trigger rebuild on Render

#### MongoDB connection error

- Verify `DATABASE_URL` in environment variables
- Check MongoDB Atlas network access (should allow all IPs)
- Verify username/password is URL-encoded if contains special chars

#### CORS errors in frontend

- Update `CORS_ORIGINS` to include frontend URL
- Verify backend is returning correct CORS headers
- Check browser console for full error

#### OAuth redirect fails

- Verify redirect URLs match exactly in Google/GitHub settings
- Check `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID` are correct
- Verify `FRONTEND_URL` matches your domain

### View Backend Logs

```bash
# In Render dashboard
# Services → pragyan-backend → Logs
# Watch for errors and monitor startup
```

---

## Step 12: Production Checklist

- [ ] MongoDB Atlas cluster created and accessible
- [ ] Production secrets generated and added to Render
- [ ] Frontend deployed as Static Site
- [ ] Backend deployed as Web Service
- [ ] Environment variables set on Render
- [ ] OAuth redirect URLs updated
- [ ] Health endpoint responds
- [ ] Frontend loads without errors
- [ ] Login works (email and OAuth)
- [ ] Assessment data persists
- [ ] No sensitive data in logs
- [ ] Custom domains configured (optional)
- [ ] Monitoring set up

---

## Post-Deployment

### Database Migrations

If your schema changed:

```bash
# Run migrations on Render backend
# SSH into service or use Render Shell

cd backend
npm run prisma:push
```

### Seed Data

If needed:

```bash
npm run seed
npm run seed:roadmaps
```

### Monitoring

1. Set up error tracking (e.g., Sentry)
2. Monitor database performance
3. Watch logs for unusual activity
4. Set up alerts for failures

---

## Rollback

If deployment fails:

1. Go to Render service
2. Click **Settings** → **Deployment History**
3. Click previous successful deployment
4. Click **Redeploy**

---

## Next Steps

1. **Start with Step 1**: Create MongoDB Atlas cluster
2. **Then Step 2**: Generate production secrets
3. **Then Step 5**: Deploy frontend
4. **Then Step 6**: Deploy backend
5. **Then Step 9**: Test end-to-end

Once deployed, your Pragyan AI will be live at:
- **Frontend**: `https://pragyan-frontend.onrender.com`
- **Backend**: `https://pragyan-backend.onrender.com`

---

## Support

If you hit issues:

1. Check **Render logs**: Service → Logs
2. Check **MongoDB Atlas status**: Dashboard
3. Verify **environment variables**: All required keys present
4. Test **locally first**: `npm run dev` to isolate issues

---

**Questions?** Review the steps above or check the specific troubleshooting section.

