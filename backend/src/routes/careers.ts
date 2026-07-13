import { Router } from 'express';
import * as careerRoadmapController from '@/modules/career-roadmap/career-roadmap.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/', authenticate, careerRoadmapController.getCareers);
router.post('/generate', authenticate, careerRoadmapController.generateCareerRoadmap);
router.get('/:slug', careerRoadmapController.getCareerBySlug);

export default router;
