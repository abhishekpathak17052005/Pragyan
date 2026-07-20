import { useEffect, useState, useMemo } from 'react';
import { Search, Download, Mail, RefreshCw } from 'lucide-react';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  cgpa: string | null;
  xp: number;
  placementStatus: string;
  applicationCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'Placed':  return 'bg-green-100 text-green-800';
    case 'Offered': return 'bg-blue-100 text-blue-800';
    case 'Rejected':return 'bg-red-100 text-red-800';
    case 'Applied': return 'bg-yellow-100 text-yellow-800';
    default:        return 'bg-gray-100 text-gray-800';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlacementStudentsPage() {
  const [students, setStudents]     = useState<Student[]>([]);
  const [total, setTotal]           = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage]             = useState(1);
  const limit = 50;

  async function load(p = 1) {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (searchTerm) params.set('search', searchTerm);
      const result = await api.get<any>(`/placement/students?${params}`);
      const list: Student[] = Array.isArray(result) ? result : result?.data ?? [];
      setStudents(list);
      setTotal(result?.pagination?.total ?? list.length);
      setPage(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  const filtered = useMemo(() =>
    students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || s.placementStatus === statusFilter;
      return matchSearch && matchStatus;
    }),
    [students, searchTerm, statusFilter]
  );

  const placedCount  = students.filter((s) => s.placementStatus === 'Placed').length;
  const notPlaced    = students.length - placedCount;
  const placementRate = students.length > 0 ? ((placedCount / students.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground mt-2">Manage and track student placements</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} <button className="underline ml-2" onClick={() => load(1)}>Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Students</p>
          {isLoading ? <div className="h-9 w-16 bg-muted animate-pulse rounded mt-2" /> : <p className="text-3xl font-bold mt-2">{total}</p>}
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Placed</p>
          {isLoading ? <div className="h-9 w-16 bg-muted animate-pulse rounded mt-2" /> : <p className="text-3xl font-bold mt-2">{placedCount}</p>}
          <p className="text-xs text-green-600 mt-1">{placementRate}% placement rate</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Not Placed</p>
          {isLoading ? <div className="h-9 w-16 bg-muted animate-pulse rounded mt-2" /> : <p className="text-3xl font-bold mt-2">{notPlaced}</p>}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(1)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option>All</option>
          <option>Placed</option>
          <option>Offered</option>
          <option>Applied</option>
          <option>Rejected</option>
          <option>Pending</option>
        </select>
        <button
          onClick={() => load(1)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted text-sm">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Department</th>
              <th className="text-left px-4 py-3 font-semibold">CGPA</th>
              <th className="text-left px-4 py-3 font-semibold">Applications</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{s.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3">{s.department ?? '—'}</td>
                <td className="px-4 py-3">{s.cgpa ?? '—'}</td>
                <td className="px-4 py-3 text-center">{s.applicationCount}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(s.placementStatus)}`}>
                    {s.placementStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`mailto:${s.email}`} className="p-1 hover:bg-muted rounded inline-block" title="Send Email">
                    <Mail className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {students.length === 0 ? 'No students found.' : 'No students match your filter.'}
          </div>
        )}
      </div>
    </div>
  );
}
