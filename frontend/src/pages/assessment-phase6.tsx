import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveLastAccessedPhase } from "@/utils/assessmentProgress";
import { assessmentService } from "@/services/assessmentService";
import {
  CheckCircle2, ArrowRight, AlertCircle, Award, TrendingUp,
  Target, Sparkles, Brain, Zap, BarChart2, Shield,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "analysis" | "followup" | "validating" | "results";

const TOTAL_PHASES = 7;

interface ConfidenceScores {
  overall: number;
  cognitive: number;
  technical: number;
  domain: number;
  careerRole: number;
  communication: number;
  learning: number;
}

interface SkillGapAnalysis {
  technicalSkills: {
    strong: string[];
    intermediate: string[];
    beginner: string[];
    missing: string[];
  };
  softSkills: {
    communication: string;
    teamwork: string;
    leadership: string;
    adaptability: string;
    problemSolving: string;
  };
  careerReadiness: {
    industryReadiness: number;
    internshipReadiness: number;
    placementReadiness: number;
    advancedLearningReadiness: number;
  };
}

interface ReadinessScores {
  overallCareerReadiness: number;
  technicalReadiness: number;
  cognitiveReadiness: number;
  domainReadiness: number;
  communicationReadiness: number;
  leadershipReadiness: number;
}

interface FollowUpQuestion {
  questionId: string;
  questionText: string;
  questionType: 'MCQ' | 'Short-Answer' | 'Scenario' | 'Self-Assessment';
  options: string[];
  targetArea: string;
  reason: string;
}

interface ValidationResult {
  assessmentComplete: boolean;
  proceedToPhase7: boolean;
  confidenceScores: ConfidenceScores;
  skillGapAnalysis: SkillGapAnalysis;
  readinessScores: ReadinessScores;
  recommendations: string[];
  nextSteps: string[];
}

// ── Helper Components ─────────────────────────────────────────────────────────

function ConfidenceCard({ title, score, icon: Icon }: { title: string; score: number; icon: any }) {
  const percentage = Math.round(score * 100);
  const color = percentage >= 80 ? "text-green-600" : percentage >= 70 ? "text-blue-600" : percentage >= 60 ? "text-amber-600" : "text-orange-600";
  const bgColor = percentage >= 80 ? "bg-green-500" : percentage >= 70 ? "bg-blue-500" : percentage >= 60 ? "bg-amber-500" : "bg-orange-500";

  return (
    <div className="bg-card border border-border rounded-[20px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className={`text-2xl font-bold ${color}`}>{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function QuestionTypeBadge({ type }: { type: FollowUpQuestion["questionType"] }) {
  const colors: Record<FollowUpQuestion["questionType"], string> = {
    MCQ: "bg-blue-100 text-blue-700",
    "Short-Answer": "bg-green-100 text-green-700",
    Scenario: "bg-purple-100 text-purple-700",
    "Self-Assessment": "bg-pink-100 text-pink-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[type]}`}>
      {type}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AssessmentPhase6() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, reloadUser } = useAuth();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<ConfidenceScores | null>(null);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [readinessScores, setReadinessScores] = useState<ReadinessScores | null>(null);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [lowConfidenceAreas, setLowConfidenceAreas] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // ── Start Phase 6 ─────────────────────────────────────────────────────────
  useEffect(() => {
    saveLastAccessedPhase(6);
    
    assessmentService.startPhase6()
      .then((data) => {
        setSessionId(data.sessionId);
        setConfidenceScores(data.confidenceScores);
        setSkillGapAnalysis(data.skillGapAnalysis);
        setReadinessScores(data.readinessScores);
        setNeedsFollowUp(data.needsFollowUp);
        setLowConfidenceAreas(data.lowConfidenceAreas);
        setFollowUpQuestions(data.followUpQuestions || []);
        setRecommendations(data.recommendations);
        setNextSteps(data.nextSteps);
        setCompletionPercentage(data.completionPercentage);
        setError(null);

        if (data.assessmentValidated && !data.needsFollowUp) {
          // Confidence is sufficient, proceed directly to validation
          setPhase("analysis");
          setTimeout(() => {
            validateMutation.mutate(data.sessionId);
          }, 2000);
        } else if (data.needsFollowUp && data.followUpQuestions.length > 0) {
          // Need follow-up questions
          setPhase("followup");
        } else {
          // Show analysis, then allow manual validation
          setPhase("analysis");
        }
      })
      .catch((err: Error) => {
        if (err.message?.includes("Phase")) {
          toast({ 
            title: "Complete previous phases", 
            description: "Please finish Phase 1-5 first.", 
            variant: "destructive" 
          });
          navigate("/assessments");
        } else {
          setError(err.message || "Failed to start Phase 6");
          setPhase("analysis");
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Answer Follow-up Question ─────────────────────────────────────────────
  const answerMutation = useMutation({
    mutationFn: ({ qid, answer }: { qid: string; answer: string }) =>
      assessmentService.answerPhase6Question(sessionId!, qid, answer),
    onSuccess: (data) => {
      setConfidenceScores(data.confidenceScores);
      setCompletionPercentage(data.completionPercentage);
      setError(null);

      if (data.allQuestionsAnswered) {
        // All follow-up questions answered, proceed to validation
        setPhase("validating");
        validateMutation.mutate(sessionId!);
      } else if (data.nextQuestion) {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer("");
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to record answer");
    },
  });

  // ── Validate Assessment ───────────────────────────────────────────────────
  const validateMutation = useMutation({
    mutationFn: (sid: string) => assessmentService.validatePhase6Assessment(sid),
    onSuccess: async (data) => {
      setError(null);
      try {
        localStorage.setItem("pragyan_phase6_result", JSON.stringify(data));
        localStorage.setItem("pragyan_assessment_phase", "6");
      } catch { /* ignore */ }
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["assessment"] });

      if (data.nextPhaseRoute) {
        setValidationResult(data);
        setPhase("validating");
        setTimeout(() => navigate(data.nextPhaseRoute!), 600);
        return;
      }

      setValidationResult(data);
      setPhase("results");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to validate assessment");
      setPhase("analysis");
    },
  });

  const handleAnswerFollowUp = () => {
    if (!sessionId || !followUpQuestions[currentQuestionIndex] || !selectedAnswer) return;
    answerMutation.mutate({ 
      qid: followUpQuestions[currentQuestionIndex].questionId, 
      answer: selectedAnswer 
    });
  };

  const handleSkipToValidation = () => {
    if (!sessionId) return;
    setPhase("validating");
    validateMutation.mutate(sessionId);
  };

  const isBusy = answerMutation.isPending || validateMutation.isPending || phase === "validating";
  const overallConfidencePct = confidenceScores ? Math.round(confidenceScores.overall * 100) : 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Analyzing Assessment Confidence…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Calculating confidence scores from all previous phases
        </p>
        <Progress value={30} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Validating ────────────────────────────────────────────────────────────
  if (phase === "validating") {
    return (
      <div className="max-w-3xl mx-auto pb-12 py-24 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Validating Assessment…</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Finalizing confidence evaluation and skill gap analysis
        </p>
        <Progress value={100} className="w-64 h-2 animate-pulse" />
      </div>
    );
  }

  // ── Analysis (Confidence Summary) ─────────────────────────────────────────
  if (phase === "analysis" && confidenceScores) {
    return (
      <div className="max-w-4xl mx-auto pb-16 px-4">
        {/* Phase indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 6 of {TOTAL_PHASES} — Confidence Validation
            </span>
            <span className="text-xs text-muted-foreground">
              {completionPercentage}% Complete
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Assessment Validation</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Evaluating confidence and readiness across all dimensions
          </p>
        </div>

        {/* Overall Confidence Banner */}
        <div className={`rounded-[20px] p-8 text-center mb-6 border-2 ${
          overallConfidencePct >= 80 
            ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-200" 
            : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${
            overallConfidencePct >= 80 ? "bg-white" : "bg-white"
          }`}>
            {overallConfidencePct >= 80 ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Overall Confidence: {overallConfidencePct}%
          </h2>
          <p className="text-sm text-muted-foreground">
            {overallConfidencePct >= 80 
              ? "Excellent! Your assessment is validated. Ready for career recommendations." 
              : `Additional validation ${needsFollowUp ? "required" : "recommended"} to improve confidence.`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Confidence Scores Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ConfidenceCard title="Cognitive" score={confidenceScores.cognitive} icon={Brain} />
          <ConfidenceCard title="Technical" score={confidenceScores.technical} icon={Zap} />
          <ConfidenceCard title="Domain" score={confidenceScores.domain} icon={Target} />
          <ConfidenceCard title="Career Role" score={confidenceScores.careerRole} icon={Award} />
          <ConfidenceCard title="Communication" score={confidenceScores.communication} icon={Sparkles} />
          <ConfidenceCard title="Learning" score={confidenceScores.learning} icon={TrendingUp} />
        </div>

        {/* Low Confidence Areas */}
        {lowConfidenceAreas.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Areas Needing Attention
            </h3>
            <div className="flex flex-wrap gap-2">
              {lowConfidenceAreas.map((area, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-lg">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Recommendations
            </h3>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary mt-0.5">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {needsFollowUp && followUpQuestions.length > 0 ? (
            <>
              <Button variant="outline" className="flex-1 rounded-xl py-3" onClick={handleSkipToValidation}>
                Skip to Validation
              </Button>
              <Button className="flex-1 rounded-xl py-3" onClick={() => setPhase("followup")}>
                Answer Follow-up Questions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1 rounded-xl py-3" onClick={() => window.location.reload()}>
                Refresh Analysis
              </Button>
              <Button className="flex-1 rounded-xl py-3" onClick={handleSkipToValidation} disabled={isBusy}>
                {isBusy ? "Validating…" : "Complete Validation"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Follow-up Questions ───────────────────────────────────────────────────
  if (phase === "followup" && followUpQuestions.length > 0) {
    const currentQuestion = followUpQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / followUpQuestions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto pb-16 px-4">
        {/* Phase indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 6 of {TOTAL_PHASES} — Follow-up Validation
            </span>
            <span className="text-xs text-muted-foreground">
              {currentQuestionIndex + 1} / {followUpQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Validation Questions</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Targeted questions to improve confidence in low-scoring areas
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-card border border-border rounded-[20px] shadow-sm overflow-hidden mb-6">
          {/* Header bar */}
          <div className="px-6 pt-5 pb-3 bg-slate-50 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <QuestionTypeBadge type={currentQuestion.questionType} />
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {currentQuestion.targetArea}
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="px-6 py-4 bg-blue-50 border-b border-border">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Why we're asking:</span> {currentQuestion.reason}
            </p>
          </div>

          {/* Question */}
          <div className="px-6 py-6">
            <p className="text-lg font-semibold text-foreground leading-relaxed mb-6">
              {currentQuestion.questionText}
            </p>

            {/* Options (for MCQ and Self-Assessment) */}
            {(currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'Self-Assessment') && (
              <div className="space-y-3">
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
            )}

            {/* Text Input (for Short-Answer and Scenario) */}
            {(currentQuestion.questionType === 'Short-Answer' || currentQuestion.questionType === 'Scenario') && (
              <textarea
                className="w-full min-h-[120px] px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                placeholder="Type your answer here..."
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={isBusy}
              />
            )}
          </div>

          {/* Action */}
          <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-border">
            <Button
              className="w-full rounded-xl py-3 text-base font-medium"
              onClick={handleAnswerFollowUp}
              disabled={!selectedAnswer || isBusy}
            >
              {answerMutation.isPending ? (
                <>Processing Answer…</>
              ) : (
                <>
                  {currentQuestionIndex < followUpQuestions.length - 1 ? "Next Question" : "Complete Validation"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "results" && validationResult) {
    const proceedToPhase7 = validationResult.proceedToPhase7;

    return (
      <div className="max-w-4xl mx-auto pb-12 px-4">
        {/* Phase indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Phase 6 of {TOTAL_PHASES} — Complete
            </span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-8">
          Assessment Validation Complete
        </h1>

        {/* Validation Banner */}
        <div className={`rounded-[20px] p-8 text-center mb-6 border-2 ${
          proceedToPhase7 
            ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-200" 
            : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm bg-white`}>
            {proceedToPhase7 ? (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {proceedToPhase7 ? "Validation Successful!" : "Validation Complete"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Overall Confidence: {Math.round(validationResult.confidenceScores.overall * 100)}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {proceedToPhase7 
              ? "Your assessment is validated. Ready for personalized career recommendations."
              : "Assessment complete. Consider revisiting areas with lower confidence scores."}
          </p>
        </div>

        {/* Confidence Scores */}
        <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            Final Confidence Scores
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ConfidenceCard title="Cognitive" score={validationResult.confidenceScores.cognitive} icon={Brain} />
            <ConfidenceCard title="Technical" score={validationResult.confidenceScores.technical} icon={Zap} />
            <ConfidenceCard title="Domain" score={validationResult.confidenceScores.domain} icon={Target} />
            <ConfidenceCard title="Career Role" score={validationResult.confidenceScores.careerRole} icon={Award} />
            <ConfidenceCard title="Communication" score={validationResult.confidenceScores.communication} icon={Sparkles} />
            <ConfidenceCard title="Learning" score={validationResult.confidenceScores.learning} icon={TrendingUp} />
          </div>
        </div>

        {/* Readiness Scores */}
        {validationResult.readinessScores && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Career Readiness Scores
            </h3>
            <div className="space-y-4">
              {Object.entries(validationResult.readinessScores).map(([key, score]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-sm font-bold ${
                      score >= 80 ? "text-green-600" :
                      score >= 70 ? "text-blue-600" :
                      score >= 60 ? "text-amber-600" : "text-orange-600"
                    }`}>{Math.round(score)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        score >= 80 ? "bg-green-500" :
                        score >= 70 ? "bg-blue-500" :
                        score >= 60 ? "bg-amber-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Gap Analysis */}
        {validationResult.skillGapAnalysis && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Strong Skills */}
            {validationResult.skillGapAnalysis.technicalSkills.strong.length > 0 && (
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Strong Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {validationResult.skillGapAnalysis.technicalSkills.strong.slice(0, 8).map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {validationResult.skillGapAnalysis.technicalSkills.missing.length > 0 && (
              <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-600" />
                  Skills to Develop
                </h3>
                <div className="flex flex-wrap gap-2">
                  {validationResult.skillGapAnalysis.technicalSkills.missing.slice(0, 8).map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {validationResult.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-[20px] p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Recommendations
            </h3>
            <ul className="space-y-2">
              {validationResult.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-600 mt-0.5">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {validationResult.nextSteps.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary" />
              Next Steps
            </h3>
            <ul className="space-y-2">
              {validationResult.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 rounded-xl py-3" onClick={() => window.location.reload()}>
            Retake Validation
          </Button>
          {proceedToPhase7 ? (
            <Button className="flex-1 rounded-xl py-3" onClick={() => navigate("/assessment/phase-7")}>
              Generate Career Report
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button className="flex-1 rounded-xl py-3" onClick={() => navigate("/assessments")}>
              Back to Assessments
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
