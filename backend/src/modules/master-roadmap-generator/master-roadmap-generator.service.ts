import { GeminiProvider } from '@/services/GeminiProvider';
import { config } from '@/config/env';
import { safeParseAIResponse } from '@/ai/safeParser';
import { generatedRoadmapSchema, type GeneratedRoadmapOutput } from './master-roadmap-generator.validators';
import { buildDomainAwarePromptPrefix, detectCareerDomain } from './domain-intelligence';
import { scoreRoadmapQuality, validatePrerequisiteGraph, type RoadmapQualityReport } from './roadmap-quality';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Industry Ready';

type TopicSeed = {
  title: string;
  description: string;
  explanation?: string;
  difficulty: Difficulty;
  estimatedDuration: string;
  learningObjective: string;
  prerequisite: string;
  handsOnExercise?: string;
  handsOnTask?: string;
  miniExercise?: string;
  expectedOutcome?: string;
  practicalTask?: string;
  resources?: {
    documentation: unknown[];
    video: unknown[];
    practice: unknown[];
    notes: unknown[];
    books: unknown[];
    projects: unknown[];
    interviewQuestions: unknown[];
  };
};

const EMPTY_RESOURCE_BUCKETS = {
  documentation: [],
  video: [],
  practice: [],
  notes: [],
  books: [],
  projects: [],
  interviewQuestions: [],
};

type TemplateKey =
  | 'software-engineering'
  | 'ai-ml'
  | 'cyber-security'
  | 'cloud-computing'
  | 'devops'
  | 'data-science'
  | 'mobile-development'
  | 'ui-ux'
  | 'game-development'
  | 'blockchain'
  | 'generic';

type GeneratorDiagnostics = {
  quality: RoadmapQualityReport;
  prerequisiteGraphValid: boolean;
  warnings: string[];
  regenerated: boolean;
};

type CareerRoadmapPreset = {
  summary: string;
  modules: Array<{
    title: string;
    skills: string[];
    moduleLabel: string;
  }>;
};

const CAREER_ROADMAP_PRESETS: Partial<Record<string, CareerRoadmapPreset>> = {
  'ai engineer': {
    summary: 'An AI engineering roadmap that starts with Python and math foundations, then moves through machine learning, deep learning, MLOps, deployment, and portfolio-grade AI systems.',
    modules: [
      { title: 'Foundations for AI Engineering', moduleLabel: 'Module 1', skills: ['Python', 'Programming Fundamentals', 'Data Structures'] },
      { title: 'Math and Data Foundations', moduleLabel: 'Module 2', skills: ['NumPy', 'Pandas', 'Statistics'] },
      { title: 'Machine Learning Core', moduleLabel: 'Module 3', skills: ['Machine Learning', 'Model Evaluation', 'Feature Engineering'] },
      { title: 'Deep Learning and Deployment', moduleLabel: 'Module 4', skills: ['Deep Learning', 'MLOps', 'Model Deployment'] },
    ],
  },
  'backend developer': {
    summary: 'A backend roadmap that moves from programming fundamentals to APIs, databases, authentication, scaling, and production-ready services.',
    modules: [
      { title: 'Programming Fundamentals', moduleLabel: 'Module 1', skills: ['Programming Fundamentals', 'Version Control', 'Problem Solving'] },
      { title: 'HTTP and API Design', moduleLabel: 'Module 2', skills: ['HTTP', 'REST APIs', 'Validation'] },
      { title: 'Databases and Business Logic', moduleLabel: 'Module 3', skills: ['SQL', 'Data Modeling', 'Service Layer'] },
      { title: 'Security and Deployment', moduleLabel: 'Module 4', skills: ['Authentication', 'Authorization', 'Deployment'] },
    ],
  },
  'full stack developer': {
    summary: 'A full stack roadmap that sequenced frontend foundations before backend, databases, authentication, integration, and product delivery.',
    modules: [
      { title: 'Programming and Web Foundations', moduleLabel: 'Module 1', skills: ['Programming Fundamentals', 'HTML', 'CSS'] },
      { title: 'JavaScript and Frontend Development', moduleLabel: 'Module 2', skills: ['JavaScript', 'DOM', 'React'] },
      { title: 'Backend and Databases', moduleLabel: 'Module 3', skills: ['Node', 'Express', 'MongoDB'] },
      { title: 'Authentication, Integration, and Deployment', moduleLabel: 'Module 4', skills: ['Authentication', 'APIs', 'Deployment'] },
    ],
  },
  'frontend developer': {
    summary: 'A frontend roadmap that stays strict about web fundamentals first, then JavaScript, accessibility, React, state, performance, and deployment.',
    modules: [
      { title: 'Web Foundations', moduleLabel: 'Module 1', skills: ['HTML', 'CSS', 'Responsive Design'] },
      { title: 'JavaScript Fundamentals', moduleLabel: 'Module 2', skills: ['JavaScript', 'DOM', 'Async Programming'] },
      { title: 'React and State Management', moduleLabel: 'Module 3', skills: ['React', 'State Management', 'Routing'] },
      { title: 'Frontend Quality and Delivery', moduleLabel: 'Module 4', skills: ['Accessibility', 'Testing', 'Deployment'] },
    ],
  },
  'devops engineer': {
    summary: 'A DevOps roadmap built around Linux, Git, scripting, containers, CI/CD, infrastructure as code, observability, and release engineering.',
    modules: [
      { title: 'Linux and Version Control', moduleLabel: 'Module 1', skills: ['Linux', 'Git', 'Scripting'] },
      { title: 'Containers and CI/CD', moduleLabel: 'Module 2', skills: ['Docker', 'CI/CD', 'Automation'] },
      { title: 'Cloud and Infrastructure as Code', moduleLabel: 'Module 3', skills: ['Cloud Platforms', 'IaC', 'Networking'] },
      { title: 'Observability and Release Engineering', moduleLabel: 'Module 4', skills: ['Monitoring', 'Alerting', 'Release Engineering'] },
    ],
  },
  'data scientist': {
    summary: 'A data science roadmap that starts with Python, SQL, statistics, analysis, visualization, experiments, machine learning, and storytelling.',
    modules: [
      { title: 'Python and SQL Foundations', moduleLabel: 'Module 1', skills: ['Python', 'SQL', 'Data Manipulation'] },
      { title: 'Statistics and Analysis', moduleLabel: 'Module 2', skills: ['Statistics', 'EDA', 'Data Cleaning'] },
      { title: 'Visualization and Experimentation', moduleLabel: 'Module 3', skills: ['Data Visualization', 'A/B Testing', 'Insights'] },
      { title: 'Machine Learning and Storytelling', moduleLabel: 'Module 4', skills: ['Machine Learning', 'Model Evaluation', 'Data Storytelling'] },
    ],
  },
};

const DOMAIN_SEQUENCES: Record<TemplateKey, string[]> = {
  'software-engineering': [
    'Programming Basics',
    'Language Fundamentals',
    'Data Structures',
    'Algorithms',
    'Version Control',
    'Frontend Development',
    'Backend Development',
    'Databases',
    'Authentication',
    'Deployment',
    'Production Projects',
    'Interview Preparation',
  ],
  'ai-ml': [
    'Python',
    'NumPy',
    'Pandas',
    'Statistics',
    'Linear Algebra',
    'Machine Learning',
    'Deep Learning',
    'Model Evaluation',
    'MLOps',
    'Model Deployment',
    'AI Product Projects',
    'AI Interview Preparation',
  ],
  'cyber-security': [
    'Computer Fundamentals',
    'Networking',
    'Linux',
    'Python Scripting',
    'Web Security',
    'Cryptography',
    'OWASP',
    'SOC Operations',
    'Incident Response',
    'Cloud Security',
    'Security Capstone',
    'Security Interview Preparation',
  ],
  'cloud-computing': [
    'Computer Networking',
    'Linux Fundamentals',
    'Cloud Concepts',
    'Identity and Access Management',
    'Compute Services',
    'Storage Services',
    'Managed Databases',
    'Networking in Cloud',
    'Monitoring',
    'Cost Optimization',
    'Cloud Architecture Project',
    'Cloud Interview Preparation',
  ],
  devops: [
    'Linux',
    'Git',
    'Scripting',
    'Containers',
    'CI/CD',
    'Infrastructure as Code',
    'Cloud Platforms',
    'Monitoring',
    'Security in DevOps',
    'Release Engineering',
    'DevOps Capstone',
    'DevOps Interview Preparation',
  ],
  'data-science': [
    'Python',
    'SQL',
    'NumPy',
    'Pandas',
    'Statistics',
    'Data Cleaning',
    'Data Visualization',
    'Exploratory Analysis',
    'Machine Learning',
    'Experimentation',
    'Data Storytelling Project',
    'Data Science Interview Preparation',
  ],
  'mobile-development': [
    'Programming Basics',
    'Platform Fundamentals',
    'UI Layouts',
    'State Management',
    'Navigation',
    'API Integration',
    'Local Storage',
    'Authentication',
    'Testing',
    'App Store Deployment',
    'Mobile Capstone',
    'Mobile Interview Preparation',
  ],
  'ui-ux': [
    'Design Thinking',
    'User Research',
    'Information Architecture',
    'Wireframing',
    'Visual Design',
    'Design Systems',
    'Prototyping',
    'Usability Testing',
    'Accessibility',
    'Handoff',
    'Portfolio Case Study',
    'UX Interview Preparation',
  ],
  'game-development': [
    'Programming Basics',
    'Game Loops',
    '2D Math',
    'Input Systems',
    'Physics',
    'Animation',
    'Level Design',
    'Audio',
    'AI for Games',
    'Optimization',
    'Playable Capstone',
    'Game Interview Preparation',
  ],
  blockchain: [
    'Programming Basics',
    'Cryptography Basics',
    'Distributed Systems',
    'Blockchain Fundamentals',
    'Wallets and Keys',
    'Smart Contracts',
    'Testing Contracts',
    'Security Audits',
    'DeFi Concepts',
    'Deployment',
    'Blockchain Capstone',
    'Blockchain Interview Preparation',
  ],
  generic: [
    'Career Fundamentals',
    'Core Tools',
    'Foundational Concepts',
    'Applied Skills',
    'Workflow Design',
    'Quality Practices',
    'Intermediate Projects',
    'Advanced Concepts',
    'Industry Practices',
    'Deployment or Delivery',
    'Capstone Project',
    'Interview Preparation',
  ],
};

const CURRICULUM_TEMPLATE: Record<string, {
  summary: string;
  modules: Array<{
    title: string;
    description: string;
    weeks: Array<{
      title: string;
      description: string;
      days: Array<{ title: string; description: string; topics: TopicSeed[] }>;
    }>;
  }>;
}> = {
  backend: {
    summary: 'A backend curriculum that moves from programming fundamentals to APIs, databases, security, deployment, and scalable service design.',
    modules: [
      {
        title: 'Programming Foundations',
        description: 'Build the core programming habits needed to reason about server-side systems.',
        weeks: [
          {
            title: 'Core syntax and tooling',
            description: 'Establish coding, debugging, and development workflow basics.',
            days: [
              {
                title: 'Programming setup',
                description: 'Set up the language, editor, and debugging workflow.',
                topics: [
                  { title: 'Runtime and tooling', description: 'Understand the language runtime and development environment.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Set up a productive backend development environment.', prerequisite: 'Basic computer literacy', practicalTask: 'Install the runtime, editor, and formatter.' },
                  { title: 'Project structure', description: 'Learn how backend projects are organized.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Recognize common backend folder layouts.', prerequisite: 'Runtime setup', practicalTask: 'Create a starter project with folders for routes, services, and models.' },
                  { title: 'Debugging workflow', description: 'Trace errors and inspect stack traces effectively.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Use debugging tools to locate and fix issues.', prerequisite: 'Project setup', practicalTask: 'Run a small script and debug an intentional error.' },
                ],
              },
              {
                title: 'Language fundamentals',
                description: 'Learn the syntax and constructs used in server-side code.',
                topics: [
                  { title: 'Variables and types', description: 'Declare and use values safely.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Apply primitive types and variables correctly.', prerequisite: 'Debugging workflow', practicalTask: 'Write examples using strings, numbers, booleans, and arrays.' },
                  { title: 'Conditionals', description: 'Branch logic based on runtime input.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Build decision flows with if/else and switch.', prerequisite: 'Variables and types', practicalTask: 'Create a request validator with conditional checks.' },
                  { title: 'Loops and iteration', description: 'Process lists and repeated work.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Use loops to transform collections.', prerequisite: 'Conditionals', practicalTask: 'Iterate through an array of mock users and format output.' },
                ],
              },
            ],
          },
          {
            title: 'Functions and data handling',
            description: 'Strengthen decomposition and data shaping skills.',
            days: [
              {
                title: 'Functions',
                description: 'Write reusable logic with clear inputs and outputs.',
                topics: [
                  { title: 'Function design', description: 'Split behavior into focused functions.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Create reusable function boundaries.', prerequisite: 'Language fundamentals', practicalTask: 'Refactor a script into smaller utility functions.' },
                  { title: 'Parameters and return values', description: 'Handle data flowing into and out of functions.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Pass inputs and return structured outputs.', prerequisite: 'Function design', practicalTask: 'Build a calculator utility with multiple functions.' },
                  { title: 'Error handling', description: 'Handle failure cases intentionally.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Protect functions against invalid inputs and runtime failures.', prerequisite: 'Parameters and return values', practicalTask: 'Wrap unsafe logic in a safe execution helper.' },
                ],
              },
              {
                title: 'Arrays and objects',
                description: 'Model data with collections and structured objects.',
                topics: [
                  { title: 'Arrays', description: 'Work with ordered collections.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Manipulate lists of records confidently.', prerequisite: 'Error handling', practicalTask: 'Filter and map a set of students or tasks.' },
                  { title: 'Objects', description: 'Represent entities with named properties.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Use objects for structured backend data.', prerequisite: 'Arrays', practicalTask: 'Model a user profile as an object and update fields.' },
                  { title: 'Serialization', description: 'Convert structured data for transport.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Serialize and deserialize JSON payloads.', prerequisite: 'Objects', practicalTask: 'Parse and stringify API-style JSON data.' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Backend APIs',
        description: 'Design endpoints and the request-response lifecycle for services.',
        weeks: [
          {
            title: 'HTTP and REST',
            description: 'Learn the basics of web communication and REST design.',
            days: [
              {
                title: 'HTTP basics',
                description: 'Understand requests, responses, and methods.',
                topics: [
                  { title: 'HTTP verbs', description: 'Use GET, POST, PUT, PATCH, and DELETE correctly.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Match HTTP methods to intent.', prerequisite: 'Functions and data handling', practicalTask: 'Sketch CRUD endpoints for a sample resource.' },
                  { title: 'Status codes', description: 'Use response codes to communicate outcomes.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Return meaningful status codes.', prerequisite: 'HTTP verbs', practicalTask: 'Map common backend errors to HTTP responses.' },
                  { title: 'Headers and payloads', description: 'Structure transport metadata and body data.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Read and write headers and request payloads.', prerequisite: 'Status codes', practicalTask: 'Inspect a sample HTTP exchange in a browser or client.' },
                ],
              },
              {
                title: 'API design',
                description: 'Design consistent and useful service interfaces.',
                topics: [
                  { title: 'Resource modeling', description: 'Choose nouns and routes that fit the domain.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Model clean REST resources.', prerequisite: 'Headers and payloads', practicalTask: 'Design route names for a booking or task API.' },
                  { title: 'Validation', description: 'Reject bad data before it reaches business logic.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Validate input at the edge.', prerequisite: 'Resource modeling', practicalTask: 'Write request validation rules for a create endpoint.' },
                  { title: 'Pagination and filtering', description: 'Support large collections safely.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Design list endpoints for scale.', prerequisite: 'Validation', practicalTask: 'Add query parameters to a sample list response.' },
                ],
              },
            ],
          },
          {
            title: 'Service layer',
            description: 'Move business logic into maintainable service boundaries.',
            days: [
              {
                title: 'Controllers and services',
                description: 'Separate transport logic from business rules.',
                topics: [
                  { title: 'Controller responsibilities', description: 'Keep HTTP parsing in the controller layer.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Write thin controllers.', prerequisite: 'API design', practicalTask: 'Move business logic out of a route handler.' },
                  { title: 'Service responsibilities', description: 'Encapsulate reusable business operations.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Create service methods for core rules.', prerequisite: 'Controller responsibilities', practicalTask: 'Extract order-processing logic into a service.' },
                  { title: 'Error propagation', description: 'Keep errors predictable across layers.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Use shared errors and centralized handlers.', prerequisite: 'Service responsibilities', practicalTask: 'Create and throw typed app errors in one flow.' },
                ],
              },
              {
                title: 'Response shaping',
                description: 'Return predictable API payloads.',
                topics: [
                  { title: 'DTO design', description: 'Shape data for the consumer.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Avoid leaking internal model shape.', prerequisite: 'Error propagation', practicalTask: 'Create a response DTO for a user endpoint.' },
                  { title: 'Consistency rules', description: 'Keep response formats uniform.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Return consistent success and failure payloads.', prerequisite: 'DTO design', practicalTask: 'Standardize a route response helper.' },
                  { title: 'Performance tradeoffs', description: 'Avoid over-fetching and unnecessary work.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Recognize payload and query efficiency costs.', prerequisite: 'Consistency rules', practicalTask: 'Reduce a heavy response to only the needed fields.' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Databases and Security',
        description: 'Persist data safely and protect backend operations.',
        weeks: [
          {
            title: 'Data modeling',
            description: 'Plan and query persistent data structures.',
            days: [
              {
                title: 'Schema design',
                description: 'Map domain entities to data models.',
                topics: [
                  { title: 'Entity relationships', description: 'Link users, orders, and records correctly.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Design relational or document relationships.', prerequisite: 'Service layer', practicalTask: 'Model a one-to-many relationship for a sample app.' },
                  { title: 'Indexes', description: 'Speed up common queries.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Choose useful database indexes.', prerequisite: 'Entity relationships', practicalTask: 'Add an index to a frequently searched field.' },
                  { title: 'Migrations', description: 'Evolve data structure safely.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Change schema with minimal disruption.', prerequisite: 'Indexes', practicalTask: 'Plan a versioned schema change.' },
                ],
              },
              {
                title: 'Data access patterns',
                description: 'Read and write efficiently through an ORM.',
                topics: [
                  { title: 'CRUD flows', description: 'Create, read, update, and delete records.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Implement data persistence workflows.', prerequisite: 'Schema design', practicalTask: 'Build a CRUD layer for a resource.' },
                  { title: 'Transactions', description: 'Keep multi-step operations consistent.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Use transactions for integrity.', prerequisite: 'CRUD flows', practicalTask: 'Wrap a multi-write workflow in a transaction.' },
                  { title: 'Query optimization', description: 'Reduce slow database access.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Spot and fix expensive queries.', prerequisite: 'Transactions', practicalTask: 'Refactor a list query to fetch less data.' },
                ],
              },
            ],
          },
          {
            title: 'Authentication and deployment',
            description: 'Secure the application and prepare it for production.',
            days: [
              {
                title: 'Authentication',
                description: 'Control access to protected data.',
                topics: [
                  { title: 'Sessions and tokens', description: 'Understand common auth mechanisms.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Explain and choose auth approaches.', prerequisite: 'Data access patterns', practicalTask: 'Implement login state with a token or session.' },
                  { title: 'Authorization', description: 'Restrict access by role or ownership.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Protect routes based on permissions.', prerequisite: 'Sessions and tokens', practicalTask: 'Add an admin-only route guard.' },
                  { title: 'Password security', description: 'Store credentials safely.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Hash and verify passwords properly.', prerequisite: 'Authorization', practicalTask: 'Add password hashing to signup and login flows.' },
                ],
              },
              {
                title: 'Deployment basics',
                description: 'Ship backend services safely and monitor them.',
                topics: [
                  { title: 'Environment variables', description: 'Separate config from code.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Use secure configuration practices.', prerequisite: 'Password security', practicalTask: 'Move connection settings into environment variables.' },
                  { title: 'Logging and observability', description: 'Inspect runtime behavior in production.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Instrument critical backend actions.', prerequisite: 'Environment variables', practicalTask: 'Add structured logs to a route and a service.' },
                  { title: 'Production readiness', description: 'Prepare for deployments and failures.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Plan a resilient release checklist.', prerequisite: 'Logging and observability', practicalTask: 'Write a deployment checklist for your API.' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Capstone and Scalability',
        description: 'Build a complete system and prepare for advanced backend work.',
        weeks: [
          {
            title: 'System design',
            description: 'Design for growth and maintainability.',
            days: [
              {
                title: 'Scalable architecture',
                description: 'Understand modular, layered, and event-driven systems.',
                topics: [
                  { title: 'Modular boundaries', description: 'Split a service into stable domain areas.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Design maintainable backend modules.', prerequisite: 'Production readiness', practicalTask: 'Refactor a feature into domain modules.' },
                  { title: 'Caching', description: 'Reduce repeated work and latency.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Apply caching where it matters.', prerequisite: 'Modular boundaries', practicalTask: 'Add a cache layer for a repeated lookup.' },
                  { title: 'Background jobs', description: 'Move slow work off the request path.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Offload asynchronous tasks safely.', prerequisite: 'Caching', practicalTask: 'Queue an email or report generation job.' },
                ],
              },
              {
                title: 'Capstone build',
                description: 'Ship a portfolio-grade backend project.',
                topics: [
                  { title: 'Feature planning', description: 'Define a realistic product scope.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Break a capstone into deliverable milestones.', prerequisite: 'Background jobs', practicalTask: 'Write the feature list for a booking or content platform.' },
                  { title: 'Testing strategy', description: 'Protect the project with automated tests.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Test core backend flows.', prerequisite: 'Feature planning', practicalTask: 'Add unit tests for a critical service method.' },
                  { title: 'Release and review', description: 'Finalize the project and assess weaknesses.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Present the architecture and tradeoffs clearly.', prerequisite: 'Testing strategy', practicalTask: 'Prepare a short architecture review and demo script.' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  generic: {
    summary: 'A structured curriculum that starts with a domain introduction, advances through applied skills, and ends with industry-ready preparation and career readiness.',
    modules: [
      {
        title: 'Domain Introduction',
        description: 'Introduce the career domain, role expectations, business value, and foundational terminology.',
        weeks: [
          {
            title: 'Career context and value',
            description: 'Clarify the role, business impact, and how success is measured.',
            days: [
              {
                title: 'Role and responsibilities',
                description: 'Define what this career does and the key outcomes it delivers.',
                topics: [
                  { title: 'Role overview', description: 'Understand the core responsibilities and expectations of the career.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Describe the primary role and value of the career.', prerequisite: 'None', practicalTask: 'Write a concise role statement and expected outcomes.' },
                  { title: 'Business impact', description: 'Learn how the career contributes to product, customer, or business goals.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Explain the role’s business value clearly.', prerequisite: 'Role overview', practicalTask: 'Map two business outcomes that the role supports.' },
                  { title: 'Key terminology', description: 'Learn the essential terms used in the career domain.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Use foundational career vocabulary correctly.', prerequisite: 'Business impact', practicalTask: 'Create a glossary of five core terms and their meanings.' },
                ],
              },
              {
                title: 'Foundational skills and tools',
                description: 'Learn the first practical skills and workflows used in the career.',
                topics: [
                  { title: 'Daily workflow', description: 'Understand the routine activities and handoffs in the role.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Describe a typical day in the role.', prerequisite: 'Key terminology', practicalTask: 'Outline the workflow for one week of role activities.' },
                  { title: 'Essential skillset', description: 'Identify the core skills required to start performing effectively.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'List the main skills needed for the career.', prerequisite: 'Daily workflow', practicalTask: 'Record the top three skills and why they matter.' },
                  { title: 'Success habits', description: 'Learn the habits that help people in the career grow and stay reliable.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Adopt habits that support consistent performance.', prerequisite: 'Essential skillset', practicalTask: 'Write a short plan for daily review and improvement.' },
                ],
              },
            ],
          },
          {
            title: 'Foundational practice',
            description: 'Begin with beginner-level practice that is directly relevant to career tasks.',
            days: [
              {
                title: 'Introductory task',
                description: 'Complete a first applied task that reflects the career domain.',
                topics: [
                  { title: 'Task setup', description: 'Prepare the simplest practical task for the career.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Set up a basic career-relevant task.', prerequisite: 'Success habits', practicalTask: 'Define the first task and expected outcome.' },
                  { title: 'Task execution', description: 'Perform the task with beginner-level correctness.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Complete the first task accurately.', prerequisite: 'Task setup', practicalTask: 'Execute the task and review the result.' },
                  { title: 'Reflection', description: 'Review what you learned and identify the next improvement step.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Reflect on the task and learn from it.', prerequisite: 'Task execution', practicalTask: 'Write a short reflection describing what worked and what to improve.' },
                ],
              },
              {
                title: 'Applied fundamentals',
                description: 'Take a second beginner task and connect it to career outcomes.',
                topics: [
                  { title: 'Second task', description: 'Perform another practical exercise that builds on the first.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Apply basic skills in a new context.', prerequisite: 'Reflection', practicalTask: 'Complete a second practice task with clear acceptance criteria.' },
                  { title: 'Pattern recognition', description: 'Identify repeatable patterns from beginner work.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'See patterns that appear across similar tasks.', prerequisite: 'Second task', practicalTask: 'List two patterns and explain when to use them.' },
                  { title: 'Quality check', description: 'Inspect beginner work against simple quality standards.', difficulty: 'Beginner', estimatedDuration: '45 min', learningObjective: 'Assess work quality objectively.', prerequisite: 'Pattern recognition', practicalTask: 'Review the result and note any fixes needed.' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Core Skills',
        description: 'Develop the primary technical or professional skills for the career.',
        weeks: [
          {
            title: 'Intermediate application',
            description: 'Move from foundational knowledge to higher-impact career work.',
            days: [
              {
                title: 'Intermediate concept 1',
                description: 'Learn a deeper concept that supports practical career tasks.',
                topics: [
                  { title: 'Concept explanation', description: 'Understand an intermediate-level career concept clearly.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Explain the concept and its purpose.', prerequisite: 'Foundational practice', practicalTask: 'Describe the concept and where it applies.' },
                  { title: 'Applied example', description: 'Use the concept in a real scenario.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Apply the concept in a practical way.', prerequisite: 'Concept explanation', practicalTask: 'Complete an example task using the concept.' },
                  { title: 'Result review', description: 'Validate the intermediate work against career expectations.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Assess the outcome for correctness and effectiveness.', prerequisite: 'Applied example', practicalTask: 'Review the work and note improvements.' },
                ],
              },
              {
                title: 'Problem solving',
                description: 'Practice solving career problems with an intermediate mindset.',
                topics: [
                  { title: 'Problem framing', description: 'Break a real problem into clear, manageable steps.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Frame problems for practical solutions.', prerequisite: 'Result review', practicalTask: 'Write a problem statement with desired outcomes.' },
                  { title: 'Solution plan', description: 'Design a plan before implementation.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Plan a solution that addresses the problem effectively.', prerequisite: 'Problem framing', practicalTask: 'Draft a step-by-step solution plan.' },
                  { title: 'Implementation refinement', description: 'Improve the first implementation for clarity and reliability.', difficulty: 'Intermediate', estimatedDuration: '60 min', learningObjective: 'Refine the approach for better results.', prerequisite: 'Solution plan', practicalTask: 'Adjust the implementation and document the refinements.' },
                ],
              },
            ],
          },
          {
            title: 'Advanced skill application',
            description: 'Raise the standard with advanced technical or career skills.',
            days: [
              {
                title: 'Advanced technique',
                description: 'Learn an advanced concept with career impact.',
                topics: [
                  { title: 'Advanced explanation', description: 'Master a higher-level skill or method.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Understand and apply an advanced technique.', prerequisite: 'Implementation refinement', practicalTask: 'Use the advanced technique in a meaningful task.' },
                  { title: 'Applied adaptation', description: 'Tailor the advanced technique for a specific career scenario.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Adapt the technique to real-world work.', prerequisite: 'Advanced explanation', practicalTask: 'Apply the technique in a scenario with clear constraints.' },
                  { title: 'Professional review', description: 'Evaluate the advanced work using professional criteria.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Measure the work against career-quality standards.', prerequisite: 'Applied adaptation', practicalTask: 'Review and improve the work with a professional checklist.' },
                ],
              },
              {
                title: 'Applied system thinking',
                description: 'Link skills together into an integrated career workflow.',
                topics: [
                  { title: 'System integration', description: 'Combine multiple skills into a coherent solution.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Build a simple integrated workflow or system.', prerequisite: 'Professional review', practicalTask: 'Create a mini system that reflects the career domain.' },
                  { title: 'Reliability focus', description: 'Improve the solution for consistency and maintainability.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Tune the solution for professional reliability.', prerequisite: 'System integration', practicalTask: 'Identify and fix one reliability issue.' },
                  { title: 'Stakeholder communication', description: 'Explain technical work clearly to non-technical stakeholders.', difficulty: 'Advanced', estimatedDuration: '75 min', learningObjective: 'Communicate the value and behavior of the solution.', prerequisite: 'Reliability focus', practicalTask: 'Write a short summary of the solution and its benefits.' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Career Readiness',
        description: 'Prepare for interviews, portfolio projects, and real-world delivery.',
        weeks: [
          {
            title: 'Portfolio and evaluation',
            description: 'Translate learning into career-ready evidence and self-assessment.',
            days: [
              {
                title: 'Portfolio planning',
                description: 'Plan a project that demonstrates the most important career skills.',
                topics: [
                  { title: 'Project scope', description: 'Define a portfolio project that showcases your key abilities.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Choose a strong portfolio project scope.', prerequisite: 'Applied system thinking', practicalTask: 'Draft the project scope and success criteria.' },
                  { title: 'Quality standards', description: 'Set the success criteria for the portfolio project.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Define what good looks like for the project.', prerequisite: 'Project scope', practicalTask: 'Create a checklist for quality and impact.' },
                  { title: 'Presentation readiness', description: 'Plan how to present the project professionally.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Prepare a concise project summary for stakeholders.', prerequisite: 'Quality standards', practicalTask: 'Write a brief presentation summary of the project outcomes.' },
                ],
              },
              {
                title: 'Interview readiness',
                description: 'Practice telling the story of your work and decisions.',
                topics: [
                  { title: 'Technical storytelling', description: 'Craft a clear narrative for your technical decisions.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Explain your work confidently in a career conversation.', prerequisite: 'Presentation readiness', practicalTask: 'Write a short story describing your approach and impact.' },
                  { title: 'Problem-solving story', description: 'Summarize how you solve problems in a structured way.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Articulate your problem-solving process clearly.', prerequisite: 'Technical storytelling', practicalTask: 'Draft a problem-solving narrative using concrete examples.' },
                  { title: 'Professional habits', description: 'Identify the daily habits that support successful work delivery.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Adopt work habits that support reliability and collaboration.', prerequisite: 'Problem-solving story', practicalTask: 'Write a plan for communication, review, and iteration.' },
                ],
              },
            ],
          },
          {
            title: 'Continuous improvement',
            description: 'Create a plan for ongoing growth beyond the roadmap.',
            days: [
              {
                title: 'Self-assessment',
                description: 'Measure your strengths, gaps, and next development steps.',
                topics: [
                  { title: 'Skills audit', description: 'Inventory what you know and where you need more experience.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Create a clear skills inventory and gap analysis.', prerequisite: 'Professional habits', practicalTask: 'List strengths and growth areas for the career.' },
                  { title: 'Improvement plan', description: 'Plan the next steps to continue career progress.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Define a personal development plan with milestones.', prerequisite: 'Skills audit', practicalTask: 'Write a 30-day improvement plan.' },
                  { title: 'Career reflection', description: 'Clarify long-term direction and how to keep advancing.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Reflect on career goals and next steps.', prerequisite: 'Improvement plan', practicalTask: 'Write a short reflection on your development priorities.' },
                ],
              },
              {
                title: 'Professional articulation',
                description: 'Document what you have learned for hiring and review conversations.',
                topics: [
                  { title: 'Summary statement', description: 'Write a concise statement that summarizes your readiness.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Create a polished readiness summary.', prerequisite: 'Career reflection', practicalTask: 'Draft a readiness statement for a portfolio or interview.' },
                  { title: 'Evidence mapping', description: 'Match your accomplishments to career qualifications.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Map portfolio evidence to the career skill set.', prerequisite: 'Summary statement', practicalTask: 'Create a mapping of examples to key skills.' },
                  { title: 'Presentation plan', description: 'Plan how to present your work to hiring managers or reviewers.', difficulty: 'Industry Ready', estimatedDuration: '75 min', learningObjective: 'Prepare a concise presentation of your achievements.', prerequisite: 'Evidence mapping', practicalTask: 'Write a presentation plan for discussing your work.' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

void CURRICULUM_TEMPLATE;

function normalizeCareerName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function resolveTemplateKey(careerName: string) {
  const normalized = careerName.toLowerCase();

  if (/(machine learning|ml engineer|ai engineer|artificial intelligence|deep learning)/.test(normalized)) return 'ai-ml';
  if (/(data scientist|data science|data analyst|analytics)/.test(normalized)) return 'data-science';
  if (/(cyber|security|soc|information security|ethical hacker)/.test(normalized)) return 'cyber-security';
  if (/(cloud|aws|azure|gcp)/.test(normalized)) return 'cloud-computing';
  if (/(devops|site reliability|sre|platform engineer)/.test(normalized)) return 'devops';
  if (/(mobile|android|ios|react native|flutter)/.test(normalized)) return 'mobile-development';
  if (/(ui\/ux|ux|product designer|interface designer)/.test(normalized)) return 'ui-ux';
  if (/(game|unity|unreal)/.test(normalized)) return 'game-development';
  if (/(blockchain|web3|smart contract|solidity)/.test(normalized)) return 'blockchain';
  if (/(software|frontend|front end|backend|back end|full stack|fullstack|developer|engineer|api|server|node)/.test(normalized)) return 'software-engineering';
  return 'generic';
}

function makeTopic(skill: string, focus: string, difficulty: Difficulty, prerequisite: string): TopicSeed {
  const title = `${skill}: ${focus}`;
  return {
    title,
    description: `Learn ${focus.toLowerCase()} for ${skill.toLowerCase()} through job-relevant examples and guided practice.`,
    explanation: `This topic teaches ${focus.toLowerCase()} in ${skill.toLowerCase()} with practical context and implementation guidance.`,
    difficulty,
    estimatedDuration: difficulty === 'Beginner' ? '45 min' : difficulty === 'Intermediate' ? '60 min' : '75 min',
    learningObjective: `Apply ${focus.toLowerCase()} confidently in ${skill.toLowerCase()} work.`,
    prerequisite,
    handsOnExercise: `Complete a structured hands-on exercise on ${focus.toLowerCase()} for ${skill.toLowerCase()}.`,
    handsOnTask: `Complete a practical ${skill.toLowerCase()} task focused on ${focus.toLowerCase()}.`,
    miniExercise: `Write a short explanation or small implementation that proves you understand ${focus.toLowerCase()}.`,
    expectedOutcome: `Deliver a clear, reviewable output demonstrating ${focus.toLowerCase()} in ${skill.toLowerCase()}.`,
    practicalTask: `Complete a practical ${skill.toLowerCase()} task focused on ${focus.toLowerCase()}.`,
    resources: { ...EMPTY_RESOURCE_BUCKETS },
  };
}

function buildDay(skill: string, focusLabel: string, difficulty: Difficulty, dayNumber: number, prerequisiteRef: { value: string }) {
  const topics = ['Concepts', 'Implementation', 'Practice'].map((focus) => {
    const topic = makeTopic(skill, `${focusLabel} ${focus}`, difficulty, prerequisiteRef.value);
    prerequisiteRef.value = topic.title;
    return topic;
  });

  return {
    dayNumber,
    title: `${skill} ${focusLabel}`,
    description: `Learn ${skill.toLowerCase()} ${focusLabel.toLowerCase()} before moving to the next prerequisite.`,
    topics,
  };
}

function buildTemplateModule(careerName: string, moduleNumber: number, skills: string[], prerequisiteRef: { value: string }) {
  const moduleTitle = moduleNumber === 1 ? 'Foundations and Prerequisites' : moduleNumber === 2 ? 'Core Professional Skills' : moduleNumber === 3 ? 'Applied Industry Practice' : 'Projects and Production Readiness';
  const moduleSkills = skills.length ? skills : DOMAIN_SEQUENCES.generic.slice((moduleNumber - 1) * 4, moduleNumber * 4);
  const weekTitles = [
    `${moduleSkills[0] || careerName} fundamentals`,
    `${moduleSkills[1] || moduleSkills[0] || careerName} practice`,
    `${moduleSkills[2] || moduleSkills[1] || moduleSkills[0] || careerName} application`,
    `${moduleSkills[3] || moduleSkills[2] || moduleSkills[1] || careerName} project work`,
  ];

  return {
    moduleNumber,
    title: moduleTitle,
    description: `Build ${careerName} capability through ${moduleSkills.join(', ')} in strict prerequisite order.`,
    weeks: weekTitles.map((weekTitle, weekIndex) => {
      const weekSkill = moduleSkills[weekIndex % moduleSkills.length] || careerName;
      const weekDifficulty: Difficulty = weekIndex === 0 ? 'Beginner' : weekIndex === 1 ? 'Intermediate' : weekIndex === 2 ? 'Advanced' : 'Industry Ready';
      const dayFocuses = ['Concepts', 'Implementation', 'Practice', 'Review', 'Mini Project'];

      return {
        weekNumber: weekIndex + 1,
        title: weekTitle,
        description: `Progress through ${weekTitle.toLowerCase()} with daily practice and review.`,
        weeklyRevision: `Review the week's ${weekTitle.toLowerCase()} notes, decisions, commands, and mistakes.`,
        weeklyQuiz: `Answer scenario-based questions covering ${weekTitle.toLowerCase()}.`,
        handsOnAssignment: `Complete a checked assignment using ${weekTitle.toLowerCase()} in a realistic workflow.`,
        miniProject: `Build a small ${careerName} artifact that demonstrates ${weekTitle.toLowerCase()}.`,
        days: dayFocuses.map((focusLabel, dayIndex) => buildDay(weekSkill, focusLabel, weekDifficulty, dayIndex + 1, prerequisiteRef)),
      };
    }),
    moduleAssessment: `Complete a module assessment covering ${moduleSkills.join(', ')}.`,
    realWorldProject: `Build a ${careerName} project milestone using ${moduleSkills.join(', ')}.`,
    interviewQuestions: moduleSkills.map((skill) => `Explain how you would use ${skill} in a real ${careerName} role.`).slice(0, 3),
    commonMistakes: moduleSkills.map((skill) => `Skipping ${skill} fundamentals before using advanced tools.`).slice(0, 3),
    industryTips: moduleSkills.map((skill) => `Document your ${skill} decisions like a working professional.`).slice(0, 3),
  };
}

function buildPresetModule(careerName: string, presetModule: { title: string; skills: string[]; moduleLabel: string }, moduleNumber: number, prerequisiteRef: { value: string }) {
  const module = buildTemplateModule(careerName, moduleNumber, presetModule.skills, prerequisiteRef);
  return {
    ...module,
    title: presetModule.title,
    description: `${presetModule.moduleLabel} for ${careerName}: ${presetModule.title.toLowerCase()}.`,
  };
}

function buildCareerPreparationModule(prerequisiteRef: { value: string }) {
  const skills = [
    'Portfolio',
    'GitHub',
    'Resume',
    'LinkedIn',
    'Mock Interviews',
    'HR Questions',
    'Technical Questions',
    'Salary Negotiation',
    'Job Search Strategy',
  ];

  const weekThemes = [
    { title: 'Portfolio, GitHub, Resume, and LinkedIn', skills: skills.slice(0, 4), difficulty: 'Intermediate' as Difficulty },
    { title: 'Mock Interviews, Questions, Negotiation, and Job Search', skills: skills.slice(4, 8), difficulty: 'Advanced' as Difficulty },
    { title: 'Application Strategy and Proof of Work', skills: ['Portfolio', 'Resume', 'LinkedIn', 'Case Studies'], difficulty: 'Advanced' as Difficulty },
    { title: 'Final Readiness and Hiring Plan', skills: ['Interview Questions', 'Salary Negotiation', 'Job Search Strategy', 'Follow-Up'], difficulty: 'Industry Ready' as Difficulty },
  ];

  return {
    moduleNumber: 5,
    title: 'Career Preparation',
    description: 'Turn the curriculum into employable proof, interview readiness, and a focused job search plan.',
    weeks: weekThemes.map((weekTheme, weekIndex) => ({
      weekNumber: weekIndex + 1,
      title: weekTheme.title,
      description: 'Prepare the evidence and communication needed for hiring conversations.',
      weeklyRevision: 'Review portfolio proof, interview answers, and job-search progress.',
      weeklyQuiz: 'Answer hiring-readiness questions and identify weak areas.',
      handsOnAssignment: 'Complete one hiring asset and request feedback.',
      miniProject: 'Package the strongest project as a recruiter-ready portfolio case study.',
      days: ['Portfolio', 'Proof', 'Practice', 'Refine', 'Apply'].map((focusLabel, dayIndex) => {
        const skill = weekTheme.skills[dayIndex % weekTheme.skills.length] || weekTheme.skills[0];
        return buildDay(skill, focusLabel, weekTheme.difficulty, dayIndex + 1, prerequisiteRef);
      }),
    })),
    moduleAssessment: 'Complete a final readiness assessment across portfolio, interviews, and job-search strategy.',
    realWorldProject: 'Publish a complete portfolio package with project proof, resume, LinkedIn, and interview stories.',
    interviewQuestions: ['Tell me about yourself.', 'Walk me through your strongest project.', 'How do you handle feedback and ambiguity?'],
    commonMistakes: ['Applying without tailored proof.', 'Using vague project descriptions.', 'Ignoring negotiation and follow-up strategy.'],
    industryTips: ['Quantify impact wherever possible.', 'Keep GitHub repositories clean and readable.', 'Practice concise answers out loud before interviews.'],
  };
}

function buildTemplateRoadmap(careerName: string): GeneratedRoadmapOutput {
  const templateKey = resolveTemplateKey(careerName) as TemplateKey;
  const sequence = DOMAIN_SEQUENCES[templateKey] ?? DOMAIN_SEQUENCES.generic;
  const normalizedCareer = normalizeCareerName(careerName).toLowerCase();
  const preset = CAREER_ROADMAP_PRESETS[normalizedCareer];
  const prerequisiteRef = { value: 'None' };
  const modules = preset
    ? [
        buildPresetModule(careerName, preset.modules[0], 1, prerequisiteRef),
        buildPresetModule(careerName, preset.modules[1], 2, prerequisiteRef),
        buildPresetModule(careerName, preset.modules[2], 3, prerequisiteRef),
        buildPresetModule(careerName, preset.modules[3], 4, prerequisiteRef),
        buildCareerPreparationModule(prerequisiteRef),
      ] as GeneratedRoadmapOutput['modules']
    : [
        buildTemplateModule(careerName, 1, sequence.slice(0, 3), prerequisiteRef),
        buildTemplateModule(careerName, 2, sequence.slice(3, 6), prerequisiteRef),
        buildTemplateModule(careerName, 3, sequence.slice(6, 9), prerequisiteRef),
        buildTemplateModule(careerName, 4, sequence.slice(9, 12), prerequisiteRef),
        buildCareerPreparationModule(prerequisiteRef),
      ] as GeneratedRoadmapOutput['modules'];

  return {
    careerName: normalizeCareerName(careerName),
    summary: preset?.summary || `A premium ${careerName} curriculum that follows prerequisite order from foundations to industry projects, interview preparation, and job-search readiness.`,
    templateKey,
    version: 1,
    generatedBy: 'domain-template',
    generatedAt: new Date().toISOString(),
    approved: false,
    status: 'draft',
    modules,
  };
}

function normalizeTopics(topics: Array<TopicSeed>): TopicSeed[] {
  const normalized: TopicSeed[] = [...topics];
  const defaultTopic: TopicSeed = {
    title: 'Additional topic',
    description: 'Continue building the skill with a practical topic.',
    explanation: 'Continue with detailed technical explanation and guided understanding.',
    difficulty: 'Beginner',
    estimatedDuration: '45 min',
    learningObjective: 'Extend the learning with a practical task.',
    prerequisite: 'Previous topic',
    handsOnExercise: 'Complete a focused hands-on exercise for this continued topic.',
    handsOnTask: 'Continue the previous hands-on task.',
    miniExercise: 'Complete a short reinforcement exercise.',
    expectedOutcome: 'Produce a concrete artifact that proves understanding of the topic.',
    practicalTask: 'Continue the previous practical task.',
    resources: { ...EMPTY_RESOURCE_BUCKETS },
  };

  while (normalized.length < 4) {
    const base = normalized[normalized.length - 1] ?? defaultTopic;
    normalized.push({
      ...base,
      title: `${base.title} (continued)`,
      description: `${base.description} Continue the work with another focused step.`,
    });
  }
  return normalized.slice(0, 6).map((topic, index, all) => {
    const previous = index === 0 ? topic.prerequisite || 'None' : all[index - 1].title;
    const handsOnTask = topic.handsOnTask || topic.practicalTask || `Practice ${topic.title} in a hands-on exercise.`;
    return {
      ...topic,
      prerequisite: previous,
      explanation: topic.explanation || topic.description,
      handsOnExercise: topic.handsOnExercise || topic.handsOnTask || topic.practicalTask || `Complete a hands-on exercise for ${topic.title}.`,
      handsOnTask,
      miniExercise: topic.miniExercise || `Complete a short exercise for ${topic.title}.`,
      expectedOutcome: topic.expectedOutcome || `Demonstrate ${topic.title} through a tangible, reviewable output.`,
      practicalTask: topic.practicalTask || handsOnTask,
      resources: { ...EMPTY_RESOURCE_BUCKETS },
    };
  });
}

function normalizeDays(days: Array<{ dayNumber?: number; title: string; description: string; topics: TopicSeed[] }>) {
  const normalized = days.map((day, dayIndex) => ({
    dayNumber: dayIndex + 1,
    title: day.title,
    description: day.description,
    topics: normalizeTopics(day.topics),
  }));

  while (normalized.length < 5) {
    const base = normalized[normalized.length - 1] ?? {
      title: 'Additional day',
      description: 'Continue the weekly practice with another day of work.',
      topics: normalizeTopics([]),
    };
    normalized.push({
      dayNumber: normalized.length + 1,
      title: `${base.title} (continued)`,
      description: `${base.description} Continue the weekly progression.`,
      topics: normalizeTopics(base.topics),
    });
  }

  return normalized.slice(0, 7);
}

function normalizeWeeks(weeks: Array<{ weekNumber?: number; title: string; description: string; days: Array<{ dayNumber?: number; title: string; description: string; topics: TopicSeed[] }> }>) {
  const normalized = weeks.map((week, weekIndex) => ({
    weekNumber: weekIndex + 1,
    title: week.title,
    description: week.description,
    days: normalizeDays(week.days),
    weeklyRevision: (week as any).weeklyRevision || `Review ${week.title} concepts and notes.`,
    weeklyQuiz: (week as any).weeklyQuiz || `Complete a short quiz for ${week.title}.`,
    handsOnAssignment: (week as any).handsOnAssignment || `Complete a hands-on assignment for ${week.title}.`,
    miniProject: (week as any).miniProject || `Build a mini project using ${week.title}.`,
  }));

  while (normalized.length < 4) {
    const base = normalized[normalized.length - 1] ?? {
      title: 'Additional week',
      description: 'Continue the module with another focused week of practice.',
      days: normalizeDays([]),
    };
    normalized.push({
      weekNumber: normalized.length + 1,
      title: `${base.title} (continued)`,
      description: `${base.description} Continue the module focus with a new week.`,
      days: normalizeDays(base.days),
      weeklyRevision: `Review ${base.title} concepts and notes.`,
      weeklyQuiz: `Complete a short quiz for ${base.title}.`,
      handsOnAssignment: `Complete a hands-on assignment for ${base.title}.`,
      miniProject: `Build a mini project using ${base.title}.`,
    });
  }

  return normalized.slice(0, 5);
}

function normalizeModules(modules: Array<{ moduleNumber?: number; title: string; description: string; weeks: Array<{ weekNumber?: number; title: string; description: string; days: Array<{ dayNumber?: number; title: string; description: string; topics: TopicSeed[] }> }> }>) {
  const normalized = modules.map((module, moduleIndex) => ({
    moduleNumber: moduleIndex + 1,
    title: module.title,
    description: module.description,
    weeks: normalizeWeeks(module.weeks),
    moduleAssessment: (module as any).moduleAssessment || `Complete an assessment for ${module.title}.`,
    realWorldProject: (module as any).realWorldProject || `Build a real-world project using ${module.title}.`,
    interviewQuestions: ((module as any).interviewQuestions?.length ? (module as any).interviewQuestions : [
      `Explain the most important concept from ${module.title}.`,
      `Describe a real use case for ${module.title}.`,
      `What mistakes should be avoided in ${module.title}?`,
    ]).slice(0, 5),
    commonMistakes: ((module as any).commonMistakes?.length ? (module as any).commonMistakes : [
      `Skipping prerequisites before ${module.title}.`,
      `Practicing without feedback in ${module.title}.`,
      `Ignoring production constraints in ${module.title}.`,
    ]).slice(0, 5),
    industryTips: ((module as any).industryTips?.length ? (module as any).industryTips : [
      `Document decisions while learning ${module.title}.`,
      `Connect ${module.title} practice to portfolio proof.`,
      `Review ${module.title} tradeoffs before interviews.`,
    ]).slice(0, 5),
  }));

  while (normalized.length < 5) {
    const base = normalized[normalized.length - 1] ?? {
      title: 'Additional module',
      description: 'Continue the career roadmap with another strategic module.',
      weeks: normalizeWeeks([]),
    };
    normalized.push({
      moduleNumber: normalized.length + 1,
      title: `${base.title} (continued)`,
      description: `${base.description} Continue the career progression with another module.`,
      weeks: normalizeWeeks(base.weeks),
      moduleAssessment: `Complete an assessment for ${base.title}.`,
      realWorldProject: `Build a real-world project using ${base.title}.`,
      interviewQuestions: [`Explain ${base.title}.`, `Apply ${base.title} to a project.`, `Review tradeoffs in ${base.title}.`],
      commonMistakes: [`Skipping ${base.title} practice.`, `Ignoring prerequisites.`, `Not documenting decisions.`],
      industryTips: [`Keep ${base.title} portfolio-ready.`, `Practice concise explanations.`, `Ask for review feedback.`],
    });
  }

  const curated = normalized.slice(0, 8).map((module, index) => ({ ...module, moduleNumber: index + 1 }));
  if (curated.length > 0) {
    curated[0] = {
      ...curated[0],
      title: `${normalizeCareerName(curated[0].title)}: Domain Introduction and Prerequisites`,
    };
    curated[curated.length - 1] = {
      ...curated[curated.length - 1],
      title: 'Career Preparation and Industry Readiness',
    };
  }

  return curated as GeneratedRoadmapOutput['modules'];
}

function buildFallbackRoadmap(careerName: string): GeneratedRoadmapOutput {
  return buildTemplateRoadmap(careerName);
}

function buildPrompt(careerName: string) {
  const detection = detectCareerDomain(careerName);
  const templateKey = detection.domain.key as TemplateKey;
  const prerequisiteOrder = DOMAIN_SEQUENCES[templateKey].join(' -> ');
  const domainPrefix = buildDomainAwarePromptPrefix(detection);

  return [
    domainPrefix,
    'You are a Senior Curriculum Designer, Senior Software Engineer, Technical Instructor, and Industry Mentor.',
    'Generate a complete, industry-standard curriculum that a student can follow for several months.',
    'Return valid JSON only. No markdown. No commentary. No code fences.',
    'Do not mention resources, links, URLs, books, videos, papers, or external references.',
    'Do not include learning platforms; focus on curriculum structure, concepts, practice tasks, assessment, and readiness outcomes.',
    'Do not summarize. Generate the complete curriculum with sufficient depth and detail.',
    'Avoid generic module titles such as Foundations, Basics, Orientation, Start Here, or Introduction Module unless immediately followed by detailed technical scope.',
    `Use the closest reusable template: ${templateKey}.`,
    `Follow this prerequisite order strictly, adapting names to the career when needed: ${prerequisiteOrder}.`,
    'Use this exact structure:',
    '{',
    '  "careerName": string,',
    '  "summary": string,',
    '  "templateKey": string,',
    '  "version": 1,',
    '  "generatedBy": "gemini",',
    '  "generatedAt": ISO date string,',
    '  "approved": false,',
    '  "status": "draft",',
    '  "modules": [',
    '    {',
    '      "moduleNumber": number,',
    '      "title": string,',
    '      "description": string,',
    '      "weeks": [',
    '        {',
    '          "weekNumber": number,',
    '          "title": string,',
    '          "description": string,',
    '          "weeklyRevision": string,',
    '          "weeklyQuiz": string,',
    '          "handsOnAssignment": string,',
    '          "miniProject": string,',
    '          "days": [',
    '            {',
    '              "dayNumber": number,',
    '              "title": string,',
    '              "description": string,',
    '              "topics": [',
    '                {',
    '                  "title": string,',
    '                  "description": string,',
    '                  "difficulty": "Beginner" | "Intermediate" | "Advanced" | "Industry Ready",',
    '                  "estimatedDuration": string,',
    '                  "learningObjective": string,',
    '                  "prerequisite": string,',
    '                  "handsOnTask": string,',
    '                  "miniExercise": string,',
    '                  "resources": []',
    '                }',
    '              ]',
    '            }',
    '          ]',
    '        }',
    '      ]',
    '      "moduleAssessment": string,',
    '      "realWorldProject": string,',
    '      "interviewQuestions": string[],',
    '      "commonMistakes": string[],',
    '      "industryTips": string[]',
    '    }',
    '  ]',
    '}',
    '',
    'Curriculum rules:',
    '- Produce 5 to 8 modules.',
    '- Modules must follow strict prerequisite order. Do not jump ahead or randomize topics.',
    '- Module 1 must establish domain introduction, role context, business use cases, and essential terminology.',
    '- Final module must be Career Preparation and Industry Readiness including portfolio, interview readiness, and job-search strategy.',
    '- Produce 20 to 35 weeks in total.',
    '- Each module must contain 3 to 5 weeks.',
    '- Each week must contain 5 to 7 learning days.',
    '- Each day must contain 3 to 6 topics.',
    '- Every week must include Weekly Revision, Weekly Quiz, Hands-on Assignment, and Mini Project fields.',
    '- Every module must include Module Assessment, Real-world Project, Interview Questions, Common Mistakes, and Industry Tips fields.',
    '- Use progressive difficulty across the roadmap: start with Beginner, move through Intermediate and Advanced, and conclude with Industry Ready skills.',
    '- Each topic must be specific, teachable, and actionable.',
    '- Each topic must include title, description, explanation, difficulty, estimatedDuration, learningObjective, prerequisite, handsOnExercise, handsOnTask, miniExercise, expectedOutcome, and resources: [].',
      '- Each topic must include title, description, explanation, difficulty, estimatedDuration, learningObjective, prerequisite, handsOnExercise, handsOnTask, miniExercise, expectedOutcome, and structured resource buckets for documentation, video, practice, notes, books, projects, and interviewQuestions.',
    '- Every topic prerequisite must reference None for the first topic or an earlier topic/module concept.',
    '- Avoid duplicate topic titles.',
    '- Keep descriptions practical, job-relevant, and aligned with the career pathway.',
    '- Do not generate any external links, URLs, or resource suggestions.',
    '',
    `Career name: ${careerName}`,
  ].join('\n');
}

function extractJson(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/m);
  if (!match) {
    throw new Error('Gemini returned non-JSON content');
  }

  return match[0];
}

function coerceRoadmap(candidate: unknown, careerName: string, generatedBy: string): GeneratedRoadmapOutput {
  const parsed = typeof candidate === 'string' ? JSON.parse(extractJson(candidate)) : candidate as any;
  const fallback = buildTemplateRoadmap(careerName);
  const sourceModules = Array.isArray(parsed?.modules) && parsed.modules.length ? parsed.modules : fallback.modules;
  const normalized = {
    careerName: normalizeCareerName(parsed?.careerName || careerName),
    summary: parsed?.summary || fallback.summary,
    templateKey: parsed?.templateKey || fallback.templateKey,
    version: Number.isInteger(parsed?.version) ? parsed.version : 1,
    generatedBy,
    generatedAt: parsed?.generatedAt || new Date().toISOString(),
    approved: false,
    status: 'draft' as const,
    modules: normalizeModules(sourceModules),
  };

  return safeParseAIResponse(normalized, generatedRoadmapSchema) as GeneratedRoadmapOutput;
}

export class MasterRoadmapGeneratorService {
  async generateRoadmapPreview(careerName: string): Promise<{ roadmap: GeneratedRoadmapOutput; source: 'gemini' | 'fallback'; model?: string; diagnostics: GeneratorDiagnostics }> {
    const prompt = buildPrompt(careerName);
    const model = config.gemini.model || 'gemini-3.1-flash-lite';
    const evaluateDiagnostics = (roadmap: GeneratedRoadmapOutput, regenerated: boolean): GeneratorDiagnostics => {
      const quality = scoreRoadmapQuality(roadmap);
      const prerequisiteGraph = validatePrerequisiteGraph(roadmap);
      return {
        quality,
        prerequisiteGraphValid: prerequisiteGraph.valid,
        warnings: [...quality.warnings, ...prerequisiteGraph.warnings, ...prerequisiteGraph.violations],
        regenerated,
      };
    };

    try {
      const provider = new GeminiProvider(model);
      const roadmapFirstPass = await provider.generateJsonValidated(
        prompt,
        (raw) => coerceRoadmap(raw, careerName, 'gemini'),
        { maxTokens: 12000, temperature: 0.2, timeoutMs: 120_000 }
      );
      const firstDiagnostics = evaluateDiagnostics(roadmapFirstPass as GeneratedRoadmapOutput, false);

      if (!firstDiagnostics.quality.passed) {
        const regenPrompt = [
          prompt,
          '',
          'Regeneration instruction:',
          'Previous roadmap quality score was below 90. Regenerate once and fix these issues:',
          ...firstDiagnostics.warnings.slice(0, 20).map((warning) => `- ${warning}`),
          'Return full JSON roadmap again with corrected prerequisite order, module completeness, and topic quality.',
        ].join('\n');

        const roadmapSecondPass = await provider.generateJsonValidated(
          regenPrompt,
          (raw) => coerceRoadmap(raw, careerName, 'gemini'),
          { maxTokens: 12000, temperature: 0.15, timeoutMs: 120_000 }
        );

        const secondDiagnostics = evaluateDiagnostics(roadmapSecondPass as GeneratedRoadmapOutput, true);
        return { roadmap: roadmapSecondPass as GeneratedRoadmapOutput, source: 'gemini', model, diagnostics: secondDiagnostics };
      }

      return { roadmap: roadmapFirstPass as GeneratedRoadmapOutput, source: 'gemini', model, diagnostics: firstDiagnostics };
    } catch (error) {
      console.warn('[MasterRoadmapGenerator] Gemini generation failed, using fallback template:', error);
      const roadmap = safeParseAIResponse(buildFallbackRoadmap(careerName), generatedRoadmapSchema) as GeneratedRoadmapOutput;
      return {
        roadmap,
        source: 'fallback',
        diagnostics: evaluateDiagnostics(roadmap, false),
      };
    }
  }
}

export const masterRoadmapGeneratorService = new MasterRoadmapGeneratorService();
