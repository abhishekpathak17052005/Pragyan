# ✅ Phase 2 Ready: Authentication & Role-Based Redirect

**Date:** July 14, 2026  
**Status:** LOCKED & READY FOR IMPLEMENTATION  
**Duration:** 2-3 weeks  
**Owner:** [Awaiting assignment]

---

## Executive Summary

Phase 2 implements a secure, backend-driven authentication system where:

1. **Backend determines role** - Not the frontend
2. **Role is in JWT** - Cryptographically signed, can't be faked
3. **Single login page** - All users login here, auto-redirect happens after
4. **Automatic redirect** - User lands on correct dashboard immediately
5. **Frontend trusts backend** - All role decisions based on JWT

---

## The 4-Role System

```
STUDENT → /dashboard (Learning, jobs, applications)
RECRUITER → /company/dashboard (Hiring, jobs, interviews)
PLACEMENT_OFFICER → /placement/dashboard (Campus recruitment, students, companies)
ADMIN → /admin/dashboard (Platform management)
```

---

## Login Flow

```
┌─────────────────────────┐
│   User visits site      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Checks localStorage   │
│   for auth token        │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │                 │
   YES                NO
    │                 │
    ▼                 ▼
┌────────┐   ┌──────────────────┐
│Go to   │   │Redirect to       │
│saved   │   │/login page       │
│page    │   └────────┬─────────┘
└────────┘            │
                      ▼
                ┌──────────────────┐
                │User enters       │
                │credentials       │
                └────────┬─────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │Backend verifies        │
            │credentials             │
            └────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │Load user from database     │
        │Extract user.role           │
        └────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │Generate JWT with role          │
    │Return user + token to frontend │
    └────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│Frontend stores token + user in     │
│localStorage                        │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│Check user.role from response       │
│Look up redirect URL in map         │
└────────┬───────────────────────────┘
         │
    ┌────┴────┬────────────┬──────────┐
    │          │            │          │
    ▼          ▼            ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────┐
│STUDENT │ │RECRUITER│ │PLACEMENT │ │ADMIN │
└───┬────┘ └───┬────┘ └────┬─────┘ └──┬───┘
    │          │           │         │
    ▼          ▼           ▼         ▼
 /dashboard /company  /placement  /admin
```

---

## Implementation Documents

### 1. PHASE_2_AUTH_ARCHITECTURE.md
**Complete architecture design**
- JWT structure
- Backend middleware
- Frontend auth context
- Route protection
- Sidebar rendering
- Database relationships

**Use this to understand the full system**

---

### 2. PHASE_2_REGISTRATION_FLOW.md
**Registration & Account Approval**
- 3 self-registerable roles (Student, Recruiter, T&P Officer)
- Admin accounts manual-only (security)
- Account status enum (PENDING, APPROVED, REJECTED, SUSPENDED)
- Registration validation per role
- Status check on login
- Admin approval panel design
- Email notifications

**Use this for registration implementation**

---

### 3. PHASE_2_TASKS.md
**Step-by-step task breakdown**
- 26+ concrete tasks (will be updated for registration)
- Week 1: Database & Backend
- Week 2: Frontend Auth & Routes
- Week 3: Testing & Verification
- Code examples for every task
- Verification steps for each task

**Use this to execute the implementation**

---

### 4. LOGIN_ROLE_REDIRECT_FLOW.md
**Reference guide with code examples**
- Security considerations
- Implementation checklist
- How each scenario works
- Troubleshooting guide

**Use this for reference during development**

---

## Key Principles

✅ **Backend is source of truth**
- Role determined by backend
- JWT contains role
- Cannot be faked on frontend

✅ **Single login page**
- No `/admin/login`, `/recruiter/login`, `/student/login`
- One unified login: `/login`
- Auto-redirect happens based on role

✅ **Automatic redirect**
- User never chooses where to go
- Switch statement based on role
- Redirect happens immediately after login

✅ **Frontend trusts JWT**
- JWT is cryptographically signed
- Can't be modified without server knowledge
- Expires after 1 hour
- Always verified on backend

✅ **Every route is protected**
- Backend middleware validates role
- Frontend guards prevent access
- Double protection

---

## Week-by-Week Breakdown

### Week 1: Database & Backend (8 tasks)
1. Add UserRole enum to Prisma
2. Add role field to User
3. Run migration
4. Update login endpoint
5. Create requireAuth middleware
6. Create requireRole middleware
7. Register middleware in app
8. Test with Postman

**Output:** Working backend auth with JWT role

---

### Week 2: Frontend Auth & Routes (9 tasks)
1. Create AuthContext with useAuth hook
2. Wrap app with AuthProvider
3. Update login page with auto-redirect
4. Create ProtectedRoute component
5. Create role-specific route guards (4 components)
6. Update router with protected routes
7. Create dynamic Sidebar component
8. Update dashboards with Sidebar
9. Frontend build verification

**Output:** Working frontend auth with role-based redirect

---

### Week 3: Testing & Verification (9 tasks)
1. Test Student login → `/dashboard`
2. Test Recruiter login → `/company/dashboard`
3. Test Placement Officer login → `/placement/dashboard`
4. Test Admin login → `/admin/dashboard`
5. Test role-based access control (wrong role redirects)
6. Test logout clears all data
7. Test token persists across refresh
8. Test invalid JWT rejected
9. Test backend authorization on API calls

**Output:** Fully tested, production-ready auth system

---

## Files to Create

### Backend (2 new files)
```
backend/src/middleware/requireAuth.ts
backend/src/middleware/requireRole.ts
```

### Frontend (5 new files)
```
frontend/src/contexts/AuthContext.tsx
frontend/src/components/ProtectedRoute.tsx
frontend/src/components/StudentRoute.tsx
frontend/src/components/RecruiterRoute.tsx
frontend/src/components/PlacementOfficerRoute.tsx
frontend/src/components/AdminRoute.tsx
frontend/src/components/Sidebar.tsx
```

**Total: 9 new files**

---

## Files to Modify

### Backend (1 file)
```
backend/prisma/schema.prisma (add enum + fields)
backend/src/routes/auth.ts (update login endpoint)
backend/src/app.ts (register middleware)
backend/src/main.ts or server startup file
```

### Frontend (5 files)
```
frontend/src/main.tsx (wrap with AuthProvider)
frontend/src/App.tsx (update routes)
frontend/src/pages/login.tsx (add auto-redirect)
frontend/src/pages/dashboard.tsx (add Sidebar)
frontend/src/pages/placement/dashboard.tsx (add Sidebar)
frontend/src/pages/company/dashboard.tsx (add Sidebar)
frontend/src/pages/admin/dashboard.tsx (add Sidebar)
```

**Total: 12 files to modify (approximately)**

---

## Success Criteria

✅ **Functionality**
- User can login with email + password
- JWT contains role
- Auto-redirect to correct dashboard
- Student can only access /dashboard
- Recruiter can only access /company
- Placement Officer can only access /placement
- Admin can access /admin
- Logout clears all data
- Token persists across refresh

✅ **Security**
- JWT is cryptographically signed
- Role cannot be modified on frontend
- Backend verifies role on every request
- Invalid JWT rejected
- Expired JWT rejected
- No role spoofing possible

✅ **Quality**
- Backend build: 0 errors
- Frontend build: 0 errors
- No TypeScript errors
- No console warnings
- All tests passing
- Code is documented

✅ **UX**
- Single login page
- Immediate auto-redirect
- Clear error messages
- Loading states
- Logout button works
- Sidebar shows correct nav per role

---

## Timeline

**Week 1:** Database schema + Backend auth  
**Week 2:** Frontend auth context + Routes  
**Week 3:** Testing + Verification  

**Total:** 2-3 weeks

---

## Post-Phase 2: What Unlocks

Once Phase 2 is complete:

✅ **Phase 3 can proceed** (Recruitment Models)
- Company, Recruiter, RecruitmentJob models
- Recruiter-specific APIs
- Company isolation

✅ **Role-specific features**
- Placement Officer can filter by college
- Recruiter can filter by company
- Admin can see all data

✅ **Authorization** on all APIs
- Every endpoint checks user.role
- Every resource checks ownership

✅ **Multi-tenant foundation**
- Ready for multiple colleges
- Ready for multiple companies
- Ready for authorization by collegeId/companyId

---

## Getting Started

### Step 1: Read the Architecture
Read: `PHASE_2_AUTH_ARCHITECTURE.md`
- Understand JWT structure
- Understand flow
- Understand why backend-first

### Step 2: Review the Tasks
Read: `PHASE_2_TASKS.md`
- 26 concrete tasks
- Week 1, 2, 3 breakdown
- Code examples
- Verification steps

### Step 3: Assign Owner
- Pick who will lead Phase 2
- Set timeline: weeks starting [DATE]
- Communicate with team

### Step 4: Begin Week 1
- Start with Prisma schema changes
- Update login endpoint
- Create middleware
- Test with Postman

### Step 5: Regular Updates
- Daily standup on progress
- Weekly review of completed tasks
- Address blockers immediately

---

## Questions Before Starting?

**Q: Can users be multiple roles?**
A: In Phase 2, one role per user (role field is single value). Multi-role can be added in Phase 4+ if needed.

**Q: What about 2FA?**
A: Out of scope for Phase 2. Can be added in Phase 4 if needed.

**Q: What about password reset?**
A: Out of scope for Phase 2. Can be added in Phase 4 if needed.

**Q: Can we use OAuth (Google/GitHub login)?**
A: Not in Phase 2. Can be added in Phase 4 if needed.

**Q: What if role needs to change?**
A: Admin can update user.role in database, token refreshes next login.

**Q: How long does JWT last?**
A: 1 hour (standard). Can adjust in auth endpoint.

**Q: Is httpOnly cookie better than localStorage?**
A: Both work for SPA. localStorage simpler, httpOnly more secure. localStorage OK for Phase 2.

---

## Security Checklist

Before deploying Phase 2:

- [ ] JWT is signed with a secret key
- [ ] JWT is verified on every protected endpoint
- [ ] Password is hashed with bcrypt (or similar)
- [ ] Role cannot be modified on frontend
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] Rate limiting on login endpoint
- [ ] No role info logged in plain text
- [ ] Token expiration enforced
- [ ] Expired token rejected

---

## Next Steps

1. **Today:** Review PHASE_2_AUTH_ARCHITECTURE.md
2. **Today:** Review PHASE_2_TASKS.md
3. **Today:** Assign Phase 2 owner
4. **Tomorrow:** Owner begins Week 1 tasks
5. **Week 1:** Database + Backend complete
6. **Week 2:** Frontend complete
7. **Week 3:** Testing + Verification
8. **End of Week 3:** Phase 2 complete, Phase 3 ready to start

---

## Sign-Off

**Phase 1:** ✅ Complete (Placement Portal APIs working)  
**Phase 2:** 🔐 LOCKED & READY (This document)  
**Phase 3:** 📋 Blocked until Phase 2 complete (Recruitment models)

Ready to proceed?

---

**Document:** PHASE_2_READY.md  
**Date:** July 14, 2026  
**Status:** ✅ READY FOR IMPLEMENTATION  
**Owner:** [To be assigned]
