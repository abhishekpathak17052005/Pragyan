import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter } from "lucide-react";
import { useState } from "react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  resourceId: string;
  status: "success" | "failed";
  ipAddress: string;
  userAgent: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2026-07-14 15:45:23",
    user: "admin@pragyan.com",
    action: "LOGIN",
    resource: "AUTH",
    resourceId: "admin-session-001",
    status: "success",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
  },
  {
    id: "2",
    timestamp: "2026-07-14 15:32:10",
    user: "john@student.com",
    action: "VIEW",
    resource: "ASSESSMENT",
    resourceId: "assessment-123",
    status: "success",
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0",
  },
  {
    id: "3",
    timestamp: "2026-07-14 14:28:45",
    user: "recruiter@techcorp.com",
    action: "CREATE",
    resource: "JOB_POSTING",
    resourceId: "job-456",
    status: "success",
    ipAddress: "192.168.2.10",
    userAgent: "Mozilla/5.0",
  },
  {
    id: "4",
    timestamp: "2026-07-14 13:15:32",
    user: "officer@college.edu",
    action: "EXPORT",
    resource: "REPORT",
    resourceId: "report-789",
    status: "success",
    ipAddress: "192.168.3.5",
    userAgent: "Mozilla/5.0",
  },
  {
    id: "5",
    timestamp: "2026-07-14 12:01:15",
    user: "unknown@email.com",
    action: "LOGIN",
    resource: "AUTH",
    resourceId: "failed-login-001",
    status: "failed",
    ipAddress: "192.168.4.100",
    userAgent: "Mozilla/5.0",
  },
  {
    id: "6",
    timestamp: "2026-07-14 11:45:00",
    user: "admin@pragyan.com",
    action: "DELETE",
    resource: "USER",
    resourceId: "user-999",
    status: "success",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
  },
];

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs] = useState(mockAuditLogs);

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "LOGIN":
        return "bg-blue-100 text-blue-800";
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "VIEW":
        return "bg-purple-100 text-purple-800";
      case "EXPORT":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">System activity and user actions log</p>
      </div>

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
                  placeholder="Search logs by user, action, or resource..."
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
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-4 py-3 font-medium">{log.user}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm">{log.resource}</p>
                          <p className="text-xs text-muted-foreground">{log.resourceId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found matching your search.
              </div>
            )}

            {/* Log Statistics */}
            <div className="grid gap-4 md:grid-cols-4 mt-6">
              <div className="bg-muted p-3 rounded">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter((l) => l.status === "success").length}
                </p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter((l) => l.status === "failed").length}
                </p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
