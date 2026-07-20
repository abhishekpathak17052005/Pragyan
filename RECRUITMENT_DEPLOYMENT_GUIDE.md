# Recruitment Module Phase 1 - Deployment Guide

**Status**: ✅ Ready for Production  
**Date**: July 14, 2026

---

## Pre-Deployment Verification

### 1. Build Verification

```bash
# Backend
cd backend
npm run build
# Expected: Exit code 0, 0 errors

# Frontend
cd frontend
npm run build
# Expected: Exit code 0, 0 errors, 2233 modules transformed

# Prisma
cd backend
npx prisma validate
# Expected: Schema is valid 🚀

npx prisma generate
# Expected: Prisma Client v6.19.0 generated
```

### 2. Environment Variables

Verify these are set in `.env` files:

**Backend** (`backend/.env`):
```
DATABASE_URL=your_mongodb_connection
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=your_backend_url
```

### 3. Database Status

```bash
# Check MongoDB connection
cd backend
npm run prisma:studio
# Should connect without errors
```

---

## Deployment Steps

### Step 1: Backup Database

```bash
# Create backup before deployment
mongodump --uri="$DATABASE_URL" --out=./backup-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Deploy Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (if any)
npx prisma migrate deploy

# Build
npm run build

# Start service
npm start
# or with PM2:
pm2 start npm --name "pragyan-backend" -- start
```

### Step 3: Deploy Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build
npm run build

# Deploy dist/public folder to CDN/static server
# Copy dist/public to your web server root
```

### Step 4: Verify Deployment

```bash
# Test backend endpoints
curl http://localhost:5000/recruitment/jobs

# Test frontend routes
curl http://localhost:5173/recruitment

# Verify authorization
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/recruitment/companies/INVALID_ID
# Should return 403 Forbidden (or 401 Unauthorized)
```

### Step 5: Health Check

```bash
# Verify all services running
curl http://localhost:5000/health
# Expected: 200 OK

# Test recruitment endpoints
curl http://localhost:5000/recruitment/jobs
# Expected: 200 OK with jobs array

curl http://localhost:5000/recruitment/hiring-drives/upcoming
# Expected: 200 OK with upcoming drives
```

---

## Configuration

### Role-Based Access Configuration

The system uses three roles:
- **USER**: Student users (can apply to jobs, view own applications)
- **RECRUITER**: Company users (can manage company jobs, applications, hiring drives)
- **ADMIN**: Admin users (can verify companies, access all resources)

Roles are set during user creation in JWT payload:

```typescript
// Example JWT payload
{
  id: "user_id",
  email: "user@example.com",
  role: "RECRUITER" // or "USER" or "ADMIN"
}
```

### Authorization Rules

**Company-Based Access**:
- Recruiters are linked to companies via `Recruiter` model
- All company resources (jobs, applications, drives) check `recruiter.companyId`
- Multiple recruiters can belong to same company (shared access)

**Admin Access**:
- Admins bypass ownership checks
- Admins can verify companies
- Admins can delete companies
- Admins can access all resources

**Student Access**:
- Students (USER role) can view all public jobs
- Students can apply to jobs
- Students can only view/manage own applications
- Students cannot access company dashboard

---

## Monitoring & Logging

### Key Metrics to Monitor

```
1. Authorization Failure Rate
   - Track /recruitment endpoints returning 403
   - Alert if >5% of requests fail authorization

2. Build Success Rate
   - npm run build exits with 0
   - TypeScript compilation errors: 0

3. API Response Times
   - Authorization checks should add <10ms
   - Target: <200ms average response time

4. Database Query Performance
   - Indexed queries: companyId, status, applicationDeadline
   - Monitor slow query logs
```

### Logging Configuration

Add authorization logging to middleware:

```typescript
requireCompanyOwnership.catch((error) => {
  logger.warn('Authorization failed', {
    userId: req.user?.id,
    companyId: req.params.companyId,
    error: error.message,
  });
});
```

---

## Troubleshooting

### Issue: "Not authorized to manage this company"

**Cause**: Recruiter trying to access company they don't belong to

**Solution**:
1. Check `Recruiter` model - is user linked to company?
2. Verify `recruiter.companyId` matches request `companyId`
3. Check JWT payload - does user.role === 'RECRUITER'?

```bash
# Debug query
db.recruiters.findOne({ email: "recruiter@example.com", companyId: "COMPANY_ID" })
```

### Issue: Frontend shows 404 on `/recruitment`

**Cause**: Routes not properly registered in App.tsx

**Solution**:
1. Verify App.tsx has RecruitmentDashboard import
2. Check wouter Route is registered correctly
3. Verify lazy loading path: `@/pages/recruitment-dashboard`

```bash
# Check files exist
ls frontend/src/pages/recruitment-dashboard.tsx
ls frontend/src/pages/company-dashboard.tsx
```

### Issue: Build fails with "Cannot find module"

**Cause**: Missing dependencies or import path wrong

**Solution**:
1. Run `npm install` in affected directory
2. Check import paths use correct aliases (@/pages, @/hooks, etc.)
3. Verify wouter is installed: `npm ls wouter`

```bash
cd frontend && npm ls wouter
```

### Issue: "Database connection failed"

**Cause**: MongoDB not running or connection string wrong

**Solution**:
1. Verify DATABASE_URL in .env
2. Check MongoDB is running: `mongo --version`
3. Test connection: `npx prisma db push --skip-generate`

---

## Rollback Plan

If issues arise after deployment:

### Quick Rollback

```bash
# 1. Revert code to previous version
git checkout HEAD~1

# 2. Rebuild
npm run build

# 3. Restart services
pm2 restart pragyan-backend
```

### Database Rollback

```bash
# Restore from backup if needed
mongorestore --uri="$DATABASE_URL" ./backup-YYYYMMDD-HHMMSS

# Or manually verify data:
db.companies.find()
db.recruitmentJobs.find()
```

---

## Post-Deployment Checklist

- [ ] Backend service running and healthy
- [ ] Frontend builds successfully and serves
- [ ] Public endpoints accessible (GET /recruitment/jobs)
- [ ] Protected endpoints return proper auth errors
- [ ] Authorization checks working (403 on unauthorized)
- [ ] Database connection stable
- [ ] No errors in logs
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Documentation updated

---

## Support & Questions

### Authorization Questions
Q: How do I check if a user can access a resource?  
A: Use the verification functions in `recruitment.authorization.ts`

```typescript
import { verifyCompanyOwnership } from './recruitment.authorization';

try {
  await verifyCompanyOwnership(companyId, userId);
  // User is authorized
} catch (error) {
  // User is not authorized
}
```

### Route Questions
Q: How do I link to recruitment dashboard?  
A: Use wouter Link component:

```typescript
import { Link } from 'wouter';

<Link href="/recruitment">Browse Jobs</Link>
<Link href={`/admin/company/${companyId}`}>Company Dashboard</Link>
```

### API Questions
Q: What endpoints are public vs protected?  
A: See `RECRUITMENT_AUDIT_REPORT.md` for full endpoint list

Public endpoints (no auth required):
- GET /recruitment/jobs
- GET /recruitment/jobs/open
- GET /recruitment/jobs/:id
- GET /recruitment/hiring-drives/upcoming
- GET /recruitment/hiring-drives/:id

---

## Version Information

- **Phase**: 1 (Foundation)
- **Status**: Production Ready
- **Build Date**: July 14, 2026
- **Backend Build**: ✅ Passing
- **Frontend Build**: ✅ Passing
- **Database**: Prisma v6.19.0, MongoDB
- **Frontend Framework**: React 18, Wouter router
- **Backend Framework**: Express.js, TypeScript

---

## Contact & Escalation

For deployment issues:
1. Check troubleshooting guide above
2. Review logs in `backend/logs/` and `frontend/logs/`
3. Verify all pre-deployment checks passed
4. Contact team lead if issues persist

---

## Success Criteria

Deployment is successful when:

✅ All builds pass without errors  
✅ Backend service starts and responds to health checks  
✅ Frontend loads without console errors  
✅ Authorization correctly enforces role-based access  
✅ All public endpoints accessible  
✅ Protected endpoints return proper auth errors  
✅ No errors in application logs  
✅ Database connectivity stable  

**Deployment Ready**: YES ✅

