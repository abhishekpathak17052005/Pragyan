// src/components/feedback/FeedbackHistory.tsx

import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { useFeedback } from '@/hooks/useFeedback';

interface FeedbackHistoryProps {
  onNewFeedback: () => void;
}

export function FeedbackHistory({ onNewFeedback }: FeedbackHistoryProps) {
  const { myFeedback, remove, markReplyRead } = useFeedback();

  const isLoading = myFeedback.isLoading;
  const items     = myFeedback.data ?? [];
  const deletingId = remove.variables as string | undefined;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/5" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquarePlus className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No feedback submitted yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Help us improve Pragyan by sharing your thoughts, reporting bugs, or requesting features.
        </p>
        <Button className="rounded-xl" onClick={onNewFeedback}>
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Submit Feedback
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Your Submissions</h3>
          <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" className="rounded-xl text-xs" onClick={onNewFeedback}>
          <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
          New Feedback
        </Button>
      </div>

      {/* Cards */}
      {items.map((fb) => (
        <FeedbackCard
          key={fb.id}
          feedback={fb}
          onDelete={(id) => remove.mutate(id)}
          isDeleting={remove.isPending && deletingId === fb.id}
          onMarkReplyRead={(id) => markReplyRead.mutate(id)}
        />
      ))}

      {/* Fetch error */}
      {myFeedback.isError && (
        <p className="text-sm text-red-600 text-center py-4">
          Failed to load feedback. <button className="underline" onClick={() => myFeedback.refetch()}>Retry</button>
        </p>
      )}
    </div>
  );
}
