import { useEffect, useState } from 'react';
import { Users, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents: number;
  placedStudents: number;
  placementRate: string;
  activeCompanies: number;
  activeJobs: number;
  totalApplications: number;
  totalOffers: number;
}

interface RecentPlacement {
  id: string;
  studentName: string;
  company: string;
  position: string;
}

interface UpcomingDrive {
  id: string;
  title: string;
  companyName: string;
  driveDate: string;
  status: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentPlacements: RecentPlacement[];
  upcomingDrives: UpcomingDrive[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDriveDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className}`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlacementDashboardPage() {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<DashboardData>('/placement/dashboard')
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Placement Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of placement activities and metrics</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              {isLoading ? <Skeleton className="h-9 w-16 mt-2" /> : <p className="text-3xl font-bold mt-2">{stats?.totalStudents ?? 0}</p>}
            </div>
            <Users className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Active students</p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Placed Students</p>
              {isLoading ? <Skeleton className="h-9 w-16 mt-2" /> : <p className="text-3xl font-bold mt-2">{stats?.placedStudents ?? 0}</p>}
            </div>
            <Briefcase className="w-8 h-8 text-green-500 opacity-20" />
          </div>
          {isLoading
            ? <Skeleton className="h-4 w-28 mt-2" />
            : <p className="text-xs text-green-600 mt-2">{stats?.placementRate}% placement rate</p>}
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Companies</p>
              {isLoading ? <Skeleton className="h-9 w-16 mt-2" /> : <p className="text-3xl font-bold mt-2">{stats?.activeCompanies ?? 0}</p>}
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Participating companies</p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Offers</p>
              {isLoading ? <Skeleton className="h-9 w-16 mt-2" /> : <p className="text-3xl font-bold mt-2">{stats?.totalOffers ?? 0}</p>}
            </div>
            <Calendar className="w-8 h-8 text-orange-500 opacity-20" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Job offers received</p>
        </div>
      </div>

      {/* Recent Placements + Upcoming Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Recent Placements</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b">
                  <div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : (data?.recentPlacements?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No placements yet</p>
          ) : (
            <div className="space-y-3">
              {data!.recentPlacements.map((p) => (
                <div key={p.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{p.studentName}</p>
                    <p className="text-sm text-muted-foreground">{p.position} at {p.company}</p>
                  </div>
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded">Placed</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-4">Upcoming Drives</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between pb-3 border-b">
                  <div className="space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (data?.upcomingDrives?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming drives</p>
          ) : (
            <div className="space-y-3">
              {data!.upcomingDrives.map((d) => (
                <div key={d.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-sm text-muted-foreground">{d.companyName} · {formatDriveDate(d.driveDate)}</p>
                  </div>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">{d.status ?? 'Upcoming'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="border rounded-lg p-4 bg-card">
        <h2 className="font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Active Jobs',       value: stats?.activeJobs ?? 0 },
            { label: 'Total Applications',value: stats?.totalApplications ?? 0 },
            { label: 'Offers Extended',   value: stats?.totalOffers ?? 0 },
            { label: 'Placement Rate',    value: `${stats?.placementRate ?? 0}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-muted-foreground text-sm">{label}</p>
              {isLoading
                ? <Skeleton className="h-8 w-16 mx-auto mt-2" />
                : <p className="text-2xl font-bold mt-2">{value}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
