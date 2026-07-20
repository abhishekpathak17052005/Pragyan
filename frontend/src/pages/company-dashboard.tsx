import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatEntry {
  name: string;
  value: number;
  color: string;
}

interface JobsEntry {
  month: string;
  posted: number;
  filled: number;
}

interface RecentActivity {
  id: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
}

interface DashboardData {
  activeJobs: number;
  totalApplications: number;
  interviewsScheduled: number;
  hired: number;
  jobsData: JobsEntry[];
  applicationStats: StatEntry[];
  recentActivity: RecentActivity[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');
}

function StatCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading
        ? <div className="h-9 w-16 bg-muted animate-pulse rounded mt-2" />
        : <p className="text-3xl font-bold mt-2">{value}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CompanyDashboard() {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await api.get<DashboardData>('/recruitment/dashboard');
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const stats = data ?? {
    activeJobs: 0, totalApplications: 0, interviewsScheduled: 0, hired: 0,
    jobsData: [], applicationStats: [], recentActivity: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your recruitment process</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Jobs"          value={stats.activeJobs}           isLoading={isLoading} />
        <StatCard label="Total Applications"   value={stats.totalApplications}    isLoading={isLoading} />
        <StatCard label="Interviews Scheduled" value={stats.interviewsScheduled}  isLoading={isLoading} />
        <StatCard label="Candidates Hired"     value={stats.hired}                isLoading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Posted & Filled */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Jobs Posted &amp; Filled</h2>
          {isLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
          ) : stats.jobsData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No job data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.jobsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="posted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="filled" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Application Status */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Application Status</h2>
          {isLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
          ) : stats.applicationStats.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No application data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.applicationStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.applicationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border rounded-lg p-4 bg-card">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : stats.recentActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">New application for {item.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">Status: {statusLabel(item.status)}</p>
                </div>
                <p className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                  {timeAgo(item.appliedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
