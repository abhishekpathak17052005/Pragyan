/**
 * Icon mapping for career roles
 * Maps career titles/keywords to icon names (compatible with Lucide React)
 */

export const CAREER_ICON_MAP: Record<string, string> = {
  // AI & Machine Learning
  'ai engineer': 'robot',
  'artificial intelligence': 'robot',
  'machine learning': 'brain',
  'deep learning': 'brain',
  'ai developer': 'robot',

  // Cybersecurity
  'cybersecurity': 'shield',
  'cyber security': 'shield',
  'ethical hacker': 'shield',
  'security engineer': 'shield',
  'information security': 'shield',
  'penetration tester': 'shield',
  'security analyst': 'shield',

  // Data Science
  'data scientist': 'chart-bar',
  'data analyst': 'chart-bar',
  'data engineering': 'database',
  'big data': 'database',
  'analytics': 'chart-bar',

  // Frontend Development
  'frontend developer': 'code',
  'front-end': 'code',
  'react developer': 'code',
  'ui developer': 'code',
  'web developer': 'code',

  // Backend Development
  'backend developer': 'server',
  'back-end': 'server',
  'node developer': 'server',
  'api developer': 'server',

  // Fullstack Development
  'fullstack developer': 'layers',
  'full stack': 'layers',
  'full-stack': 'layers',
  'software engineer': 'layers',

  // DevOps & Cloud
  'devops': 'cloud',
  'cloud engineer': 'cloud',
  'aws': 'cloud',
  'azure': 'cloud',
  'kubernetes': 'cloud',
  'docker': 'cloud',
  'infrastructure': 'cloud',

  // Mobile Development
  'mobile developer': 'smartphone',
  'ios developer': 'smartphone',
  'android developer': 'smartphone',
  'flutter': 'smartphone',
  'react native': 'smartphone',

  // Game Development
  'game developer': 'gamepad2',
  'game engineer': 'gamepad2',
  'unity': 'gamepad2',
  'unreal': 'gamepad2',

  // QA & Testing
  'qa engineer': 'checkmark-circle',
  'quality assurance': 'checkmark-circle',
  'test engineer': 'checkmark-circle',
  'automation testing': 'checkmark-circle',

  // Database & Systems
  'database engineer': 'database',
  'dba': 'database',
  'systems engineer': 'cpu',

  // Default
  'default': 'briefcase',
};

/**
 * Get icon for a career title
 * @param title - Career title
 * @returns Icon name (Lucide icon compatible)
 */
export function getIconForCareer(title: string): string {
  if (!title) return CAREER_ICON_MAP['default'];

  const normalized = title.toLowerCase().trim();

  // Exact match first
  if (CAREER_ICON_MAP[normalized]) {
    return CAREER_ICON_MAP[normalized];
  }

  // Keyword matching (partial)
  for (const [key, icon] of Object.entries(CAREER_ICON_MAP)) {
    if (key !== 'default' && normalized.includes(key)) {
      return icon;
    }
  }

  // Reverse: check if key is in title
  for (const [key, icon] of Object.entries(CAREER_ICON_MAP)) {
    if (key !== 'default' && key.includes(normalized)) {
      return icon;
    }
  }

  return CAREER_ICON_MAP['default'];
}

/**
 * Get all available icon mappings
 */
export function getAllIconMappings(): Record<string, string> {
  return { ...CAREER_ICON_MAP };
}
