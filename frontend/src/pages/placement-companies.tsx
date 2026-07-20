import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail, RefreshCw } from 'lucide-react';
import { api } from '@/services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  recruiterName: string;
  designation: string;
  jobsPosted: number;
  hiringDrives: number;
  description: string;
  // mock fields still present from service
  email?: string;
  recruiters?: number;
  jobs?: number;
  status?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlacementCompaniesPage() {
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [total, setTotal]           = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  async function load() {
    try {
      setIsLoading(true);
      setError(null);
      const result = await api.get<any>('/placement/companies?limit=100');
      const list: Company[] = Array.isArray(result) ? result : result?.data ?? [];
      setCompanies(list);
      setTotal(result?.pagination?.total ?? list.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    companies.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.industry ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [companies, searchTerm]
  );

  const totalJobs       = companies.reduce((s, c) => s + (c.jobsPosted ?? c.jobs ?? 0), 0);
  const totalDrives     = companies.reduce((s, c) => s + (c.hiringDrives ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-2">Manage participating companies and recruiters</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={isLoading} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-muted text-sm">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} <button className="underline ml-2" onClick={load}>Retry</button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Companies</p>
          {isLoading ? <div className="h-9 w-12 bg-muted animate-pulse rounded mt-2" /> : <p className="text-3xl font-bold mt-2">{total}</p>}
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Jobs Posted</p>
          {isLoading ? <div className="h-9 w-12 bg-muted animate-pulse rounded mt-2" /> : <p className="text-3xl font-bold mt-2">{totalJobs}</p>}
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Hiring Drives</p>
          {isLoading ? <div className="h-9 w-12 bg-muted animate-pulse rounded mt-2" /> : <p className="text-3xl font-bold mt-2">{totalDrives}</p>}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-card space-y-3">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {companies.length === 0 ? 'No companies registered yet.' : 'No companies match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((company) => (
            <div key={company.id} className="border rounded-lg p-4 bg-card hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <p className="text-sm text-muted-foreground">{company.industry}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-muted rounded"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-muted rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              </div>

              <div className="space-y-1 mb-3 text-sm">
                {company.location && <p className="text-muted-foreground">{company.location}</p>}
                {company.recruiterName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Contact:</span>
                    <span>{company.recruiterName}{company.designation ? ` · ${company.designation}` : ''}</span>
                  </div>
                )}
                {company.description && (
                  <p className="text-muted-foreground text-xs line-clamp-2">{company.description}</p>
                )}
              </div>

              {company.website && (
                <div className="flex gap-2 mb-3">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 hover:bg-muted rounded text-sm text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {company.email ?? company.website}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-2 rounded">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Jobs Posted</p>
                  <p className="font-bold">{company.jobsPosted ?? company.jobs ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Hiring Drives</p>
                  <p className="font-bold">{company.hiringDrives ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
