import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendPaginated, sendSuccess } from '@/utils/response';
import { careerRoadmapService } from './career-roadmap.service';
import {
  createCareerSchema,
  createDaySchema,
  listResourceSchema,
  reorderResourcesSchema,
  createResourceSchema,
  createTopicSchema,
  createWeekSchema,
  searchTopicsSchema,
  updateResourceSchema,
} from './career-roadmap.validators';

export const getCareers = asyncHandler(async (_req: Request, res: Response) => {
  const careers = await careerRoadmapService.listCareers();
  return sendSuccess(res, careers, 200, 'Careers fetched successfully');
});

export const getCareerBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const career = await careerRoadmapService.getCareerBySlug(slug);
  return sendSuccess(res, career, 200, 'Career roadmap fetched successfully');
});

export const getTopicById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const topic = await careerRoadmapService.getTopicById(id);
  return sendSuccess(res, topic, 200, 'Topic fetched successfully');
});

export const getTopicResources = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resources = await careerRoadmapService.listResources(id);
  return sendSuccess(res, resources, 200, 'Topic resources fetched successfully');
});

export const createCareer = asyncHandler(async (req: Request, res: Response) => {
  const input = createCareerSchema.parse(req.body);
  const career = await careerRoadmapService.createCareer(input);
  return sendSuccess(res, career, 201, 'Career created successfully');
});

export const createWeek = asyncHandler(async (req: Request, res: Response) => {
  const input = createWeekSchema.parse(req.body);
  const week = await careerRoadmapService.createWeek(input);
  return sendSuccess(res, week, 201, 'Week created successfully');
});

export const createDay = asyncHandler(async (req: Request, res: Response) => {
  const input = createDaySchema.parse(req.body);
  const day = await careerRoadmapService.createDay(input);
  return sendSuccess(res, day, 201, 'Day created successfully');
});

export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const input = createTopicSchema.parse(req.body);
  const topic = await careerRoadmapService.createTopic(input);
  return sendSuccess(res, topic, 201, 'Topic created successfully');
});

export const addResource = asyncHandler(async (req: Request, res: Response) => {
  const input = createResourceSchema.parse(req.body);
  const resource = await careerRoadmapService.addResource(input);
  return sendSuccess(res, resource, 201, 'Resource added successfully');
});

export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = updateResourceSchema.parse(req.body);
  const resource = await careerRoadmapService.updateResource(id, input);
  return sendSuccess(res, resource, 200, 'Resource updated successfully');
});

export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await careerRoadmapService.deleteResource(id);
  return sendSuccess(res, result, 200, 'Resource deleted successfully');
});

export const searchTopics = asyncHandler(async (req: Request, res: Response) => {
  const input = searchTopicsSchema.parse({
    q: req.query.q,
    page: req.query.page,
    limit: req.query.limit,
  });

  const result = await careerRoadmapService.searchTopics(input);
  return sendPaginated(res, result.topics, result.page, result.limit, result.total);
});

export const getResources = asyncHandler(async (req: Request, res: Response) => {
  const filters = listResourceSchema.parse({
    topicId: req.query.topicId,
    type: req.query.type,
  });
  const resources = await careerRoadmapService.listResources(filters);
  return sendSuccess(res, resources, 200, 'Resources fetched successfully');
});

export const reorderResources = asyncHandler(async (req: Request, res: Response) => {
  const input = reorderResourcesSchema.parse(req.body);
  const resources = await careerRoadmapService.reorderResources(input);
  return sendSuccess(res, resources, 200, 'Resources reordered successfully');
});
