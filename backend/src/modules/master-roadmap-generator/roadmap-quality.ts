import type { GeneratedRoadmapOutput } from './master-roadmap-generator.validators';
import { DOMAIN_TEMPLATE_REGISTRY, inferTemplateKeyFromRoadmap } from './domain-intelligence';

type CheckResult = {
  key: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  warnings: string[];
};

export type RoadmapQualityReport = {
  score: number;
  passed: boolean;
  checks: CheckResult[];
  warnings: string[];
  recommendation: string;
};

export type PrerequisiteGraphReport = {
  valid: boolean;
  warnings: string[];
  violations: string[];
};

function allTopics(roadmap: GeneratedRoadmapOutput) {
  return roadmap.modules.flatMap((module) =>
    module.weeks.flatMap((week) =>
      week.days.flatMap((day) =>
        day.topics.map((topic) => ({
          module: module.title,
          week: week.weekNumber,
          day: day.dayNumber,
          topic,
        }))
      )
    )
  );
}

function checkCompleteness(roadmap: GeneratedRoadmapOutput): CheckResult {
  const moduleOk = roadmap.modules.length >= 5 && roadmap.modules.length <= 8;
  const weekCount = roadmap.modules.reduce((sum, module) => sum + module.weeks.length, 0);
  const weeksOk = weekCount >= 20 && weekCount <= 35;
  const dayOk = roadmap.modules.every((module) => module.weeks.every((week) => week.days.length >= 5 && week.days.length <= 7));
  const topicDensityOk = roadmap.modules.every((module) => module.weeks.every((week) => week.days.every((day) => day.topics.length >= 3 && day.topics.length <= 6)));

  const passed = moduleOk && weeksOk && dayOk && topicDensityOk;
  const warnings: string[] = [];
  if (!moduleOk) warnings.push(`Modules out of range: ${roadmap.modules.length}.`);
  if (!weeksOk) warnings.push(`Total weeks out of range: ${weekCount}.`);
  if (!dayOk) warnings.push('At least one week does not have 5 to 7 learning days.');
  if (!topicDensityOk) warnings.push('At least one day does not have 3 to 6 topics.');

  return {
    key: 'completeness',
    passed,
    score: passed ? 20 : Math.max(8, 20 - warnings.length * 4),
    maxScore: 20,
    message: passed ? 'Module, week, day, and topic density checks passed.' : 'Curriculum completeness constraints are not fully satisfied.',
    warnings,
  };
}

function checkDuplicates(roadmap: GeneratedRoadmapOutput): CheckResult {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const entry of allTopics(roadmap)) {
    const key = entry.topic.title.trim().toLowerCase();
    if (seen.has(key)) {
      duplicates.add(entry.topic.title);
    }
    seen.add(key);
  }

  const passed = duplicates.size === 0;
  return {
    key: 'duplicates',
    passed,
    score: passed ? 10 : Math.max(2, 10 - duplicates.size * 2),
    maxScore: 10,
    message: passed ? 'No duplicate topic titles found.' : 'Duplicate topics detected.',
    warnings: passed ? [] : Array.from(duplicates).slice(0, 10).map((title) => `Duplicate topic: ${title}`),
  };
}

function checkDifficultyProgression(roadmap: GeneratedRoadmapOutput): CheckResult {
  const order = ['Beginner', 'Intermediate', 'Advanced', 'Industry Ready'];
  let previous = 0;
  const warnings: string[] = [];

  for (const entry of allTopics(roadmap)) {
    const current = order.indexOf(entry.topic.difficulty);
    if (current < previous && current !== 0) {
      warnings.push(`Difficulty regresses at Week ${entry.week}, Day ${entry.day}: ${entry.topic.title}`);
    }
    previous = Math.max(previous, current);
  }

  const passed = warnings.length === 0;
  return {
    key: 'difficulty-progression',
    passed,
    score: passed ? 10 : Math.max(3, 10 - warnings.length),
    maxScore: 10,
    message: passed ? 'Difficulty progression is logically ordered.' : 'Difficulty progression has regressions.',
    warnings: warnings.slice(0, 12),
  };
}

function checkProjectAndCareerReadiness(roadmap: GeneratedRoadmapOutput): CheckResult {
  const moduleTexts = roadmap.modules.map((m) => `${m.title} ${m.description}`.toLowerCase());
  const hasCareerPrep = moduleTexts.some((text) => text.includes('career preparation') || text.includes('industry readiness'));
  const hasCapstone = moduleTexts.some((text) => text.includes('capstone')) || roadmap.modules.some((m) => /capstone/i.test(m.realWorldProject || ''));
  const hasInterview = roadmap.modules.some((m) => (m.interviewQuestions?.length || 0) >= 3);

  const warnings: string[] = [];
  if (!hasCareerPrep) warnings.push('Career preparation module not found.');
  if (!hasCapstone) warnings.push('Capstone project evidence not found.');
  if (!hasInterview) warnings.push('Interview preparation coverage is weak.');

  const passed = warnings.length === 0;
  return {
    key: 'project-career-coverage',
    passed,
    score: passed ? 15 : Math.max(5, 15 - warnings.length * 4),
    maxScore: 15,
    message: passed ? 'Project, capstone, and career readiness checks passed.' : 'Project or career readiness coverage is incomplete.',
    warnings,
  };
}

function checkPrerequisiteAlignment(roadmap: GeneratedRoadmapOutput): CheckResult {
  const templateKey = inferTemplateKeyFromRoadmap(roadmap);
  const expected = DOMAIN_TEMPLATE_REGISTRY[templateKey].prerequisiteSequence.map((item) => item.toLowerCase());
  const moduleTitles = roadmap.modules.map((module) => module.title.toLowerCase());

  let matched = 0;
  for (const expectedItem of expected) {
    if (moduleTitles.some((title) => title.includes(expectedItem.split(' ')[0]))) {
      matched += 1;
    }
  }

  const ratio = matched / expected.length;
  const passed = ratio >= 0.45;
  const warnings = passed ? [] : [`Only ${matched}/${expected.length} expected sequence anchors found in module titles.`];

  return {
    key: 'prerequisite-alignment',
    passed,
    score: Math.round(20 * Math.max(0.25, ratio)),
    maxScore: 20,
    message: passed ? 'Roadmap reflects expected domain prerequisite anchors.' : 'Roadmap deviates from expected domain anchors.',
    warnings,
  };
}

export function validatePrerequisiteGraph(roadmap: GeneratedRoadmapOutput): PrerequisiteGraphReport {
  const topics = allTopics(roadmap);
  const seen = new Set<string>();
  const violations: string[] = [];

  for (const entry of topics) {
    const title = entry.topic.title.trim().toLowerCase();
    const prerequisite = (entry.topic.prerequisite || '').trim().toLowerCase();

    if (prerequisite && prerequisite !== 'none' && !seen.has(prerequisite)) {
      const fuzzyMatch = Array.from(seen).some((s) => prerequisite.includes(s) || s.includes(prerequisite));
      if (!fuzzyMatch) {
        violations.push(`Prerequisite order issue at Week ${entry.week}, Day ${entry.day}: "${entry.topic.title}" depends on "${entry.topic.prerequisite}" before it appears.`);
      }
    }

    seen.add(title);
  }

  const warnings: string[] = [];
  const hasReactBeforeJs = topics.some((entry, index) => /react/i.test(entry.topic.title) && topics.slice(index + 1).some((later) => /javascript/i.test(later.topic.title)));
  const hasMlBeforePython = topics.some((entry, index) => /machine learning/i.test(entry.topic.title) && topics.slice(index + 1).some((later) => /python/i.test(later.topic.title)));
  if (hasReactBeforeJs) warnings.push('React appears before JavaScript in topic order.');
  if (hasMlBeforePython) warnings.push('Machine Learning appears before Python in topic order.');

  return {
    valid: violations.length === 0 && warnings.length === 0,
    warnings,
    violations,
  };
}

export function scoreRoadmapQuality(roadmap: GeneratedRoadmapOutput): RoadmapQualityReport {
  const checks: CheckResult[] = [
    checkCompleteness(roadmap),
    checkDuplicates(roadmap),
    checkDifficultyProgression(roadmap),
    checkProjectAndCareerReadiness(roadmap),
    checkPrerequisiteAlignment(roadmap),
  ];

  const graph = validatePrerequisiteGraph(roadmap);
  checks.push({
    key: 'prerequisite-graph',
    passed: graph.valid,
    score: graph.valid ? 25 : Math.max(5, 25 - graph.violations.length * 3 - graph.warnings.length * 2),
    maxScore: 25,
    message: graph.valid ? 'Prerequisite graph order is valid.' : 'Prerequisite graph has ordering issues.',
    warnings: [...graph.violations, ...graph.warnings],
  });

  const score = Math.max(0, Math.min(100, checks.reduce((sum, check) => sum + check.score, 0)));
  const warnings = checks.flatMap((check) => check.warnings);

  const recommendation = score >= 90
    ? 'Roadmap quality is strong. Ready for admin review.'
    : score >= 75
      ? 'Roadmap quality is acceptable but should be reviewed with warnings.'
      : 'Roadmap quality is weak. Regeneration is recommended before admin review.';

  return {
    score,
    passed: score >= 90,
    checks,
    warnings,
    recommendation,
  };
}
