// src/controllers/auth.ts

import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { authService } from '@/services/auth';
import { sendSuccess, sendError } from '@/utils/response';
import { RegisterInput, LoginInput, ProfileUpdateInput } from '@/validators/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { config } from '@/config/env';
import type { OAuthProfileUser } from '@/config/passport';

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

function buildOAuthSuccessRedirect(accessToken: string, refreshToken: string): string {
  const params = new URLSearchParams({
    accessToken,
    refreshToken,
  });
  return `${config.oauth.frontendSuccessUrl}#${params.toString()}`;
}

export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!config.oauth.googleClientId || !config.oauth.googleClientSecret) {
    res.redirect(buildOAuthErrorRedirect('provider_failure'));
    return;
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: true as unknown as string,
  })(req, res, next);
};

export const githubAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!config.oauth.githubClientId || !config.oauth.githubClientSecret) {
    res.redirect(buildOAuthErrorRedirect('provider_failure'));
    return;
  }

  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
    state: true as unknown as string,
  })(req, res, next);
};

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
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
      return res.redirect(buildOAuthSuccessRedirect(session.accessToken, session.refreshToken));
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
      return res.redirect(buildOAuthSuccessRedirect(session.accessToken, session.refreshToken));
    } catch (callbackError) {
      const message = callbackError instanceof Error ? callbackError.message : '';
      if (message.toLowerCase().includes('email')) {
        return res.redirect(buildOAuthErrorRedirect('missing_email'));
      }
      return res.redirect(buildOAuthErrorRedirect('token_generation_failed'));
    }
  })(req, res, next);
};
