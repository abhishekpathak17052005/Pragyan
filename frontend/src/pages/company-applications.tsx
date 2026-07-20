import { useEffect, useState, useMemo } from 'react';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  // enriched client-side
  jobTitle?: string;
  candidateName?: string;
  candidateEmail?: string;
}

interface Job {
  id: string;
  title: string;
  companyId: string | null;
}

interface MyCompany {
  id: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'SELECTED':
    case 'ACCEPTED':    return 'bg-green-100 text-green-800';
    case 'SHORTLISTED': return 'bg-blue-100 text-blue-800';
    case 'REJECTED':    return 'bg-red-100 text-red-800';
    case 'APPLIED':     return 'bg-gray-100 text-gray-800';
    default:            return 'bg-yellow-100 text-yellow-800';
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    APPLIED: 'Applied', SHORTLISTED: 'Shortlisted', SELECTED: 'Selected',
    REJECTED: 'Rejected', ACCEPTED: 'Accepted', DECLINED: 'Declined',
  };
  return map[status] ?? status;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_OPTIONS = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'ACCEPTED'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updating, setUpdating]         = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Get company
      const co = await api.get<MyCompany>('/recruitment/my-company');

      // 2. Get all jobs for this company
      const jobResult = await api.get<any>(`/recruitment/companies/${co.id}/jobs?limit=200`);
      const jobs: Job[] = Array.isArray(jobResult) ? jobResult : jobResult?.data ?? [];

      // 3. Get applications for each job (parallel, capped at 20 jobs)
      const appArrays = await Promise.all(
        jobs.slice(0, 20).map((job) =>
          api.get<any>(`/recruitment/jobs/${job.id}/applications?limit=200`)
            .then((r) => {
              const list: Application[] = Array.isArray(r) ? r : r?.data ?? [];
              return list.map((a) => ({ ...a, jobTitle: job.title }));
            })
            .catch(() => [] as Application[])
        )
      );

      const allApps = appArrays.flat().sort(
        (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );

      setApplications(allApps);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── status update ──
  async function updateStatus(appId: string, newStatus: string) {
    setUpdating(appId);
    try {
      await api.patch(`/recruitment/applications/${appId}/status`, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a)
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  // ── filtered list ──
  const filtered = useMemo(() =>
    applications.filter((a) => {
      const matchSearch =
        (a.jobTitle ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.candidateName ?? a.userId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [applications, searchTerm, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-2">Manage and review candidate applications</p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-muted"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} <button className="underline ml-2" onClick={load}>Retry</button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by position or candidate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="ALL">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Candidate ID</th>
              <th className="text-left px-4 py-3 font-semibold">Position</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Applied Date</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.map((app) => (
              <tr key={app.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium font-mono text-xs text-muted-foreground">
                  {app.userId.slice(-8)}
                </td>
                <td className="px-4 py-3">{app.jobTitle ?? '—'}</td>
                <td className="px-4 py-3">
                  {updating === app.id ? (
                    <span className="text-xs text-muted-foreground">Saving…</span>
                  ) : (
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColor(app.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(app.appliedAt)}</td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-muted rounded" title="View details">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {applications.length === 0 ? 'No applications yet.' : 'No applications match your search.'}
          </div>
        )}
      </div>

      {/* Summary */}
      {!isLoading && applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATUS_OPTIONS.filter((s) => ['APPLIED','SHORTLISTED','SELECTED','REJECTED'].includes(s)).map((s) => {
            const count = applications.filter((a) => a.status === s).length;
            return (
              <div key={s} className="border rounded-lg p-3 bg-card">
                <p className="text-xs text-muted-foreground">{statusLabel(s)}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
