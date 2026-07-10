// XP configuration for gamification
export const XP_RULES = {
  RESOURCE: 5,      // Per resource completed
  TOPIC: 20,        // Per topic completed (all resources in topic done)
  DAY: 50,          // Per day completed (all topics in day done)
  WEEK: 150,        // Per week completed (all days in week done)
  MODULE: 500,      // Per module completed (all weeks in module done)
} as const;

export type XpEventType = keyof typeof XP_RULES;

export function getXpForEvent(eventType: XpEventType): number {
  return XP_RULES[eventType];
}
