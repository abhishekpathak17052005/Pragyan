# Database Schema Documentation

**Database:** MongoDB  
**Prisma Version:** 6.19.0  
**Last Updated:** July 14, 2026

---

## Overview

Pragyan uses MongoDB via Prisma ORM.

### Core Models

#### Authentication
- `User` - User account, profile, credentials
- `RefreshToken` - Session management, multi-device support
- `VerificationToken` - Email verification, password reset tokens
- `AuditLog` - Security audit trail

#### Organization
- `Organization` - Companies, colleges
- `Role` - Role definitions
- `Permission` - Permission definitions

#### User Profiles
- `StudentProfile` - Student-specific data
- `RecruiterProfile` - Recruiter-specific data
- `PlacementOfficerProfile` - College staff data

#### Learning (Phase 3+)
- `Roadmap` - Learning paths
- `Module` - Course modules
- `Resource` - Learning materials
- `Quiz` - Assessments

#### Recruitment (Phase 5+)
- `Company` - Recruiting companies
- `Job` - Job postings
- `Application` - Job applications

#### Placement (Phase 6+)
- `Drive` - Hiring drives
- `PlacementRecord` - Placement outcomes

---

## Authentication Models

### User

```prisma
model User {
  id                String
  email             String @unique
  password          String
  fullName          String
  
  // Phase 2: Auth fields
  userRole          UserRole?
  accountStatus     AccountStatus @default(EMAIL_PENDING)
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  lastLoginIp       String?
  lastLoginUserAgent String?
  
  // Relations
  refreshTokens     RefreshToken[]
  verificationTokens VerificationToken[]
  auditLogs         AuditLog[]
  
  // ... other fields
}
```

**Indexes:**
- `email` (unique)
- `accountStatus`
- `userRole`

### RefreshToken

```prisma
model RefreshToken {
  id         String
  tokenHash  String @unique      // SHA256 hash
  familyId   String              // Session family
  userId     String
  
  expiresAt  DateTime
  revokedAt  DateTime?           // Null = valid, Set = revoked
  
  deviceId   String?
  ipAddress  String?
  userAgent  String?
  lastUsedAt DateTime?
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Indexes:**
- `tokenHash` (unique)
- `userId`
- `familyId` (for family revocation)
- `expiresAt` (for cleanup)
- `revokedAt` (for security queries)

**Purpose:**
- Session management
- Multi-device tracking
- Token theft detection
- Audit trail

### VerificationToken

```prisma
model VerificationToken {
  id        String
  tokenHash String @unique      // SHA256 hash
  userId    String
  
  purpose   TokenPurpose        // EMAIL_VERIFY, PASSWORD_RESET, etc.
  expiresAt DateTime
  usedAt    DateTime?           // Null = unused, Set = consumed
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum TokenPurpose {
  EMAIL_VERIFY
  PASSWORD_RESET
  INVITATION
  MAGIC_LOGIN
  EMAIL_CHANGE
}
```

**Indexes:**
- `tokenHash` (unique)
- `userId`
- `purpose`
- `expiresAt` (for cleanup)

**Purpose:**
- One-time token verification
- Email confirmation
- Password resets
- Future: invitation links, magic login

### AuditLog

```prisma
model AuditLog {
  id              String
  targetUserId    String          // User being audited
  performedByUserId String        // User performing action
  organizationId  String
  
  action          AuditAction     // LOGIN, REGISTER, EMAIL_VERIFIED, etc.
  status          String          // SUCCESS, FAILURE
  failureReason   String?         // Structured reason if failed
  
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime @default(now())
}

enum AuditAction {
  USER_REGISTERED
  EMAIL_VERIFIED
  LOGIN
  LOGOUT
  PASSWORD_RESET_REQUESTED
  PASSWORD_RESET_COMPLETED
  // ... etc
}
```

**Indexes:**
- `targetUserId`
- `action`
- `status`
- `failureReason`
- `createdAt` (for time-range queries)

**Purpose:**
- Security audit trail
- Analytics
- Compliance
- Incident forensics

---

## Enums

### UserRole
```
STUDENT
RECRUITER
PLACEMENT_OFFICER
ADMIN
```

### AccountStatus
```
EMAIL_PENDING           // Registered, awaiting email verification
ACTIVE                  // Verified and approved
PENDING                 // Verified but awaiting admin approval
REJECTED                // Application rejected
SUSPENDED               // Banned from platform
```

### TokenPurpose
```
EMAIL_VERIFY            // Email verification link
PASSWORD_RESET          // Password reset link
INVITATION              // Invitation to join (future)
MAGIC_LOGIN             // One-click login (future)
EMAIL_CHANGE            // Email change verification (future)
```

### AuditAction
```
USER_REGISTERED
EMAIL_VERIFIED
LOGIN
LOGOUT
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_COMPLETED
ACCOUNT_SUSPENDED
ACCOUNT_ACTIVATED
```

---

## Relationships

### User → RefreshToken (1:many)
- User can have multiple refresh tokens (multi-device)
- Delete on cascade

### User → VerificationToken (1:many)
- User can have multiple verification tokens
- Delete on cascade

### User → AuditLog (1:many)
- All login/security actions are logged
- Immutable (never deleted)

---

## Queries

### Session Management

**Get active sessions for user:**
```
RefreshToken.findMany({
  where: {
    userId,
    expiresAt: { gt: now },
    revokedAt: null
  }
})
```

**Revoke session family:**
```
RefreshToken.updateMany({
  where: { familyId },
  data: { revokedAt: now }
})
```

### Audit

**Get login history:**
```
AuditLog.findMany({
  where: {
    targetUserId,
    action: 'LOGIN',
    status: 'SUCCESS'
  },
  orderBy: { createdAt: 'desc' }
})
```

**Find suspicious activity:**
```
AuditLog.findMany({
  where: {
    action: 'LOGIN',
    failureReason: { in: ['THROTTLED', 'INVALID_PASSWORD'] },
    createdAt: { gte: last24hours }
  }
})
```

### Cleanup

**Delete expired tokens:**
```
VerificationToken.deleteMany({
  where: { expiresAt: { lt: now } }
})

RefreshToken.deleteMany({
  where: { expiresAt: { lt: now } }
})
```

---

## Backup Strategy

- **Frequency:** Daily
- **Location:** Cloud backup (AWS S3 / GCP Cloud Storage)
- **Retention:** 30 days
- **Test:** Monthly restore test

---

## Performance Considerations

| Operation | Index | Complexity |
|-----------|-------|-----------|
| Find user | email | O(1) |
| Find token | tokenHash | O(1) |
| Find family | familyId | O(n) where n=devices |
| Get audit logs | targetUserId | O(log n) |
| Delete expired | expiresAt | O(n) |

---

## Future Phases

### Phase 3: Roadmaps
- Add `Roadmap`, `Module`, `Resource`, `Quiz` models

### Phase 5: Recruitment
- Add `Company`, `Job`, `Application` models

### Phase 6: Placement
- Add `Drive`, `PlacementRecord` models

---

See also:
- [Schema Diagram](./database/schema-diagram.md)
- [Migration Guide](./database/migrations.md)
- [Backup & Recovery](./deployment/backup-recovery.md)
