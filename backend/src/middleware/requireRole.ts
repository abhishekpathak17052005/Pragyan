/**
 * Require Role Middleware
 * Validates that the user has one of the specified roles
 * Works in conjunction with requireAuth middleware
 * 
 * Usage:
 * - requireRole("ADMIN"): Only admins
 * - requireRole(["ADMIN", "PLACEMENT_OFFICER"]): Admins or placement officers
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/errors";

export type UserRole = "STUDENT" | "RECRUITER" | "PLACEMENT_OFFICER" | "ADMIN";

/**
 * Require specific role(s)
 * @param roles Single role or array of roles required
 * @returns Express middleware function
 */
export function requireRole(roles: UserRole | UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Get user from request (set by requireAuth middleware)
    const authUser = (req as any).authUser;
    
    // requireAuth middleware must run first
    if (!authUser) {
      throw new AppError(401, "Authentication required");
    }

    const roleArray = Array.isArray(roles) ? roles : [roles];
    const userRole = authUser.role as UserRole;

    if (!roleArray.includes(userRole)) {
      throw new AppError(
        403,
        `This resource requires one of the following roles: ${roleArray.join(", ")}. Your role: ${userRole}`
      );
    }

    next();
  };
}

/**
 * Utility to check if user has role (for guards/conditions)
 */
export function userHasRole(userRole: string, requiredRoles: UserRole | UserRole[]): boolean {
  const roleArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roleArray.includes(userRole as UserRole);
}
