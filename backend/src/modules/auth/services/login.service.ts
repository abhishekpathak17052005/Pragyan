/**
 * Login Service
 * Handles user authentication and token generation (Unit 5)
 * 
 * Login Flow:
 * 1. Check throttle (rate limiting)
 * 2. Find user by email
 * 3. Check email verified (emailVerifiedAt is not null)
 * 4. Check account status = ACTIVE
 * 5. Verify password hash
 * 6. Generate JWT access token
 * 7. Generate and store refresh token
 * 8. Audit log
 * 9. Publish LoginSuccess event
 * 10. Return tokens + user info
 * 
 * Note: No auth service should call another auth service directly.
 * Each service has single responsibility: login, register, verify-email, etc.
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { randomUUID } from "crypto";
import type { LoginInput, AuthResponse, AuthUser } from "@/shared/auth";
import { userRepository, auditRepository, refreshTokenRepository } from "../repository";
import { LoginFailureReason } from "../repository/audit.repository";
import { publishLoginSuccess, publishLoginFailed } from "../events";
import { LoginThrottleService } from "./login-throttle.service";
import { generateAccessToken } from "@/utils/jwt";

export class LoginService {
  /**
   * Login user and return tokens
   * 
   * Returns: { accessToken, refreshToken, user }
   * 
   * Throws:
   * - "Account locked due to too many failed attempts" (429)
   * - "Invalid credentials" (401)
   * - "Email not verified" (401)
   * - "Account not active" (403)
   */
  async login(input: LoginInput, ipAddress: string = "", userAgent: string = ""): Promise<AuthResponse> {
    // Step 0: Check throttle (rate limiting)
    const throttle = LoginThrottleService.isLocked(input.email);
    if (throttle.isLocked) {
      const minutesRemaining = Math.ceil(throttle.remainingMs / 60000);
      throw new Error(`Account locked. Try again in ${minutesRemaining} minutes.`);
    }

    // Step 1: Find user by email
    const user = await userRepository.findByEmail(input.email);
    
    if (!user) {
      // Record failed attempt (throttling)
      LoginThrottleService.recordFailedAttempt(input.email);
      
      // Log failed login attempt with structured reason
      // Note: Use a system user ID since we don't have the user
      await auditRepository.log({
        targetUserId: "system",  // Unknown user
        performedByUserId: "system",
        organizationId: "",
        action: "LOGIN",
        status: "FAILURE",
        failureReason: LoginFailureReason.USER_NOT_FOUND,
        ipAddress,
        userAgent,
      });
      
      // Log failed login attempt
      await publishLoginFailed({
        email: input.email,
        reason: "User not found",
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      throw new Error("Invalid credentials");
    }

    // Step 2: Email verification check
    // Only STUDENT users require email verification
    // ADMIN, RECRUITER, PLACEMENT_OFFICER do not need verification
    if (!user.emailVerifiedAt && user.userRole === "STUDENT") {
      // Record failed attempt
      LoginThrottleService.recordFailedAttempt(user.email);
      
      // Log with structured reason
      await auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "LOGIN",
        status: "FAILURE",
        failureReason: LoginFailureReason.EMAIL_NOT_VERIFIED,
        ipAddress,
        userAgent,
      });
      
      await publishLoginFailed({
        email: user.email,
        reason: "Email not verified",
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      throw new Error("Email not verified. Please verify your email first.");
    }

    // Step 3: Check account status
    // Regular users (STUDENT, RECRUITER, PLACEMENT_OFFICER): can login with EMAIL_PENDING status
    // ADMIN users: must be ACTIVE status
    const isRegularUser = user.userRole && ["STUDENT", "RECRUITER", "PLACEMENT_OFFICER"].includes(user.userRole);
    
    console.log("[Login] Account status check:");
    console.log("  userRole:", user.userRole);
    console.log("  isRegularUser:", isRegularUser);
    console.log("  accountStatus:", user.accountStatus);
    
    if (isRegularUser) {
      // Regular users can login with EMAIL_PENDING or ACTIVE status
      if (user.accountStatus !== "ACTIVE" && user.accountStatus !== "EMAIL_PENDING") {
        // Record failed attempt
        LoginThrottleService.recordFailedAttempt(user.email);
        
        const reasonMap: Record<string, LoginFailureReason> = {
          PENDING: LoginFailureReason.ACCOUNT_PENDING,
          REJECTED: LoginFailureReason.ACCOUNT_REJECTED,
          SUSPENDED: LoginFailureReason.ACCOUNT_SUSPENDED,
        };
        const failureReason = reasonMap[user.accountStatus] || "ACCOUNT_NOT_ACTIVE";
        
        await auditRepository.log({
          targetUserId: user.id,
          performedByUserId: user.id,
          organizationId: user.organizationId || "",
          action: "LOGIN",
          status: "FAILURE",
          failureReason,
          ipAddress,
          userAgent,
        });
        
        await publishLoginFailed({
          email: user.email,
          reason: `Account status: ${user.accountStatus}`,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
        
        throw new Error(`Account status is ${user.accountStatus}. Please wait for admin approval.`);
      }
    } else {
      // ADMIN and other users must be ACTIVE
      if (user.accountStatus !== "ACTIVE") {
        // Record failed attempt
        LoginThrottleService.recordFailedAttempt(user.email);
        
        const reasonMap: Record<string, LoginFailureReason> = {
          PENDING: LoginFailureReason.ACCOUNT_PENDING,
          REJECTED: LoginFailureReason.ACCOUNT_REJECTED,
          SUSPENDED: LoginFailureReason.ACCOUNT_SUSPENDED,
        };
        const failureReason = reasonMap[user.accountStatus] || "ACCOUNT_NOT_ACTIVE";
        
        await auditRepository.log({
          targetUserId: user.id,
          performedByUserId: user.id,
          organizationId: user.organizationId || "",
          action: "LOGIN",
          status: "FAILURE",
          failureReason,
          ipAddress,
          userAgent,
        });
        
        await publishLoginFailed({
          email: user.email,
          reason: `Account status: ${user.accountStatus}`,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
        
        throw new Error(`Account status is ${user.accountStatus}. Please wait for admin approval.`);
      }
    }

    // Step 4: Verify password
    const passwordMatch = await bcrypt.compare(
      input.password,
      user.password
    );

    if (!passwordMatch) {
      // existing code...
    }
    // Step 5: Generate access token (JWT)
    // Use native role directly (STUDENT, RECRUITER, PLACEMENT_OFFICER, ADMIN)
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: (user.userRole || "STUDENT") as any,
    });

    // Step 6: Generate and store refresh token
    const familyId = randomUUID();  // New session family
    const refreshTokenValue = crypto.randomBytes(32).toString("hex");
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await refreshTokenRepository.create({
      token: refreshTokenValue,
      familyId,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
      deviceId: this.generateDeviceId(userAgent),  // Fingerprint device
      ipAddress,
      userAgent,
    });

    // Step 7: Audit log
    await auditRepository.log({
      targetUserId: user.id,
      performedByUserId: user.id, // User performing the action
      organizationId: user.organizationId || "",
      action: "LOGIN",
      status: "SUCCESS",
      ipAddress,
      userAgent,
    });

    // Step 7a: Update last login metadata
    await userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      lastLoginUserAgent: userAgent,
    });

    // Step 8: Publish event
    await publishLoginSuccess({
      userId: user.id,
      email: user.email,
      role: user.userRole || "STUDENT",
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Step 8a: Reset throttle on successful login
    LoginThrottleService.recordSuccessfulLogin(user.email);

    // Step 9: Build response
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: (user.userRole || "STUDENT") as any,
      avatar: user.avatar || undefined,
    };

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: authUser,
    };
  }

  /**
   * Generate device fingerprint from user agent
   * Used to identify devices for "logout from device X" feature
   */
  private generateDeviceId(userAgent: string): string {
    return crypto.createHash("sha256").update(userAgent).digest("hex").substring(0, 16);
  }
}

export const loginService = new LoginService();
