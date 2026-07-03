import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import * as adminController from '@/controllers/admin';
import * as careerRoadmapController from '@/modules/career-roadmap/career-roadmap.controller';
import * as masterRoadmapGeneratorController from '@/modules/master-roadmap-generator/master-roadmap-generator.controller';
import { validate } from '@/middleware/validator';
import {
	createCareerSchema,
	createDaySchema,
	createResourceSchema,
	createTopicSchema,
	createWeekSchema,
	searchTopicsSchema,
	updateResourceSchema,
} from '@/modules/career-roadmap/career-roadmap.validators';
import { generateRoadmapRequestSchema } from '@/modules/master-roadmap-generator/master-roadmap-generator.validators';
import {
	approveRoadmapSchema,
	updateDaySchema,
	updateModuleSchema,
	updateTopicSchema,
	updateWeekSchema,
} from '@/modules/roadmap-review/roadmap-review.validators';
import {
	approveRoadmap,
	updateDay,
	updateModule,
	updateTopic,
	updateWeek,
} from '@/modules/roadmap-review/roadmap-review.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/users', adminController.getUsers);
router.get('/current-users', adminController.getCurrentUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/roadmaps', adminController.getRoadmapStats);
router.get('/resources', adminController.getResources);
router.post('/resources', adminController.createResource);
router.put('/resources/:id', adminController.updateResource);
router.delete('/resources/:id', adminController.deleteResource);
router.get('/assessments', adminController.getAssessmentAnalytics);
router.get('/assessments/completion-rates', adminController.getAssessmentCompletionRates);

router.post('/assessment-questions', adminController.createAssessmentQuestion);
router.get('/adaptive/decision-tree', adminController.getDecisionTree);
router.put('/adaptive/decision-tree', adminController.upsertDecisionTree);
router.get('/adaptive/weights', adminController.getWeights);
router.put('/adaptive/weights', adminController.upsertWeights);

router.post('/careers', adminController.createCareer);
router.put('/careers/:id/weights', adminController.updateCareerWeights);

router.get('/careers', careerRoadmapController.getCareers);
router.post('/career', validate(createCareerSchema), careerRoadmapController.createCareer);
router.post('/week', validate(createWeekSchema), careerRoadmapController.createWeek);
router.post('/day', validate(createDaySchema), careerRoadmapController.createDay);
router.post('/topic', validate(createTopicSchema), careerRoadmapController.createTopic);
router.get('/topics', validate(searchTopicsSchema, 'query'), careerRoadmapController.searchTopics);
router.get('/career-resources', careerRoadmapController.getResources);
router.post('/resource', validate(createResourceSchema), careerRoadmapController.addResource);
router.put('/resource/:id', validate(updateResourceSchema), careerRoadmapController.updateResource);
router.delete('/resource/:id', careerRoadmapController.deleteResource);
router.put('/resource/reorder', careerRoadmapController.reorderResources);
router.post('/generate-roadmap', validate(generateRoadmapRequestSchema), masterRoadmapGeneratorController.generateRoadmap);
router.post('/approve-roadmap', validate(approveRoadmapSchema), approveRoadmap);
router.put('/module/:id', validate(updateModuleSchema), updateModule);
router.put('/week/:id', validate(updateWeekSchema), updateWeek);
router.put('/day/:id', validate(updateDaySchema), updateDay);
router.put('/topic/:id', validate(updateTopicSchema), updateTopic);
router.get('/security/metrics', adminController.getSecurityMetrics);

export default router;
