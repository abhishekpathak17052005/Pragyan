/**
 * Audit Repository
 * Handles all audit log database operations
 */

import { PrismaClient, AuditAction } from "@prisma/client";

const prisma = new PrismaClient();

export enum LoginFailureReason {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  ACCOUNT_PENDING = "ACCOUNT_PENDING",
  ACCOUNT_REJECTED = "ACCOUNT_REJECTED",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  INVALID_PASSWORD = "INVALID_PASSWORD",
  THROTTLED = "THROTTLED",
}

export interface AuditLogData {
  targetUserId: string;
  performedByUserId: string;
  organizationId?: string | null;  // Made optional
  action: AuditAction;
  status: "SUCCESS" | "FAILURE";
  failureReason?: LoginFailureReason | string;  // Structured reason for failures
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
}

export class AuditRepository {
  /**
   * Log audit event
   */
  async log(data: AuditLogData) {
    return prisma.auditLog.create({
      data: {
        targetUserId: data.targetUserId,
        performedByUserId: data.performedByUserId,
        organizationId: data.organizationId && data.organizationId !== "" ? data.organizationId : null,
        action: data.action,
        status: data.status,
        failureReason: data.failureReason,  // Structured reason
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        changes: data.changes,
      },
    });
  }

  /**
   * Find logs by target user ID
   */
  async findByUserId(userId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Find logs by action
   */
  async findByAction(action: AuditAction, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Find failed login attempts
   */
  async findFailedLogins(hoursBack: number = 1) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return prisma.auditLog.findMany({
      where: {
        action: "LOGIN",
        status: "FAILURE",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get login history for user
   */
  async getLoginHistory(userId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.auditLog.findMany({
      where: {
        targetUserId: userId,
        action: "LOGIN",
        status: "SUCCESS",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get account activity summary
   */
  async getActivitySummary(userId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.auditLog.findMany({
      where: {
        targetUserId: userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const auditRepository = new AuditRepository();
