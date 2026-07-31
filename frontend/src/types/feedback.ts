// src/types/feedback.ts

export const FEEDBACK_CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Assessment Feedback',
  'Career Recommendation Issue',
  'Roadmap Feedback',
  'AI Counselor Feedback',
  'Performance Issue',
  'UI / UX Issue',
  'Other',
] as const;

export const FEEDBACK_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export const FEEDBACK_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];
export type FeedbackStatus   = (typeof FEEDBACK_STATUSES)[number];

// ── Domain model ───────────────────────────────────────────────────────────────

export interface Feedback {
  id:            string;
  userId?:       string;
  category:      FeedbackCategory;
  rating:        number;
  title:         string;
  description:   string;
  priority:      FeedbackPriority;
  status:        FeedbackStatus;
  screenshotUrl: string | null;
  allowContact:  boolean;
  anonymous:     boolean;
  createdAt:     string;
  updatedAt:     string;
  // only present on admin responses
  user?: {
    id:       string;
    email:    string;
    fullName: string;
    avatar:   string | null;
  };
}

// ── API shapes ─────────────────────────────────────────────────────────────────

export interface CreateFeedbackPayload {
  category:      FeedbackCategory;
  rating:        number;
  title:         string;
  description:   string;
  priority:      FeedbackPriority;
  screenshotUrl?: string | null;
  allowContact:  boolean;
  anonymous:     boolean;
}

export interface AdminFeedbackListResponse {
  items: Feedback[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export interface FeedbackStats {
  total:         number;
  open:          number;
  underReview:   number;
  inProgress:    number;
  resolved:      number;
  closed:        number;
  averageRating: number;
  byCategory:    Record<string, number>;
  byPriority:    Record<string, number>;
}

export interface AdminFeedbackFilters {
  category?: string;
  status?:   string;
  priority?: string;
  rating?:   number | '';
  search?:   string;
  page?:     number;
  limit?:    number;
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

export const STATUS_META: Record<FeedbackStatus, { label: string; color: string; bg: string }> = {
  'Open':          { label: 'Open',         color: 'text-blue-700',   bg: 'bg-blue-100'   },
  'Under Review':  { label: 'Under Review', color: 'text-amber-700',  bg: 'bg-amber-100'  },
  'In Progress':   { label: 'In Progress',  color: 'text-purple-700', bg: 'bg-purple-100' },
  'Resolved':      { label: 'Resolved',     color: 'text-green-700',  bg: 'bg-green-100'  },
  'Closed':        { label: 'Closed',       color: 'text-gray-600',   bg: 'bg-gray-100'   },
};

export const PRIORITY_META: Record<FeedbackPriority, { color: string; bg: string }> = {
  Low:    { color: 'text-green-700',  bg: 'bg-green-100'  },
  Medium: { color: 'text-amber-700',  bg: 'bg-amber-100'  },
  High:   { color: 'text-red-700',    bg: 'bg-red-100'    },
};

export const CATEGORY_ICONS: Record<FeedbackCategory, string> = {
  'General Feedback':             '💬',
  'Bug Report':                   '🐛',
  'Feature Request':              '✨',
  'Assessment Feedback':          '📝',
  'Career Recommendation Issue':  '🎯',
  'Roadmap Feedback':             '🗺️',
  'AI Counselor Feedback':        '🤖',
  'Performance Issue':            '⚡',
  'UI / UX Issue':                '🎨',
  'Other':                        '📌',
};
