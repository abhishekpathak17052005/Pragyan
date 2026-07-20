/**
 * Icon mapping for career roles
 * Maps icon names to Lucide React icons
 */

import {
  Bot,
  Shield,
  BarChart3,
  Code,
  Server,
  Layers,
  Cloud,
  Smartphone,
  Gamepad2,
  CheckCircle2,
  Database,
  Cpu,
  Briefcase,
  Brain,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  robot: Bot,
  shield: Shield,
  'chart-bar': BarChart3,
  code: Code,
  server: Server,
  layers: Layers,
  cloud: Cloud,
  smartphone: Smartphone,
  gamepad2: Gamepad2,
  'checkmark-circle': CheckCircle2,
  database: Database,
  cpu: Cpu,
  briefcase: Briefcase,
  brain: Brain,
  default: Briefcase,
};

/**
 * Get Lucide icon component for a given icon name
 * @param iconName - Icon name from backend
 * @returns Lucide icon component
 */
export function getIconComponent(iconName?: string): LucideIcon {
  if (!iconName) return ICON_MAP.default;
  return ICON_MAP[iconName] || ICON_MAP.default;
}

/**
 * Get all available icon names
 */
export function getAvailableIcons(): string[] {
  return Object.keys(ICON_MAP).filter((icon) => icon !== 'default');
}
