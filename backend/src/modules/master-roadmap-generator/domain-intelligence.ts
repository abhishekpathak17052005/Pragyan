import type { GeneratedRoadmapOutput } from './master-roadmap-generator.validators';

export type DomainTemplateKey =
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

export type DomainProfile = {
  key: DomainTemplateKey;
  label: string;
  aliases: string[];
  prerequisiteSequence: string[];
};

export type DomainDetectionResult = {
  careerName: string;
  domain: DomainProfile;
  confidence: number;
  matchedAliases: string[];
};

export const DOMAIN_TEMPLATE_REGISTRY: Record<DomainTemplateKey, DomainProfile> = {
  'software-engineering': {
    key: 'software-engineering',
    label: 'Software Engineering',
    aliases: ['software', 'frontend', 'backend', 'full stack', 'developer', 'engineer', 'api', 'server', 'node', 'react'],
    prerequisiteSequence: [
      'Programming Basics',
      'Version Control (Git)',
      'Data Structures and Algorithms',
      'HTML',
      'CSS',
      'JavaScript',
      'Frontend Frameworks',
      'Backend Services',
      'Databases',
      'Deployment and DevOps Basics',
      'System Design',
      'Career Preparation',
    ],
  },
  'ai-ml': {
    key: 'ai-ml',
    label: 'AI and Machine Learning',
    aliases: ['ai', 'ml', 'machine learning', 'deep learning', 'data modeling', 'llm'],
    prerequisiteSequence: [
      'Python Programming',
      'NumPy and Scientific Computing',
      'Pandas and Data Wrangling',
      'Probability and Statistics',
      'Linear Algebra Foundations',
      'Supervised Learning',
      'Unsupervised Learning',
      'Deep Learning',
      'Model Evaluation and Tuning',
      'MLOps Fundamentals',
      'Model Deployment',
      'AI Career Preparation',
    ],
  },
  'cyber-security': {
    key: 'cyber-security',
    label: 'Cybersecurity',
    aliases: ['cyber', 'security', 'soc', 'ethical hacking', 'infosec', 'penetration'],
    prerequisiteSequence: [
      'Computer Fundamentals',
      'Networking Basics',
      'Linux Administration',
      'Python for Security Automation',
      'Web Security Fundamentals',
      'Cryptography',
      'OWASP Top Risks',
      'Security Operations Center Workflows',
      'Incident Response',
      'Cloud Security Controls',
      'Security Capstone',
      'Security Career Preparation',
    ],
  },
  'cloud-computing': {
    key: 'cloud-computing',
    label: 'Cloud Computing',
    aliases: ['cloud', 'aws', 'azure', 'gcp', 'cloud engineer'],
    prerequisiteSequence: [
      'Networking and Internet Foundations',
      'Linux and Command-Line Skills',
      'Cloud Core Concepts',
      'Identity and Access Management',
      'Compute Services',
      'Storage Services',
      'Managed Databases',
      'Cloud Networking',
      'Monitoring and Observability',
      'Cost Optimization',
      'Cloud Architecture Capstone',
      'Cloud Career Preparation',
    ],
  },
  devops: {
    key: 'devops',
    label: 'DevOps',
    aliases: ['devops', 'sre', 'site reliability', 'platform engineer', 'release engineering'],
    prerequisiteSequence: [
      'Linux Fundamentals',
      'Git Workflows',
      'Scripting for Automation',
      'Containers',
      'CI CD Pipelines',
      'Infrastructure as Code',
      'Cloud Platforms',
      'Monitoring and Alerting',
      'DevSecOps Controls',
      'Release Engineering',
      'DevOps Capstone',
      'DevOps Career Preparation',
    ],
  },
  'data-science': {
    key: 'data-science',
    label: 'Data Science',
    aliases: ['data science', 'data scientist', 'data analyst', 'analytics'],
    prerequisiteSequence: [
      'Python for Data Work',
      'SQL for Analysis',
      'NumPy',
      'Pandas',
      'Statistics for Decision Making',
      'Data Cleaning',
      'Data Visualization',
      'Exploratory Data Analysis',
      'Machine Learning for Data Science',
      'Experimentation and A B Testing',
      'Data Storytelling Capstone',
      'Data Career Preparation',
    ],
  },
  'mobile-development': {
    key: 'mobile-development',
    label: 'Mobile Development',
    aliases: ['mobile', 'android', 'ios', 'react native', 'flutter'],
    prerequisiteSequence: [
      'Programming Basics',
      'Platform Fundamentals',
      'UI Layouts',
      'State Management',
      'Navigation Patterns',
      'API Integration',
      'Local Data Storage',
      'Authentication Flows',
      'Mobile Testing',
      'Store Deployment',
      'Mobile Capstone',
      'Mobile Career Preparation',
    ],
  },
  'ui-ux': {
    key: 'ui-ux',
    label: 'UI UX Design',
    aliases: ['ui', 'ux', 'product designer', 'interface designer', 'visual design'],
    prerequisiteSequence: [
      'Design Thinking',
      'User Research',
      'Information Architecture',
      'Wireframing',
      'Visual Design Principles',
      'Design Systems',
      'Interactive Prototyping',
      'Usability Testing',
      'Accessibility Design',
      'Design Handoff',
      'Portfolio Case Study',
      'UX Career Preparation',
    ],
  },
  'game-development': {
    key: 'game-development',
    label: 'Game Development',
    aliases: ['game', 'unity', 'unreal', 'game dev'],
    prerequisiteSequence: [
      'Programming Basics',
      'Game Loop Fundamentals',
      '2D and 3D Math Essentials',
      'Input and Controls',
      'Physics in Games',
      'Animation Systems',
      'Level Design',
      'Audio Integration',
      'AI for Gameplay',
      'Optimization Techniques',
      'Playable Capstone',
      'Game Career Preparation',
    ],
  },
  blockchain: {
    key: 'blockchain',
    label: 'Blockchain',
    aliases: ['blockchain', 'web3', 'smart contract', 'solidity'],
    prerequisiteSequence: [
      'Programming Basics',
      'Cryptography Foundations',
      'Distributed Systems Basics',
      'Blockchain Fundamentals',
      'Wallets and Key Management',
      'Smart Contract Development',
      'Smart Contract Testing',
      'Security Auditing',
      'DeFi Concepts',
      'Deployment and Verification',
      'Blockchain Capstone',
      'Blockchain Career Preparation',
    ],
  },
  generic: {
    key: 'generic',
    label: 'General Technology',
    aliases: ['technology', 'tech', 'general'],
    prerequisiteSequence: [
      'Career Fundamentals',
      'Core Tools',
      'Foundational Concepts',
      'Applied Skills',
      'Workflow Design',
      'Quality Practices',
      'Intermediate Projects',
      'Advanced Concepts',
      'Industry Practices',
      'Delivery and Deployment',
      'Capstone Project',
      'Career Preparation',
    ],
  },
};

export function detectCareerDomain(careerName: string): DomainDetectionResult {
  const normalized = careerName.toLowerCase();
  let best: DomainProfile = DOMAIN_TEMPLATE_REGISTRY.generic;
  let score = 0;
  let matchedAliases: string[] = [];

  for (const profile of Object.values(DOMAIN_TEMPLATE_REGISTRY)) {
    const matches = profile.aliases.filter((alias) => normalized.includes(alias));
    if (matches.length > score) {
      best = profile;
      score = matches.length;
      matchedAliases = matches;
    }
  }

  return {
    careerName,
    domain: best,
    confidence: score > 0 ? Math.min(0.99, 0.4 + score * 0.2) : 0.35,
    matchedAliases,
  };
}

export function buildDomainAwarePromptPrefix(detection: DomainDetectionResult) {
  const sequence = detection.domain.prerequisiteSequence.join(' -> ');
  return [
    `Detected domain: ${detection.domain.label}.`,
    `Domain confidence: ${Math.round(detection.confidence * 100)}%.`,
    `Matched aliases: ${detection.matchedAliases.length ? detection.matchedAliases.join(', ') : 'none'}.`,
    `Use this expert prerequisite order exactly: ${sequence}.`,
    'Do not invent a different order. Personalize content, examples, and exercises while preserving prerequisite flow.',
  ].join('\n');
}

export function inferTemplateKeyFromRoadmap(roadmap: GeneratedRoadmapOutput): DomainTemplateKey {
  const key = (roadmap.templateKey || '').toLowerCase();
  if (key in DOMAIN_TEMPLATE_REGISTRY) {
    return key as DomainTemplateKey;
  }
  return 'generic';
}
