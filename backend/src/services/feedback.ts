// src/services/feedback.ts

import { prisma } from '@/lib/prisma';
import type { CreateFeedbackInput } from '@/validators/feedback';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminFeedbackFilters {
  category?: string;
  status?: string;
  priority?: string;
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FeedbackStats {
  total: number;
  open: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
  averageRating: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const feedbackService = {
  // ── User operations ────────────────────────────────────────────────────────

  async createFeedback(userId: string, input: CreateFeedbackInput) {
    return prisma.feedback.create({
      data: {
        userId,
        category: input.category,
        rating: input.rating,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 'Medium',
        screenshotUrl: input.screenshotUrl ?? input.imageUrl ?? null,
        imageUrl: input.imageUrl ?? input.screenshotUrl ?? null,
        allowContact: input.allowContact ?? false,
        anonymous: input.anonymous ?? false,
        status: 'Open',
      },
    });
  },

  async listForUser(userId: string) {
    return prisma.feedback.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        rating: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        screenshotUrl: true,
        imageUrl: true,
        allowContact: true,
        anonymous: true,
        adminReply: true,
        adminNotes: true,
        adminReplyReadAt: true,
        confirmationEmailSent: true,
        confirmationEmailSentAt: true,
        createdAt: true,
        updatedAt: true,
        // Do not expose userId or user object for anonymous submissions on client
      },
    });
  },

  async getById(id: string) {
    return prisma.feedback.findUnique({ where: { id } });
  },

  // ── Admin operations ───────────────────────────────────────────────────────

  async listAll(filters: AdminFeedbackFilters = {}) {
    const {
      category,
      status,
      priority,
      rating,
      search,
      page  = 1,
      limit = 20,
    } = filters;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status)   where.status   = status;
    if (priority) where.priority = priority;
    if (rating)   where.rating   = Number(rating);
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [feedbackItems, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          category: true,
          rating: true,
          title: true,
          description: true,
          screenshotUrl: true,
          imageUrl: true,
          priority: true,
          status: true,
          allowContact: true,
          anonymous: true,
          adminReply: true,
          adminNotes: true,
          relatedAssessmentId: true,
          metadata: true,
          confirmationEmailSent: true,
          confirmationEmailSentAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const userIds = feedbackItems.map((item) => item.userId).filter(Boolean);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, fullName: true, avatar: true },
        })
      : [];

    const userById = new Map(users.map((user) => [user.id, user]));

    const items = feedbackItems.map((item) => ({
      ...item,
      user: userById.get(item.userId) ?? null,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async updateFeedback(id: string, input: { status?: string; adminReply?: string | null; adminNotes?: string | null }) {
    const prev = await prisma.feedback.findUnique({ where: { id }, select: { adminReply: true } });
    const replyChanged = input.adminReply !== undefined && input.adminReply !== prev?.adminReply;
    return prisma.feedback.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.adminReply !== undefined ? { adminReply: input.adminReply } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
        // New reply from admin → clear read receipt so user sees the unread badge
        ...(replyChanged && input.adminReply ? { adminReplyReadAt: null } : {}),
        updatedAt: new Date(),
      },
    });
  },

  /** Mark an admin reply as read by the user */
  /** Mark the confirmation email as sent/failed on an existing feedback record */
  async updateConfirmationEmailStatus(id: string, sent: boolean) {
    return prisma.feedback.update({
      where: { id },
      data: {
        confirmationEmailSent:   sent,
        confirmationEmailSentAt: sent ? new Date() : null,
      },
    });
  },

  async markReplyRead(id: string, userId: string) {
    const item = await prisma.feedback.findUnique({ where: { id } });
    if (!item || item.userId !== userId) return null;
    return prisma.feedback.update({
      where: { id },
      data: { adminReplyReadAt: new Date() },
    });
  },

  /** Count unread admin replies for a user */
  async countUnreadReplies(userId: string): Promise<number> {
    return prisma.feedback.count({
      where: {
        userId,
        adminReply: { not: null },
        adminReplyReadAt: null,
      },
    });
  },

  async updateStatus(id: string, status: string) {
    return this.updateFeedback(id, { status });
  },

  async deleteFeedback(id: string) {
    return prisma.feedback.delete({ where: { id } });
  },

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getStats(): Promise<FeedbackStats> {
    const all = await prisma.feedback.findMany({
      select: {
        status: true,
        rating: true,
        category: true,
        priority: true,
      },
    });

    const total = all.length;
    const open        = all.filter((f: any) => f.status === 'Open').length;
    const underReview = all.filter((f: any) => f.status === 'Under Review').length;
    const inProgress  = all.filter((f: any) => f.status === 'In Progress').length;
    const resolved    = all.filter((f: any) => f.status === 'Resolved').length;
    const closed      = all.filter((f: any) => f.status === 'Closed').length;

    const ratingsSum  = all.reduce((s: number, f: any) => s + (f.rating || 0), 0);
    const averageRating = total > 0 ? Math.round((ratingsSum / total) * 10) / 10 : 0;

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const f of all) {
      byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
      byPriority[f.priority] = (byPriority[f.priority] ?? 0) + 1;
    }

    return {
      total,
      open,
      underReview,
      inProgress,
      resolved,
      closed,
      averageRating,
      byCategory,
      byPriority,
    };
  },
};

export default feedbackService;
