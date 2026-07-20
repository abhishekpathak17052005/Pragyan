/**
 * Login Throttle Service
 * Prevents brute-force attacks with rate limiting
 * 
 * Configuration via AUTH_CONSTANTS (configurable via environment)
 */

import { LOGIN_SECURITY_CONSTANTS } from "../constants/jwt.constants";

interface ThrottleRecord {
  attempts: number;
  lastAttemptAt: number;  // timestamp
  lockedUntil: number;    // timestamp (0 if not locked)
}

const loginAttempts = new Map<string, ThrottleRecord>();

export class LoginThrottleService {
  /**
   * Check if email is locked due to too many failed attempts
   * Returns: { isLocked: boolean, remainingMs: number }
   */
  static isLocked(email: string): { isLocked: boolean; remainingMs: number } {
    const record = loginAttempts.get(email);
    
    if (!record) {
      return { isLocked: false, remainingMs: 0 };
    }

    const now = Date.now();
    
    // Check if lockout period has expired
    if (record.lockedUntil > 0 && now < record.lockedUntil) {
      return { 
        isLocked: true, 
        remainingMs: record.lockedUntil - now 
      };
    }

    // Lockout expired, reset
    if (record.lockedUntil > 0 && now >= record.lockedUntil) {
      loginAttempts.delete(email);
      return { isLocked: false, remainingMs: 0 };
    }

    return { isLocked: false, remainingMs: 0 };
  }

  /**
   * Record failed login attempt
   * Locks account if threshold reached
   */
  static recordFailedAttempt(email: string): void {
    const now = Date.now();
    const record = loginAttempts.get(email);
    const resetWindowMs = LOGIN_SECURITY_CONSTANTS.LOGIN_LOCK_MINUTES * 60 * 1000;
    const lockoutDurationMs = LOGIN_SECURITY_CONSTANTS.LOGIN_LOCK_MINUTES * 60 * 1000;

    if (!record) {
      // First failure
      loginAttempts.set(email, {
        attempts: 1,
        lastAttemptAt: now,
        lockedUntil: 0,
      });
      return;
    }

    // Check if we should reset (outside the reset window)
    if (now - record.lastAttemptAt > resetWindowMs) {
      // Reset to 1 attempt
      loginAttempts.set(email, {
        attempts: 1,
        lastAttemptAt: now,
        lockedUntil: 0,
      });
      return;
    }

    // Within reset window, increment attempts
    record.attempts++;
    record.lastAttemptAt = now;

    // Lock if threshold reached
    if (record.attempts >= LOGIN_SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = now + lockoutDurationMs;
    }

    loginAttempts.set(email, record);
  }

  /**
   * Reset failed attempts on successful login
   */
  static recordSuccessfulLogin(email: string): void {
    loginAttempts.delete(email);
  }

  /**
   * Get current attempt count (for logging)
   */
  static getAttemptCount(email: string): number {
    const record = loginAttempts.get(email);
    return record?.attempts || 0;
  }

  /**
   * Cleanup expired lockouts periodically
   * Call from a cron job (e.g., every 5 minutes)
   */
  static cleanup(): number {
    const now = Date.now();
    const resetWindowMs = LOGIN_SECURITY_CONSTANTS.LOGIN_LOCK_MINUTES * 60 * 1000;
    let cleaned = 0;

    for (const [email, record] of loginAttempts.entries()) {
      // Remove if:
      // - Not locked and outside reset window
      // - Locked and lockout expired
      if ((record.lockedUntil === 0 && now - record.lastAttemptAt > resetWindowMs) ||
          (record.lockedUntil > 0 && now > record.lockedUntil + resetWindowMs)) {
        loginAttempts.delete(email);
        cleaned++;
      }
    }

    return cleaned;
  }
}
