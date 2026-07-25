import { z } from 'zod';

export const InterestCategorySchema = z.enum([
  'Building Software',
  'Artificial Intelligence',
  'Cyber Security',
  'Data Science',
  'Cloud',
  'UI/UX',
  'Research',
  'Teaching',
  'Management',
  'Finance',
  'Entrepreneurship',
  'Healthcare',
  'Content Creation',
  'Business',
  'Marketing',
]);

export type InterestCategory = z.infer<typeof InterestCategorySchema>;

export const InterestProfileSchema = z.object({
  userId: z.string(),
  primaryInterest: z.string(),
  secondaryInterest: z.string(),
  interestScores: z.record(z.string(), z.number()),
  answeredQuestions: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  assessmentVersion: z.string().default('1.0.0'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InterestProfile = z.infer<typeof InterestProfileSchema>;

export interface OptionMapping {
  interests: Partial<Record<InterestCategory, number>>;
  traits: string[];
}

export interface InterestQuestion {
  id: string;
  text: string;
  type: 'scenario' | 'activity';
  options: Record<string, OptionMapping>;
}

export const INTEREST_QUESTIONS: InterestQuestion[] = [
  {
    id: 'int_q1',
    text: 'What would you enjoy doing on a free weekend?',
    type: 'activity',
    options: {
      'Build an application': {
        interests: { 'Building Software': 20, 'Entrepreneurship': 5, 'UI/UX': 5 },
        traits: ['Building', 'Creative'],
      },
      'Solve logical puzzles': {
        interests: { 'Data Science': 15, 'Artificial Intelligence': 10, 'Cyber Security': 10 },
        traits: ['Solving problems', 'Analytical'],
      },
      'Design interfaces': {
        interests: { 'UI/UX': 25, 'Marketing': 5 },
        traits: ['Designing', 'Creative'],
      },
      'Teach someone': {
        interests: { 'Teaching': 25, 'Management': 5 },
        traits: ['Communicating', 'Leading'],
      },
      'Investigate security vulnerabilities': {
        interests: { 'Cyber Security': 30 },
        traits: ['Analytical', 'Detail-oriented'],
      },
    },
  },
  {
    id: 'int_q2',
    text: 'A company gives you one month to work on any project. Which one do you choose?',
    type: 'scenario',
    options: {
      'AI Chatbot': {
        interests: { 'Artificial Intelligence': 25, 'Building Software': 10 },
        traits: ['Innovating', 'Building'],
      },
      'Portfolio Website': {
        interests: { 'UI/UX': 15, 'Building Software': 15 },
        traits: ['Designing', 'Building'],
      },
      'Security Tool': {
        interests: { 'Cyber Security': 25, 'Cloud': 10 },
        traits: ['Protecting', 'Analytical'],
      },
      'Research Paper': {
        interests: { 'Research': 30, 'Data Science': 10 },
        traits: ['Investigating', 'Analytical'],
      },
      'Business Dashboard': {
        interests: { 'Business': 20, 'Data Science': 15, 'Management': 10 },
        traits: ['Analysing', 'Leading'],
      },
    },
  },
];
