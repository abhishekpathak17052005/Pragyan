/**
 * JWT Configuration Constants
 */

export const JWT_CONSTANTS = {
  SECRET: process.env.JWT_SECRET || "your-secret-key",
  ACCESS_TOKEN_EXPIRY: "24h",
  REFRESH_TOKEN_EXPIRY: "7d",
  ALGORITHM: "HS256",
} as const;

/**
 * Login Security Constants
 */
export const LOGIN_SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5"),
  LOGIN_LOCK_MINUTES: parseInt(process.env.LOGIN_LOCK_MINUTES || "15"),
  MAX_REFRESH_TOKENS_PER_USER: parseInt(process.env.MAX_REFRESH_TOKENS_PER_USER || "10"),
  TOKEN_ROTATION_WINDOW_HOURS: parseInt(process.env.TOKEN_ROTATION_WINDOW_HOURS || "1"),
} as const;

/**
 * Email Verification Constants
 */
export const EMAIL_VERIFICATION_CONSTANTS = {
  TOKEN_EXPIRY_HOURS: parseInt(process.env.EMAIL_TOKEN_EXPIRY_HOURS || "24"),
} as const;
