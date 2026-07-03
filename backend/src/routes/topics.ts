import { Router } from 'express';
import * as careerRoadmapController from '@/modules/career-roadmap/career-roadmap.controller';

const router = Router();

router.get('/:id', careerRoadmapController.getTopicById);
router.get('/:id/resources', careerRoadmapController.getTopicResources);

export default router;
