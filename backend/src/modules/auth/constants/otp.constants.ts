/**
 * One-Time Password (OTP) Constants
 * Used for email verification and password reset
 */

export const OTP_CONSTANTS = {
  // Email verification OTP
  EMAIL_VERIFICATION: {
    LENGTH: 6,
    EXPIRY_MINUTES: 24 * 60, // 24 hours
    MAX_ATTEMPTS: 5,
    RESEND_LIMIT: 3,
    RESEND_COOLDOWN_SECONDS: 60, // Wait 1 minute before resending
  },
  // Password reset OTP
  PASSWORD_RESET: {
    LENGTH: 6,
    EXPIRY_MINUTES: 15,
    MAX_ATTEMPTS: 5,
  },
  // Numeric-only generation
  ALPHABET: "0123456789",
} as const;
