export interface JwtPayload {
  id: string;
  email: string;
  role: 'STUDENT' | 'RECRUITER' | 'PLACEMENT_OFFICER' | 'ADMIN';  // Native roles, no mapping
  ver?: number;  // JWT version for forward compatibility
  iat?: number;
  exp?: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  fullName: string;
}

export interface OAuthUserProfile {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  fullName: string;
  username?: string | null;
  avatar?: string | null;
  emailVerified?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatar?: string | null;
    provider?: string;
    emailVerified?: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
}
