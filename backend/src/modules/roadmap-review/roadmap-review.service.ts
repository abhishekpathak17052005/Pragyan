import { PrismaClient, type Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';
import type {
  ApproveRoadmapInput,
  UpdateDayInput,
  UpdateModuleInput,
  UpdateTopicInput,
  UpdateWeekInput,
} from './roadmap-review.validators';

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function makeUniqueCareerSlug(base: string) {
  const normalized = slugify(base);
  let candidate = normalized;
  let suffix = 2;

  while (await prisma.careerRoadmap.findUnique({ where: { slug: candidate } })) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function topicHandsOnTask(topic: ApproveRoadmapInput['modules'][number]['weeks'][number]['days'][number]['topics'][number]) {
  return topic.handsOnTask || topic.practicalTask || 'Complete a hands-on practice task for this topic.';
}

function topicMiniExercise(topic: ApproveRoadmapInput['modules'][number]['weeks'][number]['days'][number]['topics'][number]) {
  return topic.miniExercise || `Write a short check-point exercise for ${topic.title}.`;
}

function validateRoadmapQuality(payload: ApproveRoadmapInput) {
  if (!payload.modules.length) throw new AppError(400, 'Roadmap must contain modules.');

  const seenTopics = new Set<string>();
  let previousTopic = 'None';

  payload.modules.forEach((module, moduleIndex) => {
    if (!module.weeks.length) throw new AppError(400, `Module ${moduleIndex + 1} must contain weeks.`);

    module.weeks.forEach((week, weekIndex) => {
      if (!week.days.length) throw new AppError(400, `Module ${moduleIndex + 1}, week ${weekIndex + 1} must contain days.`);

      week.days.forEach((day, dayIndex) => {
        if (!day.topics.length) throw new AppError(400, `Module ${moduleIndex + 1}, week ${weekIndex + 1}, day ${dayIndex + 1} must contain topics.`);

        day.topics.forEach((topic) => {
          const titleKey = topic.title.trim().toLowerCase();
          if (!topic.prerequisite?.trim()) throw new AppError(400, `Topic "${topic.title}" must include a prerequisite.`);
          if (seenTopics.has(titleKey)) throw new AppError(400, `Duplicate topic found: ${topic.title}`);

          const prerequisite = topic.prerequisite.trim().toLowerCase();
          const isFirstTopic = seenTopics.size === 0;
          const prerequisiteIsOrdered =
            isFirstTopic ||
            prerequisite === previousTopic.toLowerCase() ||
            prerequisite === 'none' ||
            Array.from(seenTopics).some((seen) => prerequisite.includes(seen) || seen.includes(prerequisite));

          if (!prerequisiteIsOrdered) {
            throw new AppError(400, `Topic "${topic.title}" has an out-of-order prerequisite: ${topic.prerequisite}`);
          }

          seenTopics.add(titleKey);
          previousTopic = topic.title.trim();
        });
      });
    });
  });
}

export class RoadmapReviewService {
  async approveRoadmap(payload: ApproveRoadmapInput) {
    validateRoadmapQuality(payload);

    const roadmapSlug = await makeUniqueCareerSlug(payload.careerName);
    const totalWeeks = payload.modules.reduce((sum, module) => sum + module.weeks.length, 0);
    const generatedAt = payload.generatedAt ? new Date(payload.generatedAt) : new Date();
    let absoluteWeekNumber = 0;

    return prisma.$transaction(
      async (tx) => {
        const careerRoadmap = await tx.careerRoadmap.create({
          data: {
            name: payload.careerName,
            slug: roadmapSlug,
            description: payload.summary,
            totalWeeks,
            version: payload.version ?? 1,
            generatedBy: payload.generatedBy ?? 'admin',
            generatedAt,
            approved: true,
            status: 'approved',
            templateKey: payload.templateKey,
          },
        });

        for (const module of payload.modules) {
          const createdModule = await tx.careerRoadmapModule.create({
            data: {
              careerId: careerRoadmap.id,
              moduleNumber: module.moduleNumber,
              title: module.title,
              description: module.description,
              moduleAssessment: module.moduleAssessment,
              realWorldProject: module.realWorldProject,
              interviewQuestions: module.interviewQuestions ?? [],
              commonMistakes: module.commonMistakes ?? [],
              industryTips: module.industryTips ?? [],
            },
          });

          for (const week of module.weeks) {
            absoluteWeekNumber += 1;
            await tx.careerRoadmapWeek.create({
              data: {
                careerId: careerRoadmap.id,
                moduleId: createdModule.id,
                weekNumber: absoluteWeekNumber,
                title: week.title,
                description: week.description,
                weeklyRevision: week.weeklyRevision,
                weeklyQuiz: week.weeklyQuiz,
                handsOnAssignment: week.handsOnAssignment,
                miniProject: week.miniProject,
                days: {
                  create: week.days.map((day) => ({
                    dayNumber: day.dayNumber,
                    title: day.title,
                    description: day.description,
                    topics: {
                      create: day.topics.map((topic, topicIndex) => ({
                        title: topic.title,
                        description: topic.description,
                        difficulty: topic.difficulty,
                        estimatedTime: topic.estimatedDuration,
                        order: topicIndex,
                        progress: {
                          learningObjective: topic.learningObjective,
                          prerequisite: topic.prerequisite,
                          handsOnTask: topicHandsOnTask(topic),
                          miniExercise: topicMiniExercise(topic),
                          practicalTask: topicHandsOnTask(topic),
                          resources: [],
                        },
                      })),
                    },
                  })),
                },
              },
            });
          }
        }

        return this.getRoadmapById(careerRoadmap.id, tx);
      },
      {
        timeout: 120_000,
        maxWait: 20_000,
      }
    );
  }

  async getRoadmapById(id: string, client: PrismaClient | Prisma.TransactionClient = prisma) {
    const roadmap = await client.careerRoadmap.findUnique({
      where: { id },
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                topics: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        modules: {
          orderBy: { moduleNumber: 'asc' },
          include: {
            weeks: {
              orderBy: { weekNumber: 'asc' },
              include: {
                days: {
                  orderBy: { dayNumber: 'asc' },
                  include: {
                    topics: {
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!roadmap) {
      throw new AppError(404, 'Roadmap not found');
    }

    return roadmap;
  }

  async updateModule(id: string, input: UpdateModuleInput) {
    return prisma.roadmapCurriculumModule.update({ where: { id }, data: input });
  }

  async updateWeek(id: string, input: UpdateWeekInput) {
    return prisma.roadmapCurriculumWeek.update({ where: { id }, data: input });
  }

  async updateDay(id: string, input: UpdateDayInput) {
    return prisma.roadmapCurriculumDay.update({ where: { id }, data: input });
  }

  async updateTopic(id: string, input: UpdateTopicInput) {
    return prisma.roadmapCurriculumTopic.update({ where: { id }, data: input });
  }
}
