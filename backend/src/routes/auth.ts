// src/routes/auth.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import * as authController from '@/controllers/auth';
import { validate } from '@/middleware/validator';
import { registerSchema, loginSchema, refreshTokenSchema, profileUpdateSchema } from '@/validators/auth';
import { authenticate } from '@/middleware/auth';
import { config } from '@/config/env';

const router = Router();

const authAttemptLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
});

const oauthSessionMiddleware = session({
  secret: config.oauth.sessionSecret,
  name: 'pragyan_oauth_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  },
});

router.post('/register', authAttemptLimiter, validate(registerSchema), authController.register);
router.post('/login', authAttemptLimiter, validate(loginSchema), authController.login);
router.get('/google', oauthSessionMiddleware, passport.initialize(), authController.googleAuth);
router.get('/google/callback', oauthSessionMiddleware, passport.initialize(), authController.googleCallback);
router.get('/github', oauthSessionMiddleware, passport.initialize(), authController.githubAuth);
router.get('/github/callback', oauthSessionMiddleware, passport.initialize(), authController.githubCallback);
router.get('/oauth/session', authAttemptLimiter, authController.oauthSession);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate(profileUpdateSchema), authController.updateProfile);
router.post('/logout', authAttemptLimiter, validate(refreshTokenSchema), authController.logout);
router.post('/refresh-token', authAttemptLimiter, validate(refreshTokenSchema), authController.refreshToken);

export default router;
