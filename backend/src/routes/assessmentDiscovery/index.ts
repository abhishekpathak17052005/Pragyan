import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { PersonaRuleEngine } from './personaRuleEngine';
import { DiscoveryProfileSchema, PERSONA_DEFINITIONS } from './DiscoveryProfile';

const router = express.Router();

// In-memory discovery session store for demo purposes.
const discoveryStore: Record<string, any> = {};

/**
 * POST /api/assessment/discovery/start
 * Initializes the discovery session.
 */
router.post('/start', (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || randomUUID();
  discoveryStore[userId] = {
    userId,
    answers: {},
    currentStep: 0,
    startedAt: new Date(),
  };

  return res.status(200).json({
    message: 'Discovery started',
    userId,
    firstQuestion: {
      id: 'q_age',
      text: 'Before we dive in, how old are you?',
      type: 'number',
      group: 'Basic Profile',
    },
  });
});

/**
 * POST /api/assessment/discovery/answer
 * Saves an answer and returns the next question.
 */
router.post('/answer', (req: Request, res: Response) => {
  const { userId, questionId, answer } = req.body as {
    userId: string;
    questionId: string;
    answer: string;
  };

  if (!userId || !discoveryStore[userId]) {
    return res.status(404).json({ error: 'Session not found' });
  }

  discoveryStore[userId].answers[questionId] = answer;

  const nextQuestions: Record<string, any> = {
    q_age: {
      id: 'q_education',
      text: 'What is your highest level of education?',
      type: 'select',
      options: ['High School', "Bachelor's", "Master's", 'PhD'],
      group: 'Basic Profile',
    },
    q_education: {
      id: 'q_situation',
      text: 'What best describes your current situation?',
      type: 'select',
      options: [
        "I'm confused",
        "I'm exploring careers",
        "I know my career goal",
        "I need a roadmap",
        "I'm preparing for placements",
        "I want to switch careers",
        "I'm interested in research",
        "I want to freelance",
        "I want to build a startup",
      ],
      group: 'Current Situation',
    },
    q_situation: {
      id: 'q_activity',
      text: 'What activity sounds most exciting to you?',
      type: 'select',
      options: [
        'Building apps',
        'Breaking systems',
        'Designing interfaces',
        'Researching',
        'Analysing data',
        'Creating videos',
        'Teaching people',
        'Managing teams',
      ],
      group: 'Interest Discovery',
    },
    q_activity: {
      id: 'q_learning',
      text: 'How do you prefer to learn new things?',
      type: 'select',
      options: ['Videos', 'Projects', 'Reading', 'Practice', 'Live Sessions'],
      group: 'Learning Style',
    },
    q_learning: {
      id: 'q_time',
      text: 'How much time can you commit daily?',
      type: 'select',
      options: ['30 minutes', '1 hour', '2 hours', '3+ hours'],
      group: 'Time Commitment',
    },
  };

  const nextQ = nextQuestions[questionId];

  if (!nextQ) {
    const answers = discoveryStore[userId].answers;
    const classification = PersonaRuleEngine.classify({
      situation: answers.q_situation,
      activity: answers.q_activity,
      learningStyle: answers.q_learning,
      time: answers.q_time,
      experience: Number(answers.q_age) >= 2 ? 2 : 0,
      interests: [],
    });

    const profile = DiscoveryProfileSchema.parse({
      userId,
      persona: classification.persona,
      confidence: classification.confidence,
      goal: answers.q_situation || '',
      currentStage: classification.stage,
      learningStyle: answers.q_learning || 'Projects',
      availableTime: answers.q_time || '1 hour',
      interests: [],
      motivations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    discoveryStore[userId].result = profile;

    return res.status(200).json({
      isComplete: true,
      result: profile,
      personaDetails: PERSONA_DEFINITIONS[classification.persona],
    });
  }

  return res.status(200).json({ isComplete: false, nextQuestion: nextQ });
});

router.get('/result', (req: Request, res: Response) => {
  const userId = String(req.query.userId || '');
  if (!discoveryStore[userId]?.result) {
    return res.status(404).json({ error: 'Result not found' });
  }
  return res.status(200).json(discoveryStore[userId].result);
});

export default router;
