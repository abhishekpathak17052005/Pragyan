import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUrlState, useScrollToElement } from '@/hooks/useUrlState';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import type { CareerRoadmap, CareerRoadmapSummary } from '@/types/api';
import { 
  RoadmapHeaderSkeleton, 
  ModuleListSkeleton 
} from '@/components/skeletons/RoadmapSkeleton';
import { NoRoadmapContent } from '@/components/empty-states/EmptyStates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock } from 'lucide-react';
import { HeroSection, JourneyTimeline, ProgressSidebar } from '@/components/learning';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function calculateCareerStats(career?: CareerRoadmap | null) {
  if (!career) {
    return { modules: 0, weeks: 0, days: 0, topics: 0, resources: 0, progress: 0, xp: 0, streak: 0 };
  }

  const modules = career.modules ?? [];
  let totalTopics = 0, completedTopics = 0;

  modules.forEach(module => {
    module.weeks?.forEach(week => {
      week.days?.forEach(day => {
        day.topics?.forEach(topic => {
          totalTopics += 1;
          const resources = (topic as any).resources || [];
          const completed = resources.filter((r: any) => r.completed).length;
          if (resources.length > 0 && completed === resources.length) {
            completedTopics += 1;
          }
        });
      });
    });
  });

  const totalWeeks = modules.reduce((sum, m) => sum + (m.weeks?.length ?? 0), 0);
  const totalDays = modules.reduce((sum, m) => sum + (m.weeks?.reduce((s, w) => s + (w.days?.length ?? 0), 0) ?? 0), 0);
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const xp = completedTopics * 100; // 100 XP per completed topic
  const streak = Math.floor(completedTopics / 5); // 1 streak per 5 completed topics

  return { 
    modules: modules.length, 
    weeks: totalWeeks, 
    days: totalDays, 
    topics: totalTopics, 
    resources: 0, 
    progress,
    xp,
    streak,
  };
}

export default function Roadmap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState('');
  const urlState = useUrlState();
  useScrollToElement(urlState.resourceId);

  const { data: careersData, isLoading: careersLoading } = useQuery({
    queryKey: ['published-career-roadmaps'],
    queryFn: async () => {
      const all = await careerRoadmapService.listCareers();
      return all.filter(c => c.status === 'published');
    },
    retry: false,
  });

  const careers = useMemo(() => careersData ?? [], [careersData]);

  const effectiveSelectedSlug = selectedSlug || (user?.careerTrack ? slugify(user.careerTrack) : careers[0]?.slug) || '';

  const activeCareer = useMemo(() => {
    return careers.find((career) => career.slug === effectiveSelectedSlug) || careers[0] || null;
  }, [careers, effectiveSelectedSlug]);

  const careerQuery = useQuery({
    queryKey: ['career-roadmap-progress', activeCareer?.id],
    queryFn: () => {
      if (!activeCareer?.id) return Promise.resolve(null);
      if (activeCareer.status !== 'published') return Promise.resolve(null);
      return careerRoadmapService.getCareerWithProgress(activeCareer.id);
    },
    enabled: Boolean(activeCareer?.id && activeCareer.status === 'published'),
    retry: false,
  });

  const completeResourceMutation = useMutation({
    mutationFn: (resourceId: string) => careerRoadmapService.completeResource(resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-roadmap-progress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleResourceComplete = useCallback((resourceId: string) => {
    completeResourceMutation.mutate(resourceId);
  }, [completeResourceMutation]);

  const career = careerQuery.data ?? null;
  const stats = calculateCareerStats(career);
  const hasRoadmap = Boolean(career?.modules?.length && career.modules.some((m: any) => (m.weeks?.length ?? 0) > 0));

  if (careersLoading || careerQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <RoadmapHeaderSkeleton />
          <div className="mt-8">
            <ModuleListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!hasRoadmap) {
    return (
      <NoRoadmapContent
        careerGoal={activeCareer?.title || activeCareer?.name || user?.careerTrack || 'your career'}
      />
    );
  }

  const handleContinueLearning = () => {
    // Scroll to first incomplete lesson
    const firstIncomplete = document.querySelector('[data-state="current"]');
    firstIncomplete?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section */}
        {hasRoadmap && career && (
          <HeroSection
            career={career}
            progress={stats.progress}
            xp={stats.xp}
            streak={stats.streak}
            onContinue={handleContinueLearning}
          />
        )}

        {/* Career Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">
            Select Your Learning Path
          </label>
          <Select value={selectedSlug} onValueChange={setSelectedSlug}>
            <SelectTrigger className="h-12 rounded-xl text-base border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:bg-slate-700 dark:text-white">
              <SelectValue placeholder="Choose a career path" />
            </SelectTrigger>
            <SelectContent>
              {careers.map((careerOption: CareerRoadmapSummary) => (
                <SelectItem key={careerOption.slug} value={careerOption.slug}>
                  {careerOption.title || careerOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Main Content Grid */}
        {hasRoadmap && career?.modules ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Journey Timeline - Main Content */}
            <div className="lg:col-span-3">
              <JourneyTimeline
                career={career}
                onLessonClick={(lessonId) => {
                  console.log('Lesson clicked:', lessonId);
                  // Handle lesson click - could navigate to lesson detail page
                }}
              />
            </div>

            {/* Progress Sidebar */}
            <ProgressSidebar
              currentLevel={Math.floor(stats.xp / 1000) + 1}
              totalXp={stats.xp}
              streak={stats.streak}
              currentWeek={Math.ceil(stats.topics / 7) || 1}
              currentDay={Math.ceil((stats.topics % 7) || 1)}
              dailyGoal={{ lessons: 1, xp: 100 }}
              achievements={[
                { id: '1', title: 'First Steps', icon: '🚀', unlockedAt: new Date() },
                { id: '2', title: 'Week One', icon: '⭐', unlockedAt: new Date(Date.now() - 86400000) },
              ]}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              No Learning Path Selected
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto text-lg">
              Choose a career path above to start your personalized learning journey. Get ready to transform your skills!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
