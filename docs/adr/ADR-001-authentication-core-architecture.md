# ADR-001: Authentication Core Architecture

**Date:** July 14, 2026  
**Status:** ACCEPTED  
**Phase:** 2 (Authentication)

---

## Context

Pragyan requires a scalable, secure authentication system supporting:
- Multiple user roles (Student, Recruiter, Placement Officer, Admin)
- Multi-device sessions
- Email verification
- Password reset flows
- Session management
- Audit logging
- Rate limiting

Key constraints:
- No external auth providers initially (DIY OAuth2)
- Multi-tenant support (organization scoping)
- Security-first (prevent token theft, detect anomalies)
- Maintainability (minimize future changes)

---

## Decision

Implement authentication as a **frozen core module** with:

1. **Stateless Access Tokens (JWT)**
   - Format: JWT with fields { userId, role, org, ver, iat, exp }
   - Duration: 24 hours
   - Algorithm: HS256 (HMAC-SHA256)
   - Purpose: Fast, cacheable, doesn't require DB lookup

2. **Stateful Refresh Tokens**
   - Format: Cryptographic random token
   - Storage: MongoDB (hashed SHA256)
   - Duration: 30 days
   - Purpose: Rotate access tokens, detect theft

3. **Token Families (Session Tracking)**
   - Every refresh token belongs to a `familyId` (UUID)
   - Multi-device support: Each device has its own token in same family
   - Theft detection: If old token reused → revoke entire family
   - Enables: Logout all devices, per-device logout

4. **Verification Tokens (One-Time Use)**
   - Email verification links
   - Password reset links
   - Future: Invitations, magic login
   - Storage: MongoDB (hashed SHA256)
   - Purpose: Prevent token reuse, limit lifespan

5. **Role-Based Activation**
   - STUDENT: EMAIL_VERIFIED → ACTIVE (immediate)
   - RECRUITER/PLACEMENT_OFFICER: EMAIL_VERIFIED → PENDING (await admin)
   - ADMIN: Manually provisioned
   - Purpose: Balance UX (students) with security (recruiters)

6. **Structured Audit Logging**
   - Every login attempt logged (success/failure)
   - Failure reasons: enum (USER_NOT_FOUND, INVALID_PASSWORD, THROTTLED, etc.)
   - Metadata: IP, User-Agent, Device ID, Timestamp
   - Purpose: Forensics, analytics, anomaly detection

---

## Alternatives Considered

### 1. OAuth2 / External Auth
**Rejected:** Complexity, external dependency, harder to customize roles

### 2. Session Tokens (All Stateful)
**Rejected:** Doesn't scale (DB lookup per request), no multi-device support

### 3. All Stateless (No Refresh Token)
**Rejected:** No way to revoke sessions, can't detect theft

### 4. Refresh Tokens Without Family
**Rejected:** Can't isolate theft to single device, must log out everywhere

### 5. Free-Text Audit Logs
**Rejected:** Hard to query, analyze, or detect anomalies

### 6. Immediate ACTIVE for All Roles
**Rejected:** Security risk (recruiters could spam, impersonate)

---

## Consequences

### Positive

✅ **No DB lookup for every request** — JWT is stateless, fast  
✅ **Multi-device sessions** — Family-based isolation and per-device control  
✅ **Theft detection** — Reuse of old token triggers incident  
✅ **Audit trail** — Every action logged with structured reason  
✅ **Scalable** — No state server needed, works with multiple backends  
✅ **Flexible role activation** — Can adjust per-role requirements  
✅ **Type-safe** — Enums for roles, purposes, failure reasons  
✅ **Immutable after freeze** — Clear contract for consuming modules  

### Negative

❌ **Token revocation delay** — Logout doesn't invalidate access token until expiry  
   *Mitigation:* Token blacklist (cache) if needed later  

❌ **No XSession table** — Session metadata stored only in RefreshToken  
   *Mitigation:* Sufficient for MVP, add if needed for analytics  

❌ **Rate limiting in-memory** — Doesn't survive process restart  
   *Mitigation:* Move to Redis in production  

---

## Implementation Details

### Models

```
User
├── id (UUID)
├── email (unique)
├── password (bcryptjs, cost=12)
├── fullName
├── userRole (enum: STUDENT, RECRUITER, PLACEMENT_OFFICER, ADMIN)
├── accountStatus (enum: EMAIL_PENDING, ACTIVE, PENDING, REJECTED, SUSPENDED)
├── lastLoginAt, lastLoginIp, lastLoginUserAgent
└── createdAt, updatedAt

RefreshToken
├── id (UUID)
├── tokenHash (SHA256, unique)
├── familyId (UUID, same for rotated tokens)
├── userId (FK)
├── expiresAt
├── revokedAt (null=valid, set=revoked)
├── deviceId, ipAddress, userAgent, lastUsedAt
└── createdAt, updatedAt

VerificationToken
├── id (UUID)
├── tokenHash (SHA256, unique)
├── userId (FK)
├── purpose (enum: EMAIL_VERIFY, PASSWORD_RESET, INVITATION, MAGIC_LOGIN, EMAIL_CHANGE)
├── expiresAt
├── usedAt (null=unused, set=consumed)
└── createdAt, updatedAt

AuditLog
├── id (UUID)
├── targetUserId, performedByUserId, organizationId
├── action (enum: USER_REGISTERED, EMAIL_VERIFIED, LOGIN, etc.)
├── status (SUCCESS, FAILURE)
├── failureReason (enum or null)
├── ipAddress, userAgent
└── createdAt (index)
```

### Services

```
RegisterService.register(email, password, role)
├─ Validate input
├─ Check email not exists
├─ Hash password (bcryptjs)
├─ Create user (accountStatus=EMAIL_PENDING)
├─ Generate verification token
├─ Publish UserRegistered event
└─ Return { email, message }

VerifyEmailService.verify(token)
├─ Hash token, find verification token
├─ Check not expired, not used
├─ Mark usedAt
├─ Update user.accountStatus (role-based)
├─ Publish EmailVerified event
└─ Return { message, accountStatus }

LoginService.login(email, password, ip, userAgent)
├─ Check throttle (5 attempts, 15-min lockout)
├─ Find user by email
├─ Verify email verified (or return EMAIL_NOT_VERIFIED)
├─ Check accountStatus (ACTIVE or return ACCOUNT_PENDING)
├─ Compare password (bcryptjs)
├─ Generate JWT access token
├─ Generate refresh token (hashed, new familyId)
├─ Update lastLogin metadata
├─ Log SUCCESS to audit
├─ Publish LoginSuccess event
└─ Return { accessToken, refreshToken, user }

RefreshService.rotate(oldToken, ip, userAgent)
├─ Hash oldToken, find refresh token
├─ Check not expired, not revoked
├─ Get familyId
├─ Generate new access token
├─ Generate new refresh token (same familyId)
├─ Delete old refresh token
├─ Return { accessToken, refreshToken }

LogoutService.logout(refreshToken, logoutAllDevices)
├─ Hash refreshToken, find token
├─ If logoutAllDevices: revoke entire familyId
├─ Else: revoke single token (set revokedAt)
├─ Publish LogoutSuccess event
└─ Return { message }

PasswordService.requestReset(email)
├─ Find user by email
├─ Generate PASSWORD_RESET verification token
├─ Publish PasswordResetRequested event
└─ Return { message }

PasswordService.reset(token, newPassword)
├─ Hash token, find verification token
├─ Check not expired, not used
├─ Check purpose = PASSWORD_RESET
├─ Mark usedAt
├─ Hash new password
├─ Update user.password
├─ Revoke all refresh tokens (force re-login)
├─ Publish PasswordResetCompleted event
└─ Return { message }
```

### Constants

```
JWT_CONSTANTS
├─ SECRET: env.JWT_SECRET
├─ ACCESS_TOKEN_EXPIRY: 24h
├─ REFRESH_TOKEN_EXPIRY: 30d
├─ ALGORITHM: HS256
└─ VERSION: 1

LOGIN_SECURITY_CONSTANTS
├─ MAX_FAILED_ATTEMPTS: 5
├─ LOCKOUT_DURATION_MIN: 15
└─ Can be overridden via env

EMAIL_VERIFICATION_CONSTANTS
├─ TOKEN_EXPIRY_MIN: 24h
├─ MAX_ATTEMPTS_PER_EMAIL: 5
└─ Can be overridden via env
```

---

## Migration Path

### From Authentication Core (v0.1.0) to Complete (v0.2.0)

1. **Unit 6:** RefreshService (token rotation)
2. **Unit 7:** LogoutService (session revocation)
3. **Unit 8:** PasswordService.requestReset()
4. **Unit 9:** PasswordService.reset()
5. **Tag:** v0.2.0-auth-complete
6. **Freeze:** No further auth changes (consume-only)

---

## Future Considerations

### Optional Enhancements (Post-Freeze)

- **Email as 2FA:** Add MFA service, TOTP tokens
- **Social Login:** Add OAuth2 providers (Google, GitHub)
- **Sessions Dashboard:** Let users see & revoke devices
- **IP Allowlist:** Restrict login to known IPs
- **Anomaly Detection:** ML-based login pattern analysis
- **Token Blacklist:** Redis-based revocation cache

### When to Revisit

Only if:
- Critical security bug discovered
- Regulatory requirement (GDPR, SOC2, etc.)
- Scalability issue (JWT size, Redis budget, etc.)

Otherwise: **Authentication is read-only.** All future modules consume it.

---

## References

- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 6234 - Cryptographic Hash Functions](https://tools.ietf.org/html/rfc6234)

---

**Approved by:** Architecture Review  
**Implementation Status:** Units 1-5 Complete, Units 6-9 In Progress
