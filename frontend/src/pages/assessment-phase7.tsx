import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { saveLastAccessedPhase } from "@/utils/assessmentProgress";
import { assessmentService, type Phase7AIReport } from "@/services/assessmentService";
import {
  CheckCircle2, ArrowRight, Sparkles, Trophy, Target, TrendingUp,
  BookOpen, Award, Briefcase, Rocket, Brain, Users, Zap, Star,
  GraduationCap, FileText, Link as LinkIcon, Calendar, BarChart3,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "loading" | "generating" | "report";

const TOTAL_PHASES = 7;

// ── Helper Components ─────────────────────────────────────────────────────────

function ReadinessBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const percentage = Math.round(score * 100);
  const color = percentage >= 80 ? "text-green-600" : percentage >= 70 ? "text-blue-600" : percentage >= 60 ? "text-amber-600" : "text-orange-600";
  const bgColor = percentage >= 80 ? "bg-green-500" : percentage >= 70 ? "bg-blue-500" : percentage >= 60 ? "bg-amber-500" : "bg-orange-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className={`text-lg font-bold ${color}`}>{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} transition-all duration-700`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function SkillLevelBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const colors = {
    High: "bg-green-100 text-green-700 border-green-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[level]}`}>
      {level}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Beginner: "bg-blue-100 text-blue-700 border-blue-200",
    Intermediate: "bg-purple-100 text-purple-700 border-purple-200",
    Advanced: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Expert: "bg-pink-100 text-pink-700 border-pink-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[difficulty] || colors.Intermediate}`}>
      {difficulty}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AssessmentPhase7() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [report, setReport] = useState<Phase7AIReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Generate Phase 7 Report ───────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: () => assessmentService.generatePhase7Report(),
    onSuccess: (data) => {
      setReport(data);
      setPhase("report");
      setError(null);
      
      // Save to localStorage for dashboard integration
      localStorage.setItem("pragyan_phase7_result", JSON.stringify({
        completed: true,
        topCareer: data.topRecommendations[0]?.role,
        matchScore: data.topRecommendations[0]?.matchScore,
        readinessScore: data.readinessScores.overallCareerReadiness,
        generatedAt: data.generatedAt,
      }));

      toast({
        title: "Career Report Generated!",
        description: "Your personalized career roadmap is ready.",
      });
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to generate report");
      toast({
        title: "Generation Failed",
        description: err.message || "Could not generate career report",
        variant: "destructive",
      });
    },
  });

  // ── Load or Generate Report ───────────────────────────────────────────────
  useEffect(() => {
    saveLastAccessedPhase(7);

    // Try to load existing report first
    assessmentService.getPhase7Report()
      .then((data) => {
        if (data) {
          setReport(data);
          setPhase("report");
        } else {
          // No existing report, generate new one
          setPhase("generating");
          setTimeout(() => generateMutation.mutate(), 1000);
        }
      })
      .catch((err: Error) => {
        if (err.message?.includes("Phase")) {
          toast({
            title: "Complete previous phases",
            description: "Please finish Phase 1-6 first.",
            variant: "destructive",
          });
          navigate("/assessments");
        } else {
          // Generate new report on error
          setPhase("generating");
          setTimeout(() => generateMutation.mutate(), 1000);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render Loading State ──────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Loading Assessment</h2>
          <p className="text-muted-foreground">Please wait while we load your career report...</p>
        </div>
      </div>
    );
  }

  // ── Render Generating State ───────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Generating Your Career Report</h2>
            <p className="text-muted-foreground text-lg">
              Our AI is analyzing your complete assessment journey...
            </p>
          </div>

          <div className="bg-card border border-border rounded-[20px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-foreground">Analyzing cognitive skills</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-foreground">Evaluating technical competencies</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-foreground">Matching career roles</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm text-foreground font-medium">Creating personalized roadmap...</span>
            </div>
          </div>

          <Progress value={75} className="h-2" />
        </div>
      </div>
    );
  }

  // ── Render Error State ────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Report Generation Failed</h2>
          <p className="text-muted-foreground">{error || "Could not load your report"}</p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? "Retrying..." : "Retry Generation"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Render Career Report ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
            <span>Assessment</span>
            <span>/</span>
            <span>Phase {TOTAL_PHASES} of {TOTAL_PHASES}</span>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Career Assessment Report</h1>
              <p className="text-white/90 text-lg">
                Personalized insights and recommendations based on your complete assessment
              </p>
            </div>
          </div>
          <Progress value={100} className="h-2 bg-white/20" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* User Summary */}
        <div className="bg-card border border-border rounded-[20px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Your Profile</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Overview</p>
              <p className="text-foreground">{report.userSummary.profileOverview}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Education</p>
              <p className="text-foreground">{report.userSummary.education}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Career Goal</p>
              <p className="text-foreground">{report.userSummary.careerGoal}</p>
            </div>
          </div>
        </div>

        {/* Top Career Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Top Career Recommendations</h2>
          </div>
          
          {report.topRecommendations.map((career, idx) => (
            <div key={idx} className="bg-card border border-border rounded-[20px] p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {idx === 0 && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                    <h3 className="text-xl font-bold text-foreground">{career.role}</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                      {Math.round(career.matchScore * 100)}% Match
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{career.category}</span>
                    <span>•</span>
                    <span className={career.industryDemand === "High" ? "text-green-600" : career.industryDemand === "Medium" ? "text-amber-600" : "text-orange-600"}>
                      {career.industryDemand} Demand
                    </span>
                    {career.averageSalary && (
                      <>
                        <span>•</span>
                        <span>{career.averageSalary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Why This Career?</h4>
                  <ul className="space-y-1">
                    {career.whySelected.map((reason, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Your Strengths ({career.matchedSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {career.matchedSkills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                          {skill}
                        </span>
                      ))}
                      {career.matchedSkills.length > 6 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-lg text-xs">
                          +{career.matchedSkills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-500" />
                      Skills to Develop ({career.missingSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {career.missingSkills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs">
                          {skill}
                        </span>
                      ))}
                      {career.missingSkills.length > 6 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-lg text-xs">
                          +{career.missingSkills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skill Gap Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Technical Skills */}
          <div className="bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Technical Skills</h3>
            </div>
            <div className="space-y-3">
              {report.skillGaps.technical.excellent.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">Excellent</p>
                  <div className="flex flex-wrap gap-1">
                    {report.skillGaps.technical.excellent.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.skillGaps.technical.strong.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">Strong</p>
                  <div className="flex flex-wrap gap-1">
                    {report.skillGaps.technical.strong.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.skillGaps.technical.intermediate.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1">Intermediate</p>
                  <div className="flex flex-wrap gap-1">
                    {report.skillGaps.technical.intermediate.slice(0, 8).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.skillGaps.technical.beginner.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 mb-1">Beginner</p>
                  <div className="flex flex-wrap gap-1">
                    {report.skillGaps.technical.beginner.slice(0, 6).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.skillGaps.technical.missing.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">To Learn</p>
                  <div className="flex flex-wrap gap-1">
                    {report.skillGaps.technical.missing.slice(0, 6).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Soft Skills</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Communication</span>
                <SkillLevelBadge level={report.skillGaps.soft.communication} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Leadership</span>
                <SkillLevelBadge level={report.skillGaps.soft.leadership} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Collaboration</span>
                <SkillLevelBadge level={report.skillGaps.soft.collaboration} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Adaptability</span>
                <SkillLevelBadge level={report.skillGaps.soft.adaptability} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Problem Solving</span>
                <SkillLevelBadge level={report.skillGaps.soft.problemSolving} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Critical Thinking</span>
                <SkillLevelBadge level={report.skillGaps.soft.criticalThinking} />
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Scores */}
        <div className="bg-card border border-border rounded-[20px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Career Readiness</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <ReadinessBar label="Internship Readiness" score={report.readinessScores.internshipReadiness} icon={Briefcase} />
            <ReadinessBar label="Placement Readiness" score={report.readinessScores.placementReadiness} icon={Trophy} />
            <ReadinessBar label="Professional Readiness" score={report.readinessScores.professionalReadiness} icon={Target} />
            <ReadinessBar label="Leadership Readiness" score={report.readinessScores.leadershipReadiness} icon={Users} />
          </div>
        </div>

        {/* Personalized Roadmap Preview */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-[20px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Your Personalized Roadmap</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{report.personalizedRoadmap.careerTitle}</p>
                <p className="text-sm text-muted-foreground">Estimated Duration: {report.personalizedRoadmap.estimatedDuration}</p>
              </div>
            </div>
            <div className="pl-9 space-y-2">
              {report.personalizedRoadmap.milestones.slice(0, 4).map((milestone, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{milestone}</span>
                </div>
              ))}
              {report.personalizedRoadmap.milestones.length > 4 && (
                <p className="text-sm text-muted-foreground">
                  +{report.personalizedRoadmap.milestones.length - 4} more milestones
                </p>
              )}
            </div>
            <Button 
              onClick={() => navigate("/roadmap")} 
              className="w-full mt-4"
              variant="outline"
            >
              <Rocket className="w-4 h-4 mr-2" />
              View Full Roadmap
            </Button>
          </div>
        </div>

        {/* Recommended Certifications */}
        {report.certifications.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Recommended Certifications</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {report.certifications.slice(0, 6).map((cert, idx) => (
                <div key={idx} className="border border-border rounded-[16px] p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground flex-1">{cert.name}</h4>
                    <DifficultyBadge difficulty={cert.difficulty} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{cert.provider}</p>
                  <p className="text-xs text-muted-foreground mb-3">{cert.relevance}</p>
                  <div className="flex items-center justify-between">
                    {cert.estimatedCost && (
                      <span className="text-xs text-muted-foreground">{cert.estimatedCost}</span>
                    )}
                    {cert.link && (
                      <a href={cert.link} target="_blank" rel="noopener noreferrer" 
                         className="text-xs text-primary hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Resources */}
        {report.resources.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Learning Resources</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {report.resources.slice(0, 9).map((resource, idx) => (
                <div key={idx} className="border border-border rounded-[16px] p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {resource.type}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">{resource.title}</h4>
                  {resource.provider && (
                    <p className="text-xs text-muted-foreground mb-2">{resource.provider}</p>
                  )}
                  <p className="text-xs text-muted-foreground mb-2">{resource.relevance}</p>
                  {resource.difficulty && <DifficultyBadge difficulty={resource.difficulty} />}
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                       className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                      <LinkIcon className="w-3 h-3" />
                      Access Resource
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Projects */}
        {report.projects.length > 0 && (
          <div className="bg-card border border-border rounded-[20px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Hands-on Projects</h3>
            </div>
            <div className="space-y-4">
              {report.projects.slice(0, 5).map((project, idx) => (
                <div key={idx} className="border border-border rounded-[16px] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground flex-1">{project.title}</h4>
                    <div className="flex items-center gap-2">
                      <DifficultyBadge difficulty={project.difficulty} />
                      {project.portfolio && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          Portfolio
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {project.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {skill}
                        </span>
                      ))}
                      {project.skills.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{project.skills.length - 4}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {project.estimatedDuration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Final Advice */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-[20px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold">AI Career Advisor</h3>
          </div>
          <p className="text-white/90 leading-relaxed mb-4">{report.finalAdvice}</p>
          <div className="bg-white/10 rounded-[16px] p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Next Steps
            </h4>
            <div className="space-y-2">
              {report.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-white/90 text-sm pt-1">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Button 
            onClick={() => navigate("/roadmap")} 
            size="lg"
            className="gap-2"
          >
            <Rocket className="w-5 h-5" />
            Start Learning Journey
          </Button>
          <Button 
            onClick={() => navigate("/")} 
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Go to Dashboard
          </Button>
        </div>

        {/* Report Metadata */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Report generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</p>
        </div>
      </div>
    </div>
  );
}
