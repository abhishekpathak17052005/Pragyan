import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { config } from '@/config/env';
import { integrationProviders, integrationService, type IntegrationProvider } from './integration.service';

type IntegrationSession = {
  integrationStates?: Record<string, { state: string; userId: string }>;
  save: (callback: (error?: unknown) => void) => void;
};

function providerFromRequest(req: Request): IntegrationProvider | null {
  const provider = String(req.params.provider || '');
  return integrationProviders.includes(provider as IntegrationProvider) ? provider as IntegrationProvider : null;
}

function saveSession(req: Request) {
  return new Promise<void>((resolve, reject) => {
    (req.session as unknown as IntegrationSession).save((error) => error ? reject(error) : resolve());
  });
}

function redirectToSettings(res: Response, params: Record<string, string>) {
  const url = new URL('/settings', config.frontendUrl);
  url.searchParams.set('tab', 'account');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return res.redirect(url.toString());
}

export const connect = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const provider = providerFromRequest(req);
  if (!provider) return sendError(res, 400, 'Unsupported integration provider');
  const state = randomBytes(24).toString('hex');
  const session = req.session as unknown as IntegrationSession;
  session.integrationStates = { ...(session.integrationStates || {}), [provider]: { state, userId: req.user.id } };
  await saveSession(req);
  return sendSuccess(res, { authorizationUrl: integrationService.createAuthorizationUrl(provider, state) }, 200, 'Integration authorization started');
});

export const callback = asyncHandler(async (req: Request, res: Response) => {
  const provider = providerFromRequest(req);
  if (!provider) return redirectToSettings(res, { integration: 'error', message: 'Unsupported integration provider' });
  const providerError = typeof req.query.error === 'string' ? req.query.error : '';
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const session = req.session as unknown as IntegrationSession;
  const intent = session.integrationStates?.[provider];
  delete session.integrationStates?.[provider];
  await saveSession(req);

  if (providerError || !code) return redirectToSettings(res, { integration: 'error', provider, message: providerError === 'access_denied' ? 'Authorization was cancelled.' : 'Provider did not return an authorization code.' });
  if (!intent || intent.state !== state) return redirectToSettings(res, { integration: 'error', provider, message: 'Unable to verify the authorization request.' });

  try {
    await integrationService.completeOAuth(provider, intent.userId, code);
    return redirectToSettings(res, { integration: 'connected', provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect the integration.';
    return redirectToSettings(res, { integration: 'error', provider, message });
  }
});

export const status = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  return sendSuccess(res, await integrationService.getStatuses(req.user.id), 200, 'Integration statuses fetched');
});

export const sync = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const provider = providerFromRequest(req);
  if (!provider) return sendError(res, 400, 'Unsupported integration provider');
  return sendSuccess(res, await integrationService.sync(provider, req.user.id), 200, 'Integration synchronized');
});

export const disconnect = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Authentication required');
  const provider = providerFromRequest(req);
  if (!provider) return sendError(res, 400, 'Unsupported integration provider');
  return sendSuccess(res, await integrationService.disconnect(provider, req.user.id), 200, 'Integration disconnected');
});
