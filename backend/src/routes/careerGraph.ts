import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { careerGraphService } from '@/services/careerGraphService';
import redisClient from '@/lib/redis';

const router = Router();

const cacheGet = async <T>(cacheKey: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> => {
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const data = await loader();
  await redisClient.set(cacheKey, JSON.stringify(data), ttlSeconds);
  return data;
};

router.use(authenticate);

router.get('/roles', asyncHandler(async (req, res) => {
  const filters = {
    careerCluster: typeof req.query.careerCluster === 'string' ? req.query.careerCluster : undefined,
    industry: typeof req.query.industry === 'string' ? req.query.industry : undefined,
    difficulty: typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined,
    remoteFriendly: typeof req.query.remoteFriendly === 'string' ? req.query.remoteFriendly === 'true' : undefined,
  };

  const cacheKey = `career-graph:roles:${JSON.stringify(filters)}`;
  const data = await cacheGet(cacheKey, 3600, () => careerGraphService.listRoles(filters));

  return sendSuccess(res, data, 200, 'Career roles fetched successfully');
}));

router.get('/roles/:jobId', asyncHandler(async (req, res) => {
  const role = await cacheGet(`career-graph:role:${req.params.jobId}`, 3600, () => careerGraphService.getRoleById(req.params.jobId));
  if (!role) return sendError(res, 404, 'Career role not found');

  return sendSuccess(res, role, 200, 'Career role fetched successfully');
}));

router.get('/roles/:jobId/roadmap', asyncHandler(async (req, res) => {
  const roadmap = await cacheGet(`career-graph:roadmap:${req.params.jobId}`, 3600, () => careerGraphService.getRoadmap(req.params.jobId));
  return sendSuccess(res, roadmap, 200, 'Career roadmap fetched successfully');
}));

router.get('/roles/:jobId/similar', asyncHandler(async (req, res) => {
  const similar = await cacheGet(`career-graph:similar:${req.params.jobId}`, 3600, () => careerGraphService.getSimilarRoles(req.params.jobId));
  return sendSuccess(res, similar, 200, 'Similar roles fetched successfully');
}));

router.get('/roles/:jobId/weekly-assessment-topics', asyncHandler(async (req, res) => {
  const topics = await cacheGet(`career-graph:assessment-topics:${req.params.jobId}`, 3600, () => careerGraphService.getWeeklyAssessmentTopics(req.params.jobId));
  return sendSuccess(res, topics, 200, 'Weekly assessment topics fetched successfully');
}));

router.post('/skill-gap', asyncHandler(async (req, res) => {
  const { userSkills, targetJobId } = req.body as { userSkills?: string[]; targetJobId?: string };

  if (!Array.isArray(userSkills) || !targetJobId) {
    return sendError(res, 400, 'userSkills array and targetJobId are required');
  }

  const skillGap = await careerGraphService.getSkillGapAnalysis(userSkills, targetJobId);
  return sendSuccess(res, skillGap, 200, 'Skill gap analysis fetched successfully');
}));

router.get('/progression/:careerCluster', asyncHandler(async (req, res) => {
  const ladder = await cacheGet(`career-graph:progression:${req.params.careerCluster}`, 3600, () => careerGraphService.getCareerProgression(req.params.careerCluster));
  return sendSuccess(res, ladder, 200, 'Career progression ladder fetched successfully');
}));

export default router;
