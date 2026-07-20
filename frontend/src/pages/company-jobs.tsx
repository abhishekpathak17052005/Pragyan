import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  skills: string[];
  location: string | null;
  status: string;
  companyId: string | null;
  recruiterId: string;
  createdAt: string;
  // application count injected client-side after fetch
  applicationCount?: number;
}

interface MyCompany {
  id: string;
  name: string;
  recruiterId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'OPEN':   return 'bg-green-100 text-green-800';
    case 'CLOSED': return 'bg-gray-100 text-gray-800';
    case 'FILLED': return 'bg-blue-100 text-blue-800';
    default:       return 'bg-yellow-100 text-yellow-800';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CompanyJobsPage() {
  const [company, setCompany]       = useState<MyCompany | null>(null);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [toggling, setToggling]     = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setError(null);
      const co = await api.get<MyCompany>('/recruitment/my-company');
      setCompany(co);

      // Paginated response — unwrap data array
      const result = await api.get<{ data: Job[] }>(
        `/recruitment/companies/${co.id}/jobs?limit=200`
      );
      const jobList: Job[] = Array.isArray(result) ? result : (result as any).data ?? [];
      setJobs(jobList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── toggle status OPEN ↔ CLOSED ──
  async function toggleStatus(job: Job) {
    setToggling(job.id);
    const next = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await api.patch(`/recruitment/jobs/${job.id}/publish`, { status: next });
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: next } : j));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setToggling(null);
    }
  }

  // ── delete ──
  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/recruitment/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeleting(null);
    }
  }

  // ── filtered list ──
  const filtered = useMemo(() =>
    jobs.filter((j) => {
      const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [jobs, searchTerm, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs Management</h1>
          <p className="text-muted-foreground mt-2">
            {company ? `${company.name} — ` : ''}Create and manage job postings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
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
            placeholder="Search jobs..."
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
          <option value="OPEN">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Job Title</th>
              <th className="text-left px-4 py-3 font-semibold">Skills</th>
              <th className="text-left px-4 py-3 font-semibold">Posted</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
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
            ) : filtered.map((job) => (
              <tr key={job.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{job.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {job.skills.slice(0, 3).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(job.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(job)}
                    disabled={toggling === job.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${statusColor(job.status)}`}
                    title="Click to toggle status"
                  >
                    {toggling === job.id ? '…' : job.status === 'OPEN' ? 'Active' : job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-muted rounded" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-muted rounded"
                      title="Delete"
                      disabled={deleting === job.id}
                      onClick={() => handleDelete(job.id, job.title)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {jobs.length === 0 ? 'No jobs posted yet.' : 'No jobs match your search.'}
          </div>
        )}
      </div>
    </div>
  );
}
