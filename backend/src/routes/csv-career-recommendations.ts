import express from 'express';
import { authenticate } from '@/middleware/auth';
import {
  generateCSVCareerRecommendations,
  getSavedRecommendations,
  getTopRecommendation,
  getRecommendationDetails,
  getUserPerformance,
  refreshPerformanceScore,
  getRecommendationHistory,
  getDatasetStats,
  searchCSVCareers,
} from '@/controllers/csv-career-recommendations';

const router = express.Router();

// ============ CAREER RECOMMENDATION ENDPOINTS ============

/**
 * @route   POST /api/csv-careers/recommend
 * @desc    Generate career recommendations using CSV dataset and assessment data
 * @access  Private
 * @body    { topN?: number, includeMongoDBCareers?: boolean, customWeights?: object, saveResults?: boolean }
 */
router.post('/recommend', authenticate, generateCSVCareerRecommendations);

/**
 * @route   GET /api/csv-careers/recommendations
 * @desc    Get saved career recommendations
 * @access  Private
 * @query   limit, confidenceLevel, minScore
 */
router.get('/recommendations', authenticate, getSavedRecommendations);

/**
 * @route   GET /api/csv-careers/top-recommendation
 * @desc    Get top recommended career for the user
 * @access  Private
 */
router.get('/top-recommendation', authenticate, getTopRecommendation);

/**
 * @route   GET /api/csv-careers/recommendation/:careerTitle
 * @desc    Get detailed information about a specific career recommendation
 * @access  Private
 * @param   careerTitle - URL-encoded career title
 */
router.get('/recommendation/:careerTitle', authenticate, getRecommendationDetails);

// ============ PERFORMANCE ENDPOINTS ============

/**
 * @route   GET /api/csv-careers/performance
 * @desc    Get user's assessment performance score
 * @access  Private
 */
router.get('/performance', authenticate, getUserPerformance);

/**
 * @route   POST /api/csv-careers/performance/refresh
 * @desc    Recalculate and update performance score
 * @access  Private
 */
router.post('/performance/refresh', authenticate, refreshPerformanceScore);

// ============ HISTORY ENDPOINTS ============

/**
 * @route   GET /api/csv-careers/history
 * @desc    Get recommendation history (snapshots over time)
 * @access  Private
 * @query   limit
 */
router.get('/history', authenticate, getRecommendationHistory);

// ============ DATASET ENDPOINTS ============

/**
 * @route   GET /api/csv-careers/dataset/stats
 * @desc    Get CSV dataset statistics
 * @access  Public (or Private based on requirements)
 */
router.get('/dataset/stats', getDatasetStats);

/**
 * @route   POST /api/csv-careers/search
 * @desc    Search careers in CSV dataset by skills and interests
 * @access  Public (or Private based on requirements)
 * @body    { skills: string[], interests: string[], limit?: number }
 */
router.post('/search', searchCSVCareers);

export default router;
