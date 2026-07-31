/**
 * Auth Module - Routes
 */

import { Router } from "express";
import passport from "passport";
import { AuthController } from "./controller";
import { requireAuth } from "./middleware";
import { validateInput } from "./validators";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./validators";
import { profileUpdateSchema } from "@/validators/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const router = Router();

/**
 * Development-only endpoint to get verification token (for testing)
 * GET /api/auth/dev/verification-token?email=user@test.com
 */
if (process.env.NODE_ENV !== 'production') {
  router.get("/dev/verification-token", async (req, res): Promise<void> => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, message: "Email required" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const token = await prisma.verificationToken.findFirst({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });

      if (!token) {
        res.status(404).json({ success: false, message: "No unused verification token" });
        return;
      }

      // Return the token ID (this is a test endpoint - in production we'd never do this)
      // For actual verification, we need the raw token which was sent via email
      // As a workaround for testing, we'll regenerate it
      
      // Delete the old token
      await prisma.verificationToken.delete({ where: { id: token.id } });
      
      // Create a new one with a known token for testing
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      res.status(200).json({
        success: true,
        message: "Verification token",
        data: {
          email,
          token: rawToken,
          verifyLink: `/api/auth/verify-email?token=${rawToken}`,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}

/**
 * Public routes
 */
router.get(
  "/config",
  AuthController.getConfig
);

router.post(
  "/register",
  (req, _res, next) => {
    req.body = validateInput(registerSchema, req.body);
    next();
  },
  AuthController.register
);

router.get(
  "/verify-email",
  (req, _res, next) => {
    req.body = validateInput(verifyEmailSchema, req.query);
    next();
  },
  AuthController.verifyEmail
);

router.post(
  "/login",
  (req, _res, next) => {
    req.body = validateInput(loginSchema, req.body);
    next();
  },
  AuthController.login
);

router.post(
  "/refresh",
  (req, _res, next) => {
    req.body = validateInput(refreshTokenSchema, req.body);
    next();
  },
  AuthController.refresh
);

router.post(
  "/forgot-password",
  (req, _res, next) => {
    req.body = validateInput(forgotPasswordSchema, req.body);
    next();
  },
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  (req, _res, next) => {
    req.body = validateInput(resetPasswordSchema, req.body);
    next();
  },
  AuthController.resetPassword
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: "http://localhost:5173/auth?error=oauth_failed",
    })(req, res, (err: any) => {
      if (err) {
        console.error("[OAuth:Google:Middleware] Authentication error:", err);
        return res.redirect("http://localhost:5173/auth?error=oauth_failed");
      }
      next();
    });
  },
  AuthController.googleCallback
);

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", {
      session: false,
      failureRedirect: "http://localhost:5173/auth?error=oauth_failed",
    })(req, res, (err: any) => {
      if (err) {
        console.error("[OAuth:GitHub:Middleware] Authentication error:", err);
        return res.redirect("http://localhost:5173/auth?error=oauth_failed");
      }
      next();
    });
  },
  AuthController.githubCallback
);

/**
 * Protected routes (require authentication)
 */
router.use(requireAuth);

router.post(
  "/logout",
  AuthController.logout
);

router.get(
  "/me",
  AuthController.getMe
);

router.patch(
  "/me",
  (req, _res, next) => {
    req.body = validateInput(profileUpdateSchema, req.body);
    next();
  },
  AuthController.updateProfile
);

router.post(
  "/change-password",
  (req, _res, next) => {
    req.body = validateInput(changePasswordSchema, req.body);
    next();
  },
  AuthController.changePassword
);

// ── Account deletion ───────────────────────────────────────────────────────────
router.delete("/account", AuthController.deleteAccount);

// ── 2FA ───────────────────────────────────────────────────────────────────────
router.get("/2fa/status",  AuthController.get2FAStatus);
router.post("/2fa/setup",  AuthController.setup2FA);
router.post("/2fa/enable", AuthController.enable2FA);
router.post("/2fa/disable",AuthController.disable2FA);

export default router;
