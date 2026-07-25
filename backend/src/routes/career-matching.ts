import { Router } from 'express';
import * as careerMatchingController from '@/controllers/career-matching';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { careerMatchingAnalyzeSchema } from '@/validators/career-matching';

const router = Router();

// Analyze assessment and get recommendations
router.post('/analyze', authenticate, validate(careerMatchingAnalyzeSchema), careerMatchingController.analyzeAssessmentAndRecommend);

// Get all career matches for user
router.get('/matches', authenticate, careerMatchingController.getCareerMatches);

// Get top career recommendation
router.get('/top-career', authenticate, careerMatchingController.getTopCareer);

// Get all available careers
router.get('/careers', careerMatchingController.getAllCareers);

// Get career details
router.get('/careers/:careerId', careerMatchingController.getCareerDetails);

// Get hybrid matching statistics
router.get('/hybrid/statistics', careerMatchingController.getHybridStatistics);

export default router;
