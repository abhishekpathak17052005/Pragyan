import { CapabilityProfile, CAPABILITY_CHALLENGES } from './CapabilityProfile';

export class CapabilityScoringEngine {
  private static readonly VERSION = '1.0.0';
  private static readonly MIN_CHALLENGES = 6;
  private static readonly MAX_CHALLENGES = 15;
  private static readonly CONFIDENCE_THRESHOLD = 85;

  public static calculateScores(userId: string, data: any): CapabilityProfile {
    const { answers, signals } = data;
    const scores: Record<string, number> = {};
    let totalConfidence = 0;

    for (const [cId, answer] of Object.entries(answers)) {
      const challenge = CAPABILITY_CHALLENGES.find((c) => c.id === cId);
      if (!challenge) continue;

      if (challenge.type === 'scenario') {
        const option = challenge.options?.find((o) => o.text === answer);
        if (option) {
          for (const [capability, weight] of Object.entries(option.impact)) {
            scores[capability] = (scores[capability] || 0) + (weight as number);
          }
        }
      } else if (challenge.type === 'logical') {
        if (answer === challenge.pattern) {
          scores['Logical Thinking'] = (scores['Logical Thinking'] || 0) + 20;
          scores['Problem Solving'] = (scores['Problem Solving'] || 0) + 10;
        }
      } else if (challenge.type === 'planning') {
        if (JSON.stringify(answer) === JSON.stringify(challenge.correctOrder)) {
          scores['Time Management'] = (scores['Time Management'] || 0) + 20;
          scores['Critical Thinking'] = (scores['Critical Thinking'] || 0) + 10;
        }
      }

      totalConfidence += 8;
    }

    const sortedCapabilities = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topStrengths = sortedCapabilities.slice(0, 3).map((c) => c[0]);
    const developmentAreas = sortedCapabilities.slice(-2).map((c) => c[0]);
    const avgScore = sortedCapabilities.length > 0 ? sortedCapabilities.reduce((acc, c) => acc + c[1], 0) / sortedCapabilities.length : 0;

    let recommendedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
    if (avgScore > 25) recommendedDifficulty = 'Advanced';
    else if (avgScore > 15) recommendedDifficulty = 'Intermediate';

    return {
      userId,
      capabilityScores: scores,
      topStrengths,
      developmentAreas,
      behaviorSignals: {
        timeToAnswer: signals.timeToAnswer || 0,
        retryCount: signals.retryCount || 0,
        hintUsage: signals.hintUsage || 0,
        completionRate: (Object.keys(answers).length / CAPABILITY_CHALLENGES.length) * 100,
      },
      confidence: Math.min(95, Math.max(50, totalConfidence)),
      recommendedDifficulty,
      assessmentVersion: this.VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public static shouldContinue(answeredCount: number, confidence: number): boolean {
    if (answeredCount >= this.MAX_CHALLENGES) return false;
    if (answeredCount < this.MIN_CHALLENGES) return true;
    return confidence < this.CONFIDENCE_THRESHOLD;
  }
}
