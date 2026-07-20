# 🔐 Login & Role-Based Redirect Flow

**Purpose:** Every user who logs in is immediately routed to their correct dashboard based on role.

**Status:** To be implemented in Phase 2

---

## The Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER VISITS SITE                     │
│                  (any URL or /login)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    ALREADY LOGGED IN?        │
        │   (Check localStorage JWT)   │
        └──────────────┬───────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
      YES │                         │ NO
          │                         │
          ▼                         ▼
    ┌──────────────┐      ┌──────────────────┐
    │ CHECK ROLE   │      │  SHOW LOGIN PAGE │
    │  IN JWT      │      └────────┬─────────┘
    └──────┬───────┘               │
           │                       │
           │                  USER ENTERS
           │              (email + password)
           │                       │
           │                       ▼
           │            ┌──────────────────────┐
           │            │  AUTHENTICATE WITH  │
           │            │    BACKEND API      │
           │            └────────┬─────────────┘
           │                     │
           │            ┌────────▼──────────┐
           │            │  RECEIVE JWT      │
           │            │  (includes role)  │
           │            └────────┬──────────┘
           │                     │
           │                     ▼
           │            ┌──────────────────────┐
           │            │  STORE JWT IN        │
           │            │  localStorage        │
           │            └────────┬─────────────┘
           │                     │
           └─────────────────┬───┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │     EXTRACT ROLE FROM JWT          │
        └──────────────┬─────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
    ┌────────┐   ┌────────┐   ┌─────────────┐   ┌──────────┐
    │ ADMIN  │   │STUDENT │   │PLACEMENT_   │   │RECRUITER │
    │        │   │        │   │OFFICER      │   │          │
    └────┬───┘   └────┬───┘   └──────┬──────┘   └────┬─────┘
         │            │              │               │
         ▼            ▼              ▼               ▼
    /admin/      /dashboard    /placement        /company/
    dashboard    (learning)     dashboard        dashboard
         │            │              │               │
         └────────────┼──────────────┴───────────────┘
                      │
                      ▼
        ┌─────────────────────────────────┐
        │   LOAD ROLE-SPECIFIC PAGE       │
        │   (sidebar, permissions, data)  │
        └─────────────────────────────────┘
```

---

## Implementation

### 1. Backend: Auth Endpoint

```typescript
// backend/src/routes/auth.ts

POST /api/auth/login
Input:
{
  email: string,
  password: string
}

Output:
{
  accessToken: string,  // JWT with role
  user: {
    id: string,
    email: string,
    role: "ADMIN" | "STUDENT" | "PLACEMENT_OFFICER" | "RECRUITER",
    collegeId?: string,  // For STUDENT, PLACEMENT_OFFICER
    companyId?: string   // For RECRUITER
  }
}

JWT Payload (decoded):
{
  sub: "user_id_123",
  email: "john@example.com",
  role: "PLACEMENT_OFFICER",
  collegeId: "college_456",
  iat: 1234567890,
  exp: 1234671490
}
```

### 2. Frontend: Store JWT

```typescript
// frontend/src/services/authService.ts

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  
  // Store JWT
  localStorage.setItem('auth_token', response.accessToken);
  localStorage.setItem('user_role', response.user.role);
  localStorage.setItem('user_id', response.user.id);
  
  // Store college/company info if needed
  if (response.user.collegeId) {
    localStorage.setItem('college_id', response.user.collegeId);
  }
  if (response.user.companyId) {
    localStorage.setItem('company_id', response.user.companyId);
  }
  
  return response.user;
}

export function getRole(): string | null {
  return localStorage.getItem('user_role');
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
  localStorage.removeItem('college_id');
  localStorage.removeItem('company_id');
}
```

### 3. Frontend: Protected Route Component

```typescript
// frontend/src/components/ProtectedRoute.tsx

import { Navigate } from 'wouter';
import { getRole } from '@/services/authService';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: string; // redirect if not allowed
}

export function ProtectedRoute({
  allowedRoles,
  children,
  fallback = '/login'
}: ProtectedRouteProps) {
  const role = getRole();
  
  if (!role) {
    // Not logged in
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(role)) {
    // Logged in but wrong role
    return <Navigate to={fallback} />;
  }
  
  return <>{children}</>;
}
```

### 4. Frontend: Role-Based Router

```typescript
// frontend/src/App.tsx

import { Router, Route } from 'wouter';
import { useEffect, useState } from 'react';
import { getRole } from '@/services/authService';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import LoginPage from '@/pages/auth/login';
import AdminDashboard from '@/pages/admin/dashboard';
import StudentDashboard from '@/pages/dashboard';
import PlacementDashboard from '@/pages/placement/dashboard';
import CompanyDashboard from '@/pages/company/dashboard';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Verify token on app start
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Optionally validate token with backend
      // This prevents using stale/invalid tokens
    }
    setIsInitialized(true);
  }, []);
  
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  return (
    <Router>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      
      {/* Admin routes */}
      <Route path="/admin/*">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Student routes */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Placement Officer routes */}
      <Route path="/placement/*">
        <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']}>
          <PlacementDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Recruiter routes */}
      <Route path="/company/*">
        <ProtectedRoute allowedRoles={['RECRUITER']}>
          <CompanyDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* 404 */}
      <Route path="/:rest*">
        <div>Page not found</div>
      </Route>
    </Router>
  );
}
```

### 5. Frontend: Auto-Redirect on Login

```typescript
// frontend/src/pages/auth/login.tsx

import { useState } from 'react';
import { useLocation } from 'wouter';
import { login } from '@/services/authService';

const roleRedirects: Record<string, string> = {
  'ADMIN': '/admin/dashboard',
  'STUDENT': '/dashboard',
  'PLACEMENT_OFFICER': '/placement/dashboard',
  'RECRUITER': '/company/dashboard'
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await login(email, password);
      
      // Redirect based on role
      const redirectUrl = roleRedirects[user.role];
      if (redirectUrl) {
        setLocation(redirectUrl);
      } else {
        setError('Unknown role');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="login-page">
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
```

### 6. Frontend: Check Role at Startup

```typescript
// frontend/src/hooks/useRole.ts

import { getRole } from '@/services/authService';

export function useRole() {
  const role = getRole();
  
  return {
    role,
    isAdmin: role === 'ADMIN',
    isStudent: role === 'STUDENT',
    isPlacementOfficer: role === 'PLACEMENT_OFFICER',
    isRecruiter: role === 'RECRUITER'
  };
}

// Usage in components
export function SomeComponent() {
  const { role, isPlacementOfficer } = useRole();
  
  if (isPlacementOfficer) {
    return <PlacementOfficerView />;
  }
  
  return <DefaultView />;
}
```

### 7. Backend: Authorization Middleware

```typescript
// backend/src/middleware/authorize.ts

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        collegeId?: string;
        companyId?: string;
      };
    }
  }
}

export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
router.get(
  '/api/placement/students',
  authenticate,
  authorize([UserRole.PLACEMENT_OFFICER, UserRole.ADMIN]),
  getStudents
);

router.get(
  '/api/company/jobs',
  authenticate,
  authorize([UserRole.RECRUITER]),
  getJobs
);

router.get(
  '/api/admin/users',
  authenticate,
  authorize([UserRole.ADMIN]),
  getUsers
);
```

---

## What Happens on Login

### Scenario 1: Student Logs In
```
1. User navigates to site (any URL)
2. Checks localStorage for token → none found
3. Redirects to /login
4. Enters credentials
5. Backend validates → returns JWT with role: "STUDENT"
6. Frontend stores JWT
7. Extracts role: "STUDENT"
8. Redirects to /dashboard ← Student learning page
9. Sidebar shows: Dashboard, Assessment, Roadmap, Jobs, Applications, etc.
```

### Scenario 2: T&P Officer Logs In
```
1. User navigates to site
2. Checks localStorage for token → none found
3. Redirects to /login
4. Enters credentials
5. Backend validates → returns JWT with role: "PLACEMENT_OFFICER", collegeId: "college_123"
6. Frontend stores JWT + collegeId
7. Extracts role: "PLACEMENT_OFFICER"
8. Redirects to /placement/dashboard ← T&P dashboard
9. Sidebar shows: Dashboard, Students, Companies, Campus Drives, Applications, Analytics, etc.
10. All queries filtered by collegeId automatically
```

### Scenario 3: Recruiter Logs In
```
1. User navigates to site
2. Checks localStorage for token → none found
3. Redirects to /login
4. Enters credentials
5. Backend validates → returns JWT with role: "RECRUITER", companyId: "company_456"
6. Frontend stores JWT + companyId
7. Extracts role: "RECRUITER"
8. Redirects to /company/dashboard ← Company dashboard
9. Sidebar shows: Dashboard, Jobs, Applications, Interviews, Offers, Analytics, etc.
10. All queries filtered by companyId automatically
```

### Scenario 4: Admin Logs In
```
1. User navigates to site
2. Checks localStorage for token → none found
3. Redirects to /login
4. Enters credentials
5. Backend validates → returns JWT with role: "ADMIN"
6. Frontend stores JWT
7. Extracts role: "ADMIN"
8. Redirects to /admin/dashboard ← Admin dashboard
9. Sidebar shows: Dashboard, Users, Colleges, Companies, Analytics, Settings, etc.
10. Can see all data across all colleges
```

---

## Security Considerations

### ✅ DO
- Store JWT securely (httpOnly cookie preferred, localStorage acceptable for SPA)
- Validate role on backend (don't trust frontend claims)
- Include role in JWT so it travels with every request
- Expire tokens (30 min - 1 hour typical)
- Refresh tokens securely

### ❌ DON'T
- Trust role from localStorage alone
- Send JWT in URL parameters
- Store sensitive data in JWT (it's encoded, not encrypted)
- Forget to validate on backend
- Have no token expiration

---

## Implementation Checklist for Phase 2

- [ ] Add 4 roles to Prisma enum
- [ ] Create User.role field
- [ ] Update login endpoint to include role in JWT
- [ ] Create `getRole()` function
- [ ] Create `ProtectedRoute` component
- [ ] Update router with role-based routes
- [ ] Create role redirect map
- [ ] Create authorize middleware
- [ ] Test all 4 role login flows
- [ ] Verify auto-redirect works
- [ ] Verify localStorage persistence
- [ ] Test logout clears localStorage
- [ ] Test accessing wrong route redirects
- [ ] Backend builds clean
- [ ] Frontend builds clean

---

**Document:** LOGIN_ROLE_REDIRECT_FLOW.md  
**Date:** July 14, 2026  
**Status:** Phase 2 Implementation Guide  
**Next:** Execute this flow in Phase 2 (Auth & Roles)
