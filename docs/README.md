# Pragyan Documentation

**Version:** 0.1.0-auth-core  
**Last Updated:** July 14, 2026  
**Status:** Authentication Core Frozen

---

## Quick Navigation

### For Developers

- **[Architecture Overview](./ARCHITECTURE.md)** — System design, module layout, request flow
- **[API Documentation](./API.md)** — All endpoints, authentication, error codes
- **[Database Schema](./DATABASE.md)** — Models, relationships, queries, indexes
- **[Security Guidelines](./SECURITY.md)** — Threat model, cryptography, audit logging

### For Architects

- **[Architecture Decision Records (ADRs)](./adr/README.md)** — Design decisions with rationale
  - [ADR-001: Authentication Core](./adr/ADR-001-authentication-core-architecture.md)
  - [ADR-002: Role-Based Activation](./adr/ADR-002-role-based-activation.md)
  - [ADR-003: Token Strategy](./adr/ADR-003-token-strategy.md)
  - [ADR-004: Event-Driven Design](./adr/ADR-004-event-driven-design.md)

### For DevOps

- **[Deployment Guide](./deployment/README.md)** (coming soon)
  - Environment setup
  - Database migration
  - Scaling strategy

### For Project Managers

- **[Release Notes](./releases/v0.1.0.md)** — Authentication Core release
- **[Roadmap](./roadmap/README.md)** — Upcoming phases and timeline

---

## Project Status

### Phase 2: Authentication (Current)

**Status:** 🟡 In Progress — Core Frozen, Units 6-9 Remaining

#### Completed (Frozen)

```
Unit 1: Database Schema
├─ User, RefreshToken, VerificationToken, AuditLog
├─ Organization, Role, Permission
└─ StudentProfile, RecruiterProfile, PlacementOfficerProfile

Unit 2: GET /auth/me
├─ MeService, UserRepository
├─ Role-aware response
└─ Authorization checks

Unit 3: POST /auth/register
├─ RegisterService, email verification
├─ Role detection, transaction handling
├─ TokenPurpose enum (EMAIL_VERIFY, etc.)
└─ Event publishing (UserRegistered)

Unit 4: GET /auth/verify-email
├─ VerifyEmailService
├─ Role-based activation (STUDENT→ACTIVE, others→PENDING)
├─ Token consumption
└─ Event publishing (EmailVerified)

Unit 5: POST /auth/login
├─ LoginService with comprehensive security
├─ JWT generation (stateless, 24h)
├─ Refresh token creation (stateful, 30d, hashed)
├─ Device metadata, family tracking
├─ Rate limiting (5 attempts, 15-min lockout)
├─ Audit logging with structured failure reasons
└─ Event publishing (LoginSuccess/LoginFailed)

Security Hardening (Production)
├─ Hash refresh tokens (SHA256)
├─ Device metadata (deviceId, ipAddress, userAgent)
├─ Token family tracking (familyId for session isolation)
├─ Token reuse detection (security incident on reuse)
├─ Last login metadata (lastLoginIp, lastLoginUserAgent)
├─ Configurable security limits (ENV_CONSTANTS)
└─ JWT versioning (ver field for forward compatibility)
```

#### In Progress (Units 6-9)

```
Unit 6: POST /auth/refresh
├─ Token rotation (delete old, create new)
├─ Preserve familyId
└─ Multi-device session support

Unit 7: POST /auth/logout
├─ Single-device logout
├─ All-devices logout (revokeFamily)
└─ Audit trail

Unit 8: POST /auth/forgot-password
├─ Generate PASSWORD_RESET token
├─ Send reset link via email
└─ Event publishing

Unit 9: POST /auth/reset-password
├─ Consume PASSWORD_RESET token
├─ Hash new password
├─ Revoke all refresh tokens (force re-login)
└─ Event publishing
```

### Upcoming Phases

**Phase 3:** Roadmap CMS (learning paths, topics, lessons, resources, quizzes, progress engine)  
**Phase 4:** Learning Engine (XP, streaks, certificates, analytics)  
**Phase 5:** Recruitment (company portal, jobs, applications, hiring drives)  
**Phase 6:** Placement (T&P dashboard, reports, analytics)  
**Phase 7:** AI Layer (career mentor, roadmap generation, recommendations)

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### Environment Setup

```bash
# backend/.env
JWT_SECRET=<32+ random characters>
DATABASE_URL=mongodb://...
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Optional (defaults shown)
LOGIN_MAX_FAILED_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION_MIN=15
EMAIL_VERIFICATION_EXPIRY_MIN=1440
REFRESH_TOKEN_EXPIRY_DAYS=30
```

### Running Tests

```bash
npm run test                    # All tests
npm run test:auth             # Auth module only
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

### Building

```bash
npm run build                 # TypeScript compilation
npm run lint                  # ESLint check
npm run format               # Prettier format
npm run format:check         # Prettier check
```

---

## Architecture Snapshot

```
Client (React/Next.js)
        ↓ HTTPS
Express.js Backend
├─ Controllers (HTTP layer)
├─ Services (Business logic)
├─ Repositories (Data access)
├─ Middleware (Auth, validation, error handling)
└─ Event Bus (Pub/sub for modules)
        ↓
MongoDB
├─ User, RefreshToken, VerificationToken
├─ AuditLog, Organization
└─ StudentProfile, RecruiterProfile, etc.
```

---

## Key Concepts

### JWT (Access Token)

- Stateless, signed with JWT_SECRET
- 24-hour expiration
- Contains: userId, role, org, ver, iat, exp
- Use for: Fast authentication (no DB lookup)
- Verifies: HS256 signature, expiration, version

### Refresh Token

- Stateful, stored in MongoDB (hashed SHA256)
- 30-day expiration
- Contains: tokenHash, familyId, userId, device metadata
- Use for: Obtaining new access token
- Verifies: Hash match, not revoked, not expired

### Verification Token

- Stateful, stored in MongoDB (hashed SHA256)
- 24-hour expiration (configurable)
- Contains: tokenHash, userId, purpose, usedAt
- Use for: Email verification, password reset
- Verifies: Hash match, not used, not expired, purpose match

### Token Family

- Groups related refresh tokens from same login session
- Each device gets new token, same familyId
- On refresh: Delete old token, create new token (same family)
- On theft: Revoke entire family (all devices logged out)

### Account Status

| Status | Meaning | Can Login? |
|--------|---------|-----------|
| EMAIL_PENDING | Waiting for email verification | No |
| ACTIVE | Verified and approved | Yes |
| PENDING | Verified, waiting admin approval | No |
| REJECTED | Application rejected | No |
| SUSPENDED | Banned from platform | No |

### User Roles

| Role | Purpose | Activation |
|------|---------|-----------|
| STUDENT | Learning platform user | ACTIVE (immediate) |
| RECRUITER | Hiring company contact | PENDING (admin approval) |
| PLACEMENT_OFFICER | College placement staff | PENDING (admin approval) |
| ADMIN | Platform administrator | Manual provision |

---

## Security Highlights

### Password Hashing

- bcryptjs with cost=12
- ~100ms per hash (intentional slowness)
- Resistant to GPU/ASIC attacks

### Token Hashing

- Refresh tokens: SHA256 (one-way), never stored raw
- Verification tokens: SHA256 (one-way), never stored raw
- Raw tokens returned once to user, then only hash stored

### Rate Limiting

- 5 failed login attempts → 15-minute lockout
- Configurable via LOGIN_SECURITY_CONSTANTS
- In-memory for now, Redis for production

### Audit Logging

- Every authentication action logged
- Structured failure reasons (USER_NOT_FOUND, INVALID_PASSWORD, etc.)
- IP, User-Agent, Device ID tracked
- 90-day retention (configurable)

### Multi-Device Support

- Each device gets own refresh token
- Same token family groups them
- Logout can be per-device or all-devices
- Token reuse detection per family

---

## Common Tasks

### Add a New API Endpoint

1. Define schema (Zod) in `src/modules/auth/schemas/`
2. Create controller method in `src/modules/auth/controllers/`
3. Create service method in `src/modules/auth/services/`
4. Add route in `src/modules/auth/routes.ts`
5. Document in `docs/API.md`

### Modify the Database Schema

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name <description>`
3. Test locally: `npm run test`
4. Update `docs/DATABASE.md`
5. Document in ADR if architectural change

### Add Event Listener

1. Inject EventBus into service constructor
2. Call `eventBus.subscribe('event.name', handler)`
3. Implement handler function
4. Test event flow

### Debug Production Issue

1. Check audit logs (AuditLog table)
2. Look for LoginFailed with failureReason
3. Check device metadata (IP, User-Agent)
4. Review JWT version (is it outdated token?)
5. Check rate limiting (is user throttled?)

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Token Expired | Access token > 24h old | Call `/auth/refresh` |
| 401 Invalid Token | JWT signature mismatch | Check JWT_SECRET |
| 429 Too Many Attempts | Failed logins > 5 in 15 min | Wait or reset manually |
| 403 Account Pending | Awaiting admin approval | Admin must approve |
| 400 Email Already Exists | User with email exists | Use different email |
| 400 Invalid Email | Email fails Zod validation | Check email format |

---

## Glossary

| Term | Definition |
|------|-----------|
| **JWT** | JSON Web Token (stateless, signed assertion) |
| **Refresh Token** | Long-lived token used to get new access token |
| **Access Token** | Short-lived JWT used to call protected APIs |
| **Token Family** | Group of refresh tokens from same login session |
| **Verification Token** | One-time token for email confirmation or password reset |
| **familyId** | UUID grouping related refresh tokens |
| **tokenHash** | SHA256 hash of token (never store raw) |
| **Account Status** | User's current state (ACTIVE, PENDING, etc.) |
| **Role** | User type (STUDENT, RECRUITER, etc.) |
| **Organization** | Company or college (multi-tenant scoping) |

---

## Support

### Issue Report

- Check [Common Errors](#common-errors) above
- Review [Security Guidelines](./SECURITY.md)
- Check [ADRs](./adr/) for design context
- Check GitHub issues (or internal ticket system)

### Contributing

- Follow [Architecture Decision Records](./adr/) when adding features
- Write tests for all new endpoints
- Update documentation in `docs/`
- Follow code style (ESLint + Prettier)

---

## References

- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [JWT (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated:** July 14, 2026  
**Maintained By:** Pragyan Architecture Team  
**Status:** In Production (Phase 2)
