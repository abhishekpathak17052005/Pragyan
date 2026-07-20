import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  packageDistribution?: { range: string; count: number }[];
  hiringFunnel?: { stage: string; count: number }[];
  topRecruiters?: { company: string; placements: number }[];
  topSkills?: { skill: string; count: number; percentage: number }[];
  // enriched version if backend is updated
  summary?: {
    placementRate: number;
    totalStudents: number;
    placedStudents: number;
    totalOffers: number;
    totalCompanies: number;
    totalApplications: number;
  };
  placementTrend?: { month: string; placed: number; total: number }[];
}

const SECTOR_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlacementAnalyticsPage() {
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<AnalyticsData>('/placement/analytics')
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalApps    = data?.hiringFunnel?.[0]?.count ?? 0;
  const totalOffers  = data?.hiringFunnel?.find((f) => f.stage === 'Offer')?.count ?? 0;
  const convRate     = totalApps > 0 ? ((totalOffers / totalApps) * 100).toFixed(1) : '0.0';
  const summary      = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">Comprehensive placement statistics and insights</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: summary?.totalApplications ?? totalApps },
          { label: 'Total Offers',        value: summary?.totalOffers ?? totalOffers },
          { label: 'Conversion Rate',     value: `${summary ? ((summary.placedStudents / Math.max(summary.totalStudents, 1)) * 100).toFixed(1) : convRate}%` },
          { label: 'Companies',           value: summary?.totalCompanies ?? data?.topRecruiters?.length ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading
              ? <Skeleton className="h-9 w-16 mt-2" />
              : <p className="text-3xl font-bold mt-2">{value}</p>}
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Funnel */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Hiring Funnel</h2>
          {isLoading ? <Skeleton className="h-[300px]" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.hiringFunnel ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="stage" width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Package Distribution */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Package Distribution</h2>
          {isLoading ? <Skeleton className="h-[300px]" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.packageDistribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement trend — shown if enriched data available */}
        {(data?.placementTrend && data.placementTrend.length > 0) && (
          <div className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-4">Placement Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.placementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="placed" stroke="#10b981" name="Placed" dot={false} />
                <Line type="monotone" dataKey="total"  stroke="#3b82f6" name="Total"  dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Skills pie */}
        {(data?.topSkills && data.topSkills.length > 0) && (
          <div className="border rounded-lg p-4 bg-card">
            <h2 className="font-semibold mb-4">Top Skills</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.topSkills}
                  dataKey="count"
                  nameKey="skill"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ skill, percentage }) => `${skill} ${percentage}%`}
                  labelLine={false}
                >
                  {data.topSkills.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Recruiters table */}
      {(data?.topRecruiters && data.topRecruiters.length > 0) && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Top Recruiting Companies</h2>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left px-4 py-2">Company</th>
                <th className="text-left px-4 py-2">Placements</th>
                <th className="text-left px-4 py-2">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.topRecruiters.map((r) => {
                const maxPlacements = Math.max(...data.topRecruiters!.map((x) => x.placements));
                const pct = maxPlacements > 0 ? Math.round((r.placements / maxPlacements) * 100) : 0;
                return (
                  <tr key={r.company} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium">{r.company}</td>
                    <td className="px-4 py-2">{r.placements}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
