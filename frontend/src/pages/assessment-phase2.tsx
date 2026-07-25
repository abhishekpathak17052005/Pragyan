import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveLastAccessedPhase } from "@/utils/assessmentProgress";
import {
  assessmentService,
  type Phase2Input,
  type CareerObjective,
  type SkillConfidenceLevel,
  type SkillConfidence,
  type WorkStyle,
  type LearningStyle,
  type CareerMotivation,
  DOMAIN_CATALOG,
  FAVORITE_SUBJECTS,
  CAREER_OBJECTIVES,
  SKILL_CONFIDENCE_LEVELS,
  WORK_STYLES,
  LEARNING_STYLES,
  CAREER_MOTIVATIONS,
} from "@/services/assessmentService";
import {
  Target, Layers, BarChart2, BookOpen, Briefcase, Lightbulb,
  Heart, ArrowRight, ArrowLeft, CheckCircle2, Save, AlertCircle, Search, X,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_PHASES = 7;

type Section =
  | "objective" | "domains" | "skills" | "subjects"
  | "workstyle" | "learningstyle" | "motivation";

const SECTIONS: Section[] = [
  "objective", "domains", "skills", "subjects",
  "workstyle", "learningstyle", "motivation",
];

const SECTION_META: Record<Section, { icon: typeof Target; label: string; description: string }> = {
  objective:     { icon: Target,    label: "Career Goal",        description: "What is your primary goal?" },
  domains:       { icon: Layers,    label: "Domains",            description: "Which tech domains interest you?" },
  skills:        { icon: BarChart2, label: "Skill Confidence",   description: "Rate your confidence in key areas" },
  subjects:      { icon: BookOpen,  label: "Favourite Subjects", description: "Which subjects do you enjoy?" },
  workstyle:     { icon: Briefcase, label: "Work Style",         description: "How do you prefer to work?" },
  learningstyle: { icon: Lightbulb, label: "Learning Style",     description: "How do you learn best?" },
  motivation:    { icon: Heart,     label: "Motivation",         description: "Why are you pursuing this career?" },
};

const DEFAULT_SKILL_CONFIDENCE: SkillConfidence = {
  programming: "Beginner", mathematics: "Beginner", problemSolving: "Beginner",
  communication: "Beginner", teamwork: "Beginner", leadership: "Beginner",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function validate(
  sec: Section,
  s: { objective: CareerObjective | null; domains: string[]; subjects: string[];
       workStyle: WorkStyle[]; learningStyle: LearningStyle[]; motivation: CareerMotivation | null }
): string | null {
  if (sec === "objective"     && !s.objective)            return "Please select a career objective";
  if (sec === "domains"       && s.domains.length === 0)  return "Select at least one preferred domain";
  if (sec === "subjects"      && s.subjects.length < 3)   return "Select at least 3 favourite subjects";
  if (sec === "workstyle"     && s.workStyle.length === 0) return "Select at least one work style";
  if (sec === "learningstyle" && s.learningStyle.length === 0) return "Select at least one learning style";
  if (sec === "motivation"    && !s.motivation)           return "Please select your motivation";
  return null;
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip({
  label, selected, onClick, color = "primary",
}: { label: string; selected: boolean; onClick: () => void; color?: "primary"|"green"|"purple"|"amber" }) {
  const cls: Record<string, string> = {
    primary: selected ? "border-primary bg-primary/5 text-primary"        : "border-border bg-card text-foreground hover:border-primary/50",
    green:   selected ? "border-green-500 bg-green-50 text-green-700"     : "border-border bg-card text-foreground hover:border-green-400",
    purple:  selected ? "border-purple-500 bg-purple-50 text-purple-700"  : "border-border bg-card text-foreground hover:border-purple-400",
    amber:   selected ? "border-amber-500 bg-amber-50 text-amber-700"     : "border-border bg-card text-foreground hover:border-amber-400",
  };
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${cls[color]}`}>
      {selected && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
      {label}
    </button>
  );
}

// ── Confidence row ────────────────────────────────────────────────────────────

function ConfidenceRow({
  label, value, onChange,
}: { label: string; value: SkillConfidenceLevel; onChange: (v: SkillConfidenceLevel) => void }) {
  const idx = SKILL_CONFIDENCE_LEVELS.indexOf(value);
  const track = ["bg-gray-300", "bg-blue-400", "bg-teal-500", "bg-green-500", "bg-emerald-600"];
  const text  = ["text-gray-500", "text-blue-600", "text-teal-600", "text-green-600", "text-emerald-700"];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground w-36 flex-shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-1">
        {SKILL_CONFIDENCE_LEVELS.map((lvl, i) => (
          <button key={lvl} type="button" onClick={() => onChange(lvl)} title={lvl}
            className={`flex-1 h-8 rounded-lg border-2 transition-all text-xs font-semibold ${
              i <= idx
                ? `${track[i]} border-transparent text-white`
                : "border-border bg-muted/30 hover:border-primary/40"
            }`} />
        ))}
      </div>
      <span className={`text-xs font-bold w-24 text-right flex-shrink-0 ${text[idx]}`}>{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentPhase2() {
  const [, navigate]   = useLocation();
  const { toast }      = useToast();
  const { user, reloadUser } = useAuth();
  const queryClient    = useQueryClient();

  // Track phase access
  useEffect(() => {
    saveLastAccessedPhase(2);
  }, []);

  const [section,       setSection]       = useState<Section>("objective");
  const [fieldError,    setFieldError]    = useState<string | null>(null);
  const [domainSearch,  setDomainSearch]  = useState("");
  const [objective,     setObjective]     = useState<CareerObjective | null>(null);
  const [domains,       setDomains]       = useState<string[]>([]);
  const [skillConf,     setSkillConf]     = useState<SkillConfidence>(DEFAULT_SKILL_CONFIDENCE);
  const [subjects,      setSubjects]      = useState<string[]>([]);
  const [workStyle,     setWorkStyle]     = useState<WorkStyle[]>([]);
  const [learningStyle, setLearningStyle] = useState<LearningStyle[]>([]);
  const [motivation,    setMotivation]    = useState<CareerMotivation | null>(null);

  // Pre-fill from saved session
  const { data: existing } = useQuery({
    queryKey: ["assessment", "phase-2"],
    queryFn:  assessmentService.getPhase2,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!existing) return;
    if (existing.careerObjective)          setObjective(existing.careerObjective);
    if (existing.preferredDomains?.length) setDomains(existing.preferredDomains);
    if (existing.skillConfidence)          setSkillConf(existing.skillConfidence);
    if (existing.favoriteSubjects?.length) setSubjects(existing.favoriteSubjects);
    if (existing.workStyle?.length)        setWorkStyle(existing.workStyle);
    if (existing.learningStyle?.length)    setLearningStyle(existing.learningStyle);
    if (existing.motivation)               setMotivation(existing.motivation);
  }, [existing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill long-term prefs from AuthContext
  useEffect(() => {
    if (!user) return;
    if (user.careerGoal && !objective) {
      const match = CAREER_OBJECTIVES.find((o) => o === user.careerGoal);
      if (match) setObjective(match);
    }
    if (user.interests?.length && domains.length === 0)
      setDomains(user.interests.filter(Boolean));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPayload = (): Phase2Input => ({
    careerObjective:  objective  ?? "Explore Career Options",
    preferredDomains: domains.length > 0 ? domains : ["Software Development"],
    skillConfidence:  skillConf,
    favoriteSubjects: subjects.length >= 3 ? subjects : [...subjects, ...FAVORITE_SUBJECTS.filter(s => !subjects.includes(s))].slice(0, 3),
    workStyle:        workStyle.length      > 0 ? workStyle      : (["Remote"] as WorkStyle[]),
    learningStyle:    learningStyle.length  > 0 ? learningStyle  : (["Building Projects"] as LearningStyle[]),
    motivation:       motivation ?? "Personal Interest",
  });

  const { autoSave, isSaving } = useAutoSave<Phase2Input>(
    (d) => assessmentService.savePhase2(d), 2000
  );

  useEffect(() => {
    if (section === "objective") return;
    if (!objective || domains.length === 0) return; // don't auto-save until critical fields filled
    autoSave(buildPayload());
  }, [objective, domains, skillConf, subjects, workStyle, learningStyle, motivation]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitMutation = useMutation({
    mutationFn: (payload: Phase2Input) =>
      existing ? assessmentService.updatePhase2(payload) : assessmentService.savePhase2(payload),
    onSuccess: async (data) => {
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["assessment", "phase-2"] });
      try {
        localStorage.setItem("pragyan_assessment_phase", "2");
        localStorage.setItem("pragyan_baseline_payload", JSON.stringify(data.baselinePayload));
      } catch { /* ignore */ }
      toast({ title: "Phase 2 saved!", description: "Interests synchronized. Moving to Phase 3…" });
      setTimeout(() => navigate("/assessment/phase-3"), 600);
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const sectionIndex = SECTIONS.indexOf(section);
  const isFirst      = sectionIndex === 0;
  const isLast       = sectionIndex === SECTIONS.length - 1;
  const progressPct  = Math.round(((sectionIndex + 1) / SECTIONS.length) * 100);

  const validationState = { objective, domains, subjects, workStyle, learningStyle, motivation };

  const goNext = () => {
    setFieldError(null);
    const err = validate(section, validationState);
    if (err) { setFieldError(err); return; }
    if (!isLast) setSection(SECTIONS[sectionIndex + 1]);
    else submitMutation.mutate(buildPayload());
  };

  const goBack = () => {
    setFieldError(null);
    if (!isFirst) setSection(SECTIONS[sectionIndex - 1]);
    else navigate("/assessment/phase-1");
  };

  function toggleItem<T extends string>(
    item: T, list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
  }

  const filteredCatalog = useMemo(() => {
    if (!domainSearch.trim()) return DOMAIN_CATALOG;
    const q = domainSearch.toLowerCase();
    return DOMAIN_CATALOG
      .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [domainSearch]);

  const meta      = SECTION_META[section];
  const SectionIcon = meta.icon;

  return (
    <div className="max-w-2xl mx-auto pb-16 px-4">

      {/* Phase indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Phase 2 of {TOTAL_PHASES}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving && <><Save className="w-3 h-3 animate-pulse text-primary" /><span>Saving…</span></>}
            {!isSaving && (existing || objective) &&
              <><CheckCircle2 className="w-3 h-3 text-green-600" /><span>Auto-saved</span></>}
          </div>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <SectionIcon className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Discover Your Interests</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {meta.description} — this shapes your personalised AI career assessment.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
        {SECTIONS.map((s, i) => {
          const M    = SECTION_META[s];
          const Icon = M.icon;
          const done   = i < sectionIndex;
          const active = s === section;
          return (
            <button key={s} type="button"
              onClick={() => { setFieldError(null); setSection(s); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                active ? "bg-primary text-white shadow-sm" :
                done   ? "bg-green-100 text-green-700" :
                         "bg-card border border-border text-muted-foreground hover:border-primary/40"
              }`}>
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              {M.label}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-card border border-border rounded-[20px] shadow-sm p-8 space-y-6">

        {/* ── Section 1: Career Objective ─────────────────────────────── */}
        {section === "objective" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              What is your primary goal? <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CAREER_OBJECTIVES.map((opt) => (
                <button key={opt} type="button" onClick={() => setObjective(opt)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    objective === opt ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
                  }`}>
                  <p className={`text-sm font-semibold ${objective === opt ? "text-primary" : "text-foreground"}`}>{opt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 2: Preferred Domains ────────────────────────────── */}
        {section === "domains" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Select your preferred domains <span className="text-red-500">*</span>
              </p>
              {domains.length > 0 && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {domains.length} selected
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="search" placeholder="Search domains…" value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {domains.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                {domains.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-medium">
                    {d}
                    <button type="button"
                      onClick={() => setDomains((prev) => prev.filter((x) => x !== d))}
                      className="hover:bg-white/20 rounded p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-5 max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {group.group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <Chip key={item} label={item} selected={domains.includes(item)}
                        onClick={() => toggleItem(item, domains, setDomains)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 3: Skill Confidence ─────────────────────────────── */}
        {section === "skills" && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-foreground">
              Rate your confidence in each area
            </p>
            <div className="space-y-4">
              {(
                [
                  ["programming",    "Programming"],
                  ["mathematics",    "Mathematics"],
                  ["problemSolving", "Problem Solving"],
                  ["communication",  "Communication"],
                  ["teamwork",       "Teamwork"],
                  ["leadership",     "Leadership"],
                ] as [keyof SkillConfidence, string][]
              ).map(([key, label]) => (
                <ConfidenceRow key={key} label={label} value={skillConf[key]}
                  onChange={(v) => setSkillConf((prev) => ({ ...prev, [key]: v }))} />
              ))}
            </div>
            <div className="flex gap-2 flex-wrap mt-2 pt-3 border-t border-border">
              {SKILL_CONFIDENCE_LEVELS.map((lvl, i) => {
                const colors = ["text-gray-500","text-blue-600","text-teal-600","text-green-600","text-emerald-700"];
                const bgs    = ["bg-gray-100","bg-blue-50","bg-teal-50","bg-green-50","bg-emerald-50"];
                return (
                  <span key={lvl} className={`text-xs font-semibold px-2 py-1 rounded-lg ${colors[i]} ${bgs[i]}`}>
                    {i + 1}. {lvl}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section 4: Favourite Subjects ───────────────────────────── */}
        {section === "subjects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Select your favourite subjects{" "}
                <span className="text-muted-foreground font-normal">(min 3)</span>{" "}
                <span className="text-red-500">*</span>
              </p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                subjects.length >= 3 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>
                {subjects.length} / {FAVORITE_SUBJECTS.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FAVORITE_SUBJECTS.map((subj) => (
                <Chip key={subj} label={subj} selected={subjects.includes(subj)}
                  onClick={() => toggleItem(subj, subjects, setSubjects)}
                  color="purple" />
              ))}
            </div>
          </div>
        )}

        {/* ── Section 5: Work Style ────────────────────────────────────── */}
        {section === "workstyle" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              How do you prefer to work?{" "}
              <span className="text-muted-foreground font-normal">(select all that apply)</span>{" "}
              <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {WORK_STYLES.map((style) => (
                <Chip key={style} label={style} selected={workStyle.includes(style)}
                  onClick={() => toggleItem(style, workStyle, setWorkStyle)}
                  color="green" />
              ))}
            </div>
          </div>
        )}

        {/* ── Section 6: Learning Style ────────────────────────────────── */}
        {section === "learningstyle" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              How do you learn best?{" "}
              <span className="text-muted-foreground font-normal">(select all that apply)</span>{" "}
              <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {LEARNING_STYLES.map((style) => (
                <Chip key={style} label={style} selected={learningStyle.includes(style)}
                  onClick={() => toggleItem(style, learningStyle, setLearningStyle)}
                  color="amber" />
              ))}
            </div>
          </div>
        )}

        {/* ── Section 7: Motivation ────────────────────────────────────── */}
        {section === "motivation" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Why are you pursuing this career? <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CAREER_MOTIVATIONS.map((m) => (
                <button key={m} type="button" onClick={() => setMotivation(m)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    motivation === m ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
                  }`}>
                  <p className={`text-sm font-semibold ${motivation === m ? "text-primary" : "text-foreground"}`}>{m}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inline error */}
        {fieldError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {fieldError}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <Button variant="outline" className="rounded-xl px-6" onClick={goBack}
          disabled={submitMutation.isPending}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isFirst ? "Back to Phase 1" : "Back"}
        </Button>
        <Button className="rounded-xl px-8 flex-1 max-w-xs" onClick={goNext}
          disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "Saving…" : isLast ? "Save & Continue to Phase 3" : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
