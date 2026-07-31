// src/hooks/useNotifications.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';

const KEYS = {
  list:         ['notifications', 'list']   as const,
  unreadCount:  ['notifications', 'unread'] as const,
};

export function useNotifications() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: KEYS.list,
    queryFn:  () => notificationService.list(30),
    staleTime: 30_000,
  });

  const unreadCount = useQuery({
    queryKey: KEYS.unreadCount,
    queryFn:  () => notificationService.getUnreadCount(),
    staleTime: 15_000,
    refetchInterval: 30_000, // poll every 30s for new notifications
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.list });
      void qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.list });
      void qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.list });
      void qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  });

  return {
    notifications: list.data ?? [],
    isLoading: list.isLoading,
    unreadCount: unreadCount.data?.count ?? 0,
    markRead,
    markAllRead,
    remove,
    refetch: () => {
      void qc.invalidateQueries({ queryKey: KEYS.list });
      void qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
  };
}
