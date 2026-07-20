# Pragyan Security Guidelines

**Version:** 0.1.0  
**Last Updated:** July 14, 2026  
**Classification:** Internal

---

## Overview

This document outlines Pragyan's security architecture, threat model, and mitigation strategies.

---

## Threat Model

### High-Risk Threats (Mitigated)

1. **Account Takeover via Password Compromise**
   - **Threat:** Attacker gets password (phishing, breach, brute force)
   - **Impact:** Full account access
   - **Mitigations:**
     - Bcryptjs hashing (cost=12, ~100ms per verify)
     - Rate limiting (5 failed attempts → 15-min lockout)
     - Password strength requirements (Phase 3+)
     - Audit logging (all attempts)
   - **Status:** ✅ Implemented (Unit 5)

2. **Token Theft via Database Breach**
   - **Threat:** Attacker accesses MongoDB, steals refresh tokens
   - **Impact:** Hijack sessions without credentials
   - **Mitigations:**
     - Hash refresh tokens (SHA256, one-way)
     - Hash verification tokens (SHA256, one-way)
     - Separate auth database (future)
     - Database encryption at rest (MongoDB Atlas default)
   - **Status:** ✅ Implemented (Units 3-5)

3. **Session Hijacking via Token Reuse**
   - **Threat:** Attacker intercepts refresh token, uses it
   - **Impact:** Impersonate user
   - **Mitigations:**
     - Token family tracking (detect reuse, revoke family)
     - Device fingerprinting (IP, User-Agent)
     - Anomaly detection (future)
     - Short refresh token lifespan (30 days)
   - **Status:** ✅ Implemented (Unit 5)

4. **Unauthorized API Access**
   - **Threat:** Attacker calls protected endpoints without token
   - **Impact:** Leak private data
   - **Mitigations:**
     - JWT validation on all protected endpoints
     - Role-based authorization (requirePermission)
     - Signature verification (HS256)
     - Token expiration (24h access, 30d refresh)
   - **Status:** ✅ Implemented (Unit 5)

### Medium-Risk Threats (Partial Mitigation)

5. **Brute Force Email Enumeration**
   - **Threat:** Attacker tries many emails on /auth/register to find valid accounts
   - **Impact:** Enumerate user base
   - **Mitigations:**
     - Rate limiting on /auth/register (10 req/hour)
     - Generic error messages ("Account exists or email invalid")
     - CAPTCHA (Phase 3+)
   - **Status:** ⚠️ Partial (rate limiting only)

6. **Email Interception**
   - **Threat:** Attacker intercepts email verification link
   - **Impact:** Hijack account during signup
   - **Mitigations:**
     - HTTPS enforcement (on frontend & backend)
     - Short token expiry (24h)
     - One-time use (consume on verification)
     - Token hashing
   - **Status:** ✅ Implemented (Unit 4)

7. **Replay Attack**
   - **Threat:** Attacker replays captured HTTP request
   - **Impact:** Perform action twice (e.g., change password twice)
   - **Mitigations:**
     - HTTPS only (no HTTP)
     - CSRF tokens (Phase 3+)
     - Idempotency keys (Phase 3+)
     - Short token expiry
   - **Status:** ⚠️ Partial (HTTPS only)

### Low-Risk Threats (Accepted)

8. **Man-in-the-Middle (MITM) on HTTPS**
   - **Threat:** Attacker performs MITM despite HTTPS
   - **Impact:** Intercept credentials/tokens
   - **Mitigations:** HSTS header (Phase 3+), Certificate pinning (mobile, Phase 5+)
   - **Status:** 🟡 Accepted risk (unlikely with HTTPS)

9. **Side-Channel Attack on Password Hash**
   - **Threat:** Time analysis of bcryptjs reveals password length
   - **Impact:** Minor (attackers already know likely lengths)
   - **Mitigations:** Constant-time comparison (bcryptjs default)
   - **Status:** 🟡 Accepted risk (acceptable)

---

## Cryptography

### Password Hashing

```typescript
import bcryptjs from 'bcryptjs';

// Hash
const salt = await bcryptjs.genSalt(12);
const passwordHash = await bcryptjs.hash(password, salt);
// ~100ms per hash (intentional slowness)

// Verify
const isValid = await bcryptjs.compare(password, passwordHash);
```

**Why bcryptjs:**
- Cost-tunable (12 = ~100ms, can increase with faster hardware)
- Resistant to GPU/ASIC attacks (requires memory)
- Battle-tested (used by Django, Ruby Rails, etc.)
- No secrets in code (salt derived from hash)

### Token Hashing (Refresh & Verification)

```typescript
import crypto from 'crypto';

// Hash
const token = crypto.randomBytes(32).toString('hex');
const hash = crypto.createHash('sha256').update(token).digest('hex');
// Instant (one-way)

// Verify
const incomingToken = req.body.refreshToken;
const computedHash = crypto.createHash('sha256').update(incomingToken).digest('hex');
const found = await db.refreshToken.findUnique({ where: { tokenHash: computedHash } });
```

**Why SHA256:**
- Fast (for verification path, not storage)
- One-way (can't reverse hash to get token)
- Industry standard (OAuth2, JWT signing, TLS)
- Collision-resistant (for this use case)

**Note:** SHA256 ≠ bcryptjs for passwords (different threat model)
- Passwords: Need cost/slowness → bcryptjs
- Tokens: Need one-way + speed → SHA256

### JWT Signing

```typescript
import jwt from 'jsonwebtoken';

// Sign
const token = jwt.sign(
  {
    userId: user.id,
    role: user.userRole,
    org: user.organizationId,
    ver: 1
  },
  process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '24h' }
);

// Verify
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Why HS256:**
- Symmetric (shared secret, fine for single service)
- Fast (no public key lookups)
- Industry standard (most JWTs use HS256)

**Note:** Could upgrade to RS256 if services multiply (public key distribution)

---

## Data Protection

### In Transit

- **HTTP to HTTPS:** Enforced via redirect (set in `.env`)
- **CORS:** Whitelist origins (set in `.env`)
- **TLS Version:** 1.2+ (enforced by Node.js default)

### At Rest

- **Database:** MongoDB Atlas with encryption at rest (default)
- **Secrets:** Never committed (use `.env`, not `.env.example`)
- **Backups:** Daily, encrypted, 30-day retention

### In Memory

- **Passwords:** Immediately hashed, never logged
- **Raw tokens:** Returned once, not logged
- **Secrets:** Keep in environment variables, not hardcoded

---

## Authentication Flow Security

### Login Sequence

```
1. User submits email + password
   └─ HTTPS only, no logging of password

2. Backend verifies rate limit
   └─ Check: < 5 failures in last 15 min
   └─ If throttled: Return 429, don't check password

3. Backend hashes incoming password, compares
   └─ Uses bcryptjs.compare (constant-time)
   └─ Fails silently (generic error message)

4. Backend verifies email verified
   └─ Check: accountStatus = ACTIVE

5. Backend verifies account not suspended
   └─ Check: accountStatus != SUSPENDED

6. Backend generates JWT (stateless, 24h)
   └─ Contains: userId, role, org, ver, iat, exp
   └─ Signed with JWT_SECRET

7. Backend generates refresh token (stateful, 30d)
   └─ Create random 32-byte token
   └─ Store: SHA256(token) + familyId + metadata
   └─ Return: raw token to user (one-time)

8. Backend updates user metadata
   └─ Set: lastLoginAt, lastLoginIp, lastLoginUserAgent

9. Backend logs to audit trail
   └─ Record: LOGIN action, SUCCESS status, IP, User-Agent

10. Backend publishes LoginSuccess event
    └─ Trigger: Analytics, notifications, etc.

11. Return to user
    └─ accessToken (JWT)
    └─ refreshToken (raw, will be hashed if stored elsewhere)
    └─ user { id, email, role, etc. }
```

### Token Validation Sequence

```
1. User sends request with Authorization: Bearer <accessToken>
   
2. Middleware extracts token
   └─ Parse: Authorization header

3. Middleware verifies signature
   └─ Check: HS256 signature matches
   └─ If invalid: Return 401 Unauthorized

4. Middleware verifies not expired
   └─ Check: exp claim > now
   └─ If expired: Return 401 Token Expired

5. Middleware verifies version compatibility
   └─ Check: ver field matches known versions
   └─ If unknown: Return 401 Unsupported Token Version

6. Middleware extracts user info
   └─ Parse: userId, role, org from payload

7. Middleware attaches to request
   └─ req.user = { userId, role, org, ... }

8. Endpoint executes with user context
   └─ Can access: req.user.userId, req.user.role, etc.

9. Optional: Check permissions
   └─ requirePermission('RECRUITER', 'ADMIN')
   └─ If role not allowed: Return 403 Forbidden
```

---

## Rate Limiting

### Implemented

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| POST /auth/login | 5 failed | 15 min | Prevent brute force |
| POST /auth/register | 10 | 1 hour | Prevent enumeration |

### Implementation

```typescript
// LoginThrottleService
class LoginThrottleService {
  private failures: Map<string, { count: number; resetAt: Date }> = new Map();
  
  checkThrottle(email: string): boolean {
    const record = this.failures.get(email);
    
    if (!record) return true;  // First attempt
    
    if (Date.now() > record.resetAt.getTime()) {
      this.failures.delete(email);  // Window expired
      return true;
    }
    
    if (record.count >= 5) return false;  // Throttled
    
    return true;
  }
  
  recordFailure(email: string) {
    const record = this.failures.get(email);
    
    if (!record) {
      this.failures.set(email, {
        count: 1,
        resetAt: new Date(Date.now() + 15 * 60 * 1000)
      });
    } else {
      record.count++;
    }
  }
}
```

### Future

- Redis backend (survive restart)
- Global rate limiting (across all endpoints)
- Per-IP rate limiting (distributed attacks)
- CAPTCHA integration

---

## Input Validation

### Schemas (Zod)

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100),
  role: z.enum(['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER']),
  collegeCode: z.string().optional()
});
```

### Validation Points

- HTTP request body (before processing)
- Database query parameters (prevent injection)
- JWT payload (verify expected fields)
- Environment variables (at startup)

---

## Audit Logging

### What's Logged

| Event | Fields | Sensitivity |
|-------|--------|-------------|
| USER_REGISTERED | email, role, ip, timestamp | Sensitive |
| EMAIL_VERIFIED | userId, email, ip, timestamp | Sensitive |
| LOGIN (success) | userId, email, role, ip, userAgent, timestamp | Sensitive |
| LOGIN (failure) | email, reason, ip, timestamp | Sensitive |
| LOGOUT | userId, email, ip, timestamp | Sensitive |
| PASSWORD_RESET_REQUESTED | email, ip, timestamp | Sensitive |
| PASSWORD_RESET_COMPLETED | userId, email, ip, timestamp | Sensitive |

### What's NOT Logged

- ❌ Passwords (never, hash only)
- ❌ Raw tokens (never, hash only)
- ❌ JWT secrets (never, env only)
- ❌ Database connection strings (never, env only)

### Retention

- 90 days (can change in `.env`)
- Automatic cleanup (cron job, Phase 3+)

---

## Error Messages

### Safe (User-Facing)

```
"Invalid email or password"     // Not: "User not found"
"Account pending approval"      // Not: "Recruiter status"
"Too many login attempts"       // Shows throttling, not details
"Email verification expired"    // Generic, not timestamp
```

### Unsafe (Never Use)

```
❌ "User not found: john@example.com"        // Email enumeration
❌ "Verification token invalid: xyz"         // Token info leak
❌ "Database error: connection refused"      // Infra details
❌ "JWT secret is wrong"                     // Secret leak hint
```

---

## Environment Variables

### Required

```
JWT_SECRET                              # Signing key (min 32 chars)
DATABASE_URL                            # MongoDB connection
NODE_ENV                                # 'production' or 'development'
```

### Configurable (Security)

```
LOGIN_MAX_FAILED_ATTEMPTS               # Default: 5
LOGIN_LOCKOUT_DURATION_MIN              # Default: 15
EMAIL_VERIFICATION_EXPIRY_MIN           # Default: 1440 (24h)
PASSWORD_RESET_EXPIRY_MIN               # Default: 60
REFRESH_TOKEN_EXPIRY_DAYS               # Default: 30
```

### Optional

```
CORS_ORIGIN                             # Default: http://localhost:3000
CORS_CREDENTIALS                        # Default: true
LOG_LEVEL                               # Default: info
```

---

## Security Checklist

### Before Deploy to Production

- [ ] JWT_SECRET is 32+ random characters
- [ ] NODE_ENV = 'production'
- [ ] HTTPS enforced (redirect HTTP)
- [ ] CORS whitelist configured (no '*')
- [ ] Database backups enabled
- [ ] Database user has minimal privileges
- [ ] Logs don't contain secrets (audit)
- [ ] Rate limiting tested
- [ ] Password requirements enforced
- [ ] Error messages sanitized (no details)
- [ ] Security headers configured (HSTS, CSP)
- [ ] Dependencies up-to-date (npm audit)
- [ ] Database encryption at rest enabled
- [ ] 2FA implemented (Phase 3+)
- [ ] WAF configured if behind load balancer

### Ongoing

- [ ] Monitor failed login attempts (anomaly detection)
- [ ] Review audit logs (weekly)
- [ ] Update dependencies (monthly)
- [ ] Rotate JWT_SECRET (annually or on compromise)
- [ ] Penetration testing (annually)
- [ ] Security training for team

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [JWT Best Practices (RFC 8725)](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines (SP 800-63B)](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

See also:
- [Architecture Decision Records](./adr/README.md)
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
