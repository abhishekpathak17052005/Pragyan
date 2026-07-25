import express, { Request, Response } from 'express';
import { CapabilityScoringEngine } from './capabilityScoringEngine';
import { CAPABILITY_CHALLENGES } from './CapabilityProfile';

const router = express.Router();
const capabilityStore: Record<string, any> = {};

router.post('/start', (req: Request, res: Response) => {
  const { userId, primaryInterest, secondaryInterest, interestScores } = req.body;

  if (!userId || !primaryInterest) {
    return res.status(400).json({ error: 'Missing Phase 2 context' });
  }

  capabilityStore[userId] = {
    userId,
    phase2Context: { primaryInterest, secondaryInterest, interestScores },
    answers: {},
    signals: { timeToAnswer: 0, retryCount: 0, hintUsage: 0 },
    startedAt: new Date(),
  };

  return res.status(200).json({
    message: 'Capability discovery started',
    firstChallenge: CAPABILITY_CHALLENGES[0],
  });
});

router.post('/answer', (req: Request, res: Response) => {
  const { userId, challengeId, answer, timeSpent, hintsUsed } = req.body;

  if (!capabilityStore[userId]) {
    return res.status(404).json({ error: 'Session not found' });
  }

  capabilityStore[userId].answers[challengeId] = answer;
  capabilityStore[userId].signals.timeToAnswer += timeSpent || 0;
  capabilityStore[userId].signals.hintUsage += hintsUsed || 0;

  const currentScores = CapabilityScoringEngine.calculateScores(userId, {
    answers: capabilityStore[userId].answers,
    signals: capabilityStore[userId].signals,
  });

  const answeredCount = Object.keys(capabilityStore[userId].answers).length;
  const shouldContinue = CapabilityScoringEngine.shouldContinue(answeredCount, currentScores.confidence);

  if (!shouldContinue) {
    capabilityStore[userId].result = currentScores;
    return res.status(200).json({
      isComplete: true,
      result: currentScores,
      nextPhase: 'TechnicalAssessment',
    });
  }

  return res.status(200).json({
    isComplete: false,
    nextChallenge: CAPABILITY_CHALLENGES[answeredCount],
    currentConfidence: currentScores.confidence,
  });
});

router.get('/result', (req: Request, res: Response) => {
  const userId = String(req.query.userId || '');
  if (!capabilityStore[userId]?.result) {
    return res.status(404).json({ error: 'Result not found' });
  }
  return res.status(200).json(capabilityStore[userId].result);
});

export default router;
