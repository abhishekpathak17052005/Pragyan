// src/routes/auth.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '@/controllers/auth';
import { validate } from '@/middleware/validator';
import { registerSchema, loginSchema, refreshTokenSchema, profileUpdateSchema } from '@/validators/auth';
import { authenticate } from '@/middleware/auth';

const router = Router();

const authAttemptLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/register', authAttemptLimiter, validate(registerSchema), authController.register);
router.post('/login', authAttemptLimiter, validate(loginSchema), authController.login);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(profileUpdateSchema), authController.updateProfile);
router.post('/logout', authAttemptLimiter, validate(refreshTokenSchema), authController.logout);
router.post('/refresh-token', authAttemptLimiter, validate(refreshTokenSchema), authController.refreshToken);

export default router;
