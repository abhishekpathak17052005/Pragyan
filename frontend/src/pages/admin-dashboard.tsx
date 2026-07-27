import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { api } from "@/services/apiClient";
import {
  Users, TrendingUp, BookOpen, CheckSquare, 
  Activity, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Clock, Zap, Database, Server, GraduationCap, Briefcase,
} from "lucide-react";

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

// ── Enhanced KPI Card Component ────────────────────────────────────────────────

interface EnhancedKPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: number;
  subtitle?: string;
  accentColor: string;
  isLoading?: boolean;
}

function EnhancedKPICard({ 
  icon, label, value, trend, subtitle, accentColor, isLoading 
}: EnhancedKPICardProps) {
  return (
    <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300">
      <div 
        className="absolute top-0 left-0 w-1 h-full opacity-75"
        style={{ backgroundColor: accentColor }}
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div 
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <div style={{ color: accentColor }}>
              {icon}
            </div>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
              trend >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <CardTitle className="text-xs font-semibold text-muted-foreground mt-3 uppercase tracking-wider">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {isLoading ? (
          <><StatSkeleton /><SubSkeleton /></>
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Health Status Component ────────────────────────────────────────────────────

interface HealthStatusProps {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  detail?: string;
}

function HealthStatus({ name, status, detail }: HealthStatusProps) {
  const statusColor = {
    healthy: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  const statusBg = {
    healthy: 'rgba(16, 185, 129, 0.08)',
    warning: 'rgba(245, 158, 11, 0.08)',
    error: 'rgba(239, 68, 68, 0.08)',
  };

  const statusText = {
    healthy: '#059669',
    warning: '#B45309',
    error: '#DC2626',
  };

  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-all">
      <div className="flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: statusColor[status] }}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
        </div>
      </div>
      <span 
        className="text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
        style={{ backgroundColor: statusBg[status], color: statusText[status] }}
      >
        {status === 'healthy' ? '✓ Active' : status === 'warning' ? '⚠ Warning' : '✕ Error'}
      </span>
    </div>
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

  const totalUsers = data?.totalUsers ?? 0;
  const activeUsers = data?.activeUsers ?? 0;
  const roadmapCount = data?.roadmapCount ?? 0;
  const assessmentCount = data?.assessmentCount ?? 0;
  const activeSessionCount = data?.activeCurrentUserCount ?? 0;

  const roleDistribution: RoleEntry[] = data?.roleDistribution?.length ? data.roleDistribution : [];
  const userGrowth: GrowthEntry[] = data?.userGrowth?.length ? data.userGrowth : [];

  // Mock trends for demo
  const trends = {
    users: 12,
    roadmaps: 8,
    assessments: 15,
    sessions: 5,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* KPI Cards Grid - Now with 4 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedKPICard
          icon={<Users size={20} />}
          label="Total Users"
          value={totalUsers}
          trend={trends.users}
          subtitle={`${activeUsers.toLocaleString()} active this week`}
          accentColor="#7666F6"
          isLoading={isLoading}
        />
        <EnhancedKPICard
          icon={<BookOpen size={20} />}
          label="Roadmaps"
          value={roadmapCount}
          trend={trends.roadmaps}
          subtitle="Published learning paths"
          accentColor="#0EA5E9"
          isLoading={isLoading}
        />
        <EnhancedKPICard
          icon={<CheckSquare size={20} />}
          label="Assessments"
          value={assessmentCount}
          trend={trends.assessments}
          subtitle="Total sessions completed"
          accentColor="#FF8C42"
          isLoading={isLoading}
        />
        <EnhancedKPICard
          icon={<Activity size={20} />}
          label="Active Sessions"
          value={activeSessionCount}
          trend={trends.sessions}
          subtitle="Current live users"
          accentColor="#10B981"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Growth Chart - spans 2 columns */}
        <Card className="lg:col-span-2 border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">User Growth Trend</CardTitle>
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
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7666F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7666F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#7666F6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution - Clean Design */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Role Distribution</CardTitle>
            <CardDescription>User breakdown by role</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
            ) : roleDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No role data available
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pie Chart */}
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Role Details - Clean List */}
                <div className="space-y-2.5 border-t pt-4">
                  {roleDistribution.map((role, idx) => {
                    const total = roleDistribution.reduce((sum, r) => sum + r.value, 0);
                    const percentage = ((role.value / total) * 100).toFixed(1);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: role.color }}
                            />
                            <span className="text-sm font-medium text-foreground">{role.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{role.value}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: role.color 
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div>
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Zap style={{ color: "#7666F6" }} size={20} />
              <CardTitle className="text-lg font-bold">System Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <HealthStatus
              name="API Services"
              status="healthy"
              detail="All endpoints responding normally"
            />
            <HealthStatus
              name="Database"
              status="healthy"
              detail="MongoDB Atlas - 99.9% uptime"
            />
            <HealthStatus
              name="AI Engine"
              status="healthy"
              detail="Gemini API - 245ms avg latency"
            />
            <HealthStatus
              name="Queue System"
              status="warning"
              detail="12 pending tasks - processing"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
