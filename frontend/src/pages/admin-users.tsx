import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Edit2, Trash2, Shield, RefreshCw } from "lucide-react";
import { api } from "@/services/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accountStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  xp: number;
  streak: number;
}

const ROLES = ["USER", "ADMIN", "STUDENT", "RECRUITER", "PLACEMENT_OFFICER"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN":           return "bg-red-100 text-red-800";
    case "STUDENT":         return "bg-blue-100 text-blue-800";
    case "RECRUITER":       return "bg-green-100 text-greeneen-800";
    case "PLACEMENT_OFFICER": return "bg-yellow-100 text-yellow-800";
    default:                return "bg-gray-100 text-gray-800";
  }
}

function getStatusColor(isActive: boolean) {
  return isActive
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [users, setUsers]           = useState<User[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: string; role: string } | null>(null);
  const [saving, setSaving]         = useState<string | null>(null); // userId being saved

  // ── fetch ──
  async function loadUsers() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<User[]>("/admin/users");
      setUsers(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  // ── role change ──
  async function saveRole(userId: string, newRole: string) {
    setSaving(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setEditingRole(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(null);
    }
  }

  // ── filtered list ──
  const filtered = useMemo(() =>
    users.filter((u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage platform users and their roles</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-4 underline" onClick={loadUsers}>Retry</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {isLoading ? "Loading…" : `${users.length} registered users`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name…"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">XP</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-t">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted animate-pulse rounded w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 font-medium">{user.fullName}</td>

                      {/* Role — inline edit */}
                      <td className="px-4 py-3">
                        {editingRole?.id === user.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              className="text-xs border rounded px-1 py-0.5"
                              value={editingRole.role}
                              onChange={(e) =>
                                setEditingRole({ id: user.id, role: e.target.value })
                              }
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs"
                              disabled={saving === user.id}
                              onClick={() => saveRole(user.id, editingRole.role)}
                            >
                              {saving === user.id ? "…" : "Save"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setEditingRole(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.isActive)}`}>
                          {user.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.xp}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit role"
                            onClick={() => setEditingRole({ id: user.id, role: user.role })}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Change role"
                            onClick={() => setEditingRole({ id: user.id, role: user.role })}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
