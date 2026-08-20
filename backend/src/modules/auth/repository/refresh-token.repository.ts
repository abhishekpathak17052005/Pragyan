/**
 * Refresh Token Repository
 * Handles all refresh token database operations
 * Supports multi-device logout and token rotation
 * 
 * SECURITY: Tokens are hashed (SHA256) before storage
 * Raw tokens are never persisted to database
 */

import crypto from "crypto";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export interface CreateRefreshTokenData {
  token: string;           // Raw token (will be hashed)
  userId: string;
  familyId: string;        // Session family ID for rotation tracking
  expiresAt: Date;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RefreshTokenRepository {
  /**
   * Create refresh token
   * Hashes raw token before storage
   */
  async create(data: CreateRefreshTokenData) {
    const tokenHash = this.hashToken(data.token);
    
    return prisma.refreshToken.create({
      data: {
        tokenHash,
        familyId: data.familyId,
        userId: data.userId,
        expiresAt: data.expiresAt,
        deviceId: data.deviceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Find by raw token (lookup via hash + userId)
   * Since tokenHash is no longer unique (nullable), we find first match
   */
  async findByToken(token: string) {
    const tokenHash = this.hashToken(token);
    
    return prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
  }

  /**
   * Find all active tokens for user (not expired)
   */
  async findByUserId(userId: string) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });
  }

  /**
   * Delete single token (logout from one device)
   */
  async delete(token: string) {
    const tokenHash = this.hashToken(token);
    
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      select: { id: true },
    });

    if (!record) throw new Error("Token not found");

    return prisma.refreshToken.delete({
      where: { id: record.id },
    });
  }

  /**
   * Delete all tokens for user (logout from all devices)
   * Used when:
   * - User changes password (security)
   * - User account compromised (admin action)
   * - User manually requests "logout everywhere"
   */
  async deleteAllByUser(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete tokens older than expiration date (maintenance cleanup)
   * Run periodically to reclaim database space
   * Cron job: Every night at 2 AM
   */
  async deleteExpired() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Count active sessions for user
   * Used to enforce MAX_SESSIONS_PER_USER limit
   */
  async countActiveSessions(userId: string): Promise<number> {
    return prisma.refreshToken.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Check if user has exceeded max sessions
   * If exceeded, delete oldest token
   */
  async enforceSessionLimit(userId: string, maxSessions: number): Promise<void> {
    const count = await this.countActiveSessions(userId);
    
    if (count >= maxSessions) {
      // Delete oldest token
      const oldestToken = await prisma.refreshToken.findFirst({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (oldestToken) {
        await prisma.refreshToken.delete({
          where: { id: oldestToken.id },
        });
      }
    }
  }

  /**
   * Get all active sessions for user
   * Returns token metadata for "active sessions" UI
   */
  async getActiveSessions(userId: string) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Delete specific session by ID
   * Used in "logout from device X" UI feature
   */
  async deleteSession(tokenId: string, userId: string) {
    return prisma.refreshToken.deleteMany({
      where: {
        id: tokenId,
        userId, // Verify ownership for security
      },
    });
  }

  /**
   * Check if token is valid and not expired
   */
  async isValid(token: string): Promise<boolean> {
    const record = await this.findByToken(token);

    if (!record) return false;
    if (!record.expiresAt || record.expiresAt < new Date()) return false;

    return true;
  }

  /**
   * Update last used timestamp
   * Useful for tracking session activity
   */
  async updateLastUsed(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      select: { id: true },
    });

    if (!record) throw new Error("Token not found");

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Rotate token (delete old, create new)
   * Used in token refresh flow
   */
  async rotate(oldToken: string, newToken: string, newExpiresAt: Date) {
    const oldRecord = await this.findByToken(oldToken);
    
    if (!oldRecord) {
      throw new Error("Token not found");
    }

    // Delete old token
    await this.delete(oldToken);

    // Create new token with same device metadata and family (cast to any to avoid type issues)
    const record = oldRecord as any;
    return this.create({
      token: newToken,
      familyId: record.familyId || randomUUID(),
      userId: record.userId,
      expiresAt: newExpiresAt,
      deviceId: record.deviceId || undefined,
      ipAddress: record.ipAddress || undefined,
      userAgent: record.userAgent || undefined,
    });
  }

  /**
   * Revoke entire token family (security incident)
   * Used when token theft is detected
   */
  async revokeFamily(familyId: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /**
   * Check if token has been revoked (security incident indicator)
   * Returns revokedAt timestamp if revoked, null if valid
   */
  async checkRevocation(token: string): Promise<{ revokedAt: Date | null; familyId?: string }> {
    const tokenHash = this.hashToken(token);
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      select: { revokedAt: true, familyId: true },
    });

    if (!record) {
      return { revokedAt: null };
    }

    return {
      revokedAt: record.revokedAt,
      familyId: record.familyId || undefined,
    };
  }

  /**
   * Hash token for storage (one-way, like verification tokens)
   * Never store raw tokens in database
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
