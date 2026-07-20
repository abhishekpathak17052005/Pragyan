import { useEffect, useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Application {
  id: string;
  studentName: string;
  studentEmail: string;
  company: string;
  jobTitle: string;
  department: string | null;
  cgpa: string | null;
  appliedDate: string;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'JOINED':
    case 'OFFERED':    return 'bg-green-100 text-green-800';
    case 'SHORTLISTED':return 'bg-blue-100 text-blue-800';
    case 'REJECTED':   return 'bg-red-100 text-red-800';
    case 'APPLIED':    return 'bg-gray-100 text-gray-800';
    default:           return 'bg-yellow-100 text-yellow-800';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'JOINED':
    case 'OFFERED':     return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'REJECTED':    return <XCircle className="w-4 h-4 text-red-600" />;
    case 'SHORTLISTED': return <Clock className="w-4 h-4 text-blue-600" />;
    default:            return <Clock className="w-4 h-4 text-gray-600" />;
  }
}

function statusLabel(s: string) {
  const m: Record<string,string> = { APPLIED:'Applied', SHORTLISTED:'Shortlisted', OFFERED:'Offered', JOINED:'Joined', REJECTED:'Rejected' };
  return m[s] ?? s;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlacementApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal]               = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  async function load() {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.get<any>('/placement/applications?limit=100');
      const list: Application[] = Array.isArray(result) ? result : result?.data ?? [];
      setApplications(list);
      setTotal(result?.pagination?.total ?? list.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    applications.filter((a) => {
      const matchSearch =
        a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [applications, searchTerm, statusFilter]
  );

  const accepted    = applications.filter((a) => ['JOINED','OFFERED'].includes(a.status)).length;
  const inInterview = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const rejected    = applications.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-2">Track student applications and interview progress</p>
        </div>
        <button onClick={load} disabled={isLoading} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-muted text-sm">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} <button className="underline ml-2" onClick={load}>Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: total,       color: '' },
          { label: 'Accepted',           value: accepted,    color: 'text-green-600' },
          { label: 'In Interview',        value: inInterview, color: 'text-blue-600' },
          { label: 'Rejected',            value: rejected,    color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading
              ? <div className="h-9 w-12 bg-muted animate-pulse rounded mt-2" />
              : <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>}
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by student or company..."
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
          <option value="All">All</option>
          <option value="APPLIED">Applied</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="OFFERED">Offered</option>
          <option value="JOINED">Joined</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Student</th>
              <th className="text-left px-4 py-3 font-semibold">Department</th>
              <th className="text-left px-4 py-3 font-semibold">Company</th>
              <th className="text-left px-4 py-3 font-semibold">Position</th>
              <th className="text-left px-4 py-3 font-semibold">CGPA</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Applied</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-20" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map((app) => (
              <tr key={app.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{app.studentName}</td>
                <td className="px-4 py-3 text-muted-foreground">{app.department ?? '—'}</td>
                <td className="px-4 py-3 font-medium">{app.company}</td>
                <td className="px-4 py-3">{app.jobTitle}</td>
                <td className="px-4 py-3">{app.cgpa ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {statusIcon(app.status)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(app.status)}`}>
                      {statusLabel(app.status)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(app.appliedDate)}</td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-muted rounded" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {applications.length === 0 ? 'No applications found.' : 'No applications match your filter.'}
          </div>
        )}
      </div>
    </div>
  );
}
