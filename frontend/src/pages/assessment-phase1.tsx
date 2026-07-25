import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useAuth } from "@/hooks/useAuth";
import {
  assessmentService,
  type Phase1Input,
  type Phase1PersonalInfo,
  type Phase1Education,
  type Phase1Experience,
  type CareerGoal,
} from "@/services/assessmentService";
import { saveLastAccessedPhase } from "@/utils/assessmentProgress";
import {
  User, GraduationCap, Target, Code2,
  ArrowRight, ArrowLeft, CheckCircle2, Save, AlertCircle,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_PHASES = 7;

const CURRENT_STATUS_OPTIONS = [
  "School Student",
  "Diploma Student",
  "College Student",
  "Graduate",
  "Working Professional",
  "Career Switcher",
] as const;

const QUALIFICATION_OPTIONS = [
  "10th", "12th", "Diploma", "B.Tech", "B.E.",
  "BCA", "MCA", "BSc", "M.Tech", "MBA", "Other",
] as const;

const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th", "Completed"] as const;

const CAREER_GOAL_OPTIONS: CareerGoal[] = [
  "Get Internship", "Get Job", "Upskill",
  "Career Switch", "Higher Studies", "Freelancing", "Start Startup",
];

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;
const PROG_EXP_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const;

// ── Section step type ─────────────────────────────────────────────────────────
type Step = "personal" | "education" | "career" | "experience";
const STEPS: Step[] = ["personal", "education", "career", "experience"];

const STEP_META: Record<Step, { icon: typeof User; label: string; description: string }> = {
  personal:   { icon: User,          label: "Personal Info",   description: "Tell us about yourself" },
  education:  { icon: GraduationCap, label: "Education",       description: "Your academic background" },
  career:     { icon: Target,        label: "Career Goal",     description: "What you're aiming for" },
  experience: { icon: Code2,         label: "Experience",      description: "Your technical background" },
};

// ── Default form state ────────────────────────────────────────────────────────
const defaultPersonal: Phase1PersonalInfo = {
  firstName: "", lastName: "", age: 18,
  gender: "Prefer not to say", country: "", state: "", city: "",
};

const defaultEducation: Phase1Education = {
  currentStatus: "College Student",
  highestQualification: "B.Tech",
  collegeName: "", university: "", degree: "", branch: "",
  currentYear: "1st", expectedGraduationYear: null, cgpaOrPercentage: "",
};

const defaultExperience: Phase1Experience = {
  programmingExperience: "Beginner",
  previouslyWorked: false,
  yearsOfExperience: null, currentCompany: "", currentRole: "",
};

// ── Validation helpers ────────────────────────────────────────────────────────
function validatePersonal(p: Phase1PersonalInfo): string | null {
  if (!p.firstName.trim())  return "First name is required";
  if (!p.lastName.trim())   return "Last name is required";
  if (p.age < 13)           return "Minimum age is 13";
  if (p.age > 65)           return "Maximum age is 65";
  if (!p.country.trim())    return "Country is required";
  if (!p.state.trim())      return "State is required";
  if (!p.city.trim())       return "City is required";
  return null;
}

function validateEducation(e: Phase1Education): string | null {
  if (!e.currentStatus)         return "Current status is required";
  if (!e.highestQualification)  return "Qualification is required";
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AssessmentPhase1() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, reloadUser } = useAuth();
  const queryClient = useQueryClient();

  // Track phase access
  useEffect(() => {
    saveLastAccessedPhase(1);
  }, []);

  const [step, setStep]             = useState<Step>("personal");
  const [personal, setPersonal]     = useState<Phase1PersonalInfo>(defaultPersonal);
  const [education, setEducation]   = useState<Phase1Education>(defaultEducation);
  const [careerGoal, setCareerGoal] = useState<CareerGoal>("Get Job");
  const [experience, setExperience] = useState<Phase1Experience>(defaultExperience);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // ── Source 1: AuthContext user (primary — always up to date) ─────────────────
  useEffect(() => {
    if (!user) return;
    setPersonal((prev) => ({
      ...prev,
      firstName: user.firstName ?? (user.fullName?.split(" ")[0] ?? prev.firstName),
      lastName:  user.lastName  ?? (user.fullName?.split(" ").slice(1).join(" ") ?? prev.lastName),
      age:       user.age       ?? prev.age,
      gender:    (user.gender   as Phase1PersonalInfo["gender"]) ?? prev.gender,
      country:   user.country   ?? prev.country,
      state:     user.state     ?? prev.state,
      city:      user.city      ?? prev.city,
    }));
    setEducation((prev) => ({
      ...prev,
      currentStatus:          (user.currentStatus as Phase1Education["currentStatus"]) ?? prev.currentStatus,
      highestQualification:   (user.education     as Phase1Education["highestQualification"]) ?? prev.highestQualification,
      collegeName:            user.collegeName    ?? prev.collegeName,
      university:             user.university     ?? prev.university,
      degree:                 user.degree         ?? prev.degree,
      branch:                 user.branch         ?? prev.branch,
      currentYear:            (user.currentYear   as Phase1Education["currentYear"]) ?? prev.currentYear,
      expectedGraduationYear: user.expectedGraduationYear ?? prev.expectedGraduationYear,
      cgpaOrPercentage:       user.cgpa           ?? prev.cgpaOrPercentage,
    }));
    if (user.careerGoal) setCareerGoal(user.careerGoal as CareerGoal);
    setExperience((prev) => ({
      ...prev,
      programmingExperience:  (user.programmingExperience as Phase1Experience["programmingExperience"]) ?? prev.programmingExperience,
      previouslyWorked:       user.previouslyWorked  ?? prev.previouslyWorked,
      yearsOfExperience:      user.yearsOfExperience ?? prev.yearsOfExperience,
      currentCompany:         user.currentCompany    ?? prev.currentCompany,
      currentRole:            user.currentRole       ?? prev.currentRole,
    }));
  // Run once when user loads — do not re-run on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Source 2: Saved assessment session (fallback if user fields are empty) ───
  const { data: existing } = useQuery({
    queryKey: ["assessment", "phase-1"],
    queryFn:  assessmentService.getPhase1,
    retry:    false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!existing) return;
    // Only apply session data for fields that are still at their default value
    // (i.e. user context did not already fill them)
    if (existing.personalInfo) {
      setPersonal((prev) => ({
        firstName: prev.firstName || existing.personalInfo!.firstName,
        lastName:  prev.lastName  || existing.personalInfo!.lastName,
        age:       prev.age !== 18 ? prev.age : existing.personalInfo!.age,
        gender:    prev.gender !== "Prefer not to say" ? prev.gender : existing.personalInfo!.gender,
        country:   prev.country || existing.personalInfo!.country,
        state:     prev.state   || existing.personalInfo!.state,
        city:      prev.city    || existing.personalInfo!.city,
      }));
    }
    if (existing.education)  setEducation((prev) => ({ ...existing.education!, ...Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== "" && v != null)) }));
    if (existing.careerGoal && careerGoal === "Get Job") setCareerGoal(existing.careerGoal);
    if (existing.experience) setExperience((prev) => ({ ...existing.experience!, ...Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== "" && v != null && v !== false)) }));
  // Run once when session data loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  // Submit mutation — saves to backend, then syncs AuthContext + query cache
  const submitMutation = useMutation({
    mutationFn: (payload: Phase1Input) =>
      existing ? assessmentService.updatePhase1(payload) : assessmentService.savePhase1(payload),
    onSuccess: async (data) => {
      // Sync the global user object so every part of the app sees the new profile
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["assessment", "phase-1"] });
      try {
        localStorage.setItem("pragyan_assessment_phase", "1");
        localStorage.setItem("pragyan_assessment_session", data.sessionId);
      } catch { /* ignore */ }
      toast({ title: "Phase 1 saved!", description: "Your profile has been updated. Moving to the next phase…" });
      setTimeout(() => navigate("/assessment/phase-2"), 600);
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  // Auto-save builds payload only when all steps visited
  const buildPayload = (): Phase1Input => ({
    personalInfo: personal,
    education,
    careerGoal,
    experience,
  });

  const { autoSave, isSaving } = useAutoSave<Phase1Input>(
    (data) => assessmentService.savePhase1(data),
    2000
  );

  // Trigger auto-save whenever form data changes (after step 1+)
  useEffect(() => {
    if (step === "personal") return; // wait until at least education is reached
    autoSave(buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, education, careerGoal, experience]);

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const stepIndex  = STEPS.indexOf(step);
  const isFirst    = stepIndex === 0;
  const isLast     = stepIndex === STEPS.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  const goNext = () => {
    setFieldError(null);
    if (step === "personal") {
      const err = validatePersonal(personal);
      if (err) { setFieldError(err); return; }
    }
    if (step === "education") {
      const err = validateEducation(education);
      if (err) { setFieldError(err); return; }
    }
    if (!isLast) setStep(STEPS[stepIndex + 1]);
    else handleSubmit();
  };

  const goBack = () => {
    setFieldError(null);
    if (!isFirst) setStep(STEPS[stepIndex - 1]);
    else navigate("/assessments");
  };

  const handleSubmit = () => {
    const err = validatePersonal(personal) ?? validateEducation(education);
    if (err) { setFieldError(err); return; }
    submitMutation.mutate(buildPayload());
  };

  // ── Shared select component ──────────────────────────────────────────────────
  const Select = ({
    value, onChange, options, placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: readonly string[];
    placeholder?: string;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  // ── Option pill component ────────────────────────────────────────────────────
  const OptionPill = ({
    value, selected, onClick,
  }: {
    value: string; selected: boolean; onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {value}
    </button>
  );

  const meta = STEP_META[step];
  const StepIcon = meta.icon;

  return (
    <div className="max-w-2xl mx-auto pb-16 px-4">

      {/* ── Phase indicator ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Phase 1 of {TOTAL_PHASES}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving && (
              <>
                <Save className="w-3 h-3 animate-pulse text-primary" />
                <span>Saving…</span>
              </>
            )}
            {!isSaving && (existing || user?.firstName) && (
              <>
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span>Profile synced</span>
              </>
            )}
          </div>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <StepIcon className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Tell us about yourself
        </h1>
        <p className="text-muted-foreground mt-2">
          {meta.description} — this helps us personalise your career assessment.
        </p>
      </div>

      {/* ── Step tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const M = STEP_META[s];
          const Icon = M.icon;
          const done = i < stepIndex;
          const active = s === step;
          return (
            <button
              key={s}
              type="button"
              onClick={() => { setFieldError(null); setStep(s); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : done
                  ? "bg-green-100 text-green-700"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              {M.label}
            </button>
          );
        })}
      </div>

      {/* ── Form card ───────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-[20px] shadow-sm p-8 space-y-6">

        {/* ── STEP: Personal Info ────────────────────────────────────── */}
        {step === "personal" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Rahul"
                  value={personal.firstName}
                  onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Sharma"
                  value={personal.lastName}
                  onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Age <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={13}
                  max={65}
                  placeholder="18"
                  value={personal.age || ""}
                  onChange={(e) => setPersonal({ ...personal, age: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Must be between 13 and 65</p>
              </div>
              <div className="space-y-1.5">
                <Label>Gender <span className="text-red-500">*</span></Label>
                <Select
                  value={personal.gender}
                  onChange={(v) => setPersonal({ ...personal, gender: v as Phase1PersonalInfo["gender"] })}
                  options={GENDER_OPTIONS}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Country <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. India"
                value={personal.country}
                onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>State <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Maharashtra"
                  value={personal.state}
                  onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>City <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Pune"
                  value={personal.city}
                  onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {/* ── STEP: Education ────────────────────────────────────────── */}
        {step === "education" && (
          <>
            <div className="space-y-1.5">
              <Label>Current Status <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {CURRENT_STATUS_OPTIONS.map((opt) => (
                  <OptionPill
                    key={opt} value={opt}
                    selected={education.currentStatus === opt}
                    onClick={() => setEducation({ ...education, currentStatus: opt })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Highest Qualification <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {QUALIFICATION_OPTIONS.map((opt) => (
                  <OptionPill
                    key={opt} value={opt}
                    selected={education.highestQualification === opt}
                    onClick={() => setEducation({ ...education, highestQualification: opt })}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>College Name</Label>
                <Input
                  placeholder="e.g. COEP Pune"
                  value={education.collegeName ?? ""}
                  onChange={(e) => setEducation({ ...education, collegeName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>University</Label>
                <Input
                  placeholder="e.g. Savitribai Phule"
                  value={education.university ?? ""}
                  onChange={(e) => setEducation({ ...education, university: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Degree</Label>
                <Input
                  placeholder="e.g. B.Tech"
                  value={education.degree ?? ""}
                  onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Branch / Specialization</Label>
                <Input
                  placeholder="e.g. Computer Science"
                  value={education.branch ?? ""}
                  onChange={(e) => setEducation({ ...education, branch: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Current Year</Label>
                <Select
                  value={education.currentYear ?? ""}
                  onChange={(v) => setEducation({ ...education, currentYear: v as Phase1Education["currentYear"] })}
                  options={YEAR_OPTIONS}
                  placeholder="Select year"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Graduation Year</Label>
                <Input
                  type="number"
                  min={2000}
                  max={2040}
                  placeholder="e.g. 2026"
                  value={education.expectedGraduationYear ?? ""}
                  onChange={(e) => setEducation({
                    ...education,
                    expectedGraduationYear: e.target.value ? Number(e.target.value) : null,
                  })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>CGPA / Percentage</Label>
              <Input
                placeholder="e.g. 8.5 or 85%"
                value={education.cgpaOrPercentage ?? ""}
                onChange={(e) => setEducation({ ...education, cgpaOrPercentage: e.target.value })}
              />
            </div>
          </>
        )}

        {/* ── STEP: Career Goal ─────────────────────────────────────── */}
        {step === "career" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">
              What best describes your current goal?{" "}
              <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CAREER_GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCareerGoal(opt)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    careerGoal === opt
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <p className={`text-sm font-semibold ${careerGoal === opt ? "text-primary" : "text-foreground"}`}>
                    {opt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: Experience ──────────────────────────────────────── */}
        {step === "experience" && (
          <>
            <div className="space-y-2">
              <Label>Programming Experience <span className="text-red-500">*</span></Label>
              <div className="flex gap-3">
                {PROG_EXP_OPTIONS.map((opt) => (
                  <OptionPill
                    key={opt} value={opt}
                    selected={experience.programmingExperience === opt}
                    onClick={() => setExperience({ ...experience, programmingExperience: opt })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Previously Worked? <span className="text-red-500">*</span></Label>
              <div className="flex gap-3">
                {(["Yes", "No"] as const).map((opt) => (
                  <OptionPill
                    key={opt} value={opt}
                    selected={experience.previouslyWorked === (opt === "Yes")}
                    onClick={() => setExperience({ ...experience, previouslyWorked: opt === "Yes" })}
                  />
                ))}
              </div>
            </div>

            {experience.previouslyWorked && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="space-y-1.5">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    placeholder="e.g. 2"
                    value={experience.yearsOfExperience ?? ""}
                    onChange={(e) => setExperience({
                      ...experience,
                      yearsOfExperience: e.target.value ? Number(e.target.value) : null,
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Current Company</Label>
                    <Input
                      placeholder="e.g. Infosys"
                      value={experience.currentCompany ?? ""}
                      onChange={(e) => setExperience({ ...experience, currentCompany: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current Role</Label>
                    <Input
                      placeholder="e.g. Software Engineer"
                      value={experience.currentRole ?? ""}
                      onChange={(e) => setExperience({ ...experience, currentRole: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Inline error ─────────────────────────────────────────── */}
        {fieldError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {fieldError}
          </div>
        )}
      </div>

      {/* ── Navigation buttons ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <Button
          variant="outline"
          className="rounded-xl px-6"
          onClick={goBack}
          disabled={submitMutation.isPending}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isFirst ? "Back to Assessment" : "Back"}
        </Button>

        <Button
          className="rounded-xl px-8 flex-1 max-w-xs"
          onClick={goNext}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending
            ? "Saving…"
            : isLast
            ? "Save & Continue to Phase 2"
            : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
