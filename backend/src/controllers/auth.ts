// src/controllers/auth.ts

import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import { authService } from '@/services/auth';
import { sendSuccess, sendError } from '@/utils/response';
import { RegisterInput, LoginInput, ProfileUpdateInput } from '@/validators/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { config } from '@/config/env';
import type { OAuthProfileUser } from '@/config/passport';

type OAuthLoginSession = Awaited<ReturnType<typeof authService.oauthLogin>>;

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input: RegisterInput = req.body;
  const result = await authService.register(input);

  return sendSuccess(res, result, 201, 'User registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input: LoginInput = req.body;
  const result = await authService.login(input);

  return sendSuccess(res, result, 200, 'Login successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const authenticatedUser = req.user as { id?: string } | undefined;
  if (!authenticatedUser?.id) {
    return sendError(res, 401, 'Unauthorized');
  }

  const user = await authService.getUserById(authenticatedUser.id);
  return sendSuccess(res, user, 200, 'User fetched successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const authenticatedUser = req.user as { id?: string } | undefined;
  if (!authenticatedUser?.id) {
    return sendError(res, 401, 'Unauthorized');
  }

  const input: ProfileUpdateInput = req.body;
  const user = await authService.updateUserProfile(authenticatedUser.id, input);

  return sendSuccess(res, user, 200, 'Profile updated successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token is required');
  }

  await authService.logout(refreshToken);
  return sendSuccess(res, {}, 200, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return sendError(res, 400, 'Refresh token is required');
  }

  const result = await authService.refreshAccessToken(token);
  return sendSuccess(res, result, 200, 'Access token refreshed');
});

function buildOAuthErrorRedirect(errorCode: string): string {
  const params = new URLSearchParams({ error: errorCode });
  return `${config.oauth.frontendFailureUrl}?${params.toString()}`;
}

const pendingOAuthSessions = new Map<string, { session: OAuthLoginSession; expiresAt: number }>();
const OAUTH_SESSION_TTL_MS = 60_000;

function buildOAuthSuccessRedirect(oauthToken: string): string {
  const params = new URLSearchParams({
    oauthToken,
  });
  return `${config.oauth.frontendSuccessUrl}?${params.toString()}`;
}

function storePendingOAuthSession(session: OAuthLoginSession): string {
  const now = Date.now();
  for (const [token, pending] of pendingOAuthSessions.entries()) {
    if (pending.expiresAt <= now) {
      pendingOAuthSessions.delete(token);
    }
  }

  const oauthToken = crypto.randomBytes(24).toString('hex');
  pendingOAuthSessions.set(oauthToken, {
    session,
    expiresAt: now + OAUTH_SESSION_TTL_MS,
  });

  return oauthToken;
}

export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!config.oauth.googleClientId || !config.oauth.googleClientSecret) {
    res.redirect(buildOAuthErrorRedirect('provider_failure'));
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
};

export const githubAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!config.oauth.githubClientId || !config.oauth.githubClientSecret) {
    res.redirect(buildOAuthErrorRedirect('provider_failure'));
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;

  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
    state,
  })(req, res, next);
};

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.oauthState || req.query.state !== req.session.oauthState) {
    return res.redirect(buildOAuthErrorRedirect('invalid_callback'));
  }
  delete req.session.oauthState;

  passport.authenticate('google', { session: false }, async (error: Error | null, user: OAuthProfileUser | false) => {
    if (error) {
      const providerMessage = error.message.toLowerCase();
      if (providerMessage.includes('state') || providerMessage.includes('callback')) {
        return res.redirect(buildOAuthErrorRedirect('invalid_callback'));
      }
      return res.redirect(buildOAuthErrorRedirect('provider_failure'));
    }

    if (!user) {
      return res.redirect(buildOAuthErrorRedirect('oauth_cancelled'));
    }

    try {
      const session = await authService.oauthLogin(user);
      const oauthToken = storePendingOAuthSession(session);
      return res.redirect(buildOAuthSuccessRedirect(oauthToken));
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : '';
      if (message.toLowerCase().includes('email')) {
        return res.redirect(buildOAuthErrorRedirect('missing_email'));
      }
      return res.redirect(buildOAuthErrorRedirect('token_generation_failed'));
    }
  })(req, res, next);
};

export const githubCallback = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.oauthState || req.query.state !== req.session.oauthState) {
    return res.redirect(buildOAuthErrorRedirect('invalid_callback'));
  }
  delete req.session.oauthState;

  passport.authenticate('github', { session: false }, async (error: Error | null, user: OAuthProfileUser | false) => {
    if (error) {
      const providerMessage = error.message.toLowerCase();
      if (providerMessage.includes('state') || providerMessage.includes('callback')) {
        return res.redirect(buildOAuthErrorRedirect('invalid_callback'));
      }
      return res.redirect(buildOAuthErrorRedirect('provider_failure'));
    }

    if (!user) {
      return res.redirect(buildOAuthErrorRedirect('oauth_cancelled'));
    }

    try {
      const session = await authService.oauthLogin(user);
      const oauthToken = storePendingOAuthSession(session);
      return res.redirect(buildOAuthSuccessRedirect(oauthToken));
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : '';
      if (message.toLowerCase().includes('email')) {
        return res.redirect(buildOAuthErrorRedirect('missing_email'));
      }
      return res.redirect(buildOAuthErrorRedirect('token_generation_failed'));
    }
  })(req, res, next);
};

export const oauthSession = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null;

  if (!token) {
    return sendError(res, 400, 'OAuth session token is required');
  }

  const pending = pendingOAuthSessions.get(token);
  if (!pending || pending.expiresAt <= Date.now()) {
    pendingOAuthSessions.delete(token);
    return sendError(res, 401, 'OAuth session token is invalid or expired');
  }

  pendingOAuthSessions.delete(token);
  return sendSuccess(res, pending.session, 200, 'OAuth session ready');
});
