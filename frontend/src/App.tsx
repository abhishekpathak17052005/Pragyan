import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import AuthSuccess from "@/pages/auth-success";
import ForgotPassword from "@/pages/forgot-password";
import Home from "@/pages/home";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Assessments = lazy(() => import("@/pages/assessments"));
const Resources = lazy(() => import("@/pages/resources"));
const Certificates = lazy(() => import("@/pages/certificates"));
const Profile = lazy(() => import("@/pages/profile"));
const Skills = lazy(() => import("@/pages/skills"));
const Information = lazy(() => import("@/pages/information"));
const EditInformation = lazy(() => import("@/pages/edit-information"));
const CareerReadiness = lazy(() => import("@/pages/career-readiness"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const CareerDiscovery = lazy(() => import("@/pages/career-discovery"));
const AICounselor = lazy(() => import("@/pages/ai-counselor"));
const AdminRoadmapManager = lazy(() => import("@/pages/admin-roadmap-builder-simple"));
const SettingsPage = lazy(() => import("@/pages/settings"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading page...
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth/success" component={AuthSuccess} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route>
        <RequireAuth>
          <Layout>
            <Suspense fallback={<RouteFallback />}>
              <Switch>
                <Route path="/home" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/assessments" component={Assessments} />
                <Route path="/resources" component={Resources} />
                <Route path="/resources/certificates" component={Certificates} />
                <Route path="/profile" component={Profile} />
                <Route path="/profile/skills" component={Skills} />
                <Route path="/information" component={Information} />
                <Route path="/information/edit" component={EditInformation} />
                <Route path="/information/career-readiness" component={CareerReadiness} />

                <Route path="/career-discovery" component={CareerDiscovery} />
                <Route path="/ai-counselor" component={AICounselor} />
                <Route path="/roadmap" component={Roadmap} />
                <Route path="/admin/roadmaps" component={AdminRoadmapManager} />
                <Route path="/settings" component={SettingsPage} />

                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </Layout>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
