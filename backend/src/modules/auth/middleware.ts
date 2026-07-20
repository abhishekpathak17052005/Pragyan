/**
 * Auth Module - Middleware
 *
 * requireAuth: Verify JWT token and attach user to request
 * (Other middleware added in Unit 10)
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_CONSTANTS } from "./constants";
import { TokenRequiredError, InvalidTokenError } from "./errors";
import type { AuthContext } from "./types";

/**
 * Extend Express Request with auth context
 */
declare global {
  namespace Express {
    interface Request {
      authUser?: AuthContext;
      token?: string;
    }
  }
}

/**
 * Extract JWT from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token and extract payload
 */
function verifyToken(token: string): AuthContext {
  try {
    const decoded = jwt.verify(token, JWT_CONSTANTS.SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
      organizationType: decoded.organizationType,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new InvalidTokenError("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError("Invalid token");
    }
    throw error;
  }
}

/**
 * Middleware: Require authentication
 * Verifies JWT token and attaches user context to request
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new TokenRequiredError();
    }

    const authUser = verifyToken(token);
    req.authUser = authUser;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
}



/**
 * Middleware: Optional authentication
 * Doesn't throw if token missing, just sets authUser if present
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);
    if (token) {
      req.authUser = verifyToken(token);
      req.token = token;
    }
    next();
  } catch (error) {
    // Ignore auth errors in optional middleware
    next();
  }
}
