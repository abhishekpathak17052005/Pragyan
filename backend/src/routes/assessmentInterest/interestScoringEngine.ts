import { InterestProfile, INTEREST_QUESTIONS } from './InterestProfile';

export class InterestScoringEngine {
  private static readonly VERSION = '1.0.0';
  private static readonly MIN_QUESTIONS = 5;
  private static readonly MAX_QUESTIONS = 12;
  private static readonly CONFIDENCE_THRESHOLD = 80;

  public static calculateScores(userId: string, answers: Record<string, string>): InterestProfile {
    const scores: Record<string, number> = {};
    let totalConfidence = 0;

    for (const [qId, selectedOption] of Object.entries(answers)) {
      const question = INTEREST_QUESTIONS.find((q) => q.id === qId);
      if (!question) continue;

      const mapping = question.options[selectedOption];
      if (!mapping) continue;

      for (const [interest, weight] of Object.entries(mapping.interests)) {
        scores[interest] = (scores[interest] || 0) + (weight as number);
      }

      totalConfidence += 10;
    }

    const sortedInterests = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryInterest = sortedInterests[0]?.[0] || 'Exploring';
    const secondaryInterest = sortedInterests[1]?.[0] || 'General';
    const confidence = Math.min(95, Math.max(60, totalConfidence + (sortedInterests.length * 2)));

    return {
      userId,
      primaryInterest,
      secondaryInterest,
      interestScores: scores,
      answeredQuestions: Object.keys(answers),
      confidence,
      assessmentVersion: this.VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public static shouldContinue(answeredCount: number, confidence: number): boolean {
    if (answeredCount >= this.MAX_QUESTIONS) return false;
    if (answeredCount < this.MIN_QUESTIONS) return true;
    return confidence < this.CONFIDENCE_THRESHOLD;
  }
}
