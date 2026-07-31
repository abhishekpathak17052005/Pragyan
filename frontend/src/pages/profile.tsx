import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { aiService } from "@/services/aiService";
import { profileService } from "@/services/profileService";
import {
  CheckCircle2, Circle, MapPin, Pencil,
  FolderOpen, Award, Upload, BarChart2, BadgeCheck,
  Github, Linkedin, Save,
} from "lucide-react";

const GENDER_OPTIONS   = ["Male", "Female", "Non-binary", "Prefer not to say"];
const STATUS_OPTIONS   = ["School Student","Diploma Student","College Student","Graduate","Working Professional","Career Switcher"];
const QUAL_OPTIONS     = ["10th","12th","Diploma","B.Tech","B.E.","BCA","MCA","BSc","M.Tech","MBA","Other"];
const YEAR_OPTIONS     = ["1st","2nd","3rd","4th","Completed"];
const CAREER_OPTIONS   = ["Get Internship","Get Job","Upskill","Career Switch","Higher Studies","Freelancing","Start Startup"];
const PROG_EXP_OPTIONS = ["Beginner","Intermediate","Advanced"];

const iCls = "w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";
const lCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

export default function Profile() {
  const { user, reloadUser } = useAuth();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: recommendations = [] } = useQuery({
    queryKey: ["ai", "recommend-careers"],
    queryFn: aiService.getCareerRecommendations,
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
    retry: false,
  });

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
      currentYear:            pf.currentYear             || undefined,
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
      await queryClient.invalidateQueries({ queryKey: ["ai", "recommend-careers"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({ title: "Profile updated", description: "Your profile changes are live." });
      profileMutation.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const topRecommendation = recommendations[0];
  const careerMatchScore = useMemo(() => Math.round(topRecommendation?.score || 0), [topRecommendation]);

  const githubAccount = user?.linkedAccounts?.find((account) => account.provider === "github");
  const isGitHubLinked = Boolean(githubAccount);
  const githubProfileUrl = githubAccount?.username ? `https://github.com/${githubAccount.username}` : "https://github.com";
  const linkedInUrl = user?.linkedin
    ? user.linkedin.startsWith("http")
      ? user.linkedin
      : `https://${user.linkedin}`
    : undefined;

  const linkGithubMutation = useMutation({
    mutationFn: () => profileService.startProviderLink("github"),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
  });

  const profileChecks = [
    { label: "Basic Information", done: !!user?.fullName },
    { label: "Skills Added", done: (user?.skills?.length || 0) > 0 },
    { label: "Projects Added", done: (profile?.projects?.length || 0) > 0 },
    { label: "Certifications Added", done: (profile?.certifications?.length || 0) > 0 },
    { label: "Resume Uploaded", done: !!user?.resume },
    { label: "Assessments Completed", done: false },
  ];

  const quickActions = [
    { icon: FolderOpen, label: "Add New Project", href: "/profile" },
    { icon: Award, label: "Add Certification", href: "/resources/certificates" },
    { icon: Upload, label: "Upload Resume", href: "/profile" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Profile Overview</h1>
        <p className="text-muted-foreground mt-1">These fields drive matching quality, readiness scoring, and roadmap suggestions.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
            {user?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-xl text-foreground">{user?.fullName || "User"}</h2>
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <BadgeCheck className="w-4 h-4" /> Verified
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Learner</p>
          {user?.location && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-6">
              <MapPin className="w-4 h-4" /> {user.location}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {linkedInUrl ? (
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Linkedin className="w-4 h-4" /> View LinkedIn
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                <Linkedin className="w-4 h-4" /> LinkedIn not added
              </span>
            )}

            <Button
              variant={isGitHubLinked ? "outline" : "default"}
              size="sm"
              onClick={() => isGitHubLinked ? window.open(githubProfileUrl, "_blank") : linkGithubMutation.mutate()}
              disabled={linkGithubMutation.isLoading}
              className="rounded-full"
              data-testid="button-github-link"
            >
              <Github className="w-4 h-4" />
              {isGitHubLinked ? "View GitHub" : "Connect GitHub"}
            </Button>
          </div>

          <button
            onClick={() => document.getElementById("profile-info")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-xl px-6 inline-flex items-center justify-center border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            data-testid="button-edit-profile"
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
          </button>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-8 shadow-sm flex flex-col items-center text-center">
          <h2 className="font-bold text-foreground text-lg mb-4 self-start">Career Match Score</h2>
          <CircularProgress
            value={careerMatchScore}
            size={100}
            strokeWidth={10}
            valueFormatter={() => `${careerMatchScore}%`}
          />
          <p className={`font-bold mt-3 text-lg ${
            careerMatchScore >= 80 ? "text-green-600" : 
            careerMatchScore >= 60 ? "text-amber-600" : 
            "text-red-600"
          }`}>
            {careerMatchScore >= 80 ? "Great Match!" : careerMatchScore >= 60 ? "Good Match" : "Build Skills"}
          </p>
          <div className="flex gap-8 mt-4 pt-4 border-t border-border w-full justify-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target Role</p>
              <p className="font-bold text-sm text-foreground mt-1">{topRecommendation?.career || "Not set"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Career Track</p>
              <p className="font-bold text-sm text-foreground mt-1">{user?.careerTrack || "Not specified"}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground mb-1">Profile Health</h2>
          <p className="text-sm text-muted-foreground mb-4">80% Complete</p>
          <Progress value={80} className="h-2 mb-5" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {profileChecks.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                }
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-7 shadow-sm">
          <h2 className="font-bold text-foreground mb-5">Quick Actions</h2>
          <div className="space-y-1">
            {quickActions.map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group" data-testid={`link-${label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section id="profile-info" className="mt-12 bg-card border border-border rounded-[20px] p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">Update your personal information and career details here.</p>
          </div>
          <Button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isLoading}
            className="rounded-xl px-7"
            data-testid="button-save-profile"
          >
            {profileMutation.isLoading ? "Saving…" : "Save Profile"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" value={pf.firstName} onChange={s("firstName")} className={iCls} />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" value={pf.lastName} onChange={s("lastName")} className={iCls} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={pf.phone} onChange={s("phone")} className={iCls} />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={pf.linkedin} onChange={s("linkedin")} className={iCls} />
            </div>
            <div>
              <Label htmlFor="location-country">Country</Label>
              <Input id="location-country" value={pf.country} onChange={s("country")} className={iCls} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current-status">Current Status</Label>
              <select id="current-status" value={pf.currentStatus} onChange={s("currentStatus")} className={iCls}>
                <option value="">Select status</option>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="education">Highest Qualification</Label>
              <select id="education" value={pf.education} onChange={s("education")} className={iCls}>
                <option value="">Select qualification</option>
                {QUAL_OPTIONS.map((qualification) => <option key={qualification} value={qualification}>{qualification}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="current-title">Current Title</Label>
              <Input id="current-title" value={pf.currentTitle} onChange={s("currentTitle")} className={iCls} />
            </div>
            <div>
              <Label htmlFor="programming-experience">Programming Experience</Label>
              <select id="programming-experience" value={pf.programmingExperience} onChange={s("programmingExperience")} className={iCls}>
                <option value="">Select level</option>
                {PROG_EXP_OPTIONS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="years-of-experience">Years of Experience</Label>
              <Input id="years-of-experience" value={pf.yearsOfExperience} onChange={s("yearsOfExperience")} className={iCls} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <div>
            <Label htmlFor="career-goal">Career Goal</Label>
            <Input id="career-goal" value={pf.careerGoal} onChange={s("careerGoal")} className={iCls} />
          </div>
          <div>
            <Label htmlFor="current-company">Current Company</Label>
            <Input id="current-company" value={pf.currentCompany} onChange={s("currentCompany")} className={iCls} />
          </div>
          <div>
            <Label htmlFor="current-role">Current Role</Label>
            <Input id="current-role" value={pf.currentRole} onChange={s("currentRole")} className={iCls} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" value={pf.gender} onChange={s("gender")} className={iCls}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
