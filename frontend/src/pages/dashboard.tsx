import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Flame, Zap, BookOpen, ArrowRight, 
  ChevronRight, Target, AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { careerRoadmapService } from "@/services/careerRoadmapService";
import { findNextIncompleteResource } from "@/services/nextResourceService";
import { 
  DashboardHeaderSkeleton, 
  ContinueLearningSkeleton,
  StatWidgetSkeleton,
  QuickActionsSkeleton
} from "@/components/skeletons/DashboardSkeleton";
import { NoCareerSelected, NoProgressYet } from "@/components/empty-states/EmptyStates";
import { GamificationStatsGrid } from "@/components/gamification/GamificationCards";

function getFirstName(fullName?: string | null) {
  const source = fullName?.trim() || "there";
  return source.split(/\s+/)[0];
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch unified dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: careerRoadmapService.getDashboard,
    retry: false,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Also fetch the roadmap with progress to find next resource
  const { data: roadmapData } = useQuery({
    queryKey: ['career-roadmap-progress', dashboard?.currentCareer?.id],
    queryFn: () => {
      if (!dashboard?.currentCareer?.id) return null;
      return careerRoadmapService.getCareerWithProgress(dashboard.currentCareer.id);
    },
    enabled: Boolean(dashboard?.currentCareer?.id),
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const firstName = useMemo(() => getFirstName(user?.fullName), [user?.fullName]);

  // Find next incomplete resource for smart continue link
  const nextResource = useMemo(() => {
    return findNextIncompleteResource(roadmapData);
  }, [roadmapData]);

  // Build continue learning href with auto-expand params
  const continueHref = useMemo(() => {
    if (!nextResource) return '/roadmap';
    const params = new URLSearchParams({
      moduleId: nextResource.moduleId,
      weekId: nextResource.weekId,
      dayId: nextResource.dayId,
      topicId: nextResource.topicId,
      resourceId: nextResource.resourceId,
    });
    return `/roadmap?${params.toString()}`;
  }, [nextResource]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <DashboardHeaderSkeleton />
          
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <ContinueLearningSkeleton />
            </div>
            <div className="space-y-4">
              <StatWidgetSkeleton />
              <StatWidgetSkeleton />
              <StatWidgetSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasCareer = !!dashboard?.currentCareer;
  
  if (!hasCareer && !isLoading) {
    return <NoCareerSelected />;
  }

  const progress = dashboard?.overallProgress || 0;
  const weekProgress = dashboard?.weeklyProgress || 0;
  const todayCompleted = dashboard?.completedToday || 0;
  const todayGoal = dashboard?.todayGoal || 2;
  const xp = dashboard?.xp || 0;
  const streak = dashboard?.streak || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              👋 Welcome back, {firstName}
            </h1>
            <p className="text-slate-600 mt-2">Let's continue your learning journey</p>
          </div>
        </div>

        {/* Main Content - Two Column */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left Column - Continue Learning */}
          <div className="col-span-2 space-y-6">
            
            {/* Continue Learning Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Continue Learning</h2>
              
              {hasCareer ? (
                <div className="space-y-6">
                  {/* Career Path */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Current Path</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                          {dashboard.currentCareer.title}
                        </h3>
                      </div>
                      <Link href={continueHref}>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                          Resume <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Current Position */}
                  {dashboard.currentWeek && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-3">Where You Are</p>
                      <div className="flex items-center gap-6">
                        {dashboard.currentWeek && (
                          <div>
                            <p className="text-sm text-slate-600">Week {dashboard.currentWeek.number}</p>
                            <p className="font-semibold text-slate-900">{dashboard.currentWeek.title}</p>
                          </div>
                        )}
                        <div className="w-0.5 h-8 bg-slate-300"></div>
                        {dashboard.currentDay && (
                          <div>
                            <p className="text-sm text-slate-600">Day {dashboard.currentDay.dayNumber}</p>
                            <p className="font-semibold text-slate-900">{dashboard.currentDay.title}</p>
                          </div>
                        )}
                        {dashboard.currentTopic && (
                          <>
                            <div className="w-0.5 h-8 bg-slate-300"></div>
                            <div>
                              <p className="text-sm text-slate-600">Topic</p>
                              <p className="font-semibold text-slate-900">{dashboard.currentTopic.title}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">Overall Progress</p>
                        <p className="text-sm font-bold text-slate-900">{Math.round(progress)}%</p>
                      </div>
                      <Progress value={progress} className="h-3 bg-slate-200" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">This Week</p>
                        <p className="text-sm font-bold text-slate-900">{Math.round(weekProgress)}%</p>
                      </div>
                      <Progress value={weekProgress} className="h-3 bg-slate-200" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No learning path started yet</p>
                  <Link href="/careers">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                      Explore Careers <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Today's Goal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Today's Goal
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-2">Target</p>
                  <p className="text-3xl font-bold text-amber-900">{todayGoal}</p>
                  <p className="text-sm text-amber-700 mt-1">Resources</p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-2">Completed</p>
                  <p className="text-3xl font-bold text-emerald-900">{todayCompleted}</p>
                  <p className="text-sm text-emerald-700 mt-1">Resources</p>
                </div>

                <div className="bg-slate-100 rounded-xl p-6 border border-slate-300">
                  <p className="text-xs text-slate-700 font-medium uppercase tracking-wide mb-2">Remaining</p>
                  <p className="text-3xl font-bold text-slate-900">{Math.max(0, todayGoal - todayCompleted)}</p>
                  <p className="text-sm text-slate-700 mt-1">Resources</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="relative bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (todayCompleted / todayGoal) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center">
                  {todayCompleted >= todayGoal ? "🎉 Great job! You've completed today's goal!" : `${Math.max(0, todayGoal - todayCompleted)} more to go!`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Gamification Stats */}
          <div className="col-span-1">
            <GamificationStatsGrid 
              streak={streak}
              xp={xp}
              level={Math.floor(xp / 500) + 1}
              badges={[]}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
