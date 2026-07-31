// src/pages/admin-feedback.tsx
// Admin: Feedback Management Dashboard

import { useState } from 'react';
import {
  MessageSquare, Star, AlertCircle, CheckCircle2, Clock,
  Filter, Search, BarChart3, TrendingUp, Users, Inbox,
  ChevronDown, RefreshCw, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { useAdminFeedback } from '@/hooks/useFeedback';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  STATUS_META,
  type FeedbackStatus,
  type AdminFeedbackFilters,
} from '@/types/feedback';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${accent}18` }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusSelect({
  currentStatus,
  feedbackId,
  onUpdate,
  isPending,
}: {
  currentStatus: FeedbackStatus;
  feedbackId: string;
  onUpdate: (id: string, status: FeedbackStatus) => void;
  isPending: boolean;
}) {
  const meta = STATUS_META[currentStatus] ?? STATUS_META['Open'];
  return (
    <div className="relative">
      <select
        value={currentStatus}
        disabled={isPending}
        onChange={(e) => onUpdate(feedbackId, e.target.value as FeedbackStatus)}
        className={`appearance-none text-xs font-semibold px-3 py-1.5 rounded-full border-2 pr-7 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:opacity-60
          ${meta.bg} ${meta.color} border-transparent`}
      >
        {FEEDBACK_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70" />
    </div>
  );
}

// ── Bar chart (simple CSS) ─────────────────────────────────────────────────────

function MiniBarChart({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (entries.length === 0) return <p className="text-xs text-muted-foreground">No data yet</p>;
  return (
    <div className="space-y-2">
      {entries.map(([label, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground truncate max-w-[160px]" title={label}>{label}</span>
              <span className="text-xs font-semibold text-muted-foreground ml-2">{count}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Star display ──────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(value)
            ? 'fill-amber-400 text-amber-400'
            : 'fill-transparent text-muted-foreground/30'}`}
          strokeWidth={1.5}
        />
      ))}
      <span className="text-xs font-semibold ml-1.5 text-foreground">{value.toFixed(1)}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const [filters, setFilters] = useState<AdminFeedbackFilters>({
    page: 1, limit: 15,
  });
  const [search, setSearch] = useState('');

  const { list, stats, updateStatus } = useAdminFeedback(filters);

  const feedbackList = (list.data as any)?.items ?? [];
  const pagination   = (list.data as any)?.pagination;
  const statsData    = stats.data;

  const isUpdating   = updateStatus.isPending;
  const updatingId   = (updateStatus.variables as any)?.id as string | undefined;

  const applySearch = () =>
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));

  const clearFilter = (key: keyof AdminFeedbackFilters) =>
    setFilters((f) => { const n = { ...f }; delete n[key]; n.page = 1; return n; });

  const setFilter = (key: keyof AdminFeedbackFilters, val: string | number | undefined) =>
    setFilters((f) => ({ ...f, [key]: val || undefined, page: 1 }));

  const activeFilterCount = [
    filters.category, filters.status, filters.priority,
    filters.rating, filters.search,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Feedback Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review, filter, and resolve user feedback submissions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl flex items-center gap-2"
          onClick={() => { void list.refetch(); void stats.refetch(); }}
        >
          <RefreshCw className={`w-4 h-4 ${list.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── KPI stats ────────────────────────────────────────────────────── */}
      {statsData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Inbox className="w-5 h-5" />}    label="Total"       value={statsData.total}       accent="#6366F1" />
          <StatCard icon={<AlertCircle className="w-5 h-5"/>} label="Open"      value={statsData.open}        accent="#3B82F6" sub="Awaiting review" />
          <StatCard icon={<Clock className="w-5 h-5" />}    label="Under Review" value={statsData.underReview} accent="#F59E0B" />
          <StatCard icon={<TrendingUp className="w-5 h-5"/>} label="In Progress" value={statsData.inProgress}  accent="#8B5CF6" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5"/>} label="Resolved" value={statsData.resolved}    accent="#10B981" />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Avg Rating"
            value={statsData.averageRating.toFixed(1)}
            accent="#F59E0B"
            sub="out of 5.0"
          />
        </div>
      ) : stats.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 h-28 animate-pulse">
              <div className="h-4 w-16 bg-muted rounded mb-3" />
              <div className="h-8 w-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      {statsData && statsData.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* By Category */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">By Category</p>
            </div>
            <MiniBarChart data={statsData.byCategory} total={statsData.total} />
          </div>

          {/* By Priority */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-bold text-foreground">By Priority</p>
            </div>
            <div className="space-y-3">
              {['High', 'Medium', 'Low'].map((p) => {
                const count = statsData.byPriority[p] ?? 0;
                const pct = statsData.total > 0 ? (count / statsData.total) * 100 : 0;
                const color = p === 'High' ? '#EF4444' : p === 'Medium' ? '#F59E0B' : '#10B981';
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color }}>{p}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Satisfaction */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-green-600" />
              <p className="text-sm font-bold text-foreground">User Satisfaction</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
                <StarRating value={statsData.averageRating} />
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Status Breakdown</p>
                {Object.entries(STATUS_META).map(([s, meta]) => {
                  const key = s as FeedbackStatus;
                  const count =
                    key === 'Open'         ? statsData.open        :
                    key === 'Under Review' ? statsData.underReview :
                    key === 'In Progress'  ? statsData.inProgress  :
                    key === 'Resolved'     ? statsData.resolved    :
                    statsData.closed;
                  const pct = statsData.total > 0 ? (count / statsData.total) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 py-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Filters row ──────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="flex-1 min-w-56">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Title or description…"
                className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
              />
            </div>
          </div>

          {/* Category */}
          <div className="w-44">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
            <div className="relative">
              <select
                value={filters.category ?? ''}
                onChange={(e) => setFilter('category', e.target.value)}
                className="w-full appearance-none border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
              >
                <option value="">All categories</option>
                {FEEDBACK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Status */}
          <div className="w-36">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
            <div className="relative">
              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilter('status', e.target.value)}
                className="w-full appearance-none border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
              >
                <option value="">All statuses</option>
                {FEEDBACK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Priority */}
          <div className="w-32">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority</label>
            <div className="relative">
              <select
                value={filters.priority ?? ''}
                onChange={(e) => setFilter('priority', e.target.value)}
                className="w-full appearance-none border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
              >
                <option value="">All</option>
                {FEEDBACK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Rating */}
          <div className="w-28">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Min Rating</label>
            <div className="relative">
              <select
                value={filters.rating ?? ''}
                onChange={(e) => setFilter('rating', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full appearance-none border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{'⭐'.repeat(r)}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl px-4" onClick={applySearch}>
              <Search className="w-4 h-4 mr-1.5" />
              Search
            </Button>
            {activeFilterCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl px-3 text-muted-foreground"
                onClick={() => { setSearch(''); setFilters({ page: 1, limit: 15 }); }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* ── Feedback list ─────────────────────────────────────────────────── */}
      <div>
        {/* List header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">
              {pagination ? `${pagination.total} submission${pagination.total !== 1 ? 's' : ''}` : 'Submissions'}
            </p>
            {activeFilterCount > 0 && (
              <span className="text-xs text-muted-foreground">
                (filtered)
              </span>
            )}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline" className="rounded-lg h-8 px-3 text-xs"
                disabled={!filters.page || filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                ← Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {filters.page ?? 1} / {pagination.totalPages}
              </span>
              <Button
                size="sm" variant="outline" className="rounded-lg h-8 px-3 text-xs"
                disabled={(filters.page ?? 1) >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next →
              </Button>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {list.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
                <div className="h-3 bg-muted rounded w-40" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {list.isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">Failed to load feedback</p>
            <Button size="sm" variant="outline" className="mt-3 rounded-xl" onClick={() => void list.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!list.isLoading && !list.isError && feedbackList.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-bold text-foreground mb-1">No feedback found</p>
            <p className="text-sm text-muted-foreground">
              {activeFilterCount > 0
                ? 'No submissions match the current filters.'
                : 'No feedback has been submitted yet.'}
            </p>
          </div>
        )}

        {/* Cards with inline status selector */}
        {!list.isLoading && feedbackList.length > 0 && (
          <div className="space-y-4">
            {feedbackList.map((fb: any) => (
              <div key={fb.id} className="relative">
                {/* Status selector overlay on top-right of each card */}
                <div className="absolute top-4 right-16 z-10">
                  <StatusSelect
                    currentStatus={fb.status as FeedbackStatus}
                    feedbackId={fb.id}
                    onUpdate={(id, status) => updateStatus.mutate({ id, status })}
                    isPending={isUpdating && updatingId === fb.id}
                  />
                </div>
                <FeedbackCard
                  feedback={fb}
                  showUser={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline" className="rounded-xl px-5"
              disabled={!filters.page || filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              ← Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground px-4">
              Page {filters.page ?? 1} of {pagination.totalPages}
            </span>
            <Button
              variant="outline" className="rounded-xl px-5"
              disabled={(filters.page ?? 1) >= pagination.totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next →
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
