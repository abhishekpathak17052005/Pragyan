# 🔐 Phase 2: FINAL SPECIFICATION - Complete Authentication System

**Date:** July 14, 2026  
**Status:** ✅ LOCKED, REVIEWED, PRODUCTION-READY  
**Duration:** 2-3 weeks  
**Email Verification:** REQUIRED ✅

---

## Executive Summary

Phase 2 implements a **production-grade authentication system** with:

✅ Email verification (mandatory before login)  
✅ Role-based registration (3 self-registerable roles)  
✅ Admin approval (for non-student roles)  
✅ Backend-driven role control  
✅ JWT with cryptographically signed role  
✅ Automatic dashboard redirect  
✅ Complete backend authorization  

---

## The Complete User Journey

### STUDENT

```
┌─────────────────────────────────────┐
│  1. REGISTER                        │
│  - Name, Email, Password            │
│  - College, Department, Year        │
├─────────────────────────────────────┤
│  2. EMAIL VERIFICATION ✅           │
│  - Receive verification email       │
│  - Click link → Email verified      │
│  - Status: APPROVED (auto)          │
├─────────────────────────────────────┤
│  3. LOGIN                           │
│  - Email + Password                 │
│  - Check: emailVerified=true        │
│  - Check: status=APPROVED           │
│  - Generate JWT                     │
├─────────────────────────────────────┤
│  4. AUTO-REDIRECT                   │
│  - Redirect to /dashboard           │
│  - Load student sidebar             │
│  - Can access student features      │
└─────────────────────────────────────┘
```

### RECRUITER

```
┌──────────────────────────────────────┐
│  1. REGISTER                         │
│  - Name, Email, Password             │
│  - Company, Designation, Email       │
├──────────────────────────────────────┤
│  2. EMAIL VERIFICATION ✅            │
│  - Receive verification email        │
│  - Click link → Email verified       │
│  - Status: PENDING_APPROVAL ⏳        │
│  - Admin notified                    │
├──────────────────────────────────────┤
│  3. AWAIT ADMIN APPROVAL             │
│  - Admin reviews in panel            │
│  - [Approve] or [Reject]             │
│  - If Approved: Status = APPROVED    │
│  - If Rejected: Status = REJECTED    │
├──────────────────────────────────────┤
│  4. LOGIN (if approved)              │
│  - Email + Password                  │
│  - Check: emailVerified=true         │
│  - Check: status=APPROVED            │
│  - Generate JWT                      │
├──────────────────────────────────────┤
│  5. AUTO-REDIRECT                    │
│  - Redirect to /company/dashboard    │
│  - Load recruiter sidebar            │
│  - Can access recruiter features     │
└──────────────────────────────────────┘
```

### PLACEMENT_OFFICER

Same as Recruiter:
```
Register → Email Verify → PENDING_APPROVAL → Admin Approves → Login → /placement/dashboard
```

### ADMIN

```
✅ Manual account creation only
✅ No registration page
✅ No email verification needed
✅ Can login directly
✅ Access /admin/dashboard
```

---

## Complete Account Status Enum

```prisma
enum AccountStatus {
  EMAIL_PENDING      // Step 1: Awaiting email verification
  PENDING_APPROVAL   // Step 2: Email verified, awaiting admin approval
  APPROVED           // Step 3: Can login
  REJECTED           // Step 4: Cannot login
}
```

### Status Transitions

```
STUDENT:
  EMAIL_PENDING → [User verifies email] → APPROVED → Can login

RECRUITER/T&P:
  EMAIL_PENDING → [User verifies email] → PENDING_APPROVAL
  PENDING_APPROVAL → [Admin approves] → APPROVED → Can login
  PENDING_APPROVAL → [Admin rejects] → REJECTED → Cannot login
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
  EMAIL_PENDING      // Awaiting email verification
  PENDING_APPROVAL   // Email verified, awaiting admin
  APPROVED           // Can login
  REJECTED           // Registration denied
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  // Basic info
  fullName  String
  email     String   @unique
  password  String   // hashed

  // Role & Status
  role      UserRole        @default(STUDENT)
  status    AccountStatus   @default(EMAIL_PENDING)

  // Email verification ✅ NEW
  emailVerified Boolean      @default(false)
  emailVerificationToken String?
  emailVerificationExpiry DateTime?

  // Organization
  companyId String?  @db.ObjectId
  collegeId String?  @db.ObjectId

  designation String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Backend Endpoints

### POST /api/auth/register

**Register a new user**

```json
{
  "fullName": "Abhishek Kumar",
  "email": "abhishek@student.edu",
  "password": "SecurePass123!",
  "role": "STUDENT",
  "collegeId": "college_123"
}
```

**Response (201):**
```json
{
  "message": "Account created. Please verify your email.",
  "user": {
    "id": "user_123",
    "email": "abhishek@student.edu",
    "status": "EMAIL_PENDING"
  }
}
```

**Actions:**
- ✅ Create user with status = EMAIL_PENDING
- ✅ Generate verification token (32 bytes random)
- ✅ Send verification email
- ✅ Show "Check your email" message

---

### POST /api/auth/verify-email

**Verify email address**

```json
{
  "token": "abc123def456..."
}
```

**Response (200):**
```json
{
  "message": "Email verified! You can now login.",
  "user": {
    "id": "user_123",
    "email": "abhishek@student.edu",
    "status": "APPROVED",
    "emailVerified": true
  }
}
```

**Actions:**
- ✅ Validate token
- ✅ Check expiry (24 hours)
- ✅ Update: emailVerified = true
- ✅ For STUDENT: status = APPROVED
- ✅ For RECRUITER/T&P: status = PENDING_APPROVAL
- ✅ Clear verification token
- ✅ If PENDING_APPROVAL: notify admin

---

### GET /api/auth/verify-email/:token

**Verify email via link click**

**Workflow:**
1. User receives email: `https://pragyan.com/verify-email?token=xyz`
2. User clicks link
3. Frontend makes POST to /verify-email with token
4. If success: Show "Email verified!"
5. If failure: Show "Invalid/expired token"

---

### POST /api/auth/login

**User login**

```json
{
  "email": "abhishek@student.edu",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "abhishek@student.edu",
    "fullName": "Abhishek Kumar",
    "role": "STUDENT",
    "status": "APPROVED",
    "emailVerified": true
  }
}
```

**Checks (in order):**
1. ✅ Email exists?
2. ✅ Password correct?
3. ✅ emailVerified = true? (NEW)
4. ✅ status ≠ EMAIL_PENDING?
5. ✅ status ≠ PENDING_APPROVAL?
6. ✅ status ≠ REJECTED?
7. ✅ status = APPROVED?

If any check fails → 403 Forbidden with clear message

---

### POST /api/auth/resend-verification

**Resend verification email**

```json
{
  "email": "abhishek@student.edu"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent. Check your inbox."
}
```

---

### GET /api/admin/registrations/pending

**Get pending approvals (admin only)**

**Response:**
```json
[
  {
    "id": "user_456",
    "fullName": "Rahul Sharma",
    "email": "rahul@tcs.com",
    "role": "RECRUITER",
    "status": "PENDING_APPROVAL",
    "companyId": "company_456",
    "createdAt": "2026-07-14T10:30:00Z"
  }
]
```

---

### POST /api/admin/registrations/:userId/approve

**Approve registration (admin only)**

**Response:**
```json
{
  "message": "User approved",
  "user": {
    "id": "user_456",
    "status": "APPROVED"
  }
}
```

**Actions:**
- ✅ Update status = APPROVED
- ✅ Send approval email to user

---

### POST /api/admin/registrations/:userId/reject

**Reject registration (admin only)**

**Response:**
```json
{
  "message": "User rejected",
  "user": {
    "id": "user_456",
    "status": "REJECTED"
  }
}
```

**Actions:**
- ✅ Update status = REJECTED
- ✅ Send rejection email to user

---

## Frontend Pages

### /register

**Registration form**
- Dynamic fields per role
- Student: College, Department, Year
- Recruiter: Company, Designation
- T&P Officer: College, Designation
- Submit → Registration complete

**Shows after submit:**
```
✅ Registration Successful

Verification email sent to: [email]

Click the link in your email to continue.
```

---

### /verify-email

**Email verification page**
- Triggered when user clicks email link
- Shows: "Verifying your email..."
- On success: "Email verified! Redirecting..."
- On failure: "Invalid/expired link. Resend?"

---

### /login

**Login page**
- Email + Password
- Shows appropriate error messages:
  - "Email not verified" → offer resend
  - "Account pending approval" → wait message
  - "Account rejected" → contact support

---

### /resend-verification

**Resend verification email**
- For users who didn't receive email or link expired
- Enter email → Send verification email

---

### /admin/registrations/pending

**Admin approval panel** (Phase 3+)
- Tabs: Recruiters, T&P Officers
- Cards: Name, Email, Company/College, [Approve] [Reject]
- Send approval/rejection email

---

## Frontend Routes

```
/register                → Register page (public)
/verify-email            → Verify email page (public, GET with token)
/resend-verification     → Resend email page (public)
/login                   → Login page (public)
/dashboard               → Student dashboard (PROTECTED: STUDENT)
/company/dashboard       → Recruiter dashboard (PROTECTED: RECRUITER)
/placement/dashboard     → T&P Officer dashboard (PROTECTED: PLACEMENT_OFFICER)
/admin/dashboard         → Admin dashboard (PROTECTED: ADMIN)
/admin/registrations/pending → Admin approval panel (PROTECTED: ADMIN)
```

---

## Backend Middleware

### requireAuth

```typescript
// Verify JWT is valid
// Extract user from JWT
// Attach to req.user
```

### requireRole

```typescript
// Check req.user.role
// If role doesn't match → 403 Forbidden
```

---

## JWT Payload

```json
{
  "id": "user_123",
  "email": "abhishek@student.edu",
  "fullName": "Abhishek Kumar",
  "role": "STUDENT",
  "companyId": null,
  "collegeId": "college_123",
  "iat": 1689000000,
  "exp": 1689003600
}
```

**Important:**
- ✅ Role is in JWT
- ✅ JWT is cryptographically signed
- ✅ Cannot be modified on frontend
- ❌ emailVerified NOT in JWT (checked from database)
- ❌ status NOT in JWT (checked from database)

---

## Email Templates

### Verification Email

```
Subject: Verify your Pragyan account

Hi [fullName],

Thank you for registering with Pragyan!

Verify your email by clicking: [Link]

This link expires in 24 hours.

Best regards,
Pragyan Team
```

### Admin Notification

```
Subject: New [ROLE] registration - Approval required

Name: [fullName]
Email: [email]
Role: [role]
Company/College: [company/college]

Review: [Admin Link]
```

### Approval Email

```
Subject: Your Pragyan account is approved!

Hi [fullName],

Your account has been approved. You can now login.

[Login Link]

Best regards,
Pragyan Team
```

### Rejection Email

```
Subject: Pragyan registration update

Hi [fullName],

Your registration was not approved.

Contact support: [email]

Best regards,
Pragyan Team
```

---

## Complete Task Checklist for Phase 2

### Week 1: Database & Backend Auth (12 tasks)
- [ ] 1.1 Update Prisma schema (add enums + fields)
- [ ] 1.2 Run migration
- [ ] 1.3 Create registration endpoint
- [ ] 1.4 Create email verification endpoint
- [ ] 1.5 Create resend verification endpoint
- [ ] 1.6 Create login endpoint (with all checks)
- [ ] 1.7 Create requireAuth middleware
- [ ] 1.8 Create requireRole middleware
- [ ] 1.9 Create admin approval endpoints
- [ ] 1.10 Setup email sending service
- [ ] 1.11 Test with Postman (all endpoints)
- [ ] 1.12 Backend build verification

### Week 2: Frontend Auth & Routes (12 tasks)
- [ ] 2.1 Create AuthContext with useAuth
- [ ] 2.2 Wrap app with AuthProvider
- [ ] 2.3 Create registration page (dynamic form)
- [ ] 2.4 Create email verification page
- [ ] 2.5 Create resend verification page
- [ ] 2.6 Create login page (with status messages)
- [ ] 2.7 Create ProtectedRoute component
- [ ] 2.8 Create role-specific route guards
- [ ] 2.9 Update router with protected routes
- [ ] 2.10 Create dynamic sidebar
- [ ] 2.11 Update dashboards with sidebar
- [ ] 2.12 Frontend build verification

### Week 3: Testing & Verification (12 tasks)
- [ ] 3.1 Test student registration flow
- [ ] 3.2 Test recruiter registration flow
- [ ] 3.3 Test T&P officer registration flow
- [ ] 3.4 Test admin registration rejected (403)
- [ ] 3.5 Test email verification link
- [ ] 3.6 Test resend verification email
- [ ] 3.7 Test login (email not verified blocked)
- [ ] 3.8 Test login (pending approval blocked)
- [ ] 3.9 Test student login success → redirect
- [ ] 3.10 Test recruiter login (approved) → redirect
- [ ] 3.11 Test logout and token persistence
- [ ] 3.12 Final build verification

**Total: 36 tasks**

---

## Success Criteria

### Functionality ✅
- [ ] Student registration → auto-approved → can login
- [ ] Recruiter registration → pending → admin approves → can login
- [ ] T&P Officer registration → pending → admin approves → can login
- [ ] Admin registration → 403 error (rejected)
- [ ] Email verification required before any login
- [ ] Auto-redirect to correct dashboard per role
- [ ] Logout clears all data
- [ ] Token persists across refresh
- [ ] Resend verification email works

### Security ✅
- [ ] JWT role cannot be faked
- [ ] Backend verifies role on every API
- [ ] Email verified flag checked on login
- [ ] Status checked from database (not JWT)
- [ ] Admin approval prevents unauthorized access
- [ ] Password hashed with bcrypt
- [ ] Verification token expires after 24 hours
- [ ] Invalid JWT rejected (401)

### Quality ✅
- [ ] Backend build: 0 errors
- [ ] Frontend build: 0 errors
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Code documented

---

## Files to Create/Modify

### Create (9 new backend/frontend files)

**Backend:**
- `backend/src/middleware/requireAuth.ts`
- `backend/src/middleware/requireRole.ts`
- `backend/src/services/emailService.ts` (email sending)

**Frontend:**
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/components/StudentRoute.tsx`
- `frontend/src/components/RecruiterRoute.tsx`
- `frontend/src/components/PlacementOfficerRoute.tsx`
- `frontend/src/components/AdminRoute.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/pages/register.tsx` (NEW)
- `frontend/src/pages/verify-email.tsx` (NEW)
- `frontend/src/pages/resend-verification.tsx` (NEW)

**Total: 12 new files**

---

### Modify (12 existing files)

**Backend:**
- `backend/prisma/schema.prisma` (schema)
- `backend/src/routes/auth.ts` (endpoints)
- `backend/src/app.ts` (middleware)

**Frontend:**
- `frontend/src/main.tsx` (AuthProvider)
- `frontend/src/App.tsx` (routes)
- `frontend/src/pages/login.tsx` (status messages)
- `frontend/src/pages/dashboard.tsx` (sidebar)
- `frontend/src/pages/company/dashboard.tsx` (sidebar)
- `frontend/src/pages/placement/dashboard.tsx` (sidebar)
- `frontend/src/pages/admin/dashboard.tsx` (sidebar)

**Total: 11 files to modify**

---

## Why Email Verification First?

✅ **Prevents spam** - Reduces fake accounts  
✅ **Validates ownership** - Confirms user owns the email  
✅ **Professional standard** - All SaaS platforms do this  
✅ **Better UX** - Clear, phased process  
✅ **Compliance** - Many regulations require it  
✅ **Recovery** - Can use email for password reset (Phase 3+)  

---

## Phase 2 Complete = Phase 3 Ready

Once Phase 2 is done:

✅ **Secure authentication working**  
✅ **Role system tested**  
✅ **Email verified for all users**  
✅ **Admin approval working**  
✅ **Foundation for Phase 3**  

Phase 3 can then:
- Add Company, Recruiter models
- Create recruitment APIs
- Implement company-scoped queries
- Replace mock data with real data

---

## Final Checklist Before Implementation

- [ ] Review PHASE_2_AUTH_ARCHITECTURE.md (all devs)
- [ ] Review PHASE_2_EMAIL_VERIFICATION.md (backend dev)
- [ ] Review PHASE_2_REGISTRATION_FLOW.md (security)
- [ ] Review PHASE_2_FINAL_SPECIFICATION.md (everyone)
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Create .env variables for email
- [ ] Assign Phase 2 owner
- [ ] Schedule Week 1 kickoff

---

## Next Steps

1. **Day 1:** Team reads final specification
2. **Day 2:** Backend dev starts Week 1 tasks
3. **Day 5:** Frontend dev starts Week 2 tasks
4. **Week 3:** QA tests all flows
5. **End Week 3:** Phase 2 sign-off

---

**Document:** PHASE_2_FINAL_SPECIFICATION.md  
**Date:** July 14, 2026  
**Status:** ✅ LOCKED & PRODUCTION-READY  
**Email Verification:** REQUIRED  
**Next:** Assign owner & begin implementation
