/**
 * Password Policy Constants
 */

export const PASSWORD_CONSTANTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: "@$!%*?&",
  MAX_CONSECUTIVE_SAME: 3, // e.g., "aaa" not allowed
  MAX_SEQUENTIAL: 3, // e.g., "abc" or "123" not allowed
} as const;

// Regex patterns for validation
export const PASSWORD_PATTERNS = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBERS: /\d/,
  SPECIAL: /[@$!%*?&]/,
  // Full password validation
  FULL: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;
