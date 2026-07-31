// src/services/notification.ts

import { prisma } from '@/lib/prisma';

export interface CreateNotificationInput {
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    // organizationId is required by the schema — use a sentinel value when not applicable
    const orgId = input.organizationId ?? await this._getUserOrgId(input.userId);
    return prisma.notification.create({
      data: {
        userId: input.userId,
        organizationId: orgId,
        type: (input.type as any) ?? 'SYSTEM',
        title: input.title,
        message: input.message,
        channels: [],
        metadata: (input.metadata as any) ?? null,
      },
    });
  },

  /** Convenience: notify a user when admin replies to their feedback */
  async notifyFeedbackReply(userId: string, feedbackTitle: string, feedbackId: string) {
    return this.create({
      userId,
      type: 'FEEDBACK_REPLY',
      title: 'Admin replied to your feedback',
      message: `Your feedback "${feedbackTitle.slice(0, 60)}" received a reply.`,
      metadata: { feedbackId, link: '/settings?tab=feedback' },
    });
  },

  async listForUser(userId: string, limit = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        readAt: true,
        metadata: true,
        createdAt: true,
      },
    });
  },

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  },

  async deleteNotification(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  },

  /** Helper: find the user's organizationId or fall back to the first org. */
  async _getUserOrgId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (user?.organizationId) return user.organizationId;

    // Fallback: pick the first organization in the DB
    const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
    if (firstOrg) return firstOrg.id;

    // Last resort: create a default system org so notifications are never blocked
    const sysOrg = await prisma.organization.create({
      data: { name: '__system__', type: 'COLLEGE' },
      select: { id: true },
    });
    return sysOrg.id;
  },
};
