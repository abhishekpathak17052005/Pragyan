# ADR-002: Role-Based Activation Strategy

**Date:** July 14, 2026  
**Status:** ACCEPTED  
**Phase:** 2 (Authentication), Unit 4

---

## Context

After email verification, users need different activation paths based on role:

- **Students:** Should get immediate access (low abuse risk, main user base)
- **Recruiters:** Higher abuse risk (spam, impersonation), need vetting
- **Placement Officers:** Institutional staff, need approval
- **Admins:** Manually provisioned, never self-signup

Challenge: Balance **user experience** (students want instant access) with **security** (prevent recruiter spam).

---

## Decision

**Role-based, post-verification activation:**

```
User registers with role
        ↓
Email verification link sent
        ↓
User clicks link → VerifyEmailService.verify(token)
        ↓
If role = STUDENT
    └─ Set accountStatus = ACTIVE (immediate access)
Else if role = RECRUITER or PLACEMENT_OFFICER
    └─ Set accountStatus = PENDING (await admin approval)
Else if role = ADMIN
    └─ Reject (no self-signup for admin)
        ↓
Return activation result to frontend
```

### Implementation

In `VerifyEmailService`:

```typescript
async verify(token: string, ip?: string, userAgent?: string) {
  // 1. Find and validate token
  const verToken = await this.verTokenRepo.findByHash(tokenHash);
  
  // 2. Get user
  const user = await this.userRepo.findById(verToken.userId);
  
  // 3. Determine new status based on role
  let newStatus: AccountStatus;
  switch (user.userRole) {
    case UserRole.STUDENT:
      newStatus = AccountStatus.ACTIVE;
      break;
    case UserRole.RECRUITER:
    case UserRole.PLACEMENT_OFFICER:
      newStatus = AccountStatus.PENDING;
      break;
    case UserRole.ADMIN:
      throw new Error('Admin users cannot self-register');
  }
  
  // 4. Update user
  await this.userRepo.updateAccountStatus(user.id, newStatus);
  
  // 5. Mark token used
  await this.verTokenRepo.markUsed(verToken.id);
  
  // 6. Log audit
  await this.auditRepo.log({
    targetUserId: user.id,
    action: 'EMAIL_VERIFIED',
    status: 'SUCCESS',
    ipAddress: ip,
    userAgent
  });
  
  // 7. Publish event
  this.eventBus.publish('auth.email.verified', {
    userId: user.id,
    role: user.userRole,
    newStatus,
    verifiedAt: now()
  });
  
  return { message, accountStatus: newStatus };
}
```

---

## Alternatives Considered

### 1. Everyone → ACTIVE (No Approval)
```
Pro:
- Simple, best UX
- Fastest onboarding

Con:
- Recruiters can spam on day 1
- No control over who uses platform
- Violates recruitment guidelines (need vetting)
```
**Rejected:** Security & compliance risk

### 2. Everyone → PENDING (Mandatory Approval)
```
Pro:
- Maximum security
- Full control

Con:
- Students frustrated (24h wait)
- Adds admin overhead
- Hurts adoption metrics
- Not needed (students are low-risk)
```
**Rejected:** UX degradation

### 3. STUDENT → ACTIVE, Everyone Else → REJECTED (Closed System)
```
Pro:
- Complete control
- No recruiter spam

Con:
- Can't onboard recruiters without DB access
- Violates open recruitment model
- Increases friction
```
**Rejected:** Doesn't support use case

### 4. Approval Queue with Email Notification
```
Pro:
- Recruiter gets transparency
- Can see status

Con:
- More complex (notification service)
- DB polling required
- Out of scope for Phase 2
```
**Rejected:** Can add later as enhancement

---

## Consequences

### Positive

✅ **Students get instant access** — Main user base happy  
✅ **Recruiters vetted before use** — Prevents spam/abuse  
✅ **Clear admin workflow** — Admins see PENDING users, approve in batch  
✅ **Audit trail** — Know when/why status changed  
✅ **Future-proof** — Easy to adjust thresholds (e.g., add email domain whitelist)  
✅ **Role-aware** — Different paths make sense for different roles  

### Negative

❌ **Recruiters have wait time** — Experience friction  
   *Mitigation:* Clear messaging, fast admin review (SLA)

❌ **Admin overhead** — Must actively approve recruiters  
   *Mitigation:* Add bulk approval UI later, or auto-approve whitelisted domains

---

## Related Decisions

- **ADR-001:** Authentication core uses enums for accountStatus
- **ADR-004:** Event bus publishes EmailVerified event (other modules can listen)

---

## Implementation Checklist

- [x] Add `accountStatus` enum to User model
- [x] Update VerifyEmailService with role-based logic
- [x] Add audit log on status change
- [x] Publish EmailVerified event with new status
- [x] Update LoginService to check status (ACTIVE only)
- [x] Add admin API to list PENDING users (Phase 3+)
- [x] Add admin API to approve/reject PENDING users (Phase 3+)

---

## Testing

```typescript
describe('VerifyEmailService', () => {
  it('should activate STUDENT immediately', async () => {
    // 1. Register as STUDENT
    // 2. Get email verification link
    // 3. Click link
    // 4. Verify accountStatus = ACTIVE
    // 5. Should be able to login
  });
  
  it('should set RECRUITER to PENDING', async () => {
    // 1. Register as RECRUITER
    // 2. Get email verification link
    // 3. Click link
    // 4. Verify accountStatus = PENDING
    // 5. Should NOT be able to login (check LoginService)
    // 6. Admin should see in review queue
  });
  
  it('should reject ADMIN self-signup', async () => {
    // 1. Attempt register as ADMIN
    // 2. Should fail with validation error
  });
});
```

---

## Monitoring & Alerts

| Metric | Alert Threshold |
|--------|-----------------|
| PENDING count | > 100 |
| PENDING age | > 7 days without approval |
| RECRUITER approval rate | < 50% |
| ACTIVE students | Track growth |

---

## References

- [ADR-001: Authentication Core Architecture](./ADR-001-authentication-core-architecture.md)
- [ADR-004: Event-Driven Design](./ADR-004-event-driven-design.md)

---

**Approved by:** Architecture Review  
**Status:** Implemented in Unit 4
