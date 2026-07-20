// src/utils/jwt.ts

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { config } from '@/config/env';
import { JwtPayload } from '@/types';

/**
 * JWT versioning for forward compatibility
 * Increment when JWT payload structure changes
 * Middleware can use this to know how to interpret the token
 */
const JWT_VERSION = 1;

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    {
      ...payload,
      ver: JWT_VERSION,  // Add version to payload
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiry as jwt.SignOptions['expiresIn'],
    }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { 
      id: userId, 
      jti: randomUUID(),
      ver: JWT_VERSION,  // Add version to refresh token too
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyAccessToken = (token: string): (JwtPayload & { ver?: number }) | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as (JwtPayload & { ver?: number });
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { id: string; jti?: string; ver?: number } | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as { id: string; jti?: string; ver?: number };
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): (JwtPayload & { ver?: number }) | null => {
  return jwt.decode(token) as (JwtPayload & { ver?: number }) | null;
};

/**
 * Check JWT version for forward compatibility
 * Middleware can use this to handle different JWT formats
 * @param token Raw JWT token
 * @returns Token version (defaults to 0 if not set)
 */
export const getJwtVersion = (token: string): number => {
  const decoded = decodeToken(token);
  return decoded?.ver || 0;
};

/**
 * Supported JWT versions and their features
 * - v0: Legacy (no version field)
 * - v1: Current (includes ver, deviceId support)
 * - v2+: Future versions
 */
export const JWT_VERSIONS = {
  LEGACY: 0,
  CURRENT: 1,
} as const;
