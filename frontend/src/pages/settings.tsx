import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Lock, Palette, Globe, Shield, User,
  Eye, EyeOff, Moon, Sun, Smartphone,
  CheckCircle2, ChevronRight, LogOut, Trash2, Download, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

type Section = "profile" | "notifications" | "privacy" | "appearance" | "account" | "security";

const sections: { id: Section; label: string; icon: typeof Bell }[] = [
  { id: "profile",       label: "Profile",       icon: User    },
  { id: "notifications", label: "Notifications", icon: Bell    },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "privacy",       label: "Privacy",       icon: Eye     },
  { id: "security",      label: "Security",      icon: Lock    },
  { id: "account",       label: "Account",       icon: Shield  },
];

const GENDER_OPTIONS   = ["Male", "Female", "Non-binary", "Prefer not to say"];
const STATUS_OPTIONS   = ["School Student","Diploma Student","College Student","Graduate","Working Professional","Career Switcher"];
const QUAL_OPTIONS     = ["10th","12th","Diploma","B.Tech","B.E.","BCA","MCA","BSc","M.Tech","MBA","Other"];
const YEAR_OPTIONS     = ["1st","2nd","3rd","4th","Completed"];
const CAREER_OPTIONS   = ["Get Internship","Get Job","Upskill","Career Switch","Higher Studies","Freelancing","Start Startup"];
const PROG_EXP_OPTIONS = ["Beginner","Intermediate","Advanced"];

const iCls = "w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";
const lCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} data-testid="toggle"
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-muted-foreground/30"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-6">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-6 first:mt-0 px-1">{children}</h3>;
}

export default function Settings() {
  const { user, reloadUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Profile form state ──────────────────────────────────────────────────────
  const [pf, setPf] = useState({
    firstName: "", lastName: "", age: "", gender: "", phone: "", linkedin: "",
    country: "", state: "", city: "",
    currentStatus: "", education: "", collegeName: "", university: "",
    degree: "", branch: "", currentYear: "", expectedGraduationYear: "", cgpa: "",
    careerGoal: "", currentTitle: "",
    programmingExperience: "", previouslyWorked: false,
    yearsOfExperience: "", currentCompany: "", currentRole: "",
  });

  useEffect(() => {
    if (!user) return;
    setPf({
      firstName:    user.firstName ?? (user.fullName?.split(" ")[0] ?? ""),
      lastName:     user.lastName  ?? (user.fullName?.split(" ").slice(1).join(" ") ?? ""),
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
      currentTitle:           user.currentTitle ?? "",
      programmingExperience:  user.programmingExperience ?? "",
      previouslyWorked:       user.previouslyWorked ?? false,
      yearsOfExperience:      user.yearsOfExperience != null ? String(user.yearsOfExperience) : "",
      currentCompany:         user.currentCompany ?? "",
      currentRole:            user.currentRole ?? "",
    });
  }, [user]);

  const s = (k: keyof typeof pf) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setPf((p) => ({ ...p, [k]: e.target.value }));

  // ── Profile save mutation ───────────────────────────────────────────────────
  const profileMutation = useMutation({
    mutationFn: () => authService.updateProfile({
      firstName:    pf.firstName  || undefined,
      lastName:     pf.lastName   || undefined,
      fullName:     `${pf.firstName} ${pf.lastName}`.trim() || undefined,
      age:          pf.age ? Number(pf.age) : undefined,
      gender:       pf.gender     || undefined,
      phone:        pf.phone      || undefined,
      linkedin:     pf.linkedin   || undefined,
      country:      pf.country    || undefined,
      state:        pf.state      || undefined,
      city:         pf.city       || undefined,
      location:     [pf.city, pf.state, pf.country].filter(Boolean).join(", ") || undefined,
      currentStatus:          pf.currentStatus          || undefined,
      education:              pf.education              || undefined,
      collegeName:            pf.collegeName            || undefined,
      university:             pf.university             || undefined,
      degree:                 pf.degree                 || undefined,
      branch:                 pf.branch                 || undefined,
      currentYear:            pf.currentYear            || undefined,
      expectedGraduationYear: pf.expectedGraduationYear ? Number(pf.expectedGraduationYear) : undefined,
      cgpa:                   pf.cgpa                   || undefined,
      careerGoal:             pf.careerGoal             || undefined,
      careerTrack:            pf.careerGoal             || undefined,
      currentTitle:           pf.currentTitle           || undefined,
      programmingExperience:  pf.programmingExperience  || undefined,
      skillLevel:             pf.programmingExperience  || undefined,
      previouslyWorked:       pf.previouslyWorked,
      experienceType:         pf.previouslyWorked ? "experienced" : "fresher",
      experience:             pf.previouslyWorked ? `${pf.yearsOfExperience || 0} years` : "fresher",
      yearsOfExperience:      pf.yearsOfExperience ? Number(pf.yearsOfExperience) : undefined,
      currentCompany:         pf.currentCompany    || undefined,
      currentRole:            pf.currentRole       || undefined,
    } as any),
    onSuccess: async () => {
      await reloadUser();
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Profile saved!", description: "Changes synchronized across the platform." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Notifications / Appearance / Privacy state ──────────────────────────────
  const [notifs, setNotifs] = useState({
    emailUpdates: true, milestoneAlerts: true, weeklyReport: true,
    aiTips: true, jobAlerts: false, communityDigest: false,
    smsAlerts: false, pushBrowser: true,
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: false, showSkills: true, showCertificates: true,
    shareWithEmployers: false, analyticsTracking: true, showOnLeaderboard: true,
  });
  const [appearance, setAppearance] = useState({
    theme: "light" as "light" | "dark" | "system",
    compactSidebar: false, animationsEnabled: true,
    language: "English", timezone: "Asia/Kolkata (IST)",
  });

  useEffect(() => {
    if (user?.preferences && typeof user.preferences === "object" && !Array.isArray(user.preferences)) {
      setAppearance((p) => ({ ...p, ...(user.preferences as object) }));
    }
  }, [user?.preferences]);

  const prefMutation = useMutation({
    mutationFn: (prefs: object) => authService.updateProfile({ preferences: prefs } as any),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const tn  = <K extends keyof typeof notifs>(k: K)  => setNotifs(p  => ({ ...p, [k]: !p[k] }));
  const tp  = <K extends keyof typeof privacy>(k: K) => setPrivacy(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, preferences, and account settings.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0">
          <nav className="bg-card border border-border rounded-[20px] overflow-hidden shadow-sm">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)} data-testid={`settings-nav-${id}`}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors border-b border-border last:border-0 ${
                  active === id ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-[20px] p-7 shadow-sm">
          {saved && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Changes saved and synchronized across the platform.
            </div>
          )}

          {/* ── PROFILE ──────────────────────────────────────────────────── */}
          {active === "profile" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Profile Information</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Synchronized with your Assessment Engine and visible across the platform.
                Also editable from{" "}
                <Link href="/settings" className="text-primary underline underline-offset-2">Edit Profile</Link>.
              </p>

              <SH>Personal</SH>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label className={lCls}>First Name</Label>
                  <Input value={pf.firstName} onChange={s("firstName")} placeholder="Rahul" className={iCls} /></div>
                <div><Label className={lCls}>Last Name</Label>
                  <Input value={pf.lastName} onChange={s("lastName")} placeholder="Sharma" className={iCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label className={lCls}>Age</Label>
                  <Input type="number" min={13} max={65} value={pf.age} onChange={s("age")} placeholder="21" className={iCls} /></div>
                <div><Label className={lCls}>Gender</Label>
                  <select value={pf.gender} onChange={s("gender")} className={iCls}>
                    <option value="">Select</option>
                    {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label className={lCls}>Phone</Label>
                  <Input value={pf.phone} onChange={s("phone")} placeholder="9876543210" className={iCls} /></div>
                <div><Label className={lCls}>LinkedIn</Label>
                  <Input value={pf.linkedin} onChange={s("linkedin")} placeholder="linkedin.com/in/…" className={iCls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><Label className={lCls}>Country</Label>
                  <Input value={pf.country} onChange={s("country")} placeholder="India" className={iCls} /></div>
                <div><Label className={lCls}>State</Label>
                  <Input value={pf.state} onChange={s("state")} placeholder="Maharashtra" className={iCls} /></div>
                <div><Label className={lCls}>City</Label>
                  <Input value={pf.city} onChange={s("city")} placeholder="Pune" className={iCls} /></div>
              </div>

              <SH>Education</SH>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label className={lCls}>Current Status</Label>
                  <select value={pf.currentStatus} onChange={s("currentStatus")} className={iCls}>
                    <option value="">Select</option>
                    {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select></div>
                <div><Label className={lCls}>Highest Qualification</Label>
                  <select value={pf.education} onChange={s("education")} className={iCls}>
                    <option value="">Select</option>
                    {QUAL_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label className={lCls}>College Name</Label>
                  <Input value={pf.collegeName} onChange={s("collegeName")} placeholder="COEP" className={iCls} /></div>
                <div><Label className={lCls}>University</Label>
                  <Input value={pf.university} onChange={s("university")} placeholder="Savitribai Phule" className={iCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label className={lCls}>Degree</Label>
                  <Input value={pf.degree} onChange={s("degree")} placeholder="B.Tech" className={iCls} /></div>
                <div><Label className={lCls}>Branch</Label>
                  <Input value={pf.branch} onChange={s("branch")} placeholder="Computer Science" className={iCls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div><Label className={lCls}>Year</Label>
                  <select value={pf.currentYear} onChange={s("currentYear")} className={iCls}>
                    <option value="">Select</option>
                    {YEAR_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select></div>
                <div><Label className={lCls}>Graduation Year</Label>
                  <Input type="number" value={pf.expectedGraduationYear} onChange={s("expectedGraduationYear")} placeholder="2026" className={iCls} /></div>
                <div><Label className={lCls}>CGPA / %</Label>
                  <Input value={pf.cgpa} onChange={s("cgpa")} placeholder="8.5" className={iCls} /></div>
              </div>

              <SH>Career Goal</SH>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {CAREER_OPTIONS.map(opt => (
                  <button key={opt} type="button"
                    onClick={() => setPf(p => ({ ...p, careerGoal: opt }))}
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all text-left ${
                      pf.careerGoal === opt ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-foreground hover:border-primary/40"}`}>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <Label className={lCls}>Current Title</Label>
                <Input value={pf.currentTitle} onChange={s("currentTitle")} placeholder="e.g. Software Engineering Student" className={iCls} />
              </div>

              <SH>Experience</SH>
              <div className="mb-4">
                <Label className={lCls}>Programming Experience</Label>
                <div className="flex gap-3 mt-1">
                  {PROG_EXP_OPTIONS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setPf(p => ({ ...p, programmingExperience: opt }))}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                        pf.programmingExperience === opt ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <Label className={lCls}>Previously Worked?</Label>
                <div className="flex gap-3 mt-1">
                  {(["Yes","No"] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setPf(p => ({ ...p, previouslyWorked: opt === "Yes" }))}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                        pf.previouslyWorked === (opt === "Yes") ? "border-primary bg-primary/5 text-primary" : "border-border bg-white hover:border-primary/40"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {pf.previouslyWorked && (
                <div className="grid grid-cols-3 gap-4 mb-6 pl-4 border-l-2 border-primary/20">
                  <div><Label className={lCls}>Years</Label>
                    <Input type="number" value={pf.yearsOfExperience} onChange={s("yearsOfExperience")} placeholder="2" className={iCls} /></div>
                  <div><Label className={lCls}>Company</Label>
                    <Input value={pf.currentCompany} onChange={s("currentCompany")} placeholder="Infosys" className={iCls} /></div>
                  <div><Label className={lCls}>Role</Label>
                    <Input value={pf.currentRole} onChange={s("currentRole")} placeholder="SDE" className={iCls} /></div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => profileMutation.mutate()}
                  disabled={profileMutation.isPending}
                  className="rounded-xl px-8 gap-2" data-testid="button-save-profile">
                  {profileMutation.isPending ? "Saving…" : <><Save className="w-4 h-4" /> Save Profile</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
          {active === "notifications" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose how and when Pragyan AI notifies you.</p>
              <SH>Email</SH>
              <Row label="Career Updates & Tips" desc="Weekly tips based on your roadmap progress."><Toggle on={notifs.emailUpdates} onChange={() => tn("emailUpdates")} /></Row>
              <Row label="Weekly Progress Report" desc="Summary of activity, milestones, and match score."><Toggle on={notifs.weeklyReport} onChange={() => tn("weeklyReport")} /></Row>
              <Row label="Job & Opportunity Alerts" desc="Postings matching your career track."><Toggle on={notifs.jobAlerts} onChange={() => tn("jobAlerts")} /></Row>
              <Row label="Community Digest" desc="Highlights from forums and peer discussions."><Toggle on={notifs.communityDigest} onChange={() => tn("communityDigest")} /></Row>
              <SH>In-App</SH>
              <Row label="Milestone Alerts" desc="Notified when you reach or miss a roadmap milestone."><Toggle on={notifs.milestoneAlerts} onChange={() => tn("milestoneAlerts")} /></Row>
              <Row label="AI Suggestions" desc="Smart nudges when you're off track."><Toggle on={notifs.aiTips} onChange={() => tn("aiTips")} /></Row>
              <Row label="Browser Push" desc="Real-time alerts delivered to your browser."><Toggle on={notifs.pushBrowser} onChange={() => tn("pushBrowser")} /></Row>
              <SH>SMS</SH>
              <Row label="Critical Alerts via SMS" desc="Deadline or milestone reminders via text."><Toggle on={notifs.smsAlerts} onChange={() => tn("smsAlerts")} /></Row>
            </div>
          )}

          {/* ── APPEARANCE ─────────────────────────────────────────────────── */}
          {active === "appearance" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Appearance</h2>
              <p className="text-sm text-muted-foreground mb-6">Customize how the app looks and feels.</p>
              <SH>Theme</SH>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(["light","dark","system"] as const).map(t => (
                  <button key={t} onClick={() => setAppearance(p => ({ ...p, theme: t }))} data-testid={`theme-${t}`}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${appearance.theme === t ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    {t === "light" && <Sun className="w-6 h-6 text-amber-500" />}
                    {t === "dark"  && <Moon className="w-6 h-6 text-primary" />}
                    {t === "system"&& <Smartphone className="w-6 h-6 text-muted-foreground" />}
                    <span className="text-sm font-medium capitalize text-foreground">{t}</span>
                    {appearance.theme === t && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
              <SH>Display</SH>
              <Row label="Compact Sidebar" desc="Reduce sidebar item height for more screen space."><Toggle on={appearance.compactSidebar} onChange={() => setAppearance(p => ({ ...p, compactSidebar: !p.compactSidebar }))} /></Row>
              <Row label="Animations & Transitions" desc="Enable smooth page transitions."><Toggle on={appearance.animationsEnabled} onChange={() => setAppearance(p => ({ ...p, animationsEnabled: !p.animationsEnabled }))} /></Row>
              <SH>Language & Region</SH>
              <Row label="Language">
                <select value={appearance.language} onChange={e => setAppearance(p => ({ ...p, language: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" data-testid="select-language">
                  {["English","Hindi","Marathi","Tamil","Telugu"].map(l => <option key={l}>{l}</option>)}
                </select>
              </Row>
              <Row label="Timezone">
                <select value={appearance.timezone} onChange={e => setAppearance(p => ({ ...p, timezone: e.target.value }))}
                  className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" data-testid="select-timezone">
                  {["Asia/Kolkata (IST)","America/New_York (EST)","Europe/London (GMT)","Asia/Dubai (GST)"].map(z => <option key={z}>{z}</option>)}
                </select>
              </Row>
            </div>
          )}

          {/* ── PRIVACY ────────────────────────────────────────────────────── */}
          {active === "privacy" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Privacy Controls</h2>
              <p className="text-sm text-muted-foreground mb-6">Control what others can see and how your data is used.</p>
              <SH>Profile Visibility</SH>
              <Row label="Public Profile" desc="Allow anyone with a link to view your profile."><Toggle on={privacy.profilePublic} onChange={() => tp("profilePublic")} /></Row>
              <Row label="Show Skills on Profile" desc="Display skill tags publicly."><Toggle on={privacy.showSkills} onChange={() => tp("showSkills")} /></Row>
              <Row label="Show Certificates" desc="Make certifications visible to employers."><Toggle on={privacy.showCertificates} onChange={() => tp("showCertificates")} /></Row>
              <Row label="Appear on Leaderboard" desc="Show progress on the career readiness leaderboard."><Toggle on={privacy.showOnLeaderboard} onChange={() => tp("showOnLeaderboard")} /></Row>
              <SH>Data Usage</SH>
              <Row label="Share Profile with Employers" desc="Allow anonymized profile access for job matching."><Toggle on={privacy.shareWithEmployers} onChange={() => tp("shareWithEmployers")} /></Row>
              <Row label="Analytics & Improvement" desc="Help improve Pragyan AI with anonymized usage data."><Toggle on={privacy.analyticsTracking} onChange={() => tp("analyticsTracking")} /></Row>
              <SH>Data Management</SH>
              <Row label="Download My Data" desc="Export a full copy of your profile and activity.">
                <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2" data-testid="button-download-data">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </Row>
            </div>
          )}

          {/* ── SECURITY ───────────────────────────────────────────────────── */}
          {active === "security" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Security</h2>
              <p className="text-sm text-muted-foreground mb-6">Keep your account secure.</p>
              <SH>Password</SH>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Enter current password"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-11" data-testid="input-current-password" />
                    <button onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-new-password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-confirm-password" />
                </div>
                <Button className="rounded-xl px-6" data-testid="button-update-password">Update Password</Button>
              </div>
              <SH>Two-Factor Authentication</SH>
              <Row label="Enable 2FA" desc="Add an extra layer of security using an authenticator app.">
                <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-setup-2fa">Set Up</Button>
              </Row>
            </div>
          )}

          {/* ── ACCOUNT ────────────────────────────────────────────────────── */}
          {active === "account" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Account</h2>
              <p className="text-sm text-muted-foreground mb-6">Manage your account and integrations.</p>
              <SH>Profile Summary</SH>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-6">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-bold text-foreground">{user?.fullName || "User"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.careerGoal && <p className="text-xs text-primary font-medium mt-0.5">Goal: {user.careerGoal}</p>}
                </div>
                <Link href="/settings" className="ml-auto">
                  <Button variant="outline" size="sm" className="rounded-xl"
                    onClick={() => setActive("profile")}>Edit Profile</Button>
                </Link>
              </div>
              <SH>Integrations</SH>
              {[
                { label: "LinkedIn", desc: "Import your experience and certifications.", connected: false },
                { label: "GitHub",   desc: "Showcase your repositories and coding activity.", connected: true  },
                { label: "Google Calendar", desc: "Sync roadmap milestones and study schedule.", connected: false },
              ].map(({ label, desc, connected }) => (
                <Row key={label} label={label} desc={desc}>
                  <Button variant={connected ? "outline" : "default"} size="sm" className="rounded-xl"
                    data-testid={`button-${connected ? "disconnect" : "connect"}-${label.toLowerCase()}`}>
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </Row>
              ))}
              <SH>Danger Zone</SH>
              <div className="border border-destructive/30 rounded-xl p-5 space-y-4 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2"><LogOut className="w-4 h-4 text-destructive" /> Sign Out of All Devices</p>
                    <p className="text-xs text-muted-foreground mt-0.5">This will end all active sessions.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" data-testid="button-signout-all">Sign Out All</Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-destructive/20">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete account and all data. Cannot be undone.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10" data-testid="button-delete-account">Delete Account</Button>
                </div>
              </div>
            </div>
          )}

          {/* Generic save for notifications/appearance/privacy */}
          {active !== "profile" && active !== "account" && active !== "security" && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <p className={`text-sm font-medium transition-all ${saved ? "text-green-600 opacity-100" : "opacity-0"}`}>
                <CheckCircle2 className="w-4 h-4 inline mr-1.5" /> Saved
              </p>
              <Button onClick={() => prefMutation.mutate(appearance)} className="rounded-xl px-7"
                disabled={prefMutation.isPending} data-testid="button-save-settings">
                {prefMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
