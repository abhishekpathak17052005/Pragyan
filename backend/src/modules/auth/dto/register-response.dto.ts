/**
 * Register Response DTO
 * Returned after successful registration
 * Does NOT expose internal details like accountStatus, organizationId
 */

export class RegisterResponseDTO {
  accessToken: string;
  refreshToken: string;
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
    userId: string;
    email: string;
    fullName: string;
    avatar?: string;
    role: string;
  }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      avatar: data.avatar,
      role: data.role,
    };
  }
}
