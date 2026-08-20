/**
 * Audit Repository
 * Handles all audit log database operations
 */

import { AuditAction } from "@prisma/client";
import { ObjectId } from "mongodb";
import { prisma } from "@/lib/prisma";

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
  private isValidObjectId(value?: string | null): boolean {
    if (!value || typeof value !== "string") return false;
    return ObjectId.isValid(value) && new ObjectId(value).toString() === value;
  }

  /**
   * Log audit event
   */
  async log(data: AuditLogData) {
    if (!this.isValidObjectId(data.targetUserId) || !this.isValidObjectId(data.performedByUserId)) {
      console.warn("[AuditRepository] Skipping audit log for invalid ObjectId fields", {
        targetUserId: data.targetUserId,
        performedByUserId: data.performedByUserId,
        action: data.action,
      });
      return null;
    }

    const organizationId = data.organizationId && this.isValidObjectId(data.organizationId) ? data.organizationId : null;

    return prisma.auditLog.create({
      data: {
        targetUserId: data.targetUserId,
        performedByUserId: data.performedByUserId,
        organizationId,
        action: data.action,
        status: data.status,
        failureReason: data.failureReason,
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
