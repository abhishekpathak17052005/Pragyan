import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export interface ExpandState {
  moduleId?: string;
  weekId?: string;
  dayId?: string;
  topicId?: string;
  resourceId?: string;
}

/**
 * Hook to manage expanded state from URL params
 * Allows deep linking to specific resources
 * 
 * Example URL: /roadmap?moduleId=abc&weekId=def&dayId=ghi&topicId=jkl&resourceId=mno
 */
export function useUrlState() {
  const [location] = useLocation();
  const [expandState, setExpandState] = useState<ExpandState>({});

  useEffect(() => {
    // Parse URL search params
    const url = new URL(window.location.href);
    const moduleId = url.searchParams.get('moduleId');
    const weekId = url.searchParams.get('weekId');
    const dayId = url.searchParams.get('dayId');
    const topicId = url.searchParams.get('topicId');
    const resourceId = url.searchParams.get('resourceId');

    setExpandState({
      moduleId: moduleId || undefined,
      weekId: weekId || undefined,
      dayId: dayId || undefined,
      topicId: topicId || undefined,
      resourceId: resourceId || undefined,
    });
  }, [location]);

  return expandState;
}

/**
 * Hook to scroll element into view smoothly
 */
export function useScrollToElement(elementId?: string) {
  useEffect(() => {
    if (!elementId) return;

    // Small delay to allow DOM to settle
    const timeout = setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [elementId]);
}
