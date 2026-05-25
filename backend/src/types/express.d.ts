import type { OAuthProfileUser } from '@/config/passport';

declare global {
  namespace Express {
    interface User extends OAuthProfileUser {}
  }
}

export {};
