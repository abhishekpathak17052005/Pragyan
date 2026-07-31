// src/routes/auth.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '@/controllers/auth';
import * as oauthController from '@/controllers/oauth';
import * as twoFactorController from '@/controllers/twoFactor';
import { validate } from '@/middleware/validator';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  profileUpdateSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '@/validators/auth';
import { authenticate } from '@/middleware/auth';

const router = Router();
const isDevelopment = process.env.NODE_ENV !== 'production';
const rateLimitMessage = { success: false, message: 'Too many requests' };

const authAttemptLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: isDevelopment ? 100 : 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: rateLimitMessage,
	handler: (_req, res) => {
		res.status(429).json(rateLimitMessage);
	},
});

const passwordResetLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: isDevelopment ? 30 : 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: rateLimitMessage,
	handler: (_req, res) => {
		res.status(429).json(rateLimitMessage);
	},
});

router.post('/register', authAttemptLimiter, validate(registerSchema), authController.register);
router.post('/login', authAttemptLimiter, validate(loginSchema), authController.login);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', passwordResetLimiter, validate(verifyResetOtpSchema), authController.verifyResetOtp);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/config', authController.getAuthConfig);
router.get('/google', authAttemptLimiter, oauthController.startGoogleAuth);
router.get('/google/callback', authAttemptLimiter, oauthController.handleGoogleCallback);
router.get('/github', authAttemptLimiter, oauthController.startGitHubAuth);
router.get('/github/callback', authAttemptLimiter, oauthController.handleGitHubCallback);
router.post('/link/start', authAttemptLimiter, authenticate, oauthController.startLinkAuth);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(profileUpdateSchema), authController.updateProfile);
router.post('/logout', authAttemptLimiter, validate(refreshTokenSchema), authController.logout);
router.post('/refresh-token', authAttemptLimiter, validate(refreshTokenSchema), authController.refreshToken);

// ── Authenticated account management ──────────────────────────────────────────
router.post('/change-password', authenticate, authController.changePassword);
router.delete('/account',       authenticate, authController.deleteAccount);

// ── 2FA ───────────────────────────────────────────────────────────────────────
router.get('/2fa/status',   authenticate, twoFactorController.getStatus);
router.post('/2fa/setup',   authenticate, twoFactorController.setup);
router.post('/2fa/enable',  authenticate, twoFactorController.enable);
router.post('/2fa/disable', authenticate, twoFactorController.disable);
router.post('/2fa/verify',  authenticate, twoFactorController.verify);

export default router;
