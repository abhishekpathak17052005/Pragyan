# 📝 Phase 2: Registration & Account Approval Flow

**Date:** July 14, 2026  
**Status:** Locked & Ready for Implementation  
**Security Level:** Production-Grade

---

## Overview

Pragyan uses a **role-based registration system with admin approval** for non-student accounts. This prevents unauthorized access and ensures data quality.

**Core Rule:** 
> Users can self-register as STUDENT, RECRUITER, or T&P OFFICER. Only the system owner can create ADMIN accounts.

---

## The 3 Self-Registerable Roles

```
┌─────────────────────────────────────────────┐
│         Pragyan Registration                │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ STUDENT                                 │
│     └─→ Auto-approved, can login immediately
│                                             │
│  ✅ RECRUITER                               │
│     └─→ Pending approval, must wait for admin
│                                             │
│  ✅ PLACEMENT_OFFICER (T&P Coordinator)     │
│     └─→ Pending approval, must wait for admin
│                                             │
│  ❌ ADMIN                                   │
│     └─→ Cannot self-register (manual only)  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Account Status Enum

```prisma
enum AccountStatus {
  PENDING      // Awaiting admin approval (Recruiter, T&P Officer)
  APPROVED     // Can login (Students auto-approved)
  REJECTED     // Registration denied
  SUSPENDED    // Account disabled by admin
}
```

**Status Transitions:**
```
Registration
    │
    ├─→ STUDENT → APPROVED (immediately)
    │
    ├─→ RECRUITER → PENDING (await admin)
    │   ├─→ Admin approves → APPROVED
    │   └─→ Admin rejects → REJECTED
    │
    └─→ T&P OFFICER → PENDING (await admin)
        ├─→ Admin approves → APPROVED
        └─→ Admin rejects → REJECTED
```

---

## Registration Form UI

### Dynamic Form (Changes based on role selection)

```
═══════════════════════════════════════════════
              CREATE ACCOUNT
═══════════════════════════════════════════════

Full Name *
[_____________________________________]

Email *
[_____________________________________]

Password *
[_____________________________________]

Confirm Password *
[_____________________________________]

Register As * ▼
┌─────────────────────────────┐
│ Student                     │  (auto-approved)
│ Recruiter                   │  (pending approval)
│ Placement Officer           │  (pending approval)
└─────────────────────────────┘

─────────────────────────────────────────────

IF STUDENT IS SELECTED:

College * ▼
[_____________________________________]

Department * ▼
[_____________________________________]

Current Year * ▼
┌─────────┐
│ 1st Year│
│ 2nd Year│
│ 3rd Year│
│ 4th Year│
└─────────┘

─────────────────────────────────────────────

IF RECRUITER IS SELECTED:

Company Name *
[_____________________________________]

Designation *
[_____________________________________]

Company Email *
[_____________________________________]

─────────────────────────────────────────────

IF T&P OFFICER IS SELECTED:

College Name *
[_____________________________________]

Designation *
[_____________________________________]

Employee ID *
[_____________________________________]

─────────────────────────────────────────────

[ CREATE ACCOUNT ]

ℹ️  Students can login immediately.
    Recruiters and T&P Officers must wait for admin approval.

═══════════════════════════════════════════════
```

---

## Registration Requests

### STUDENT Registration Request

```json
{
  "fullName": "Abhishek Kumar",
  "email": "abhishek@student.edu",
  "password": "SecurePass123!",
  "role": "STUDENT",
  "collegeId": "college_123",
  "department": "Computer Science",
  "currentYear": "2nd Year"
}
```

**Backend Response (200 OK):**
```json
{
  "message": "Account created successfully. You can now login.",
  "user": {
    "id": "user_123",
    "fullName": "Abhishek Kumar",
    "email": "abhishek@student.edu",
    "role": "STUDENT",
    "status": "APPROVED",
    "collegeId": "college_123"
  }
}
```

**Next:** User can immediately login at `/login`

---

### RECRUITER Registration Request

```json
{
  "fullName": "Rahul Sharma",
  "email": "rahul@tcs.com",
  "password": "SecurePass123!",
  "role": "RECRUITER",
  "companyId": "company_456",
  "designation": "HR Manager",
  "companyEmail": "hr@tcs.com"
}
```

**Backend Response (201 Created):**
```json
{
  "message": "Account created. Waiting for admin approval.",
  "user": {
    "id": "user_456",
    "fullName": "Rahul Sharma",
    "email": "rahul@tcs.com",
    "role": "RECRUITER",
    "status": "PENDING",
    "companyId": "company_456"
  }
}
```

**Next:** 
- Admin receives email notification
- User sees "Pending approval" message
- User cannot login until approved

---

### T&P OFFICER Registration Request

```json
{
  "fullName": "Mr. Sharma",
  "email": "tpo@college.edu",
  "password": "SecurePass123!",
  "role": "PLACEMENT_OFFICER",
  "collegeId": "college_789",
  "designation": "Training & Placement Officer",
  "employeeId": "EMP789"
}
```

**Backend Response (201 Created):**
```json
{
  "message": "Account created. Waiting for admin approval.",
  "user": {
    "id": "user_789",
    "fullName": "Mr. Sharma",
    "email": "tpo@college.edu",
    "role": "PLACEMENT_OFFICER",
    "status": "PENDING",
    "collegeId": "college_789"
  }
}
```

**Next:**
- Admin receives email notification
- User sees "Pending approval" message
- User cannot login until approved

---

### ADMIN Registration Request (REJECTED)

```json
{
  "fullName": "Attacker",
  "email": "attacker@malicious.com",
  "password": "SecurePass123!",
  "role": "ADMIN"
}
```

**Backend Response (403 Forbidden):**
```json
{
  "error": "Admin registration is not allowed.",
  "message": "Admin accounts can only be created by the system owner."
}
```

**Backend Code:**
```typescript
if (body.role === 'ADMIN') {
  return res.status(403).json({
    error: 'Admin registration is not allowed.',
    message: 'Admin accounts can only be created by the system owner.'
  });
}
```

---

## Registration Endpoint Code

```typescript
// backend/src/routes/auth.ts

router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      collegeId,
      companyId,
      designation,
      department,
      currentYear,
      employeeId,
      companyEmail
    } = req.body;

    // ═══════════════════════════════════════════════
    // 1. SECURITY: REJECT ADMIN REGISTRATION
    // ═══════════════════════════════════════════════
    if (role === 'ADMIN') {
      return res.status(403).json({
        error: 'Admin registration is not allowed.',
        message: 'Admin accounts can only be created by the system owner.'
      });
    }

    // ═══════════════════════════════════════════════
    // 2. VALIDATE ROLE
    // ═══════════════════════════════════════════════
    const allowedRoles = ['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${allowedRoles.join(', ')}`
      });
    }

    // ═══════════════════════════════════════════════
    // 3. CHECK EMAIL UNIQUENESS
    // ═══════════════════════════════════════════════
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        message: 'This email is already in use.'
      });
    }

    // ═══════════════════════════════════════════════
    // 4. VALIDATE REQUIRED FIELDS PER ROLE
    // ═══════════════════════════════════════════════
    if (role === 'STUDENT' && !collegeId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'collegeId is required for students'
      });
    }

    if (role === 'RECRUITER' && !companyId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'companyId is required for recruiters'
      });
    }

    if (role === 'PLACEMENT_OFFICER' && !collegeId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'collegeId is required for placement officers'
      });
    }

    // ═══════════════════════════════════════════════
    // 5. VALIDATE PASSWORD STRENGTH
    // ═══════════════════════════════════════════════
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters'
      });
    }

    // ═══════════════════════════════════════════════
    // 6. HASH PASSWORD
    // ═══════════════════════════════════════════════
    const hashedPassword = await bcrypt.hash(password, 10);

    // ═══════════════════════════════════════════════
    // 7. DETERMINE INITIAL STATUS
    // ═══════════════════════════════════════════════
    let status = 'PENDING';
    
    if (role === 'STUDENT') {
      status = 'APPROVED'; // Students auto-approved
    }
    
    // Recruiters and T&P Officers remain PENDING

    // ═══════════════════════════════════════════════
    // 8. CREATE USER IN DATABASE
    // ═══════════════════════════════════════════════
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        status,
        collegeId: role !== 'RECRUITER' ? collegeId : null,
        companyId: role === 'RECRUITER' ? companyId : null,
        designation: role !== 'STUDENT' ? designation : null
      }
    });

    // ═══════════════════════════════════════════════
    // 9. IF PENDING, NOTIFY ADMIN
    // ═══════════════════════════════════════════════
    if (status === 'PENDING') {
      // TODO: Send email to admin
      // Email: "New {role} registration requires approval: {email}"
      
      const adminEmail = process.env.ADMIN_EMAIL;
      await sendEmail({
        to: adminEmail,
        subject: `New ${role} Registration - Approval Required`,
        body: `${fullName} (${email}) has registered as ${role}. Please review and approve.`
      });
    }

    // ═══════════════════════════════════════════════
    // 10. RETURN SUCCESS
    // ═══════════════════════════════════════════════
    return res.status(201).json({
      message: status === 'APPROVED'
        ? 'Account created successfully. You can now login.'
        : 'Account created. Waiting for admin approval.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        collegeId: user.collegeId,
        companyId: user.companyId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Please try again later.'
    });
  }
});
```

---

## Login with Status Check

```typescript
// backend/src/routes/auth.ts

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ═══════════════════════════════════════════════
    // 3. ✅ CHECK ACCOUNT STATUS
    // ═══════════════════════════════════════════════
    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Account pending approval',
        message: 'Your account is awaiting admin approval. Check your email for updates.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Account rejected',
        message: 'Your registration was not approved. Contact support for more information.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.'
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

    // 5. Return success
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

---

## Admin Approval Panel (For Phase 4+)

```typescript
// backend/src/routes/admin.ts

// Get pending registrations
router.get(
  '/admin/registrations/pending',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const pending = await prisma.user.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pending);
  }
);

// Approve registration
router.post(
  '/admin/registrations/:userId/approve',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { status: 'APPROVED' }
    });

    // Send approval email
    await sendEmail({
      to: user.email,
      subject: 'Registration Approved',
      body: `Your ${user.role} registration has been approved. You can now login.`
    });

    res.json({ message: 'User approved', user });
  }
);

// Reject registration
router.post(
  '/admin/registrations/:userId/reject',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { status: 'REJECTED' }
    });

    // Send rejection email
    await sendEmail({
      to: user.email,
      subject: 'Registration Not Approved',
      body: 'Your registration was not approved. Please contact support.'
    });

    res.json({ message: 'User rejected', user });
  }
);
```

---

## Frontend Registration Page

### Registration Form Component

```typescript
// frontend/src/pages/register.tsx

import { useState } from 'react';
import { useLocation } from 'wouter';

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build request body based on role
      const body: any = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role
      };

      // Add role-specific fields
      if (role === 'STUDENT') {
        body.collegeId = formData.collegeId;
        body.department = formData.department;
        body.currentYear = formData.currentYear;
      } else if (role === 'RECRUITER') {
        body.companyId = formData.companyId;
        body.designation = formData.designation;
        body.companyEmail = formData.companyEmail;
      } else if (role === 'PLACEMENT_OFFICER') {
        body.collegeId = formData.collegeId;
        body.designation = formData.designation;
        body.employeeId = formData.employeeId;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message || 'Registration failed');
        return;
      }

      const data = await response.json();
      setSuccess(data.message);

      // If student (auto-approved), redirect to login
      if (role === 'STUDENT') {
        setTimeout(() => setLocation('/login'), 2000);
      }
      // If recruiter/T&P, show pending message
      else {
        setSuccess(data.message + ' You will be notified once approved.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <form onSubmit={handleRegister} className="register-form">
        <h1>Create Your Pragyan Account</h1>

        {/* Role Selection */}
        <div className="form-group">
          <label htmlFor="role">Register As *</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="STUDENT">Student (Auto-approved)</option>
            <option value="RECRUITER">Recruiter (Pending approval)</option>
            <option value="PLACEMENT_OFFICER">
              T&P Officer (Pending approval)
            </option>
          </select>
        </div>

        {/* Common Fields */}
        <div className="form-group">
          <label htmlFor="fullName">Full Name *</label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="At least 8 characters"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
          />
        </div>

        {/* Role-Specific Fields */}
        {role === 'STUDENT' && (
          <>
            <div className="form-group">
              <label htmlFor="college">College *</label>
              <select
                id="college"
                onChange={(e) =>
                  setFormData({ ...formData, collegeId: e.target.value })
                }
                required
              >
                <option>Select College</option>
                <option value="college_123">Example College 1</option>
                <option value="college_456">Example College 2</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <input
                id="department"
                type="text"
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {role === 'RECRUITER' && (
          <>
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <select
                id="company"
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                required
              >
                <option>Select Company</option>
                <option value="company_123">TCS</option>
                <option value="company_456">Accenture</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="designation">Designation *</label>
              <input
                id="designation"
                type="text"
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {role === 'PLACEMENT_OFFICER' && (
          <>
            <div className="form-group">
              <label htmlFor="college">College *</label>
              <select
                id="college"
                onChange={(e) =>
                  setFormData({ ...formData, collegeId: e.target.value })
                }
                required
              >
                <option>Select College</option>
                <option value="college_789">Example College</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="designation">Designation *</label>
              <input
                id="designation"
                type="text"
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </form>
    </div>
  );
}
```

---

## Frontend Login Status Messages

### Status: APPROVED ✅

```
Login successful
Auto-redirect to dashboard
```

### Status: PENDING ⏳

```
🔄 Account Pending Approval

Your account is awaiting admin approval.
Check your email for updates.

Close
```

### Status: REJECTED ❌

```
❌ Registration Not Approved

Your registration was not approved.
Please contact support for more information.

Close
```

### Status: SUSPENDED 🚫

```
🚫 Account Suspended

Your account has been suspended.
Please contact support.

Close
```

---

## Security Checklist

- [ ] Admin role cannot be self-registered
- [ ] ADMIN rejection at registration layer
- [ ] STUDENT accounts auto-approved
- [ ] RECRUITER and T&P accounts require admin approval
- [ ] Status checked on login (database lookup, not JWT)
- [ ] Email notifications sent for approvals/rejections
- [ ] Password hashed with bcrypt
- [ ] Email uniqueness enforced
- [ ] Required fields validated per role
- [ ] Only APPROVED status can login
- [ ] Admin can reject or suspend accounts

---

**Document:** PHASE_2_REGISTRATION_FLOW.md  
**Date:** July 14, 2026  
**Status:** LOCKED & READY  
**Next:** Add to Phase 2 tasks
