import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendError } from '@/utils/response';
import { assessmentCareerMatcherService } from '@/services/assessment-career-matcher';
import { performanceScoringService } from '@/services/performance-scoring';
import { csvCareerDatasetService } from '@/services/csv-career-dataset';
import { prisma } from '@/lib/prisma';

/**
 * Generate career recommendations using CSV dataset and assessment data
 * POST /api/csv-careers/recommend
 */
export const generateCSVCareerRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const {
      topN = 10,
      includeMongoDBCareers = true,
      customWeights,
      saveResults = true,
    } = req.body;

    try {
      // Step 1: Build user assessment profile
      const userProfile = await assessmentCareerMatcherService.buildUserProfileFromAssessment(
        req.user.id
      );

      if (!userProfile) {
        return sendError(
          res,
          404,
          'No assessment data found. Please complete the assessment first.'
        );
      }

      // Step 2: Calculate performance score
      const performanceMetrics = await performanceScoringService.calculatePerformanceScore(
        req.user.id
      );

      // Enhance profile with performance data
      userProfile.technicalAssessmentScore = performanceMetrics.technicalAssessmentScore;
      userProfile.assessmentConfidence = performanceMetrics.assessmentConfidence;
      userProfile.correctAnswersRatio = performanceMetrics.correctAnswersRatio;
      userProfile.technicalLevel = performanceMetrics.technicalLevel;
      userProfile.codingComfort = performanceMetrics.codingComfort;
      userProfile.problemSolving = performanceMetrics.problemSolvingLevel;

      // Step 3: Match careers
      const matches = await assessmentCareerMatcherService.matchCareersFromAssessment(
        userProfile,
        {
          topN,
          weights: customWeights,
          includeMongoDBCareers,
        }
      );

      // Step 4: Save results to database
      if (saveResults) {
        await Promise.all([
          // Save performance score
          performanceScoringService.savePerformanceScore(performanceMetrics),
          
          // Save career matches
          ...matches.map((match) =>
            prisma.cSVCareerMatch.upsert({
              where: {
                userId_careerTitle: {
                  userId: req.user!.id,
                  careerTitle: match.careerTitle,
                },
              },
              create: {
                userId: req.user!.id,
                careerTitle: match.careerTitle,
                overallScore: match.overallScore,
                confidenceLevel: match.confidenceLevel,
                skillMatchScore: match.skillMatchScore,
                interestMatchScore: match.interestMatchScore,
                educationMatchScore: match.educationMatchScore,
                experienceMatchScore: match.experienceMatchScore,
                performanceScore: match.performanceScore,
                readinessScore: match.readinessScore,
                matchedSkills: match.matchedSkills,
                missingSkills: match.missingSkills,
                matchedInterests: match.matchedInterests,
                strengthAlignment: match.strengthAlignment,
                learningPath: match.learningPath,
                estimatedTimeToReady: match.estimatedTimeToReady,
                nextSteps: match.nextSteps,
                recommendationReason: match.recommendationReason,
                csvDatasetScore: match.csvDatasetScore,
                source: match.source,
              },
              update: {
                overallScore: match.overallScore,
                confidenceLevel: match.confidenceLevel,
                skillMatchScore: match.skillMatchScore,
                interestMatchScore: match.interestMatchScore,
                educationMatchScore: match.educationMatchScore,
                experienceMatchScore: match.experienceMatchScore,
                performanceScore: match.performanceScore,
                readinessScore: match.readinessScore,
                matchedSkills: match.matchedSkills,
                missingSkills: match.missingSkills,
                matchedInterests: match.matchedInterests,
                strengthAlignment: match.strengthAlignment,
                learningPath: match.learningPath,
                estimatedTimeToReady: match.estimatedTimeToReady,
                nextSteps: match.nextSteps,
                recommendationReason: match.recommendationReason,
                csvDatasetScore: match.csvDatasetScore,
                source: match.source,
                updatedAt: new Date(),
              },
            })
          ),
          
          // Save snapshot
          prisma.careerRecommendationSnapshot.create({
            data: {
              userId: req.user!.id,
              snapshotType: 'assessment',
              userProfileSnapshot: userProfile as any,
              topCareerTitles: matches.map((m) => m.careerTitle),
              topCareerScores: matches.map((m) => m.overallScore),
              fullRecommendations: matches as any,
              scoringWeights: customWeights || null,
              averageScore: matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length,
              highConfidenceCount: matches.filter((m) => m.confidenceLevel === 'high').length,
              mediumConfidenceCount: matches.filter((m) => m.confidenceLevel === 'medium').length,
              lowConfidenceCount: matches.filter((m) => m.confidenceLevel === 'low').length,
            },
          }),
        ]);
      }

      return sendSuccess(
        res,
        {
          recommendations: matches,
          performanceMetrics: {
            overallScore: performanceMetrics.overallPerformanceScore,
            technicalLevel: performanceMetrics.technicalLevel,
            assessmentConfidence: Math.round(performanceMetrics.assessmentConfidence * 100),
          },
          metadata: {
            totalRecommendations: matches.length,
            highConfidenceCount: matches.filter((m) => m.confidenceLevel === 'high').length,
            averageScore: Math.round(
              matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length
            ),
          },
        },
        200,
        'Career recommendations generated successfully'
      );
    } catch (error: any) {
      console.error('Error generating CSV career recommendations:', error);
      return sendError(res, 500, 'Failed to generate recommendations', error.message);
    }
  }
);

/**
 * Get saved career recommendations
 * GET /api/csv-careers/recommendations
 */
export const getSavedRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { limit = 10, confidenceLevel, minScore } = req.query;

  try {
    const whereClause: any = { userId: req.user.id };

    if (confidenceLevel) {
      whereClause.confidenceLevel = confidenceLevel;
    }

    if (minScore) {
      whereClause.overallScore = { gte: parseFloat(minScore as string) };
    }

    const recommendations = await prisma.cSVCareerMatch.findMany({
      where: whereClause,
      orderBy: { overallScore: 'desc' },
      take: parseInt(limit as string),
    });

    return sendSuccess(
      res,
      {
        recommendations,
        count: recommendations.length,
      },
      200,
      'Saved recommendations retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching saved recommendations:', error);
    return sendError(res, 500, 'Failed to fetch recommendations', error.message);
  }
});

/**
 * Get top recommended career
 * GET /api/csv-careers/top-recommendation
 */
export const getTopRecommendation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const topRecommendation = await prisma.cSVCareerMatch.findFirst({
      where: { userId: req.user.id },
      orderBy: { overallScore: 'desc' },
    });

    if (!topRecommendation) {
      return sendError(
        res,
        404,
        'No recommendations found. Please generate recommendations first.'
      );
    }

    return sendSuccess(res, topRecommendation, 200, 'Top recommendation retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching top recommendation:', error);
    return sendError(res, 500, 'Failed to fetch top recommendation', error.message);
  }
});

/**
 * Get recommendation details by career title
 * GET /api/csv-careers/recommendation/:careerTitle
 */
export const getRecommendationDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { careerTitle } = req.params;

  try {
    const recommendation = await prisma.cSVCareerMatch.findUnique({
      where: {
        userId_careerTitle: {
          userId: req.user.id,
          careerTitle: decodeURIComponent(careerTitle),
        },
      },
    });

    if (!recommendation) {
      return sendError(res, 404, 'Recommendation not found');
    }

    // Get additional career information from CSV dataset
    const careerSkills = csvCareerDatasetService.getCareerSkills(recommendation.careerTitle);
    const careerInterests = csvCareerDatasetService.getCareerInterests(recommendation.careerTitle);
    const careerExamples = csvCareerDatasetService.getCareerExamples(recommendation.careerTitle);

    return sendSuccess(
      res,
      {
        recommendation,
        careerDetails: {
          requiredSkills: careerSkills,
          relatedInterests: careerInterests,
          exampleCount: careerExamples.length,
          averageEducation: getMostCommonEducation(careerExamples),
        },
      },
      200,
      'Recommendation details retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching recommendation details:', error);
    return sendError(res, 500, 'Failed to fetch recommendation details', error.message);
  }
});

/**
 * Get user performance score
 * GET /api/csv-careers/performance
 */
export const getUserPerformance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    let performanceMetrics = await performanceScoringService.getPerformanceScore(req.user.id);

    // If not found, calculate fresh
    if (!performanceMetrics) {
      performanceMetrics = await performanceScoringService.updatePerformanceScore(req.user.id);
    }

    // Get peer comparison
    const peerComparison = await performanceScoringService.compareWithPeers(req.user.id);

    return sendSuccess(
      res,
      {
        performance: performanceMetrics,
        peerComparison,
      },
      200,
      'Performance metrics retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    return sendError(res, 500, 'Failed to fetch performance metrics', error.message);
  }
});

/**
 * Refresh/update performance score
 * POST /api/csv-careers/performance/refresh
 */
export const refreshPerformanceScore = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    const performanceMetrics = await performanceScoringService.updatePerformanceScore(req.user.id);

    return sendSuccess(
      res,
      performanceMetrics,
      200,
      'Performance score refreshed successfully'
    );
  } catch (error: any) {
    console.error('Error refreshing performance score:', error);
    return sendError(res, 500, 'Failed to refresh performance score', error.message);
  }
});

/**
 * Get recommendation history (snapshots)
 * GET /api/csv-careers/history
 */
export const getRecommendationHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { limit = 10 } = req.query;

  try {
    const history = await prisma.careerRecommendationSnapshot.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        id: true,
        snapshotType: true,
        topCareerTitles: true,
        topCareerScores: true,
        averageScore: true,
        highConfidenceCount: true,
        mediumConfidenceCount: true,
        lowConfidenceCount: true,
        createdAt: true,
      },
    });

    return sendSuccess(
      res,
      {
        history,
        count: history.length,
      },
      200,
      'Recommendation history retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching recommendation history:', error);
    return sendError(res, 500, 'Failed to fetch recommendation history', error.message);
  }
});

/**
 * Get CSV dataset statistics
 * GET /api/csv-careers/dataset/stats
 */
export const getDatasetStats = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const stats = csvCareerDatasetService.getStatistics();
    const uniqueCareers = csvCareerDatasetService.getUniqueCareerTitles();

    return sendSuccess(
      res,
      {
        ...stats,
        careerList: uniqueCareers.slice(0, 20), // Sample of careers
        totalUniqueCareers: uniqueCareers.length,
      },
      200,
      'Dataset statistics retrieved successfully'
    );
  } catch (error: any) {
    console.error('Error fetching dataset stats:', error);
    return sendError(res, 500, 'Failed to fetch dataset statistics', error.message);
  }
});

/**
 * Search careers in CSV dataset
 * POST /api/csv-careers/search
 */
export const searchCSVCareers = asyncHandler(async (req: Request, res: Response) => {
  const { skills = [], interests = [], limit = 10 } = req.body;

  try {
    if (!Array.isArray(skills) && !Array.isArray(interests)) {
      return sendError(res, 400, 'Skills or interests array is required');
    }

    const results = csvCareerDatasetService.searchCareers(skills, interests);

    return sendSuccess(
      res,
      {
        results: results.slice(0, limit),
        totalResults: results.length,
      },
      200,
      'Career search completed successfully'
    );
  } catch (error: any) {
    console.error('Error searching CSV careers:', error);
    return sendError(res, 500, 'Failed to search careers', error.message);
  }
});

// Helper function
function getMostCommonEducation(examples: any[]): string {
  if (examples.length === 0) return 'Bachelor\'s';

  const educationCount = new Map<string, number>();
  examples.forEach((ex) => {
    const edu = ex.education || 'Bachelor\'s';
    educationCount.set(edu, (educationCount.get(edu) || 0) + 1);
  });

  let maxCount = 0;
  let mostCommon = 'Bachelor\'s';

  educationCount.forEach((count, edu) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = edu;
    }
  });

  return mostCommon;
}
