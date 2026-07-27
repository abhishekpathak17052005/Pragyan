import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface AutoSaveOptions<T> {
  onSave: (data: T) => Promise<any>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

/**
 * Hook for auto-saving data with debounce and error handling
 * Waits for inactivity before saving, with built-in success/error callbacks
 */
export function useAutoSave<T>(
  onSave: (data: T) => Promise<any>,
  debounceMs = 1000,
  options?: { onSuccess?: () => void; onError?: (error: Error) => void }
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

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
    lastError: mutation.error?.message,
  };
}
