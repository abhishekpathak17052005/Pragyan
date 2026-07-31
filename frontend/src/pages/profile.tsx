// src/pages/profile.tsx — Redesigned SaaS Profile Page
import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Globe, Github, Linkedin, Camera, CheckCircle2, AlertCircle,
  Save, RotateCcw, X, ChevronRight, Pencil, ExternalLink,
  Calendar, Building2, Star, Target, Code2, BookOpen, FileText,
} from "lucide-react";
import type { AuthUser } from "@/types/api";

// ── Constants ──────────────────────────────────────────────────────────────────
const GENDER_OPTIONS   = ["Male", "Female", "Non-binary", "Prefer not to say"];
const STATUS_OPTIONS   = ["School Student", "Diploma Student", "College Student", "Graduate", "Working Professional", "Career Switcher"];
const QUAL_OPTIONS     = ["10th", "12th", "Diploma", "B.Tech", "B.E.", "BCA", "MCA", "BSc", "M.Tech", "MBA", "Other"];
const PROG_EXP_OPTIONS = ["Beginner", "Intermediate", "Advanced"];
const CAREER_GOALS     = ["Get Internship", "Get Job", "Upskill", "Career Switch", "Higher Studies", "Freelancing", "Start Startup"];

// ── Profile completion calculator ─────────────────────────────────────────────
const COMPLETION_FIELDS: Array<{ key: keyof AuthUser; label: string; weight: number }> = [
  { key: "fullName",             label: "Full Name",             weight: 8 },
  { key: "email",                label: "Email",                 weight: 8 },
  { key: "phone",                label: "Phone",                 weight: 5 },
  { key: "gender",               label: "Gender",                weight: 3 },
  { key: "country",              label: "Country",               weight: 4 },
  { key: "currentStatus",        label: "Current Status",        weight: 6 },
  { key: "education",            label: "Qualification",         weight: 6 },
  { key: "currentTitle",         label: "Current Title",         weight: 5 },
  { key: "programmingExperience",label: "Programming Level",     weight: 5 },
  { key: "careerGoal",           label: "Career Goal",           weight: 6 },
  { key: "linkedin",             label: "LinkedIn",              weight: 5 },
  { key: "bio",                  label: "Bio",                   weight: 5 },
  { key: "skills",               label: "Skills",                weight: 8 },
  { key: "currentCompany",       label: "Company/College",       weight: 4 },
  { key: "currentRole",          label: "Current Role",          weight: 4 },
  { key: "city",                 label: "City",                  weight: 3 },
  { key: "githubUrl",            label: "GitHub",                weight: 5 },
  { key: "dateOfBirth",          label: "Date of Birth",         weight: 3 },
  { key: "portfolioWebsite",     label: "Portfolio",             weight: 4 },
  { key: "preferredCareerDomain",label: "Career Domain",         weight: 3 },
];

function calcCompletion(user: AuthUser | null): { pct: number; missing: string[] } {
  if (!user) return { pct: 0, missing: [] };
  const total = COMPLETION_FIELDS.reduce((s, f) => s + f.weight, 0);
  const missing: string[] = [];
  let filled = 0;
  for (const f of COMPLETION_FIELDS) {
    const v = user[f.key];
    const ok = Array.isArray(v) ? v.length > 0 : Boolean(v);
    if (ok) filled += f.weight;
    else missing.push(f.label);
  }
  return { pct: Math.round((filled / total) * 100), missing };
}

// ── Small reusable UI pieces ───────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted/30">
        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  id, label, required, hint, children,
}: { id?: string; label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow placeholder:text-muted-foreground/50 disabled:opacity-60 disabled:cursor-not-allowed";
const selectCls = inputCls;

function SelectField({ id, value, onChange, options, placeholder }: {
  id?: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SkillInput({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !skills.includes(val)) { onChange([...skills, val]); setInput(""); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={inputCls + " flex-1"} placeholder="Add skill (press Enter)" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button type="button" size="sm" variant="outline" className="rounded-xl px-3" onClick={add}>Add</Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              {s}
              <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))} className="hover:text-red-500 transition-colors">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile Summary Card ───────────────────────────────────────────────────────
function ProfileSummaryCard({ user, completion }: { user: AuthUser; completion: { pct: number; missing: string[] } }) {
  const initials = (user.fullName || user.email || "U")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

  const role = user.currentTitle || user.currentStatus || (user.role === "ADMIN" ? "Administrator" : "Learner");
  const location = [user.city, user.country].filter(Boolean).join(", ");
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : null;

  const pct = completion.pct;
  const pctColor = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
  const barColor = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Cover strip */}
      <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl border-4 border-card bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-sm">
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-2xl object-cover" />
              ) : (initials || "U")}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            {user.emailVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> Unverified
              </span>
            )}
          </div>
        </div>

        {/* Name & role */}
        <h2 className="text-xl font-bold text-foreground leading-tight">{user.fullName || "—"}</h2>
        {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
        <p className="text-sm text-primary font-medium mt-0.5">{role}</p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {location}
            </span>
          )}
          {joined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> Joined {joined}
            </span>
          )}
        </div>

        {/* Primary email — read only, always shown */}
        <div className="mt-4 p-3 bg-muted/40 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Primary Email</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
              </div>
            </div>
            {user.emailVerified
              ? <span className="flex items-center gap-1 text-[10px] text-green-700 font-semibold"><CheckCircle2 className="w-3 h-3" /> Verified</span>
              : <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold"><AlertCircle className="w-3 h-3" /> Pending</span>
            }
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">Used for login, account recovery & notifications. <a href="/settings" className="text-primary hover:underline">Change in Settings</a></p>
        </div>

        {/* Completion bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Profile Completion</span>
            <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          {completion.missing.length > 0 && pct < 100 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Missing: {completion.missing.slice(0, 4).join(", ")}{completion.missing.length > 4 ? ` +${completion.missing.length - 4} more` : ""}
            </p>
          )}
        </div>

        {/* Social links */}
        {(user.linkedin || user.githubUrl) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {user.linkedin && (
              <a href={user.linkedin.startsWith("http") ? user.linkedin : `https://${user.linkedin}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" /> LinkedIn
              </a>
            )}
            {user.githubUrl && (
              <a href={user.githubUrl.startsWith("http") ? user.githubUrl : `https://github.com/${user.githubUrl}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {user.portfolioWebsite && (
              <a href={user.portfolioWebsite.startsWith("http") ? user.portfolioWebsite : `https://${user.portfolioWebsite}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                <Globe className="w-3.5 h-3.5 text-primary" /> Portfolio
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form state shape ───────────────────────────────────────────────────────────
interface ProfileForm {
  firstName: string; lastName: string; phone: string; gender: string;
  dateOfBirth: string; country: string; state: string; city: string;
  currentStatus: string; education: string; currentTitle: string;
  currentRole: string; currentCompany: string; yearsOfExperience: string;
  programmingExperience: string; careerGoal: string; preferredCareerDomain: string;
  skills: string[]; linkedin: string; githubUrl: string;
  portfolioWebsite: string; bio: string; username: string;
}

function buildForm(user: AuthUser | null): ProfileForm {
  if (!user) return {
    firstName: "", lastName: "", phone: "", gender: "", dateOfBirth: "",
    country: "", state: "", city: "", currentStatus: "", education: "",
    currentTitle: "", currentRole: "", currentCompany: "", yearsOfExperience: "",
    programmingExperience: "", careerGoal: "", preferredCareerDomain: "",
    skills: [], linkedin: "", githubUrl: "", portfolioWebsite: "", bio: "", username: "",
  };
  return {
    firstName:   user.firstName  ?? user.fullName?.split(" ")[0]  ?? "",
    lastName:    user.lastName   ?? user.fullName?.split(" ").slice(1).join(" ") ?? "",
    phone:       user.phone      ?? "",
    gender:      user.gender     ?? "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    country:     user.country    ?? "",
    state:       user.state      ?? "",
    city:        user.city       ?? "",
    currentStatus:         user.currentStatus         ?? "",
    education:             user.education             ?? "",
    currentTitle:          user.currentTitle          ?? "",
    currentRole:           user.currentRole           ?? "",
    currentCompany:        user.currentCompany        ?? "",
    yearsOfExperience:     user.yearsOfExperience != null ? String(user.yearsOfExperience) : "",
    programmingExperience: user.programmingExperience ?? "",
    careerGoal:            user.careerGoal            ?? "",
    preferredCareerDomain: user.preferredCareerDomain ?? "",
    skills:         Array.isArray(user.skills) ? user.skills : [],
    linkedin:       user.linkedin         ?? "",
    githubUrl:      user.githubUrl        ?? "",
    portfolioWebsite: user.portfolioWebsite ?? "",
    bio:            user.bio              ?? "",
    username:       user.username         ?? "",
  };
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validate(form: ProfileForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.phone && !/^[+\d\s\-()]{7,15}$/.test(form.phone)) errors.phone = "Enter a valid phone number";
  if (form.linkedin && !/^(https?:\/\/)?(www\.)?linkedin\.com\//.test(form.linkedin)) errors.linkedin = "Enter a valid LinkedIn URL";
  if (form.githubUrl && !/^(https?:\/\/)?(www\.)?github\.com\//.test(form.githubUrl)) errors.githubUrl = "Enter a valid GitHub URL";
  if (form.portfolioWebsite && !/^https?:\/\//.test(form.portfolioWebsite)) errors.portfolioWebsite = "URL must start with https://";
  if (form.yearsOfExperience) {
    const n = parseFloat(form.yearsOfExperience);
    if (isNaN(n) || n < 0 || n > 50) errors.yearsOfExperience = "Enter a valid number (0–50)";
  }
  return errors;
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, reloadUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
    retry: false,
  });

  const [form, setForm] = useState<ProfileForm>(() => buildForm(user));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  // Reset form when user data loads
  useEffect(() => {
    if (user) { setForm(buildForm(user)); setDirty(false); }
  }, [user]);

  const set = useCallback(<K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k as string]; return n; });
    setDirty(true);
  }, []);

  const setStr = useCallback((k: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(k, e.target.value as ProfileForm[typeof k]),
  [set]);

  const { pct: completionPct, missing: completionMissing } = user
    ? calcCompletion({
        ...user,
        ...form,
        firstName: form.firstName, lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`.trim() || user.fullName,
        skills: form.skills,
      } as unknown as AuthUser)
    : { pct: 0, missing: [] };

  const saveMut = useMutation({
    mutationFn: () => {
      const errs = validate(form);
      if (Object.keys(errs).length) { setErrors(errs); throw new Error("Please fix validation errors"); }
      return authService.updateProfile({
        firstName:   form.firstName   || undefined,
        lastName:    form.lastName    || undefined,
        fullName:    `${form.firstName} ${form.lastName}`.trim() || undefined,
        phone:       form.phone       || undefined,
        gender:      form.gender      || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        country:     form.country     || undefined,
        state:       form.state       || undefined,
        city:        form.city        || undefined,
        location:    [form.city, form.state, form.country].filter(Boolean).join(", ") || undefined,
        currentStatus:         form.currentStatus         || undefined,
        education:             form.education             || undefined,
        currentTitle:          form.currentTitle          || undefined,
        currentRole:           form.currentRole           || undefined,
        currentCompany:        form.currentCompany        || undefined,
        yearsOfExperience:     form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        programmingExperience: form.programmingExperience || undefined,
        skillLevel:            form.programmingExperience || undefined,
        careerGoal:            form.careerGoal            || undefined,
        careerTrack:           form.careerGoal            || undefined,
        preferredCareerDomain: form.preferredCareerDomain || undefined,
        skills:          form.skills.length ? form.skills : undefined,
        linkedin:        form.linkedin         || undefined,
        githubUrl:       form.githubUrl        || undefined,
        portfolioWebsite: form.portfolioWebsite || undefined,
        bio:             form.bio              || undefined,
        username:        form.username         || undefined,
        previouslyWorked: !!form.yearsOfExperience && Number(form.yearsOfExperience) > 0,
        experience: form.yearsOfExperience ? `${form.yearsOfExperience} years` : undefined,
        experienceType: form.yearsOfExperience && Number(form.yearsOfExperience) > 0 ? "experienced" : "fresher",
      } as any);
    },
    onSuccess: async () => {
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDirty(false);
      toast({ title: "Profile updated ✓", description: "Your changes have been saved." });
    },
    onError: (e: Error) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  const handleReset = () => { if (user) { setForm(buildForm(user)); setErrors({}); setDirty(false); } };

  if (!user || profileLoading) return <ProfileSkeleton />;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information and career details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Left column: summary card ── */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <ProfileSummaryCard
            user={{ ...user, ...form, fullName: `${form.firstName} ${form.lastName}`.trim() || user.fullName, skills: form.skills } as unknown as AuthUser}
            completion={{ pct: completionPct, missing: completionMissing }}
          />
        </div>

        {/* ── Right column: form sections ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Personal Information ── */}
          <SectionCard title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="firstName" label="First Name" required>
                <input id="firstName" className={inputCls} value={form.firstName} onChange={setStr("firstName")} placeholder="John" />
              </Field>
              <Field id="lastName" label="Last Name">
                <input id="lastName" className={inputCls} value={form.lastName} onChange={setStr("lastName")} placeholder="Doe" />
              </Field>
              <Field id="username" label="Username" hint="Your public @handle">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <input id="username" className={inputCls + " pl-7"} value={form.username} onChange={setStr("username")} placeholder="johndoe" />
                </div>
              </Field>
              <Field id="phone" label="Phone Number" hint="Used for important account notifications">
                <input id="phone" className={inputCls + (errors.phone ? " border-red-400 ring-1 ring-red-400/30" : "")}
                  value={form.phone} onChange={setStr("phone")} placeholder="+91 98765 43210" type="tel" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </Field>
              <Field id="gender" label="Gender">
                <SelectField id="gender" value={form.gender} onChange={(v) => set("gender", v)} options={GENDER_OPTIONS} placeholder="Select gender" />
              </Field>
              <Field id="dateOfBirth" label="Date of Birth">
                <input id="dateOfBirth" className={inputCls} value={form.dateOfBirth} onChange={setStr("dateOfBirth")} type="date"
                  max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} />
              </Field>
              <Field id="country" label="Country">
                <input id="country" className={inputCls} value={form.country} onChange={setStr("country")} placeholder="India" />
              </Field>
              <Field id="state" label="State / Province">
                <input id="state" className={inputCls} value={form.state} onChange={setStr("state")} placeholder="Maharashtra" />
              </Field>
              <Field id="city" label="City">
                <input id="city" className={inputCls} value={form.city} onChange={setStr("city")} placeholder="Mumbai" />
              </Field>
            </div>
          </SectionCard>

          {/* ── Professional Information ── */}
          <SectionCard title="Professional Information" icon={Briefcase}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="currentStatus" label="Current Status" required>
                <SelectField id="currentStatus" value={form.currentStatus} onChange={(v) => set("currentStatus", v)} options={STATUS_OPTIONS} placeholder="Select status" />
              </Field>
              <Field id="education" label="Highest Qualification">
                <SelectField id="education" value={form.education} onChange={(v) => set("education", v)} options={QUAL_OPTIONS} placeholder="Select qualification" />
              </Field>
              <Field id="currentTitle" label="Current Title" hint="e.g. Software Engineer, Student">
                <input id="currentTitle" className={inputCls} value={form.currentTitle} onChange={setStr("currentTitle")} placeholder="Full Stack Developer" />
              </Field>
              <Field id="currentRole" label="Current Role">
                <input id="currentRole" className={inputCls} value={form.currentRole} onChange={setStr("currentRole")} placeholder="Backend Developer" />
              </Field>
              <Field id="currentCompany" label="Company / College">
                <input id="currentCompany" className={inputCls} value={form.currentCompany} onChange={setStr("currentCompany")} placeholder="Infosys / IIT Bombay" />
              </Field>
              <Field id="yearsOfExperience" label="Years of Experience" hint="Enter 0 for fresher">
                <input id="yearsOfExperience"
                  className={inputCls + (errors.yearsOfExperience ? " border-red-400 ring-1 ring-red-400/30" : "")}
                  value={form.yearsOfExperience} onChange={setStr("yearsOfExperience")} type="number" min="0" max="50" step="0.5" placeholder="0" />
                {errors.yearsOfExperience && <p className="text-xs text-red-500 mt-1">{errors.yearsOfExperience}</p>}
              </Field>
              <Field id="programmingExperience" label="Programming Experience Level">
                <SelectField id="programmingExperience" value={form.programmingExperience} onChange={(v) => set("programmingExperience", v)} options={PROG_EXP_OPTIONS} placeholder="Select level" />
              </Field>
            </div>
          </SectionCard>

          {/* ── Career ── */}
          <SectionCard title="Career & Interests" icon={Target}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="careerGoal" label="Career Goal">
                <SelectField id="careerGoal" value={form.careerGoal} onChange={(v) => set("careerGoal", v)} options={CAREER_GOALS} placeholder="Select goal" />
              </Field>
              <Field id="preferredCareerDomain" label="Preferred Career Domain" hint="e.g. Web Dev, Data Science, DevOps">
                <input id="preferredCareerDomain" className={inputCls} value={form.preferredCareerDomain} onChange={setStr("preferredCareerDomain")} placeholder="Full Stack Development" />
              </Field>
              <div className="sm:col-span-2">
                <Field id="skills" label="Skills" hint="Press Enter or click Add to add a skill">
                  <SkillInput skills={form.skills} onChange={(s) => { set("skills", s); }} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* ── Social Links ── */}
          <SectionCard title="Social Links" icon={Globe}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="linkedin" label="LinkedIn" hint="linkedin.com/in/…">
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0A66C2]" />
                  <input id="linkedin"
                    className={inputCls + " pl-9" + (errors.linkedin ? " border-red-400 ring-1 ring-red-400/30" : "")}
                    value={form.linkedin} onChange={setStr("linkedin")} placeholder="https://linkedin.com/in/johndoe" />
                </div>
                {errors.linkedin && <p className="text-xs text-red-500 mt-1">{errors.linkedin}</p>}
              </Field>
              <Field id="githubUrl" label="GitHub" hint="github.com/…">
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground" />
                  <input id="githubUrl"
                    className={inputCls + " pl-9" + (errors.githubUrl ? " border-red-400 ring-1 ring-red-400/30" : "")}
                    value={form.githubUrl} onChange={setStr("githubUrl")} placeholder="https://github.com/johndoe" />
                </div>
                {errors.githubUrl && <p className="text-xs text-red-500 mt-1">{errors.githubUrl}</p>}
              </Field>
              <Field id="portfolioWebsite" label="Portfolio Website">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                  <input id="portfolioWebsite"
                    className={inputCls + " pl-9" + (errors.portfolioWebsite ? " border-red-400 ring-1 ring-red-400/30" : "")}
                    value={form.portfolioWebsite} onChange={setStr("portfolioWebsite")} placeholder="https://johndoe.dev" />
                </div>
                {errors.portfolioWebsite && <p className="text-xs text-red-500 mt-1">{errors.portfolioWebsite}</p>}
              </Field>
            </div>
          </SectionCard>

          {/* ── About / Bio ── */}
          <SectionCard title="About" icon={FileText}>
            <Field id="bio" label="Bio" hint="Tell us a bit about yourself — shown on your profile">
              <textarea id="bio" className={inputCls + " resize-none"} rows={4}
                value={form.bio} onChange={setStr("bio")} placeholder="I'm a passionate developer who loves building products that solve real problems…"
                maxLength={500} />
              <p className="text-[10px] text-muted-foreground text-right">{form.bio.length}/500</p>
            </Field>
          </SectionCard>

          {/* ── Action bar ── */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {dirty && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Unsaved changes
              </span>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleReset} disabled={!dirty || saveMut.isPending}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button type="button" size="sm" className="rounded-xl gap-2 px-6" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? (
                <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving…</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save Changes</>
              )}
            </Button>
          </div>

        </div>{/* end right col */}
      </div>{/* end grid */}
    </div>
  );
}
