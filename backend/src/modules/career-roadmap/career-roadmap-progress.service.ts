import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/utils/errors';
import { xpService } from '@/services/xpService';

interface TopicProgress {
  topicId: string;
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
}

interface DayProgress {
  dayId: string;
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
}

interface WeekProgress {
  weekId: string;
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
}

interface CareerProgress {
  careerId: string;
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
}

export class CareerRoadmapProgressService {
  /**
   * Mark a resource as complete
   * IDEMPOTENT: Safe to call multiple times without duplicate XP awards
   * Emits event for XP service to handle XP awards
   */
  async completeResource(userId: string, resourceId: string) {
    // Get the resource and its hierarchy
    const resource = await prisma.careerRoadmapResource.findUnique({
      where: { id: resourceId },
      include: {
        topic: {
          include: {
            day: {
              include: {
                week: {
                  include: {
                    module: {
                      include: {
                        career: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    // Check if already completed - if so, return early without awarding XP
    const existingProgress = await prisma.userResourceProgress.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    });

    if (existingProgress?.completed) {
      // Already completed - return without awarding XP (idempotent)
      return existingProgress;
    }

    // Mark as completed for the first time
    const resourceProgress = await prisma.userResourceProgress.upsert({
      where: { userId_resourceId: { userId, resourceId } },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        resourceId,
        completed: true,
        completedAt: new Date(),
      },
    });

    // Award XP for resource completion (only on first completion)
    await xpService.awardXp({
      userId,
      eventType: 'RESOURCE',
      resourceId,
      topicId: resource.topicId,
    });

    // Check if topic is now complete and award XP
    const topicProgress = await this.getTopicProgress(userId, resource.topicId);
    if (topicProgress.isComplete) {
      await xpService.awardXp({
        userId,
        eventType: 'TOPIC',
        topicId: resource.topicId,
        dayId: resource.topic.dayId,
      });

      // Check if day is now complete and award XP
      const dayProgress = await this.getDayProgress(userId, resource.topic.dayId);
      if (dayProgress.isComplete) {
        await xpService.awardXp({
          userId,
          eventType: 'DAY',
          dayId: resource.topic.dayId,
          weekId: resource.topic.day.weekId,
        });

        // Check if week is now complete and award XP
        const weekProgress = await this.getWeekProgress(userId, resource.topic.day.weekId);
        if (weekProgress.isComplete) {
          await xpService.awardXp({
            userId,
            eventType: 'WEEK',
            weekId: resource.topic.day.weekId,
            moduleId: resource.topic.day.week.moduleId,
          });

          // Check if module is now complete and award XP
          const moduleProgress = await this.getModuleProgress(userId, resource.topic.day.week.moduleId);
          if (moduleProgress.isComplete) {
            await xpService.awardXp({
              userId,
              eventType: 'MODULE',
              moduleId: resource.topic.day.week.moduleId,
              careerRoadmapId: resource.topic.day.week.module.careerId,
            });

            // Check if career is now complete and award XP
            const careerProgress = await this.getCareerProgress(userId, resource.topic.day.week.module.careerId);
            if (careerProgress.isComplete) {
              // Award final XP for completing entire career (can be larger bonus)
              await xpService.awardXp({
                userId,
                eventType: 'MODULE', // Use MODULE as placeholder for career completion
                careerRoadmapId: resource.topic.day.week.module.careerId,
              });
            }
          }
        }
      }
    }

    return resourceProgress;
  }

  /**
   * Calculate progress for a single topic (% of resources completed)
   * O(1) lookup: no tree traversal
   */
  async getTopicProgress(userId: string, topicId: string): Promise<TopicProgress> {
    const allResources = await prisma.careerRoadmapResource.findMany({
      where: { topicId },
      select: { id: true },
    });

    const completedResources = await prisma.userResourceProgress.count({
      where: {
        userId,
        resourceId: { in: allResources.map((r) => r.id) },
        completed: true,
      },
    });

    const total = allResources.length;
    const completed = completedResources;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    return {
      topicId,
      completed,
      total,
      percent,
      isComplete,
    };
  }

  /**
   * Calculate progress for a single day (% of topics completed)
   * Only loads topics and their resources for this day
   */
  async getDayProgress(userId: string, dayId: string): Promise<DayProgress> {
    const day = await prisma.careerRoadmapDay.findUnique({
      where: { id: dayId },
      select: { id: true, topics: { select: { id: true } } },
    });

    if (!day) {
      throw new NotFoundError('Day not found');
    }

    const allTopics = day.topics;
    let completedTopics = 0;

    // Calculate each topic's progress
    for (const topic of allTopics) {
      const topicProgress = await this.getTopicProgress(userId, topic.id);
      if (topicProgress.isComplete) {
        completedTopics += 1;
      }
    }

    const total = allTopics.length;
    const completed = completedTopics;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    return {
      dayId,
      completed,
      total,
      percent,
      isComplete,
    };
  }

  /**
   * Calculate progress for a single week (% of days completed)
   * Only loads days for this week
   */
  async getWeekProgress(userId: string, weekId: string): Promise<WeekProgress> {
    const week = await prisma.careerRoadmapWeek.findUnique({
      where: { id: weekId },
      select: { id: true, days: { select: { id: true } } },
    });

    if (!week) {
      throw new NotFoundError('Week not found');
    }

    const allDays = week.days;
    let completedDays = 0;

    for (const day of allDays) {
      const dayProgress = await this.getDayProgress(userId, day.id);
      if (dayProgress.isComplete) {
        completedDays += 1;
      }
    }

    const total = allDays.length;
    const completed = completedDays;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    return {
      weekId,
      completed,
      total,
      percent,
      isComplete,
    };
  }

  /**
   * Calculate progress for a single module (% of weeks completed)
   */
  async getModuleProgress(userId: string, moduleId: string) {
    const module = await prisma.careerRoadmapModule.findUnique({
      where: { id: moduleId },
      select: { id: true, weeks: { select: { id: true } } },
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    const allWeeks = module.weeks;
    let completedWeeks = 0;

    for (const week of allWeeks) {
      const weekProgress = await this.getWeekProgress(userId, week.id);
      if (weekProgress.isComplete) {
        completedWeeks += 1;
      }
    }

    const total = allWeeks.length;
    const completed = completedWeeks;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    return {
      moduleId,
      completed,
      total,
      percent,
      isComplete,
    };
  }

  /**
   * Calculate progress for entire career (% of modules completed)
   */
  async getCareerProgress(userId: string, careerId: string): Promise<CareerProgress> {
    const career = await prisma.careerRoadmap.findUnique({
      where: { id: careerId },
      select: { id: true, modules: { select: { id: true } } },
    });

    if (!career) {
      throw new NotFoundError('Career not found');
    }

    const allModules = career.modules;
    let completedModules = 0;

    for (const module of allModules) {
      const moduleProgress = await this.getModuleProgress(userId, module.id);
      if (moduleProgress.isComplete) {
        completedModules += 1;
      }
    }

    const total = allModules.length;
    const completed = completedModules;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = total > 0 && completed === total;

    return {
      careerId,
      completed,
      total,
      percent,
      isComplete,
    };
  }

  /**
   * Get full career roadmap with embedded progress for a user
   * Uses fetch+merge strategy: fetch roadmap, fetch progress separately, merge on render
   * This avoids traversing full tree and is O(n) instead of O(tree depth)
   */
  async getCareerRoadmapWithProgress(userId: string, careerId: string) {
    // Fetch roadmap structure
    const career = await prisma.careerRoadmap.findUnique({
      where: { id: careerId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            weeks: {
              orderBy: { order: 'asc' },
              include: {
                days: {
                  orderBy: { order: 'asc' },
                  include: {
                    topics: {
                      orderBy: { order: 'asc' },
                      include: {
                        resources: {
                          orderBy: { displayOrder: 'asc' },
                          select: {
                            id: true,
                            title: true,
                            url: true,
                            provider: true,
                            type: true,
                            difficulty: true,
                            language: true,
                            verified: true,
                            displayOrder: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!career) {
      throw new NotFoundError('Career not found');
    }

    // Fetch all user progress at once (single query)
    const userResourceProgress = await prisma.userResourceProgress.findMany({
      where: { userId },
      select: { resourceId: true, completed: true, completedAt: true },
    });

    // Build lookup map for O(1) access
    const resourceProgressMap = new Map(
      userResourceProgress.map((rp) => [rp.resourceId, rp])
    );

    // Merge progress into roadmap structure
    return {
      ...career,
      modules: career.modules.map((module) => ({
        ...module,
        weeks: module.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            topics: day.topics.map((topic) => ({
              ...topic,
              resources: topic.resources.map((resource) => ({
                ...resource,
                completed: resourceProgressMap.get(resource.id)?.completed ?? false,
                completedAt: resourceProgressMap.get(resource.id)?.completedAt ?? null,
              })),
            })),
          })),
        })),
      })),
    };
  }

  /**
   * Get user's overall progress summary
   * Uses only UserResourceProgress - single source of truth
   */
  async getUserProgressSummary(userId: string) {
    // Get completed resources for this user
    const completedResources = await prisma.userResourceProgress.findMany({
      where: { userId, completed: true },
      select: { completedAt: true },
    });

    const totalResources = await prisma.careerRoadmapResource.count();

    // Calculate streak from completedAt dates
    let streak = 0;
    if (completedResources.length > 0) {
      const sortedDates = completedResources
        .map((r) => r.completedAt?.toLocaleDateString() || '')
        .filter(Boolean)
        .sort();

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let currentDate = new Date(today);
      currentDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toLocaleDateString();
        if (sortedDates.includes(dateStr)) {
          streak += 1;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (i === 0) {
          // If today has no completion, check yesterday
          currentDate.setDate(currentDate.getDate() - 1);
          const yesterdayStr = currentDate.toLocaleDateString();
          if (sortedDates.includes(yesterdayStr)) {
            streak = 1;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }

    return {
      completedResources: completedResources.length,
      totalResources,
      resourcePercent:
        totalResources > 0 ? Math.round((completedResources.length / totalResources) * 100) : 0,
      streak,
    };
  }
}

export const careerRoadmapProgressService = new CareerRoadmapProgressService();
