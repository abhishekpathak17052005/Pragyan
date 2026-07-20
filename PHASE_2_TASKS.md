# Phase 2: Auth & Roles - Task Breakdown

**Status:** Ready for Implementation  
**Duration:** 2-3 weeks  
**Owner:** [To be assigned]  
**Date:** July 14, 2026

---

## 📋 Overview

Phase 2 implements the 4-role authentication system with backend-enforced role determination and automatic role-based redirect on login.

**Core Flow:**
```
Login → Backend verifies → Role in JWT → Frontend auto-redirects → Correct dashboard
```

---

## Week 1: Database & Backend Auth

### Task 1.1: Update Prisma Schema

**File:** `backend/prisma/schema.prisma`

**Changes:**
1. Add UserRole enum
2. Add role field to User model  
3. Add companyId and collegeId fields to User
4. Update existing User model if needed

**Code:**
```prisma
enum UserRole {
  STUDENT
  RECRUITER
  PLACEMENT_OFFICER
  ADMIN
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  email     String   @unique
  password  String
  name      String
  
  role      UserRole @default(STUDENT)
  
  companyId String?  @db.ObjectId
  collegeId String?  @db.ObjectId
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Verification:**
```bash
cd backend
npx prisma validate
# Expected: Schema is valid
```

---

### Task 1.2: Run Prisma Migration

**Files:** `backend/prisma/migrations/`

**Steps:**
```bash
cd backend
npx prisma migrate dev --name add_user_roles
npx prisma generate
```

**Verification:**
- Migration folder created: `backend/prisma/migrations/add_user_roles/`
- Prisma client generated successfully
- No errors in migration

---

### Task 1.3: Update Login Endpoint

**File:** `backend/src/routes/auth.ts` (or equivalent)

**Current Status:** Verify existing login endpoint

**Changes needed:**
1. After successful password verification
2. Generate JWT with role in payload
3. Return user object with role in response

**Code:**
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT with role ✅
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,           // ✅ Role in JWT
        companyId: user.companyId,
        collegeId: user.collegeId
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // 4. Return token + user info ✅
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        collegeId: user.collegeId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

**Verification:**
- Endpoint accepts email + password
- Returns JWT with role in payload
- Returns user object with role
- Password verification works correctly

---

### Task 1.4: Create requireAuth Middleware

**File:** `backend/src/middleware/requireAuth.ts` (NEW)

**Code:**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        companyId?: string;
        collegeId?: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any;

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

---

### Task 1.5: Create requireRole Middleware

**File:** `backend/src/middleware/requireRole.ts` (NEW)

**Code:**
```typescript
import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
}
```

---

### Task 1.6: Register Middleware in App

**File:** `backend/src/app.ts`

**Changes:**
1. Import middlewares
2. Apply to appropriate routes

**Code:**
```typescript
import { requireAuth } from '@/middleware/requireAuth';
import { requireRole } from '@/middleware/requireRole';

// Example: Protect placement routes
app.use('/api/placement', requireAuth);
app.use(
  '/api/placement',
  requireRole('PLACEMENT_OFFICER', 'ADMIN')
);

// Example: Protect company routes
app.use('/api/company', requireAuth);
app.use(
  '/api/company',
  requireRole('RECRUITER', 'ADMIN')
);
```

---

### Task 1.7: Test Backend Auth with Postman

**Test Endpoint:** `POST /api/auth/login`

**Test 1: Valid Student Login**
```
Request:
{
  "email": "student@example.com",
  "password": "password123"
}

Expected Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "name": "John Student",
    "email": "student@example.com",
    "role": "STUDENT",
    "collegeId": "college_456"
  }
}
```

**Test 2: Decode JWT**
- Copy token from response
- Go to jwt.io
- Paste token
- Verify payload contains: id, email, role, collegeId, exp, iat

**Test 3: Invalid Credentials**
```
Request:
{
  "email": "student@example.com",
  "password": "wrong"
}

Expected: 401 Unauthorized
```

**Test 4: Invalid Email**
```
Request:
{
  "email": "nonexistent@example.com",
  "password": "password123"
}

Expected: 401 Unauthorized
```

---

### Task 1.8: Backend Build Verification

**Command:**
```bash
cd backend
npm run build
```

**Expected:**
- Exit code: 0
- 0 TypeScript errors
- 0 warnings
- Build time: ~5 seconds

---

## Week 2: Frontend Auth & Routes

### Task 2.1: Create AuthContext

**File:** `frontend/src/contexts/AuthContext.tsx` (NEW)

**Code:**
```typescript
import React, { createContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'RECRUITER' | 'PLACEMENT_OFFICER' | 'ADMIN';
  companyId?: string;
  collegeId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isStudent: boolean;
  isRecruiter: boolean;
  isPlacementOfficer: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store in state
    setToken(data.token);
    setUser(data.user);

    // Store in localStorage
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));

    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isStudent: user?.role === 'STUDENT',
    isRecruiter: user?.role === 'RECRUITER',
    isPlacementOfficer: user?.role === 'PLACEMENT_OFFICER',
    isAdmin: user?.role === 'ADMIN',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### Task 2.2: Wrap App with AuthProvider

**File:** `frontend/src/main.tsx`

**Changes:**
```typescript
import { AuthProvider } from '@/contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

---

### Task 2.3: Update Login Page

**File:** `frontend/src/pages/login.tsx` (or equivalent)

**Changes:**
1. Single login page (no role-specific pages)
2. Call auth context login
3. Auto-redirect based on role

**Code:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useState } from 'react';

const roleRedirects: Record<string, string> = {
  'ADMIN': '/admin/dashboard',
  'STUDENT': '/dashboard',
  'RECRUITER': '/company/dashboard',
  'PLACEMENT_OFFICER': '/placement/dashboard'
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
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

      // Auto-redirect based on role
      const redirectUrl = roleRedirects[user.role];
      if (redirectUrl) {
        setLocation(redirectUrl);
      } else {
        setError('Unknown role');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1>Pragyan Login</h1>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

---

### Task 2.4: Create ProtectedRoute Component

**File:** `frontend/src/components/ProtectedRoute.tsx` (NEW)

**Code:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'wouter';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: string;
}

export function ProtectedRoute({
  allowedRoles,
  children,
  fallback = '/login'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user!.role)) {
    return <Navigate to={fallback} />;
  }

  return <>{children}</>;
}
```

---

### Task 2.5: Create Role-Specific Route Guards

**Files:** (Create 4 new files)

**File 1:** `frontend/src/components/StudentRoute.tsx`
```typescript
import { ProtectedRoute } from './ProtectedRoute';

export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']} fallback="/dashboard">
      {children}
    </ProtectedRoute>
  );
}
```

**File 2:** `frontend/src/components/RecruiterRoute.tsx`
```typescript
import { ProtectedRoute } from './ProtectedRoute';

export function RecruiterRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['RECRUITER']} fallback="/company/dashboard">
      {children}
    </ProtectedRoute>
  );
}
```

**File 3:** `frontend/src/components/PlacementOfficerRoute.tsx`
```typescript
import { ProtectedRoute } from './ProtectedRoute';

export function PlacementOfficerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']} fallback="/placement/dashboard">
      {children}
    </ProtectedRoute>
  );
}
```

**File 4:** `frontend/src/components/AdminRoute.tsx`
```typescript
import { ProtectedRoute } from './ProtectedRoute';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']} fallback="/dashboard">
      {children}
    </ProtectedRoute>
  );
}
```

---

### Task 2.6: Update Router

**File:** `frontend/src/App.tsx`

**Changes:**
1. Import route guards
2. Wrap existing routes with appropriate guards
3. Add 404 fallback

**Code:**
```typescript
import { Router, Route } from 'wouter';
import { StudentRoute } from '@/components/StudentRoute';
import { RecruiterRoute } from '@/components/RecruiterRoute';
import { PlacementOfficerRoute } from '@/components/PlacementOfficerRoute';
import { AdminRoute } from '@/components/AdminRoute';

// Pages
import LoginPage from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import PlacementDashboard from '@/pages/placement/dashboard';
import CompanyDashboard from '@/pages/company/dashboard';
import AdminDashboard from '@/pages/admin/dashboard';

export default function App() {
  return (
    <Router>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />

      {/* Student routes */}
      <Route path="/dashboard">
        <StudentRoute>
          <Dashboard />
        </StudentRoute>
      </Route>

      {/* Placement Officer routes */}
      <Route path="/placement">
        <PlacementOfficerRoute>
          <PlacementDashboard />
        </PlacementOfficerRoute>
      </Route>
      <Route path="/placement/:page">
        <PlacementOfficerRoute>
          <PlacementDashboard />
        </PlacementOfficerRoute>
      </Route>

      {/* Recruiter routes */}
      <Route path="/company">
        <RecruiterRoute>
          <CompanyDashboard />
        </RecruiterRoute>
      </Route>
      <Route path="/company/:page">
        <RecruiterRoute>
          <CompanyDashboard />
        </RecruiterRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/:page">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>

      {/* Catch-all */}
      <Route path="/:rest*">
        <Navigate to="/login" />
      </Route>
    </Router>
  );
}
```

---

### Task 2.7: Create Dynamic Sidebar

**File:** `frontend/src/components/Sidebar.tsx` (NEW)

**Code:**
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'wouter';

export function Sidebar() {
  const { user, logout, isStudent, isRecruiter, isPlacementOfficer, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{user.name}</h2>
        <span className="role-badge">{user.role}</span>
      </div>

      <nav className="sidebar-nav">
        {isStudent && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/assessment">Assessment</Link>
            <Link href="/roadmap">Roadmap</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/applications">Applications</Link>
            <Link href="/profile">Profile</Link>
          </>
        )}

        {isRecruiter && (
          <>
            <Link href="/company/dashboard">Dashboard</Link>
            <Link href="/company/jobs">Jobs</Link>
            <Link href="/company/applications">Applications</Link>
            <Link href="/company/drives">Hiring Drives</Link>
            <Link href="/company/analytics">Analytics</Link>
            <Link href="/company/profile">Company Profile</Link>
          </>
        )}

        {isPlacementOfficer && (
          <>
            <Link href="/placement/dashboard">Dashboard</Link>
            <Link href="/placement/students">Students</Link>
            <Link href="/placement/companies">Companies</Link>
            <Link href="/placement/recruitment">Recruitment</Link>
            <Link href="/placement/drives">Campus Drives</Link>
            <Link href="/placement/reports">Reports</Link>
            <Link href="/placement/analytics">Analytics</Link>
          </>
        )}

        {isAdmin && (
          <>
            <Link href="/admin/dashboard">Dashboard</Link>
            <Link href="/admin/users">Users</Link>
            <Link href="/admin/roadmaps">Roadmaps</Link>
            <Link href="/admin/recruitment">Recruitment</Link>
            <Link href="/admin/placement">Placement</Link>
            <Link href="/admin/analytics">Analytics</Link>
            <Link href="/admin/settings">Settings</Link>
          </>
        )}
      </nav>

      <footer className="sidebar-footer">
        <Link href="/profile/settings">Settings</Link>
        <button onClick={handleLogout}>Logout</button>
      </footer>
    </aside>
  );
}
```

---

### Task 2.8: Update Dashboards to Include Sidebar

**Files to update:**
- `frontend/src/pages/dashboard.tsx`
- `frontend/src/pages/placement/dashboard.tsx`
- `frontend/src/pages/company/dashboard.tsx`
- `frontend/src/pages/admin/dashboard.tsx`

**Example Update:**
```typescript
import { Sidebar } from '@/components/Sidebar';

export default function Dashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Existing dashboard content */}
      </main>
    </div>
  );
}
```

---

### Task 2.9: Frontend Build Verification

**Command:**
```bash
cd frontend
npm run build
```

**Expected:**
- Exit code: 0
- 0 errors
- Modules transformed successfully
- Build time: ~13 seconds

---

## Week 3: Testing & Verification

### Task 3.1: Test Student Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter student email + password
3. Verify response contains `role: "STUDENT"`
4. Verify JWT contains role
5. Verify auto-redirect to `/dashboard`
6. Verify student sidebar renders
7. Verify student can access `/dashboard` pages
8. Verify student cannot access `/company`, `/placement`, `/admin` routes

**Result:** ✅ Pass/❌ Fail

---

### Task 3.2: Test Recruiter Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter recruiter email + password
3. Verify response contains `role: "RECRUITER"`
4. Verify JWT contains role + companyId
5. Verify auto-redirect to `/company/dashboard`
6. Verify recruiter sidebar renders
7. Verify recruiter can access `/company` pages
8. Verify recruiter cannot access `/dashboard`, `/placement`, `/admin` routes

**Result:** ✅ Pass/❌ Fail

---

### Task 3.3: Test Placement Officer Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter placement officer email + password
3. Verify response contains `role: "PLACEMENT_OFFICER"`
4. Verify JWT contains role + collegeId
5. Verify auto-redirect to `/placement/dashboard`
6. Verify placement sidebar renders
7. Verify placement officer can access `/placement` pages
8. Verify placement officer cannot access `/dashboard`, `/company`, `/admin` routes

**Result:** ✅ Pass/❌ Fail

---

### Task 3.4: Test Admin Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter admin email + password
3. Verify response contains `role: "ADMIN"`
4. Verify JWT contains role
5. Verify auto-redirect to `/admin/dashboard`
6. Verify admin sidebar renders
7. Verify admin can access `/admin` pages
8. Verify admin can access all routes (eventually)

**Result:** ✅ Pass/❌ Fail

---

### Task 3.5: Test Role-Based Access Control

**Steps:**
1. Login as Student
2. Try to manually navigate to `/company/dashboard` → should redirect to `/dashboard`
3. Try to navigate to `/placement/dashboard` → should redirect to `/dashboard`
4. Try to navigate to `/admin/dashboard` → should redirect to `/dashboard`
5. Repeat for other roles

**Result:** ✅ Pass/❌ Fail

---

### Task 3.6: Test Logout

**Steps:**
1. Login as any user
2. Click logout button
3. Verify redirects to `/login`
4. Verify localStorage cleared (check DevTools → Application)
5. Try to access protected route → redirects to `/login`

**Result:** ✅ Pass/❌ Fail

---

### Task 3.7: Test Token Persistence

**Steps:**
1. Login as student
2. Close browser tab
3. Reopen and navigate to `/dashboard`
4. Verify dashboard loads without re-login
5. Wait for token to expire (or manually clear localStorage)
6. Refresh page → should redirect to `/login`

**Result:** ✅ Pass/❌ Fail

---

### Task 3.8: Test Invalid JWT

**Steps:**
1. Login as student
2. Manually modify JWT in localStorage (add extra character)
3. Refresh page → should redirect to `/login`
4. Backend should reject invalid token on API calls

**Result:** ✅ Pass/❌ Fail

---

### Task 3.9: Test Backend Authorization

**Steps:**
1. Login as Recruiter (get JWT)
2. Try to call `/api/placement/students` with recruiter JWT
3. Verify 403 Forbidden response

**Steps:**
1. Login as Placement Officer (get JWT)
2. Call `/api/placement/students` with placement officer JWT
3. Verify 200 OK response

**Result:** ✅ Pass/❌ Fail

---

### Task 3.10: Build Final Verification

**Command:**
```bash
cd backend && npm run build
cd frontend && npm run build
cd backend && npx prisma validate
```

**Expected:**
- All builds: Exit code 0
- No TypeScript errors
- No console warnings
- Ready for deployment

**Result:** ✅ Pass/❌ Fail

---

## Checklist Summary

**Week 1 Tasks:**
- [ ] 1.1 Update Prisma schema
- [ ] 1.2 Run migration
- [ ] 1.3 Update login endpoint
- [ ] 1.4 Create requireAuth middleware
- [ ] 1.5 Create requireRole middleware
- [ ] 1.6 Register middleware in app
- [ ] 1.7 Test with Postman
- [ ] 1.8 Backend build verification

**Week 2 Tasks:**
- [ ] 2.1 Create AuthContext
- [ ] 2.2 Wrap app with AuthProvider
- [ ] 2.3 Update login page
- [ ] 2.4 Create ProtectedRoute
- [ ] 2.5 Create role-specific route guards
- [ ] 2.6 Update router
- [ ] 2.7 Create sidebar component
- [ ] 2.8 Update dashboards
- [ ] 2.9 Frontend build verification

**Week 3 Tasks:**
- [ ] 3.1 Test student login
- [ ] 3.2 Test recruiter login
- [ ] 3.3 Test placement officer login
- [ ] 3.4 Test admin login
- [ ] 3.5 Test role-based access control
- [ ] 3.6 Test logout
- [ ] 3.7 Test token persistence
- [ ] 3.8 Test invalid JWT
- [ ] 3.9 Test backend authorization
- [ ] 3.10 Final build verification

**Total: 26 tasks**

---

**Document:** PHASE_2_TASKS.md  
**Date:** July 14, 2026  
**Status:** Ready for Implementation  
**Next:** Assign owner and begin Week 1
