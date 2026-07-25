/**
 * Pragyan Assessment Engine - Backend-Driven State Controller
 * Strictly controls the 15-question funnel mathematically.
 * 1-3: General | 4-7: Specific | 8-11: Specialization | 12-15: Depth
 */

export type AssessmentSection = 'General' | 'Specific' | 'Specialization' | 'Depth';

export interface AssessmentState {
  currentQuestionNumber: number;
  targetSection: AssessmentSection;
  isCompleted: boolean;
}

export class AdaptiveStateController {
  private static readonly MAX_QUESTIONS = 15;

  public static getTargetSection(questionNumber: number): AssessmentSection {
    if (questionNumber <= 3) return 'General';
    if (questionNumber <= 7) return 'Specific';
    if (questionNumber <= 11) return 'Specialization';
    return 'Depth';
  }

  public static getNextState(currentQuestionNumber: number): AssessmentState {
    const nextQuestionNumber = currentQuestionNumber + 1;

    if (nextQuestionNumber > this.MAX_QUESTIONS) {
      return {
        currentQuestionNumber: this.MAX_QUESTIONS,
        targetSection: 'Depth',
        isCompleted: true,
      };
    }

    return {
      currentQuestionNumber: nextQuestionNumber,
      targetSection: this.getTargetSection(nextQuestionNumber),
      isCompleted: false,
    };
  }

  public static shouldContinue(currentQuestionNumber: number): boolean {
    return currentQuestionNumber < this.MAX_QUESTIONS;
  }
}
