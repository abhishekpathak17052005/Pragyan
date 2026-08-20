/**
 * Assessment Progress Tracker
 *
 * Determines which phase the user should resume from.
 * All phase completion checks use the backend API — localStorage is never
 * the source of truth, so Start Over (which calls DELETE /assessment/reset)
 * is immediately reflected here without needing a page reload or cache bust.
 *
 * localStorage is still written by individual phase pages as a performance
 * hint, but this tracker ignores those values and always queries the DB.
 */

import { assessmentService } from "@/services/assessmentService";

export interface AssessmentProgress {
  currentPhase: number;
  completedPhases: number[];
  nextPhaseUrl: string;
  canResume: boolean;
  progressPercent: number;
}

const TOTAL_PHASES = 7;

// Kept for backward-compat with any code that imported this constant.
export const PHASE4_RESULT_STORAGE_KEY = "pragyan:v1:phase4_result";

const PHASE_ROUTES: Record<number, string> = {
  0: "/assessments",
  1: "/assessment/phase-1",
  2: "/assessment/phase-2",
  3: "/assessment/phase-3",
  4: "/assessment/phase-4",
  5: "/assessment/phase-5",
  6: "/assessment/phase-6",
  7: "/assessment/phase-7",
};

/**
 * Determines which assessment phase the user should continue from.
 * Each phase is checked sequentially — a phase is only checked if all
 * prior phases are confirmed complete, preventing skipping.
 */
export async function getAssessmentProgress(): Promise<AssessmentProgress> {
  try {
    const completedPhases: number[] = [];
    let currentPhase = 1;

    // ── Phase 1 ───────────────────────────────────────────────────────────────
    try {
      const p1 = await assessmentService.getPhase1();
      if (p1?.personalInfo) {
        completedPhases.push(1);
        currentPhase = 2;
      }
    } catch {
      // not completed — stop here
    }

    // ── Phase 2 ───────────────────────────────────────────────────────────────
    if (completedPhases.includes(1)) {
      try {
        const p2 = await assessmentService.getPhase2();
        if (p2?.preferredDomains && p2.preferredDomains.length > 0) {
          completedPhases.push(2);
          currentPhase = 3;
        }
      } catch {
        // not completed
      }
    }

    // ── Phase 3 — adaptive assessment (stored with phase=3 in DB) ─────────────
    if (completedPhases.includes(2)) {
      try {
        const p3 = await assessmentService.getPhase3();
        // getPhase3 returns null when no phase-3 session exists after a reset
        if (p3?.sessionId) {
          completedPhases.push(3);
          currentPhase = 4;
        }
      } catch {
        // not completed
      }
    }

    // ── Phase 4 — technical assessment ────────────────────────────────────────
    if (completedPhases.includes(3)) {
      try {
        const p4 = await assessmentService.getPhase4();
        // Phase 4 submit stores technicalConfidence in analysis
        if (p4?.sessionId) {
          completedPhases.push(4);
          currentPhase = 5;
        }
      } catch {
        // not completed
      }
    }

    // ── Phase 5 — specialization detection ────────────────────────────────────
    if (completedPhases.includes(4)) {
      try {
        const p5 = await assessmentService.getPhase5();
        if (p5?.sessionId) {
          completedPhases.push(5);
          currentPhase = 6;
        }
      } catch {
        // not completed
      }
    }

    // ── Phase 6 — confidence validation ───────────────────────────────────────
    if (completedPhases.includes(5)) {
      try {
        const p6 = await assessmentService.getPhase6();
        // Phase 6 is "complete" when assessmentValidated is true in analysis
        if (p6?.sessionId) {
          completedPhases.push(6);
          currentPhase = 7;
        }
      } catch {
        // not completed
      }
    }

    // ── Phase 7 — final report ─────────────────────────────────────────────────
    if (completedPhases.includes(6)) {
      try {
        const p7 = await assessmentService.getPhase7Report();
        if (p7 && (p7 as any)?.sessionId) {
          completedPhases.push(7);
          currentPhase = 7; // stay on 7 / go to dashboard
        }
      } catch {
        // not completed
      }
    }

    const progressPercent = Math.round((completedPhases.length / TOTAL_PHASES) * 100);
    const nextPhaseUrl = PHASE_ROUTES[currentPhase] ?? PHASE_ROUTES[1];
    const canResume = completedPhases.length > 0;

    return { currentPhase, completedPhases, nextPhaseUrl, canResume, progressPercent };
  } catch (error) {
    console.error("[getAssessmentProgress] Unexpected error:", error);
    return {
      currentPhase: 1,
      completedPhases: [],
      nextPhaseUrl: "/assessment/phase-1",
      canResume: false,
      progressPercent: 0,
    };
  }
}

/**
 * Returns true only when every phase before `targetPhase` is in `completedPhases`.
 * Phase 1 is always accessible.
 */
export function canAccessPhase(targetPhase: number, completedPhases: number[]): boolean {
  if (targetPhase === 1) return true;
  const done = new Set(completedPhases);
  for (let i = 1; i < targetPhase; i++) {
    if (!done.has(i)) return false;
  }
  return true;
}

/**
 * Human-readable name for each assessment phase.
 */
export function getPhaseDisplayName(phase: number): string {
  const names: Record<number, string> = {
    1: "Personal Profile",
    2: "Interests & Domains",
    3: "Adaptive Assessment",
    4: "Technical Assessment",
    5: "AI Specialization Detection",
    6: "Confidence Validation",
    7: "Career Recommendations",
  };
  return names[phase] ?? `Phase ${phase}`;
}

/**
 * Persists the last accessed phase to localStorage as a fast-resume hint.
 * The tracker itself never reads this — it always queries the backend.
 */
export function saveLastAccessedPhase(phase: number): void {
  try { localStorage.setItem("pragyan_last_accessed_phase", String(phase)); } catch { /* ignore */ }
}

/**
 * Reads the last accessed phase from localStorage.
 */
export function getLastAccessedPhase(): number | null {
  try {
    const v = localStorage.getItem("pragyan_last_accessed_phase");
    return v ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}
