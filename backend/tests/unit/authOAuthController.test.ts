jest.mock('passport', () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

import passport from 'passport';
import { googleCallback, githubCallback } from '@/controllers/auth';
import { authService } from '@/services/auth';

describe('OAuth auth controller callbacks', () => {
  const authenticateMock = passport.authenticate as jest.Mock;

  beforeEach(() => {
    authenticateMock.mockReset();
    jest.spyOn(authService, 'oauthLogin').mockReset();
  });

  it('redirects to frontend success URL with tokens for Google OAuth login', async () => {
    const req = {} as any;
    const res = {
      redirect: jest.fn(),
    } as any;
    const next = jest.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, _options: unknown, callback: (error: Error | null, user: any) => Promise<void>) =>
        async () => {
          await callback(null, {
            provider: 'google',
            providerId: 'google-123',
            email: 'oauth@example.com',
            fullName: 'OAuth User',
            avatar: null,
            emailVerified: true,
          });
        }
    );

    jest.spyOn(authService, 'oauthLogin').mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'oauth@example.com',
        fullName: 'OAuth User',
        role: 'USER',
      },
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
    });

    await googleCallback(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/auth/success#accessToken=access-token-value&refreshToken=refresh-token-value'
    );
  });

  it('redirects to missing_email error when GitHub callback has no email', async () => {
    const req = {} as any;
    const res = {
      redirect: jest.fn(),
    } as any;
    const next = jest.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, _options: unknown, callback: (error: Error | null, user: any) => Promise<void>) =>
        async () => {
          await callback(null, {
            provider: 'github',
            providerId: 'github-123',
            fullName: 'No Email User',
            avatar: null,
            emailVerified: false,
          });
        }
    );

    jest.spyOn(authService, 'oauthLogin').mockRejectedValue(new Error('Email address is required from OAuth provider'));

    await githubCallback(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth?error=missing_email');
  });
});
