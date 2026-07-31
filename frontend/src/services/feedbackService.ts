// src/services/feedbackService.ts

import { api } from '@/services/apiClient';
import type {
  Feedback,
  FeedbackSubmitResponse,
  CreateFeedbackPayload,
  AdminFeedbackListResponse,
  AdminFeedbackFilters,
  FeedbackStats,
  FeedbackStatus,
} from '@/types/feedback';

export const feedbackService = {
  // ── User ────────────────────────────────────────────────────────────────────

  submit(payload: CreateFeedbackPayload): Promise<FeedbackSubmitResponse> {
    return api.post<FeedbackSubmitResponse>('/feedback', payload);
  },

  listMine(): Promise<Feedback[]> {
    return api.get<Feedback[]>('/feedback/me');
  },

  getOne(id: string): Promise<Feedback> {
    return api.get<Feedback>(`/feedback/${id}`);
  },

  remove(id: string): Promise<null> {
    return api.delete<null>(`/feedback/${id}`);
  },

  markReplyRead(id: string): Promise<null> {
    return api.post<null>(`/feedback/${id}/read-reply`, {});
  },

  getUnreadReplyCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/feedback/unread-count');
  },

  // ── Admin ───────────────────────────────────────────────────────────────────

  adminListAll(filters: AdminFeedbackFilters = {}): Promise<AdminFeedbackListResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.status)   params.set('status',   filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.rating)   params.set('rating',   String(filters.rating));
    if (filters.search)   params.set('search',   filters.search);
    if (filters.page)     params.set('page',     String(filters.page));
    if (filters.limit)    params.set('limit',    String(filters.limit));

    const qs = params.toString();
    return api.get<AdminFeedbackListResponse>(`/feedback/admin/all${qs ? `?${qs}` : ''}`);
  },

  adminUpdateFeedback(
    id: string,
    updates: {
      status?: FeedbackStatus;
      adminReply?: string | null;
      adminNotes?: string | null;
    },
  ): Promise<Feedback> {
    return api.patch<Feedback>(`/feedback/admin/${id}/status`, updates);
  },

  adminUpdateStatus(id: string, status: FeedbackStatus): Promise<Feedback> {
    return this.adminUpdateFeedback(id, { status });
  },

  adminGetStats(): Promise<FeedbackStats> {
    return api.get<FeedbackStats>('/feedback/admin/stats');
  },
};

export default feedbackService;
