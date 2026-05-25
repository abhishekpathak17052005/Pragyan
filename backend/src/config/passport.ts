import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { config } from '@/config/env';

export type OAuthProvider = 'google' | 'github';

export interface OAuthProfileUser {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  fullName: string;
  avatar?: string | null;
  emailVerified: boolean;
}

function mapGoogleProfile(profile: GoogleProfile): OAuthProfileUser {
  const primaryEmail = profile.emails?.[0]?.value?.toLowerCase();
  const verifiedEmail = profile.emails?.[0]?.verified ?? false;

  return {
    provider: 'google',
    providerId: profile.id,
    email: primaryEmail,
    fullName: profile.displayName || primaryEmail || 'Google User',
    avatar: profile.photos?.[0]?.value ?? null,
    emailVerified: verifiedEmail,
  };
}

function mapGitHubProfile(profile: GitHubProfile): OAuthProfileUser {
  const primaryEmail = profile.emails?.[0]?.value?.toLowerCase();

  return {
    provider: 'github',
    providerId: profile.id,
    email: primaryEmail,
    fullName: profile.displayName || profile.username || primaryEmail || 'GitHub User',
    avatar: profile.photos?.[0]?.value ?? null,
    emailVerified: Boolean(primaryEmail),
  };
}

export function configurePassport(): void {
  if (config.oauth.googleClientId && config.oauth.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.googleClientId,
          clientSecret: config.oauth.googleClientSecret,
          callbackURL: '/api/auth/google/callback',
        },
        (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: (error: unknown, user?: Express.User | false) => void) => {
          const oauthUser = mapGoogleProfile(profile);
          done(null, {
            ...oauthUser,
            id: oauthUser.providerId,
            email: oauthUser.email || '',
            role: 'USER',
          } as Express.User);
        }
      )
    );
  }

  if (config.oauth.githubClientId && config.oauth.githubClientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.oauth.githubClientId,
          clientSecret: config.oauth.githubClientSecret,
          callbackURL: '/api/auth/github/callback',
          scope: ['user:email'],
        },
        (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: (error: unknown, user?: Express.User | false) => void) => {
          const oauthUser = mapGitHubProfile(profile);
          done(null, {
            ...oauthUser,
            id: oauthUser.providerId,
            email: oauthUser.email || '',
            role: 'USER',
          } as Express.User);
        }
      )
    );
  }

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });
}
