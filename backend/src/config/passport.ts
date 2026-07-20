import passport from 'passport';
import axios from 'axios';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { config } from '@/config/env';
import type { OAuthUserProfile } from '@/types/auth';
import type { Profile as GoogleProfile } from 'passport-google-oauth20';
import type { Profile as GitHubProfile } from 'passport-github2';

export type OAuthProvider = OAuthUserProfile['provider'];

function resolveFullName(firstName?: string, lastName?: string, displayName?: string, fallback = 'Pragyan User') {
  const mergedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return displayName?.trim() || mergedName || fallback;
}

function getGoogleProfile(profile: GoogleProfile): OAuthUserProfile {
  const email = profile.emails?.find((entry) => entry.value)?.value;

  if (!email) {
    throw new Error('Google account did not return an email address');
  }

  return {
    provider: 'google',
    providerId: profile.id,
    email,
    fullName: resolveFullName(profile.name?.givenName, profile.name?.familyName, profile.displayName, email.split('@')[0]),
    username: email.split('@')[0] || null,
    avatar: profile.photos?.[0]?.value ?? null,
    emailVerified: true,
  };
}

async function fetchGitHubEmail(accessToken: string) {
  try {
    console.log('[OAuth:github:fetchEmail] Attempting to fetch GitHub user emails');
    const response = await axios.get<Array<{ email: string; primary?: boolean; verified?: boolean }>>('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Pragyan',
      },
    });

    console.log('[OAuth:github:fetchEmail] Success. Emails count:', response.data?.length || 0);
    const emails = Array.isArray(response.data) ? response.data : [];
    const verifiedPrimary = emails.find((entry) => entry.primary && entry.verified && entry.email);
    const verifiedAny = emails.find((entry) => entry.verified && entry.email);
    const fallback = emails.find((entry) => entry.email);

    const selectedEmail = verifiedPrimary?.email || verifiedAny?.email || fallback?.email || null;
    console.log('[OAuth:github:fetchEmail] Selected email:', selectedEmail);
    return selectedEmail;
  } catch (error) {
    console.error('❌ GitHub email fetch failed:');
    console.error('Error type:', error instanceof Error ? error.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && 'response' in error) {
      console.error('HTTP status:', (error as any).response?.status);
      console.error('HTTP data:', (error as any).response?.data);
    }
    throw error;
  }
}

async function getGitHubProfile(accessToken: string, profile: GitHubProfile): Promise<OAuthUserProfile> {
  const emailFromProfile = profile.emails?.find((entry) => entry.value)?.value;
  const email = emailFromProfile || (await fetchGitHubEmail(accessToken));

  if (!email) {
    throw new Error('GitHub account did not return an email address');
  }

  const avatar = profile.photos?.[0]?.value || null;
  const fullName = resolveFullName(undefined, undefined, profile.displayName, profile.username || email.split('@')[0]);

  return {
    provider: 'github',
    providerId: profile.id,
    email,
    fullName,
    username: profile.username || email.split('@')[0] || null,
    avatar,
    emailVerified: true,
  };
}

export function isGoogleOAuthConfigured() {
  return Boolean(config.oauth.googleClientId && config.oauth.googleClientSecret);
}

export function isGitHubOAuthConfigured() {
  return Boolean(config.oauth.githubClientId && config.oauth.githubClientSecret);
}

export function configurePassport() {
  if (isGoogleOAuthConfigured()) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.googleClientId as string,
          clientSecret: config.oauth.googleClientSecret as string,
          callbackURL: `${config.apiBaseUrl}/api/auth/google/callback`,
          passReqToCallback: true,
        } as any,
        ((
          req: import('express').Request,
          accessToken: string,
          _refreshToken: string,
          profile: GoogleProfile,
          done: (error: Error | null, user?: OAuthUserProfile | false) => void
        ) => {
          try {
            console.log('OAuth callback reached');
            console.log('req.query', req?.query);
            console.log('profile', profile);
            console.log('[OAuth:google:verify]', {
              code: typeof req?.query?.code === 'string' ? req.query.code : undefined,
              accessTokenReceived: Boolean(accessToken),
              accessTokenLength: accessToken?.length || 0,
              profileId: profile.id,
              email: profile.emails?.[0]?.value || null,
            });
            done(null, { ...getGoogleProfile(profile), accessToken, refreshToken: _refreshToken || null } as any);
          } catch (err) {
            console.error('[OAUTH VERIFY ERROR]');
            console.error(err);
            console.error((err as any)?.stack);
            throw err;
          }
        }) as any
      )
    );
  }

  if (isGitHubOAuthConfigured()) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.oauth.githubClientId as string,
          clientSecret: config.oauth.githubClientSecret as string,
          callbackURL: `${config.apiBaseUrl}/api/auth/github/callback`,
        } as any,
        async (accessToken: string, _refreshToken: string, profile: GitHubProfile, done: (error: Error | null, user?: OAuthUserProfile | false) => void) => {
          try {
            console.log('[OAuth:github:verify] Starting GitHub profile processing');
            console.log('[OAuth:github:verify]', {
              accessTokenReceived: Boolean(accessToken),
              accessTokenLength: accessToken?.length || 0,
              profileId: profile.id,
              profileEmails: profile.emails?.length || 0,
            });
            done(null, { ...(await getGitHubProfile(accessToken, profile)), accessToken, refreshToken: _refreshToken || null } as any);
          } catch (error) {
            console.error('❌ GitHub OAuth Error:');
            console.error('Error type:', error instanceof Error ? error.name : typeof error);
            console.error('Error message:', error instanceof Error ? error.message : String(error));
            console.error('Full error:', error);
            done(error as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: unknown, done) => {
    done(null, user as any);
  });

  passport.deserializeUser((user: unknown, done) => {
    done(null, user as any);
  });
}
