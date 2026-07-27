import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { auditLogService, type AuditLog } from "@/services/auditLogService";

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    skip: 0,
    hasMore: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
  });

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await auditLogService.getAuditLogs({
          limit: pagination.limit,
          skip: pagination.skip,
        });
        setLogs(response.logs);
        setPagination(response.pagination);

        // Fetch stats
        const statsData = await auditLogService.getStats();
        setStats({
          total: statsData.total,
          successful: statsData.successful,
          failed: statsData.failed,
        });
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch audit logs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.skip]);

  // Filter logs based on search term
  const filteredLogs = logs.filter(
    (log) =>
      log.targetUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "LOGIN":
      case "LOGOUT":
        return "bg-blue-100 text-blue-800";
      case "PASSWORD_RESET":
        return "bg-yellow-100 text-yellow-800";
      case "EMAIL_VERIFIED":
        return "bg-green-100 text-green-800";
      case "USER_SUSPENDED":
        return "bg-red-100 text-red-800";
      case "USER_ACTIVE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">System activity and user actions log</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Complete audit trail of system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by user, action, resource, or organization..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Logs Table */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Resource</th>
                    <th className="px-4 py-3 text-left font-medium">Organization</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading audit logs...
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-medium text-sm">{log.targetUser}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p>{log.resource}</p>
                            <p className="text-xs text-muted-foreground">{log.resourceId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{log.organization}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.ipAddress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.skip === 0 || isLoading}
                    onClick={() => setPagination((p) => ({ ...p, skip: Math.max(0, p.skip - p.limit) }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!pagination.hasMore || isLoading}
                    onClick={() => setPagination((p) => ({ ...p, skip: p.skip + p.limit }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Log Statistics */}
            <div className="grid gap-4 md:grid-cols-4 mt-6 border-t pt-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground font-medium">Total Events</p>
                <p className="text-2xl font-bold mt-1">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground font-medium">Successful</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.successful.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : "0"}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
