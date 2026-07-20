import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { api } from "@/services/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoleEntry {
  name: string;
  value: number;
  color: string;
}

interface GrowthEntry {
  name: string;
  users: number;
  month: string;
}

interface AdminDashboardData {
  totalUsers: number;
  activeUsers: number;
  currentUserCount: number;
  activeCurrentUserCount: number;
  adminUserCount: number;
  roadmapCount: number;
  skillCount: number;
  assessmentCount: number;
  resourceCount: number;
  roleDistribution: RoleEntry[];
  userGrowth: GrowthEntry[];
}

// ── Skeleton helpers ───────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
  );
}

function SubSkeleton() {
  return (
    <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await api.get<AdminDashboardData>("/admin/dashboard");
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const totalUsers   = data?.totalUsers   ?? 0;
  const activeUsers  = data?.activeUsers  ?? 0;
  const roadmapCount = data?.roadmapCount ?? 0;
  const assessmentCount = data?.assessmentCount ?? 0;

  const roleDistribution: RoleEntry[] = data?.roleDistribution?.length
    ? data.roleDistribution
    : [];

  const userGrowth: GrowthEntry[] = data?.userGrowth?.length
    ? data.userGrowth
    : [];

  return (
    <div>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System overview and statistics</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <><StatSkeleton /><SubSkeleton /></>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeUsers.toLocaleString()} active in last 7 days
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roadmaps</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <><StatSkeleton /><SubSkeleton /></>
              ) : (
                <>
                  <div className="text-2xl font-bold">{roadmapCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Published learning paths</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <><StatSkeleton /><SubSkeleton /></>
              ) : (
                <>
                  <div className="text-2xl font-bold">{assessmentCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total sessions completed</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <><StatSkeleton /><SubSkeleton /></>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(data?.activeCurrentUserCount ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Current live users</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* User Growth bar chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New registrations over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
              ) : userGrowth.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  No growth data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Role Distribution pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>User distribution by role</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
              ) : roleDistribution.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  No role data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <StatSkeleton />
              ) : (
                <div className="text-2xl font-bold">
                  {(data?.resourceCount ?? 0).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Learning resources available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <StatSkeleton />
              ) : (
                <div className="text-2xl font-bold">
                  {(data?.skillCount ?? 0).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Skills tracked in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <StatSkeleton />
              ) : (
                <div className="text-2xl font-bold">
                  {(data?.adminUserCount ?? 0).toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Users with admin privileges</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
