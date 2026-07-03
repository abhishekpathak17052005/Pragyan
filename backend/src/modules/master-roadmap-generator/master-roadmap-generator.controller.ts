import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess } from '@/utils/response';
import { generateRoadmapRequestSchema } from './master-roadmap-generator.validators';
import { masterRoadmapGeneratorService } from './master-roadmap-generator.service';

export const generateRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { careerName } = generateRoadmapRequestSchema.parse(req.body);
  const result = await masterRoadmapGeneratorService.generateRoadmapPreview(careerName);

  return sendSuccess(res, result, 200, 'Roadmap preview generated successfully');
});
