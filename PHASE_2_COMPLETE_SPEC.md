# 🔐 Phase 2: COMPLETE SPECIFICATION - Production SaaS Authentication

**Date:** July 14, 2026  
**Status:** ✅ FINAL LOCKED SPECIFICATION  
**Duration:** 3-4 weeks  
**Scope:** 13 core authentication features

---

## Overview

Phase 2 implements a **complete, production-grade authentication system** that will be **frozen** and reused by all subsequent modules.

**No future modules will modify authentication. All modules consume it as-is.**

---

## 13 Core Authentication Features

```
✅ Login
✅ Registration (Student self-signup, Recruiter/T&P invite-only)
✅ Email Verification
✅ Invitation System (Recruiter, T&P Officer)
✅ Forgot Password
✅ Reset Password
✅ JWT Authentication
✅ Refresh Tokens
✅ Role-Based Authorization
✅ Organization Scoping (College-based, Company-based)
✅ Admin User Management
✅ Dashboard Auto-Redirect
✅ Protected Routes & Session Logout
```

---

## Complete User Journeys

### STUDENT (Self-Register)

```
┌─────────────────────────────────────────────────────┐
│  1. REGISTER                                        │
│  ├─→ Visit /register                               │
│  ├─→ Role: Student (hardcoded)                     │
│  ├─→ Enter: Name, Email, Password                 │
│  ├─→ Select: College                              │
│  ├─→ Select: Department, Year                     │
│  └─→ Submit → Account Created                     │
├─────────────────────────────────────────────────────┤
│  2. EMAIL VERIFICATION                             │
│  ├─→ Receive verification email                   │
│  ├─→ Click link → Email verified                  │
│  └─→ Status: APPROVED (auto)                      │
├─────────────────────────────────────────────────────┤
│  3. LOGIN                                           │
│  ├─→ Email + Password                             │
│  ├─→ Checks: email verified, status approved      │
│  ├─→ Generate JWT + Refresh Token                 │
│  └─→ Auto-redirect to /dashboard                  │
└─────────────────────────────────────────────────────┘
```

### RECRUITER (Invite-Only)

```
┌─────────────────────────────────────────────────────┐
│  1. ADMIN INVITES RECRUITER                         │
│  ├─→ Admin panel: [Invite Recruiter]               │
│  ├─→ Enter: Email, Company, Role                   │
│  ├─→ System generates token (valid 7 days)         │
│  └─→ Send invite email with link                   │
├─────────────────────────────────────────────────────┤
│  2. RECRUITER RECEIVES INVITE                       │
│  ├─→ Email: "You're invited to join Pragyan"       │
│  ├─→ Link: /register?token=xyz&role=RECRUITER      │
│  └─→ Click link                                    │
├─────────────────────────────────────────────────────┤
│  3. RECRUITER COMPLETES REGISTRATION                │
│  ├─→ Pre-filled: Email (from invite)               │
│  ├─→ Enter: Name, Password, Phone                  │
│  ├─→ Pre-filled: Company (from invite)             │
│  ├─→ Pre-filled: Role/Designation (from invite)    │
│  ├─→ Status: AUTO-APPROVED (no admin review)       │
│  └─→ Submit → Ready to use                         │
├─────────────────────────────────────────────────────┤
│  4. EMAIL VERIFICATION                             │
│  ├─→ Receive verification email                   │
│  ├─→ Click link → Email verified                  │
│  └─→ Status: APPROVED                             │
├─────────────────────────────────────────────────────┤
│  5. LOGIN                                           │
│  ├─→ Email + Password                             │
│  ├─→ Checks: email verified, status approved      │
│  ├─→ Generate JWT + Refresh Token                 │
│  └─→ Auto-redirect to /company/dashboard          │
│      (Only sees own company's jobs/candidates)     │
└─────────────────────────────────────────────────────┘
```

### PLACEMENT OFFICER (Invite-Only)

Same as Recruiter:
```
Admin Invites → T&P Officer receives invite → Completes registration → Email verified → Login → /placement/dashboard (only sees own college students)
```

### ADMIN (Manual Only)

```
System owner creates manually (direct DB or special admin API)
├─→ No registration
├─→ No email verification
└─→ Direct login access
```

---

## Updated Prisma Schema

```prisma
enum UserRole {
  STUDENT
  RECRUITER
  PLACEMENT_OFFICER
  ADMIN
}

enum AccountStatus {
  EMAIL_PENDING
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SUSPENDED
}

// ✅ NEW: Invitation model
model Invitation {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  
  email     String
  role      UserRole
  
  collegeId String?  @db.ObjectId  // For PLACEMENT_OFFICER
  companyId String?  @db.ObjectId  // For RECRUITER
  
  token     String   @unique       // Random token for invite link
  expiresAt DateTime              // 7 days from creation
  used      Boolean  @default(false)
  
  createdAt DateTime @default(now())
  
  // Optional: who created this invitation
  createdBy String   @db.ObjectId  // User ID of admin
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  fullName  String
  email     String   @unique
  password  String   // hashed

  role      UserRole        @default(STUDENT)
  status    AccountStatus   @default(EMAIL_PENDING)

  // Email verification
  emailVerified Boolean      @default(false)
  emailVerificationToken String?
  emailVerificationExpiry DateTime?

  // ✅ NEW: Password reset
  passwordResetToken String?
  passwordResetExpiry DateTime?

  // Organization scoping
  collegeId String?  @db.ObjectId  // For STUDENT, PLACEMENT_OFFICER
  companyId String?  @db.ObjectId  // For RECRUITER

  designation String?

  // ✅ NEW: Invitation tracking
  invitationId String? @db.ObjectId  // Link to invitation that created this account

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Backend Endpoints (14 total)

### Authentication (6 endpoints)

```
POST   /api/auth/register              Self-register (students) or complete invite (recruiter/T&P)
POST   /api/auth/verify-email          Verify email token
POST   /api/auth/login                 User login
POST   /api/auth/logout                User logout
POST   /api/auth/forgot-password       Request password reset
POST   /api/auth/reset-password        Reset password with token
```

### Invitations (4 endpoints - Admin Only)

```
POST   /api/admin/invitations          Create invitation
GET    /api/admin/invitations          List all invitations
GET    /api/admin/invitations/pending  List unused invitations
DELETE /api/admin/invitations/:id      Cancel invitation
```

### Tokens (2 endpoints)

```
POST   /api/auth/refresh-token         Refresh JWT access token
POST   /api/auth/verify-invitation     Verify invitation token (before registration)
```

### User Management (2 endpoints - Admin Only)

```
GET    /api/admin/users                List all users
PUT    /api/admin/users/:id            Update user (suspend, change role, etc)
```

---

## Complete Registration Flows

### STUDENT Self-Registration

```typescript
POST /api/auth/register
{
  "fullName": "Abhishek Kumar",
  "email": "abhishek@student.edu",
  "password": "SecurePass123!",
  "role": "STUDENT",           // Fixed, not a choice
  "collegeId": "college_123",
  "department": "CSE",
  "year": "2nd"
}

Backend:
1. Validate role = STUDENT
2. Create user with status = EMAIL_PENDING
3. Send verification email
4. Return: { message: "Check your email", status: "EMAIL_PENDING" }
```

### RECRUITER Invitation + Registration

```typescript
// Step 1: Admin creates invitation
POST /api/admin/invitations
{
  "email": "rahul@tcs.com",
  "role": "RECRUITER",
  "companyId": "company_456"
}

Backend:
1. Check: Email not already registered
2. Generate token (32 bytes random, valid 7 days)
3. Create Invitation record
4. Send email: "You're invited to join Pragyan as Recruiter"
5. Email contains: /register?token=xyz&role=RECRUITER
6. Return: { message: "Invitation sent", invitationId: "..." }

---

// Step 2: Recruiter receives email and clicks link
// Frontend detects token and role in URL
// Shows: /register?token=xyz&role=RECRUITER

// Step 3: Recruiter completes registration
POST /api/auth/register
{
  "invitationToken": "xyz",    // From URL
  "fullName": "Rahul Sharma",
  "password": "SecurePass123!",
  "phone": "+91-9876543210"
}

Backend:
1. Verify invitation token:
   - Token exists?
   - Not expired (< 7 days)?
   - Not already used?
2. Extract from invitation: email, role, companyId
3. Create user:
   - email: (from invitation)
   - role: RECRUITER
   - status: EMAIL_PENDING (NOT auto-approved yet)
   - companyId: (from invitation)
4. Mark invitation as used
5. Send verification email
6. Return: { message: "Registration complete. Verify your email.", status: "EMAIL_PENDING" }

---

// Step 4: Email verification
POST /api/auth/verify-email
{
  "token": "verification_token"
}

Backend:
1. Verify token (not expired, valid)
2. Update user:
   - emailVerified: true
   - status: APPROVED (auto-approved for invite-based)
3. Return: { message: "Email verified. You can login.", status: "APPROVED" }
```

### PLACEMENT_OFFICER Invitation + Registration

Same as Recruiter but:
- companyId → collegeId
- /company/dashboard → /placement/dashboard

---

## Password Reset Flow

```typescript
// Step 1: User forgot password
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

Backend:
1. Find user by email
2. Generate reset token (32 bytes random, valid 1 hour)
3. Store in database:
   - passwordResetToken: token
   - passwordResetExpiry: now + 1 hour
4. Send email: "Click to reset password"
5. Email contains: /reset-password?token=xyz
6. Return: { message: "Check your email for reset link" }

---

// Step 2: User receives email and clicks link
// Frontend shows: /reset-password?token=xyz

// Step 3: User enters new password
POST /api/auth/reset-password
{
  "token": "xyz",
  "newPassword": "NewPass123!"
}

Backend:
1. Find user with token:
   - Token exists?
   - Not expired (< 1 hour)?
2. Hash new password
3. Update user:
   - password: hashed_new_password
   - passwordResetToken: null (clear token)
   - passwordResetExpiry: null
4. Return: { message: "Password reset successful. Login with new password." }
```

---

## Admin Invitation Panel

```
/admin/invitations

Tabs:
├─→ All Invitations
│   - Email, Role, Company/College, Sent Date, Status, Actions
│   - [Copy Link] [Resend] [Cancel]
│
├─→ Pending Invitations
│   - Same as above, filtered to unused
│
└─→ Send New Invitation
    - Email*, Role*, Company/College*
    - [Send Invitation]
```

---

## Organization Scoping (Critical)

### Database Level Constraints

```typescript
// PLACEMENT_OFFICER: Only see students from their college
const students = await prisma.user.findMany({
  where: {
    role: 'STUDENT',
    collegeId: req.user.collegeId  // ✅ Filtered by college
  }
});

// RECRUITER: Only see applications to their company's jobs
const applications = await prisma.jobApplication.findMany({
  where: {
    job: {
      companyId: req.user.companyId  // ✅ Filtered by company
    }
  }
});

// ADMIN: See everything (no filter)
const allStudents = await prisma.user.findMany({
  where: { role: 'STUDENT' }
});
```

### Frontend Level (Additional Protection)

```typescript
// Auth context provides organization info
const { user, collegeId, companyId } = useAuth();

// Components can access but cannot bypass backend checks
// Example: Sidebar shows different items per role
```

### API Middleware

```typescript
// Middleware validates ownership

function validateCollegeAccess(req, res, next) {
  const { collegeId } = req.body;
  
  // Only ADMIN or PLACEMENT_OFFICER from that college
  if (req.user.role !== 'ADMIN' && req.user.collegeId !== collegeId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

function validateCompanyAccess(req, res, next) {
  const { companyId } = req.body;
  
  // Only ADMIN or RECRUITER from that company
  if (req.user.role !== 'ADMIN' && req.user.companyId !== companyId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}
```

---

## Role Hierarchy

```
                        ADMIN
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  Placement Officer    Recruiter        Student
        │                 │                 │
        ▼                 ▼                 ▼
    College          Company             Self
   Students          Jobs/Apps            Only
  (Only own)        (Only own)
```

### Permissions Matrix

| Action | Admin | P.O. | Recruiter | Student |
|--------|-------|------|-----------|---------|
| View all students | ✅ | ❌ | ❌ | ❌ |
| View college students | ✅ | ✅ (own) | ❌ | ❌ |
| View own data | ✅ | ✅ | ✅ | ✅ |
| Invite recruiters | ✅ | ❌ | ❌ | ❌ |
| Invite T&P officers | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Post jobs | ✅ | ❌ | ✅ (own company) | ❌ |
| View applicants | ✅ | ✅ (own college) | ✅ (own company) | ✅ (own apps) |

---

## JWT & Refresh Tokens

### Access Token (JWT)

```json
{
  "id": "user_123",
  "email": "rahul@tcs.com",
  "fullName": "Rahul Sharma",
  "role": "RECRUITER",
  "companyId": "company_456",
  "collegeId": null,
  "iat": 1689000000,
  "exp": 1689003600  // 1 hour
}
```

### Refresh Token

```json
{
  "id": "user_123",
  "type": "refresh",
  "iat": 1689000000,
  "exp": 1689604800  // 7 days
}
```

**Flow:**
1. Login → Return access_token (1 hour) + refresh_token (7 days)
2. Access token expires → Frontend uses refresh_token to get new access_token
3. Refresh token expires → User must login again

---

## Frontend Pages (10 total)

```
/register                 Registration (student form or invite completion)
/verify-email             Email verification
/resend-verification      Resend verification email
/login                    Login
/forgot-password          Forgot password form
/reset-password           Reset password form
/dashboard                Student dashboard (PROTECTED)
/company/dashboard        Recruiter dashboard (PROTECTED)
/placement/dashboard      Placement officer dashboard (PROTECTED)
/admin/dashboard          Admin dashboard (PROTECTED)
/admin/invitations        Admin invitation panel (PROTECTED)
```

---

## Complete Feature Checklist

✅ **Authentication**
- [ ] Login endpoint
- [ ] Logout endpoint
- [ ] JWT generation
- [ ] Refresh tokens
- [ ] Token refresh endpoint

✅ **Registration**
- [ ] Student self-registration
- [ ] Recruiter invite-based registration
- [ ] Placement officer invite-based registration
- [ ] Admin manual creation

✅ **Email Verification**
- [ ] Email verification token generation
- [ ] Verification endpoint
- [ ] Resend verification email

✅ **Invitations**
- [ ] Create invitation (admin)
- [ ] List invitations (admin)
- [ ] Verify invitation token
- [ ] Mark invitation as used
- [ ] Expiry (7 days)

✅ **Password Reset**
- [ ] Forgot password endpoint
- [ ] Reset password token generation
- [ ] Reset password endpoint
- [ ] Token expiry (1 hour)

✅ **Authorization**
- [ ] Role-based access control
- [ ] Organization scoping (college/company)
- [ ] Database-level filtering
- [ ] API-level validation

✅ **Admin Features**
- [ ] User management panel
- [ ] Invitation management
- [ ] View all users/students/recruiters
- [ ] Suspend accounts

✅ **Frontend Protection**
- [ ] Protected routes (ProtectedRoute component)
- [ ] Role-specific route guards
- [ ] Dynamic sidebars per role
- [ ] Auto-redirect on login

---

## Security Checklist

- [ ] All passwords hashed with bcrypt (10+ rounds)
- [ ] JWT tokens cryptographically signed
- [ ] Refresh tokens stored securely
- [ ] Invitation tokens are 32-byte random (cryptographically strong)
- [ ] Password reset tokens are 32-byte random
- [ ] All tokens have expiry times
- [ ] Email verification required before any login
- [ ] Organization scoping enforced at database level
- [ ] Admin endpoints check authorization
- [ ] No sensitive data in JWT
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] SQL injection prevented (use parameterized queries)
- [ ] XSS prevention (sanitize inputs)

---

## Frozen Authentication Module

**After Phase 2 complete, the authentication module is FROZEN.**

This means:
- ✅ No new auth features added
- ✅ No modification to role system
- ✅ No changes to invitation flow
- ✅ No changes to organization scoping

**All future modules:**
- ✅ Use existing authentication
- ✅ Consume user info from context
- ✅ Respect user roles and organization scope
- ✅ Call existing auth APIs

**Future modules that CONSUME authentication:**
- Roadmap module (uses user role, college/company scope)
- Recruitment module (uses recruiter role, company scope)
- Placement module (uses placement officer role, college scope)
- AI module (uses user context, respects scoping)
- Analytics module (uses admin role, multi-tenant scoping)

---

## Implementation Scope

**Phase 2 = Complete, Frozen Authentication Module**

After Phase 2:
- ✅ All users authenticated
- ✅ All roles working
- ✅ All invitations working
- ✅ All passwords resettable
- ✅ All data scoped by organization
- ✅ Ready for any module to build on top

No other module will ever need to modify or extend authentication.

---

**Document:** PHASE_2_COMPLETE_SPEC.md  
**Date:** July 14, 2026  
**Status:** ✅ FINAL LOCKED SPECIFICATION  
**Next:** Create implementation tasks & technical guides
