import type { Request, Response } from 'express';
import { RoadmapReviewService } from './roadmap-review.service';
import {
  approveRoadmapSchema,
  updateDaySchema,
  updateModuleSchema,
  updateTopicSchema,
  updateWeekSchema,
} from './roadmap-review.validators';

const service = new RoadmapReviewService();

export async function approveRoadmap(req: Request, res: Response) {
  const payload = approveRoadmapSchema.parse(req.body);
  const roadmap = await service.approveRoadmap(payload);
  res.status(201).json({ success: true, data: roadmap });
}

export async function updateModule(req: Request, res: Response) {
  const payload = updateModuleSchema.parse(req.body);
  const module = await service.updateModule(req.params.id, payload);
  res.json({ success: true, data: module });
}

export async function updateWeek(req: Request, res: Response) {
  const payload = updateWeekSchema.parse(req.body);
  const week = await service.updateWeek(req.params.id, payload);
  res.json({ success: true, data: week });
}

export async function updateDay(req: Request, res: Response) {
  const payload = updateDaySchema.parse(req.body);
  const day = await service.updateDay(req.params.id, payload);
  res.json({ success: true, data: day });
}

export async function updateTopic(req: Request, res: Response) {
  const payload = updateTopicSchema.parse(req.body);
  const topic = await service.updateTopic(req.params.id, payload);
  res.json({ success: true, data: topic });
}
