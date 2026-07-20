/**
 * Register Service
 * Handles user registration flow (Unit 3)
 * 
 * Registration Flow:
 * 1. Validate input (Zod schema)
 * 2. Check if email exists
 * 3. Validate password policy
 * 4. Hash password
 * 5. Determine initial account status
 * 6. [TRANSACTION START]
 *    - Create User
 *    - Create Verification Token
 * 7. [TRANSACTION END]
 * 8. Publish events
 * 9. Return success response
 * 
 * Transaction prevents orphan users if token creation fails.
 * Note: No JWT returned. User must verify email and login separately.
 */

import bcrypt from "bcryptjs";
import { TokenPurpose, PrismaClient } from "@prisma/client";
import type { RegisterInput } from "@/shared/auth";
import { userRepository } from "../repository";
import { PasswordPolicy } from "../policies/password.policy";
import { publishUserRegistered, publishEmailVerificationRequested } from "../events";
import { AUTH_CONSTANTS } from "../constants";

const prisma = new PrismaClient();

export class RegisterService {
  /**
   * Register new user
   * 
   * Returns: { message: "Registration successful. Please verify your email." }
   * Side effects: Creates User + VerificationToken (transactional), publishes EmailVerificationRequested event
   * 
   * Throws:
   * - "Email already registered" (409)
   * - "Password policy violation" (422)
   * - "Validation error" (400)
   */
  async register(input: RegisterInput) {
    // Step 1: Validate input (already done by Zod in route middleware)
    
    // Step 2: Check if email already exists
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Step 3: Validate password policy
    PasswordPolicy.validate(input.password);

    // Step 4: Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Step 5: Determine initial account status
    // ADMIN, RECRUITER, PLACEMENT_OFFICER: ACTIVE (no email verification needed)
    // STUDENT: EMAIL_PENDING (requires email verification)
    const accountStatus = input.role === "STUDENT" ? "EMAIL_PENDING" : "ACTIVE";

    // Step 6-7: TRANSACTION - Atomic user + token creation
    const tokenExpiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.EMAIL_VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000
    );

    let user;
    let verificationToken;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create user (using transaction client)
        const newUser = await tx.user.create({
          data: {
            email: input.email,
            fullName: input.fullName,
            password: passwordHash,
            userRole: input.role as "STUDENT" | "RECRUITER" | "PLACEMENT_OFFICER",
            role: this.mapUserRoleToLegacy(input.role as "STUDENT" | "RECRUITER" | "PLACEMENT_OFFICER"),
            accountStatus,
          },
        });

        // Create verification token only for non-ADMIN users
        let rawToken: string | undefined;
        if (accountStatus !== "ACTIVE") {
          rawToken = this.generateVerificationToken();
          const tokenHash = this.hashToken(rawToken);

          await tx.verificationToken.create({
            data: {
              userId: newUser.id,
              tokenHash,
              purpose: TokenPurpose.EMAIL_VERIFY,
              expiresAt: tokenExpiresAt,
            },
          });
        }

        return { newUser, rawToken };
      });

      user = result.newUser;
      verificationToken = result.rawToken;
    } catch (error) {
      throw new Error("Registration failed: Could not create user or token");
    }

    // Step 8: Publish events (after transaction commits)
    publishUserRegistered({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: input.role,
      organizationId: "", // Empty until org assignment
      timestamp: new Date(),
    });

    // Only publish email verification event for non-ADMIN users
    if (accountStatus !== "ACTIVE") {
      publishEmailVerificationRequested({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        verificationToken: verificationToken!,
        verificationLink: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify?token=${verificationToken}`,
        expiresAt: tokenExpiresAt,
        timestamp: new Date(),
      });
    }

    // Step 9: Return response (no JWT)
    if (accountStatus === "ACTIVE") {
      return {
        message: "Registration successful. Your account is active.",
        email: user.email,
      };
    }
    return {
      message: "Registration successful. Please verify your email.",
      email: user.email,
    };
  }

  /**
   * Temporary: Map UserRole enum to legacy role string
   * Delete in v0.2.0
   */
  private mapUserRoleToLegacy(userRole: string): string {
    const map: Record<string, string> = {
      ADMIN: "admin",
      PLACEMENT_OFFICER: "placement_officer",
      RECRUITER: "recruiter",
      STUDENT: "student",
    };
    return map[userRole] || "student";
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateVerificationToken(): string {
    return require("crypto").randomBytes(32).toString("hex");
  }

  /**
   * Hash token for storage (one-way)
   */
  private hashToken(token: string): string {
    return require("crypto").createHash("sha256").update(token).digest("hex");
  }
}

export const registerService = new RegisterService();
