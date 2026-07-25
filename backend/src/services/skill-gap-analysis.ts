import { prisma } from '@/lib/prisma';
import { csvCareerDatasetService } from './csv-career-dataset';
import { performanceScoringService } from './performance-scoring';

/**
 * Skill with proficiency level
 */
export interface SkillWithProficiency {
  skill: string;
  proficiency: 'none' | 'beginner' | 'intermediate' | 'advanced';
  source: 'user' | 'assessment' | 'inferred';
}

/**
 * Priority skill to learn
 */
export interface PrioritySkill {
  skill: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedHours: number;
  prerequisites: string[];
  relatedSkills: string[];
}

/**
 * Course recommendation
 */
export interface CourseRecommendation {
  title: string;
  provider: string;
  url?: string;
  type: 'video' | 'article' | 'course' | 'practice' | 'project';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  free: boolean;
  skills: string[];
}

/**
 * Skill gap analysis result
 */
export interface SkillGapAnalysisResult {
  userId: string;
  careerTitle: string;
  
  // Current state
  currentSkills: SkillWithProficiency[];
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Required state
  requiredSkills: string[];
  
  // Gap analysis
  missingSkills: string[];
  partialSkills: string[]; // Skills user has but needs improvement
  masteredSkills: string[];
  
  // Priority ranking
  prioritySkills: PrioritySkill[];
  
  // Learning recommendations
  suggestedCourses: CourseRecommendation[];
  estimatedHours: number;
  estimatedMonths: number;
  
  // Progress tracking
  skillsInProgress: string[];
  completedSkills: string[];
  progressPercent: number;
  
  // Metadata
  analysisDate: Date;
  lastUpdated: Date;
}

/**
 * Skill Gap Analysis Service
 */
class SkillGapAnalysisService {
  /**
   * Analyze skill gaps for a career
   */
  async analyzeSkillGaps(
    userId: string,
    careerTitle: string,
    options: {
      includeCourseSuggestions?: boolean;
      prioritizeByMarketDemand?: boolean;
    } = {}
  ): Promise<SkillGapAnalysisResult> {
    const { includeCourseSuggestions = true, prioritizeByMarketDemand = true } = options;

    // Get user's current skills and performance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        skills: true,
        experience: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const performanceMetrics = await performanceScoringService.getPerformanceScore(userId);

    // Get required skills for the career from CSV dataset
    const requiredSkills = csvCareerDatasetService.getCareerSkills(careerTitle);

    if (requiredSkills.length === 0) {
      throw new Error(`Career "${careerTitle}" not found in dataset`);
    }

    // Build current skills with proficiency
    const currentSkills = this.buildCurrentSkillsProfile(
      user.skills,
      performanceMetrics?.technicalLevel || 'beginner'
    );

    // Identify skill gaps
    const { missingSkills, partialSkills, masteredSkills } = this.categorizeSkills(
      currentSkills,
      requiredSkills
    );

    // Prioritize skills
    const prioritySkills = this.prioritizeSkills(
      missingSkills,
      partialSkills,
      careerTitle,
      prioritizeByMarketDemand
    );

    // Generate course recommendations
    const suggestedCourses = includeCourseSuggestions
      ? this.generateCourseRecommendations(prioritySkills, currentSkills)
      : [];

    // Calculate time estimates
    const { estimatedHours, estimatedMonths } = this.calculateTimeEstimates(
      prioritySkills,
      performanceMetrics?.technicalLevel || 'beginner'
    );

    // Get skills in progress
    const skillsInProgress = await this.getSkillsInProgress(userId, careerTitle);
    const completedSkills = await this.getCompletedSkills(userId, careerTitle);

    // Calculate progress
    const progressPercent = this.calculateProgress(
      masteredSkills.length + completedSkills.length,
      requiredSkills.length
    );

    const result: SkillGapAnalysisResult = {
      userId,
      careerTitle,
      currentSkills,
      currentLevel: performanceMetrics?.technicalLevel || 'beginner',
      requiredSkills,
      missingSkills,
      partialSkills,
      masteredSkills,
      prioritySkills,
      suggestedCourses,
      estimatedHours,
      estimatedMonths,
      skillsInProgress,
      completedSkills,
      progressPercent,
      analysisDate: new Date(),
      lastUpdated: new Date(),
    };

    return result;
  }

  /**
   * Save skill gap analysis to database
   */
  async saveSkillGapAnalysis(analysis: SkillGapAnalysisResult): Promise<void> {
    await prisma.skillGapAnalysis.upsert({
      where: {
        userId_careerTitle: {
          userId: analysis.userId,
          careerTitle: analysis.careerTitle,
        },
      },
      create: {
        userId: analysis.userId,
        careerTitle: analysis.careerTitle,
        currentSkills: analysis.currentSkills.map((s) => s.skill),
        currentLevel: analysis.currentLevel,
        requiredSkills: analysis.requiredSkills,
        missingSkills: analysis.missingSkills,
        partialSkills: analysis.partialSkills,
        masteredSkills: analysis.masteredSkills,
        prioritySkills: analysis.prioritySkills as any,
        suggestedCourses: analysis.suggestedCourses as any,
        estimatedHours: analysis.estimatedHours,
        estimatedMonths: analysis.estimatedMonths,
        skillsInProgress: analysis.skillsInProgress,
        completedSkills: analysis.completedSkills,
        progressPercent: analysis.progressPercent,
        analysisSource: 'assessment',
        analysisDate: analysis.analysisDate,
      },
      update: {
        currentSkills: analysis.currentSkills.map((s) => s.skill),
        currentLevel: analysis.currentLevel,
        requiredSkills: analysis.requiredSkills,
        missingSkills: analysis.missingSkills,
        partialSkills: analysis.partialSkills,
        masteredSkills: analysis.masteredSkills,
        prioritySkills: analysis.prioritySkills as any,
        suggestedCourses: analysis.suggestedCourses as any,
        estimatedHours: analysis.estimatedHours,
        estimatedMonths: analysis.estimatedMonths,
        skillsInProgress: analysis.skillsInProgress,
        completedSkills: analysis.completedSkills,
        progressPercent: analysis.progressPercent,
        analysisDate: analysis.analysisDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get saved skill gap analysis
   */
  async getSkillGapAnalysis(
    userId: string,
    careerTitle: string
  ): Promise<SkillGapAnalysisResult | null> {
    const saved = await prisma.skillGapAnalysis.findUnique({
      where: {
        userId_careerTitle: {
          userId,
          careerTitle,
        },
      },
    });

    if (!saved) return null;

    return {
      userId: saved.userId,
      careerTitle: saved.careerTitle,
      currentSkills: saved.currentSkills.map((s) => ({
        skill: s,
        proficiency: 'intermediate' as any,
        source: 'user' as any,
      })),
      currentLevel: (saved.currentLevel || 'beginner') as any,
      requiredSkills: saved.requiredSkills,
      missingSkills: saved.missingSkills,
      partialSkills: saved.partialSkills,
      masteredSkills: saved.masteredSkills,
      prioritySkills: (saved.prioritySkills as any) || [],
      suggestedCourses: (saved.suggestedCourses as any) || [],
      estimatedHours: saved.estimatedHours || 0,
      estimatedMonths: saved.estimatedMonths || 0,
      skillsInProgress: saved.skillsInProgress,
      completedSkills: saved.completedSkills,
      progressPercent: saved.progressPercent,
      analysisDate: saved.analysisDate,
      lastUpdated: saved.updatedAt,
    };
  }

  /**
   * Mark skill as in progress
   */
  async markSkillInProgress(userId: string, careerTitle: string, skill: string): Promise<void> {
    const analysis = await prisma.skillGapAnalysis.findUnique({
      where: { userId_careerTitle: { userId, careerTitle } },
    });

    if (!analysis) {
      throw new Error('Skill gap analysis not found');
    }

    const skillsInProgress = [...analysis.skillsInProgress, skill];

    await prisma.skillGapAnalysis.update({
      where: { userId_careerTitle: { userId, careerTitle } },
      data: {
        skillsInProgress: Array.from(new Set(skillsInProgress)),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark skill as completed
   */
  async markSkillCompleted(userId: string, careerTitle: string, skill: string): Promise<void> {
    const analysis = await prisma.skillGapAnalysis.findUnique({
      where: { userId_careerTitle: { userId, careerTitle } },
    });

    if (!analysis) {
      throw new Error('Skill gap analysis not found');
    }

    const completedSkills = [...analysis.completedSkills, skill];
    const skillsInProgress = analysis.skillsInProgress.filter((s) => s !== skill);

    // Recalculate progress
    const progressPercent = this.calculateProgress(
      completedSkills.length + analysis.masteredSkills.length,
      analysis.requiredSkills.length
    );

    await prisma.skillGapAnalysis.update({
      where: { userId_careerTitle: { userId, careerTitle } },
      data: {
        completedSkills: Array.from(new Set(completedSkills)),
        skillsInProgress,
        progressPercent,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Build current skills profile with proficiency levels
   */
  private buildCurrentSkillsProfile(
    userSkills: string[],
    technicalLevel: string
  ): SkillWithProficiency[] {
    return userSkills.map((skill) => ({
      skill,
      proficiency: this.inferProficiency(skill, technicalLevel),
      source: 'user',
    }));
  }

  /**
   * Infer proficiency level based on technical level
   */
  private inferProficiency(
    _skill: string,
    technicalLevel: string
  ): 'none' | 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic - can be enhanced with ML
    if (technicalLevel === 'advanced') return 'advanced';
    if (technicalLevel === 'intermediate') return 'intermediate';
    return 'beginner';
  }

  /**
   * Categorize skills into missing, partial, and mastered
   */
  private categorizeSkills(
    currentSkills: SkillWithProficiency[],
    requiredSkills: string[]
  ): {
    missingSkills: string[];
    partialSkills: string[];
    masteredSkills: string[];
  } {
    const currentSkillSet = new Map(
      currentSkills.map((s) => [s.skill.toLowerCase(), s.proficiency])
    );

    const missingSkills: string[] = [];
    const partialSkills: string[] = [];
    const masteredSkills: string[] = [];

    requiredSkills.forEach((requiredSkill) => {
      const key = requiredSkill.toLowerCase();
      const proficiency = currentSkillSet.get(key);

      if (!proficiency) {
        // Check for partial matches
        const hasPartialMatch = Array.from(currentSkillSet.keys()).some(
          (currentSkill) => currentSkill.includes(key) || key.includes(currentSkill)
        );

        if (hasPartialMatch) {
          partialSkills.push(requiredSkill);
        } else {
          missingSkills.push(requiredSkill);
        }
      } else {
        if (proficiency === 'advanced') {
          masteredSkills.push(requiredSkill);
        } else if (proficiency === 'intermediate') {
          partialSkills.push(requiredSkill);
        } else {
          partialSkills.push(requiredSkill);
        }
      }
    });

    return { missingSkills, partialSkills, masteredSkills };
  }

  /**
   * Prioritize skills to learn
   */
  private prioritizeSkills(
    missingSkills: string[],
    partialSkills: string[],
    careerTitle: string,
    prioritizeByMarketDemand: boolean
  ): PrioritySkill[] {
    const prioritySkills: PrioritySkill[] = [];

    // High-demand skills (adjust based on market data)
    const highDemandSkills = new Set([
      'python',
      'javascript',
      'react',
      'node.js',
      'aws',
      'docker',
      'kubernetes',
      'machine learning',
      'data analysis',
      'sql',
    ]);

    // Foundational skills (should be learned first)
    const foundationalSkills = new Set([
      'programming basics',
      'git',
      'html',
      'css',
      'algorithms',
      'data structures',
    ]);

    // Process missing skills (critical priority)
    missingSkills.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'high';
      let reason = `Required for ${careerTitle}`;

      if (foundationalSkills.has(skillLower)) {
        priority = 'critical';
        reason = 'Foundational skill - learn first';
      } else if (prioritizeByMarketDemand && highDemandSkills.has(skillLower)) {
        priority = 'critical';
        reason = 'High market demand + required for role';
      }

      prioritySkills.push({
        skill,
        priority,
        reason,
        estimatedHours: this.estimateSkillLearningTime(skill, 'missing'),
        prerequisites: this.inferPrerequisites(skill),
        relatedSkills: this.findRelatedSkills(skill),
      });
    });

    // Process partial skills (medium priority)
    partialSkills.forEach((skill) => {
      prioritySkills.push({
        skill,
        priority: 'medium',
        reason: 'Improve existing knowledge',
        estimatedHours: this.estimateSkillLearningTime(skill, 'partial'),
        prerequisites: [],
        relatedSkills: this.findRelatedSkills(skill),
      });
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    prioritySkills.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return prioritySkills;
  }

  /**
   * Estimate learning time for a skill
   */
  private estimateSkillLearningTime(skill: string, status: 'missing' | 'partial'): number {
    const baseHours: Record<string, number> = {
      'programming basics': 60,
      python: 40,
      javascript: 40,
      'machine learning': 80,
      'data analysis': 50,
      react: 30,
      'node.js': 30,
      sql: 25,
      git: 10,
      docker: 20,
      kubernetes: 40,
    };

    const skillLower = skill.toLowerCase();
    const hours = baseHours[skillLower] || 30; // Default 30 hours

    return status === 'partial' ? hours * 0.5 : hours;
  }

  /**
   * Infer prerequisites for a skill
   */
  private inferPrerequisites(skill: string): string[] {
    const prerequisites: Record<string, string[]> = {
      'machine learning': ['Python', 'Mathematics', 'Statistics'],
      react: ['JavaScript', 'HTML', 'CSS'],
      'node.js': ['JavaScript'],
      kubernetes: ['Docker', 'Linux'],
      docker: ['Linux Basics'],
    };

    return prerequisites[skill.toLowerCase()] || [];
  }

  /**
   * Find related skills
   */
  private findRelatedSkills(skill: string): string[] {
    const related: Record<string, string[]> = {
      python: ['Data Analysis', 'Machine Learning', 'Django', 'Flask'],
      javascript: ['React', 'Node.js', 'TypeScript'],
      'machine learning': ['Deep Learning', 'TensorFlow', 'PyTorch'],
      react: ['Redux', 'Next.js', 'TypeScript'],
    };

    return related[skill.toLowerCase()] || [];
  }

  /**
   * Generate course recommendations
   */
  private generateCourseRecommendations(
    prioritySkills: PrioritySkill[],
    currentSkills: SkillWithProficiency[]
  ): CourseRecommendation[] {
    const courses: CourseRecommendation[] = [];
    const currentLevel = this.determineOverallLevel(currentSkills);

    // Generate recommendations for top priority skills
    prioritySkills.slice(0, 5).forEach((ps) => {
      // Add beginner course if missing
      if (ps.priority === 'critical' || ps.priority === 'high') {
        courses.push({
          title: `Complete ${ps.skill} Course`,
          provider: 'Recommended Platform',
          type: 'course',
          difficulty: currentLevel === 'beginner' ? 'beginner' : 'intermediate',
          estimatedHours: ps.estimatedHours,
          free: true,
          skills: [ps.skill],
        });

        // Add practice project
        courses.push({
          title: `Build a ${ps.skill} Project`,
          provider: 'Practice',
          type: 'project',
          difficulty: 'intermediate',
          estimatedHours: ps.estimatedHours * 0.5,
          free: true,
          skills: [ps.skill, ...ps.relatedSkills.slice(0, 2)],
        });
      }
    });

    return courses;
  }

  /**
   * Determine overall skill level
   */
  private determineOverallLevel(
    skills: SkillWithProficiency[]
  ): 'beginner' | 'intermediate' | 'advanced' {
    if (skills.length === 0) return 'beginner';

    const advancedCount = skills.filter((s) => s.proficiency === 'advanced').length;
    const intermediateCount = skills.filter((s) => s.proficiency === 'intermediate').length;

    if (advancedCount >= skills.length * 0.5) return 'advanced';
    if (intermediateCount >= skills.length * 0.5) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate time estimates
   */
  private calculateTimeEstimates(
    prioritySkills: PrioritySkill[],
    technicalLevel: string
  ): { estimatedHours: number; estimatedMonths: number } {
    const totalHours = prioritySkills.reduce((sum, ps) => sum + ps.estimatedHours, 0);

    // Adjust based on technical level
    let multiplier = 1;
    if (technicalLevel === 'advanced') multiplier = 0.6;
    else if (technicalLevel === 'intermediate') multiplier = 0.8;

    const adjustedHours = totalHours * multiplier;

    // Assume 10 hours per week study time
    const weeks = adjustedHours / 10;
    const months = Math.ceil(weeks / 4);

    return {
      estimatedHours: Math.round(adjustedHours),
      estimatedMonths: months,
    };
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(completedCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }

  /**
   * Get skills currently in progress
   */
  private async getSkillsInProgress(userId: string, careerTitle: string): Promise<string[]> {
    const analysis = await prisma.skillGapAnalysis.findUnique({
      where: { userId_careerTitle: { userId, careerTitle } },
      select: { skillsInProgress: true },
    });

    return analysis?.skillsInProgress || [];
  }

  /**
   * Get completed skills
   */
  private async getCompletedSkills(userId: string, careerTitle: string): Promise<string[]> {
    const analysis = await prisma.skillGapAnalysis.findUnique({
      where: { userId_careerTitle: { userId, careerTitle } },
      select: { completedSkills: true },
    });

    return analysis?.completedSkills || [];
  }
}

export const skillGapAnalysisService = new SkillGapAnalysisService();
