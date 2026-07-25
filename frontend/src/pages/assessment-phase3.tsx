import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveLastAccessedPhase } from "@/utils/assessmentProgress";
import {
  assessmentService,
  type AdaptiveQuestion,
  type AdaptiveSubmitResponse,
} from "@/services/assessmentService";
import { csvCareerService } from "@/services/csvCareerService";
import {
  Brain, CheckCircle2, ArrowRight, AlertCircle,
  TrendingUp, Target, BookOpen, Sparkles, BarChart2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "quiz" | "submitting" | "results";

const TOTAL_PHASES = 7;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentPhase3() {
  const [, navigate]   = useLocation();
  const { toast }      = useToast();
  const { user, reloadUser } = useAuth();
  const queryClient    = useQueryClient();

  const [phase,           setPhase]           = useState<Phase>("loading");
  const [sessionId,       setSessionId]       = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [selectedAnswer,  setSelectedAnswer]  = useState<string | null>(null);
  const [confidence,      setConfidence]      = useState(0);
  const [progress,        setProgress]        = useState({ answered: 0, totalRelevant: 7 });
  const [result,          setResult]          = useState<AdaptiveSubmitResponse | null>(null);
  const [error,           setError]           = useState<string | null>(null);

  // ── Start Phase 3 on mount ─────────────────────────────────────────────────
  useEffect(() => {
    saveLastAccessedPhase(3);
    
    assessmentService.startPhase3()
      .then((data) => {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.question);
        setConfidence(data.confidence ?? 0);
        if (data.progress) setProgress(data.progress);
        setPhase("quiz");
        setError(null);
      })
      .catch((err: Error) => {
        // If phase 2 not done, send back
        if (err.message?.includes("Phase 2")) {
          toast({ title: "Complete Phase 2 first", description: "Please finish Phase 2 before continuing.", variant: "destructive" });
          navigate("/assessment/phase-2");
        } else {
          setError(err.message || "Failed to start assessment. Please try again.");
          setPhase("quiz"); // show error with retry
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit adaptive session ────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (sid: string) => assessmentService.submitAdaptiveAssessment(sid),
    onSuccess: async (data) => {
      setError(null);
      try {
        localStorage.setItem("pragyan_latest_assessment_id", data.resultId);
        localStorage.setItem("pragyan_assessment_phase", "3");
        localStorage.setItem("pragyan_latest_assessment_confidence", String(data.confidence ?? 0));
      } catch { /* ignore */ }
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["csv-careers"] });
      await queryClient.invalidateQueries({ queryKey: ["assessment"] });
      // Trigger CSV recommendations in background
      csvCareerService.recommendCareers({ limit: 10, includeSkillGaps: true }).catch(() => undefined);

      if (data.nextPhaseRoute) {
        setResult(data);
        setPhase("submitting");
        setTimeout(() => navigate(data.nextPhaseRoute!), 600);
        return;
      }

      setResult(data);
      setPhase("results");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to submit. Please try again.");
      setPhase("quiz");
    },
  });

  // ── Answer question ────────────────────────────────────────────────────────
  const answerMutation = useMutation({
    mutationFn: ({ qid, answer }: { qid: string; answer: string }) =>
      assessmentService.answerAdaptiveQuestion(sessionId!, qid, answer),
    onSuccess: (data) => {
      setConfidence(data.confidence ?? 0);
      if (data.progress) setProgress(data.progress);
      setError(null);

      if (data.shouldSubmit || !data.nextQuestion) {
        setPhase("submitting");
        submitMutation.mutate(sessionId!);
      } else {
        setCurrentQuestion(data.nextQuestion!);
        setSelectedAnswer(null);
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to record answer. Please try again.");
    },
  });

  const handleAnswer = () => {
    if (!sessionId || !currentQuestion || !selectedAnswer) return;
    answerMutation.mutate({ qid: currentQuestion.id, answer: selectedAnswer });
  };

  const isBusy = answerMutation.isPending || submitMutation.isPending || phase === "submitting";
  const confidencePct = Math.round((confidence ?? 0) * 100);
  const progressPct = progress.totalRelevant > 0
    ? Math.round((progress.answered / progress.totalRelevant) * 100)
    : 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Preparing your adaptive assessment…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Loading your personalised questions based on Phase 2 interests.
        </p>
        <Progress value={30} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Analysing your responses…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Our AI is calculating your career matches based on all 3 phases.
        </p>
        <Progress value={100} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="max-w-3xl mx-auto pb-16 px-4">
        {/* Phase indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 3 of {TOTAL_PHASES} — Adaptive AI Assessment
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Confidence:</span>
              <span className={`font-bold ${
                confidencePct >= 75 ? "text-green-600" :
                confidencePct >= 40 ? "text-amber-600" : "text-primary"
              }`}>{confidencePct}%</span>
            </div>
          </div>
          <Progress value={progressPct} className="h-2" />
          <Progress value={confidencePct} className="h-1 mt-1 opacity-40" />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Adaptive Assessment</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Questions adapt based on your answers — only {progress.totalRelevant} questions needed.
          </p>
        </div>

        {/* Error or no session */}
        {(error || !currentQuestion) && (
          <div className="bg-card border border-border rounded-[20px] p-8 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              {error || "Unable to load questions"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This may happen if Phase 2 wasn't completed or there was a temporary issue.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/assessment/phase-2">
                <Button variant="outline" className="rounded-xl">Go back to Phase 2</Button>
              </Link>
              <Button className="rounded-xl" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Question card */}
        {currentQuestion && !error && (
          <div className="bg-card border border-border rounded-[20px] shadow-sm overflow-hidden">
            {/* Header bar */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {progress.answered + 1} of ~{progress.totalRelevant}
                </span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {currentQuestion.category}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="px-6 py-5 border-t border-border">
              <p className="text-lg font-semibold text-foreground leading-snug mb-6">
                {currentQuestion.question}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const active = selectedAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => !isBusy && setSelectedAnswer(opt)}
                      disabled={isBusy}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        active ? "border-primary" : "border-muted-foreground/40"
                      }`}>
                        {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-6 pt-2">
              <Button
                className="w-full rounded-xl py-3 text-base font-medium"
                onClick={handleAnswer}
                disabled={!selectedAnswer || isBusy}
                data-testid="button-next-question"
              >
                {answerMutation.isPending ? "Processing…" : "Next Question"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    const top    = result.topMatches?.[0];
    const others = result.topMatches?.slice(1, 3) ?? [];
    const strengths  = result.summary?.strengths  ?? [];
    const weaknesses = result.summary?.weaknesses ?? [];
    const roadmap    = result.summary?.learningRoadmap ?? null;

    return (
      <div className="max-w-4xl mx-auto pb-12 px-4">
        {/* Phase indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 3 of {TOTAL_PHASES} — Complete
            </span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-8">
          Your Assessment Results
        </h1>

        {/* Completion banner */}
        <div className="bg-card border border-border rounded-[20px] p-10 shadow-sm text-center mb-6"
          data-testid="assessment-complete">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Assessment Complete!</h2>
          <p className="text-muted-foreground mb-1">
            Match confidence:{" "}
            <span className="font-bold text-primary">{confidencePct}%</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {result.topMatches?.length ?? 0} career paths matched across 3 phases of analysis.
          </p>
        </div>

        {/* Top match */}
        {top && (
          <div className="bg-gradient-to-br from-primary/5 to-blue-50 border-2 border-primary/20 rounded-[20px] p-8 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-3">
                  TOP MATCH
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-1">{top.career}</h3>
                {top.category && (
                  <p className="text-sm text-muted-foreground">{top.category}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {Math.round(top.score ?? top.match ?? 0)}%
                </div>
                <p className="text-xs text-muted-foreground">Match Score</p>
              </div>
            </div>

            {/* Matched / missing skills */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {(top.matchedSkills?.length > 0) && (
                <div className="bg-white rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Matched Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {top.matchedSkills.slice(0, 6).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{s}</span>
                    ))}
                    {top.matchedSkills.length > 6 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+{top.matchedSkills.length - 6}</span>
                    )}
                  </div>
                </div>
              )}
              {((top.missingSkills?.length ?? 0) > 0 || (top.skillGaps?.length ?? 0) > 0) && (
                <div className="bg-white rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Skills to Learn</p>
                  <div className="flex flex-wrap gap-1">
                    {(top.missingSkills ?? top.skillGaps ?? []).slice(0, 6).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reasons */}
            {(top.reasons?.length ?? 0) > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium text-foreground mb-2">Why this matches you:</p>
                <ul className="space-y-1">
                  {top.reasons!.slice(0, 3).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href="/career-discovery?tab=adaptive">
              <Button className="w-full rounded-xl py-3 bg-primary text-white">
                View All Career Matches <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Other matches */}
        {others.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Other Strong Matches
            </h3>
            <div className="space-y-3">
              {others.map((m) => (
                <div key={m.career}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-semibold text-foreground">{m.career}</p>
                    {m.category && <p className="text-sm text-muted-foreground">{m.category}</p>}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(m.score ?? m.match ?? 0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths + Growth */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            {strengths.length > 0 && (
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />Your Strengths
                </h3>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />Growth Areas
                </h3>
                <ul className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 4-week roadmap */}
        {roadmap && typeof roadmap === "object" && !Array.isArray(roadmap) && (
          <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />4-Week Learning Roadmap
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(roadmap).map(([week, tasks]) => (
                <div key={week} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-semibold text-foreground mb-2 capitalize">
                    {week.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </p>
                  <ul className="space-y-1">
                    {(tasks as string[]).map((t, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">→</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 rounded-xl py-3"
            onClick={() => window.location.reload()}>
            Retake Assessment
          </Button>
          <Link href="/assessment/phase-4" className="flex-1">
            <Button className="w-full rounded-xl py-3" data-testid="button-explore-matches">
              Continue to Phase 4 <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
