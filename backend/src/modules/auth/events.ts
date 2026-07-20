/**
 * Auth Module - Event Definitions & Publishers
 * Published to global EventBus
 * 
 * Services call these functions instead of EventBus.publish() directly
 * Decouples from EventBus implementation - can swap later without touching services
 */

import { EventBus } from "@/services/eventBus";

export const AuthEvents = {
  USER_REGISTERED: "auth.user.registered",
  EMAIL_VERIFICATION_REQUESTED: "auth.email.verification_requested",
  EMAIL_VERIFIED: "auth.email.verified",
  LOGIN_SUCCESS: "auth.login.success",
  LOGIN_FAILED: "auth.login.failed",
  LOGOUT: "auth.logout",
  PASSWORD_RESET_REQUESTED: "auth.password.reset_requested",
  PASSWORD_RESET_COMPLETED: "auth.password.reset_completed",
  ACCOUNT_SUSPENDED: "auth.account.suspended",
  ACCOUNT_ACTIVATED: "auth.account.activated",
} as const;

/**
 * Event payloads
 */
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string;
  timestamp: Date;
}

export interface EmailVerificationRequestedPayload {
  userId: string;
  email: string;
  fullName: string;
  verificationToken: string; // Raw token (caller must send to user)
  verificationLink: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface EmailVerifiedPayload {
  userId: string;
  email: string;
  timestamp: Date;
}

export interface LoginSuccessPayload {
  userId: string;
  email: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface LoginFailedPayload {
  email: string;
  reason: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface LogoutPayload {
  userId: string;
  email: string;
  timestamp: Date;
}

export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  resetLink: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface PasswordResetCompletedPayload {
  userId: string;
  email: string;
  timestamp: Date;
}

export interface AccountSuspendedPayload {
  userId: string;
  email: string;
  reason: string;
  timestamp: Date;
}

export interface AccountActivatedPayload {
  userId: string;
  email: string;
  timestamp: Date;
}

/**
 * Event Publishers
 * Services call these instead of EventBus.publish()
 * Abstraction allows swapping EventBus without changing services
 */

export async function publishUserRegistered(payload: UserRegisteredPayload) {
  await EventBus.publish(AuthEvents.USER_REGISTERED, payload);
}

export async function publishEmailVerificationRequested(payload: EmailVerificationRequestedPayload) {
  await EventBus.publish(AuthEvents.EMAIL_VERIFICATION_REQUESTED, payload);
}

export async function publishEmailVerified(payload: EmailVerifiedPayload) {
  await EventBus.publish(AuthEvents.EMAIL_VERIFIED, payload);
}

export async function publishLoginSuccess(payload: LoginSuccessPayload) {
  await EventBus.publish(AuthEvents.LOGIN_SUCCESS, payload);
}

export async function publishLoginFailed(payload: LoginFailedPayload) {
  await EventBus.publish(AuthEvents.LOGIN_FAILED, payload);
}

export async function publishLogout(payload: LogoutPayload) {
  await EventBus.publish(AuthEvents.LOGOUT, payload);
}

export async function publishPasswordResetRequested(payload: PasswordResetRequestedPayload) {
  await EventBus.publish(AuthEvents.PASSWORD_RESET_REQUESTED, payload);
}

export async function publishPasswordResetCompleted(payload: PasswordResetCompletedPayload) {
  await EventBus.publish(AuthEvents.PASSWORD_RESET_COMPLETED, payload);
}

export async function publishAccountSuspended(payload: AccountSuspendedPayload) {
  await EventBus.publish(AuthEvents.ACCOUNT_SUSPENDED, payload);
}

export async function publishAccountActivated(payload: AccountActivatedPayload) {
  await EventBus.publish(AuthEvents.ACCOUNT_ACTIVATED, payload);
}
