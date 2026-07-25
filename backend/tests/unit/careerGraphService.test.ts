import { prisma } from '@/lib/prisma';
import { careerGraphService } from '@/services/careerGraphService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    careerRole: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    careerSkillWeight: {
      findMany: jest.fn(),
    },
    careerProgressionLadder: {
      findFirst: jest.fn(),
    },
  },
}));

describe('careerGraphService', () => {
  const mockedPrisma = prisma as unknown as {
    careerRole: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    careerSkillWeight: {
      findMany: jest.Mock;
    };
    careerProgressionLadder: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a role by job id', async () => {
    mockedPrisma.careerRole.findUnique.mockResolvedValue({ jobId: 'job-001-django-developer', jobTitle: 'Django Developer' });

    const result = await careerGraphService.getRoleById('job-001-django-developer');

    expect(result?.jobTitle).toBe('Django Developer');
    expect(mockedPrisma.careerRole.findUnique).toHaveBeenCalledWith({ where: { jobId: 'job-001-django-developer' } });
  });

  it('lists roles with filters', async () => {
    mockedPrisma.careerRole.findMany.mockResolvedValue([{ jobTitle: 'Django Developer' }]);

    await careerGraphService.listRoles({ careerCluster: 'Software Engineering', remoteFriendly: true });

    expect(mockedPrisma.careerRole.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ careerCluster: 'Software Engineering', remoteFriendly: true }) }));
  });

  it('returns ranked skill gaps for a target role', async () => {
    mockedPrisma.careerRole.findUnique.mockResolvedValue({
      jobId: 'job-001-django-developer',
      requiredSkills: ['Python', 'Django', 'REST APIs', 'SQL'],
      preferredSkills: ['Docker', 'Redis'],
    });
    mockedPrisma.careerSkillWeight.findMany.mockResolvedValue([
      { skillName: 'Django', weight: 9 },
      { skillName: 'REST APIs', weight: 8 },
      { skillName: 'SQL', weight: 6 },
      { skillName: 'Docker', weight: 5 },
      { skillName: 'Redis', weight: 4 },
    ]);

    const result = await careerGraphService.getSkillGapAnalysis(['Python', 'Git'], 'job-001-django-developer');

    expect(result.map((item) => item.skillName)).toEqual(['Django', 'REST APIs', 'SQL', 'Docker', 'Redis']);
    expect(result[0].weight).toBe(9);
  });

  it('reshapes roadmap topics into milestone form', async () => {
    mockedPrisma.careerRole.findUnique.mockResolvedValue({
      jobTitle: 'Django Developer',
      roadmapTopics: {
        beginner: ['Python basics'],
        intermediate: ['Django REST Framework'],
        advanced: ['Scaling Django apps'],
        capstoneProject: 'SaaS backend',
      },
    });

    const result = await careerGraphService.getRoadmap('job-001-django-developer');

    expect(result.title).toBe('Django Developer');
    expect(result.milestones[0].phase).toBe('beginner');
    expect(result.capstoneProject).toBe('SaaS backend');
  });

  it('returns similar roles for a role', async () => {
    mockedPrisma.careerRole.findUnique.mockResolvedValue({ similarRoles: ['Backend Developer'] });

    const result = await careerGraphService.getSimilarRoles('job-001-django-developer');

    expect(result).toEqual(['Backend Developer']);
  });

  it('returns the progression ladder for a cluster', async () => {
    mockedPrisma.careerProgressionLadder.findFirst.mockResolvedValue({ ladder: ['Student', 'Early Career', 'Leadership'] });

    const result = await careerGraphService.getCareerProgression('Software Engineering');

    expect(result).toEqual(['Student', 'Early Career', 'Leadership']);
  });

  it('returns weekly assessment topics', async () => {
    mockedPrisma.careerRole.findUnique.mockResolvedValue({ weeklyAssessmentTopics: ['Python basics'] });

    const result = await careerGraphService.getWeeklyAssessmentTopics('job-001-django-developer');

    expect(result).toEqual(['Python basics']);
  });
});
