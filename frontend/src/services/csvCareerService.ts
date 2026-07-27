import { api } from './apiClient';

/**
 * CSV Career Match
 */
export interface CSVCareerMatch {
  id: string;
  userId: string;
  careerTitle: string;
  overallScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  
  // Component scores
  skillMatchScore: number;
  interestMatchScore: number;
  educationMatchScore: number;
  experienceMatchScore: number;
  performanceScore: number;
  readinessScore: number;
  
  // Details
  matchedSkills: string[];
  missingSkills: string[];
  matchedInterests: string[];
  strengthAlignment: string[];
  
  // Recommendations
  recommendationReason: string[];
  nextSteps: string[];
  estimatedTimeToReady: string;
  learningPathSuggestion: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Career recommendation request
 */
export interface RecommendCareerRequest {
  limit?: number;
  minScore?: number;
  includeSkillGaps?: boolean;
}

/**
 * Career recommendation response
 */
export interface RecommendCareerResponse {
  recommendations: CSVCareerMatch[];
  totalMatches: number;
  topRecommendation: CSVCareerMatch | null;
}

/**
 * Performance score
 */
export interface PerformanceScore {
  userId: string;
  overallPerformanceScore: number;
  technicalScore: number;
  behavioralScore: number;
  interestScore: number;
  technicalLevel: string;
  assessmentPhaseScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
}

/**
 * Skill gap analysis
 */
export interface SkillGapAnalysis {
  id: string;
  userId: string;
  careerTitle: string;
  missingSkills: string[];
  skillPriority: Record<string, number>;
  estimatedLearningTime: Record<string, string>;
  recommendedCourses: Array<{
    skill: string;
    courses: string[];
  }>;
  progressPercentage: number;
  skillsInProgress: string[];
  skillsCompleted: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Career explanation
 */
export interface CareerExplanation {
  careerTitle: string;
  overallScore: number;
  confidence: string;
  summary: string;
  
  components: {
    skills: {
      title: string;
      score: number;
      matched: string[];
      missing: string[];
      weight: number;
    };
    interests: {
      title: string;
      score: number;
      matched: string[];
      weight: number;
    };
    education: {
      title: string;
      score: number;
      weight: number;
    };
    experience: {
      title: string;
      score: number;
      weight: number;
    };
    performance: {
      title: string;
      score: number;
      weight: number;
    };
    readiness: {
      title: string;
      score: number;
      weight: number;
    };
  };
  
  whyRecommended: string[];
  whatToImprove: string[];
  nextSteps: string[];
  timelineEstimate: string;
  
  careerDetails: {
    requiredSkills: string[];
    relatedInterests: string[];
    exampleCount: number;
  };
}

/**
 * Career comparison
 */
export interface CareerComparison {
  comparisons: Array<{
    careerTitle: string;
    overallScore: number;
    confidence: string;
    skillMatchScore: number;
    interestMatchScore: number;
    performanceScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    estimatedTimeToReady: string;
  }>;
  winner: string;
  winnerScore: number;
  reasoning: string;
}

/**
 * Dataset statistics
 */
export interface DatasetStats {
  totalRecords: number;
  totalCareers: number;
  totalSkills: number;
  topCareers: Array<{ career: string; count: number }>;
  topSkills: Array<{ skill: string; count: number }>;
  educationLevels: Record<string, number>;
  experienceLevels: Record<string, number>;
}

/**
 * Hybrid matching strategy
 */
export type MergeStrategy = 'union' | 'intersection' | 'csv-priority' | 'mongodb-priority';

/**
 * Hybrid match result
 */
export interface HybridMatchResult {
  mergedCareers: CSVCareerMatch[];
  csvCount: number;
  mongodbCount: number;
  mergedCount: number;
  strategy: MergeStrategy;
  performanceMetrics: {
    csvMatchTime: number;
    mongodbMatchTime: number;
    mergeTime: number;
    totalTime: number;
  };
}

/**
 * CSV Career Service
 * Connects to backend CSV career matching APIs
 */
class CSVCareerService {
  /**
   * Generate career recommendations
   */
  async recommendCareers(params?: RecommendCareerRequest): Promise<RecommendCareerResponse> {
    return api.post<RecommendCareerResponse>('/csv-careers/recommend', params);
  }

  /**
   * Get saved recommendations
   */
  async getRecommendations(params?: {
    confidenceLevel?: 'high' | 'medium' | 'low';
    minScore?: number;
    limit?: number;
  }): Promise<CSVCareerMatch[]> {
    const queryParams = new URLSearchParams();
    if (params?.confidenceLevel) queryParams.append('confidenceLevel', params.confidenceLevel);
    if (params?.minScore) queryParams.append('minScore', params.minScore.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/csv-careers/recommendations${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await api.get<{ recommendations: CSVCareerMatch[], count: number }>(url);
    // Return just the array for easier consumption
    return Array.isArray(response) ? response : response.recommendations || [];
  }

  /**
   * Get top recommendation
   */
  async getTopRecommendation(): Promise<CSVCareerMatch | null> {
    return api.get<CSVCareerMatch | null>('/csv-careers/top-recommendation');
  }

  /**
   * Get specific recommendation by career title
   */
  async getRecommendation(careerTitle: string): Promise<CSVCareerMatch> {
    return api.get<CSVCareerMatch>(`/csv-careers/recommendation/${encodeURIComponent(careerTitle)}`);
  }

  /**
   * Get user performance score
   */
  async getPerformanceScore(): Promise<PerformanceScore> {
    return api.get<PerformanceScore>('/csv-careers/performance');
  }

  /**
   * Refresh performance score
   */
  async refreshPerformanceScore(): Promise<PerformanceScore> {
    return api.post<PerformanceScore>('/csv-careers/performance/refresh');
  }

  /**
   * Get recommendation history
   */
  async getHistory(limit?: number): Promise<CSVCareerMatch[]> {
    const url = `/csv-careers/history${limit ? `?limit=${limit}` : ''}`;
    return api.get<CSVCareerMatch[]>(url);
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(): Promise<DatasetStats> {
    return api.get<DatasetStats>('/csv-careers/dataset/stats');
  }

  /**
   * Search careers in dataset
   */
  async searchCareers(params: {
    query?: string;
    skills?: string[];
    interests?: string[];
    education?: string;
    limit?: number;
  }): Promise<Array<{ careerTitle: string; matchScore: number }>> {
    return api.post('/csv-careers/search', params);
  }

  /**
   * Get career explanation
   */
  async explainCareer(careerTitle: string): Promise<CareerExplanation> {
    return api.get<CareerExplanation>(`/csv-careers/explain/${encodeURIComponent(careerTitle)}`);
  }

  /**
   * Compare multiple careers
   */
  async compareCareers(careerTitles: string[]): Promise<CareerComparison> {
    return api.post<CareerComparison>('/csv-careers/compare', { careerTitles });
  }

  /**
   * Analyze skill gaps for a career
   */
  async analyzeSkillGaps(careerTitle: string): Promise<SkillGapAnalysis> {
    return api.post<SkillGapAnalysis>('/csv-careers/skill-gaps/analyze', { careerTitle });
  }

  /**
   * Get skill gap analysis
   */
  async getSkillGaps(careerTitle: string): Promise<SkillGapAnalysis> {
    return api.get<SkillGapAnalysis>(`/csv-careers/skill-gaps/${encodeURIComponent(careerTitle)}`);
  }

  /**
   * Mark skill as in progress
   */
  async markSkillInProgress(careerTitle: string, skill: string): Promise<SkillGapAnalysis> {
    return api.post<SkillGapAnalysis>('/csv-careers/skill-gaps/progress', {
      careerTitle,
      skill,
    });
  }

  /**
   * Mark skill as completed
   */
  async markSkillCompleted(careerTitle: string, skill: string): Promise<SkillGapAnalysis> {
    return api.post<SkillGapAnalysis>('/csv-careers/skill-gaps/complete', {
      careerTitle,
      skill,
    });
  }

  /**
   * Hybrid matching - CSV + MongoDB
   */
  async hybridMatch(params: {
    strategy?: MergeStrategy;
    limit?: number;
    minScore?: number;
  }): Promise<HybridMatchResult> {
    return api.post<HybridMatchResult>('/career-matching/analyze', params);
  }

  /**
   * Get hybrid matching statistics
   */
  async getHybridStats(): Promise<{
    totalCsvCareers: number;
    totalMongodbCareers: number;
    averageMatchTime: number;
    cacheHitRate: number;
  }> {
    return api.get('/career-matching/hybrid/statistics');
  }
}

export const csvCareerService = new CSVCareerService();
