# Pragyan AI - Deployment Checklist

**Print this out or keep it open while deploying!**

---

## 🔴 PRE-DEPLOYMENT (Do This First)

### Secrets Generation
- [ ] Open PowerShell in `backend/` directory
- [ ] Run: `.\GENERATE_SECRETS.ps1`
- [ ] Copy the 3 generated secrets to notepad (don't lose them!)
- [ ] Secrets are: JWT_SECRET, SESSION_SECRET, JWT_REFRESH_SECRET

### Environment Setup
- [ ] Create `.env.production` in `backend/` directory
- [ ] Fill in all 3 secrets from above
- [ ] Update DATABASE_URL with production MongoDB
- [ ] Update FRONTEND_URL with production domain (e.g., https://pragyan.yourdomain.com)
- [ ] Update CORS_ORIGINS with production domain
- [ ] Add production OAuth credentials (Google, GitHub)
- [ ] Add production email credentials
- [ ] **DO NOT COMMIT .env.production to git**

### Code Build
- [ ] Run: `cd backend`
- [ ] Run: `npm install`
- [ ] Run: `npm run build`
- [ ] Verify: No errors, build completes successfully
- [ ] Verify: No secrets appear in build output

### Security Verification
- [ ] Search codebase for "console.log" - should NOT log passwords/tokens
- [ ] Search for hardcoded secrets - should find NONE
- [ ] Run: `npm audit` - fix any critical vulnerabilities

---

## 🟡 DEPLOYMENT (Choose Your Method)

### Option A: Docker/Container
- [ ] Build Docker image: `docker build -t pragyan-api:latest .`
- [ ] Tag for registry: `docker tag pragyan-api:latest YOUR_REGISTRY/pragyan-api:latest`
- [ ] Push to registry: `docker push YOUR_REGISTRY/pragyan-api:latest`
- [ ] Deploy to cluster: (ECS, Kubernetes, etc.)

### Option B: Traditional Server
- [ ] SSH to production server
- [ ] Pull latest code: `git pull origin main`
- [ ] Install deps: `npm install`
- [ ] Build: `npm run build`
- [ ] Copy .env.production: `cp .env.production backend/.env`
- [ ] Start server: `npm run start` or use PM2

### Option C: Serverless (AWS Lambda)
- [ ] Build: `npm run build`
- [ ] Deploy: `sam deploy --guided` or `serverless deploy`

---

## 🟢 POST-DEPLOYMENT (Verify Everything Works)

### Health Check
- [ ] Run: `curl https://YOUR_DOMAIN/health`
- [ ] Expected response: `{"status":"OK","timestamp":"..."}`

### Login Test
- [ ] Test email/password login in UI
- [ ] Test OAuth login (Google) in UI
- [ ] Verify user gets logged in successfully

### Data Persistence
- [ ] Submit an assessment
- [ ] Check MongoDB that data was saved
- [ ] Verify no null or empty results

### Security Headers
- [ ] Run: `curl -I https://YOUR_DOMAIN`
- [ ] Verify headers present:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`

### Logs Check
- [ ] Check server logs
- [ ] Should NOT see passwords, tokens, or API keys
- [ ] Should see successful auth attempts

---

## 🚨 ISSUES? Use This Quick Fix Guide

| Issue | Quick Fix |
|-------|-----------|
| "JWT_SECRET is required" | Add JWT_SECRET to .env.production (32+ chars) |
| "SESSION_SECRET is required" | Add SESSION_SECRET to .env.production (32+ chars) |
| Build fails | Run `npm install` then `npm run build` |
| Port 3000 in use | Change PORT in .env.production or kill process |
| Database connection fails | Verify DATABASE_URL is correct and server can access it |
| CORS error on login | Add FRONTEND_URL to CORS_ORIGINS |
| Tokens not working | Verify JWT_SECRET is correct and consistent |

---

## ✅ FINAL VERIFICATION

All items must be checked before calling deployment complete:

- [ ] Health check responds with 200 OK
- [ ] Users can login successfully
- [ ] Assessment data saves to database
- [ ] No errors in logs
- [ ] Security headers present
- [ ] HTTPS is enforced
- [ ] OAuth works (Google/GitHub)
- [ ] Monitoring/alerts are configured
- [ ] Database backup is verified

---

## 📞 Contact/Support

If something goes wrong:
1. Check the `FINAL_DEPLOYMENT_GUIDE.md`
2. Check the logs first
3. Verify all secrets are correct
4. Verify database connection
5. Try rollback procedure if needed

---

**Good luck with your deployment!** 🚀

**Remember**: Never commit secrets to git, always use .gitignore!

