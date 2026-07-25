import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, Github, Linkedin, Save, CheckCircle2, AlertCircle,
} from "lucide-react";

const CURRENT_STATUS_OPTIONS = [
  "School Student", "Diploma Student", "College Student",
  "Graduate", "Working Professional", "Career Switcher",
];
const QUALIFICATION_OPTIONS = [
  "10th", "12th", "Diploma", "B.Tech", "B.E.",
  "BCA", "MCA", "BSc", "M.Tech", "MBA", "Other",
];
const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th", "Completed"];
const CAREER_GOAL_OPTIONS = [
  "Get Internship", "Get Job", "Upskill",
  "Career Switch", "Higher Studies", "Freelancing", "Start Startup",
];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const PROG_EXP_OPTIONS = ["Beginner", "Intermediate", "Advanced"];

const inputCls =
  "w-full px-4 py-3 border border-border rounded-xl text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const labelCls = "block text-sm font-medium text-muted-foreground mb-1.5";

type Section = "identity" | "education" | "career" | "experience";

export default function EditInformation() {
  const { user, reloadUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>("identity");
  const [saved, setSaved] = useState(false);

  // ── Form state pre-filled from AuthContext ──────────────────────────────────
  const [form, setForm] = useState({
    // Identity
    firstName:    "",
    lastName:     "",
    fullName:     "",
    age:          "",
    gender:       "",
    phone:        "",
    linkedin:     "",
    country:      "",
    state:        "",
    city:         "",
    // Education
    currentStatus:           "",
    education:               "",
    collegeName:             "",
    university:              "",
    degree:                  "",
    branch:                  "",
    currentYear:             "",
    expectedGraduationYear:  "",
    cgpa:                    "",
    // Career
    careerGoal:  "",
    careerTrack: "",
    currentTitle: "",
    // Experience
    programmingExperience: "",
    previouslyWorked:      false,
    yearsOfExperience:     "",
    currentCompany:        "",
    currentRole:           "",
  });

  // Pre-fill from user context on mount and whenever user changes
  useEffect(() => {
    if (!user) return;
    setForm({
      firstName:    user.firstName ?? (user.fullName?.split(" ")[0] ?? ""),
      lastName:     user.lastName  ?? (user.fullName?.split(" ").slice(1).join(" ") ?? ""),
      fullName:     user.fullName  ?? "",
      age:          user.age != null ? String(user.age) : "",
      gender:       user.gender ?? "",
      phone:        user.phone ?? "",
      linkedin:     user.linkedin ?? "",
      country:      user.country ?? "",
      state:        user.state ?? "",
      city:         user.city ?? "",
      currentStatus:          user.currentStatus ?? "",
      education:              user.education ?? "",
      collegeName:            user.collegeName ?? "",
      university:             user.university ?? "",
      degree:                 user.degree ?? "",
      branch:                 user.branch ?? "",
      currentYear:            user.currentYear ?? "",
      expectedGraduationYear: user.expectedGraduationYear != null ? String(user.expectedGraduationYear) : "",
      cgpa:                   user.cgpa ?? "",
      careerGoal:             user.careerGoal ?? "",
      careerTrack:            user.careerTrack ?? "",
      currentTitle:           user.currentTitle ?? "",
      programmingExperience:  user.programmingExperience ?? "",
      previouslyWorked:       user.previouslyWorked ?? false,
      yearsOfExperience:      user.yearsOfExperience != null ? String(user.yearsOfExperience) : "",
      currentCompany:         user.currentCompany ?? "",
      currentRole:            user.currentRole ?? "",
    });
  }, [user]);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const setBool = (key: keyof typeof form, val: boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        firstName:    form.firstName || undefined,
        lastName:     form.lastName  || undefined,
        fullName:     `${form.firstName} ${form.lastName}`.trim() || form.fullName || undefined,
        age:          form.age ? Number(form.age) : undefined,
        gender:       form.gender    || undefined,
        phone:        form.phone     || undefined,
        linkedin:     form.linkedin  || undefined,
        country:      form.country   || undefined,
        state:        form.state     || undefined,
        city:         form.city      || undefined,
        location:     [form.city, form.state, form.country].filter(Boolean).join(", ") || undefined,
        currentStatus:           form.currentStatus           || undefined,
        education:               form.education               || undefined,
        collegeName:             form.collegeName             || undefined,
        university:              form.university              || undefined,
        degree:                  form.degree                  || undefined,
        branch:                  form.branch                  || undefined,
        currentYear:             form.currentYear             || undefined,
        expectedGraduationYear:  form.expectedGraduationYear ? Number(form.expectedGraduationYear) : undefined,
        cgpa:                    form.cgpa                    || undefined,
        careerGoal:              form.careerGoal              || undefined,
        careerTrack:             form.careerGoal || form.careerTrack || undefined,
        currentTitle:            form.currentTitle            || undefined,
        programmingExperience:   form.programmingExperience   || undefined,
        skillLevel:              form.programmingExperience   || undefined,
        previouslyWorked:        form.previouslyWorked,
        experienceType:          form.previouslyWorked ? "experienced" : "fresher",
        experience:              form.previouslyWorked
          ? `${form.yearsOfExperience || 0} years`
          : "fresher",
        yearsOfExperience: form.yearsOfExperience
          ? Number(form.yearsOfExperience)
          : undefined,
        currentCompany: form.currentCompany || undefined,
        currentRole:    form.currentRole    || undefined,
      } as any),
    onSuccess: async () => {
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Profile saved!", description: "All changes have been updated." });
    },
    onError: (err: Error) => {
      toast({
        title: "Save failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const sectionTabs: { id: Section; label: string }[] = [
    { id: "identity",   label: "Identity & Contact" },
    { id: "education",  label: "Education" },
    { id: "career",     label: "Career Goal" },
    { id: "experience", label: "Experience" },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href="/profile" className="hover:text-foreground transition-colors">
          Profile
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-medium">Edit Information</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Edit Profile</h1>
        <p className="text-muted-foreground mt-1">
          Your profile is synchronized with the Assessment Engine and visible across the platform.
        </p>
      </div>

      {/* Saved banner */}
      {saved && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Profile updated and synchronized across the platform.
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sectionTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
              activeSection === id
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm space-y-5">

        {/* ── IDENTITY ──────────────────────────────────────────────────────── */}
        {activeSection === "identity" && (
          <>
            <h2 className="font-bold text-foreground text-lg mb-2">Identity &amp; Contact</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>First Name</Label>
                <Input value={form.firstName} onChange={set("firstName")} placeholder="Rahul" />
              </div>
              <div>
                <Label className={labelCls}>Last Name</Label>
                <Input value={form.lastName} onChange={set("lastName")} placeholder="Sharma" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Age</Label>
                <Input
                  type="number" min={13} max={65}
                  value={form.age} onChange={set("age")} placeholder="21"
                />
              </div>
              <div>
                <Label className={labelCls}>Gender</Label>
                <select value={form.gender} onChange={set("gender")} className={inputCls}>
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label className={labelCls}>Phone</Label>
              <Input value={form.phone} onChange={set("phone")} placeholder="9876543210" />
            </div>

            <div>
              <Label className={labelCls}>LinkedIn</Label>
              <div className="relative">
                <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.linkedin}
                  onChange={set("linkedin")}
                  placeholder="linkedin.com/in/yourprofile"
                  className={`${inputCls} pl-11`}
                />
              </div>
            </div>

            <div>
              <Label className={labelCls}>Country</Label>
              <Input value={form.country} onChange={set("country")} placeholder="India" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>State</Label>
                <Input value={form.state} onChange={set("state")} placeholder="Maharashtra" />
              </div>
              <div>
                <Label className={labelCls}>City</Label>
                <Input value={form.city} onChange={set("city")} placeholder="Pune" />
              </div>
            </div>
          </>
        )}

        {/* ── EDUCATION ─────────────────────────────────────────────────────── */}
        {activeSection === "education" && (
          <>
            <h2 className="font-bold text-foreground text-lg mb-2">Education</h2>

            <div>
              <Label className={labelCls}>Current Status</Label>
              <select value={form.currentStatus} onChange={set("currentStatus")} className={inputCls}>
                <option value="">Select status</option>
                {CURRENT_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <Label className={labelCls}>Highest Qualification</Label>
              <select value={form.education} onChange={set("education")} className={inputCls}>
                <option value="">Select qualification</option>
                {QUALIFICATION_OPTIONS.map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>College Name</Label>
                <Input value={form.collegeName} onChange={set("collegeName")} placeholder="COEP Pune" />
              </div>
              <div>
                <Label className={labelCls}>University</Label>
                <Input value={form.university} onChange={set("university")} placeholder="Savitribai Phule" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Degree</Label>
                <Input value={form.degree} onChange={set("degree")} placeholder="B.Tech" />
              </div>
              <div>
                <Label className={labelCls}>Branch / Specialization</Label>
                <Input value={form.branch} onChange={set("branch")} placeholder="Computer Science" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Current Year</Label>
                <select value={form.currentYear} onChange={set("currentYear")} className={inputCls}>
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <Label className={labelCls}>Expected Graduation Year</Label>
                <Input
                  type="number" min={2000} max={2040}
                  value={form.expectedGraduationYear}
                  onChange={set("expectedGraduationYear")}
                  placeholder="2026"
                />
              </div>
            </div>

            <div>
              <Label className={labelCls}>CGPA / Percentage</Label>
              <Input value={form.cgpa} onChange={set("cgpa")} placeholder="8.5 or 85%" />
            </div>
          </>
        )}

        {/* ── CAREER ────────────────────────────────────────────────────────── */}
        {activeSection === "career" && (
          <>
            <h2 className="font-bold text-foreground text-lg mb-2">Career Goal</h2>

            <div>
              <Label className={labelCls}>What best describes your current goal?</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {CAREER_GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, careerGoal: opt, careerTrack: opt }))}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      form.careerGoal === opt
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white hover:border-primary/40"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.careerGoal === opt ? "text-primary" : "text-foreground"}`}>
                      {opt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className={labelCls}>Current Title</Label>
              <Input
                value={form.currentTitle}
                onChange={set("currentTitle")}
                placeholder="e.g. Software Engineering Student"
              />
            </div>
          </>
        )}

        {/* ── EXPERIENCE ────────────────────────────────────────────────────── */}
        {activeSection === "experience" && (
          <>
            <h2 className="font-bold text-foreground text-lg mb-2">Experience</h2>

            <div>
              <Label className={labelCls}>Programming Experience</Label>
              <div className="flex gap-3 mt-1">
                {PROG_EXP_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, programmingExperience: opt }))}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                      form.programmingExperience === opt
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-white text-foreground hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className={labelCls}>Previously Worked?</Label>
              <div className="flex gap-3 mt-1">
                {(["Yes", "No"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBool("previouslyWorked", opt === "Yes")}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                      form.previouslyWorked === (opt === "Yes")
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-white text-foreground hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {form.previouslyWorked && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div>
                  <Label className={labelCls}>Years of Experience</Label>
                  <Input
                    type="number" min={0} max={50}
                    value={form.yearsOfExperience}
                    onChange={set("yearsOfExperience")}
                    placeholder="2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={labelCls}>Current Company</Label>
                    <Input
                      value={form.currentCompany}
                      onChange={set("currentCompany")}
                      placeholder="Infosys"
                    />
                  </div>
                  <div>
                    <Label className={labelCls}>Current Role</Label>
                    <Input
                      value={form.currentRole}
                      onChange={set("currentRole")}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between mt-6">
        <Link href="/profile">
          <Button variant="outline" className="rounded-xl px-6">
            Cancel
          </Button>
        </Link>
        <Button
          className="rounded-xl px-8 py-3 text-base font-medium gap-2"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="button-save-changes"
        >
          {saveMutation.isPending ? (
            "Saving…"
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
