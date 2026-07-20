import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Edit2, Trash2, MapPin, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/services/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgCount {
  studentProfiles: number;
  recruiterProfiles: number;
  placementOfficerProfiles: number;
}

interface Organization {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  verified: boolean;
  isActive: boolean;
  createdAt: string;
  _count: OrgCount;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function locationString(org: Organization) {
  return [org.city, org.state, org.country].filter(Boolean).join(", ") || "—";
}

function memberCount(org: Organization) {
  return (
    org._count.studentProfiles +
    org._count.recruiterProfiles +
    org._count.placementOfficerProfiles
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminOrganizations() {
  const [orgs, setOrgs]             = useState<Organization[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggling, setToggling]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);

  // ── fetch ──
  async function loadOrgs() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<Organization[]>("/admin/organizations");
      setOrgs(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadOrgs(); }, []);

  // ── toggle active ──
  async function toggleActive(org: Organization) {
    setToggling(org.id);
    try {
      await api.patch(`/admin/organizations/${org.id}`, { isActive: !org.isActive });
      setOrgs((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, isActive: !o.isActive } : o))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update organization");
    } finally {
      setToggling(null);
    }
  }

  // ── delete ──
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/organizations/${id}`);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete organization");
    } finally {
      setDeleting(null);
    }
  }

  // ── filtered list ──
  const filtered = useMemo(() =>
    orgs.filter((o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [orgs, searchTerm]
  );

  const activeCount = orgs.filter((o) => o.isActive).length;
  const totalMembers = orgs.reduce((sum, o) => sum + memberCount(o), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
        <p className="text-muted-foreground mt-2">Manage recruiting organizations</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button className="ml-4 underline" onClick={loadOrgs}>Retry</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                {isLoading ? "Loading…" : `${orgs.length} registered organizations on the platform`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadOrgs} disabled={isLoading}>
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
                placeholder="Search organizations by name or email…"
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
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Location</th>
                    <th className="px-4 py-3 text-left font-medium">Members</th>
                    <th className="px-4 py-3 text-left font-medium">Verified</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted animate-pulse rounded w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.map((org) => (
                    <tr key={org.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{org.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {org.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{org.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {locationString(org)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{memberCount(org)}</td>
                      <td className="px-4 py-3">
                        {org.verified
                          ? <CheckCircle className="h-4 w-4 text-green-600" />
                          : <XCircle className="h-4 w-4 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(org.isActive)}`}>
                          {org.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={org.isActive ? "Deactivate" : "Activate"}
                            disabled={toggling === org.id}
                            onClick={() => toggleActive(org)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            title="Delete organization"
                            disabled={deleting === org.id}
                            onClick={() => handleDelete(org.id, org.name)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                No organizations found matching your search.
              </div>
            )}

            {/* Summary stats */}
            {!isLoading && orgs.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 mt-2">
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">Total Organizations</p>
                  <p className="text-2xl font-bold">{orgs.length}</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
