import type { CareerRoadmap } from '@/types/api';

export interface NextResourcePath {
  moduleId: string;
  moduleName: string;
  moduleOrder: number;
  weekId: string;
  weekName: string;
  weekOrder: number;
  dayId: string;
  dayName: string;
  dayOrder: number;
  topicId: string;
  topicName: string;
  topicOrder: number;
  resourceId: string;
  resourceTitle: string;
  resourceUrl?: string;
  isFirstIncomplete: boolean;
}

/**
 * Find the first incomplete resource in a career roadmap hierarchy
 * Returns the path to navigate to it and expand parent sections
 */
export function findNextIncompleteResource(
  career: CareerRoadmap | null | undefined
): NextResourcePath | null {
  if (!career?.modules) return null;

  for (const module of career.modules) {
    if (!module.weeks) continue;

    for (const week of module.weeks) {
      if (!week.days) continue;

      for (const day of week.days) {
        if (!day.topics) continue;

        for (const topic of day.topics) {
          if (!topic.resources) continue;

          // Find first incomplete resource in this topic
          for (let i = 0; i < topic.resources.length; i++) {
            const resource = topic.resources[i];
            const isCompleted = (resource as any).completed;

            if (!isCompleted) {
              return {
                moduleId: module.id,
                moduleName: module.title,
                moduleOrder: module.order,
                weekId: week.id,
                weekName: week.title,
                weekOrder: week.order,
                dayId: day.id,
                dayName: day.title,
                dayOrder: day.order,
                topicId: topic.id,
                topicName: topic.title,
                topicOrder: topic.order,
                resourceId: resource.id,
                resourceTitle: resource.title,
                resourceUrl: resource.url,
                isFirstIncomplete: i === 0,
              };
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get all completed resources count
 */
export function countCompletedResources(career: CareerRoadmap | null | undefined): number {
  if (!career?.modules) return 0;

  let count = 0;
  for (const module of career.modules) {
    module.weeks?.forEach(week => {
      week.days?.forEach(day => {
        day.topics?.forEach(topic => {
          topic.resources?.forEach(resource => {
            if ((resource as any).completed) count++;
          });
        });
      });
    });
  }
  return count;
}

/**
 * Get total resources count
 */
export function countTotalResources(career: CareerRoadmap | null | undefined): number {
  if (!career?.modules) return 0;

  let count = 0;
  for (const module of career.modules) {
    module.weeks?.forEach(week => {
      week.days?.forEach(day => {
        day.topics?.forEach(topic => {
          count += topic.resources?.length ?? 0;
        });
      });
    });
  }
  return count;
}
