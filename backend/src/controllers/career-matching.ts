import { Request, Response } from 'express';
import { careerMatchingEngine, AssessmentAnswers } from '@/services/career-matching';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

export const analyzeAssessmentAndRecommend = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { 
    skills, 
    interests, 
    education, 
    experience, 
    personality, 
    workStyle, 
    careerGoals,
    useHybridMatching = true, // New option
    hybridOptions,
  } = req.body;

  if (!skills && !interests) {
    return sendError(res, 400, 'At least skills or interests are required');
  }

  const answers: AssessmentAnswers = {
    skills: skills || [],
    interests: interests || [],
    education,
    experience,
    personality,
    workStyle,
    careerGoals,
  };

  // Use enhanced matching if requested
  const matches = useHybridMatching
    ? await careerMatchingEngine.analyzeAssessmentEnhanced(req.user.id, answers)
    : await careerMatchingEngine.analyzeAssessment(req.user.id, answers);

  // If hybrid options provided, use hybrid matching with custom options
  const finalMatches = hybridOptions
    ? await careerMatchingEngine.analyzeAssessmentHybrid(req.user.id, answers, hybridOptions)
    : matches;

  return sendSuccess(res, finalMatches, 200, 'Career recommendations generated successfully');
});

export const getCareerMatches = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const matches = await careerMatchingEngine.getUserCareerMatches(req.user.id);

  return sendSuccess(res, matches, 200, 'Career matches retrieved successfully');
});

export const getTopCareer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const topMatch = await careerMatchingEngine.getTopCareerMatch(req.user.id);

  if (!topMatch) {
    return sendError(res, 404, 'No career matches found. Please complete an assessment.');
  }

  return sendSuccess(res, topMatch, 200, 'Top career match retrieved successfully');
});

export const getAllCareers = asyncHandler(async (_req: Request, res: Response) => {
  const careers = await careerMatchingEngine.getAllCareers();

  return sendSuccess(res, careers, 200, 'All careers retrieved successfully');
});

export const getCareerDetails = asyncHandler(async (req: Request, res: Response) => {
  const { careerId } = req.params;

  if (!careerId) {
    return sendError(res, 400, 'Career ID is required');
  }

  // TODO: Implement career details retrieval including skills, interests, roadmaps, etc.
  return sendError(res, 501, 'Feature coming soon');
});

export const getHybridStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = careerMatchingEngine.getHybridStatistics();

  return sendSuccess(
    res,
    stats,
    200,
    'Hybrid career matching statistics retrieved successfully'
  );
});
