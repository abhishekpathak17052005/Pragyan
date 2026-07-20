# 📧 Phase 2: Email Verification & Account Status Flow

**Date:** July 14, 2026  
**Status:** LOCKED & REQUIRED  
**Security Level:** Production-Grade  

---

## Overview

Email verification is a **mandatory gate** before account approval or login. This is standard SaaS practice.

**Core Flow:**
```
Register → Email Verification → Approval/Reject → Login
```

---

## Updated Prisma Schema

### AccountStatus Enum (4 states)

```prisma
enum AccountStatus {
  EMAIL_PENDING      // Awaiting email verification
  PENDING_APPROVAL   // Email verified, awaiting admin approval
  APPROVED           // Can login
  REJECTED           // Registration denied
}
```

### User Model (with emailVerified flag)

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  fullName  String
  email     String   @unique
  password  String   // hashed
  
  role      UserRole        @default(STUDENT)
  status    AccountStatus   @default(EMAIL_PENDING)
  
  // ✅ NEW: Email verification
  emailVerified Boolean      @default(false)
  emailVerificationToken String?  // Token for email verification link
  emailVerificationExpiry DateTime?  // Token expiry time
  
  companyId String?  @db.ObjectId
  collegeId String?  @db.ObjectId
  
  designation String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Prisma Migration

```bash
npx prisma migrate dev --name add_email_verification
npx prisma generate
```

---

## Complete User Lifecycle

### STUDENT Registration Flow

```
┌─────────────────────────────────────┐
│  Student visits /register           │
├─────────────────────────────────────┤
│  Full Name, Email, Password,        │
│  College, Department, Year          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend creates user               │
│  Status: EMAIL_PENDING              │
│  emailVerified: false               │
├─────────────────────────────────────┤
│  Generate verification token        │
│  Send verification email            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Show: "Verification email sent"    │
│  "Check your inbox"                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  User clicks email link             │
│  /verify-email?token=xyz123         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend verifies token             │
│  Updates: emailVerified = true      │
│  Status: APPROVED (auto for student)│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Show: "Email verified!"            │
│  "You can now login"                │
│  Redirect to /login                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  User logs in                       │
│  ✅ emailVerified: true             │
│  ✅ status: APPROVED                │
│  Generate JWT                       │
│  Auto-redirect to /dashboard        │
└─────────────────────────────────────┘
```

---

### RECRUITER Registration Flow

```
┌──────────────────────────────────────┐
│  Recruiter visits /register          │
├──────────────────────────────────────┤
│  Full Name, Email, Password,         │
│  Company, Designation, Company Email │
└───────────────┬────────────────────┬─┘
                │                    │
                ▼                    ▼
          ┌─────────────┐     ┌────────────────┐
          │ Backend     │     │ Verify company │
          │ creates     │     │ email format   │
          │ user        │     │ matches domain │
          └─────────────┘     └────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Status: EMAIL_PENDING               │
│  emailVerified: false                │
│  Send verification email             │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Recruiter clicks email link         │
│  /verify-email?token=xyz456          │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Backend verifies token              │
│  Updates: emailVerified = true       │
│  Status: PENDING_APPROVAL ⏳         │
│  (NOT auto-approved, requires admin) │
├──────────────────────────────────────┤
│  Send admin notification email       │
│  "New recruiter requires approval"   │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Show: "Email verified!"             │
│  "Awaiting administrator approval"   │
│  "You'll be notified when ready"     │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Admin reviews in admin panel        │
│  [Approve] [Reject]                  │
└───────────────┬──────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
    [APPROVE]        [REJECT]
        │                │
        ▼                ▼
   Status:           Status:
   APPROVED          REJECTED
        │                │
        ▼                ▼
   Email sent:        Email sent:
   "Approved"         "Rejected"
        │                │
        ▼                ▼
   Can login      Cannot login
```

---

### PLACEMENT_OFFICER Registration Flow

Same as Recruiter:
```
Register → Email Verification → Status: PENDING_APPROVAL → Admin Approves → Can Login
```

---

## Backend Implementation

### 1. Registration Endpoint (Updated)

```typescript
// backend/src/routes/auth.ts

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, collegeId, companyId, designation } = req.body;

    // Validate role
    if (role === 'ADMIN') {
      return res.status(403).json({ error: 'Admin registration not allowed' });
    }

    const allowedRoles = ['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with EMAIL_PENDING status
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        status: 'EMAIL_PENDING',      // ✅ Always start as EMAIL_PENDING
        emailVerified: false,          // ✅ Not verified yet
        emailVerificationToken,
        emailVerificationExpiry,
        collegeId: role !== 'RECRUITER' ? collegeId : null,
        companyId: role === 'RECRUITER' ? companyId : null,
        designation: role !== 'STUDENT' ? designation : null
      }
    });

    // ✅ Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify your Pragyan account',
      template: 'verification-email',
      data: {
        fullName,
        verificationLink,
        expiryHours: 24
      }
    });

    return res.status(201).json({
      message: 'Account created. Please verify your email to continue.',
      user: {
        id: user.id,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

---

### 2. Email Verification Endpoint (NEW)

```typescript
// backend/src/routes/auth.ts

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Find user with token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date()  // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token'
      });
    }

    // ✅ Determine next status based on role
    let newStatus = 'PENDING_APPROVAL'; // Default for recruiter/T&P
    if (user.role === 'STUDENT') {
      newStatus = 'APPROVED'; // Students auto-approved after email verification
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: newStatus,
        emailVerificationToken: null,     // Clear token
        emailVerificationExpiry: null
      }
    });

    // If PENDING_APPROVAL, notify admin
    if (newStatus === 'PENDING_APPROVAL') {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New ${user.role} registration awaiting approval`,
        template: 'admin-pending-approval',
        data: {
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          approvalLink: `${process.env.ADMIN_URL}/pending-approvals`
        }
      });
    }

    return res.json({
      message: newStatus === 'APPROVED'
        ? 'Email verified! You can now login.'
        : 'Email verified! Awaiting administrator approval.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});
```

---

### 3. Email Verification Link Endpoint (GET)

```typescript
// backend/src/routes/auth.ts

router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token and update status
    const result = await fetch(`${process.env.API_URL}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const data = await result.json();

    if (!result.ok) {
      // Redirect to /verify-email-failed with error
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email-failed?error=${data.error}`);
    }

    // Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/verify-email-success`);

  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/verify-email-failed`);
  }
});
```

---

### 4. Updated Login Endpoint

```typescript
// backend/src/routes/auth.ts

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ CHECK EMAIL VERIFICATION
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email address to login.',
        action: 'resend-verification'
      });
    }

    // ✅ CHECK ACCOUNT STATUS
    if (user.status === 'EMAIL_PENDING') {
      return res.status(403).json({
        error: 'Email verification pending',
        message: 'Please verify your email address.'
      });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({
        error: 'Account pending approval',
        message: 'Your account is awaiting administrator approval. Check your email for updates.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Account rejected',
        message: 'Your registration was not approved. Contact support.'
      });
    }

    // ✅ STATUS MUST BE APPROVED
    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Account not approved' });
    }

    // Generate JWT
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

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});
```

---

### 5. Resend Verification Email (NEW)

```typescript
// backend/src/routes/auth.ts

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // ✅ Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpiry
      }
    });

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify your Pragyan account',
      template: 'verification-email',
      data: {
        fullName: user.fullName,
        verificationLink,
        expiryHours: 24
      }
    });

    return res.json({
      message: 'Verification email sent. Check your inbox.'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});
```

---

## Frontend Implementation

### 1. Registration Page (Updated)

```typescript
// frontend/src/pages/register.tsx

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'verification-sent'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, email, password, role, collegeId, companyId, designation
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      // ✅ Show verification email sent message
      setStep('verification-sent');
      setEmail(email);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verification-sent') {
    return (
      <div className="register-container">
        <div className="success-card">
          <h2>✅ Registration Successful</h2>
          <p>We've sent a verification email to:</p>
          <p className="email-display">{email}</p>
          <p>Click the link in your email to verify your account and login.</p>
          <p className="small-text">
            Didn't receive the email? Check your spam folder or{' '}
            <button onClick={() => handleResendEmail()}>resend verification email</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <form onSubmit={handleRegister}>
        {/* Existing form fields */}
      </form>
    </div>
  );
}
```

---

### 2. Email Verification Page (NEW)

```typescript
// frontend/src/pages/verify-email.tsx

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSearchParams } from 'react-router-dom';

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, []);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
        return;
      }

      setStatus('success');
      setMessage(data.message);

      // Auto-redirect to login after 3 seconds
      setTimeout(() => setLocation('/login'), 3000);

    } catch (error) {
      setStatus('error');
      setMessage('Verification failed. Please try again.');
    }
  }

  return (
    <div className="verify-email-container">
      {status === 'loading' && (
        <div className="loading">
          <p>⏳ Verifying your email...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="success-message">
          <h2>✅ Email Verified!</h2>
          <p>{message}</p>
          <p>Redirecting to login...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error-message">
          <h2>❌ Verification Failed</h2>
          <p>{message}</p>
          <button onClick={() => setLocation('/login')}>Back to Login</button>
        </div>
      )}
    </div>
  );
}
```

---

### 3. Login Page (Updated)

```typescript
// frontend/src/pages/login.tsx

async function handleLogin(e: React.FormEvent) {
  try {
    const user = await login(email, password);

    // ✅ Check email verification
    if (!user.emailVerified) {
      setError('Please verify your email before logging in');
      setShowResendButton(true);
      return;
    }

    // Redirect based on role
    const redirectUrl = roleRedirects[user.role];
    setLocation(redirectUrl);

  } catch (err: any) {
    if (err.message.includes('Email not verified')) {
      setError('Please verify your email');
      setShowResendButton(true);
    } else if (err.message.includes('pending approval')) {
      setError('Your account is awaiting administrator approval');
    } else {
      setError('Login failed');
    }
  }
}
```

---

### 4. Resend Verification Email (NEW)

```typescript
// frontend/src/pages/resend-verification.tsx

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error);
        return;
      }

      setMessage('✅ Verification email sent. Check your inbox.');
      setEmail('');

    } catch (error) {
      setMessage('Failed to resend email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="resend-verification-container">
      <form onSubmit={handleResend}>
        <h2>Resend Verification Email</h2>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Resend Email'}
        </button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}
```

---

## Updated Prisma Migration

```bash
# Create migration with all changes
npx prisma migrate dev --name add_email_verification

# Output should include:
# - Add emailVerified field to User
# - Add emailVerificationToken field to User
# - Add emailVerificationExpiry field to User
# - Add EMAIL_PENDING status to AccountStatus enum
# - Add PENDING_APPROVAL status to AccountStatus enum
```

---

## Updated Login Status Messages

### Status: EMAIL_PENDING ⏳
```
❌ Email Not Verified

Please verify your email address to login.

[Resend Verification Email]
```

### Status: APPROVED ✅
```
✅ Login successful
Auto-redirect to dashboard
```

### Status: PENDING_APPROVAL ⏳
```
🔄 Account Pending Approval

Your account is awaiting administrator approval.
Check your email for updates.
```

### Status: REJECTED ❌
```
❌ Account Not Approved

Your registration was not approved.
Please contact support.
```

---

## Dashboard Access Matrix

| Role | Register | Email Verify | Admin Approval | Can Login |
|------|----------|--------------|----------------|-----------|
| STUDENT | ✅ | ✅ Required | ❌ Auto-approved | ✅ Yes |
| RECRUITER | ✅ | ✅ Required | ✅ Required | ✅ If approved |
| PLACEMENT_OFFICER | ✅ | ✅ Required | ✅ Required | ✅ If approved |
| ADMIN | ❌ Manual only | N/A | N/A | ✅ Yes |

---

## Email Templates

### Registration Confirmation Email

```
Subject: Verify your Pragyan account

Hello [fullName],

Thank you for registering with Pragyan!

To complete your registration, please verify your email by clicking the link below:

[Verification Link]

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
Pragyan Team
```

---

### Admin Notification Email

```
Subject: New Recruiter registration - Approval required

New Recruiter Registration:

Name: [fullName]
Email: [email]
Company: [company]
Registered: [date]

Review and approve/reject:
[Admin Approval Link]

Best regards,
Pragyan Team
```

---

## Security Checklist

- [ ] Email verification token is random (32 bytes)
- [ ] Token expires after 24 hours
- [ ] Token is cleared after successful verification
- [ ] emailVerified flag prevents login without verification
- [ ] Status prevents login without admin approval (for recruiters/T&P)
- [ ] Only APPROVED status allows JWT generation
- [ ] Email uniqueness enforced at database level
- [ ] Verification token sent securely via email only
- [ ] No verification token in JWT or localStorage
- [ ] Password hashed with bcrypt
- [ ] Rate limiting on verify-email endpoint (prevent brute force)

---

## Complete Registration Status States

```
USER REGISTRATION JOURNEY:

1. USER SUBMITS FORM
   ↓
2. BACKEND CREATES USER
   status = EMAIL_PENDING
   emailVerified = false
   ↓
3. SEND VERIFICATION EMAIL
   Token valid for 24 hours
   ↓
4. USER CLICKS EMAIL LINK
   ↓
5. VERIFY TOKEN & UPDATE:
   
   IF STUDENT:
     status = APPROVED
     emailVerified = true
     ↓
     User can login immediately
   
   IF RECRUITER/T&P:
     status = PENDING_APPROVAL
     emailVerified = true
     ↓
     Admin notified
     User cannot login yet
     ↓
     Admin approves/rejects
     ↓
     IF APPROVED: User can login
     IF REJECTED: User cannot login
```

---

## Why Email Verification First

✅ **Prevents spam signups** - Reduces fake accounts  
✅ **Validates email ownership** - User actually owns the email  
✅ **Professional standard** - All SaaS platforms do this  
✅ **Compliance ready** - Many regulations require it  
✅ **Phased approval** - Email first, then admin approval for privileged roles  
✅ **Better UX** - Clear, step-by-step process  

---

**Document:** PHASE_2_EMAIL_VERIFICATION.md  
**Date:** July 14, 2026  
**Status:** LOCKED & REQUIRED FOR PHASE 2  
**Next:** Update PHASE_2_TASKS.md to include email verification steps
