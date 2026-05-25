import type { OAuthProfileUser } from '@/config/passport';
import type { JwtPayload } from '@/types';

declare global {
  namespace Express {
    interface User extends Partial<OAuthProfileUser> {
      id: string;
      email?: string;
      role: JwtPayload['role'];
      iat?: number;
      exp?: number;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
  }
}

export {};
