import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendPaginated, sendSuccess } from '@/utils/response';
import { careerRoadmapService } from './career-roadmap.service';
import {
  createCareerSchema,
  createDaySchema,
  createModuleSchema,
  listResourceSchema,
  reorderResourcesSchema,
  createResourceSchema,
  createTopicSchema,
  createWeekSchema,
  reorderItemsSchema,
  searchTopicsSchema,
  updateCareerSchema,
  updateDaySchema,
  updateModuleSchema,
  updateResourceSchema,
  updateTopicSchema,
  updateWeekSchema,
  generateCareerRoadmapSchema,
} from './career-roadmap.validators';

export const getCareers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const careers = await careerRoadmapService.listCareers(userId);
  return sendSuccess(res, careers, 200, 'Careers fetched successfully');
});

export const getAdminCareers = asyncHandler(async (_req: Request, res: Response) => {
  const careers = await careerRoadmapService.listAdminCareers();
  return sendSuccess(res, careers, 200, 'Admin roadmaps fetched successfully');
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

export const generateCareerRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const input = generateCareerRoadmapSchema.parse(req.body);
  const career = await careerRoadmapService.generateCareerRoadmap(input);
  return sendSuccess(res, career, 201, 'Career roadmap generated successfully');
});

export const updateCareer = asyncHandler(async (req: Request, res: Response) => {
  const input = updateCareerSchema.parse(req.body);
  const career = await careerRoadmapService.updateCareer(req.params.id, input);
  return sendSuccess(res, career, 200, 'Career updated successfully');
});

export const deleteCareer = asyncHandler(async (req: Request, res: Response) => {
  const result = await careerRoadmapService.deleteCareer(req.params.id);
  return sendSuccess(res, result, 200, 'Career deleted successfully');
});

export const publishCareer = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.careerId || req.params.id;
  const career = await careerRoadmapService.publishCareer(id, Boolean(req.body?.published));
  return sendSuccess(res, career, 200, 'Career publication status updated successfully');
});

export const createModule = asyncHandler(async (req: Request, res: Response) => {
  const input = createModuleSchema.parse(req.body);
  const module = await careerRoadmapService.createModule(input);
  return sendSuccess(res, module, 201, 'Module created successfully');
});

export const updateModule = asyncHandler(async (req: Request, res: Response) => {
  const input = updateModuleSchema.parse(req.body);
  const module = await careerRoadmapService.updateModule(req.params.id, input);
  return sendSuccess(res, module, 200, 'Module updated successfully');
});

export const deleteModule = asyncHandler(async (req: Request, res: Response) => {
  const result = await careerRoadmapService.deleteModule(req.params.id);
  return sendSuccess(res, result, 200, 'Module deleted successfully');
});

export const createWeek = asyncHandler(async (req: Request, res: Response) => {
  const input = createWeekSchema.parse(req.body);
  const week = await careerRoadmapService.createWeek(input);
  return sendSuccess(res, week, 201, 'Week created successfully');
});

export const updateWeek = asyncHandler(async (req: Request, res: Response) => {
  const input = updateWeekSchema.parse(req.body);
  const week = await careerRoadmapService.updateWeek(req.params.id, input);
  return sendSuccess(res, week, 200, 'Week updated successfully');
});

export const deleteWeek = asyncHandler(async (req: Request, res: Response) => {
  const result = await careerRoadmapService.deleteWeek(req.params.id);
  return sendSuccess(res, result, 200, 'Week deleted successfully');
});

export const createDay = asyncHandler(async (req: Request, res: Response) => {
  const input = createDaySchema.parse(req.body);
  const day = await careerRoadmapService.createDay(input);
  return sendSuccess(res, day, 201, 'Day created successfully');
});

export const updateDay = asyncHandler(async (req: Request, res: Response) => {
  const input = updateDaySchema.parse(req.body);
  const day = await careerRoadmapService.updateDay(req.params.id, input);
  return sendSuccess(res, day, 200, 'Day updated successfully');
});

export const deleteDay = asyncHandler(async (req: Request, res: Response) => {
  const result = await careerRoadmapService.deleteDay(req.params.id);
  return sendSuccess(res, result, 200, 'Day deleted successfully');
});

export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const input = createTopicSchema.parse(req.body);
  const topic = await careerRoadmapService.createTopic(input);
  return sendSuccess(res, topic, 201, 'Topic created successfully');
});

export const updateTopic = asyncHandler(async (req: Request, res: Response) => {
  const input = updateTopicSchema.parse(req.body);
  const topic = await careerRoadmapService.updateTopic(req.params.id, input);
  return sendSuccess(res, topic, 200, 'Topic updated successfully');
});

export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
  const result = await careerRoadmapService.deleteTopic(req.params.id);
  return sendSuccess(res, result, 200, 'Topic deleted successfully');
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

export const reorderModules = asyncHandler(async (req: Request, res: Response) => {
  const input = reorderItemsSchema.parse(req.body);
  const result = await careerRoadmapService.reorderModules(input);
  return sendSuccess(res, result, 200, 'Modules reordered successfully');
});

export const reorderWeeks = asyncHandler(async (req: Request, res: Response) => {
  const input = reorderItemsSchema.parse(req.body);
  const result = await careerRoadmapService.reorderWeeks(input);
  return sendSuccess(res, result, 200, 'Weeks reordered successfully');
});

export const reorderDays = asyncHandler(async (req: Request, res: Response) => {
  const input = reorderItemsSchema.parse(req.body);
  const result = await careerRoadmapService.reorderDays(input);
  return sendSuccess(res, result, 200, 'Days reordered successfully');
});

export const reorderTopics = asyncHandler(async (req: Request, res: Response) => {
  const input = reorderItemsSchema.parse(req.body);
  const result = await careerRoadmapService.reorderTopics(input);
  return sendSuccess(res, result, 200, 'Topics reordered successfully');
});

export const fixResourceTitles = asyncHandler(async (_req: Request, res: Response) => {
  const result = await careerRoadmapService.fixResourceTitles();
  return sendSuccess(res, result, 200, 'Resource titles fixed successfully');
});
