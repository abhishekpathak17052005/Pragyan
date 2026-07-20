/**
 * Refresh Token Response DTO
 * Returned after token refresh
 */

export class RefreshResponseDTO {
  accessToken: string;
  refreshToken?: string; // Only if rotated
  expiresIn: number; // seconds

  constructor(data: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.expiresIn = data.expiresIn;
  }
}
