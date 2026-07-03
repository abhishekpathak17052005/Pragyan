import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/utils/errors';
import {
  CreateCareerInput,
  CreateDayInput,
  ListResourceInput,
  CreateResourceInput,
  CreateTopicInput,
  CreateWeekInput,
  ReorderResourcesInput,
  SearchTopicsInput,
  UpdateResourceInput,
} from './career-roadmap.validators';
import { Prisma, ResourceType } from '@prisma/client';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeOptionalUrl(value?: string | null | unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeResourceType(input?: string | null): ResourceType {
  const normalized = String(input || '').trim().toUpperCase();
  if (!normalized) return ResourceType.DOCUMENTATION;
  if (normalized === 'MINI_PROJECT' || normalized === 'ASSIGNMENT' || normalized === 'INTERVIEW_QUESTION') {
    return ResourceType.PROJECT;
  }
  if (normalized in ResourceType) {
    return ResourceType[normalized as keyof typeof ResourceType];
  }
  return ResourceType.DOCUMENTATION;
}

function normalizeTags(value?: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 20);
}

async function makeUniqueSlug(baseSlug: string) {
  const normalizedBase = slugify(baseSlug);
  let candidate = normalizedBase;
  let suffix = 2;

  while (await prisma.careerRoadmap.findUnique({ where: { slug: candidate } })) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export class CareerRoadmapService {
  async listCareers() {
    const careers = await prisma.careerRoadmap.findMany({
      where: { approved: true, status: 'approved' },
      orderBy: [{ generatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return careers.map((career) => ({
      id: career.id,
      name: career.name,
      slug: career.slug,
      description: career.description,
      totalWeeks: career.totalWeeks,
      version: career.version,
      generatedBy: career.generatedBy,
      generatedAt: career.generatedAt,
      approved: career.approved,
      status: career.status,
      templateKey: career.templateKey,
      createdAt: career.createdAt,
    }));
  }

  async getCareerBySlug(slug: string) {
    const career = await prisma.careerRoadmap.findFirst({
      where: { slug, approved: true, status: 'approved' },
      orderBy: [{ generatedAt: 'desc' }, { version: 'desc' }],
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                topics: {
                  orderBy: { order: 'asc' },
                  include: {
                    resources: {
                      orderBy: { order: 'asc' },
                    },
                  },
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
                      include: {
                        resources: {
                          orderBy: { order: 'asc' },
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
      throw new NotFoundError('Career roadmap not found');
    }

    return career;
  }

  async getTopicById(id: string) {
    const topic = await prisma.careerRoadmapTopic.findUnique({
      where: { id },
      include: {
        resources: {
          orderBy: { order: 'asc' },
        },
        day: {
          include: {
            week: {
              include: {
                career: true,
              },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError('Topic not found');
    }

    return topic;
  }

  async getLatestApprovedCareerBySlug(slug: string) {
    const career = await prisma.careerRoadmap.findFirst({
      where: { slug, approved: true, status: 'approved' },
      orderBy: [{ generatedAt: 'desc' }, { version: 'desc' }],
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                topics: {
                  orderBy: { order: 'asc' },
                  include: {
                    resources: { orderBy: { order: 'asc' } },
                  },
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
                      include: {
                        resources: { orderBy: { order: 'asc' } },
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
      throw new NotFoundError('Career roadmap not found');
    }

    return career;
  }

  async createCareer(input: CreateCareerInput) {
    const slug = await makeUniqueSlug(input.slug || input.name);

    return prisma.careerRoadmap.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        totalWeeks: input.totalWeeks,
        version: 1,
        generatedBy: 'admin',
        generatedAt: new Date(),
        approved: true,
        status: 'approved',
      },
    });
  }

  async createWeek(input: CreateWeekInput) {
    return prisma.careerRoadmapWeek.create({
      data: {
        careerId: input.careerId,
        weekNumber: input.weekNumber,
        title: input.title,
        description: input.description,
      },
    });
  }

  async createDay(input: CreateDayInput) {
    return prisma.careerRoadmapDay.create({
      data: {
        weekId: input.weekId,
        dayNumber: input.dayNumber,
        title: input.title,
        description: input.description,
      },
    });
  }

  async createTopic(input: CreateTopicInput) {
    return prisma.careerRoadmapTopic.create({
      data: {
        dayId: input.dayId,
        title: input.title,
        description: input.description,
        difficulty: input.difficulty,
        estimatedTime: input.estimatedTime,
        order: input.order,
        quizUrl: normalizeOptionalUrl(input.quizUrl),
        miniProjectUrl: normalizeOptionalUrl(input.miniProjectUrl),
        progress: input.progress as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async addResource(input: CreateResourceInput) {
    const normalizedType = normalizeResourceType((input as any).resourceType || input.type);
    const category = String((input as any).resourceType || normalizedType || 'DOCUMENTATION').toUpperCase();
    const estimatedDuration = (input as any).estimatedDuration || input.duration;
    const isFree = typeof (input as any).isFree === 'boolean' ? (input as any).isFree : input.free ?? true;
    const verified = typeof (input as any).verified === 'boolean' ? (input as any).verified : false;
    const metadata: Record<string, unknown> = {
      ...(input.metadata as Record<string, unknown> | undefined),
      resourceType: category,
      description: (input as any).description,
      estimatedDuration,
      rating: (input as any).rating,
      verified,
      tags: normalizeTags((input as any).tags),
    };

    return prisma.careerRoadmapResource.create({
      data: {
        topicId: input.topicId,
        type: normalizedType,
        title: input.title,
        provider: input.provider,
        url: input.url,
        thumbnail: normalizeOptionalUrl(input.thumbnail),
        duration: estimatedDuration,
        free: isFree,
        language: input.language,
        difficulty: input.difficulty,
        order: input.order ?? 0,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async updateResource(id: string, input: UpdateResourceInput) {
    const normalizedType = input.type !== undefined || (input as any).resourceType !== undefined
      ? normalizeResourceType((input as any).resourceType || input.type)
      : undefined;
    const category = (input as any).resourceType ? String((input as any).resourceType).toUpperCase() : undefined;
    const estimatedDuration = (input as any).estimatedDuration ?? input.duration;
    const verified = (input as any).verified;

    return prisma.careerRoadmapResource.update({
      where: { id },
      data: {
        ...(input.topicId !== undefined ? { topicId: input.topicId } : {}),
        ...(normalizedType !== undefined ? { type: normalizedType } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.provider !== undefined ? { provider: input.provider } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.thumbnail !== undefined ? { thumbnail: normalizeOptionalUrl(input.thumbnail) } : {}),
        ...(estimatedDuration !== undefined ? { duration: estimatedDuration } : {}),
        ...((input as any).isFree !== undefined ? { free: Boolean((input as any).isFree) } : {}),
        ...(input.free !== undefined ? { free: input.free } : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(typeof verified === 'boolean' ? { aiScore: typeof (input as any).rating === 'number' ? (input as any).rating : undefined } : {}),
        ...((input as any).description !== undefined || (input as any).rating !== undefined || (input as any).verified !== undefined || category !== undefined || (input as any).tags !== undefined || input.metadata !== undefined
          ? {
              metadata: {
                ...(input.metadata as Record<string, unknown> | undefined),
                ...(category !== undefined ? { resourceType: category } : {}),
                ...((input as any).description !== undefined ? { description: (input as any).description } : {}),
                ...((input as any).rating !== undefined ? { rating: (input as any).rating } : {}),
                ...((input as any).verified !== undefined ? { verified: (input as any).verified } : {}),
                ...((input as any).tags !== undefined ? { tags: normalizeTags((input as any).tags) } : {}),
                ...(estimatedDuration !== undefined ? { estimatedDuration } : {}),
              } as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async deleteResource(id: string) {
    await prisma.careerRoadmapResource.delete({ where: { id } });
    return { id };
  }

  async searchTopics(input: SearchTopicsInput) {
    const q = input.q?.trim();

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            {
              day: {
                title: { contains: q, mode: 'insensitive' as const },
              },
            },
            {
              day: {
                week: {
                  title: { contains: q, mode: 'insensitive' as const },
                },
              },
            },
            {
              day: {
                week: {
                  career: {
                    name: { contains: q, mode: 'insensitive' as const },
                  },
                },
              },
            },
          ],
        }
      : undefined;

    const [topics, total] = await Promise.all([
      prisma.careerRoadmapTopic.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: [
          { order: 'asc' },
          { updatedAt: 'desc' },
        ],
        include: {
          resources: {
            orderBy: { order: 'asc' },
          },
          day: {
            include: {
              week: {
                include: {
                  career: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.careerRoadmapTopic.count({ where }),
    ]);

    return {
      topics,
      total,
      page: input.page,
      limit: input.limit,
    };
  }

  async reorderResources(input: ReorderResourcesInput) {
    const resources = await prisma.careerRoadmapResource.findMany({
      where: { topicId: input.topicId },
      select: { id: true },
    });

    const existingIds = new Set(resources.map((resource) => resource.id));
    const ids = input.orderedResourceIds.filter((id) => existingIds.has(id));

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.careerRoadmapResource.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return this.listResources({ topicId: input.topicId });
  }

  async listResources(input?: string | ListResourceInput) {
    const topicId = typeof input === 'string' ? input : input?.topicId;
    const type = typeof input === 'string' ? undefined : input?.type;
    const normalizedType = type ? normalizeResourceType(type) : undefined;

    return prisma.careerRoadmapResource.findMany({
      where: {
        ...(topicId ? { topicId } : {}),
        ...(normalizedType ? { type: normalizedType } : {}),
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            estimatedTime: true,
          },
        },
      },
    });
  }
}

export const careerRoadmapService = new CareerRoadmapService();
