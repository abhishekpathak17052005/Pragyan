// src/services/notificationService.ts

import { api } from '@/services/apiClient';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const notificationService = {
  list(limit = 30): Promise<AppNotification[]> {
    return api.get<AppNotification[]>(`/notifications?limit=${limit}`);
  },
  getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/notifications/unread-count');
  },
  markRead(id: string): Promise<null> {
    return api.post<null>(`/notifications/${id}/read`, {});
  },
  markAllRead(): Promise<null> {
    return api.post<null>('/notifications/mark-all-read', {});
  },
  remove(id: string): Promise<null> {
    return api.delete<null>(`/notifications/${id}`);
  },
};
