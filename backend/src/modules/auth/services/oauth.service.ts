/**
 * OAuth Service
 * Handles OAuth login flow (Google, GitHub)
 * ADMIN-ONLY: All OAuth users are created/linked as ADMIN
 * Creates or links accounts by email
 * Generates JWT and refresh tokens
 */

import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/utils/jwt";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { userRepository, refreshTokenRepository } from "../repository";

interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  provider: "google" | "github";
  picture?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    profilePicture?: string;
    emailVerified: boolean;
  };
}

export class OAuthService {
  /**
   * Handle OAuth login
   * - Check if user exists by email
   * - If not, create new user (STUDENT by default)
   * - If exists, preserve existing role
   * - Mark email as verified
   * - Create JWT tokens
   * - Return auth session
   */
  static async handleOAuthLogin(
    profile: OAuthProfile,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResponse> {
    try {
      // Validate email
      if (!profile.email) {
        throw new Error("OAuth provider did not return email");
      }

      // Check if user exists
      let user = await userRepository.findByEmail(profile.email);

      if (!user) {
        // Create new user as STUDENT (default role)
        user = (await prisma.user.create({
          data: {
            email: profile.email,
            fullName: profile.name || profile.email.split("@")[0],
            userRole: "STUDENT",
            password: "",
            avatar: profile.picture || null,
            emailVerifiedAt: new Date(), // Verified via OAuth provider
            accountStatus: "ACTIVE",
          } as any,
        })) as any;

        console.log(`[OAuth] New STUDENT account created via ${profile.provider}: ${profile.email}`);
      } else {
        // Existing user - just verify email if needed, preserve their role
        if (!user.emailVerifiedAt) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerifiedAt: new Date(),
              ...(profile.picture && { avatar: profile.picture }),
            } as any,
          });

          console.log(`[OAuth] Email verified for ${profile.provider} login: ${profile.email}`);
        }
      }

      // Refresh user data from DB
      user = (await userRepository.findByEmail(profile.email)) as any;

      // Create refresh token
      const familyId = randomUUID();
      const refreshTokenValue = crypto.randomBytes(32).toString("hex");
      const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await refreshTokenRepository.create({
        token: refreshTokenValue,
        familyId,
        userId: user!.id,
        expiresAt: refreshTokenExpiresAt,
        deviceId: this.generateDeviceId(userAgent),
        ipAddress,
        userAgent,
      });

      // Create JWT access token with user's actual role
      const userRole = (user!.userRole || "STUDENT") as "ADMIN" | "RECRUITER" | "STUDENT" | "PLACEMENT_OFFICER";
      const accessToken = generateAccessToken({
        id: user!.id,
        email: user!.email,
        role: userRole as any,
      });

      // Prepare auth session
      const authResponse: AuthResponse = {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user!.id,
          email: user!.email,
          fullName: user!.fullName,
          role: userRole,
          profilePicture: user!.avatar || undefined,
          emailVerified: !!user!.emailVerifiedAt,
        },
      };

      // Log the OAuth login
      console.log(`[OAuth] ${profile.provider} ${userRole} login successful for ${user!.email}`);

      return authResponse;
    } catch (error) {
      console.error("[OAuth] Login error:", error);
      throw error;
    }
  }

  /**
   * Generate device fingerprint from user agent
   */
  private static generateDeviceId(userAgent: string): string {
    return crypto.createHash("sha256").update(userAgent).digest("hex").substring(0, 16);
  }
}
