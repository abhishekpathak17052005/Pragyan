import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveLastAccessedPhase } from "@/utils/assessmentProgress";
import {
  assessmentService,
  type Phase4Question,
} from "@/services/assessmentService";
import {
  Sparkles, CheckCircle2, ArrowRight, AlertCircle, Target,
  TrendingUp, Award, Brain, Zap, BookOpen, Briefcase,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "prediction" | "quiz" | "submitting" | "results";

const TOTAL_PHASES = 7;

interface PredictedRole {
  role: string;
  matchScore: number;
  category?: string;
  skillsRequired?: string[];
}

interface ResultsSummary {
  resultId: string;
  sessionId: string;
  confidence: number;
  summary: {
    bestCareerRoles: Array<{
      role: string;
      matchScore: number;
      category?: string;
      readiness: number;
    }>;
    roleReadiness: Record<string, number>;
    specializationLevel: "Entry-Level" | "Mid-Level" | "Senior" | "Expert";
    specializationScore: number;
    strengthAreas: string[];
    missingCompetencies: string[];
    confidenceScore: number;
    careerFitAnalysis: string;
    industryReadiness: Record<string, number>;
    nextSteps: string[];
  };
}

// ── Helper Components ─────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 my-4 overflow-x-auto">
      <pre className="text-sm text-slate-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function QuestionTypeBadge({ type }: { type: Phase4Question["questionType"] }) {
  const colors: Record<Phase4Question["questionType"], string> = {
    MCQ: "bg-blue-100 text-blue-700",
    Scenario: "bg-purple-100 text-purple-700",
    Conceptual: "bg-green-100 text-green-700",
    Practical: "bg-amber-100 text-amber-700",
    Experience: "bg-pink-100 text-pink-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[type]}`}>
      {type}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Phase4Question["difficulty"] }) {
  const colors: Record<Phase4Question["difficulty"], string> = {
    Foundation: "bg-green-100 text-green-700 border-green-200",
    Intermediate: "bg-blue-100 text-blue-700 border-blue-200",
    Advanced: "bg-orange-100 text-orange-700 border-orange-200",
    Expert: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AssessmentPhase5() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, reloadUser } = useAuth();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [predictedRoles, setPredictedRoles] = useState<PredictedRole[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Phase4Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [progress, setProgress] = useState({ answered: 0, totalRelevant: 6 });
  const [result, setResult] = useState<ResultsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adaptiveReason, setAdaptiveReason] = useState<string | null>(null);

  // ── Start Phase 5 ─────────────────────────────────────────────────────────
  useEffect(() => {
    saveLastAccessedPhase(5);
    
    assessmentService.startPhase5()
      .then((data) => {
        setSessionId(data.sessionId);
        setPredictedRoles(data.predictedRoles || []);
        setCurrentQuestion(data.question);
        setConfidence(data.confidence ?? 0);
        if (data.progress) setProgress(data.progress);
        setPhase(data.predictedRoles?.length > 0 ? "prediction" : "quiz");
        setError(null);
      })
      .catch((err: Error) => {
        if (err.message?.includes("Phase")) {
          toast({ 
            title: "Complete previous phases", 
            description: "Please finish Phase 1-4 first.", 
            variant: "destructive" 
          });
          navigate("/assessments");
        } else {
          setError(err.message || "Failed to start Phase 5");
          setPhase("quiz");
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit Phase 5 ────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (sid: string) => assessmentService.submitPhase5Assessment(sid),
    onSuccess: async (data) => {
      setError(null);
      try {
        localStorage.setItem("pragyan_phase5_result", JSON.stringify(data));
        localStorage.setItem("pragyan_assessment_phase", "5");
      } catch { /* ignore */ }
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["assessment"] });

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
      setError(err.message || "Failed to submit Phase 5");
      setPhase("quiz");
    },
  });

  // ── Answer Question ───────────────────────────────────────────────────────
  const answerMutation = useMutation({
    mutationFn: ({ qid, answer }: { qid: string; answer: string }) =>
      assessmentService.answerPhase5Question(sessionId!, qid, answer),
    onSuccess: (data) => {
      setConfidence(data.confidence ?? 0);
      if (data.progress) setProgress(data.progress);
      if (data.adaptiveReason) setAdaptiveReason(data.adaptiveReason);
      setError(null);

      setTimeout(() => setAdaptiveReason(null), 4000);

      if (data.shouldSubmit || !data.nextQuestion) {
        setPhase("submitting");
        submitMutation.mutate(sessionId!);
      } else {
        setCurrentQuestion(data.nextQuestion!);
        setSelectedAnswer(null);
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to record answer");
    },
  });

  const handleAnswer = () => {
    if (!sessionId || !currentQuestion || !selectedAnswer) return;
    answerMutation.mutate({ qid: currentQuestion.questionId, answer: selectedAnswer });
  };

  const isBusy = answerMutation.isPending || submitMutation.isPending || phase === "submitting";
  const confidencePct = Math.round((confidence ?? 0) * 100);
  const progressPct = progress.totalRelevant > 0
    ? Math.round((progress.answered / progress.totalRelevant) * 100)
    : 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Analyzing Your Career Profile…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Predicting specialized career roles based on Phases 1-4.
        </p>
        <Progress value={30} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Submitting ────────────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Finalizing Role Specialization…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Calculating role readiness, specialization level, and career fit analysis.
        </p>
        <Progress value={100} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Prediction Display ────────────────────────────────────────────────────
  if (phase === "prediction") {
    return (
      <div className="max-w-4xl mx-auto pb-16 px-4">
        {/* Phase indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 5 of {TOTAL_PHASES} — AI Specialization Detection
            </span>
          </div>
          <Progress value={10} className="h-2" />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Predicted Career Roles</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Based on your profile, cognitive traits, and technical competency
          </p>
        </div>

        {/* Predicted Roles */}
        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Top {predictedRoles.length} Matching Roles
          </h3>
          <div className="space-y-3 mb-6">
            {predictedRoles.slice(0, 5).map((role, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{role.role}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                        TOP MATCH
                      </span>
                    )}
                  </div>
                  {role.category && <p className="text-sm text-muted-foreground">{role.category}</p>}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(role.matchScore)}%
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Now we'll ask targeted questions to validate your specialization in these roles.
          </p>
          <Button 
            className="w-full rounded-xl py-3" 
            onClick={() => setPhase("quiz")}
          >
            Start Specialization Assessment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="max-w-4xl mx-auto pb-16 px-4">
        {/* Phase indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 5 of {TOTAL_PHASES} — Role Specialization
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <span className={`font-bold ${
                  confidencePct >= 85 ? "text-green-600" :
                  confidencePct >= 70 ? "text-blue-600" :
                  confidencePct >= 50 ? "text-amber-600" : "text-orange-600"
                }`}>{confidencePct}%</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-xs text-muted-foreground">
                {progress.answered} / ~{progress.totalRelevant}
              </div>
            </div>
          </div>
          <Progress value={progressPct} className="h-2 mb-1" />
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/40 to-primary transition-all duration-500"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Specialization Assessment</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Role-specific questions tailored to your predicted career path
          </p>
        </div>

        {/* Adaptive Reason */}
        {adaptiveReason && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">{adaptiveReason}</p>
          </div>
        )}

        {/* Error */}
        {(error || !currentQuestion) && (
          <div className="bg-card border border-border rounded-[20px] p-8 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              {error || "Unable to load questions"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Previous phases may not be complete or there was a technical issue.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate("/assessments")}>
                Back to Assessments
              </Button>
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
            <div className="px-6 pt-5 pb-3 bg-slate-50 border-b border-border">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {progress.answered + 1}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <QuestionTypeBadge type={currentQuestion.questionType} />
                  <DifficultyBadge difficulty={currentQuestion.difficulty} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {currentQuestion.domain}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentQuestion.topic}
                  </span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="px-6 py-6">
              <p className="text-lg font-semibold text-foreground leading-relaxed mb-6">
                {currentQuestion.questionText}
              </p>

              {/* Code snippet */}
              {currentQuestion.codeSnippet && (
                <CodeBlock code={currentQuestion.codeSnippet} />
              )}

              {/* Options */}
              <div className="space-y-3 mt-6">
                {currentQuestion.options.map((opt, idx) => {
                  const active = selectedAnswer === opt;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !isBusy && setSelectedAnswer(opt)}
                      disabled={isBusy}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm transition-all flex items-start gap-3 ${
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        active ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}>
                        {active && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-border">
              <Button
                className="w-full rounded-xl py-3 text-base font-medium"
                onClick={handleAnswer}
                disabled={!selectedAnswer || isBusy}
              >
                {answerMutation.isPending ? (
                  <>Processing Answer…</>
                ) : (
                  <>
                    Submit Answer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    const topRoles = result.summary.bestCareerRoles.slice(0, 3);
    const industryEntries = Object.entries(result.summary.industryReadiness);

    return (
      <div className="max-w-4xl mx-auto pb-12 px-4">
        {/* Phase indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 5 of {TOTAL_PHASES} — Complete
            </span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-8">
          Career Role Identification Complete
        </h1>

        {/* Completion banner */}
        <div className="bg-gradient-to-br from-primary/5 to-blue-50 border-2 border-primary/20 rounded-[20px] p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Specialization Identified!</h2>
          <p className="text-muted-foreground mb-1">
            Specialization Level:{" "}
            <span className="font-bold text-primary text-lg">{result.summary.specializationLevel}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Role Confidence: {confidencePct}% • Specialization Score: {Math.round(result.summary.specializationScore * 100)}%
          </p>
        </div>

        {/* Best Career Roles */}
        {topRoles.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Best Career Roles for You
            </h3>
            <div className="space-y-4">
              {topRoles.map((role, idx) => (
                <div key={idx} className="p-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-foreground text-lg">{role.role}</h4>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                            TOP MATCH
                          </span>
                        )}
                      </div>
                      {role.category && <p className="text-sm text-muted-foreground">{role.category}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{Math.round(role.matchScore)}%</div>
                      <p className="text-xs text-muted-foreground">Match Score</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Role Readiness</span>
                      <span className={`text-sm font-bold ${
                        role.readiness >= 80 ? "text-green-600" :
                        role.readiness >= 60 ? "text-blue-600" :
                        role.readiness >= 40 ? "text-amber-600" : "text-orange-600"
                      }`}>{Math.round(role.readiness)}%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          role.readiness >= 80 ? "bg-green-500" :
                          role.readiness >= 60 ? "bg-blue-500" :
                          role.readiness >= 40 ? "bg-amber-500" : "bg-orange-500"
                        }`}
                        style={{ width: `${role.readiness}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strength Areas + Missing Competencies */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {result.summary.strengthAreas.length > 0 && (
            <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Strength Areas
              </h3>
              <ul className="space-y-2">
                {result.summary.strengthAreas.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.summary.missingCompetencies.length > 0 && (
            <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-600" />
                Missing Competencies
              </h3>
              <ul className="space-y-2">
                {result.summary.missingCompetencies.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Career Fit Analysis */}
        {result.summary.careerFitAnalysis && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Career Fit Analysis
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.summary.careerFitAnalysis}
            </p>
          </div>
        )}

        {/* Industry Readiness */}
        {industryEntries.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Industry Readiness
            </h3>
            <div className="space-y-4">
              {industryEntries.map(([industry, score]) => (
                <div key={industry}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{industry}</span>
                    <span className={`text-sm font-bold ${
                      score >= 80 ? "text-green-600" :
                      score >= 60 ? "text-blue-600" :
                      score >= 40 ? "text-amber-600" : "text-orange-600"
                    }`}>{Math.round(score)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        score >= 80 ? "bg-green-500" :
                        score >= 60 ? "bg-blue-500" :
                        score >= 40 ? "bg-amber-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {result.summary.nextSteps.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-[20px] p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Recommended Next Steps
            </h3>
            <ul className="space-y-2">
              {result.summary.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 mt-0.5">→</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 rounded-xl py-3"
            onClick={() => window.location.reload()}>
            Retake Phase 5
          </Button>
          <Button className="flex-1 rounded-xl py-3" onClick={() => navigate("/assessment/phase-6")}>
            Continue to Phase 6
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
