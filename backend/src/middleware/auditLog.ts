import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "@/services/auditLog.service";
import { AuditAction } from "@prisma/client";

/**
 * Middleware to log authentication events
 */
export async function logAuthEvent(
  userId: string,
  action: AuditAction,
  status: "SUCCESS" | "FAILED",
  req: Request,
  failureReason?: string
) {
  try {
    // Get IP address and user agent from request
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    await AuditLogService.createAuditLog({
      targetUserId: userId,
      performedByUserId: userId, // User performing action on themselves for auth events
      action,
      status,
      failureReason,
      resourceType: "AUTH",
      resourceId: `${action}-${Date.now()}`,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Silently fail - don't break the main flow if audit logging fails
    console.error("Error logging audit event:", error);
  }
}

/**
 * Middleware to log admin actions
 */
export async function logAdminAction(
  performedByUserId: string,
  targetUserId: string,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  req: Request,
  changes?: any,
  status: "SUCCESS" | "FAILED" = "SUCCESS",
  failureReason?: string
) {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    await AuditLogService.createAuditLog({
      targetUserId,
      performedByUserId,
      action,
      status,
      failureReason,
      resourceType,
      resourceId,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}

/**
 * Middleware to track user actions
 */
export function auditLogMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original send method
    const originalSend = res.send;

    // Intercept send to capture response status
    res.send = function (data: any) {
      // Only log if user is authenticated
      if (req.user) {
        // Attach audit info to request for use in controllers
        (req as any).auditLog = {
          userId: (req.user as any).id,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          timestamp: new Date(),
        };
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}
