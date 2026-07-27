import { api } from "./apiClient";

export interface AuditLog {
  id: string;
  timestamp: string;
  targetUser: string;
  performedBy: string;
  action: string;
  resource: string;
  resourceId: string;
  status: "SUCCESS" | "FAILED";
  failureReason?: string;
  ipAddress: string;
  userAgent: string;
  organization: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

interface AuditStats {
  total: number;
  successful: number;
  failed: number;
  byAction: Record<string, number>;
}

export const auditLogService = {
  /**
   * Get all audit logs with pagination and filtering
   */
  async getAuditLogs(
    filters?: {
      organizationId?: string;
      userId?: string;
      action?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<AuditLogsResponse> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.organizationId) params.append("organizationId", filters.organizationId);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.skip) params.append("skip", filters.skip.toString());
    }

    const queryString = params.toString();
    const url = `/admin/audit-logs${queryString ? `?${queryString}` : ""}`;
    return api.get<AuditLogsResponse>(url);
  },

  /**
   * Get audit log statistics
   */
  async getStats(organizationId?: string): Promise<AuditStats> {
    const params = new URLSearchParams();
    if (organizationId) params.append("organizationId", organizationId);

    const queryString = params.toString();
    const url = `/admin/audit-logs/stats${queryString ? `?${queryString}` : ""}`;
    return api.get<AuditStats>(url);
  },

  /**
   * Get audit logs for a specific user
   */
  async getUserActivity(userId: string, limit: number = 20): Promise<AuditLog[]> {
    return api.get<AuditLog[]>(`/admin/audit-logs/user/${userId}?limit=${limit}`);
  },

  /**
   * Get audit logs for a specific organization
   */
  async getOrganizationLogs(
    organizationId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<AuditLogsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.skip) params.append("skip", options.skip.toString());

    const queryString = params.toString();
    const url = `/admin/audit-logs/organization/${organizationId}${
      queryString ? `?${queryString}` : ""
    }`;
    return api.get<AuditLogsResponse>(url);
  },
};
