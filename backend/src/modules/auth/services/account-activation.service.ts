/**
 * Account Activation Service
 * Handles role-based account activation logic (Unit 4)
 * 
 * Activation Rules:
 * - STUDENT → ACTIVE (immediate activation)
 * - RECRUITER → PENDING (requires admin approval)
 * - PLACEMENT_OFFICER → PENDING (requires admin approval)
 */

import { UserRole, AccountStatus } from "@prisma/client";
import { userRepository } from "../repository";
import { publishEmailVerified } from "../events";

export class AccountActivationService {
  /**
   * Activate account after email verification
   * 
   * Flow:
   * 1. Determine new status based on role
   * 2. Update user account status
   * 3. Publish EmailVerified event
   * 
   * Returns: User object with new status
   */
  async activateAccount(userId: string): Promise<{ id: string; userRole: UserRole; accountStatus: AccountStatus }> {
    // Fetch user to get role
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Determine new status based on role
    let newStatus: AccountStatus;

    switch (user.userRole) {
      case "STUDENT":
        // Students are auto-approved after email verification
        newStatus = "ACTIVE";
        break;

      case "RECRUITER":
      case "PLACEMENT_OFFICER":
        // Recruiters and placement officers require admin approval
        newStatus = "PENDING";
        break;

      case "ADMIN":
        // Admins are auto-approved (no email verification needed)
        newStatus = "ACTIVE";
        break;

      default:
        throw new Error("Invalid role for registration");
    }

    // Update user status
    const updatedUser = await userRepository.update(userId, {
      accountStatus: newStatus,
      emailVerifiedAt: new Date(),
    });

    // Publish event for audit logging and notifications
    publishEmailVerified({
      userId: updatedUser.id,
      email: updatedUser.email,
      timestamp: new Date(),
    });

    return {
      id: updatedUser.id,
      userRole: updatedUser.userRole!,
      accountStatus: updatedUser.accountStatus as AccountStatus,
    };
  }
}

export const accountActivationService = new AccountActivationService();
