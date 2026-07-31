// src/hooks/useFeedback.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackService } from '@/services/feedbackService';
import { useToast } from '@/hooks/use-toast';
import type {
  CreateFeedbackPayload,
  AdminFeedbackFilters,
  FeedbackStatus,
} from '@/types/feedback';

const QUERY_KEYS = {
  mine:       ['feedback', 'mine']     as const,
  adminAll:   (f: AdminFeedbackFilters) => ['feedback', 'admin', 'all', f] as const,
  adminStats: ['feedback', 'admin', 'stats'] as const,
};

// ── User hook ──────────────────────────────────────────────────────────────────

export function useFeedback() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const myFeedback = useQuery({
    queryKey: QUERY_KEYS.mine,
    queryFn:  feedbackService.listMine,
    staleTime: 1000 * 60 * 2,
  });

  const submit = useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => feedbackService.submit(payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mine });
      
      // Show success toast with email status
      const emailStatus = response.emailSent
        ? 'A confirmation email has been sent.'
        : 'Confirmation email could not be sent, but your feedback was saved.';
      
      toast({
        title:       '✅ Feedback submitted!',
        description: `Thank you for helping improve Pragyan. ${emailStatus}`,
      });
    },
    onError: (err: Error) => {
      toast({
        title:       'Submission failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant:     'destructive',
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => feedbackService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mine });
      toast({ title: 'Feedback deleted' });
    },
    onError: (err: Error) => {
      toast({
        title:       'Delete failed',
        description: err.message,
        variant:     'destructive',
      });
    },
  });

  const markReplyRead = useMutation({
    mutationFn: (id: string) => feedbackService.markReplyRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mine });
    },
  });

  return { myFeedback, submit, remove, markReplyRead };
}

// ── Admin hook ─────────────────────────────────────────────────────────────────

export function useAdminFeedback(filters: AdminFeedbackFilters = {}) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const list = useQuery({
    queryKey: QUERY_KEYS.adminAll(filters),
    queryFn:  () => feedbackService.adminListAll(filters),
    staleTime: 1000 * 30,
  });

  const stats = useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn:  feedbackService.adminGetStats,
    staleTime: 1000 * 60,
  });

  const updateFeedback = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        status?: FeedbackStatus;
        adminReply?: string | null;
        adminNotes?: string | null;
      };
    }) => feedbackService.adminUpdateFeedback(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feedback', 'admin'] });
      toast({ title: 'Feedback updated' });
    },
    onError: (err: Error) => {
      toast({
        title:       'Update failed',
        description: err.message,
        variant:     'destructive',
      });
    },
  });

  return { list, stats, updateFeedback };
}
