# Architecture Decision Records (ADRs)

**Status:** 4/4 Complete for Authentication Core  
**Phase:** 2 (Authentication)  
**Last Updated:** July 14, 2026

---

## Overview

Architecture Decision Records document significant design choices with:
- **Context:** Why the decision was needed
- **Decision:** What was chosen and why
- **Alternatives:** What was rejected and why
- **Consequences:** Positive and negative outcomes

ADRs serve as:
- Design rationale for future maintainers
- Rollback points if requirements change
- Reference for similar decisions in other modules

---

## ADRs for Authentication Core

### ADR-001: Authentication Core Architecture

**Status:** ACCEPTED  
**Phase:** 2  
**Link:** [ADR-001-authentication-core-architecture.md](./ADR-001-authentication-core-architecture.md)

**Summary:**
Implement authentication as frozen core with stateless JWT access tokens, stateful hashed refresh tokens, token families for multi-device sessions, verification tokens for one-time actions, and structured audit logging.

**Key Decisions:**
- JWT (HS256, 24h) for access tokens
- Hashed refresh tokens (SHA256, 30d) for sessions
- Token families (familyId) for multi-device isolation
- Verification tokens (hashed, one-time use)
- Role-based activation (STUDENT→ACTIVE, others→PENDING)
- Structured audit logging with enums

**Trade-offs:**
- ✅ Stateless access layer (fast, scalable)
- ✅ Stateful refresh layer (can revoke)
- ✅ Multi-device support (per-device tracking)
- ✅ Theft detection (token reuse)
- ❌ Token revocation delay (until expiry)
- ❌ Rate limiting in-memory (doesn't survive restart)

---

### ADR-002: Role-Based Activation Strategy

**Status:** ACCEPTED  
**Phase:** 2, Unit 4  
**Link:** [ADR-002-role-based-activation.md](./ADR-002-role-based-activation.md)

**Summary:**
After email verification, activate users based on role: STUDENT→ACTIVE (immediate), RECRUITER/PLACEMENT_OFFICER→PENDING (admin approval), ADMIN not self-signup.

**Key Decisions:**
- Students: Immediate access (low risk, main user base)
- Recruiters: Pending approval (abuse risk, vetting needed)
- Officers: Pending approval (institutional staff)
- Admins: No self-signup (manual provisioning)

**Trade-offs:**
- ✅ Best UX for students (instant access)
- ✅ Security for high-risk roles (recruiters vetted)
- ✅ Clear admin workflow
- ❌ Recruiters have wait time (experience friction)

---

### ADR-003: Token Hashing & Family Tracking Strategy

**Status:** ACCEPTED  
**Phase:** 2, Units 3-5  
**Link:** [ADR-003-token-strategy.md](./ADR-003-token-strategy.md)

**Summary:**
Hash all tokens (refresh, verification) using SHA256; group refresh tokens by familyId for multi-device isolation and theft detection.

**Key Decisions:**
- Store only tokenHash (SHA256), never raw
- Return raw token once to user
- Group tokens by familyId (same session)
- Reuse familyId on refresh
- Revoke entire family on theft

**Trade-offs:**
- ✅ Database breach doesn't leak sessions
- ✅ Multi-device support (per-device + family)
- ✅ Theft detection (old token reuse detected)
- ✅ Industry standard (bcryptjs, OAuth2)
- ❌ Extra computation (SHA256 per verify, negligible)
- ❌ No token recovery (if user loses device)

---

### ADR-004: Event-Driven Architecture for Authentication

**Status:** ACCEPTED  
**Phase:** 2  
**Link:** [ADR-004-event-driven-design.md](./ADR-004-event-driven-design.md)

**Summary:**
Implement in-process event bus (Observer pattern) for Phase 2-3; publish auth events (UserRegistered, EmailVerified, LoginSuccess, etc.); other modules subscribe (NotificationService, StudentProfileService, Analytics, etc.).

**Key Decisions:**
- In-process EventBus (no external services)
- Publish from auth services
- Subscribe from other modules
- Error isolation (handler failure doesn't break others)
- Upgrade path to RabbitMQ (interface remains same)

**Trade-offs:**
- ✅ Loose coupling (modules independent)
- ✅ Easy testing (mock EventBus)
- ✅ Observable (can log all events)
- ✅ Extensible (new listeners without touching auth)
- ✅ No infrastructure (just Node.js)
- ❌ No persistence (events lost on crash)
- ❌ Synchronous (slow handler blocks)
- ❌ No ordering guarantee (multiple handlers)

---

## Future ADRs (Planned)

### ADR-005: Roadmap CMS Architecture (Phase 3)
- Data model for roadmaps, topics, lessons
- Resource types and organization
- Progress tracking mechanism

### ADR-006: Learning Progress Engine (Phase 4)
- XP calculation and achievement system
- Streak tracking mechanism
- Certificate generation

### ADR-007: Recruitment Module Architecture (Phase 5)
- Company portal design
- Application workflow
- Hiring drive management

### ADR-008: Placement Module Architecture (Phase 6)
- Placement record tracking
- Analytics and reporting
- College integration

### ADR-009: AI Mentor Service (Phase 7)
- Skill gap analysis
- Roadmap recommendation
- Career path guidance

---

## Decision History

| Date | Phase | ADR | Title | Status |
|------|-------|-----|-------|--------|
| 2026-07-14 | 2 | 001 | Authentication Core | ACCEPTED |
| 2026-07-14 | 2 | 002 | Role-Based Activation | ACCEPTED |
| 2026-07-14 | 2 | 003 | Token Strategy | ACCEPTED |
| 2026-07-14 | 2 | 004 | Event-Driven Design | ACCEPTED |

---

## How to Add an ADR

### When

- Before implementing a significant feature
- When making a trade-off decision
- When architecture changes scope

### Template

```markdown
# ADR-XXX: [Title]

**Date:** [YYYY-MM-DD]
**Status:** [PROPOSED / ACCEPTED / DEPRECATED]
**Phase:** [X] ([Feature])

---

## Context
[Why is this decision needed?]

---

## Decision
[What was chosen and why?]

---

## Alternatives Considered
[What was rejected and why?]

---

## Consequences
[Positive and negative outcomes]

---

## Related Decisions
[Links to other ADRs]

---

## References
[External documentation]

---

**Status:** [Implementation status]
```

### Process

1. Create new file: `ADR-XXX-title.md`
2. Fill in template
3. Review with team
4. Update status to ACCEPTED
5. Link from this README

---

## References

- [Documenting Architecture Decisions (Nygard, 2011)](https://cognitiveload.org/2016/adr/)
- [ADR GitHub Repository](https://adr.github.io/)
- [Architectural Decision Records in Practice](https://www.youtube.com/watch?v=41NVge7soH0)

---

**Maintained By:** Pragyan Architecture Team  
**Last Updated:** July 14, 2026
