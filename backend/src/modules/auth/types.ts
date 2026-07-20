/**
 * Auth Module - Internal Types
 * These are module-specific types used internally
 */

import type { UserRole } from "@/shared/auth";

/**
 * Auth service method signatures
 */
export interface IAuthService {
  register(data: any): Promise<any>;
  verifyEmail(token: string): Promise<any>;
  login(email: string, password: string): Promise<any>;
  refreshToken(token: string): Promise<any>;
  logout(userId: string, refreshToken?: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, otp: string, newPassword: string): Promise<any>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}

/**
 * Repository interfaces
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<any>;
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  updatePassword(id: string, hash: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  create(data: any): Promise<any>;
  findByToken(token: string): Promise<any>;
  revoke(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}

export interface IAuditRepository {
  log(data: any): Promise<void>;
  findByUserId(userId: string): Promise<any[]>;
}

/**
 * Internal service types
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationType: "COLLEGE" | "COMPANY";
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
  otp: string;
  token: string;
  expiresAt: Date;
}

export interface AuditLogPayload {
  userId: string;
  email: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  status: "SUCCESS" | "FAILURE";
  metadata?: Record<string, any>;
}
