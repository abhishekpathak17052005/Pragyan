/**
 * Verification Token Repository
 * Handles token lifecycle: creation, consumption, cleanup
 * Stores hashed tokens only (never raw)
 * 
 * Supports multiple purposes:
 * - EMAIL_VERIFY: Email verification after registration
 * - PASSWORD_RESET: Password reset flow
 * - INVITATION: Invitation acceptance
 * - MAGIC_LOGIN: Magic link login (future)
 * - EMAIL_CHANGE: Email change verification (future)
 */

import { TokenPurpose } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export class VerificationTokenRepository {
  /**
   * Create and store verification token
   * @param userId User ID
   * @param purpose Token purpose (EMAIL_VERIFY, PASSWORD_RESET, etc.)
   * @param expiresAt Token expiration time
   * @returns Raw token (only returned once, never stored raw)
   */
  async create(userId: string, purpose: TokenPurpose, expiresAt: Date): Promise<string> {
    // Generate raw token
    const rawToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token for storage (one-way)
    const tokenHash = this.hashToken(rawToken);

    // Store hashed token
    await prisma.verificationToken.create({
      data: {
        userId,
        tokenHash,
        purpose,
        expiresAt,
      },
    });

    // Return raw token (only time it's exposed)
    return rawToken;
  }

  /**
   * Consume token - atomic operation
   * Finds, validates, marks as used in one operation
   * @param rawToken Raw token from client
   * @param purpose Expected token purpose
   * @returns User ID if valid, throws if invalid/expired/used
   * 
   * Throws:
   * - "Invalid verification link" - token not found, expired, used, or wrong purpose
   * - Never reveals specific reason (security)
   */
  async consume(rawToken: string, purpose: TokenPurpose): Promise<string> {
    const tokenHash = this.hashToken(rawToken);

    // Find token
    const token = await prisma.verificationToken.findFirst({
      where: { tokenHash },
    });

    // Validate: all checks return same generic error
    if (!token || token.purpose !== purpose || !token.expiresAt || token.expiresAt < new Date() || token.usedAt) {
      throw new Error("Invalid verification link");
    }

    // Find by id to update (since tokenHash is no longer unique)
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    return token.userId;
  }

  /**
   * Cleanup - remove expired tokens (maintenance operation)
   * Call periodically (e.g., daily cron) to keep Mongo clean
   * @returns Number of deleted tokens
   */
  async cleanup(): Promise<number> {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * Revoke all tokens for a user (optional cleanup)
   * Use when user changes email, requests new token, etc.
   */
  async revokeByUser(userId: string, purpose?: TokenPurpose): Promise<number> {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        userId,
        ...(purpose && { purpose }),
      },
    });

    return result.count;
  }

  /**
   * Hash token for storage (one-way)
   * Never store raw tokens
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

export const verificationTokenRepository = new VerificationTokenRepository();
