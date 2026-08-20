import axios from 'axios';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { config } from '@/config/env';
import { AppError, BadRequestError, NotFoundError } from '@/utils/errors';

export const integrationProviders = ['github', 'linkedin', 'google'] as const;
export type IntegrationProvider = (typeof integrationProviders)[number];

type OAuthToken = { access_token: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };
type SafeStatus = { provider: IntegrationProvider; connected: boolean; accountName?: string; lastSyncedAt?: Date; tokenExpired?: boolean; summary?: Record<string, unknown> };

function encryptionKey() {
  const source = config.oauth.integrationTokenEncryptionKey;
  if (!source) throw new AppError(500, 'Integration token encryption is not configured');
  return createHash('sha256').update(source).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decrypt(value: string) {
  const [iv, tag, encrypted] = value.split('.');
  if (!iv || !tag || !encrypted) throw new AppError(500, 'Stored integration token is invalid');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

function callbackUrl(provider: IntegrationProvider) {
  return `${config.apiBaseUrl}/api/integrations/${provider}/callback`;
}

function providerConfig(provider: IntegrationProvider) {
  if (provider === 'github') {
    if (!config.oauth.githubClientId || !config.oauth.githubClientSecret) throw new AppError(503, 'GitHub integration is not configured');
    return { clientId: config.oauth.githubClientId, clientSecret: config.oauth.githubClientSecret, authorizeUrl: 'https://github.com/login/oauth/authorize', scopes: ['read:user', 'user:email'] };
  }
  if (provider === 'linkedin') {
    if (!config.oauth.linkedinClientId || !config.oauth.linkedinClientSecret) throw new AppError(503, 'LinkedIn integration is not configured');
    return { clientId: config.oauth.linkedinClientId, clientSecret: config.oauth.linkedinClientSecret, authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization', scopes: ['openid', 'profile', 'email'] };
  }
  if (!config.oauth.googleClientId || !config.oauth.googleClientSecret) throw new AppError(503, 'Google Calendar integration is not configured');
  return { clientId: config.oauth.googleClientId, clientSecret: config.oauth.googleClientSecret, authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.events.readonly'] };
}

function safeMetadata(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
}

export class IntegrationService {
  createAuthorizationUrl(provider: IntegrationProvider, state: string) {
    const providerSettings = providerConfig(provider);
    const url = new URL(providerSettings.authorizeUrl);
    url.searchParams.set('client_id', providerSettings.clientId);
    url.searchParams.set('redirect_uri', callbackUrl(provider));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', providerSettings.scopes.join(' '));
    url.searchParams.set('state', state);
    if (provider === 'google') {
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
    }
    return url.toString();
  }

  async completeOAuth(provider: IntegrationProvider, userId: string, code: string) {
    const token = await this.exchangeCode(provider, code);
    await this.saveToken(provider, userId, token);
    return this.sync(provider, userId);
  }

  async getStatuses(userId: string): Promise<SafeStatus[]> {
    const records = await prisma.userIntegration.findMany({ where: { userId } });
    return integrationProviders.map((provider) => {
      const record = records.find((item) => item.provider === provider);
      if (!record) return { provider, connected: false };
      const metadata = safeMetadata(record.metadata);
      return {
        provider,
        connected: true,
        accountName: typeof metadata.accountName === 'string' ? metadata.accountName : undefined,
        lastSyncedAt: record.lastSyncedAt || undefined,
        tokenExpired: Boolean(record.tokenExpiresAt && record.tokenExpiresAt.getTime() <= Date.now()),
        summary: safeMetadata(metadata.summary),
      };
    });
  }

  async disconnect(provider: IntegrationProvider, userId: string) {
    const connection = await prisma.userIntegration.findUnique({ where: { userId_provider: { userId, provider } } });
    if (!connection) throw new NotFoundError('Integration is not connected');
    await prisma.$transaction([
      prisma.userIntegration.delete({ where: { id: connection.id } }),
      ...(provider === 'github' ? [prisma.githubRepository.deleteMany({ where: { userId } })] : []),
    ]);
    return { disconnected: true };
  }

  async sync(provider: IntegrationProvider, userId: string) {
    const connection = await prisma.userIntegration.findUnique({ where: { userId_provider: { userId, provider } } });
    if (!connection) throw new NotFoundError('Integration is not connected');
    const accessToken = await this.getUsableAccessToken(provider, connection);
    const result = provider === 'github'
      ? await this.syncGitHub(userId, accessToken)
      : provider === 'linkedin'
        ? await this.syncLinkedIn(userId, accessToken)
        : await this.syncGoogleCalendar(accessToken);
    await prisma.userIntegration.update({ where: { id: connection.id }, data: { metadata: result.metadata as any, lastSyncedAt: new Date() } });
    return { provider, ...result.summary };
  }

  private async exchangeCode(provider: IntegrationProvider, code: string): Promise<OAuthToken> {
    const settings = providerConfig(provider);
    const endpoint = provider === 'github'
      ? 'https://github.com/login/oauth/access_token'
      : provider === 'linkedin'
        ? 'https://www.linkedin.com/oauth/v2/accessToken'
        : 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, code, redirect_uri: callbackUrl(provider), grant_type: 'authorization_code' });
    try {
      const response = await axios.post<OAuthToken>(endpoint, body.toString(), { headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15_000 });
      if (!response.data.access_token) throw new BadRequestError('Provider did not return an access token');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'Unable to exchange the provider authorization code');
    }
  }

  private async saveToken(provider: IntegrationProvider, userId: string, token: OAuthToken) {
    const settings = providerConfig(provider);
    const scopes = (token.scope || settings.scopes.join(' ')).split(/[\s,]+/).filter(Boolean);
    await prisma.userIntegration.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, encryptedAccessToken: encrypt(token.access_token), encryptedRefreshToken: token.refresh_token ? encrypt(token.refresh_token) : null, tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null, scopes },
      update: { encryptedAccessToken: encrypt(token.access_token), ...(token.refresh_token ? { encryptedRefreshToken: encrypt(token.refresh_token) } : {}), tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null, scopes },
    });
  }

  private async getUsableAccessToken(provider: IntegrationProvider, connection: any) {
    if (!connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() > Date.now() + 60_000) return decrypt(connection.encryptedAccessToken);
    if (provider !== 'google' || !connection.encryptedRefreshToken) throw new AppError(401, 'This integration has expired. Please reconnect it.');
    const settings = providerConfig('google');
    try {
      const body = new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: decrypt(connection.encryptedRefreshToken), grant_type: 'refresh_token' });
      const response = await axios.post<OAuthToken>('https://oauth2.googleapis.com/token', body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15_000 });
      if (!response.data.access_token) throw new Error('No access token');
      await this.saveToken(provider, connection.userId, { ...response.data, refresh_token: undefined });
      return response.data.access_token;
    } catch {
      throw new AppError(401, 'Google Calendar authorization has expired. Please reconnect it.');
    }
  }

  private async syncGitHub(userId: string, accessToken: string) {
    try {
      const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Pragyan' };
      const [profileResponse, repositoriesResponse] = await Promise.all([
        axios.get<any>('https://api.github.com/user', { headers, timeout: 15_000 }),
        axios.get<any[]>('https://api.github.com/user/repos', { headers, params: { per_page: 100, sort: 'updated', affiliation: 'owner,collaborator,organization_member' }, timeout: 15_000 }),
      ]);
      const profile = profileResponse.data;
      const repositories = (repositoriesResponse.data || []).filter((repo) => !repo.fork).sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count) || new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime());
      await prisma.githubRepository.deleteMany({ where: { userId } });
      if (repositories.length) await prisma.githubRepository.createMany({ data: repositories.map((repo) => ({ userId, repoId: String(repo.id), name: repo.name, fullName: repo.full_name, htmlUrl: repo.html_url, description: repo.description || null, language: repo.language || null, stars: repo.stargazers_count || 0, forks: repo.forks_count || 0, isPrivate: Boolean(repo.private), defaultBranch: repo.default_branch || null, pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null })) });
      const technicalStack = Array.from(new Set(repositories.map((repo) => repo.language).filter(Boolean))).slice(0, 12);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { githubUrl: true, avatar: true, bio: true, location: true } });
      await prisma.user.update({ where: { id: userId }, data: { ...(user?.githubUrl ? {} : { githubUrl: profile.html_url || null }), ...(user?.avatar ? {} : { avatar: profile.avatar_url || null }), ...(user?.bio ? {} : { bio: profile.bio || null }), ...(user?.location ? {} : { location: profile.location || null }) } });
      return { metadata: { accountName: profile.login, profileUrl: profile.html_url, summary: { publicRepositories: profile.public_repos || 0, followers: profile.followers || 0, following: profile.following || 0, technicalStack, majorProjects: repositories.slice(0, 3).map((repo) => ({ name: repo.name, url: repo.html_url })) } }, summary: { repositories: repositories.length, technicalStack } };
    } catch {
      throw new AppError(502, 'GitHub data could not be synchronized. Please try again later.');
    }
  }

  private async syncLinkedIn(userId: string, accessToken: string) {
    try {
      const response = await axios.get<any>('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15_000 });
      const profile = response.data;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true, fullName: true } });
      await prisma.user.update({ where: { id: userId }, data: { ...(user?.avatar ? {} : { avatar: profile.picture || null }), ...(user?.fullName ? {} : { fullName: profile.name || undefined }) } });
      return { metadata: { accountName: profile.name || profile.email || 'LinkedIn member', summary: { profileAuthorized: true, emailAvailable: Boolean(profile.email) } }, summary: { profileAuthorized: true } };
    } catch {
      throw new AppError(502, 'LinkedIn basic profile data could not be synchronized. Check the approved OpenID scopes and try again.');
    }
  }

  private async syncGoogleCalendar(accessToken: string) {
    try {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const response = await axios.get<any>('https://www.googleapis.com/calendar/v3/calendars/primary/events', { headers: { Authorization: `Bearer ${accessToken}` }, params: { timeMin: now.toISOString(), timeMax: weekFromNow.toISOString(), singleEvents: true, orderBy: 'startTime', maxResults: 100 }, timeout: 15_000 });
      const events = Array.isArray(response.data.items) ? response.data.items : [];
      const timedEvents = events.filter((event: any) => event.start?.dateTime);
      return { metadata: { accountName: 'Google Calendar', summary: { upcomingRelevantEvents: timedEvents.length, allDayEvents: events.length - timedEvents.length, periodEndsAt: weekFromNow.toISOString() } }, summary: { upcomingRelevantEvents: timedEvents.length } };
    } catch {
      throw new AppError(502, 'Google Calendar could not be synchronized. Confirm calendar permission and try again.');
    }
  }
}

export const integrationService = new IntegrationService();
