import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess } from '@/utils/response';
import { careerRoadmapProgressService } from './career-roadmap-progress.service';

export const completeResource = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { resourceId } = req.body;

  const result = await careerRoadmapProgressService.completeResource(userId, resourceId);
  return sendSuccess(res, result, 200, 'Resource marked as complete');
});

export const getTopicProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { topicId } = req.params;

  const progress = await careerRoadmapProgressService.getTopicProgress(userId, topicId);
  return sendSuccess(res, progress, 200, 'Topic progress fetched');
});

export const getDayProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { dayId } = req.params;

  const progress = await careerRoadmapProgressService.getDayProgress(userId, dayId);
  return sendSuccess(res, progress, 200, 'Day progress fetched');
});

export const getWeekProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { weekId } = req.params;

  const progress = await careerRoadmapProgressService.getWeekProgress(userId, weekId);
  return sendSuccess(res, progress, 200, 'Week progress fetched');
});

export const getCareerProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { careerId } = req.params;

  const progress = await careerRoadmapProgressService.getCareerProgress(userId, careerId);
  return sendSuccess(res, progress, 200, 'Career progress fetched');
});

export const getCareerRoadmapWithProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;
  const { careerId } = req.params;

  const roadmapWithProgress = await careerRoadmapProgressService.getCareerRoadmapWithProgress(userId, careerId);
  return sendSuccess(res, roadmapWithProgress, 200, 'Roadmap with progress fetched');
});

export const getProgressSummary = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as any;

  const summary = await careerRoadmapProgressService.getUserProgressSummary(userId);
  return sendSuccess(res, summary, 200, 'Progress summary fetched');
});
