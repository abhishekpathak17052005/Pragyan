/**
 * Login Response DTO
 * Returned after successful login
 * Minimal payload - frontend fetches additional data via GET /auth/me
 */

export class LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: {
    id: string;
    email: string;
    fullName: string;
    avatar?: string;
    role: string;
  };

  constructor(data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
    email: string;
    fullName: string;
    avatar?: string;
    role: string;
  }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.expiresIn = data.expiresIn;
    this.user = {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      avatar: data.avatar,
      role: data.role,
    };
  }
}
