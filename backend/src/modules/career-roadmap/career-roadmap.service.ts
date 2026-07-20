import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/utils/errors';
import {
  CreateCareerInput,
  CreateModuleInput,
  CreateDayInput,
  ListResourceInput,
  CreateResourceInput,
  GenerateCareerRoadmapInput,
  CreateTopicInput,
  CreateWeekInput,
  ReorderItemsInput,
  ReorderResourcesInput,
  SearchTopicsInput,
  UpdateCareerInput,
  UpdateDayInput,
  UpdateModuleInput,
  UpdateResourceInput,
  UpdateTopicInput,
  UpdateWeekInput,
} from './career-roadmap.validators';
import { getIconForCareer } from './icon-mapping';
import { ResourceType } from '@prisma/client';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeOptionalUrl(value?: string | null | unknown) {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeResourceType(input?: string | null): ResourceType {
  const normalized = String(input || '').trim().toUpperCase();
  if (!normalized) return ResourceType.DOCUMENTATION;
  if (normalized === 'MINI_PROJECT' || normalized === 'ASSIGNMENT' || normalized === 'INTERVIEW_QUESTION') {
    return ResourceType.PROJECT;
  }
  if (normalized === 'NOTES' || normalized === 'REFERENCE') return ResourceType.ARTICLE;
  if (normalized === 'CERTIFICATION') return ResourceType.COURSE;
  if (normalized in ResourceType) return ResourceType[normalized as keyof typeof ResourceType];
  return ResourceType.OTHER;
}

type GeneratedResource = {
  type: ResourceType;
  title: string;
  provider: string;
  url: string;
};

type GeneratedTopic = {
  title: string;
  objective: string;
  resources: GeneratedResource[];
};

type GeneratedDay = {
  title: string;
  description: string;
  topics: GeneratedTopic[];
};

type GeneratedWeek = {
  title: string;
  description: string;
  days: GeneratedDay[];
};

type GeneratedModule = {
  title: string;
  description: string;
  weeks: GeneratedWeek[];
};

const ROLE_SKILLS: Record<string, string[]> = {
  frontend: ['HTML semantics', 'CSS layouts', 'JavaScript fundamentals', 'TypeScript basics', 'React components', 'API integration'],
  backend: ['Programming fundamentals', 'Node.js basics', 'REST APIs', 'Databases', 'Authentication', 'Testing'],
  fullstack: ['Frontend foundations', 'Backend APIs', 'Databases', 'Authentication', 'Deployment', 'System design'],
  data: ['Python basics', 'SQL fundamentals', 'Statistics', 'Pandas', 'Visualization', 'Machine learning'],
  ai: ['Python basics', 'Data preparation', 'Machine learning', 'LLM workflows', 'Model evaluation', 'Deployment'],
  cyber: ['Networking basics', 'Linux commands', 'Web security', 'OWASP risks', 'Threat modeling', 'Incident response'],
  default: ['Programming fundamentals', 'Problem solving', 'Web foundations', 'APIs', 'Databases', 'Portfolio projects'],
};

function resolveSkillTrack(careerGoal: string) {
  const normalized = careerGoal.toLowerCase();
  if (/(front|ui|react|web)/.test(normalized)) return ROLE_SKILLS.frontend;
  if (/(back|api|server|node)/.test(normalized)) return ROLE_SKILLS.backend;
  if (/(full.?stack|software|developer|programmer)/.test(normalized)) return ROLE_SKILLS.fullstack;
  if (/(data|analyst|analytics)/.test(normalized)) return ROLE_SKILLS.data;
  if (/(ai|ml|machine learning|artificial intelligence)/.test(normalized)) return ROLE_SKILLS.ai;
  if (/(cyber|security|ethical hacking|soc)/.test(normalized)) return ROLE_SKILLS.cyber;
  return ROLE_SKILLS.default;
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function searchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function docsUrl(topic: string) {
  const normalized = topic.toLowerCase();
  if (normalized.includes('python')) return 'https://www.w3schools.com/python/';
  if (normalized.includes('sql') || normalized.includes('database')) return 'https://www.w3schools.com/sql/';
  if (normalized.includes('react')) return 'https://react.dev/learn';
  if (normalized.includes('javascript')) return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide';
  if (normalized.includes('typescript')) return 'https://www.typescriptlang.org/docs/';
  if (normalized.includes('css')) return 'https://developer.mozilla.org/en-US/docs/Learn/CSS';
  if (normalized.includes('html')) return 'https://developer.mozilla.org/en-US/docs/Learn/HTML';
  if (normalized.includes('node') || normalized.includes('api')) return 'https://nodejs.org/en/learn';
  if (normalized.includes('security') || normalized.includes('owasp')) return 'https://owasp.org/www-project-top-ten/';
  return 'https://roadmap.sh/';
}

function buildGeneratedModules(careerGoal: string, skillLevel = 'beginner'): GeneratedModule[] {
  const skills = resolveSkillTrack(careerGoal);
  const level = titleCase(skillLevel);
  const moduleNames = ['Foundations', 'Applied Practice', 'Project Sprint'];

  return moduleNames.map((moduleName, moduleIndex) => {
    const moduleSkills = skills.slice(moduleIndex * 2, moduleIndex * 2 + 2);
    const fallbackSkill = skills[moduleIndex] || skills[0];

    return {
      title: `${moduleName} for ${titleCase(careerGoal)}`,
      description: `${level} learning block focused on ${moduleSkills.join(' and ') || fallbackSkill}.`,
      weeks: [0, 1].map((weekOffset) => {
        const weekSkill = moduleSkills[weekOffset] || fallbackSkill;
        return {
          title: `Week ${moduleIndex * 2 + weekOffset + 1}: ${titleCase(weekSkill)}`,
          description: `Build confidence in ${weekSkill} with guided learning and practice.`,
          days: [0, 1, 2].map((dayOffset) => {
            const dayNumber = dayOffset + 1;
            const topicTitle = dayOffset === 2 ? `${weekSkill} mini project` : `${weekSkill} ${dayOffset === 0 ? 'concepts' : 'practice'}`;
            return {
              title: `Day ${dayNumber}: ${titleCase(topicTitle)}`,
              description: `Study, practice, and capture notes for ${topicTitle}.`,
              topics: [
                {
                  title: titleCase(topicTitle),
                  objective: `Understand ${topicTitle} and complete one practical exercise.`,
                  resources: [
                    {
                      type: ResourceType.DOCUMENTATION,
                      title: `${titleCase(weekSkill)} reference`,
                      provider: 'Official docs',
                      url: docsUrl(weekSkill),
                    },
                    {
                      type: ResourceType.VIDEO,
                      title: `${titleCase(weekSkill)} tutorial`,
                      provider: 'YouTube',
                      url: searchUrl(`${careerGoal} ${weekSkill} ${skillLevel} tutorial`),
                    },
                    {
                      type: dayOffset === 2 ? ResourceType.PROJECT : ResourceType.PRACTICE,
                      title: dayOffset === 2 ? `Build a ${titleCase(weekSkill)} mini project` : `Practice ${titleCase(weekSkill)}`,
                      provider: dayOffset === 2 ? 'GitHub' : 'W3Schools',
                      url: dayOffset === 2
                        ? `https://github.com/search?q=${encodeURIComponent(`${careerGoal} ${weekSkill} project`)}&type=repositories`
                        : 'https://www.w3schools.com/tryit/',
                    },
                  ],
                },
              ],
            };
          }),
        };
      }),
    };
  });
}

function getCareerTitle(input: CreateCareerInput) {
  return (input.title || input.name || '').trim();
}

function mapCareerSummary(career: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  modules?: Array<{ weeks?: unknown[] }>;
}) {
  const totalWeeks = career.modules?.reduce((sum, module) => sum + (module.weeks?.length || 0), 0) || 0;

  return {
    id: career.id,
    title: career.title,
    name: career.title,
    slug: career.slug,
    description: career.description || '',
    thumbnail: career.thumbnail,
    totalWeeks,
    approved: career.status === 'published',
    status: career.status,
    createdAt: career.createdAt,
    updatedAt: career.updatedAt,
  };
}

function mapCareerTree<T extends { modules: Array<{ weeks: unknown[] }> }>(
  career: T & Parameters<typeof mapCareerSummary>[0]
) {
  return {
    ...career,
    ...mapCareerSummary(career),
    weeks: career.modules.flatMap((module) => module.weeks),
  };
}

function hasRenderableCareerTree(career: { modules?: Array<{ weeks?: Array<{ days?: Array<{ topics?: Array<{ resources?: unknown[] }> }> }> }> }) {
  return Boolean(
    career.modules?.some((module) =>
      module.weeks?.some((week) =>
        week.days?.some((day) =>
          day.topics?.some((topic) => (topic.resources?.length || 0) > 0)
        )
      )
    )
  );
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
  private careerTreeInclude() {
    return {
      modules: {
        orderBy: { order: 'asc' as const },
        include: {
          weeks: {
            orderBy: { order: 'asc' as const },
            include: {
              days: {
                orderBy: { order: 'asc' as const },
                include: {
                  topics: {
                    orderBy: { order: 'asc' as const },
                    include: {
                      resources: {
                        orderBy: { displayOrder: 'asc' as const },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  async listCareers(userId?: string) {
    // First, get user's career role if userId is provided
    let userCareerTitle: string | null = null;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { experience: true },
      });
      
      // Use ONLY the experience field (user's selected career role), not experienceType
      userCareerTitle = user?.experience || null;
    }

    const whereClause: any = { status: 'published' };
    
    // If user has a career role, filter to roadmaps that match that role
    if (userCareerTitle && userCareerTitle.trim() !== '') {
      whereClause.AND = [
        {
          title: { contains: userCareerTitle, mode: 'insensitive' },
        },
      ];
    }

    const careers = await prisma.careerRoadmap.findMany({
      where: whereClause,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        modules: {
          select: {
            weeks: {
              select: { id: true },
            },
          },
        },
      },
    });

    return careers.map(mapCareerSummary);
  }

  async listAdminCareers() {
    const careers = await prisma.careerRoadmap.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: this.careerTreeInclude(),
    });

    return careers.map(mapCareerTree);
  }

  async generateCareerRoadmap(input: GenerateCareerRoadmapInput) {
    const title = `${titleCase(input.careerGoal)} Roadmap`;
    const slug = slugify(input.careerGoal);
    const existing = await prisma.careerRoadmap.findUnique({
      where: { slug },
      include: this.careerTreeInclude(),
    });

    if (existing && hasRenderableCareerTree(existing)) {
      return mapCareerTree(existing);
    }

    if (existing) {
      await prisma.careerRoadmap.delete({ where: { id: existing.id } });
    }

    const modules = buildGeneratedModules(input.careerGoal, input.skillLevel);
    const data = {
      title,
      slug,
      description: `A practical ${input.skillLevel || 'beginner'} learning path for ${titleCase(input.careerGoal)} with weekly structure, daily topics, and curated resources.`,
      status: 'published',
      modules: {
        create: modules.map((module, moduleIndex) => ({
          title: module.title,
          description: module.description,
          order: moduleIndex,
          weeks: {
            create: module.weeks.map((week, weekIndex) => ({
              title: week.title,
              description: week.description,
              order: weekIndex,
              days: {
                create: week.days.map((day, dayIndex) => ({
                  title: day.title,
                  description: day.description,
                  estimatedHours: 2,
                  order: dayIndex,
                  dayNumber: dayIndex + 1,
                  topics: {
                    create: day.topics.map((topic, topicIndex) => ({
                      title: topic.title,
                      objective: topic.objective,
                      description: topic.objective,
                      order: topicIndex,
                      resources: {
                        create: topic.resources.map((resource, resourceIndex) => ({
                          title: resource.title,
                          provider: resource.provider,
                          url: resource.url,
                          type: resource.type,
                          free: true,
                          verified: resource.type === ResourceType.DOCUMENTATION,
                          displayOrder: resourceIndex,
                          difficulty: input.skillLevel || 'beginner',
                        })),
                      },
                    })),
                  },
                })),
              },
            })),
          },
        })),
      },
    };

    const career = await prisma.careerRoadmap.create({
      data: data as any,
      include: this.careerTreeInclude(),
    });

    return mapCareerTree(career);
  }

  async getCareerBySlug(slug: string) {
    const career = await prisma.careerRoadmap.findFirst({
      where: { slug, status: 'published' },
      orderBy: [{ updatedAt: 'desc' }],
      include: this.careerTreeInclude(),
    });

    if (!career) {
      throw new NotFoundError('Career roadmap not found');
    }

    return mapCareerTree(career);
  }

  async getTopicById(id: string) {
    const topic = await prisma.careerRoadmapTopic.findUnique({
      where: { id },
      include: {
        resources: {
          orderBy: { displayOrder: 'asc' },
        },
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
    });

    if (!topic) {
      throw new NotFoundError('Topic not found');
    }

    return topic;
  }

  async getLatestApprovedCareerBySlug(slug: string) {
    return this.getCareerBySlug(slug);
  }

  async createCareer(input: CreateCareerInput) {
    const title = getCareerTitle(input);
    const slug = await makeUniqueSlug(input.slug || title);
    
    // Auto-assign icon if not provided
    const icon = input.icon || getIconForCareer(title);

    return prisma.careerRoadmap.create({
      data: {
        title,
        slug,
        description: input.description,
        thumbnail: normalizeOptionalUrl(input.thumbnail),
        icon,
        status: input.status || 'published',
      } as any,
    });
  }

  async updateCareer(id: string, input: UpdateCareerInput) {
    const title = input.title || input.name;
    const nextSlug = input.slug ? await makeUniqueSlug(input.slug) : undefined;

    return prisma.careerRoadmap.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.thumbnail !== undefined ? { thumbnail: normalizeOptionalUrl(input.thumbnail) } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      } as any,
    });
  }

  async deleteCareer(id: string) {
    await prisma.careerRoadmap.delete({ where: { id } });
    return { id };
  }

  async publishCareer(id: string, published: boolean) {
    return prisma.careerRoadmap.update({
      where: { id },
      data: { status: published ? 'published' : 'draft' },
    });
  }

  async createModule(input: CreateModuleInput) {
    // Get the highest order for this career
    const lastModule = await prisma.careerRoadmapModule.findFirst({
      where: { careerId: input.careerId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastModule?.order ?? -1) + 1;

    return prisma.careerRoadmapModule.create({
      data: {
        careerId: input.careerId,
        title: input.title,
        description: input.description,
        order: nextOrder,
      },
    });
  }

  async updateModule(id: string, input: UpdateModuleInput) {
    return prisma.careerRoadmapModule.update({
      where: { id },
      data: input,
    });
  }

  async deleteModule(id: string) {
    await prisma.careerRoadmapModule.delete({ where: { id } });
    return { id };
  }

  async createWeek(input: CreateWeekInput) {
    const moduleId = input.moduleId || input.careerId;
    if (!moduleId) {
      throw new NotFoundError('Module not found');
    }

    // Get the highest order for this module
    const lastWeek = await prisma.careerRoadmapWeek.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastWeek?.order ?? 0) + 1;

    return prisma.careerRoadmapWeek.create({
      data: {
        moduleId,
        order: nextOrder,
        title: input.title,
        description: input.description,
      },
    });
  }

  async updateWeek(id: string, input: UpdateWeekInput) {
    const { weekNumber, ...rest } = input;
    return prisma.careerRoadmapWeek.update({
      where: { id },
      data: {
        ...rest,
        ...(weekNumber !== undefined ? { order: weekNumber } : {}),
      },
    });
  }

  async deleteWeek(id: string) {
    await prisma.careerRoadmapWeek.delete({ where: { id } });
    return { id };
  }

  async createDay(input: CreateDayInput) {
    // Get the highest order for this week
    const lastDay = await prisma.careerRoadmapDay.findFirst({
      where: { weekId: input.weekId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastDay?.order ?? 0) + 1;

    return prisma.careerRoadmapDay.create({
      data: {
        weekId: input.weekId,
        order: nextOrder,
        dayNumber: nextOrder,
        title: input.title,
        description: input.description,
        estimatedHours: input.estimatedHours || 0,
      },
    });
  }

  async updateDay(id: string, input: UpdateDayInput) {
    const { dayNumber, ...rest } = input;
    return prisma.careerRoadmapDay.update({
      where: { id },
      data: {
        ...rest,
        ...(dayNumber !== undefined ? { order: dayNumber, dayNumber } : {}),
      },
    });
  }

  async deleteDay(id: string) {
    await prisma.careerRoadmapDay.delete({ where: { id } });
    return { id };
  }

  async createTopic(input: CreateTopicInput) {
    // Get the highest order for this day
    const lastTopic = await prisma.careerRoadmapTopic.findFirst({
      where: { dayId: input.dayId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastTopic?.order ?? -1) + 1;

    return prisma.careerRoadmapTopic.create({
      data: {
        dayId: input.dayId,
        title: input.title,
        description: input.description,
        objective: input.objective,
        order: nextOrder,
      },
    });
  }

  async updateTopic(id: string, input: UpdateTopicInput) {
    return prisma.careerRoadmapTopic.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.objective !== undefined ? { objective: input.objective } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });
  }

  async deleteTopic(id: string) {
    await prisma.careerRoadmapTopic.delete({ where: { id } });
    return { id };
  }

  async reorderModules(input: ReorderItemsInput) {
    await this.reorderModel(input.orderedIds, (id, order) => prisma.careerRoadmapModule.update({ where: { id }, data: { order } }));
    return { orderedIds: input.orderedIds };
  }

  async reorderWeeks(input: ReorderItemsInput) {
    await this.reorderModel(input.orderedIds, (id, order) => prisma.careerRoadmapWeek.update({ where: { id }, data: { order } }));
    return { orderedIds: input.orderedIds };
  }

  async reorderDays(input: ReorderItemsInput) {
    await this.reorderModel(input.orderedIds, (id, order) => prisma.careerRoadmapDay.update({ where: { id }, data: { order } }));
    return { orderedIds: input.orderedIds };
  }

  async reorderTopics(input: ReorderItemsInput) {
    await this.reorderModel(input.orderedIds, (id, order) => prisma.careerRoadmapTopic.update({ where: { id }, data: { order } }));
    return { orderedIds: input.orderedIds };
  }

  private async reorderModel<T>(orderedIds: string[], update: (id: string, order: number) => T) {
    await prisma.$transaction(orderedIds.map((id, order) => update(id, order) as any));
  }

  async addResource(input: CreateResourceInput) {
    const isFree = typeof input.isFree === 'boolean' ? input.isFree : input.free ?? true;
    const verified = typeof input.verified === 'boolean' ? input.verified : false;

    // Get the topic to use its title as resource title
    const topic = await prisma.careerRoadmapTopic.findUnique({
      where: { id: input.topicId },
      select: { title: true },
    });

    const resourceTitle = topic?.title || input.title || 'Resource';

    return prisma.careerRoadmapResource.create({
      data: {
        topicId: input.topicId,
        type: normalizeResourceType(input.resourceType || input.type),
        title: resourceTitle,
        provider: input.provider,
        url: input.url,
        free: isFree,
        language: input.language,
        difficulty: input.difficulty,
        verified,
        displayOrder: input.displayOrder ?? input.order ?? 0,
      },
    });
  }

  async updateResource(id: string, input: UpdateResourceInput) {
    const normalizedType = input.type !== undefined || input.resourceType !== undefined
      ? normalizeResourceType(input.resourceType || input.type)
      : undefined;

    return prisma.careerRoadmapResource.update({
      where: { id },
      data: {
        ...(input.topicId !== undefined ? { topicId: input.topicId } : {}),
        ...(normalizedType !== undefined ? { type: normalizedType } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.provider !== undefined ? { provider: input.provider } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.isFree !== undefined ? { free: Boolean(input.isFree) } : {}),
        ...(input.free !== undefined ? { free: input.free } : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
        ...(input.verified !== undefined ? { verified: input.verified } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.order !== undefined ? { displayOrder: input.order } : {}),
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
                  module: {
                    career: {
                      title: { contains: q, mode: 'insensitive' as const },
                    },
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
            orderBy: { displayOrder: 'asc' },
          },
          day: {
            include: {
              week: {
                include: {
                  module: {
                    include: {
                      career: {
                        select: { id: true, title: true, slug: true },
                      },
                    },
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
          data: { displayOrder: index },
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
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async fixResourceTitles() {
    // Get all resources with their topics
    const resources = await prisma.careerRoadmapResource.findMany({
      include: {
        topic: {
          select: { title: true },
        },
      },
    });

    // Update each resource with its topic's title
    const updates = resources.map(resource =>
      prisma.careerRoadmapResource.update({
        where: { id: resource.id },
        data: { title: resource.topic.title },
      })
    );

    await Promise.all(updates);
    return { fixed: resources.length };
  }
}

export const careerRoadmapService = new CareerRoadmapService();
