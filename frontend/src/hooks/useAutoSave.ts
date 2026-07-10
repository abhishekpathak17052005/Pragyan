import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for auto-saving data with debounce
 * Waits for 1 second of inactivity before saving
 */
export function useAutoSave<T>(
  onSave: (data: T) => Promise<any>,
  debounceMs = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mutation = useMutation({ mutationFn: onSave });

  const autoSave = useCallback(
    (data: T) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        mutation.mutate(data);
      }, debounceMs);
    },
    [mutation, debounceMs]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    autoSave,
    cancel,
    isSaving: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
