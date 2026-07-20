# 📊 Phase 2: Final Prisma Schema

**Date:** July 14, 2026  
**Status:** ✅ LOCKED FOR IMPLEMENTATION  
**Location:** `backend/prisma/schema.prisma`

---

## Complete Schema with All Phase 2 Features

```prisma
// prisma/schema.prisma

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ═══════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════

enum UserRole {
  STUDENT
  RECRUITER
  PLACEMENT_OFFICER
  ADMIN
}

enum AccountStatus {
  EMAIL_PENDING           // Awaiting email verification
  PENDING_APPROVAL        // Email verified, awaiting admin approval (Recruiter/T&P)
  APPROVED                // Can login
  REJECTED                // Registration denied
  SUSPENDED               // Account disabled by admin
}

// ═══════════════════════════════════════════════════
// CORE MODELS
// ═══════════════════════════════════════════════════

// ✅ NEW: Invitation Model
// Used for inviting Recruiters and T&P Officers
model Invitation {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  
  // Invitation details
  email     String   @unique
  role      UserRole
  
  // Organization context
  collegeId String?  @db.ObjectId  // For PLACEMENT_OFFICER invitations
  companyId String?  @db.ObjectId  // For RECRUITER invitations
  
  // Security & expiry
  token     String   @unique       // Random 32-byte token
  expiresAt DateTime              // 7 days from creation
  used      Boolean  @default(false)
  
  // Audit trail
  createdBy String   @db.ObjectId  // Admin user ID
  createdAt DateTime @default(now())
  
  // Optional: Link to the user created from this invitation
  userId    String?  @db.ObjectId  @unique
}

// Core User Model
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  // Basic Info
  fullName  String
  email     String   @unique
  password  String   // bcrypt hashed, minimum 10 rounds

  // Role & Status
  role      UserRole        @default(STUDENT)
  status    AccountStatus   @default(EMAIL_PENDING)

  // ═══════════════════════════════════════════════════
  // EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════
  
  emailVerified Boolean      @default(false)
  emailVerificationToken String?      // Random token, valid 24 hours
  emailVerificationExpiry DateTime?   // Expiry timestamp

  // ═══════════════════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════════════════
  
  passwordResetToken String?      // Random token, valid 1 hour
  passwordResetExpiry DateTime?   // Expiry timestamp

  // ═══════════════════════════════════════════════════
  // ORGANIZATION SCOPING
  // ═══════════════════════════════════════════════════
  
  // For STUDENT, PLACEMENT_OFFICER: Which college
  collegeId String?  @db.ObjectId
  
  // For RECRUITER: Which company
  companyId String?  @db.ObjectId
  
  // Role-specific field
  designation String?  // For RECRUITER, PLACEMENT_OFFICER

  // ═══════════════════════════════════════════════════
  // INVITATION TRACKING
  // ═══════════════════════════════════════════════════
  
  // If user was created via invitation, link to it
  invitationId String? @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations (to be added in future phases)
  // company   Company?  @relation(fields: [companyId], references: [id])
  // college   College?  @relation(fields: [collegeId], references: [id])
}

// ═══════════════════════════════════════════════════
// EXISTING MODELS (From Phase 1)
// ═══════════════════════════════════════════════════

model Job {
  id    String     @id @default(auto()) @map("_id") @db.ObjectId

  title       String
  description String?
  // ... existing fields ...
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model JobApplication {
  id    String     @id @default(auto()) @map("_id") @db.ObjectId

  jobId     String  @db.ObjectId
  studentId String  @db.ObjectId
  status    String  @default("PENDING")
  // ... existing fields ...
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ═══════════════════════════════════════════════════
// OPTIONAL: Future Phase Models (Phase 3+)
// ═══════════════════════════════════════════════════
// Uncomment when needed

/*
model College {
  id   String @id @default(auto()) @map("_id") @db.ObjectId
  
  name String @unique
  city String
  
  createdAt DateTime @default(now())
}

model Company {
  id   String @id @default(auto()) @map("_id") @db.ObjectId
  
  name     String @unique
  industry String
  
  createdAt DateTime @default(now())
}
*/
```

---

## Schema Migrations

### Migration 1: Initial User & Invitation

```bash
# Create this migration to set up the schema
npx prisma migrate dev --name init_auth_system
```

This creates:
- ✅ Invitation collection
- ✅ User collection with all fields
- ✅ Indexes for email, token fields

### After Implementing Each Feature

```bash
# If adding College/Company models
npx prisma migrate dev --name add_college_company

# Validate schema
npx prisma validate

# Generate updated client
npx prisma generate
```

---

## Key Design Decisions

### 1. Email & Password Reset Tokens

```prisma
emailVerificationToken String?
emailVerificationExpiry DateTime?

passwordResetToken String?
passwordResetExpiry DateTime?
```

**Why separate fields?**
- ✅ Can have both pending simultaneously
- ✅ Don't overwrite one when handling the other
- ✅ Clear expiry logic for each

**Why not use one token field?**
- ❌ Would need additional field to distinguish type
- ❌ More complex logic

### 2. Invitation Model

```prisma
model Invitation {
  token String @unique
  used Boolean @default(false)
  expiresAt DateTime
}
```

**Why separate model?**
- ✅ Admin can track all invitations sent
- ✅ Can resend invitations
- ✅ Can see acceptance rate
- ✅ Can cancel pending invitations
- ✅ Keeps User model clean

### 3. Organization Scoping

```prisma
collegeId String? @db.ObjectId    // For STUDENT, PLACEMENT_OFFICER
companyId String? @db.ObjectId    // For RECRUITER
```

**Why nullable?**
- ✅ ADMIN doesn't have collegeId or companyId
- ✅ Flexibility for future use cases

**Why not use relations yet?**
- ✅ College/Company models not created until Phase 3
- ✅ Keep Phase 2 focused on authentication only
- ✅ Relations can be added in Phase 3 migration

### 4. Invitation Tracking

```prisma
invitationId String? @db.ObjectId
```

**Why track?**
- ✅ Know which user came from which invitation
- ✅ Can mark invitation as "used" when user registers
- ✅ Admin analytics (invitations sent vs. accepted)

---

## Field Definitions

### User Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String | ✅ | Auto-generated |
| fullName | String | ✅ | 1-255 characters |
| email | String | ✅ | Unique, validated |
| password | String | ✅ | bcrypt hashed |
| role | UserRole | ✅ | Default: STUDENT |
| status | AccountStatus | ✅ | Default: EMAIL_PENDING |
| emailVerified | Boolean | ✅ | Default: false |
| emailVerificationToken | String? | ❌ | Random 32 bytes |
| emailVerificationExpiry | DateTime? | ❌ | 24 hours from creation |
| passwordResetToken | String? | ❌ | Random 32 bytes |
| passwordResetExpiry | DateTime? | ❌ | 1 hour from creation |
| collegeId | String? | ❌ | For scoping |
| companyId | String? | ❌ | For scoping |
| designation | String? | ❌ | For recruiter/T&P |
| invitationId | String? | ❌ | Link to invitation |
| createdAt | DateTime | ✅ | Auto |
| updatedAt | DateTime | ✅ | Auto |

### Invitation Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String | ✅ | Auto-generated |
| email | String | ✅ | Unique |
| role | UserRole | ✅ | RECRUITER or PLACEMENT_OFFICER |
| collegeId | String? | ❌ | For PLACEMENT_OFFICER |
| companyId | String? | ❌ | For RECRUITER |
| token | String | ✅ | Unique, 32 bytes random |
| expiresAt | DateTime | ✅ | 7 days from creation |
| used | Boolean | ✅ | Default: false |
| createdBy | String | ✅ | Admin user ID |
| createdAt | DateTime | ✅ | Auto |
| userId | String? | ❌ | User created from this |

---

## Database Indexes (MongoDB)

```javascript
// These indexes should be created for performance

// User indexes
db.User.createIndex({ "email": 1 }, { unique: true })
db.User.createIndex({ "emailVerificationToken": 1 })
db.User.createIndex({ "passwordResetToken": 1 })
db.User.createIndex({ "collegeId": 1 })
db.User.createIndex({ "companyId": 1 })
db.User.createIndex({ "status": 1 })
db.User.createIndex({ "role": 1 })

// Invitation indexes
db.Invitation.createIndex({ "email": 1 }, { unique: true })
db.Invitation.createIndex({ "token": 1 }, { unique: true })
db.Invitation.createIndex({ "expiresAt": 1 })
db.Invitation.createIndex({ "used": 1 })
db.Invitation.createIndex({ "createdAt": 1 })
```

---

## TTL Indexes (Auto-Cleanup)

Optional: Use MongoDB TTL indexes to automatically delete expired tokens.

```javascript
// Auto-delete invitations 7 days after creation
db.Invitation.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })

// Or remove expired tokens manually in backend
```

---

## Security Constraints

### Password Hashing

```typescript
// backend/src/services/authService.ts

import bcrypt from 'bcrypt';

// When creating/resetting password:
const hashedPassword = await bcrypt.hash(password, 10);

// When verifying password:
const isValid = await bcrypt.compare(password, user.password);
```

### Token Generation

```typescript
// Generate random tokens (NOT UUIDs)
import crypto from 'crypto';

const token = crypto.randomBytes(32).toString('hex');  // 64 hex characters
```

### Token Expiry

```typescript
// Email verification: 24 hours
const emailExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Password reset: 1 hour
const passwordExpiry = new Date(Date.now() + 60 * 60 * 1000);

// Invitation: 7 days
const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
```

---

## Validation Rules

### Field Validation

```typescript
// Email
- Must be valid email format
- Must be unique in database
- Cannot change after registration

// Password
- Minimum 8 characters
- Should contain: uppercase, lowercase, number, special character
- Hashed before storage
- Never returned in API responses

// FullName
- Minimum 2 characters
- Maximum 100 characters
- No special characters allowed

// Role
- Must be one of: STUDENT, RECRUITER, PLACEMENT_OFFICER, ADMIN
- ADMIN cannot be self-registered
- Cannot be changed by user (only admin can change)

// Status
- Must be one of: EMAIL_PENDING, PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED
- EMAIL_PENDING → APPROVED (after email verification)
- APPROVED → SUSPENDED (admin action)
- Never reverts back

// Tokens
- Must be 32 bytes (64 hex characters)
- Must be unique in database
- Must not be null after generation
- Must have expiry time
```

---

## Migration Checklist

Before implementing Phase 2:

- [ ] Create Prisma schema file with Invitation and updated User models
- [ ] Add enums: UserRole, AccountStatus
- [ ] Add email verification fields to User
- [ ] Add password reset fields to User
- [ ] Create Invitation model
- [ ] Run `npx prisma migrate dev --name init_auth_system`
- [ ] Verify migration files created
- [ ] Run `npx prisma generate`
- [ ] Verify Prisma client generated successfully
- [ ] Test database connection
- [ ] Create database indexes
- [ ] Validate schema: `npx prisma validate`

---

## After Phase 2 (Phase 3+)

When you're ready to add College/Company models:

```prisma
// Phase 3: Uncomment and update

model College {
  id   String @id @default(auto()) @map("_id") @db.ObjectId
  
  name String @unique
  city String
  
  // Relations
  students User[] @relation("StudentCollege")
  placementOfficers User[] @relation("POCollege")
  
  createdAt DateTime @default(now())
}

model Company {
  id   String @id @default(auto()) @map("_id") @db.ObjectId
  
  name String @unique
  industry String
  
  // Relations
  recruiters User[] @relation("RecruiterCompany")
  
  createdAt DateTime @default(now())
}

// Then update User model:

model User {
  // ... existing fields ...
  
  // Add relations
  college College? @relation(name: "StudentCollege", fields: [collegeId], references: [id])
  placementOfficerCollege College? @relation(name: "POCollege", fields: [collegeId], references: [id])
  company Company? @relation(name: "RecruiterCompany", fields: [companyId], references: [id])
}
```

---

**Document:** PHASE_2_FINAL_PRISMA_SCHEMA.md  
**Date:** July 14, 2026  
**Status:** ✅ LOCKED FOR IMPLEMENTATION  
**Next:** Implement backend endpoints based on this schema
