import { z } from 'zod';

export const PersonaTypeSchema = z.enum([
  'Explorer',
  'Confused',
  'Goal-Oriented',
  'Placement Aspirant',
  'Career Switcher',
  'Research Aspirant',
  'Freelancer',
  'Entrepreneur',
]);

export type PersonaType = z.infer<typeof PersonaTypeSchema>;

export const CareerStageSchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type CareerStage = z.infer<typeof CareerStageSchema>;

export const DiscoveryProfileSchema = z.object({
  userId: z.string(),
  persona: PersonaTypeSchema,
  confidence: z.number().min(0).max(100),
  goal: z.string(),
  currentStage: CareerStageSchema,
  learningStyle: z.string(),
  availableTime: z.string(),
  interests: z.array(z.string()).default([]),
  motivations: z.array(z.string()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type DiscoveryProfile = z.infer<typeof DiscoveryProfileSchema>;

export interface PersonaDefinition {
  id: PersonaType;
  title: string;
  description: string;
  confidence: number;
  recommendedFlow: string;
  priority: number;
  nextStep: string;
}

export const PERSONA_DEFINITIONS: Record<PersonaType, PersonaDefinition> = {
  Explorer: {
    id: 'Explorer',
    title: 'The Explorer',
    description: 'Curious about multiple domains and looking for the right fit.',
    confidence: 0,
    recommendedFlow: 'Discovery-First',
    priority: 2,
    nextStep: 'Interest Discovery',
  },
  Confused: {
    id: 'Confused',
    title: 'The Confused',
    description: 'Overwhelmed by choices and needs clear direction.',
    confidence: 0,
    recommendedFlow: 'Guided Path',
    priority: 1,
    nextStep: 'Interest Discovery',
  },
  'Goal-Oriented': {
    id: 'Goal-Oriented',
    title: 'The Goal-Oriented',
    description: 'Has a specific career target and wants the fastest route.',
    confidence: 0,
    recommendedFlow: 'Technical-Fast-Track',
    priority: 3,
    nextStep: 'Technical Assessment',
  },
  'Placement Aspirant': {
    id: 'Placement Aspirant',
    title: 'The Placement Aspirant',
    description: 'Focused on clearing campus interviews and job readiness.',
    confidence: 0,
    recommendedFlow: 'Job-Ready-Path',
    priority: 3,
    nextStep: 'Mock Interviews',
  },
  'Career Switcher': {
    id: 'Career Switcher',
    title: 'The Career Switcher',
    description: 'Moving from one domain to another; needs bridge skills.',
    confidence: 0,
    recommendedFlow: 'Transition-Bridge',
    priority: 2,
    nextStep: 'Skill Gap Analysis',
  },
  'Research Aspirant': {
    id: 'Research Aspirant',
    title: 'The Research Aspirant',
    description: 'Interested in deep academic or industrial research.',
    confidence: 0,
    recommendedFlow: 'Research-Track',
    priority: 2,
    nextStep: 'Domain Deep-Dive',
  },
  Freelancer: {
    id: 'Freelancer',
    title: 'The Freelancer',
    description: 'Wants to work independently and build a client base.',
    confidence: 0,
    recommendedFlow: 'Gig-Economy-Success',
    priority: 2,
    nextStep: 'Portfolio Building',
  },
  Entrepreneur: {
    id: 'Entrepreneur',
    title: 'The Entrepreneur',
    description: 'Wants to build a startup and lead a team.',
    confidence: 0,
    recommendedFlow: 'Founder-Journey',
    priority: 1,
    nextStep: 'MVP Development',
  },
};
