import type { OAuthProfileUser } from '@/config/passport';
import type { JwtPayload } from '@/types';

declare global {
  namespace Express {
    interface User extends JwtPayload, Partial<OAuthProfileUser> {}
  }
}

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
  }
}

export {};
