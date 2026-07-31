// src/components/feedback/FeedbackCard.tsx

import { useState } from 'react';
import { Star, Trash2, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Feedback } from '@/types/feedback';
import { STATUS_META, PRIORITY_META, CATEGORY_ICONS } from '@/types/feedback';

interface FeedbackCardProps {
  feedback:  Feedback;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  showUser?: boolean;      // admin view: show submitter info
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/30'}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days < 30)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function FeedbackCard({ feedback, onDelete, isDeleting, showUser }: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imgOpen,  setImgOpen]  = useState(false);

  const statusMeta   = STATUS_META[feedback.status]   ?? STATUS_META['Open'];
  const priorityMeta = PRIORITY_META[feedback.priority] ?? PRIORITY_META['Medium'];
  const icon         = CATEGORY_ICONS[feedback.category] ?? '📌';

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Category emoji badge */}
            <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                {feedback.category}
              </p>
              <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                {feedback.title}
              </h3>
            </div>
          </div>

          {/* Status badge */}
          <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
          <StarDisplay rating={feedback.rating} />
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityMeta.bg} ${priorityMeta.color}`}>
            {feedback.priority}
          </span>
          {feedback.anonymous && (
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Anonymous
            </span>
          )}
          {showUser && feedback.user && (
            <span className="text-xs text-muted-foreground">
              by {feedback.anonymous ? 'Anonymous' : feedback.user.fullName || feedback.user.email}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(feedback.createdAt)}</span>
        </div>
      </div>

      {/* ── Expandable body ───────────────────────────────────────────── */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-border space-y-3 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {feedback.description}
          </p>

          {feedback.screenshotUrl && (
            <div>
              <button
                type="button"
                onClick={() => setImgOpen(true)}
                className="inline-flex items-center gap-2 text-xs text-primary font-medium hover:underline"
              >
                <Image className="w-3.5 h-3.5" />
                View screenshot
              </button>
            </div>
          )}

          {feedback.allowContact && (
            <p className="text-xs text-muted-foreground italic">
              ✉️ User has allowed contact regarding this feedback.
            </p>
          )}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="px-5 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Hide details</> : <><ChevronDown className="w-3.5 h-3.5" />View details</>}
        </button>

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(feedback.id)}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        )}
      </div>

      {/* ── Screenshot lightbox ────────────────────────────────────────── */}
      {imgOpen && feedback.screenshotUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setImgOpen(false)}
        >
          <img
            src={feedback.screenshotUrl}
            alt="Feedback screenshot"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
