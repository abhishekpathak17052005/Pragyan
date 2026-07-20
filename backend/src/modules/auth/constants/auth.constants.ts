/**
 * General Auth Configuration Constants
 */

export const AUTH_CONSTANTS = {
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW_MINUTES: 15,
  
  // Session management
  MAX_SESSIONS_PER_USER: 5,
  SESSION_TIMEOUT_MINUTES: 60 * 24, // 24 hours
  
  // Account status
  NEW_ACCOUNT_STATUS: "EMAIL_PENDING",
  VERIFIED_ACCOUNT_STATUS: "ACTIVE",
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Email verification
  EMAIL_VERIFICATION_TOKEN_LENGTH: 32,
  EMAIL_VERIFICATION_EXPIRES_HOURS: 24,
  
  // Password reset
  PASSWORD_RESET_TOKEN_LENGTH: 32,
  PASSWORD_RESET_EXPIRES_MINUTES: 30,
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error message keys (for i18n)
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_NOT_VERIFIED: "Please verify your email first",
  ACCOUNT_INACTIVE: "Your account is inactive",
  INVALID_TOKEN: "Invalid or expired token",
  EMAIL_EXISTS: "Email already registered",
  OTP_EXPIRED: "OTP has expired",
  OTP_INVALID: "Invalid OTP",
  ACCOUNT_SUSPENDED: "Your account has been suspended",
  MAX_LOGIN_ATTEMPTS: "Too many login attempts. Try again later.",
  WEAK_PASSWORD: "Password does not meet requirements",
  TOKEN_REQUIRED: "Authorization token required",
  PERMISSION_DENIED: "You do not have permission",
  INVALID_INVITATION: "Invalid or expired invitation",
} as const;
