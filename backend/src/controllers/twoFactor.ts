// src/controllers/twoFactor.ts

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendError } from '@/utils/response';
import { twoFactorService } from '@/services/twoFactor';

/**
 * GET /api/auth/2fa/status
 * Returns whether 2FA is currently enabled for the user.
 */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  const status = await twoFactorService.getStatus(userId);
  return sendSuccess(res, status, 200, '2FA status');
});

/**
 * POST /api/auth/2fa/setup
 * Generates a new TOTP secret and returns QR code.
 * The secret is NOT saved until the user calls /enable with a valid code.
 */
export const setup = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');
  const result = await twoFactorService.generateSecret(userId);
  return sendSuccess(res, result, 200, '2FA setup initiated');
});

/**
 * POST /api/auth/2fa/enable
 * body: { secret: string, token: string }
 * Verifies the code and saves the secret, enabling 2FA.
 */
export const enable = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const { secret, token } = req.body as { secret?: string; token?: string };
  if (!secret || !token) return sendError(res, 400, 'secret and token are required');

  await twoFactorService.enable(userId, secret, token);
  return sendSuccess(res, { enabled: true }, 200, '2FA enabled successfully');
});

/**
 * POST /api/auth/2fa/disable
 * body: { token: string }
 * Disables 2FA after verifying a valid TOTP code.
 */
export const disable = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const { token } = req.body as { token?: string };
  if (!token) return sendError(res, 400, 'token is required');

  await twoFactorService.disable(userId, token);
  return sendSuccess(res, { enabled: false }, 200, '2FA disabled successfully');
});

/**
 * POST /api/auth/2fa/verify
 * body: { token: string }
 * Standalone code verification (for login step-up or testing).
 */
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, 'Unauthorized');

  const { token } = req.body as { token?: string };
  if (!token) return sendError(res, 400, 'token is required');

  const valid = await twoFactorService.validateLogin(userId, token);
  if (!valid) return sendError(res, 400, 'Invalid or expired verification code');
  return sendSuccess(res, { verified: true }, 200, 'Code verified');
});
