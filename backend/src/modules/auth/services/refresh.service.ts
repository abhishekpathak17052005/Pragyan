/**
 * Refresh Service
 * Handles token refresh and rotation
 */

import type { RefreshTokenInput } from "@/shared/auth";

export class RefreshService {
  /**
   * Refresh access token (scaffolded, implementation in Unit 6)
   */
  async refresh(_input: RefreshTokenInput) {
    throw new Error("Not implemented in Unit 1 - see Unit 6");
  }

  /**
   * Helper: Verify refresh token (internal)
   */
  protected async verifyRefreshToken(_token: string) {
    throw new Error("Not implemented - use jsonwebtoken");
  }

  /**
   * Helper: Rotate refresh token (internal)
   */
  protected async rotateRefreshToken(_oldToken: string, _userId: string) {
    throw new Error("Not implemented - use RefreshTokenRepository");
  }
}

export const refreshService = new RefreshService();
