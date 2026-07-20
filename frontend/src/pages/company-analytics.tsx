import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FunnelEntry {
  month: string;
  applications: number;
  interviews: number;
  offers: number;
  hired: number;
}

interface DeptEntry {
  dept: string;
  hired: number;
  openings: number;
}

interface AnalyticsData {
  totalApplications: number;
  conversionRate: number;
  avgTimeToHire: number;
  totalHired: number;
  appChange: number;
  funnelData: FunnelEntry[];
  departmentData: DeptEntry[];
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MetricSkeleton() {
  return (
    <div className="border rounded-lg p-4 bg-card space-y-2">
      <div className="h-3 w-28 bg-muted animate-pulse rounded" />
      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CompanyAnalyticsPage() {
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await api.get<AnalyticsData>('/recruitment/analytics');
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const d = data;
  const appChangePosivite = (d?.appChange ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">Track your recruitment metrics and performance</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Total Applications</p>
              <p className="text-3xl font-bold mt-2">{d?.totalApplications ?? 0}</p>
              <p className={`text-xs mt-1 ${appChangePosivite ? 'text-green-600' : 'text-red-600'}`}>
                {appChangePosivite ? '↑' : '↓'} {Math.abs(d?.appChange ?? 0)}% from last month
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-3xl font-bold mt-2">{d?.conversionRate ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Applications → Hired</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Avg. Time to Hire</p>
              <p className="text-3xl font-bold mt-2">
                {d?.avgTimeToHire ? `${d.avgTimeToHire} days` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Applied → Selected</p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <p className="text-sm text-muted-foreground">Total Hired</p>
              <p className="text-3xl font-bold mt-2">{d?.totalHired ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Selected candidates</p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Recruitment Funnel</h2>
          {isLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
          ) : (d?.funnelData?.length ?? 0) === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No funnel data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={d!.funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="interviews"   stroke="#10b981" dot={false} />
                <Line type="monotone" dataKey="offers"       stroke="#f59e0b" dot={false} />
                <Line type="monotone" dataKey="hired"        stroke="#8b5cf6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hiring by Department/Skill */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Hiring by Skill Area</h2>
          {isLoading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
          ) : (d?.departmentData?.length ?? 0) === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No department data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d!.departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hired"    name="Hired"    fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="openings" name="Openings" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="border rounded-lg p-4 bg-card">
        <h2 className="font-semibold mb-4">Skill Area Summary</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (d?.departmentData?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No data available</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-2">Skill Area</th>
                <th className="text-left px-4 py-2">Hired</th>
                <th className="text-left px-4 py-2">Open Positions</th>
                <th className="text-left px-4 py-2">Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {d!.departmentData.map((row) => {
                const total = row.hired + row.openings;
                const fillRate = total > 0 ? Math.round((row.hired / total) * 100) : 0;
                return (
                  <tr key={row.dept} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium">{row.dept}</td>
                    <td className="px-4 py-2">{row.hired}</td>
                    <td className="px-4 py-2">{row.openings}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${fillRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{fillRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
