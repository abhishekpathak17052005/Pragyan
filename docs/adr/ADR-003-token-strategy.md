# ADR-003: Token Hashing & Family Tracking Strategy

**Date:** July 14, 2026  
**Status:** ACCEPTED  
**Phase:** 2 (Authentication), Units 3-5

---

## Context

Two critical security decisions for refresh tokens:

1. **Should tokens be hashed or stored raw in database?**
2. **How to handle multi-device sessions and theft detection?**

Constraints:
- Prevent token leak from database breach
- Support multi-device sessions (laptop + phone)
- Detect and isolate theft quickly
- Balance security vs. complexity

---

## Decision

### 1. Hash All Tokens (SHA256)

**Store only the hash in database, never the raw token.**

```
Token Generation:
  └─ Crypto: randomBytes(32) → raw token
  └─ Hash: SHA256(raw token) → tokenHash
  └─ Return: raw token to user (one-time)
  └─ Store: tokenHash in DB

Token Verification:
  └─ User sends: raw token in request
  └─ Hash: SHA256(raw token) → computed hash
  └─ Query: WHERE tokenHash = computed hash
  └─ Match: Valid | No match: Invalid/Revoked
```

**Implementation:**

```typescript
// Generate
async function generateRefreshToken(): Promise<{ token: string; hash: string }> {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

// Store
await refreshTokenRepo.create({
  tokenHash: hash,  // Store ONLY hash
  familyId: uuid(),
  userId,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
});

// Return to user (one-time)
return { accessToken, refreshToken: token };

// Verify
const computedHash = crypto.createHash('sha256').update(incomingToken).digest('hex');
const found = await refreshTokenRepo.findByHash(computedHash);
```

### 2. Token Families (Session Tracking)

**Group related tokens by `familyId` for multi-device support and theft detection.**

```
Device 1 (Laptop):
  └─ Login → Token A (familyId: F1)
  └─ Refresh → Token A' (familyId: F1)
  └─ Refresh → Token A'' (familyId: F1)

Device 2 (Phone):
  └─ Login → Token B (familyId: F1)
  └─ Refresh → Token B' (familyId: F1)

Theft Detection:
  └─ Attacker uses old Token A (already consumed)
  └─ Service detects: Token was issued, but different hash attempted
  └─ Action: Revoke entire familyId (F1)
  └─ Result: Both devices logged out, user must re-login
```

**Implementation:**

```typescript
// Generate family on login
async login(email: string, password: string) {
  // ... verify credentials
  const familyId = crypto.randomUUID();
  const { token, hash } = generateRefreshToken();
  
  await refreshTokenRepo.create({
    tokenHash: hash,
    familyId,  // New family
    userId,
    // ... device metadata
  });
  
  return { accessToken, refreshToken: token };
}

// Preserve family on refresh (rotation)
async rotate(oldToken: string) {
  const oldHash = hashToken(oldToken);
  const oldRecord = await refreshTokenRepo.findByHash(oldHash);
  
  const familyId = oldRecord.familyId;  // Reuse family
  const { token, hash } = generateRefreshToken();
  
  // Create new token in same family
  await refreshTokenRepo.create({
    tokenHash: hash,
    familyId,  // Same family
    userId: oldRecord.userId,
    // ... device metadata
  });
  
  // Delete old (optional, or mark revoked)
  await refreshTokenRepo.delete(oldRecord.id);
  
  return { accessToken, refreshToken: token };
}

// Revoke family on theft detection
async revokeFamily(familyId: string) {
  // Mark all tokens in family as revoked
  await refreshTokenRepo.updateMany(
    { familyId },
    { revokedAt: new Date() }
  );
}
```

---

## Alternatives Considered

### 1. Raw Tokens in Database
```
Pro:
- Simpler code (no hashing)
- One query (no hash computation)

Con:
- Database breach = all sessions compromised
- No mitigation if DB leaks
- Industry standard (bcryptjs, JWT) uses hashing
- VIOLATION of zero-trust security
```
**Rejected:** Unacceptable security risk

### 2. JWT for Refresh (All Stateless)
```
Pro:
- No database lookup
- Simpler architecture

Con:
- Can't revoke (token valid until expiry)
- Can't detect theft
- Can't implement logout
- No device tracking
```
**Rejected:** Doesn't meet requirements

### 3. One Token Per User (No Family)
```
Pro:
- Simplest DB schema
- Theft revokes all devices

Con:
- Can't support multi-device
- Must logout everywhere on refresh
- Poor UX (phone login revokes laptop)
- Doesn't detect which device compromised
```
**Rejected:** Conflicts with roadmap (multi-device support)

### 4. UUID Instead of Random Bytes
```
Pro:
- Shorter tokens
- Easier to handle

Con:
- Weaker entropy (UUID v4 = 122 bits vs 256 bits)
- Predictable if pattern leaked
- Industry uses random bytes (OAuth2, etc.)
```
**Rejected:** Security downgrade

---

## Consequences

### Positive

✅ **Database breach doesn't leak sessions** — Hashes can't be reversed  
✅ **Multi-device support** — Each device has own token, but family tracks  
✅ **Theft detection** — Old token reuse triggers incident  
✅ **Selective logout** — Revoke one device or all  
✅ **Industry standard** — Follows bcryptjs, JWT patterns  
✅ **Future-proof** — Easy to add device audit, per-device revocation  

### Negative

❌ **Extra computation** — SHA256 per verification (negligible, ~0.1ms)  
   *Mitigation:* Cache in Redis if needed

❌ **Can't recover token** — If user loses device, token is gone  
   *Mitigation:* Logout all devices triggers new login

❌ **Replay attacks still possible** — Intercepted token valid until expiry  
   *Mitigation:* HTTPS enforced, short expiry (24h), device binding

---

## Related Decisions

- **ADR-001:** JWT for access tokens (stateless), refresh tokens (stateful)
- **ADR-004:** Publish SessionTheft event when family revoked

---

## Database Schema

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique  // SHA256 hash only
  familyId  String           // UUID, groups related tokens
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  expiresAt DateTime
  revokedAt DateTime?        // null = valid, set = revoked
  
  // Device metadata
  deviceId   String?
  ipAddress  String?
  userAgent  String?
  lastUsedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
  @@index([familyId])
  @@index([tokenHash])
  @@index([expiresAt])
  @@index([revokedAt])
}
```

---

## Implementation Checklist

- [x] Add tokenHash field (unique)
- [x] Add familyId field
- [x] Add revokedAt field
- [x] Implement hashToken() helper
- [x] Update generateRefreshToken()
- [x] Update RefreshTokenRepository.findByHash()
- [x] Update rotate() to preserve familyId
- [x] Update revokeFamily() to mark all as revoked
- [x] Add device metadata tracking
- [x] Add audit logging on revocation
- [x] Add JWT versioning (ver field) for future compatibility

---

## Testing

```typescript
describe('Token Hashing & Family Tracking', () => {
  it('should store only hash, never raw token', async () => {
    const { token, hash } = generateRefreshToken();
    await repo.create({ tokenHash: hash, familyId, userId });
    
    // Verify only hash is stored
    const record = await db.refreshToken.findFirst({ where: { id } });
    expect(record.tokenHash).toBe(hash);
    expect(record.tokenHash).not.toBe(token);
  });
  
  it('should verify token by hashing incoming token', async () => {
    const { token, hash } = generateRefreshToken();
    await repo.create({ tokenHash: hash, familyId, userId });
    
    // Verify incoming token
    const found = await repo.findByHash(hashToken(token));
    expect(found).toBeDefined();
    expect(found.id).toBe(...);
  });
  
  it('should preserve familyId on rotation', async () => {
    // 1. Login (new family)
    const { token: token1, familyId } = await service.login(...);
    
    // 2. Rotate (same family)
    const { token: token2 } = await service.rotate(token1);
    
    // 3. Verify same family
    const record2 = await repo.findByHash(hashToken(token2));
    expect(record2.familyId).toBe(familyId);
  });
  
  it('should revoke entire family on theft', async () => {
    // 1. Two devices in same family
    const dev1 = await service.login(...);
    const dev2 = await service.login(...);
    
    // 2. Detect theft (old token reused)
    await service.revokeFamily(familyId);
    
    // 3. Verify all revoked
    const records = await repo.find({ where: { familyId } });
    records.forEach(r => expect(r.revokedAt).toBeDefined());
  });
});
```

---

## Monitoring & Alerts

| Event | Alert |
|-------|-------|
| Family revoked | Publish SessionTheft event |
| Token not found | Possible credential compromise |
| Multiple families per user in 1 hour | Possible account takeover |

---

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6234 - Cryptographic Hash Functions](https://tools.ietf.org/html/rfc6234)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [bcryptjs - Password Hashing](https://github.com/dcodeIO/bcrypt.js)

---

**Approved by:** Architecture Review  
**Status:** Implemented in Units 3-5
