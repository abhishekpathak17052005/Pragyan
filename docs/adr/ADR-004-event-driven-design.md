# ADR-004: Event-Driven Architecture for Authentication

**Date:** July 14, 2026  
**Status:** ACCEPTED  
**Phase:** 2 (Authentication)

---

## Context

Pragyan will eventually have many modules:
- Authentication
- Roadmap CMS
- Learning Engine
- AI Mentor
- Recruitment
- Placement

Each needs to react to auth events:
- "User registered" → Create StudentProfile, send welcome email
- "Email verified" → Unlock learning features
- "Login" → Update lastSeenAt, track activity
- "Password reset" → Notify user, revoke sessions

Challenge: How to decouple without tight coupling or external messaging?

---

## Decision

**Implement in-process event bus (Observer pattern)** for Phase 2-3, migrate to message queue (RabbitMQ/SQS) if needed later.

```
Auth Module (Publishes)
  └─ UserRegistered
  └─ EmailVerificationRequested
  └─ EmailVerified
  └─ LoginSuccess / LoginFailed
  └─ LogoutSuccess
  └─ PasswordResetRequested
  └─ PasswordResetCompleted
  
Other Modules (Subscribe)
  └─ Roadmap: "EmailVerified" → enable learning
  └─ Notification: "UserRegistered" → send welcome email
  └─ Analytics: "LoginSuccess" → track session
  └─ AI: "EmailVerified" → initialize mentor
```

### Implementation

```typescript
// EventBus (Singleton)
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();
  
  subscribe(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  publish(event: string, payload: any) {
    const handlers = this.listeners.get(event) || new Set();
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Event handler failed for ${event}:`, err);
      }
    });
  }
}

// Auth publishes
class LoginService {
  async login(email: string, password: string) {
    // ... validate credentials
    
    this.eventBus.publish('auth.login.success', {
      userId,
      email,
      role,
      timestamp: new Date()
    });
    
    return { accessToken, refreshToken, user };
  }
}

// Other modules subscribe
class NotificationService {
  constructor(eventBus: EventBus) {
    eventBus.subscribe('auth.user.registered', (payload) => {
      this.sendWelcomeEmail(payload.email, payload.fullName);
    });
  }
}

class StudentProfileService {
  constructor(eventBus: EventBus) {
    eventBus.subscribe('auth.email.verified', (payload) => {
      if (payload.role === 'STUDENT') {
        this.createStudentProfile(payload.userId);
      }
    });
  }
}
```

### Event Contracts

```typescript
// Events
interface UserRegistered {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  registeredAt: Date;
}

interface EmailVerified {
  userId: string;
  role: UserRole;
  newStatus: AccountStatus;
  verifiedAt: Date;
}

interface LoginSuccess {
  userId: string;
  email: string;
  role: UserRole;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

interface LoginFailed {
  email?: string;
  reason: LoginFailureReason;
  ip: string;
  timestamp: Date;
}

interface PasswordResetRequested {
  userId: string;
  email: string;
  requestedAt: Date;
  expiresAt: Date;
}

interface PasswordResetCompleted {
  userId: string;
  email: string;
  resetAt: Date;
  allSessionsRevoked: boolean;
}
```

---

## Alternatives Considered

### 1. Direct Service Calls (Tight Coupling)

```typescript
// In LoginService
class LoginService {
  async login(email, password) {
    // ... login logic
    
    // Direct calls
    await notificationService.sendLoginNotification(user);
    await analyticsService.recordLogin(user);
    await aiService.updateUserState(user);
  }
}
```

**Rejected:**
- Can't add new listeners without modifying LoginService
- Breaks on service failure (no isolation)
- Hard to test (need mock everything)
- Violates single responsibility

### 2. Webhooks to External Services

```
Auth → HTTP POST to http://notification-service/on-login
    → HTTP POST to http://analytics-service/on-login
    → HTTP POST to http://ai-service/on-login
```

**Rejected:**
- Overkill for single system
- Network latency on every event
- Requires service discovery
- Out of scope for MVP

### 3. Message Queue (RabbitMQ, SQS)

```
Auth → Publish to "auth.events" exchange
    ├─ notification-service consuming
    ├─ analytics-service consuming
    └─ ai-service consuming
```

**Rejected (for now):**
- Adds infrastructure complexity
- Overkill before Phase 3
- Can upgrade later (EventBus → RabbitMQ adapter)

### 4. Database Polling (Outbox Pattern)

```
Auth → Write to EventOutbox table
    → External process polls & dispatches
```

**Rejected (for now):**
- Unnecessary latency
- DB-dependent reliability
- Upgrade to RabbitMQ easier without this

---

## Consequences

### Positive

✅ **Loose coupling** — Modules don't know about each other  
✅ **Easy testing** — Mock EventBus in tests  
✅ **Observable** — Can log all events  
✅ **Extensible** — Add new listeners without touching auth  
✅ **No infrastructure** — Just Node.js  
✅ **Fast** — In-process, no network calls  
✅ **Upgrade path** — Easy to migrate to RabbitMQ later  

### Negative

❌ **No persistence** — Events lost on crash  
   *Mitigation:* Add Outbox pattern if needed

❌ **Synchronous** — Slow handler blocks other handlers  
   *Mitigation:* Wrap handlers in setImmediate() for async, or upgrade to queue

❌ **No ordering guarantee** — For multiple handlers  
   *Mitigation:* Acceptable for MVP, add if needed

---

## Migration Path

### Phase 2-3: EventBus (In-Process)
```typescript
const eventBus = new EventBus();
authService.eventBus = eventBus;
notificationService.eventBus = eventBus;
// ... all subscribe
```

### Phase 4+: RabbitMQ (If Needed)
```typescript
const eventBus = new RabbitMQEventBus();
// Same interface, different transport
// No changes to listeners
```

---

## Implementation Checklist

- [x] Create EventBus class (in-process Observer pattern)
- [x] Define event interfaces (UserRegistered, EmailVerified, etc.)
- [x] Publish from auth services (RegisterService, LoginService, etc.)
- [x] Subscribe from other services (NotificationService, StudentProfileService, etc.)
- [x] Add error handling (handler failure shouldn't break others)
- [x] Add logging (can see which events fired)
- [x] Document all event types

---

## Event Catalog

| Event | Publisher | Subscribers | Phase |
|-------|-----------|-------------|-------|
| `auth.user.registered` | RegisterService | NotificationService, Analytics | 2 |
| `auth.email.verification_requested` | RegisterService | NotificationService | 2 |
| `auth.email.verified` | VerifyEmailService | StudentProfileService, AI Mentor | 2 |
| `auth.login.success` | LoginService | Analytics, AuditLog | 2 |
| `auth.login.failed` | LoginService | AuditLog, SecurityAlert | 2 |
| `auth.logout.success` | LogoutService | Analytics, AuditLog | 7 |
| `auth.password_reset.requested` | PasswordService | NotificationService | 8 |
| `auth.password_reset.completed` | PasswordService | NotificationService, Analytics | 9 |
| `auth.session.theft_detected` | RefreshService | SecurityAlert, UserNotification | 6 |

---

## Testing

```typescript
describe('EventBus', () => {
  it('should call handler when event published', () => {
    const handler = jest.fn();
    eventBus.subscribe('test.event', handler);
    
    eventBus.publish('test.event', { data: 'hello' });
    
    expect(handler).toHaveBeenCalledWith({ data: 'hello' });
  });
  
  it('should not break on handler error', () => {
    const handler1 = jest.fn(() => { throw new Error('fail'); });
    const handler2 = jest.fn();
    
    eventBus.subscribe('test.event', handler1);
    eventBus.subscribe('test.event', handler2);
    
    expect(() => {
      eventBus.publish('test.event', {});
    }).not.toThrow();
    
    expect(handler2).toHaveBeenCalled();
  });
});

describe('Integration', () => {
  it('should send email on user registration', () => {
    const notificationService = new NotificationService(eventBus);
    const sendEmailSpy = jest.spyOn(notificationService, 'sendWelcomeEmail');
    
    authService.register('user@example.com', 'password', 'John');
    
    expect(sendEmailSpy).toHaveBeenCalledWith('user@example.com', 'John');
  });
});
```

---

## Monitoring & Metrics

```typescript
// Track event flow
eventBus.on('publish', (event, payload) => {
  metrics.increment(`event.${event}`);
});

// Track handler performance
eventBus.on('handler_executed', (event, handler, duration) => {
  metrics.histogram(`event.${event}.handler_duration`, duration);
});
```

---

## References

- [Observer Pattern (Gang of Four)](https://refactoring.guru/design-patterns/observer)
- [Event-Driven Architecture](https://aws.amazon.com/event-driven-architecture/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Apache Kafka](https://kafka.apache.org/)

---

**Approved by:** Architecture Review  
**Status:** Implemented in Phase 2, Extensible for Phase 3+
