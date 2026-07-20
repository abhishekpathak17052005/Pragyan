/**
 * Auth Module - Controller
 * HTTP request handlers (scaffolded, implementation in Units 3-9)
 */

import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { meService, registerService, verifyEmailService, loginService } from "./services";
import { OAuthService } from "./services/oauth.service";
import { config } from "@/config/env";

export class AuthController {
  /**
   * GET /api/auth/config
   * Get authentication configuration (OAuth providers)
   */
  static getConfig = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      return res.status(200).json({
        success: true,
        data: {
          googleEnabled: Boolean(config.oauth.googleClientId),
          githubEnabled: Boolean(config.oauth.githubClientId),
          googleLoginUrl: config.oauth.googleClientId ? `${config.apiBaseUrl}/api/auth/google` : null,
          githubLoginUrl: config.oauth.githubClientId ? `${config.apiBaseUrl}/api/auth/github` : null,
        },
      });
    }
  );

  /**
   * POST /api/auth/register
   * Unit 3 implementation
   * 
   * Input: { email, password, confirmPassword, fullName, role, collegeCode?, companyInviteToken? }
   * Returns: 201 Created with { message, email }
   * On error: 400/409 with error details
   */
  static register = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const input = req.body;
      
      const result = await registerService.register(input);
      
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
        },
      });
    }
  );

  /**
   * GET /api/auth/verify-email?token=xxx
   * Unit 4 implementation
   * 
   * Input: token via query param
   * Returns: 200 { message, accountStatus }
   * On error: 400 with "Invalid verification link" (generic, no leaks)
   */
  static verifyEmail = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { token } = req.query;
      
      const result = await verifyEmailService.verify({ token: token as string });
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          accountStatus: result.accountStatus,
        },
      });
    }
  );

  /**
   * POST /api/auth/login
   * Unit 5 implementation
   * 
   * Input: { email, password }
   * Returns: 200 { accessToken, refreshToken, user }
   * On error: 401/403 with error message
   */
  static login = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const input = req.body;
      console.log("===== LOGIN REQUEST =====");
      console.log("Full request body:", JSON.stringify(req.body, null, 2));
      console.log("========================");
      
      const ipAddress = req.ip || "";
      const userAgent = req.get("user-agent") || "";
      
      const result = await loginService.login(input, ipAddress, userAgent);
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    }
  );

  /**
   * POST /api/auth/refresh
   * Unit 6 implementation
   */
  static refresh = asyncHandler(
    async (_req: Request, _res: Response, _next: NextFunction) => {
      throw new Error("Not implemented in Unit 1 - see Unit 6");
    }
  );

  /**
   * POST /api/auth/logout
   * Unit 7 implementation
   */
  static logout = asyncHandler(
    async (_req: Request, _res: Response, _next: NextFunction) => {
      throw new Error("Not implemented in Unit 1 - see Unit 7");
    }
  );

  /**
   * POST /api/auth/forgot-password
   * Unit 8 implementation
   */
  static forgotPassword = asyncHandler(
    async (_req: Request, _res: Response, _next: NextFunction) => {
      throw new Error("Not implemented in Unit 1 - see Unit 8");
    }
  );

  /**
   * POST /api/auth/reset-password
   * Unit 9 implementation
   */
  static resetPassword = asyncHandler(
    async (_req: Request, _res: Response, _next: NextFunction) => {
      throw new Error("Not implemented in Unit 1 - see Unit 9");
    }
  );

  /**
   * GET /api/auth/me (requires auth)
   * Get current user profile with all details
   */
  static getMe = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const me = await meService.getMe(req.authUser.userId);
      return res.status(200).json({
        success: true,
        data: me,
        message: "Profile retrieved successfully",
      });
    }
  );

  /**
   * POST /api/auth/change-password (requires auth)
   * Change password for authenticated user
   */
  static changePassword = asyncHandler(
    async (_req: Request, _res: Response, _next: NextFunction) => {
      throw new Error("Not implemented");
    }
  );

  /**
   * GET /api/auth/google/callback
   * OAuth Google callback handler
   */
  static googleCallback = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        console.log("[OAuth:Google:Callback] Starting Google OAuth callback");
        
        if (!req.user) {
          console.error("[OAuth:Google:Callback] No user in request - Passport authentication failed");
          return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
        }

        console.log("[OAuth:Google:Callback] Passport user object:", JSON.stringify(req.user, null, 2));

        const passportUser = req.user as any;
        const ipAddress = req.ip || "";
        const userAgent = req.get("user-agent") || "";

        // Map Passport Google profile to our OAuthProfile interface
        const googleProfile = {
          id: passportUser.providerId || passportUser.id || "",
          email: passportUser.email || "",
          name: passportUser.fullName || passportUser.displayName || "",
          provider: "google" as const,
          picture: passportUser.avatar || passportUser.photo || null,
        };

        console.log("[OAuth:Google:Callback] Mapped profile:", googleProfile);

        const authSession = await OAuthService.handleOAuthLogin(
          googleProfile,
          ipAddress,
          userAgent
        );

        // Redirect to frontend with token
        const frontendUrl = config.frontendUrl || "http://localhost:5173";
        const callbackUrl = `${frontendUrl}/auth/callback?token=${authSession.accessToken}&refresh=${authSession.refreshToken}`;

        console.log("[OAuth:Google:Callback] Redirecting to:", callbackUrl);

        return res.redirect(callbackUrl);
      } catch (error) {
        console.error("[OAuth:Google:Callback] Error:", error);
        return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
      }
    }
  );

  /**
   * GET /api/auth/github/callback
   * OAuth GitHub callback handler
   */
  static githubCallback = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        console.log("[OAuth:GitHub:Callback] Starting GitHub OAuth callback");
        
        if (!req.user) {
          console.error("[OAuth:GitHub:Callback] No user in request - Passport authentication failed");
          return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
        }

        console.log("[OAuth:GitHub:Callback] Passport user object:", JSON.stringify(req.user, null, 2));

        const passportUser = req.user as any;
        const ipAddress = req.ip || "";
        const userAgent = req.get("user-agent") || "";

        // Map Passport GitHub profile to our OAuthProfile interface
        const githubProfile = {
          id: passportUser.providerId || passportUser.id || "",
          email: passportUser.email || passportUser.emails?.[0]?.value || "",
          name: passportUser.fullName || passportUser.displayName || passportUser.username || "",
          provider: "github" as const,
          picture: passportUser.avatar || passportUser.photos?.[0]?.value || passportUser.avatar_url || null,
        };

        console.log("[OAuth:GitHub:Callback] Mapped profile:", githubProfile);

        const authSession = await OAuthService.handleOAuthLogin(
          githubProfile,
          ipAddress,
          userAgent
        );

        // Redirect to frontend with token
        const frontendUrl = config.frontendUrl || "http://localhost:5173";
        const callbackUrl = `${frontendUrl}/auth/callback?token=${authSession.accessToken}&refresh=${authSession.refreshToken}`;

        console.log("[OAuth:GitHub:Callback] Redirecting to:", callbackUrl);

        return res.redirect(callbackUrl);
      } catch (error) {
        console.error("[OAuth:GitHub:Callback] Error:", error);
        return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
      }
    }
  );
}

