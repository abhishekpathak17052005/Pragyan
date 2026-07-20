/**
 * Password Policy
 * Single source of truth for password validation rules
 * Used by both validators and services
 */

import { PASSWORD_CONSTANTS, PASSWORD_PATTERNS } from "../constants";
import { WeakPasswordError } from "../errors";

export class PasswordPolicy {
  /**
   * Validate password against policy
   * Throws WeakPasswordError if validation fails
   */
  static validate(password: string): void {
    // Check length
    if (password.length < PASSWORD_CONSTANTS.MIN_LENGTH) {
      throw new WeakPasswordError(
        `Password must be at least ${PASSWORD_CONSTANTS.MIN_LENGTH} characters`
      );
    }

    if (password.length > PASSWORD_CONSTANTS.MAX_LENGTH) {
      throw new WeakPasswordError(
        `Password must not exceed ${PASSWORD_CONSTANTS.MAX_LENGTH} characters`
      );
    }

    // Check required character types
    if (
      PASSWORD_CONSTANTS.REQUIRE_UPPERCASE &&
      !PASSWORD_PATTERNS.UPPERCASE.test(password)
    ) {
      throw new WeakPasswordError(
        "Password must contain at least one uppercase letter"
      );
    }

    if (
      PASSWORD_CONSTANTS.REQUIRE_LOWERCASE &&
      !PASSWORD_PATTERNS.LOWERCASE.test(password)
    ) {
      throw new WeakPasswordError(
        "Password must contain at least one lowercase letter"
      );
    }

    if (
      PASSWORD_CONSTANTS.REQUIRE_NUMBERS &&
      !PASSWORD_PATTERNS.NUMBERS.test(password)
    ) {
      throw new WeakPasswordError(
        "Password must contain at least one number"
      );
    }

    if (
      PASSWORD_CONSTANTS.REQUIRE_SPECIAL &&
      !PASSWORD_PATTERNS.SPECIAL.test(password)
    ) {
      throw new WeakPasswordError(
        `Password must contain at least one special character (${PASSWORD_CONSTANTS.SPECIAL_CHARS})`
      );
    }

    // Check for consecutive same characters
    if (this.hasConsecutiveSameChars(password)) {
      throw new WeakPasswordError(
        `Password cannot contain more than ${PASSWORD_CONSTANTS.MAX_CONSECUTIVE_SAME} consecutive same characters`
      );
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      throw new WeakPasswordError(
        "Password cannot contain sequential characters (e.g., abc, 123)"
      );
    }
  }

  /**
   * Validate and return boolean (for validators that don't throw)
   */
  static isValid(password: string): boolean {
    try {
      this.validate(password);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation rules for frontend display
   */
  static getRules(): Array<{ rule: string; isMet: boolean }> {
    return [
      {
        rule: `At least ${PASSWORD_CONSTANTS.MIN_LENGTH} characters`,
        isMet: false, // Determined by caller
      },
      {
        rule: "At least one uppercase letter (A-Z)",
        isMet: PASSWORD_CONSTANTS.REQUIRE_UPPERCASE,
      },
      {
        rule: "At least one lowercase letter (a-z)",
        isMet: PASSWORD_CONSTANTS.REQUIRE_LOWERCASE,
      },
      {
        rule: "At least one number (0-9)",
        isMet: PASSWORD_CONSTANTS.REQUIRE_NUMBERS,
      },
      {
        rule: `At least one special character (${PASSWORD_CONSTANTS.SPECIAL_CHARS})`,
        isMet: PASSWORD_CONSTANTS.REQUIRE_SPECIAL,
      },
    ];
  }

  /**
   * Check for consecutive same characters
   * e.g., "aaa" or "111"
   */
  private static hasConsecutiveSameChars(password: string): boolean {
    const limit = PASSWORD_CONSTANTS.MAX_CONSECUTIVE_SAME;
    for (let i = 0; i < password.length - limit + 1; i++) {
      const slice = password.substring(i, i + limit);
      if (slice === slice[0].repeat(limit)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for sequential characters
   * e.g., "abc", "xyz", "123", "789"
   */
  private static hasSequentialChars(password: string): boolean {
    const limit = PASSWORD_CONSTANTS.MAX_SEQUENTIAL;
    for (let i = 0; i < password.length - limit + 1; i++) {
      const slice = password.substring(i, i + limit).toLowerCase();
      
      // Check if characters are sequential in ASCII
      let isSequential = true;
      for (let j = 1; j < slice.length; j++) {
        const diff = slice.charCodeAt(j) - slice.charCodeAt(j - 1);
        if (diff !== 1) {
          isSequential = false;
          break;
        }
      }
      
      if (isSequential) {
        return true;
      }
    }
    return false;
  }

  /**
   * Estimate password strength (0-100)
   */
  static getStrength(password: string): number {
    let strength = 0;

    // Length (max 30 points)
    if (password.length >= PASSWORD_CONSTANTS.MIN_LENGTH) strength += 10;
    if (password.length >= 10) strength += 10;
    if (password.length >= 15) strength += 10;

    // Character types (max 40 points)
    if (PASSWORD_PATTERNS.UPPERCASE.test(password)) strength += 10;
    if (PASSWORD_PATTERNS.LOWERCASE.test(password)) strength += 10;
    if (PASSWORD_PATTERNS.NUMBERS.test(password)) strength += 10;
    if (PASSWORD_PATTERNS.SPECIAL.test(password)) strength += 10;

    // Uniqueness (max 30 points)
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.5) strength += 10;
    if (uniqueChars >= password.length * 0.7) strength += 10;
    if (uniqueChars >= password.length * 0.9) strength += 10;

    return Math.min(100, strength);
  }
}
