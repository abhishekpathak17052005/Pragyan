# Pragyan API Documentation

**Current Version:** v0.1.0-auth-core  
**Last Updated:** July 14, 2026

---

## Overview

Pragyan backend exposes RESTful APIs for:
- Authentication (register, login, verify email)
- User profiles
- Roadmaps
- Learning resources
- Assessments
- Recruitment
- Placement

## API Endpoints

### Authentication (Phase 2 - Complete)

#### Public Endpoints

**POST /api/auth/register**
- Input: `{ email, password, fullName, role, collegeCode?, companyInviteToken? }`
- Output: `{ message, email }`
- Status: ✅ COMPLETE (Unit 3)

**GET /api/auth/verify-email?token=xxx**
- Input: Query param `token`
- Output: `{ message, accountStatus }`
- Status: ✅ COMPLETE (Unit 4)

**POST /api/auth/login**
- Input: `{ email, password }`
- Output: `{ accessToken, refreshToken, user }`
- Status: ✅ COMPLETE (Unit 5)

**POST /api/auth/refresh** (COMING SOON)
- Input: `{ refreshToken }`
- Output: `{ accessToken, refreshToken }`
- Status: 🟡 Unit 6

**POST /api/auth/forgot-password** (COMING SOON)
- Input: `{ email }`
- Output: `{ message }`
- Status: 🟡 Unit 8

**POST /api/auth/reset-password** (COMING SOON)
- Input: `{ token, newPassword }`
- Output: `{ message }`
- Status: 🟡 Unit 9

#### Protected Endpoints

**GET /api/auth/me**
- Authorization: Bearer token
- Output: User profile with role and organization
- Status: ✅ COMPLETE (Unit 2)

**POST /api/auth/logout** (COMING SOON)
- Authorization: Bearer token
- Input: `{ refreshToken, logoutAllDevices? }`
- Output: `{ message }`
- Status: 🟡 Unit 7

### User Profiles

(Phase 3+)

### Roadmaps

(Phase 3+)

### Learning Resources

(Phase 3+)

### Assessments

(Phase 3+)

### Recruitment

(Phase 5+)

### Placement

(Phase 6+)

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

Access tokens expire in 24 hours.

To refresh: `POST /api/auth/refresh` with refresh token.

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_CREDENTIALS | 401 | Email or password incorrect |
| EMAIL_NOT_VERIFIED | 401 | User hasn't verified email |
| ACCOUNT_PENDING | 403 | User awaiting admin approval |
| THROTTLED | 429 | Too many login attempts |
| UNAUTHORIZED | 401 | Missing or invalid token |
| NOT_FOUND | 404 | Resource doesn't exist |
| CONFLICT | 409 | Resource already exists |
| VALIDATION_ERROR | 400 | Invalid input |

---

## Pagination

(Phase 3+)

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 attempts | 15 minutes |
| POST /auth/register | 10 requests | 1 hour |
| POST /auth/refresh | 60 requests | 1 hour |

---

## CORS

Configured in `.env`:
- `CORS_ORIGIN`
- `CORS_CREDENTIALS`

---

## Versioning

API versioning via URL path:
- `/api/v1/auth/login` (current)
- `/api/v2/auth/login` (future, if breaking changes)

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 429 | Rate limited |
| 500 | Server error |

---

See also:
- [Authentication Flow](./database/auth-flow.md)
- [Authorization Guide](./security/authorization.md)
- [API Changelog](./releases/changelog.md)
