/**
 * Password Service
 * Handles password reset and recovery flows
 */

import type { ForgotPasswordInput, ResetPasswordInput } from "@/shared/auth";

export class PasswordService {
  /**
   * Request password reset (scaffolded, implementation in Unit 8)
   */
  async forgotPassword(_input: ForgotPasswordInput) {
    throw new Error("Not implemented in Unit 1 - see Unit 8");
  }

  /**
   * Reset password with OTP (scaffolded, implementation in Unit 9)
   */
  async resetPassword(_input: ResetPasswordInput) {
    throw new Error("Not implemented in Unit 1 - see Unit 9");
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(_userId: string, _currentPassword: string, _newPassword: string) {
    throw new Error("Not implemented");
  }

  /**
   * Helper: Generate OTP (internal)
   */
  protected generateOTP(): string {
    throw new Error("Not implemented - generate 6-digit OTP");
  }

  /**
   * Helper: Hash password (internal)
   */
  protected async hashPassword(_password: string): Promise<string> {
    throw new Error("Not implemented - use bcryptjs");
  }

  /**
   * Helper: Verify password (internal)
   */
  protected async verifyPassword(_plainPassword: string, _hash: string): Promise<boolean> {
    throw new Error("Not implemented - use bcryptjs");
  }
}

export const passwordService = new PasswordService();
