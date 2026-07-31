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
    return (prisma as any).feedback.create({
      data: {
        userId,
        category:     input.category,
        rating:       input.rating,
        title:        input.title,
        description:  input.description,
        priority:     input.priority ?? 'Medium',
        screenshotUrl: input.screenshotUrl ?? null,
        allowContact: input.allowContact ?? false,
        anonymous:    input.anonymous ?? false,
        status:       'Open',
      },
    });
  },

  async listForUser(userId: string) {
    return (prisma as any).feedback.findMany({
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
        allowContact: true,
        anonymous: true,
        createdAt: true,
        updatedAt: true,
        // Do not expose userId or user object for anonymous submissions on client
      },
    });
  },

  async getById(id: string) {
    return (prisma as any).feedback.findUnique({ where: { id } });
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

    const [items, total] = await Promise.all([
      (prisma as any).feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, fullName: true, avatar: true },
          },
        },
      }),
      (prisma as any).feedback.count({ where }),
    ]);

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

  async updateStatus(id: string, status: string) {
    return (prisma as any).feedback.update({
      where: { id },
      data:  { status, updatedAt: new Date() },
    });
  },

  async deleteFeedback(id: string) {
    return (prisma as any).feedback.delete({ where: { id } });
  },

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getStats(): Promise<FeedbackStats> {
    const all = await (prisma as any).feedback.findMany({
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
