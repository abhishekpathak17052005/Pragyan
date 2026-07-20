# 🔐 Phase 2: Backend-First Authentication Architecture

**Date:** July 14, 2026  
**Duration:** 2-3 weeks  
**Principle:** Backend is the source of truth. Frontend never decides role.  
**Status:** Architecture Locked

---

## Core Principle

> **Never ask the frontend what role the user is. Always trust the JWT.**

The backend determines the user's role. The frontend trusts it. This ensures security and prevents role spoofing.

---

## Architecture Diagram

```
                    Login (Single Page)
                           │
              Email + Password / OAuth
                           │
                  Verify Credentials
                  (Backend Only)
                           │
                  Load User From DB
                  (Backend Only)
                           │
                    Read user.role
                  (Backend Only)
                           │
            Generate JWT with role
                  (Backend Only)
                           │
        Return: { token, user: { id, name, email, role } }
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
      STUDENT          RECRUITER    PLACEMENT_OFFICER
         │                 │                 │
         ▼                 ▼                 ▼
    /dashboard         /company          /placement
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                        ADMIN
                           │
                           ▼
                   /admin/dashboard
```

---

## Step 1: Prisma Schema

### Add UserRole Enum

```prisma
enum UserRole {
  STUDENT
  RECRUITER
  PLACEMENT_OFFICER
  ADMIN  // Can only be created manually by system owner
}
```

### Add AccountStatus Enum

```prisma
enum AccountStatus {
  PENDING      // Awaiting admin approval (Recruiter, T&P Officer)
  APPROVED     // Can login (Student approved automatically, others after admin review)
  REJECTED     // Registration denied
  SUSPENDED    // Account disabled
}
```

### Update User Model

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  fullName  String
  email     String   @unique
  password  String   // hashed
  
  role      UserRole        @default(STUDENT)
  status    AccountStatus   @default(PENDING)
  
  companyId String?  @db.ObjectId  // For RECRUITER
  collegeId String?  @db.ObjectId  // For STUDENT, PLACEMENT_OFFICER
  
  // Additional fields per role (optional for Phase 2)
  designation String?  // For RECRUITER, PLACEMENT_OFFICER
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations (to be added in Phase 3+)
  // company   Company?  @relation(fields: [companyId], references: [id])
  // college   College?  @relation(fields: [collegeId], references: [id])
}
```

### Migration

```bash
npx prisma migrate dev --name add_user_roles_and_status
npx prisma generate
```

### Key Security Rules

⚠️ **Important:**
- Admin role CANNOT be self-registered (only manually created by system owner)
- Recruiter and T&P Officer accounts start as PENDING
- Student accounts are APPROVED automatically
- Login endpoint checks both role AND status

---

## Step 2: Registration Flow (Backend-First Security)

### Registration Request Validation

#### For STUDENT

```json
{
  "fullName": "Abhishek Kumar",
  "email": "abhishek@student.edu",
  "password": "SecurePass123!",
  "role": "STUDENT",
  "collegeId": "college_123"
}
```

**Backend processing:**
- ✅ Account created with status: APPROVED (auto-approved)
- ✅ Can login immediately
- Password hashed with bcrypt

#### For RECRUITER

```json
{
  "fullName": "Rahul Sharma",
  "email": "rahul@tcs.com",
  "password": "SecurePass123!",
  "role": "RECRUITER",
  "companyId": "company_456",
  "designation": "HR Manager"
}
```

**Backend processing:**
- ✅ Account created with status: PENDING
- ❌ Cannot login until admin approves
- Email sent to admin for review

#### For PLACEMENT_OFFICER

```json
{
  "fullName": "Mr. Sharma",
  "email": "tpo@college.edu",
  "password": "SecurePass123!",
  "role": "PLACEMENT_OFFICER",
  "collegeId": "college_789",
  "designation": "Training & Placement Officer"
}
```

**Backend processing:**
- ✅ Account created with status: PENDING
- ❌ Cannot login until admin approves
- Email sent to admin for review

#### ⚠️ Reject ADMIN Registration

```typescript
if (body.role === "ADMIN") {
  throw new Error("Admin registration is not allowed. Admin accounts can only be created by the system owner.");
}
```

**Any request with role: "ADMIN" is rejected immediately.**

### Account Status Logic

```typescript
enum AccountStatus {
  PENDING      // Awaiting admin approval (Recruiter, T&P Officer only)
  APPROVED     // Can login
  REJECTED     // Registration denied
  SUSPENDED    // Account disabled by admin
}
```

**Registration Status Rules:**
```
STUDENT
  └─→ status: APPROVED (auto-approved, can login immediately)

RECRUITER
  └─→ status: PENDING (requires admin approval)

PLACEMENT_OFFICER
  └─→ status: PENDING (requires admin approval)

ADMIN
  └─→ REJECTED (cannot self-register)
```

---

## Registration Endpoint

```typescript
// backend/src/routes/auth.ts

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, collegeId, companyId, designation } = req.body;

    // 1. Validate role - REJECT ADMIN
    if (role === 'ADMIN') {
      return res.status(403).json({
        error: 'Admin registration is not allowed.',
        message: 'Admin accounts can only be created by the system owner.'
      });
    }

    // 2. Validate role is one of allowed values
    const allowedRoles = ['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // 3. Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 4. Validate required fields per role
    if (role === 'STUDENT' && !collegeId) {
      return res.status(400).json({ error: 'collegeId required for students' });
    }
    if (role === 'RECRUITER' && !companyId) {
      return res.status(400).json({ error: 'companyId required for recruiters' });
    }
    if (role === 'PLACEMENT_OFFICER' && !collegeId) {
      return res.status(400).json({ error: 'collegeId required for placement officers' });
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Determine initial status
    let status = 'PENDING'; // Default for recruiter and T&P officer
    if (role === 'STUDENT') {
      status = 'APPROVED'; // Students auto-approved
    }

    // 7. Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        status,
        collegeId: role !== 'RECRUITER' ? collegeId : null,
        companyId: role === 'RECRUITER' ? companyId : null,
        designation
      }
    });

    // 8. If pending, notify admin
    if (status === 'PENDING') {
      // TODO: Send email to admin for approval
      // Email template: "New {role} registration waiting for approval: {email}"
    }

    // 9. Return user data (without password)
    return res.status(201).json({
      message: status === 'APPROVED' 
        ? 'Account created successfully. You can now login.'
        : 'Account created. Waiting for admin approval.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

---

## Step 2: Login Endpoint (Updated)

### Now also checks AccountStatus

```typescript
// backend/src/routes/auth.ts

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

    // 3. CHECK ACCOUNT STATUS ✅ NEW
    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Account pending approval',
        message: 'Your account is awaiting admin approval. Check your email for updates.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Account rejected',
        message: 'Your registration was not approved.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Contact support.'
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        collegeId: user.collegeId
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // 5. Return token + user info
    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        companyId: user.companyId,
        collegeId: user.collegeId
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

### Login Status Responses

**Student Login (APPROVED)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "fullName": "Abhishek Kumar",
    "email": "abhishek@student.edu",
    "role": "STUDENT",
    "status": "APPROVED",
    "collegeId": "college_123"
  }
}
// → Auto-redirect to /dashboard
```

**Recruiter Login (PENDING)**
```json
{
  "error": "Account pending approval",
  "message": "Your account is awaiting admin approval. Check your email for updates."
}
// Status: 403 Forbidden
// → Show message, prevent login
```

**T&P Officer Login (PENDING)**
```json
{
  "error": "Account pending approval",
  "message": "Your account is awaiting admin approval. Check your email for updates."
}
// Status: 403 Forbidden
// → Show message, prevent login
```

### JWT Payload (What gets signed)

```json
{
  "sub": "user_id_123",
  "id": "user_id_123",
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": "RECRUITER",
  "companyId": "company_456",
  "iat": 1689000000,
  "exp": 1689003600
}
```

**Key Points:**
- ✅ Role is encoded in JWT
- ✅ Cannot be modified on frontend (cryptographically signed)
- ✅ Always valid/fresh (expires after 1 hour)
- ✅ Backend verifies on every request
- ⚠️ Status NOT in JWT (checked from database on login)

---

## Step 3: Login Response

### Before (Unsafe)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### After (Correct - with Status Check)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id_123",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "RECRUITER",
    "status": "APPROVED",
    "companyId": "company_456"
  }
}
```

**OR if status is PENDING:**
```json
{
  "error": "Account pending approval",
  "message": "Your account is awaiting admin approval. Check your email for updates.",
  "status": 403
}
```

**Backend Code Example:**

```typescript
// backend/src/routes/auth.ts

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Verify credentials
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // ✅ CHECK ACCOUNT STATUS
  if (user.status === 'PENDING') {
    return res.status(403).json({
      error: 'Account pending approval',
      message: 'Your account is awaiting admin approval. Check your email for updates.'
    });
  }
  
  if (user.status === 'REJECTED') {
    return res.status(403).json({
      error: 'Account rejected',
      message: 'Your registration was not approved.'
    });
  }
  
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({
      error: 'Account suspended',
      message: 'Your account has been suspended. Contact support.'
    });
  }
  
  // Generate JWT (role is in payload)
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      collegeId: user.collegeId
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Return user info + token (with status)
  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
      collegeId: user.collegeId
    }
  });
});
```

---

## Step 4: Frontend Auth Context

### Create AuthContext

```typescript
// frontend/src/contexts/AuthContext.tsx

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isStudent: boolean;
  isRecruiter: boolean;
  isPlacementOfficer: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    // Store in state AND localStorage
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
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
    isAdmin: user?.role === 'ADMIN'
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

## Step 5: Automatic Redirect After Login

### Single Login Page

```typescript
// frontend/src/pages/login.tsx

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
      // Login calls backend, gets user with role
      await login(email, password);
      
      // Get user from context after login
      const context = localStorage.getItem('auth_user');
      const user = JSON.parse(context!);
      
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
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h1>Pragyan Login</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
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

**Key Point:** The redirect happens based on the role returned by the backend. The frontend never decides.

---

## Step 6: Route Guards

### Create Route Guard Components

```typescript
// frontend/src/components/ProtectedRoute.tsx

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
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user!.role)) {
    return <Navigate to={fallback} />;
  }
  
  return <>{children}</>;
}

// Usage:
// <ProtectedRoute allowedRoles={['RECRUITER']}>
//   <CompanyDashboard />
// </ProtectedRoute>
```

### Create Specific Route Guards

```typescript
// frontend/src/components/StudentRoute.tsx
export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']} fallback="/dashboard">
      {children}
    </ProtectedRoute>
  );
}

// frontend/src/components/RecruiterRoute.tsx
export function RecruiterRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['RECRUITER']} fallback="/company/dashboard">
      {children}
    </ProtectedRoute>
  );
}

// frontend/src/components/PlacementOfficerRoute.tsx
export function PlacementOfficerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PLACEMENT_OFFICER']} fallback="/placement/dashboard">
      {children}
    </ProtectedRoute>
  );
}

// frontend/src/components/AdminRoute.tsx
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']} fallback="/dashboard">
      {children}
    </ProtectedRoute>
  );
}
```

---

## Step 7: Dynamic Sidebars

### Create Role-Based Sidebar

```typescript
// frontend/src/components/Sidebar.tsx

import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';

export function Sidebar() {
  const { user, isStudent, isRecruiter, isPlacementOfficer, isAdmin } = useAuth();
  
  if (!user) return null;
  
  return (
    <aside className="sidebar">
      <h2>{user.name}</h2>
      <p className="role-badge">{user.role}</p>
      
      {isStudent && (
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/assessment">Assessment</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/applications">My Applications</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      )}
      
      {isRecruiter && (
        <nav>
          <Link href="/company/dashboard">Dashboard</Link>
          <Link href="/company/jobs">Jobs</Link>
          <Link href="/company/applications">Applications</Link>
          <Link href="/company/hiring-drives">Hiring Drives</Link>
          <Link href="/company/analytics">Analytics</Link>
          <Link href="/company/profile">Company Profile</Link>
        </nav>
      )}
      
      {isPlacementOfficer && (
        <nav>
          <Link href="/placement/dashboard">Dashboard</Link>
          <Link href="/placement/students">Students</Link>
          <Link href="/placement/companies">Companies</Link>
          <Link href="/placement/recruitment">Recruitment</Link>
          <Link href="/placement/campus-drives">Campus Drives</Link>
          <Link href="/placement/reports">Reports</Link>
          <Link href="/placement/analytics">Analytics</Link>
        </nav>
      )}
      
      {isAdmin && (
        <nav>
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/roadmaps">Roadmaps</Link>
          <Link href="/admin/recruitment">Recruitment</Link>
          <Link href="/admin/placement">Placement</Link>
          <Link href="/admin/analytics">Analytics</Link>
          <Link href="/admin/settings">Settings</Link>
        </nav>
      )}
      
      <footer>
        <Link href="/profile/settings">Settings</Link>
        <button onClick={() => logout()}>Logout</button>
      </footer>
    </aside>
  );
}
```

---

## Step 8: Backend Authorization Middleware

### Require Authentication

```typescript
// backend/src/middleware/requireAuth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

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
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Require Specific Role

```typescript
// backend/src/middleware/requireRole.ts

import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### Usage in Routes

```typescript
// backend/src/routes/recruiter.ts

import { requireAuth } from '@/middleware/requireAuth';
import { requireRole } from '@/middleware/requireRole';

router.get(
  '/company/jobs',
  requireAuth,
  requireRole('RECRUITER'),
  controller.getJobs
);

router.post(
  '/company/jobs',
  requireAuth,
  requireRole('RECRUITER'),
  controller.createJob
);
```

### Admin-Only Routes

```typescript
router.get(
  '/admin/users',
  requireAuth,
  requireRole('ADMIN'),
  controller.getUsers
);

router.post(
  '/admin/settings',
  requireAuth,
  requireRole('ADMIN'),
  controller.updateSettings
);
```

---

## Step 9: Database Relationships

### Phase 2 (Current)
```
User
  ├── id
  ├── email
  ├── role
  ├── companyId (nullable)
  └── collegeId (nullable)
```

### Phase 3 (Future)
```
User (RECRUITER)
  │
  └── Company
      ├── name
      ├── industry
      ├── jobs[]
      └── hirings[]

User (PLACEMENT_OFFICER)
  │
  └── College
      ├── name
      ├── students[]
      └── drives[]

User (ADMIN)
  │
  └── All data (no restrictions)
```

**Benefits:**
- Placement Officer can only see students from their college
- Recruiter can only see jobs from their company
- Admin can see everything
- Student can only see their own data

---

## Step 10: Implementation Checklist

### Database (Week 1)
- [ ] Add `UserRole` enum to Prisma
- [ ] Add `role` field to User model
- [ ] Add `companyId` and `collegeId` to User
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Verify Prisma client generated correctly

### Backend Auth (Week 1)
- [ ] Create/update login endpoint
- [ ] Include role in JWT payload
- [ ] Return user info in login response
- [ ] Create `requireAuth` middleware
- [ ] Create `requireRole` middleware
- [ ] Test login with Postman
- [ ] Verify JWT contains role
- [ ] Backend build passes (0 errors)

### Frontend Auth Context (Week 2)
- [ ] Create `AuthContext` with `useAuth` hook
- [ ] Implement `login` function
- [ ] Implement `logout` function
- [ ] Add role check properties (isStudent, isRecruiter, etc.)
- [ ] Store token and user in localStorage
- [ ] Restore auth state on app load
- [ ] Frontend builds without errors

### Frontend Routes (Week 2)
- [ ] Create single `/login` page (no role-specific login pages)
- [ ] Implement automatic redirect after login
- [ ] Create `ProtectedRoute` component
- [ ] Create role-specific route guards
- [ ] Update router with protected routes
- [ ] Verify all routes are protected

### Frontend UI (Week 2)
- [ ] Create dynamic `Sidebar` component
- [ ] Render different nav per role
- [ ] Create role-specific dashboard layouts
- [ ] Add logout button
- [ ] Test sidebar renders correctly per role

### Testing (Week 3)
- [ ] Test Student login flow → redirects to `/dashboard`
- [ ] Test Recruiter login flow → redirects to `/company/dashboard`
- [ ] Test Placement Officer login flow → redirects to `/placement/dashboard`
- [ ] Test Admin login flow → redirects to `/admin/dashboard`
- [ ] Test accessing wrong role's route → redirects to default
- [ ] Test logout clears all data
- [ ] Test token persistence across refresh
- [ ] Test backend enforces role on API calls
- [ ] Test invalid JWT is rejected
- [ ] Test expired JWT is rejected

### Build & Deploy (Week 3)
- [ ] Backend build: 0 errors
- [ ] Frontend build: 0 errors
- [ ] All tests passing
- [ ] No console warnings
- [ ] Ready for Phase 3

---

## Key Principles (Don't Forget)

✅ **Backend is source of truth** - Role is determined by backend, not frontend  
✅ **JWT contains role** - Role cannot be tampered with on frontend  
✅ **Single login page** - No separate admin/recruiter/student login pages  
✅ **Automatic redirect** - User never chooses where to go  
✅ **Frontend trust backend** - Frontend trusts JWT and renders accordingly  
✅ **Backend verifies always** - Every protected route checks role on backend  
✅ **No role spoofing possible** - Can't fake role in JWT (cryptographically signed)  

---

## Security Checklist

- [ ] JWT is signed with secret key
- [ ] JWT is verified on backend before use
- [ ] Token is stored securely (localStorage for SPA, httpOnly cookie for SSR)
- [ ] Token expiration enforced (1 hour typical)
- [ ] Backend always verifies role, never trusts frontend
- [ ] Password hashed with bcrypt (or similar)
- [ ] No role information logged in plain text
- [ ] CORS configured correctly
- [ ] HTTPS enforced in production
- [ ] Rate limiting on login endpoint

---

## Files to Create/Modify

### Create (New)
```
backend/src/middleware/requireAuth.ts
backend/src/middleware/requireRole.ts
frontend/src/contexts/AuthContext.tsx
frontend/src/components/ProtectedRoute.tsx
frontend/src/components/StudentRoute.tsx
frontend/src/components/RecruiterRoute.tsx
frontend/src/components/PlacementOfficerRoute.tsx
frontend/src/components/AdminRoute.tsx
frontend/src/components/Sidebar.tsx
```

### Modify
```
backend/prisma/schema.prisma
backend/src/routes/auth.ts (or equivalent)
backend/src/app.ts
frontend/src/App.tsx
frontend/src/pages/login.tsx
frontend/src/main.tsx
```

---

## Why This Architecture

**Security:**
- Role determined by backend (can't be faked)
- JWT is cryptographically signed
- Every API call verified on backend

**UX:**
- Single login page for all users
- Automatic redirect to correct dashboard
- No extra steps or confusion

**Maintainability:**
- Clear separation of concerns
- Easy to add new roles
- Backend and frontend changes isolated
- Role logic in one place (AuthContext)

**Scalability:**
- Works with multi-college/multi-company setup
- Easy to add tenant isolation later
- Audit trails straightforward to implement

---

**Document:** PHASE_2_AUTH_ARCHITECTURE.md  
**Date:** July 14, 2026  
**Status:** Architecture Locked ✅  
**Next:** Begin implementation (Week 1)
