import express, { Request, Response } from 'express';
import { InterestScoringEngine } from './interestScoringEngine';
import { INTEREST_QUESTIONS } from './InterestProfile';

const router = express.Router();

const interestStore: Record<string, any> = {};

router.post('/start', (req: Request, res: Response) => {
  const { userId, persona, goal, currentStage } = req.body;

  if (!userId || !persona) {
    return res.status(400).json({ error: 'Missing Phase 1 context' });
  }

  interestStore[userId] = {
    userId,
    phase1Context: { persona, goal, currentStage },
    answers: {},
    startedAt: new Date(),
  };

  return res.status(200).json({
    message: 'Interest discovery started',
    firstQuestion: INTEREST_QUESTIONS[0],
  });
});

router.post('/answer', (req: Request, res: Response) => {
  const { userId, questionId, answer } = req.body;

  if (!interestStore[userId]) {
    return res.status(404).json({ error: 'Session not found' });
  }

  interestStore[userId].answers[questionId] = answer;

  const currentScores = InterestScoringEngine.calculateScores(userId, interestStore[userId].answers);
  const answeredCount = Object.keys(interestStore[userId].answers).length;

  const shouldContinue = InterestScoringEngine.shouldContinue(answeredCount, currentScores.confidence);

  if (!shouldContinue) {
    interestStore[userId].result = currentScores;
    return res.status(200).json({
      isComplete: true,
      result: currentScores,
      recommendedNextPhase: 'CapabilityEngine',
    });
  }

  return res.status(200).json({
    isComplete: false,
    nextQuestion: INTEREST_QUESTIONS[answeredCount],
    currentConfidence: currentScores.confidence,
  });
});

router.get('/result', (req: Request, res: Response) => {
  const userId = String(req.query.userId || '');
  if (!interestStore[userId]?.result) {
    return res.status(404).json({ error: 'Result not found' });
  }
  return res.status(200).json(interestStore[userId].result);
});

export default router;
