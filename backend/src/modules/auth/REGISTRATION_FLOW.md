# Registration Flow - Event-Driven Architecture

## Overview

Registration is **event-driven**, not monolithic. Auth module only handles user creation and authentication. Other modules subscribe to events to extend functionality.

## Flow Diagram

```
User Submits Registration
        ↓
POST /api/auth/register
        ↓
[AuthController.register]
        ↓
Validate input (Zod)
        ↓
[AuthService.register]
        ↓
Check email exists (UserRepository.findByEmail)
        ↓
Hash password (bcryptjs)
        ↓
Create User record
  - accountStatus: EMAIL_PENDING
  - userRole: input.role
  - organizationId: resolved from collegeCode or inviteToken
        ↓
Generate email verification token
        ↓
publishEmailVerificationSent (event)
        ↓
Emit UserRegistered event
        ↓
┌─────────────┬──────────────────┬─────────────────┐
↓             ↓                  ↓                 ↓
[Student]   [Recruiter]      [Placement]    [Notification]
Module      Module           Officer Module    Module
│             │                  │               │
Create        Create          Create          Send
Student       Recruiter       Placement        Welcome
Profile       Profile         Officer Profile   Email
│             │                  │               │
└─────────────┴──────────────────┴─────────────────┘
        ↓
[Audit Module]
        ↓
Log USER_REGISTERED action
        ↓
Return: { accessToken, refreshToken, user }
```

## Event: `auth.user.registered`

**Payload:**
```typescript
{
  userId: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "RECRUITER" | "PLACEMENT_OFFICER";
  organizationId: string;
  timestamp: Date;
}
```

**Subscribers (future modules):**
- **StudentModule** → Create StudentProfile with empty data
- **RecruiterModule** → Send recruiter verification email (if role=RECRUITER)
- **PlacementModule** → Create PlacementOfficerProfile (if role=PLACEMENT_OFFICER)
- **NotificationModule** → Store welcome notification
- **AuditModule** → Log USER_REGISTERED action

## Event: `auth.email.verification_sent`

**Payload:**
```typescript
{
  userId: string;
  email: string;
  verificationLink: string;
  expiresAt: Date;
  timestamp: Date;
}
```

**Subscribers:**
- **NotificationModule** → Send verification email via provider (Sendgrid, AWS SES, etc.)
- **AuditModule** → Log EMAIL_VERIFICATION_SENT action

## Why Event-Driven?

### Problem with Monolithic Approach
```typescript
// ❌ BAD - Auth service creates everything
async register(input) {
  const user = await UserRepository.create(...);
  const studentProfile = await StudentRepository.create(...);
  const recruiterProfile = await RecruiterRepository.create(...);
  await notificationService.sendWelcomeEmail(...);
  await auditService.log(...);
}
```

**Issues:**
1. Auth module depends on Student, Recruiter, Placement, Notification, Audit
2. Can't add new modules without modifying Auth
3. Tight coupling → hard to test
4. Auth becomes a 500-line God class

### Solution: Event-Driven
```typescript
// ✅ GOOD - Auth emits events, modules listen
async register(input) {
  const user = await UserRepository.create(...);
  await publishUserRegistered({ userId, email, fullName, role, organizationId });
}

// In StudentModule
EventBus.subscribe(AuthEvents.USER_REGISTERED, async (payload) => {
  if (payload.role === "STUDENT") {
    await StudentRepository.create({ userId: payload.userId, ... });
  }
});
```

**Benefits:**
1. **Module Independence** - Auth doesn't know about Student/Recruiter
2. **Extensibility** - Add new modules without touching Auth
3. **Testability** - Mock EventBus in tests
4. **Loose Coupling** - Modules communicate via events
5. **Scalability** - Easy to replace EventBus with RabbitMQ/Kafka later

## Implementation Steps (Unit 3)

### Step 1: Input Validation
```typescript
const validated = registerSchema.parse(input);
```

### Step 2: Resolve Organization
```typescript
// For students: resolve organizationId from collegeCode
const organization = await organizationRepository.findByCollegeCode(
  input.collegeCode
);

// For recruiters: validate inviteToken and get organizationId
const invitation = await invitationRepository.findByToken(
  input.companyInviteToken
);
```

### Step 3: Create User
```typescript
const passwordHash = await bcrypt.hash(input.password, 10);

const user = await userRepository.create({
  email: input.email,
  fullName: input.fullName,
  passwordHash,
  userRole: input.role,
  accountStatus: "EMAIL_PENDING",
  organizationId: organization.id,
});
```

### Step 4: Generate Tokens
```typescript
const accessToken = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  JWT_CONSTANTS.SECRET,
  { expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRY }
);

const refreshToken = generateRandomToken();
await refreshTokenRepository.create({
  token: refreshToken,
  userId: user.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});
```

### Step 5: Emit Events
```typescript
// Email verification (will be sent by Notification module)
const verificationToken = generateRandomToken();
await publishEmailVerificationSent({
  userId: user.id,
  email: user.email,
  verificationLink: `${FRONTEND_URL}/verify?token=${verificationToken}`,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  timestamp: new Date(),
});

// Profile creation (Student/Recruiter/Placement modules will listen)
await publishUserRegistered({
  userId: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  organizationId: organization.id,
  timestamp: new Date(),
});

// Audit logging (Audit module will listen)
// This happens via the general event system
```

### Step 6: Return Response
```typescript
return new RegisterResponseDTO({
  accessToken,
  refreshToken,
  userId: user.id,
  email: user.email,
  fullName: user.fullName,
  avatar: user.avatar,
  role: user.role,
});
```

## Module Responsibilities

### Auth Module (Unit 3)
✅ Validate input
✅ Create User record
✅ Generate verification token
✅ Generate JWT + refresh token
✅ Emit events
❌ Create profiles (other modules do this)
❌ Send emails (Notification module does this)

### Student Module (Future)
✅ Listen to `auth.user.registered` with role=STUDENT
✅ Create StudentProfile

### Recruiter Module (Future)
✅ Listen to `auth.user.registered` with role=RECRUITER
✅ Create RecruiterProfile
✅ Send recruiter verification email

### Placement Officer Module (Future)
✅ Listen to `auth.user.registered` with role=PLACEMENT_OFFICER
✅ Create PlacementOfficerProfile

### Notification Module (Future)
✅ Listen to `auth.email.verification_sent`
✅ Send email via provider (Sendgrid, AWS SES, etc.)
✅ Track delivery status

### Audit Module (Future)
✅ Listen to auth events
✅ Log all actions to AuditLog table

## Testing Event-Driven Registration

### Unit Test Example
```typescript
describe("RegisterService", () => {
  it("should emit UserRegistered event after successful registration", async () => {
    const mockPublish = jest.fn();
    jest.mock("../events", () => ({
      publishUserRegistered: mockPublish,
    }));

    await registerService.register({
      email: "student@example.com",
      password: "SecurePass123!",
      fullName: "John Doe",
      role: "STUDENT",
      collegeCode: "NIT-001",
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "student@example.com",
        role: "STUDENT",
      })
    );
  });
});
```

### Integration Test Example
```typescript
describe("Registration Flow", () => {
  it("should create user and trigger profile creation", async () => {
    // Subscribe to event
    const studentProfileCreated = new Promise((resolve) => {
      EventBus.subscribe(AuthEvents.USER_REGISTERED, async (payload) => {
        const profile = await StudentRepository.create(...);
        resolve(profile);
      });
    });

    // Register
    await registerService.register({
      email: "student@example.com",
      password: "SecurePass123!",
      fullName: "John Doe",
      role: "STUDENT",
      collegeCode: "NIT-001",
    });

    // Verify profile was created
    const profile = await studentProfileCreated;
    expect(profile).toBeDefined();
    expect(profile.userId).toBeDefined();
  });
});
```

## Future: Replace EventBus

In production, replace the in-memory EventBus with:

```typescript
// src/services/eventBus.ts
import amqp from "amqplib";

export class EventBus {
  static async publish(eventType: string, payload: any) {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(eventType, "topic");
    channel.publish(eventType, "", JSON.stringify(payload));
  }

  static async subscribe(eventType: string, handler: Function) {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = await channel.assertQueue("");
    await channel.bindQueue(queue.queue, eventType, "#");
    channel.consume(queue.queue, async (msg) => {
      await handler(JSON.parse(msg.content.toString()));
    });
  }
}
```

No changes needed in Auth module code - it just calls `publishUserRegistered()`.
