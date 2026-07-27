import { FormEvent, useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Eye, Github, LockKeyhole, Mail, Sparkles, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "signin" | "signup";

/**
 * Role-based redirect map
 * After login, users are redirected to their role-specific dashboard
 */
const ROLE_REDIRECTS: Record<string, string> = {
  STUDENT: "/dashboard",
  RECRUITER: "/company/dashboard",
  PLACEMENT_OFFICER: "/placement/dashboard",
  ADMIN: "/admin/dashboard",
};

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, userRole } = useAuth();
  
  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const redirectUrl = ROLE_REDIRECTS[userRole] || "/home";
      navigate(redirectUrl);
    }
  }, [isAuthenticated, userRole, navigate]);

  const initialMode = useMemo<AuthMode>(() => {
    return location.includes("mode=signup") || location.includes("signup")
      ? "signup"
      : "signin";
  }, [location]);
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { login, register } = useAuth();
  const { data: authConfig } = useQuery({
    queryKey: ["auth-config"],
    queryFn: authService.getConfig,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const fullName = String(formData.get("fullName") || "");
    const role = String(formData.get("role") || "STUDENT");
    const collegeCode = String(formData.get("collegeCode") || "");

    console.log("===== FORM SUBMIT DEBUG =====");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Password length:", password.length);
    console.log("Role:", role);
    console.log("Full form data:", { email, password, fullName, role, collegeCode });
    console.log("=============================");

    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        // Validate password match
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setSubmitting(false);
          return;
        }

        // Build register request with all required fields
        const registerData: any = {
          fullName,
          email,
          password,
          confirmPassword,
          role,
        };

        // Add collegeCode if student
        if (role === "STUDENT" && collegeCode) {
          registerData.collegeCode = collegeCode;
        }

        const response = await authService.register(registerData);
        // After signup, user needs to verify email before login
        // Show success message and switch to login mode
        setMode("signin");
        setError(""); // Clear any errors
      } else {
        console.log("Calling AuthContext.login with:", { email, password });
        const response = await login({ email, password });
        console.log("LOGIN RESPONSE:", response);
        // Auto-redirect based on role
        const userRole = response.user?.role || role;
        const redirectUrl = ROLE_REDIRECTS[userRole] || "/home";
        navigate(redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Left Side - Hero Section */}
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-10" style={{ backgroundColor: "#0F172A" }}>
        {/* Background gradient matching template */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1D1B5E] to-[#0F172A]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div 
              className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Pragyan AI</span>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Your Career Guide</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
            🚀 CAREER INTELLIGENCE
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
            Build the path before choosing the destination
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "#94A3B8" }}>
            Get personalized career recommendations, AI assessments, and custom learning roadmaps designed for your success.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: "🎯", title: "Assess", desc: "AI-powered assessment" },
            { icon: "💡", title: "Match", desc: "Career recommendations" },
            { icon: "🚀", title: "Grow", desc: "Personalized roadmap" }
          ].map((item) => (
            <div key={item.title} className="rounded-lg p-4 transition-all hover:scale-105" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-bold text-white text-sm">{item.title}</p>
              <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Right Side - Auth Form */}
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8" style={{ backgroundColor: "#F7F8FC" }}>
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden justify-center">
            <div 
              className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Pragyan AI</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-semibold" style={{ color: "#7666F6" }}>
              {isSignup ? "Get Started" : "Welcome Back"}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4x1 font-bold tracking-tight text-foreground">
              {isSignup ? "Create Your Account" : "Sign In"}
            </h2>
            <p className="mt-4 text-sm" style={{ color: "#94A3B8" }}>
              {isSignup
                ? "Join thousands of students discovering their ideal career path."
                : "Continue to your personalized career dashboard."}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-8 inline-flex gap-1 rounded-xl p-1 backdrop-blur" style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)" }}>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg px-25 py-2.5 text-sm font-semibold transition-all ${
                !isSignup 
                  ? "text-white" 
                  : "text-foreground hover:text-foreground"
              }`}
              style={!isSignup ? { background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" } : {}}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg px-25 py-2.5 text-sm font-semibold transition-all ${
                isSignup 
                  ? "text-white" 
                  : "text-foreground hover:text-foreground"
              }`}
              style={isSignup ? { background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" } : {}}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-foreground">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                    <Input 
                      name="fullName" 
                      className="h-12 pl-11 rounded-lg" 
                      style={{ borderColor: "#E2E8F0", "--tw-ring-color": "#7666F6" }}
                      placeholder="John Doe" 
                      required 
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-foreground">Role</span>
                  <select
                    name="role"
                    className="h-12 w-full rounded-lg px-3.5 py-2 text-sm font-medium transition-all"
                    style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="STUDENT">Student</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="PLACEMENT_OFFICER">Placement Officer</option>
                  </select>
                </label>

                {/* College code for students */}
                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-foreground">College Code</span>
                  <Input 
                    name="collegeCode" 
                    className="h-12 rounded-lg" 
                    style={{ borderColor: "#E2E8F0", "--tw-ring-color": "#7666F6" }}
                    placeholder="e.g., IIT001" 
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="mb-2.5 block text-sm font-semibold text-foreground">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <Input 
                  name="email" 
                  className="h-12 pl-11 rounded-lg" 
                  style={{ borderColor: "#E2E8F0", "--tw-ring-color": "#7666F6" }}
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2.5 block text-sm font-semibold text-foreground">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <Input 
                  name="password" 
                  className="h-12 pl-11 pr-11 rounded-lg" 
                  style={{ borderColor: "#E2E8F0", "--tw-ring-color": "#7666F6" }}
                  type="password" 
                  placeholder="Enter your password" 
                  required 
                />
                <Eye className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer transition-colors" style={{ color: "#94A3B8" }} />
              </div>
            </label>

            {isSignup && (
              <label className="block">
                <span className="mb-2.5 block text-sm font-semibold text-foreground">Confirm Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                  <Input 
                    name="confirmPassword" 
                    className="h-12 pl-11 pr-11 rounded-lg" 
                    style={{ borderColor: "#E2E8F0", "--tw-ring-color": "#7666F6" }}
                    type="password" 
                    placeholder="Confirm your password" 
                    required 
                  />
                  <Eye className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer transition-colors" style={{ color: "#94A3B8" }} />
                </div>
              </label>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer transition-colors" style={{ color: "#94A3B8" }}>
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded transition-all"
                    style={{ borderColor: "#E2E8F0", accentColor: "#7666F6" }}
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-sm font-semibold transition-colors" style={{ color: "#7666F6" }}>
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-6 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* OAuth Buttons */}
          {(authConfig?.googleEnabled || authConfig?.githubEnabled) && (
            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: "1px solid #E2E8F0" }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ background: "#F7F8FC", color: "#94A3B8" }}>Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {authConfig?.googleEnabled && (
                  <button
                    type="button"
                    onClick={() => { window.location.href = authConfig.googleLoginUrl; }}
                    className="h-11 rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-gray-100"
                    style={{ border: "1px solid #E2E8F0", background: "#FFFFFF" }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </div>
                  </button>
                )}
                {authConfig?.githubEnabled && (
                  <button
                    type="button"
                    onClick={() => { window.location.href = authConfig.githubLoginUrl; }}
                    className="h-11 rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-gray-100"
                    style={{ border: "1px solid #E2E8F0", background: "#FFFFFF" }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Github className="h-5 w-5" />
                      GitHub
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sign In/Up Toggle */}
          <p className="mt-8 text-center text-sm" style={{ color: "#94A3B8" }}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
              className="font-semibold transition-colors"
              style={{ color: "#7666F6" }}
            >
              {isSignup ? "Sign in here" : "Create account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
