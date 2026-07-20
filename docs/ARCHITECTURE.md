# Pragyan Architecture Overview

**Version:** 0.1.0-auth-core  
**Last Updated:** July 14, 2026  
**Status:** Authentication Core Frozen

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js Backend (Node.js)                │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  Controllers  →  Services  →  Repositories         │  │
│  │       ↓             ↓               ↓               │  │
│  │  HTTP Req     Business Logic    DB Queries         │  │
│  │                                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │              Middleware Layer                        │  │
│  │  ├─ Auth (requireAuth, requirePermission)          │  │
│  │  ├─ Validation (Zod schemas)                       │  │
│  │  ├─ Error Handling (asyncHandler)                  │  │
│  │  ├─ Logging (Winston)                              │  │
│  │  └─ Rate Limiting (LoginThrottleService)           │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Prisma ORM + MongoDB                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Event Bus (EventBus)                         │  │
│  │  ├─ auth.user.registered                           │  │
│  │  ├─ auth.email.verification_requested              │  │
│  │  ├─ auth.email.verified                            │  │
│  │  ├─ auth.login.success / .failed                   │  │
│  │  └─ [Future events]                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Authentication Module (Phase 2)

```
Auth Module
├── Controllers
│   ├── POST /auth/register
│   ├── GET /auth/verify-email
│   ├── POST /auth/login
│   ├── POST /auth/refresh (Unit 6)
│   ├── POST /auth/logout (Unit 7)
│   ├── POST /auth/forgot-password (Unit 8)
│   ├── POST /auth/reset-password (Unit 9)
│   └── GET /auth/me
│
├── Services
│   ├── RegisterService
│   ├── VerifyEmailService
│   ├── LoginService
│   ├── RefreshService (Unit 6)
│   ├── LogoutService (Unit 7)
│   ├── PasswordService (Units 8-9)
│   ├── MeService
│   ├── AccountActivationService
│   └── LoginThrottleService
│
├── Repositories
│   ├── UserRepository
│   ├── RefreshTokenRepository
│   ├── VerificationTokenRepository
│   ├── AuditRepository
│   └── [OrganizationRepository, etc.]
│
├── Middleware
│   ├── requireAuth
│   ├── requirePermission
│   └── validateInput
│
├── Constants
│   ├── JWT_CONSTANTS
│   ├── LOGIN_SECURITY_CONSTANTS
│   └── EMAIL_VERIFICATION_CONSTANTS
│
├── Errors
│   ├── TokenRequiredError
│   ├── InvalidTokenError
│   └── [Custom errors]
│
└── Events
    ├── UserRegistered
    ├── EmailVerificationRequested
    ├── EmailVerified
    ├── LoginSuccess / LoginFailed
    └── [Future events]
```

---

## Request Flow Example

### POST /auth/login

```
1. HTTP Request
   ├─ Email, Password
   └─ IP Address, User-Agent (from request)
   
2. Validation Middleware
   ├─ Zod schema validation
   └─ loginSchema: { email, password }
   
3. LoginController
   ├─ Extract: { email, password, ip, userAgent }
   └─ Call: loginService.login(input, ip, userAgent)
   
4. LoginService
   ├─ Check throttle (rate limiting)
   ├─ Find user by email
   ├─ Verify email verified
   ├─ Check account status = ACTIVE
   ├─ Compare password (bcryptjs)
   ├─ Generate JWT access token
   ├─ Generate refresh token
   ├─ Store refresh token (hashed, family-tracked)
   ├─ Update lastLogin metadata
   ├─ Log to audit trail
   ├─ Publish LoginSuccess event
   └─ Return: { accessToken, refreshToken, user }
   
5. Response
   ├─ 200 OK
   └─ { accessToken, refreshToken, user }
```

---

## Data Flow

### Login → Token Usage

```
1. Login
   └─ Generate: accessToken (JWT), refreshToken (stored)

2. Use API
   ├─ Header: Authorization: Bearer <accessToken>
   ├─ Middleware: verifyAccessToken()
   ├─ Extract: user data from JWT payload
   └─ Execute: endpoint logic

3. Token Expires (24h)
   ├─ Error: 401 Token Expired
   └─ Frontend: POST /auth/refresh

4. Refresh
   ├─ Input: { refreshToken }
   ├─ Service: rotate(oldToken, newToken)
   ├─ Output: { accessToken, refreshToken }
   └─ Return to step 2

5. Logout
   ├─ Input: { refreshToken }
   ├─ Service: revoke(refreshToken) or revokeFamily(familyId)
   ├─ Set: revokedAt = now
   └─ User must login again
```

---

## Security Layers

```
┌────────────────────────────────────────────────────┐
│ Input Validation (Zod)                            │
│ └─ Type-safe schemas, sanitization               │
├────────────────────────────────────────────────────┤
│ Authentication (JWT + RefreshToken)              │
│ └─ Stateless access, stateful refresh            │
├────────────────────────────────────────────────────┤
│ Authorization (Role-based)                        │
│ └─ requirePermission middleware                   │
├────────────────────────────────────────────────────┤
│ Rate Limiting (LoginThrottleService)             │
│ └─ 5 attempts → 15-min lockout                    │
├────────────────────────────────────────────────────┤
│ Password Hashing (bcryptjs, cost=12)             │
│ └─ Industry standard, cost configurable          │
├────────────────────────────────────────────────────┤
│ Token Hashing (SHA256)                            │
│ └─ Refresh & verification tokens hashed          │
├────────────────────────────────────────────────────┤
│ Audit Logging (Structured)                        │
│ └─ Every action logged with reason               │
├────────────────────────────────────────────────────┤
│ Device Tracking                                   │
│ └─ IP, User-Agent, deviceId stored               │
├────────────────────────────────────────────────────┤
│ CORS (Environment-configured)                     │
│ └─ Whitelist origin, credentials                 │
└────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│          Client (React)                         │
│          Running on Vercel/Netlify              │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────────┐
│     Express.js Backend                          │
│     Running on Heroku/Railway/AWS               │
│                                                 │
│     ├─ Environment: production                 │
│     ├─ Node version: 18+ (specified)           │
│     └─ Port: 3000 (configurable)               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│     MongoDB                                     │
│     Running on MongoDB Atlas                    │
│                                                 │
│     ├─ Replicas: 3 (for HA)                   │
│     ├─ Backups: Daily                         │
│     └─ Connection: TLS encrypted               │
└─────────────────────────────────────────────────┘
```

---

## Phase Timeline

### Phase 2: Authentication (Current)
```
Units 1-5 (FROZEN)
├─ Database schema
├─ Register endpoint
├─ Email verification
├─ Login endpoint
└─ Security hardening

Units 6-9 (IN PROGRESS)
├─ Refresh token rotation
├─ Logout (multi-device)
├─ Password reset flow
└─ Complete session lifecycle
```

### Phase 3: Roadmap CMS
```
Roadmap CRUD
├─ Create/Update/Delete roadmaps
├─ Organize topics and lessons
├─ Manage learning resources
└─ Track progress
```

### Phase 4: Learning Engine
```
Progress tracking
├─ XP system
├─ Streak tracking
├─ Certificates
└─ Analytics
```

### Phase 5: Recruitment
```
Company portal
├─ Job postings
├─ Applications
├─ Hiring drives
└─ Analytics
```

### Phase 6: Placement
```
T&P dashboard
├─ Placement records
├─ Reports
└─ Analytics
```

### Phase 7: AI Layer
```
Career mentor
├─ Roadmap generation
├─ Skill gap analysis
├─ Recommendations
└─ Chatbot
```

---

## Scaling Considerations

### Current (Phase 2)
- Single instance
- In-memory throttling
- Real-time events

### Phase 3+ (Recommended)
- Multiple instances (load balanced)
- Redis for throttling/caching
- Message queue for events
- CDN for static assets
- Database replication

---

See also:
- [Architecture Decision Records (ADRs)](./adr/README.md)
- [Security Guide](./security/README.md)
- [Deployment Guide](./deployment/README.md)
