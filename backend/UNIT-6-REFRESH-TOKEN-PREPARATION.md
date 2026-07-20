# Unit 6 Preparation: POST /auth/refresh

**Status:** 🟡 Ready for Implementation  
**Phase:** 2 (Authentication)  
**Milestone:** v0.1.0-auth-core (FROZEN)  
**Target:** Token rotation, multi-device session support

---

## Overview

Unit 6 implements the refresh token rotation endpoint, completing the session lifecycle:

```
Login (Unit 5)
  ├─ Generate: accessToken (JWT, 24h), refreshToken (hashed, 30d, familyId)
  ├─ Store: refreshToken hash with metadata
  └─ Return: raw tokens to user

Refresh (Unit 6) ← START HERE
  ├─ Input: { refreshToken }
  ├─ Verify: token hash, not revoked, not expired
  ├─ Rotate: delete old, create new (SAME familyId)
  ├─ Generate: new accessToken, new refreshToken
  └─ Return: new tokens to user

Logout (Unit 7)
  ├─ Input: { refreshToken, logoutAllDevices? }
  ├─ Revoke: single token OR entire family
  └─ Return: confirmation

Password Reset (Units 8-9)
  └─ Revoke all tokens (force re-login)
```

---

## Implementation Checklist

### 1. RefreshService (New Service)

**File:** `backend/src/modules/auth/services/refresh.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from '../repository/refresh-token.repository';
import { JwtService } from '../services/jwt.service';
import { EventBus } from '../../common/event-bus';

@Injectable()
export class RefreshService {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Rotate refresh token: delete old, create new (same family)
   * 
   * Flow:
   * 1. Hash incoming token
   * 2. Find token by hash
   * 3. Verify: not expired, not revoked
   * 4. Check for theft (old token consumed)
   * 5. Get familyId
   * 6. Generate new access token
   * 7. Generate new refresh token (same familyId)
   * 8. Delete old refresh token
   * 9. Publish SessionRefreshed event
   * 10. Return new tokens
   */
  async rotate(
    oldToken: string,
    ip: string,
    userAgent: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Hash incoming token
    const oldHash = this.hashToken(oldToken);

    // 2. Find token by hash
    const oldRecord = await this.refreshTokenRepo.findByHash(oldHash);
    if (!oldRecord) {
      // Token not found = tampered or expired
      throw new InvalidTokenError('Refresh token invalid or expired');
    }

    // 3. Verify not expired
    if (oldRecord.expiresAt < new Date()) {
      throw new InvalidTokenError('Refresh token expired');
    }

    // 4. Verify not revoked
    if (oldRecord.revokedAt) {
      // Revoked = either logout or theft detected
      // Publish security event
      this.eventBus.publish('auth.session.revoked', {
        familyId: oldRecord.familyId,
        reason: 'REVOKED_TOKEN_REUSE',
        timestamp: new Date()
      });
      throw new InvalidTokenError('Refresh token revoked');
    }

    // 5. Get familyId (preserve across rotations)
    const familyId = oldRecord.familyId;

    // 6. Generate new access token
    const user = await this.userService.findById(oldRecord.userId);
    const accessToken = this.jwtService.generateAccessToken(user);

    // 7. Generate new refresh token (same family)
    const { token: newToken, hash: newHash } = this.generateRefreshToken();
    
    // 8a. Create new refresh token record (same familyId)
    const newRecord = await this.refreshTokenRepo.create({
      tokenHash: newHash,
      familyId, // ← SAME FAMILY (crucial!)
      userId: oldRecord.userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceId: oldRecord.deviceId,
      ipAddress: ip,
      userAgent,
      lastUsedAt: new Date()
    });

    // 8b. Delete old refresh token
    await this.refreshTokenRepo.delete(oldRecord.id);

    // 9. Publish event
    this.eventBus.publish('auth.session.refreshed', {
      userId: oldRecord.userId,
      familyId,
      newTokenId: newRecord.id,
      ip,
      timestamp: new Date()
    });

    // 10. Return new tokens
    return {
      accessToken,
      refreshToken: newToken // Raw token (will be hashed if stored elsewhere)
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateRefreshToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    return { token, hash };
  }
}
```

**Key Points:**
- ✅ Verify token exists, not expired, not revoked
- ✅ Preserve familyId (same family across rotations)
- ✅ Delete old token after creating new
- ✅ Update IP/User-Agent (device tracking)
- ✅ Publish SessionRefreshed event
- ✅ Return both new tokens

### 2. RefreshController (New Endpoint)

**File:** `backend/src/modules/auth/controllers/refresh.controller.ts`

```typescript
import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { RefreshService } from '../services/refresh.service';
import { RefreshDto } from '../schemas/refresh.schema';
import { asyncHandler } from '../../common/middleware/async-handler';

@Controller('auth')
export class RefreshController {
  constructor(private readonly refreshService: RefreshService) {}

  @Post('refresh')
  @asyncHandler()
  async refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const result = await this.refreshService.rotate(
      dto.refreshToken,
      ip,
      userAgent
    );

    return {
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    };
  }
}
```

**Key Points:**
- ✅ Accept refreshToken in body
- ✅ Extract IP and User-Agent from request
- ✅ Call RefreshService.rotate()
- ✅ Return new tokens

### 3. Refresh Schema (Validation)

**File:** `backend/src/modules/auth/schemas/refresh.schema.ts`

```typescript
import { z } from 'zod';

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token required')
    .regex(/^[a-f0-9]+$/, 'Invalid token format')
});

export type RefreshDto = z.infer<typeof refreshSchema>;
```

**Key Points:**
- ✅ Validate refreshToken is hex string
- ✅ Min length check
- ✅ TypeScript inference

### 4. Update RefreshTokenRepository

**File:** `backend/src/modules/auth/repository/refresh-token.repository.ts`

Add method (if not already present):

```typescript
// Get all tokens in same family
async findByFamilyId(familyId: string): Promise<RefreshToken[]> {
  return this.db.refreshToken.findMany({
    where: { familyId }
  });
}

// Update token metadata
async updateLastUsed(id: string): Promise<RefreshToken> {
  return this.db.refreshToken.update({
    where: { id },
    data: { lastUsedAt: new Date() }
  });
}
```

### 5. Update Event Bus (Events)

**File:** `backend/src/modules/auth/events/session.events.ts` (New)

```typescript
export interface SessionRefreshedEvent {
  userId: string;
  familyId: string;
  newTokenId: string;
  ip: string;
  timestamp: Date;
}

export interface SessionRevokedEvent {
  familyId: string;
  reason: 'REVOKED_TOKEN_REUSE' | 'USER_LOGOUT' | 'THEFT_DETECTED';
  timestamp: Date;
}

export interface SessionTheftDetectedEvent {
  userId: string;
  familyId: string;
  oldTokenHash: string;
  newTokenHash: string;
  ip: string;
  timestamp: Date;
}
```

### 6. Update Routes

**File:** `backend/src/modules/auth/routes.ts`

```typescript
import { RefreshController } from './controllers/refresh.controller';

export const authRoutes = [
  // ... existing routes
  {
    path: 'refresh',
    method: 'POST',
    controller: RefreshController,
    handler: 'refresh'
  }
];
```

### 7. Integration Tests

**File:** `backend/src/modules/auth/services/__tests__/refresh.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { RefreshService } from '../refresh.service';
import { RefreshTokenRepository } from '../../repository/refresh-token.repository';

describe('RefreshService', () => {
  let service: RefreshService;
  let repository: RefreshTokenRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RefreshService,
        {
          provide: RefreshTokenRepository,
          useValue: {
            findByHash: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get(RefreshService);
    repository = module.get(RefreshTokenRepository);
  });

  it('should rotate token and preserve familyId', async () => {
    // 1. Setup: Create old token record
    const oldRecord = {
      id: 'token-1',
      tokenHash: 'hash-1',
      familyId: 'family-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revokedAt: null,
      deviceId: 'device-1',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    jest.spyOn(repository, 'findByHash').mockResolvedValue(oldRecord);
    jest.spyOn(repository, 'create').mockResolvedValue({
      ...oldRecord,
      id: 'token-2',
      tokenHash: 'hash-2'
    });
    jest.spyOn(repository, 'delete').mockResolvedValue(oldRecord);

    // 2. Call rotate
    const result = await service.rotate('raw-token', '192.168.1.2', 'Mozilla/5.0');

    // 3. Verify
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // 4. Verify familyId preserved
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: 'family-1' // ← Same family
      })
    );

    // 5. Verify old token deleted
    expect(repository.delete).toHaveBeenCalledWith('token-1');
  });

  it('should detect revoked token', async () => {
    const revokedRecord = {
      ...baseRecord,
      revokedAt: new Date(Date.now() - 1000)
    };

    jest.spyOn(repository, 'findByHash').mockResolvedValue(revokedRecord);

    await expect(service.rotate('raw-token', '192.168.1.2', 'Mozilla'))
      .rejects
      .toThrow('Refresh token revoked');
  });

  it('should detect expired token', async () => {
    const expiredRecord = {
      ...baseRecord,
      expiresAt: new Date(Date.now() - 1000) // Past
    };

    jest.spyOn(repository, 'findByHash').mockResolvedValue(expiredRecord);

    await expect(service.rotate('raw-token', '192.168.1.2', 'Mozilla'))
      .rejects
      .toThrow('Refresh token expired');
  });
});
```

---

## Error Handling

### InvalidTokenError

```typescript
class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

// In middleware/error handler:
if (error instanceof InvalidTokenError) {
  return res.status(401).json({
    success: false,
    message: 'Invalid or expired refresh token',
    code: 'INVALID_REFRESH_TOKEN'
  });
}
```

---

## API Response Format

### Success (200)

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### Error: Token Expired (401)

```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

### Error: Token Revoked (401)

```json
{
  "success": false,
  "message": "Session revoked",
  "code": "SESSION_REVOKED"
}
```

---

## Testing Checklist

- [ ] ✅ Valid token rotation preserves familyId
- [ ] ✅ Old token deleted after rotation
- [ ] ✅ New tokens returned (accessToken, refreshToken)
- [ ] ✅ Expired token rejected
- [ ] ✅ Revoked token rejected
- [ ] ✅ Invalid token format rejected
- [ ] ✅ IP/User-Agent updated
- [ ] ✅ SessionRefreshed event published
- [ ] ✅ Multi-device scenario (two rotations in same family)
- [ ] ✅ Error responses formatted correctly

---

## Frontend Integration

### Usage Example

```typescript
// TypeScript (React)
async function refreshAccessToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } else {
    // Token expired/revoked → redirect to login
    window.location.href = '/login';
  }
}

// Axios interceptor (auto-refresh on 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newAccessToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## Architecture Diagram

```
Client
  ├─ POST /auth/refresh { refreshToken }
  │
Backend (RefreshController)
  ├─ Extract: refreshToken, IP, User-Agent
  │
RefreshService
  ├─ Hash: SHA256(refreshToken)
  ├─ Find: RefreshTokenRepository.findByHash()
  ├─ Verify: not expired, not revoked
  ├─ Generate: new JWT access token
  ├─ Generate: new refresh token (raw + hashed)
  ├─ Create: RefreshTokenRepository.create()
  ├─ Delete: old token
  ├─ Publish: SessionRefreshed event
  │
  └─ Return: { accessToken, refreshToken }

Other Services (EventBus subscribers)
  ├─ Analytics: Track session refresh
  ├─ AuditLog: Record refresh action
  └─ SecurityService: Monitor for anomalies
```

---

## Status

| Item | Status | Details |
|------|--------|---------|
| RefreshService | 🔲 TODO | Create service with rotate() method |
| RefreshController | 🔲 TODO | Create POST /auth/refresh endpoint |
| RefreshSchema | 🔲 TODO | Zod validation |
| RefreshTokenRepository | ✅ DONE | Already has findByHash(), create(), delete() |
| Event Publishing | 🔲 TODO | Publish SessionRefreshed event |
| Tests | 🔲 TODO | Unit + integration tests |
| API Documentation | 🔲 TODO | Update docs/API.md |
| Integration Test | 🔲 TODO | End-to-end test (register → login → refresh) |

---

## Next Steps

1. ✅ **Review this document** with architecture
2. 🔲 **Implement RefreshService** (rotate method)
3. 🔲 **Create RefreshController** (POST /auth/refresh endpoint)
4. 🔲 **Add RefreshSchema** (validation)
5. 🔲 **Publish events** (SessionRefreshed)
6. 🔲 **Write tests** (unit + integration)
7. 🔲 **Manual testing** (Postman/curl)
8. 🔲 **Update API documentation**
9. 🔲 **Code review**
10. 🔲 **Merge to main**

---

## References

- [ADR-001: Authentication Core](../docs/adr/ADR-001-authentication-core-architecture.md)
- [ADR-003: Token Strategy](../docs/adr/ADR-003-token-strategy.md)
- [ADR-004: Event-Driven Design](../docs/adr/ADR-004-event-driven-design.md)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [OAuth2 Refresh Token Security](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#section-2.1)

---

**Status:** Ready for Implementation  
**Estimated Duration:** 2-3 hours  
**Complexity:** Medium (stateful + event handling)  
**Risk Level:** Low (frozen architecture, proven pattern)
