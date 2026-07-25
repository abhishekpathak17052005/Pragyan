import { z } from 'zod';

export const assessmentAnswersSchema = z.object({
  answers: z.record(z.string(), z.string()).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one assessment answer is required',
  }),
});

export type AssessmentAnswersInput = z.infer<typeof assessmentAnswersSchema>;

export const assessmentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      questionText: z.string().min(1),
      options: z.array(z.string()).min(1),
      category: z.string().optional(),
    })
  ).min(1),
});

export type AssessmentCreateInput = z.infer<typeof assessmentCreateSchema>;

// ── Phase 1: Profile Collection ───────────────────────────────────────────────

export const phase1PersonalInfoSchema = z.object({
  firstName:  z.string().min(1, 'First name is required').max(50),
  lastName:   z.string().min(1, 'Last name is required').max(50),
  age:        z.number().int().min(13, 'Minimum age is 13').max(65, 'Maximum age is 65'),
  gender:     z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
  country:    z.string().min(1, 'Country is required'),
  state:      z.string().min(1, 'State is required'),
  city:       z.string().min(1, 'City is required'),
});

export const phase1EducationSchema = z.object({
  currentStatus: z.enum([
    'School Student',
    'Diploma Student',
    'College Student',
    'Graduate',
    'Working Professional',
    'Career Switcher',
  ]),
  highestQualification: z.enum([
    '10th', '12th', 'Diploma', 'B.Tech', 'B.E.', 'BCA', 'MCA',
    'BSc', 'M.Tech', 'MBA', 'Other',
  ]),
  collegeName:            z.string().optional(),
  university:             z.string().optional(),
  degree:                 z.string().optional(),
  branch:                 z.string().optional(),
  currentYear:            z.enum(['1st', '2nd', '3rd', '4th', 'Completed']).optional(),
  expectedGraduationYear: z.number().int().min(2000).max(2040).optional().nullable(),
  cgpaOrPercentage:       z.string().optional(),
});

export const phase1ExperienceSchema = z.object({
  programmingExperience: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  previouslyWorked:      z.boolean(),
  yearsOfExperience:     z.number().min(0).max(50).optional().nullable(),
  currentCompany:        z.string().optional(),
  currentRole:           z.string().optional(),
});

export const phase1Schema = z.object({
  personalInfo:  phase1PersonalInfoSchema,
  education:     phase1EducationSchema,
  careerGoal:    z.enum([
    'Get Internship',
    'Get Job',
    'Upskill',
    'Career Switch',
    'Higher Studies',
    'Freelancing',
    'Start Startup',
  ]),
  experience:    phase1ExperienceSchema,
});

export type Phase1Input = z.infer<typeof phase1Schema>;

// ── Phase 2: Interest, Domain & Career Discovery ──────────────────────────────

const CAREER_OBJECTIVES = [
  'Get Internship', 'Get Placement', 'Get Full-time Job', 'Career Switch',
  'Higher Studies', 'Freelancing', 'Build Startup', 'Explore Career Options',
] as const;

const SKILL_CONFIDENCE_LEVELS = ['No Experience', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

const WORK_STYLES = [
  'Remote', 'Hybrid', 'Office', 'Startup', 'MNC', 'Research',
  'Product Company', 'Service Company', 'Government', 'Freelancing',
] as const;

const LEARNING_STYLES = [
  'Reading Documentation', 'Watching Videos', 'Building Projects',
  'Hands-on Practice', 'Live Classes', 'Coding Challenges', 'Research Papers',
] as const;

const MOTIVATIONS = [
  'Passion', 'High Salary', 'Innovation', 'Job Security',
  'Entrepreneurship', 'Research', 'Personal Interest', 'Family Influence',
] as const;

export const phase2Schema = z.object({
  careerObjective: z.enum(CAREER_OBJECTIVES, {
    errorMap: () => ({ message: 'Please select a career objective' }),
  }),

  preferredDomains: z.array(z.string().min(1)).min(1, 'Select at least one domain'),

  skillConfidence: z.object({
    programming:    z.enum(SKILL_CONFIDENCE_LEVELS),
    mathematics:    z.enum(SKILL_CONFIDENCE_LEVELS),
    problemSolving: z.enum(SKILL_CONFIDENCE_LEVELS),
    communication:  z.enum(SKILL_CONFIDENCE_LEVELS),
    teamwork:       z.enum(SKILL_CONFIDENCE_LEVELS),
    leadership:     z.enum(SKILL_CONFIDENCE_LEVELS),
  }),

  favoriteSubjects: z.array(z.string().min(1)).min(3, 'Select at least 3 subjects'),

  workStyle: z.array(z.enum(WORK_STYLES)).min(1, 'Select at least one work style'),

  learningStyle: z.array(z.enum(LEARNING_STYLES)).min(1, 'Select at least one learning style'),

  motivation: z.enum(MOTIVATIONS, {
    errorMap: () => ({ message: 'Please select your motivation' }),
  }),
});

export type Phase2Input = z.infer<typeof phase2Schema>;

export const PHASE2_CAREER_OBJECTIVES = CAREER_OBJECTIVES;
export const PHASE2_SKILL_CONFIDENCE_LEVELS = SKILL_CONFIDENCE_LEVELS;
export const PHASE2_WORK_STYLES = WORK_STYLES;
export const PHASE2_LEARNING_STYLES = LEARNING_STYLES;
export const PHASE2_MOTIVATIONS = MOTIVATIONS;
