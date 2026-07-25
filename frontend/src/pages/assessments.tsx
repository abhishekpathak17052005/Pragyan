import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  ArrowRight,
  Brain,
  Lightbulb,
  Target,
  FileSearch,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { getAssessmentProgress, getPhaseDisplayName, type AssessmentProgress } from "@/utils/assessmentProgress";

// ── Page ──────────────────────────────────────────────────────────────────────
// This page is the /assessments landing. It shows progress and lets users
// resume from whichever phase they left off, or start fresh from Phase 1.
// The legacy inline adaptive quiz has been removed — users must go through
// the structured Phase 1→7 flow.

export default function Assessments() {
  const [, navigate] = useLocation();
  const [assessmentProgress, setAssessmentProgress] = useState<AssessmentProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    getAssessmentProgress()
      .then((prog) => {
        setAssessmentProgress(prog);
        setLoadingProgress(false);
      })
      .catch(() => setLoadingProgress(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Career Assessment
        </h1>
        <p className="text-muted-foreground mt-1">
          A personalised 7-phase journey — starting with your profile, ending with your perfect career match.
        </p>
      </div>

      {/* Resume banner (shown when user has started but not finished) */}
      {!loadingProgress && assessmentProgress && assessmentProgress.canResume && (
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-primary/5 border-2 border-primary/20 rounded-[20px] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Continue Your Assessment</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You've completed {assessmentProgress.completedPhases.length} of 7 phases ({assessmentProgress.progressPercent}%).
                Resume from <span className="font-semibold">{getPhaseDisplayName(assessmentProgress.currentPhase)}</span>.
              </p>
              <div className="flex items-center gap-3 mb-4">
                <Progress value={assessmentProgress.progressPercent} className="h-2 flex-1" />
                <span className="text-xs font-bold text-primary">{assessmentProgress.progressPercent}%</span>
              </div>
              <div className="flex gap-3">
                <Button
                  className="rounded-xl px-6"
                  onClick={() => navigate(assessmentProgress.nextPhaseUrl)}
                >
                  Resume Assessment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl px-4"
                  onClick={() => navigate("/assessment/phase-1")}
                >
                  Start Over
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {assessmentProgress.completedPhases.length}/7
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start card */}
      <div className="mt-8 bg-card border border-border rounded-[20px] p-10 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" /> Adaptive AI Assessment
            </span>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Smart Career Matching in Minutes
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Our assessment collects your profile, interests, and capabilities across 7 phases
              to deliver highly accurate career recommendations.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "Phase 1: Tell us about yourself",
                "Phase 2: Interests & domain selection",
                "Phase 3: AI adaptive assessment",
                "Phase 4: Technical skills evaluation",
                "Phases 5–7: Specialization, validation & career report",
              ].map((txt) => (
                <li key={txt} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {txt}
                </li>
              ))}
            </ul>

            {!assessmentProgress?.canResume && (
              <Button
                className="rounded-xl px-8 py-3 text-base font-medium"
                onClick={() => navigate("/assessment/phase-1")}
                data-testid="button-start-assessment"
                disabled={loadingProgress}
              >
                {loadingProgress ? "Loading..." : "Start Assessment"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          <div className="w-56 h-56 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center">
            <Brain className="w-24 h-24 text-primary/60" />
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-foreground mb-6">How it works</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              icon: FileSearch,
              label: "Phase 1 – Profile",
              desc: "Personal info, education background, career goal, and experience level.",
            },
            {
              icon: Brain,
              label: "Phases 2–3 – Discovery",
              desc: "Interest discovery and domain selection to narrow your career path.",
            },
            {
              icon: Lightbulb,
              label: "Phases 4–6 – Assessment",
              desc: "Adaptive technical questions that branch based on your answers for precision matching.",
            },
            {
              icon: Target,
              label: "Phase 7 – Results",
              desc: "Career matches with confidence scores, skill gaps, and personalised roadmaps.",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-[20px] p-6 shadow-sm flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-foreground mb-2">{label}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
