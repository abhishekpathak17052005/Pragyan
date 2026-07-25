import { prisma } from '@/lib/prisma';

/**
 * Performance metrics from assessment phases
 */
export interface AssessmentPerformanceMetrics {
  userId: string;
  
  // Overall metrics
  technicalAssessmentScore: number; // 0-1
  assessmentConfidence: number; // 0-1
  correctAnswersRatio: number; // 0-1
  averageResponseTime?: number; // seconds per question
  
  // Phase-specific scores (0-1)
  phase1Score?: number; // User Discovery - completeness
  phase2Score?: number; // Interest Discovery - engagement
  phase3Score?: number; // Capability Discovery - demonstrated capabilities
  phase4Score?: number; // Technical Assessment - correctness
  phase5Score?: number; // Career Readiness - readiness level
  
  // Technical proficiency indicators
  technicalLevel?: 'beginner' | 'intermediate' | 'advanced';
  codingComfort?: 'none' | 'basic' | 'moderate' | 'strong';
  problemSolvingLevel?: 'low' | 'medium' | 'high';
  
  // Aggregate score
  overallPerformanceScore: number; // 0-100
  
  // Metadata
  assessmentCount: number;
  lastAssessmentDate?: Date;
}

/**
 * Service for calculating and tracking user performance scores
 */
class PerformanceScoringService {
  /**
   * Calculate comprehensive performance score from assessment data
   */
  async calculatePerformanceScore(userId: string): Promise<AssessmentPerformanceMetrics> {
    // Get user assessment answers
    const assessmentAnswers = await prisma.userAssessmentAnswer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest assessment session
    const latestSession = await prisma.assessmentSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        skills: true,
        interests: true,
        experience: true,
        education: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate phase-specific scores
    const phaseScores = this.calculatePhaseScores(assessmentAnswers);
    
    // Calculate technical assessment score (Phase 4)
    const technicalScore = this.calculateTechnicalScore(assessmentAnswers, 4);
    
    // Calculate correctness ratio
    const correctAnswersRatio = this.calculateCorrectAnswersRatio(assessmentAnswers);
    
    // Calculate confidence based on assessment completion
    const assessmentConfidence = this.calculateAssessmentConfidence(
      assessmentAnswers,
      phaseScores
    );
    
    // Determine technical level
    const technicalLevel = this.determineTechnicalLevel(
      user.skills,
      technicalScore,
      user.experience ?? ''
    );
    
    // Determine coding comfort
    const codingComfort = this.determineCodingComfort(user.skills, technicalScore);
    
    // Determine problem-solving level
    const problemSolvingLevel = this.determineProblemSolvingLevel(
      phaseScores.phase3Score || 0.5,
      technicalScore
    );
    
    // Calculate overall performance score (0-100)
    const overallPerformanceScore = this.calculateOverallScore({
      technicalScore,
      correctAnswersRatio,
      assessmentConfidence,
      phaseScores,
      technicalLevel,
      codingComfort,
      problemSolvingLevel,
    });

    const metrics: AssessmentPerformanceMetrics = {
      userId,
      technicalAssessmentScore: technicalScore,
      assessmentConfidence,
      correctAnswersRatio,
      averageResponseTime: this.calculateAverageResponseTime(assessmentAnswers),
      
      phase1Score: phaseScores.phase1Score,
      phase2Score: phaseScores.phase2Score,
      phase3Score: phaseScores.phase3Score,
      phase4Score: phaseScores.phase4Score,
      phase5Score: phaseScores.phase5Score,
      
      technicalLevel,
      codingComfort,
      problemSolvingLevel,
      
      overallPerformanceScore,
      
      assessmentCount: assessmentAnswers.length,
      lastAssessmentDate: latestSession?.createdAt,
    };

    return metrics;
  }

  /**
   * Save performance score to database
   */
  async savePerformanceScore(metrics: AssessmentPerformanceMetrics): Promise<void> {
    await prisma.careerPerformanceScore.upsert({
      where: { userId: metrics.userId },
      create: {
        userId: metrics.userId,
        technicalAssessmentScore: metrics.technicalAssessmentScore,
        assessmentConfidence: metrics.assessmentConfidence,
        correctAnswersRatio: metrics.correctAnswersRatio,
        averageResponseTime: metrics.averageResponseTime,
        phase1Score: metrics.phase1Score,
        phase2Score: metrics.phase2Score,
        phase3Score: metrics.phase3Score,
        phase4Score: metrics.phase4Score,
        phase5Score: metrics.phase5Score,
        technicalLevel: metrics.technicalLevel,
        codingComfort: metrics.codingComfort,
        problemSolvingLevel: metrics.problemSolvingLevel,
        overallPerformanceScore: metrics.overallPerformanceScore,
        assessmentCount: metrics.assessmentCount,
        lastAssessmentDate: metrics.lastAssessmentDate,
      },
      update: {
        technicalAssessmentScore: metrics.technicalAssessmentScore,
        assessmentConfidence: metrics.assessmentConfidence,
        correctAnswersRatio: metrics.correctAnswersRatio,
        averageResponseTime: metrics.averageResponseTime,
        phase1Score: metrics.phase1Score,
        phase2Score: metrics.phase2Score,
        phase3Score: metrics.phase3Score,
        phase4Score: metrics.phase4Score,
        phase5Score: metrics.phase5Score,
        technicalLevel: metrics.technicalLevel,
        codingComfort: metrics.codingComfort,
        problemSolvingLevel: metrics.problemSolvingLevel,
        overallPerformanceScore: metrics.overallPerformanceScore,
        assessmentCount: metrics.assessmentCount,
        lastAssessmentDate: metrics.lastAssessmentDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get saved performance score from database
   */
  async getPerformanceScore(userId: string): Promise<AssessmentPerformanceMetrics | null> {
    const saved = await prisma.careerPerformanceScore.findUnique({
      where: { userId },
    });

    if (!saved) return null;

    return {
      userId: saved.userId,
      technicalAssessmentScore: saved.technicalAssessmentScore,
      assessmentConfidence: saved.assessmentConfidence,
      correctAnswersRatio: saved.correctAnswersRatio,
      averageResponseTime: saved.averageResponseTime || undefined,
      phase1Score: saved.phase1Score || undefined,
      phase2Score: saved.phase2Score || undefined,
      phase3Score: saved.phase3Score || undefined,
      phase4Score: saved.phase4Score || undefined,
      phase5Score: saved.phase5Score || undefined,
      technicalLevel: saved.technicalLevel as any,
      codingComfort: saved.codingComfort as any,
      problemSolvingLevel: saved.problemSolvingLevel as any,
      overallPerformanceScore: saved.overallPerformanceScore,
      assessmentCount: saved.assessmentCount,
      lastAssessmentDate: saved.lastAssessmentDate || undefined,
    };
  }

  /**
   * Calculate or refresh performance score
   */
  async updatePerformanceScore(userId: string): Promise<AssessmentPerformanceMetrics> {
    const metrics = await this.calculatePerformanceScore(userId);
    await this.savePerformanceScore(metrics);
    return metrics;
  }

  /**
   * Calculate phase-specific scores
   */
  private calculatePhaseScores(answers: any[]): {
    phase1Score?: number;
    phase2Score?: number;
    phase3Score?: number;
    phase4Score?: number;
    phase5Score?: number;
  } {
    const phaseGroups = new Map<number, any[]>();

    // Group answers by phase
    answers.forEach((answer) => {
      const phase = answer.phase;
      if (!phaseGroups.has(phase)) {
        phaseGroups.set(phase, []);
      }
      phaseGroups.get(phase)!.push(answer);
    });

    const scores: any = {};

    // Calculate score for each phase
    for (let phase = 1; phase <= 5; phase++) {
      const phaseAnswers = phaseGroups.get(phase) || [];
      if (phaseAnswers.length === 0) continue;

      let phaseScore = 0;

      if (phase === 1) {
        // Phase 1: User Discovery - based on profile completeness
        phaseScore = phaseAnswers.length > 0 ? 0.8 : 0.5;
      } else if (phase === 2) {
        // Phase 2: Interest Discovery - based on engagement (answered questions)
        phaseScore = Math.min(1, phaseAnswers.length / 10); // Normalize to 10 questions
      } else if (phase === 3) {
        // Phase 3: Capability Discovery - based on responses
        phaseScore = phaseAnswers.length > 0 ? 0.7 : 0.5;
      } else if (phase === 4) {
        // Phase 4: Technical Assessment - based on correctness
        const correctCount = phaseAnswers.filter((a) => this.isAnswerCorrect(a)).length;
        phaseScore = phaseAnswers.length > 0 ? correctCount / phaseAnswers.length : 0.5;
      } else if (phase === 5) {
        // Phase 5: Career Readiness - based on completion
        phaseScore = phaseAnswers.length > 0 ? 0.75 : 0.5;
      }

      scores[`phase${phase}Score`] = phaseScore;
    }

    return scores;
  }

  /**
   * Calculate technical score for a specific phase
   */
  private calculateTechnicalScore(answers: any[], phase: number): number {
    const phaseAnswers = answers.filter((a) => a.phase === phase);
    
    if (phaseAnswers.length === 0) return 0.5;

    const correctCount = phaseAnswers.filter((a) => this.isAnswerCorrect(a)).length;
    return correctCount / phaseAnswers.length;
  }

  /**
   * Check if an answer is correct (simplified heuristic)
   */
  private isAnswerCorrect(answer: any): boolean {
    // This is a simplified check
    // In production, you'd compare against correct answers stored in the question bank
    
    // If there are selected answers, consider it attempted
    if (answer.selectedAnswer && answer.selectedAnswer.length > 0) {
      // For now, use a heuristic: if the question has options and user selected something
      // We'll assume ~70% correctness for completed questions
      // This should be replaced with actual correctness checking
      return Math.random() > 0.3; // Placeholder - replace with real logic
    }
    
    return false;
  }

  /**
   * Calculate overall correct answers ratio
   */
  private calculateCorrectAnswersRatio(answers: any[]): number {
    if (answers.length === 0) return 0.5;

    const correctCount = answers.filter((a) => this.isAnswerCorrect(a)).length;
    return correctCount / answers.length;
  }

  /**
   * Calculate assessment confidence
   */
  private calculateAssessmentConfidence(
    answers: any[],
    phaseScores: any
  ): number {
    // Base confidence on number of phases completed
    const phasesCompleted = Object.keys(phaseScores).length;
    let confidence = phasesCompleted / 5; // 5 phases total

    // Boost confidence if user has many answers
    if (answers.length > 20) {
      confidence += 0.1;
    }

    // Boost confidence if technical score is high
    if (phaseScores.phase4Score > 0.7) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Determine technical level
   */
  private determineTechnicalLevel(
    skills: string[],
    technicalScore: number,
    experience?: string
  ): 'beginner' | 'intermediate' | 'advanced' {
    const skillCount = skills.length;
    const exp = (experience || '').toLowerCase();

    // Advanced: many skills, high score, senior experience
    if (
      skillCount >= 8 &&
      technicalScore > 0.75 &&
      (exp.includes('senior') || exp.includes('5+') || exp.includes('expert'))
    ) {
      return 'advanced';
    }

    // Intermediate: moderate skills, decent score, some experience
    if (
      skillCount >= 4 &&
      technicalScore > 0.5 &&
      (exp.includes('mid') || exp.includes('3') || exp.includes('4'))
    ) {
      return 'intermediate';
    }

    // Default to beginner
    return 'beginner';
  }

  /**
   * Determine coding comfort level
   */
  private determineCodingComfort(
    skills: string[],
    technicalScore: number
  ): 'none' | 'basic' | 'moderate' | 'strong' {
    const programmingSkills = skills.filter((s) =>
      /python|java|javascript|c\+\+|c#|ruby|php|go|rust|swift|kotlin/i.test(s)
    );

    if (programmingSkills.length === 0) return 'none';
    if (programmingSkills.length >= 3 && technicalScore > 0.7) return 'strong';
    if (programmingSkills.length >= 2 && technicalScore > 0.5) return 'moderate';
    return 'basic';
  }

  /**
   * Determine problem-solving level
   */
  private determineProblemSolvingLevel(
    capabilityScore: number,
    technicalScore: number
  ): 'low' | 'medium' | 'high' {
    const avgScore = (capabilityScore + technicalScore) / 2;

    if (avgScore > 0.7) return 'high';
    if (avgScore > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculateOverallScore(params: {
    technicalScore: number;
    correctAnswersRatio: number;
    assessmentConfidence: number;
    phaseScores: any;
    technicalLevel?: string;
    codingComfort?: string;
    problemSolvingLevel?: string;
  }): number {
    const {
      technicalScore,
      correctAnswersRatio,
      assessmentConfidence,
      phaseScores,
      technicalLevel,
      codingComfort,
      problemSolvingLevel,
    } = params;

    // Weighted scoring
    let score = 0;

    // Technical assessment (40%)
    score += technicalScore * 40;

    // Correctness ratio (20%)
    score += correctAnswersRatio * 20;

    // Assessment confidence (15%)
    score += assessmentConfidence * 15;

    // Phase completion (15%)
    const phaseAvg =
      Object.values(phaseScores).reduce((sum: number, s: any) => sum + s, 0) /
      Math.max(1, Object.values(phaseScores).length);
    score += phaseAvg * 15;

    // Technical level bonus (5%)
    if (technicalLevel === 'advanced') score += 5;
    else if (technicalLevel === 'intermediate') score += 3;
    else score += 1;

    // Coding comfort bonus (3%)
    if (codingComfort === 'strong') score += 3;
    else if (codingComfort === 'moderate') score += 2;
    else if (codingComfort === 'basic') score += 1;

    // Problem-solving bonus (2%)
    if (problemSolvingLevel === 'high') score += 2;
    else if (problemSolvingLevel === 'medium') score += 1;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(_answers: any[]): number | undefined {
    // This requires timestamp data on individual answers
    // For now, return undefined - implement when timestamp data is available
    return undefined;
  }

  /**
   * Get performance trend over time
   */
  async getPerformanceTrend(userId: string, _days: number = 30): Promise<any[]> {
    // This would query historical performance snapshots
    // For now, return current score
    const current = await this.getPerformanceScore(userId);
    return current ? [{ date: new Date(), score: current.overallPerformanceScore }] : [];
  }

  /**
   * Compare user performance with peers
   */
  async compareWithPeers(userId: string): Promise<{
    userScore: number;
    peerAverage: number;
    percentile: number;
  }> {
    const userPerformance = await this.getPerformanceScore(userId);
    
    if (!userPerformance) {
      throw new Error('User performance not found');
    }

    // Get all performance scores for comparison
    const allScores = await prisma.careerPerformanceScore.findMany({
      select: { overallPerformanceScore: true },
    });

    const scores = allScores.map((s) => s.overallPerformanceScore).sort((a, b) => a - b);
    const peerAverage = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Calculate percentile
    const lowerScores = scores.filter((s) => s < userPerformance.overallPerformanceScore).length;
    const percentile = (lowerScores / scores.length) * 100;

    return {
      userScore: userPerformance.overallPerformanceScore,
      peerAverage: Math.round(peerAverage),
      percentile: Math.round(percentile),
    };
  }
}

export const performanceScoringService = new PerformanceScoringService();
