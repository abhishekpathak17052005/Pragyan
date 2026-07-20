/**
 * Auth Module Types (Prisma-independent)
 * These types are NOT imported from @prisma/client
 * This ensures if Prisma changes, only repository.ts is affected
 */

export type UserRole = "ADMIN" | "PLACEMENT_OFFICER" | "RECRUITER" | "STUDENT";

export type AccountStatus =
  | "EMAIL_PENDING"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

export type OrganizationType = "COLLEGE" | "COMPANY";

export type AuditAction =
  | "USER_CREATED"
  | "USER_REGISTERED"
  | "EMAIL_VERIFIED"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_ACTIVATED";

export type NotificationType =
  | "EMAIL_VERIFICATION"
  | "PASSWORD_RESET"
  | "LOGIN_ALERT"
  | "ACCOUNT_STATUS_CHANGE";

export type NotificationChannel = "EMAIL" | "IN_APP" | "SMS";

/**
 * User-related types
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  collegeCode?: string; // For students
  companyInviteToken?: string; // For recruiters
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  otp: string;
  newPassword: string;
}

export interface LogoutInput {
  refreshToken: string;
}

/**
 * Internal types (not exposed to frontend)
 */
export interface CreateUserData {
  email: string;
  fullName: string;
  passwordHash: string;
  userRole: UserRole;
  accountStatus: AccountStatus;
  organizationId: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;  // STUDENT | RECRUITER | PLACEMENT_OFFICER | ADMIN
  organizationId: string;
  ver?: number;  // JWT version for forward compatibility
}

export interface RefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt?: Date;
}
