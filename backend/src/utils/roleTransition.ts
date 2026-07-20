/**
 * Role Field Transition Utility
 *
 * Current State (v0.1.0):
 * - New code uses `userRole` enum (Prisma field)
 * - Legacy code uses `role` string (existing field)
 * - Both fields set on user create for backward compatibility
 *
 * Migration Path:
 * v0.1.0: Introduce userRole, keep role
 * v0.1.x: Gradually migrate modules to use userRole
 * v0.2.0: Remove role field entirely
 *
 * DELETE THIS FILE IN v0.2.0
 */

import { UserRole } from "@/shared/auth";

/**
 * Map new UserRole enum to legacy role string
 * Temporary utility for v0.1.0 compatibility
 */
export function mapUserRoleToLegacyRole(userRole: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    STUDENT: "student",
    RECRUITER: "recruiter",
    PLACEMENT_OFFICER: "placement_officer",
    ADMIN: "admin",
  };
  return roleMap[userRole];
}

/**
 * Map legacy role string to new UserRole enum
 * Used when migrating old user records
 */
export function mapLegacyRoleToUserRole(legacyRole: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    student: "STUDENT",
    recruiter: "RECRUITER",
    placement_officer: "PLACEMENT_OFFICER",
    admin: "ADMIN",
  };
  return roleMap[legacyRole] || "STUDENT";
}

/**
 * Get the effective role (prefer new field)
 * Falls back to legacy if new field not set
 */
export function getEffectiveRole(
  userRole: UserRole | null | undefined,
  legacyRole?: string | null
): UserRole {
  if (userRole) {
    return userRole;
  }
  if (legacyRole) {
    return mapLegacyRoleToUserRole(legacyRole);
  }
  return "STUDENT"; // Default fallback
}

/**
 * Role checking utilities
 */
export function isStudent(role: UserRole): boolean {
  return role === "STUDENT";
}

export function isRecruiter(role: UserRole): boolean {
  return role === "RECRUITER";
}

export function isPlacementOfficer(role: UserRole): boolean {
  return role === "PLACEMENT_OFFICER";
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function isStaff(role: UserRole): boolean {
  return isPlacementOfficer(role) || isAdmin(role);
}

export function isCompanyUser(role: UserRole): boolean {
  return isRecruiter(role);
}

/**
 * Get role hierarchy for permission checks
 * Higher number = more permissions
 */
export function getRoleLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    STUDENT: 1,
    RECRUITER: 2,
    PLACEMENT_OFFICER: 3,
    ADMIN: 4,
  };
  return levels[role] || 0;
}
