import { prisma } from '@/lib/prisma';
import { csvCareerDatasetService } from './csv-career-dataset';

/**
 * User assessment profile aggregated from all phases
 */
export interface UserAssessmentProfile {
  userId: string;
  
  // Phase 1: User Discovery
  age?: number;
  education?: string;
  experience?: string;
  
  // Phase 2: Interest Discovery
  interests: string[];
  primaryInterest?: string;
  workStyle?: string;
  learningStyle?: string;
  
  // Phase 3: Capability Discovery
  capabilities: Array<{
    category: string;
    confidence?: string;
  }>;
  strengths: string[];
  
  // Phase 4: Technical Profile
  skills: string[];
  technicalLevel?: 'beginner' | 'intermediate' | 'advanced';
  codingComfort?: 'none' | 'basic' | 'moderate' | 'strong';
  problemSolving?: 'low' | 'medium' | 'high';
  tools: string[];
  domains: string[];
  
  // Phase 5: Career Readiness
  readinessLevel?: 'starting' | 'developing' | 'ready';
  interviewConfidence?: 'low' | 'medium' | 'high';
  developmentGoals?: string;
  
  // Performance metrics from adaptive assessment
  technicalAssessmentScore?: number; // 0-1
  assessmentConfidence?: number; // 0-1
  correctAnswersRatio?: number; // 0-1
}

/**
 * Career match result with detailed scoring
 */
export interface EnhancedCareerMatch {
  careerTitle: string;
  overallScore: number; // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  
  // Component scores
  skillMatchScore: number; // 0-100
  interestMatchScore: number; // 0-100
  educationMatchScore: number; // 0-100
  experienceMatchScore: number; // 0-100
  performanceScore: number; // 0-100
  readinessScore: number; // 0-100
  
  // Detailed breakdown
  matchedSkills: string[];
  missingSkills: string[];
  matchedInterests: string[];
  strengthAlignment: string[];
  
  // Recommendations
  learningPath: string[];
  estimatedTimeToReady: string;
  nextSteps: string[];
  
  // Metadata
  recommendationReason: string[];
  csvDatasetScore: number; // Original score from CSV
  source: 'csv' | 'mongodb' | 'hybrid';
}

/**
 * Weights for different scoring components
 */
interface ScoringWeights {
  skills: number;
  interests: number;
  education: number;
  experience: number;
  performance: number;
  readiness: number;
}

/**
 * Assessment-based Career Matching Service
 * Integrates CSV dataset with multi-phase assessment data
 */
class AssessmentCareerMatcherService {
  // Default weights (can be tuned based on user journey stage)
  private defaultWeights: ScoringWeights = {
    skills: 0.30,
    interests: 0.20,
    education: 0.10,
    experience: 0.05,
    performance: 0.25,
    readiness: 0.10,
  };

  /**
   * Generate career recommendations based on complete assessment profile
   */
  async matchCareersFromAssessment(
    profile: UserAssessmentProfile,
    options: {
      topN?: number;
      weights?: Partial<ScoringWeights>;
      includeMongoDBCareers?: boolean;
    } = {}
  ): Promise<EnhancedCareerMatch[]> {
    const {
      topN = 10,
      weights = {},
      includeMongoDBCareers = true,
    } = options;

    const scoringWeights: ScoringWeights = {
      ...this.defaultWeights,
      ...weights,
    };

    // Get CSV-based matches
    const csvMatches = await this.matchFromCSVDataset(profile, scoringWeights);

    let allMatches = csvMatches;

    // Optionally include MongoDB career matches for hybrid recommendations
    if (includeMongoDBCareers) {
      const mongoMatches = await this.matchFromMongoDBCareers(profile, scoringWeights);
      allMatches = this.mergeCareers(csvMatches, mongoMatches);
    }

    // Sort by overall score
    allMatches.sort((a, b) => b.overallScore - a.overallScore);

    return allMatches.slice(0, topN);
  }

  /**
   * Match careers from CSV dataset
   */
  private async matchFromCSVDataset(
    profile: UserAssessmentProfile,
    weights: ScoringWeights
  ): Promise<EnhancedCareerMatch[]> {
    const matches: EnhancedCareerMatch[] = [];

    // Search careers using CSV service
    const csvResults = csvCareerDatasetService.searchCareers(
      profile.skills,
      profile.interests
    );

    for (const result of csvResults) {
      const careerSkills = csvCareerDatasetService.getCareerSkills(result.careerTitle);
      const careerInterests = csvCareerDatasetService.getCareerInterests(result.careerTitle);

      // Calculate component scores
      const skillScore = this.calculateSkillMatch(profile.skills, careerSkills);
      const interestScore = this.calculateInterestMatch(profile.interests, careerInterests);
      const educationScore = this.calculateEducationMatch(
        profile.education || '',
        result.careerTitle
      );
      const experienceScore = this.calculateExperienceMatch(profile.experience || '');
      const performanceScore = this.calculatePerformanceScore(profile);
      const readinessScore = this.calculateReadinessScore(profile);

      // Weighted overall score
      const overallScore = Math.round(
        skillScore * weights.skills * 100 +
        interestScore * weights.interests * 100 +
        educationScore * weights.education * 100 +
        experienceScore * weights.experience * 100 +
        performanceScore * weights.performance * 100 +
        readinessScore * weights.readiness * 100
      );

      // Identify matched and missing skills
      const matchedSkills = this.findMatchedSkills(profile.skills, careerSkills);
      const missingSkills = careerSkills.filter(
        (skill) => !matchedSkills.some((ms) => this.skillsMatch(ms, skill))
      );

      const matchedInterests = this.findMatchedInterests(profile.interests, careerInterests);
      const strengthAlignment = this.alignStrengths(profile.strengths, careerSkills);

      const match: EnhancedCareerMatch = {
        careerTitle: result.careerTitle,
        overallScore: Math.min(100, Math.max(0, overallScore)),
        confidenceLevel: this.determineConfidence(overallScore),
        
        skillMatchScore: Math.round(skillScore * 100),
        interestMatchScore: Math.round(interestScore * 100),
        educationMatchScore: Math.round(educationScore * 100),
        experienceMatchScore: Math.round(experienceScore * 100),
        performanceScore: Math.round(performanceScore * 100),
        readinessScore: Math.round(readinessScore * 100),
        
        matchedSkills,
        missingSkills: missingSkills.slice(0, 5),
        matchedInterests,
        strengthAlignment,
        
        learningPath: this.generateLearningPath(missingSkills, profile),
        estimatedTimeToReady: this.estimateReadinessTime(missingSkills.length, profile),
        nextSteps: this.generateNextSteps(missingSkills, profile, result.careerTitle),
        
        recommendationReason: this.generateReasons(
          skillScore,
          interestScore,
          performanceScore,
          matchedSkills,
          profile
        ),
        csvDatasetScore: result.averageRecommendationScore,
        source: 'csv',
      };

      matches.push(match);
    }

    return matches;
  }

  /**
   * Match careers from MongoDB (existing Career collection)
   */
  private async matchFromMongoDBCareers(
    profile: UserAssessmentProfile,
    weights: ScoringWeights
  ): Promise<EnhancedCareerMatch[]> {
    const matches: EnhancedCareerMatch[] = [];

    try {
      // Get all careers with skill/interest mappings
      const careers = await prisma.career.findMany({
        include: {
          skillMappings: true,
          interestMappings: true,
        },
      });

      for (const career of careers) {
        const careerSkills = career.skillMappings.map((m) => m.skill);
        const careerInterests = career.interestMappings.map((m) => m.interest);

        const skillScore = this.calculateSkillMatch(profile.skills, careerSkills);
        const interestScore = this.calculateInterestMatch(profile.interests, careerInterests);
        const educationScore = this.normalizeEducation(profile.education || '');
        const experienceScore = this.calculateExperienceMatch(profile.experience || '');
        const performanceScore = this.calculatePerformanceScore(profile);
        const readinessScore = this.calculateReadinessScore(profile);

        const overallScore = Math.round(
          skillScore * weights.skills * 100 +
          interestScore * weights.interests * 100 +
          educationScore * weights.education * 100 +
          experienceScore * weights.experience * 100 +
          performanceScore * weights.performance * 100 +
          readinessScore * weights.readiness * 100
        );

        if (overallScore < 30) continue; // Filter low-scoring careers

        const matchedSkills = this.findMatchedSkills(profile.skills, careerSkills);
        const missingSkills = careerSkills.filter(
          (skill) => !matchedSkills.some((ms) => this.skillsMatch(ms, skill))
        );

        matches.push({
          careerTitle: career.title,
          overallScore: Math.min(100, Math.max(0, overallScore)),
          confidenceLevel: this.determineConfidence(overallScore),
          
          skillMatchScore: Math.round(skillScore * 100),
          interestMatchScore: Math.round(interestScore * 100),
          educationMatchScore: Math.round(educationScore * 100),
          experienceMatchScore: Math.round(experienceScore * 100),
          performanceScore: Math.round(performanceScore * 100),
          readinessScore: Math.round(readinessScore * 100),
          
          matchedSkills,
          missingSkills: missingSkills.slice(0, 5),
          matchedInterests: this.findMatchedInterests(profile.interests, careerInterests),
          strengthAlignment: this.alignStrengths(profile.strengths, careerSkills),
          
          learningPath: this.generateLearningPath(missingSkills, profile),
          estimatedTimeToReady: this.estimateReadinessTime(missingSkills.length, profile),
          nextSteps: this.generateNextSteps(missingSkills, profile, career.title),
          
          recommendationReason: this.generateReasons(
            skillScore,
            interestScore,
            performanceScore,
            matchedSkills,
            profile
          ),
          csvDatasetScore: 0,
          source: 'mongodb',
        });
      }
    } catch (error) {
      console.error('Error matching MongoDB careers:', error);
    }

    return matches;
  }

  /**
   * Calculate skill match score (0-1)
   */
  private calculateSkillMatch(userSkills: string[], careerSkills: string[]): number {
    if (careerSkills.length === 0) return 0.5;
    if (userSkills.length === 0) return 0;

    const matchedCount = careerSkills.filter((careerSkill) =>
      userSkills.some((userSkill) => this.skillsMatch(userSkill, careerSkill))
    ).length;

    return matchedCount / careerSkills.length;
  }

  /**
   * Calculate interest match score (0-1)
   */
  private calculateInterestMatch(userInterests: string[], careerInterests: string[]): number {
    if (careerInterests.length === 0) return 0.5;
    if (userInterests.length === 0) return 0.3;

    const matchedCount = careerInterests.filter((careerInterest) =>
      userInterests.some((userInterest) => this.textsMatch(userInterest, careerInterest))
    ).length;

    return matchedCount / careerInterests.length;
  }

  /**
   * Calculate education match score (0-1)
   */
  private calculateEducationMatch(userEducation: string, careerTitle: string): number {
    return csvCareerDatasetService.calculateEducationMatch(userEducation, careerTitle);
  }

  /**
   * Calculate experience match score (0-1)
   */
  private calculateExperienceMatch(userExperience: string): number {
    const exp = userExperience.toLowerCase();

    if (exp.includes('5+') || exp.includes('senior') || exp.includes('expert')) return 1.0;
    if (exp.includes('3') || exp.includes('4') || exp.includes('mid')) return 0.8;
    if (exp.includes('1') || exp.includes('2') || exp.includes('junior')) return 0.6;
    if (exp.includes('fresher') || exp === '0' || exp === '') return 0.5;

    return 0.7;
  }

  /**
   * Calculate performance score based on assessment results (0-1)
   */
  private calculatePerformanceScore(profile: UserAssessmentProfile): number {
    let performanceScore = 0.5; // Default neutral score

    // Factor in technical assessment score
    if (profile.technicalAssessmentScore !== undefined) {
      performanceScore += profile.technicalAssessmentScore * 0.4;
    }

    // Factor in assessment confidence
    if (profile.assessmentConfidence !== undefined) {
      performanceScore += profile.assessmentConfidence * 0.3;
    }

    // Factor in correct answers ratio
    if (profile.correctAnswersRatio !== undefined) {
      performanceScore += profile.correctAnswersRatio * 0.3;
    }

    // Technical level bonus
    if (profile.technicalLevel === 'advanced') {
      performanceScore += 0.1;
    } else if (profile.technicalLevel === 'intermediate') {
      performanceScore += 0.05;
    }

    // Problem-solving bonus
    if (profile.problemSolving === 'high') {
      performanceScore += 0.1;
    } else if (profile.problemSolving === 'medium') {
      performanceScore += 0.05;
    }

    return Math.min(1, performanceScore);
  }

  /**
   * Calculate career readiness score (0-1)
   */
  private calculateReadinessScore(profile: UserAssessmentProfile): number {
    let readinessScore = 0.5; // Default

    if (profile.readinessLevel === 'ready') {
      readinessScore = 0.9;
    } else if (profile.readinessLevel === 'developing') {
      readinessScore = 0.7;
    } else if (profile.readinessLevel === 'starting') {
      readinessScore = 0.5;
    }

    // Interview confidence factor
    if (profile.interviewConfidence === 'high') {
      readinessScore += 0.1;
    } else if (profile.interviewConfidence === 'low') {
      readinessScore -= 0.1;
    }

    return Math.min(1, Math.max(0, readinessScore));
  }

  /**
   * Check if two skills match (partial matching)
   */
  private skillsMatch(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase().trim();
    const s2 = skill2.toLowerCase().trim();

    if (s1 === s2) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Handle common aliases
    const aliases: Record<string, string[]> = {
      'javascript': ['js', 'node.js', 'nodejs'],
      'python': ['py'],
      'machine learning': ['ml', 'ai', 'artificial intelligence'],
      'ui/ux': ['ux', 'ui', 'user experience', 'user interface'],
    };

    for (const [key, values] of Object.entries(aliases)) {
      if ((s1 === key || values.includes(s1)) && (s2 === key || values.includes(s2))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two texts match (for interests, etc.)
   */
  private textsMatch(text1: string, text2: string): boolean {
    const t1 = text1.toLowerCase().trim();
    const t2 = text2.toLowerCase().trim();

    return t1 === t2 || t1.includes(t2) || t2.includes(t1);
  }

  /**
   * Find matched skills between user and career
   */
  private findMatchedSkills(userSkills: string[], careerSkills: string[]): string[] {
    return userSkills.filter((userSkill) =>
      careerSkills.some((careerSkill) => this.skillsMatch(userSkill, careerSkill))
    );
  }

  /**
   * Find matched interests
   */
  private findMatchedInterests(userInterests: string[], careerInterests: string[]): string[] {
    return userInterests.filter((userInterest) =>
      careerInterests.some((careerInterest) => this.textsMatch(userInterest, careerInterest))
    );
  }

  /**
   * Align user strengths with career skills
   */
  private alignStrengths(strengths: string[], careerSkills: string[]): string[] {
    return strengths.filter((strength) =>
      careerSkills.some((skill) => this.textsMatch(strength, skill))
    );
  }

  /**
   * Generate learning path for missing skills
   */
  private generateLearningPath(missingSkills: string[], profile: UserAssessmentProfile): string[] {
    const path: string[] = [];

    // Prioritize based on technical level
    const isBeginner = profile.technicalLevel === 'beginner' || !profile.technicalLevel;

    if (isBeginner && missingSkills.length > 0) {
      path.push('Start with foundational concepts and basic tutorials');
    }

    // Add top 3 missing skills
    missingSkills.slice(0, 3).forEach((skill) => {
      path.push(`Learn ${skill}`);
    });

    if (missingSkills.length > 3) {
      path.push(`Build projects using ${missingSkills.slice(0, 2).join(' and ')}`);
    }

    return path;
  }

  /**
   * Estimate time to be career-ready
   */
  private estimateReadinessTime(missingSkillsCount: number, profile: UserAssessmentProfile): string {
    const baseMonths = missingSkillsCount * 1.5; // 1.5 months per skill

    // Adjust based on technical level
    let multiplier = 1;
    if (profile.technicalLevel === 'advanced') {
      multiplier = 0.5;
    } else if (profile.technicalLevel === 'intermediate') {
      multiplier = 0.75;
    }

    const months = Math.ceil(baseMonths * multiplier);

    if (months <= 2) return '1-2 months';
    if (months <= 4) return '3-4 months';
    if (months <= 6) return '4-6 months';
    if (months <= 9) return '6-9 months';
    return '9-12 months';
  }

  /**
   * Generate actionable next steps
   */
  private generateNextSteps(
    missingSkills: string[],
    profile: UserAssessmentProfile,
    careerTitle: string
  ): string[] {
    const steps: string[] = [];

    if (missingSkills.length === 0) {
      steps.push(`You're ready to apply for ${careerTitle} roles`);
      steps.push('Build a strong portfolio showcasing your skills');
      steps.push('Practice technical interviews and coding challenges');
    } else {
      if (missingSkills.length > 0) {
        steps.push(`Focus on learning ${missingSkills[0]}`);
      }
      if (profile.readinessLevel === 'starting') {
        steps.push('Complete foundational courses in your area of interest');
      }
      steps.push(`Build projects related to ${careerTitle}`);
      steps.push('Participate in community forums and contribute to open source');
    }

    return steps;
  }

  /**
   * Generate recommendation reasons
   */
  private generateReasons(
    skillScore: number,
    interestScore: number,
    performanceScore: number,
    matchedSkills: string[],
    profile: UserAssessmentProfile
  ): string[] {
    const reasons: string[] = [];

    if (skillScore > 0.7) {
      reasons.push(`Strong skill match: You already have ${Math.round(skillScore * 100)}% of required skills`);
    }

    if (matchedSkills.length > 0) {
      reasons.push(`Your skills in ${matchedSkills.slice(0, 2).join(', ')} are highly relevant`);
    }

    if (interestScore > 0.6) {
      reasons.push('Your interests align well with this career path');
    }

    if (performanceScore > 0.7) {
      reasons.push('Your assessment performance indicates strong potential for this role');
    }

    if (profile.technicalLevel === 'advanced') {
      reasons.push('Your advanced technical level is well-suited for this career');
    }

    if (reasons.length === 0) {
      reasons.push('This career path matches your profile and has good growth potential');
    }

    return reasons;
  }

  /**
   * Determine confidence level
   */
  private determineConfidence(score: number): 'high' | 'medium' | 'low' {
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Normalize education level to score
   */
  private normalizeEducation(education: string): number {
    const edu = education.toLowerCase();

    if (edu.includes('phd') || edu.includes('doctorate')) return 1.0;
    if (edu.includes('master')) return 0.9;
    if (edu.includes('bachelor')) return 0.8;
    if (edu.includes('diploma')) return 0.6;
    return 0.5;
  }

  /**
   * Merge CSV and MongoDB career matches (deduplicate by title)
   */
  private mergeCareers(
    csvMatches: EnhancedCareerMatch[],
    mongoMatches: EnhancedCareerMatch[]
  ): EnhancedCareerMatch[] {
    const careerMap = new Map<string, EnhancedCareerMatch>();

    // Add CSV matches first (prioritize)
    csvMatches.forEach((match) => {
      careerMap.set(match.careerTitle.toLowerCase(), match);
    });

    // Add MongoDB matches if not already present
    mongoMatches.forEach((match) => {
      const key = match.careerTitle.toLowerCase();
      if (!careerMap.has(key)) {
        careerMap.set(key, match);
      } else {
        // If exists, mark as hybrid and take higher score
        const existing = careerMap.get(key)!;
        if (match.overallScore > existing.overallScore) {
          match.source = 'hybrid';
          careerMap.set(key, match);
        } else {
          existing.source = 'hybrid';
        }
      }
    });

    return Array.from(careerMap.values());
  }

  /**
   * Build user profile from database assessment data
   */
  async buildUserProfileFromAssessment(userId: string): Promise<UserAssessmentProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          age: true,
          education: true,
          experience: true,
          skills: true,
          interests: true,
        },
      });

      if (!user) return null;

      // Get latest assessment session
      const assessmentSession = await prisma.assessmentSession.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Get user assessment answers
      const assessmentAnswers = await prisma.userAssessmentAnswer.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Recent answers
      });

      // Build comprehensive profile
      const profile: UserAssessmentProfile = {
        userId: user.id,
        age: user.age || undefined,
        education: user.education || undefined,
        experience: user.experience || undefined,
        interests: user.interests || [],
        skills: user.skills || [],
        capabilities: [],
        strengths: [],
        tools: [],
        domains: [],
      };

      // Extract data from assessment answers
      if (assessmentAnswers.length > 0) {
        // Analyze correct answers for performance score
        const correctCount = assessmentAnswers.filter((ans) => {
          // This is a simplified check - adjust based on your answer schema
          return ans.selectedAnswer.length > 0;
        }).length;

        profile.correctAnswersRatio = correctCount / assessmentAnswers.length;
        profile.technicalAssessmentScore = profile.correctAnswersRatio;
      }

      // Set defaults
      profile.assessmentConfidence = assessmentSession ? 0.7 : 0.5;

      return profile;
    } catch (error) {
      console.error('Error building user profile:', error);
      return null;
    }
  }
}

export const assessmentCareerMatcherService = new AssessmentCareerMatcherService();
