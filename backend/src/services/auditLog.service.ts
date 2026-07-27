import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

interface AuditLogQuery {
  organizationId?: string;
  userId?: string;
  action?: AuditAction;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

interface CreateAuditLogInput {
  targetUserId: string;
  performedByUserId: string;
  organizationId?: string;
  action: AuditAction;
  status?: string;
  failureReason?: string;
  resourceType?: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  static async createAuditLog(input: CreateAuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          targetUserId: input.targetUserId,
          performedByUserId: input.performedByUserId,
          organizationId: input.organizationId,
          action: input.action,
          status: input.status || "SUCCESS",
          failureReason: input.failureReason,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          changes: input.changes,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
        include: {
          targetUser: {
            select: { id: true, email: true, fullName: true },
          },
          performedByUser: {
            select: { id: true, email: true, fullName: true },
          },
        },
      });
    } catch (error) {
      console.error("Error creating audit log:", error);
      throw error;
    }
  }

  /**
   * Get audit logs with filters and pagination
   */
  static async getAuditLogs(query: AuditLogQuery) {
    try {
      const {
        organizationId,
        userId,
        action,
        status,
        startDate,
        endDate,
        limit = 50,
        skip = 0,
      } = query;

      const where: any = {};

      if (organizationId) where.organizationId = organizationId;
      if (userId) where.targetUserId = userId;
      if (action) where.action = action;
      if (status) where.status = status;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            targetUser: {
              select: { id: true, email: true, fullName: true, role: true },
            },
            performedByUser: {
              select: { id: true, email: true, fullName: true, role: true },
            },
            organization: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map((log) => ({
          id: log.id,
          timestamp: log.createdAt,
          targetUser: log.targetUser.email,
          performedBy: log.performedByUser.email,
          action: log.action,
          resource: log.resourceType || "SYSTEM",
          resourceId: log.resourceId || "-",
          status: log.status,
          failureReason: log.failureReason,
          ipAddress: log.ipAddress || "Unknown",
          userAgent: log.userAgent || "Unknown",
          changes: log.changes,
          organization: log.organization?.name || "System",
        })),
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      };
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }
  }

  /**
   * Get audit logs by organization
   */
  static async getOrganizationAuditLogs(organizationId: string, options = {}) {
    return this.getAuditLogs({ organizationId, ...options });
  }

  /**
   * Get user activity
   */
  static async getUserActivity(userId: string, limit = 20) {
    try {
      return await prisma.auditLog.findMany({
        where: {
          OR: [
            { targetUserId: userId },
            { performedByUserId: userId },
          ],
        },
        include: {
          targetUser: {
            select: { id: true, email: true, fullName: true },
          },
          performedByUser: {
            select: { id: true, email: true, fullName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      console.error("Error fetching user activity:", error);
      throw error;
    }
  }

  /**
   * Get statistics for audit logs
   */
  static async getAuditStats(organizationId?: string) {
    try {
      const where = organizationId ? { organizationId } : {};

      const [total, successful, failed, byAction] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.count({ where: { ...where, status: "SUCCESS" } }),
        prisma.auditLog.count({ where: { ...where, status: "FAILED" } }),
        prisma.auditLog.groupBy({
          by: ["action"],
          where,
          _count: true,
        }),
      ]);

      return {
        total,
        successful,
        failed,
        byAction: Object.fromEntries(byAction.map((a) => [a.action, a._count])),
      };
    } catch (error) {
      console.error("Error fetching audit stats:", error);
      throw error;
    }
  }
}
