# Authentication Module

Phase 2 Backend - Multi-College/Multi-Company SaaS Authentication

## Overview

This module handles all user authentication and authorization flows:
- User registration (students, recruiters, placement officers)
- Email verification
- Login/Logout
- JWT token management
- Password reset with OTP
- Audit logging
- Role-based access control (RBAC)

## Architecture

```
Auth Module
├── controller.ts       → HTTP handlers
├── service.ts          → Business logic
├── repository/         → Data access
│   ├── user.repository.ts
│   ├── refresh-token.repository.ts
│   ├── audit.repository.ts
│   └── index.ts
├── middleware.ts       → Auth middleware
├── validators.ts       → Input validation (Zod)
├── types.ts            → Module interfaces
├── constants.ts        → Configuration
├── errors.ts           → Custom errors
├── events.ts           → Event definitions
└── routes.ts           → Route definitions
```

## Authentication Flow

```
USER REGISTRATION
     ↓
Email Verification
     ↓
Create Profile (Student/Recruiter/Officer)
     ↓
LOGIN
     ↓
Generate JWT + Refresh Token
     ↓
AUTHENTICATED REQUESTS
     ↓
TOKEN REFRESH (when JWT expires)
     ↓
LOGOUT (revoke tokens)
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (Unit 3) ✅ |
| GET | `/api/auth/verify-email?token=xxx` | Verify email token (Unit 4) |
| POST | `/api/auth/login` | Login user (Unit 5) |
| POST | `/api/auth/refresh` | Refresh access token (Unit 6) |
| POST | `/api/auth/forgot-password` | Request password reset (Unit 8) |
| POST | `/api/auth/reset-password` | Reset password with OTP (Unit 9) |

### Protected Endpoints (Require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/logout` | Logout user (Unit 7) |
| GET | `/api/auth/me` | Get current user (Unit 2) ✅ |
| POST | `/api/auth/change-password` | Change password (Unit 8) |

## Request/Response Examples

### Register
```bash
POST /api/auth/register
{
  "email": "student@college.edu",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "fullName": "John Doe",
  "role": "STUDENT",
  "collegeCode": "NIT-SURATHKAL"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "user_123",
      "email": "student@college.edu",
      "fullName": "John Doe",
      "avatar": null,
      "role": "STUDENT"
    }
  }
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "student@college.edu",
  "password": "SecurePass123!"
}
```

### Refresh Token
```bash
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}
```

### Get Current User (Protected)
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGc...
```

## Permissions

| Endpoint | ADMIN | PLACEMENT_OFFICER | RECRUITER | STUDENT |
|----------|-------|-------------------|-----------|---------|
| POST /register | ✓ | ✓ | ✓ | ✓ |
| GET /verify-email | ✓ | ✓ | ✓ | ✓ |
| POST /login | ✓ | ✓ | ✓ | ✓ |
| POST /refresh | ✓ | ✓ | ✓ | ✓ |
| POST /logout | ✓ | ✓ | ✓ | ✓ |
| GET /me | ✓ | ✓ | ✓ | ✓ |
| POST /change-password | ✓ | ✓ | ✓ | ✓ |

## Events Published

The module publishes these events to the global EventBus:

- `auth:user_registered` - After successful registration
- `auth:email_verification_sent` - When verification email sent
- `auth:email_verified` - After email verification
- `auth:login_success` - Successful login
- `auth:login_failed` - Failed login attempt
- `auth:logout` - User logout
- `auth:password_reset_requested` - Password reset requested
- `auth:password_reset_completed` - Password reset completed
- `auth:account_suspended` - Account suspended
- `auth:account_activated` - Account activated

### Subscribing to Events

```typescript
import { EventBus } from '@/services/eventBus';
import { AuthEvents } from '@/modules/auth';

// Subscribe to user registration
EventBus.subscribe(AuthEvents.USER_REGISTERED, async (payload) => {
  console.log('New user registered:', payload);
  // Send welcome email, create profile, etc.
});
```

## Configuration

Edit `constants.ts` to configure:

- JWT expiry times
- Email verification expiry
- Password reset OTP expiry
- Rate limiting thresholds
- Password policy requirements
- OTP length and expiry

## Error Handling

Auth-specific errors in `errors.ts`:

- `InvalidCredentialsError` - Wrong password/email (401)
- `EmailNotVerifiedError` - User hasn't verified email (403)
- `AccountInactiveError` - Account suspended/rejected (403)
- `InvalidTokenError` - Expired/invalid token (401)
- `EmailAlreadyExistsError` - Email already registered (409)
- `OTPExpiredError` - OTP has expired (401)
- `OTPInvalidError` - Wrong OTP (401)
- `AccountSuspendedError` - Account suspended (403)
- `MaxLoginAttemptsError` - Too many login attempts (401)
- `WeakPasswordError` - Password doesn't meet policy (422)
- `TokenRequiredError` - No authorization token (401)
- `PermissionDeniedError` - Insufficient permissions (403)
- `InvalidInvitationError` - Invalid/expired invitation (401)

## Role Transition Strategy

**Current Phase (v0.1.0):**
- New code uses `userRole` enum (in Prisma)
- Legacy code uses `role` string
- Both fields set on create for compatibility
- Utility: `getEffectiveRole(userRole, role)` returns correct value

**Migration Path:**
- v0.1.0: Introduce `userRole`, keep `role`
- v0.1.x: Gradually migrate modules to use `userRole`
- v0.2.0: Remove legacy `role` field
- File to delete: `src/utils/roleTransition.ts`

See `src/utils/roleTransition.ts` for utilities.

## Dependencies

- `@prisma/client` - Database ORM
- `jsonwebtoken` - JWT generation
- `bcryptjs` - Password hashing
- `nodemailer` - Email (future)
- `zod` - Validation
- `express` - Web framework

## Repository Pattern

This module uses a multi-repository pattern:

- `UserRepository` - User CRUD operations
- `RefreshTokenRepository` - Token lifecycle management
- `AuditRepository` - Audit logging

Each repository mirrors an aggregate and is responsible only for CRUD operations. Business logic belongs in the Service layer.

## Testing

See `AUTH_TEST_CHECKLIST.md` for regression test scenarios.

## Future TODOs

- [ ] Implement password hashing (bcryptjs)
- [ ] Implement JWT token generation
- [ ] Implement email verification flow
- [ ] Implement OTP password reset
- [ ] Add rate limiting middleware
- [ ] Add 2FA support
- [ ] Add OAuth2 (Google, GitHub)
- [ ] Add SAML for enterprise
- [ ] Migrate `role` field to `userRole` (v0.2.0)
- [ ] Add invitation system for recruiters
- [ ] Add admin user management
- [ ] Add session management (multiple device logout)

## Module Independence

This module:
- ✅ Does NOT import from other modules
- ✅ Does NOT access other modules' database tables
- ✅ Does NOT depend on other modules' services
- ✅ Publishes events for other modules to consume
- ✅ Uses only its own repositories

## Integration

See `integration.md` for setup instructions.

---

**Last Updated:** Unit 3 Phase 2
**Status:** Unit 3 Complete ✅ (POST /auth/register implemented)
**Next:** Unit 4 - GET /auth/verify-email
