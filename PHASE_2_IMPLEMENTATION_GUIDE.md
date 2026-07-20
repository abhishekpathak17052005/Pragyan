# 🔐 Phase 2: Authentication & Role-Based Redirect

**Date:** July 14, 2026  
**Duration:** 2-3 weeks  
**Priority:** HIGHEST  
**Status:** Ready for implementation

---

## Overview

**Goal:** When ANY person logs in, they are immediately redirected to their correct dashboard based on role.

**Key Principle:** 
> "WHEN ANY PERSON COMES HE/SHE HAVE TO CHECK WHERE HE/SHE IS: USER / ADMIN / T&P COORDINATOR / RECRUITER"

This is the FIRST thing that happens after login.

---

## The 4-Role System

```prisma
enum UserRole {
  ADMIN
  STUDENT
  PLACEMENT_OFFICER
  RECRUITER
}
```

### Role Dashboards (Auto-Redirects on Login)

| Role | Dashboard | URL | Purpose |
|------|-----------|-----|---------|
| ADMIN | Admin Dashboard | `/admin/dashboard` | Platform oversight, user management, analytics |
| STUDENT | Student Dashboard | `/dashboard` | Learning, assessments, jobs, applications |
| PLACEMENT_OFFICER | Placement Dashboard | `/placement/dashboard` | T&P coordination, campus drives, companies |
| RECRUITER | Company Dashboard | `/company/dashboard` | Hiring, job posting, interviews, offers |

---

## Phase 2 Implementation Checklist

### Part 1: Database (Prisma)

- [ ] **1.1** Add UserRole enum to Prisma schema
  ```prisma
  enum UserRole {
    ADMIN
    STUDENT
    PLACEMENT_OFFICER
    RECRUITER
  }
  ```

- [ ] **1.2** Add role field to User model
  ```prisma
  model User {
    // ... existing fields ...
    role UserRole @default(STUDENT)
  }
  ```

- [ ] **1.3** Add collegeId to User (nullable, for PLACEMENT_OFFICER)
  ```prisma
  model User {
    // ... existing fields ...
    collegeId String?
    // College relationship if exists
  }
  ```

- [ ] **1.4** Add companyId to User (nullable, for RECRUITER)
  ```prisma
  model User {
    // ... existing fields ...
    companyId String?
    // Company relationship (to be created in Phase 3)
  }
  ```

- [ ] **1.5** Run migration
  ```bash
  npx prisma migrate dev --name add_user_roles
  ```

- [ ] **1.6** Verify Prisma client generation
  ```bash
  npx prisma generate
  ```

---

### Part 2: Backend - Auth Service & JWT

- [ ] **2.1** Create/update login endpoint signature
  - File: `backend/src/routes/auth.ts` (or update existing)
  - Input: `{ email, password }`
  - Output: `{ accessToken, user: { id, email, role, collegeId?, companyId? } }`

- [ ] **2.2** Include role in JWT payload
  ```typescript
  // JWT payload should contain:
  {
    sub: userId,
    email: userEmail,
    role: "STUDENT" | "ADMIN" | "PLACEMENT_OFFICER" | "RECRUITER",
    collegeId?: "college_123",
    companyId?: "company_456",
    iat: timestamp,
    exp: timestamp + 1hour
  }
  ```

- [ ] **2.3** Create authorization middleware
  - File: `backend/src/middleware/authorize.ts`
  - Function: `authorize(allowedRoles: UserRole[])`
  - Validates user role before allowing endpoint access

- [ ] **2.4** Test auth endpoint with Postman
  - Login as STUDENT → check JWT has role: "STUDENT"
  - Login as PLACEMENT_OFFICER → check JWT has role: "PLACEMENT_OFFICER"
  - Login as RECRUITER → check JWT has role: "RECRUITER"
  - Login as ADMIN → check JWT has role: "ADMIN"

- [ ] **2.5** Backend build check
  ```bash
  cd backend && npm run build
  # Expected: 0 errors
  ```

---

### Part 3: Frontend - Auth Service

- [ ] **3.1** Create auth service functions
  - File: `frontend/src/services/authService.ts`
  - Functions:
    - `login(email, password)` → calls `/api/auth/login`
    - `logout()` → clears localStorage
    - `getRole()` → reads role from localStorage
    - `getToken()` → reads JWT from localStorage
    - `isAuthenticated()` → checks if token exists

- [ ] **3.2** Store token and role on login
  ```typescript
  export async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', { ... });
    
    // Store in localStorage
    localStorage.setItem('auth_token', response.accessToken);
    localStorage.setItem('user_role', response.user.role);
    localStorage.setItem('user_id', response.user.id);
    
    if (response.user.collegeId) {
      localStorage.setItem('college_id', response.user.collegeId);
    }
    if (response.user.companyId) {
      localStorage.setItem('company_id', response.user.companyId);
    }
    
    return response.user;
  }
  ```

- [ ] **3.3** Clear storage on logout
  ```typescript
  export function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('college_id');
    localStorage.removeItem('company_id');
  }
  ```

---

### Part 4: Frontend - Protected Routes

- [ ] **4.1** Create ProtectedRoute component
  - File: `frontend/src/components/ProtectedRoute.tsx`
  - Props: `{ allowedRoles, children, fallback? }`
  - Logic:
    - If not logged in → redirect to `/login`
    - If logged in but wrong role → redirect to `fallback` URL

- [ ] **4.2** Create useRole hook
  - File: `frontend/src/hooks/useRole.ts`
  - Returns: `{ role, isAdmin, isStudent, isPlacementOfficer, isRecruiter }`
  - For conditional rendering in components

---

### Part 5: Frontend - Router & Auto-Redirect

- [ ] **5.1** Create role redirect map
  ```typescript
  const roleRedirects: Record<UserRole, string> = {
    'ADMIN': '/admin/dashboard',
    'STUDENT': '/dashboard',
    'PLACEMENT_OFFICER': '/placement/dashboard',
    'RECRUITER': '/company/dashboard'
  };
  ```

- [ ] **5.2** Update login page to redirect after login
  - File: `frontend/src/pages/auth/login.tsx`
  - On successful login:
    1. Call `login(email, password)`
    2. Extract role from response
    3. Look up redirect URL from `roleRedirects` map
    4. Redirect using `setLocation(redirectUrl)`

- [ ] **5.3** Update router with protected routes
  - File: `frontend/src/App.tsx`
  - Routes:
    ```typescript
    // Admin routes
    <Route path="/admin/*">
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    </Route>
    
    // Student routes
    <Route path="/dashboard">
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentDashboard />
      </ProtectedRoute>
    </Route>
    
    // Placement Officer routes
    <Route path="/placement/*">
      <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
        <PlacementDashboard />
      </ProtectedRoute>
    </Route>
    
    // Recruiter routes
    <Route path="/company/*">
      <ProtectedRoute allowedRoles={['RECRUITER']}>
        <CompanyDashboard />
      </ProtectedRoute>
    </Route>
    ```

- [ ] **5.4** Handle token persistence
  - On app load: check if token exists in localStorage
  - If yes: verify token is still valid
  - If no or expired: redirect to `/login`

---

### Part 6: Testing

- [ ] **6.1** Test Student Login Flow
  - [ ] Navigate to `/login`
  - [ ] Enter student credentials
  - [ ] Backend returns role: "STUDENT"
  - [ ] Token stored in localStorage
  - [ ] Auto-redirects to `/dashboard` ✓
  - [ ] Student dashboard loads with student data

- [ ] **6.2** Test Placement Officer Login Flow
  - [ ] Navigate to `/login`
  - [ ] Enter T&P coordinator credentials
  - [ ] Backend returns role: "PLACEMENT_OFFICER"
  - [ ] Token stored in localStorage
  - [ ] Auto-redirects to `/placement/dashboard` ✓
  - [ ] Placement dashboard loads with placement data

- [ ] **6.3** Test Recruiter Login Flow
  - [ ] Navigate to `/login`
  - [ ] Enter recruiter credentials
  - [ ] Backend returns role: "RECRUITER"
  - [ ] Token stored in localStorage
  - [ ] Auto-redirects to `/company/dashboard` ✓
  - [ ] Company dashboard loads with company data

- [ ] **6.4** Test Admin Login Flow
  - [ ] Navigate to `/login`
  - [ ] Enter admin credentials
  - [ ] Backend returns role: "ADMIN"
  - [ ] Token stored in localStorage
  - [ ] Auto-redirects to `/admin/dashboard` ✓
  - [ ] Admin dashboard loads with admin data

- [ ] **6.5** Test Role-Based Access Control
  - [ ] Student tries to access `/placement/dashboard` → redirected to `/dashboard`
  - [ ] Recruiter tries to access `/admin/dashboard` → redirected to `/company/dashboard`
  - [ ] Placement Officer tries to access `/company/dashboard` → redirected to `/placement/dashboard`
  - [ ] Non-authenticated user tries to access any protected route → redirected to `/login`

- [ ] **6.6** Test Logout
  - [ ] Click logout button
  - [ ] localStorage cleared
  - [ ] Redirected to `/login`
  - [ ] Trying to access protected routes → redirected to `/login`

- [ ] **6.7** Test Token Persistence
  - [ ] Login as student
  - [ ] Close browser tab
  - [ ] Reopen browser and navigate to `/dashboard`
  - [ ] Should load without re-login (token valid)
  - [ ] Close all tabs, wait for token to expire
  - [ ] Reopen and navigate → redirected to `/login` (token expired)

---

### Part 7: Build Verification

- [ ] **7.1** Backend build
  ```bash
  cd backend && npm run build
  # Expected: 0 errors, 0 warnings
  ```

- [ ] **7.2** Frontend build
  ```bash
  cd frontend && npm run build
  # Expected: 0 errors
  ```

- [ ] **7.3** No type errors
  ```bash
  cd frontend && tsc --noEmit
  ```

---

## Acceptance Criteria

### Must Have ✅
- [ ] When a STUDENT logs in → auto-redirects to `/dashboard`
- [ ] When a PLACEMENT_OFFICER logs in → auto-redirects to `/placement/dashboard`
- [ ] When a RECRUITER logs in → auto-redirects to `/company/dashboard`
- [ ] When an ADMIN logs in → auto-redirects to `/admin/dashboard`
- [ ] Role is extracted from JWT on login
- [ ] Role persists across page refreshes (localStorage)
- [ ] Accessing wrong dashboard redirects to correct one
- [ ] Logout clears all stored data
- [ ] Both builds passing (0 errors)

### Should Have 🔄
- [ ] Token expiration check
- [ ] Refresh token mechanism
- [ ] Error messages on failed login
- [ ] Loading state during login
- [ ] Remember me option (optional)

### Nice to Have ✨
- [ ] Session timeout warning
- [ ] Multi-device login tracking
- [ ] Login audit log
- [ ] 2FA support (optional)

---

## Implementation Order

### Week 1: Database & Backend Auth
1. Add UserRole enum to Prisma
2. Add role field to User model
3. Add collegeId/companyId to User
4. Run migration
5. Update login endpoint to include role in JWT
6. Create authorization middleware
7. Backend build passes (0 errors)

### Week 2: Frontend Auth Service & Routes
1. Create auth service (login, logout, getRole)
2. Create ProtectedRoute component
3. Create useRole hook
4. Update login page with auto-redirect
5. Update router with protected routes
6. Handle token persistence
7. Frontend build passes (0 errors)

### Week 3: Testing & Verification
1. Test all 4 role login flows
2. Test role-based access control
3. Test logout and token persistence
4. Manual end-to-end testing
5. Security review
6. Fix any issues
7. Sign-off

---

## Before You Start

✅ Read: `LOGIN_ROLE_REDIRECT_FLOW.md` (full implementation guide)  
✅ Read: `PRAGYAN_ROLE_ARCHITECTURE.md` (role definitions)  
✅ Review: Phase 1 output (existing placement APIs)  
✅ Check: Prisma schema structure

---

## Key Files to Create/Modify

### Create (New)
```
backend/src/middleware/authorize.ts
frontend/src/services/authService.ts
frontend/src/components/ProtectedRoute.tsx
frontend/src/hooks/useRole.ts
```

### Modify
```
backend/prisma/schema.prisma
backend/src/routes/auth.ts (or equivalent)
frontend/src/pages/auth/login.tsx
frontend/src/App.tsx
```

---

## Why This Matters

**User Journey:**
```
Unauthenticated
    ↓
Navigate to site (any URL)
    ↓
Redirected to /login (no token)
    ↓
Enter credentials
    ↓
Backend validates, returns role in JWT
    ↓
Frontend stores token & role
    ↓
🎯 AUTO-REDIRECT TO CORRECT DASHBOARD
    ↓
Load role-specific page (sidebar, permissions, data)
    ↓
User sees their appropriate interface
```

**Why immediate role-based redirect is critical:**
1. **Prevents confusion:** User lands on correct page immediately
2. **Security:** Ensures access control from first moment
3. **UX:** No extra navigation steps
4. **Foundation:** Enables all future role-based features

---

## Phase 2 Completion Criteria

**Phase 2 is complete when:**
1. ✅ UserRole enum in Prisma
2. ✅ User.role field created
3. ✅ Login endpoint returns role in JWT
4. ✅ All 4 roles auto-redirect to correct dashboard
5. ✅ ProtectedRoute enforces access control
6. ✅ Logout clears all data
7. ✅ Token persists across refreshes
8. ✅ Both builds passing (0 errors)
9. ✅ All 4 role flows tested end-to-end
10. ✅ No breaking changes

---

## Phase 2 → Phase 3 Handoff

Once Phase 2 completes:
- ✅ Role system ready for fine-grained authorization
- ✅ JWT contains role for backend validation
- ✅ Frontend can conditionally render based on role
- ✅ Phase 3 can safely add Company/Recruiter models

Phase 3 will then:
1. Design Prisma models (Company, Recruiter, RecruitmentJob)
2. Add company-scoped APIs
3. Update authorization to include company ownership checks
4. Implement recruiter isolation

---

**Document:** PHASE_2_IMPLEMENTATION_GUIDE.md  
**Date:** July 14, 2026  
**Status:** Ready for Development  
**Next:** Assign Phase 2 owner and begin Week 1 tasks
