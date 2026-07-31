import { prisma } from '@/lib/prisma';
import { feedbackService } from '../feedback';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    feedback: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  feedback: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

describe('feedbackService.listAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a null user when the related user record is missing', async () => {
    mockedPrisma.feedback.findMany.mockResolvedValue([
      {
        id: 'feedback-1',
        userId: 'user-1',
        category: 'Bug',
        rating: 5,
        title: 'Issue',
        description: 'Details',
        screenshotUrl: null,
        imageUrl: null,
        priority: 'Medium',
        status: 'Open',
        allowContact: false,
        anonymous: false,
        adminReply: null,
        adminNotes: null,
        relatedAssessmentId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockedPrisma.feedback.count.mockResolvedValue(1);
    mockedPrisma.user.findMany.mockResolvedValue([]);

    const result = await feedbackService.listAll({ page: 1, limit: 20 });

    expect(mockedPrisma.user.findMany).toHaveBeenCalled();
    expect(result.items[0].user).toBeNull();
  });
});
