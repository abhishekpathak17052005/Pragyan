import { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUrlState, useScrollToElement } from '@/hooks/useUrlState';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import { findNextIncompleteResource } from '@/services/nextResourceService';
import type { CareerResource, CareerRoadmap, CareerRoadmapSummary } from '@/types/api';
import { 
  RoadmapHeaderSkeleton, 
  ModuleListSkeleton 
} from '@/components/skeletons/RoadmapSkeleton';
import { NoRoadmapContent } from '@/components/empty-states/EmptyStates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, BookOpen, PlayCircle, FileText, Target, Rocket, ClipboardCheck, BookMarked, NotebookPen, Loader2, ChevronRight, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

const resourceMeta: Record<string, { label: string; icon: typeof BookOpen; badge: string; accent: string; color: string }> = {
  DOCUMENTATION: { label: 'Documentation', icon: BookOpen, badge: 'bg-sky-100 text-sky-700', accent: 'text-sky-700', color: 'sky' },
  VIDEO: { label: 'Video', icon: PlayCircle, badge: 'bg-rose-100 text-rose-700', accent: 'text-rose-700', color: 'rose' },
  NOTES: { label: 'Notes', icon: FileText, badge: 'bg-amber-100 text-amber-700', accent: 'text-amber-700', color: 'amber' },
  PRACTICE: { label: 'Practice', icon: ClipboardCheck, badge: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-700', color: 'emerald' },
  ARTICLE: { label: 'Article', icon: NotebookPen, badge: 'bg-violet-100 text-violet-700', accent: 'text-violet-700', color: 'violet' },
  CHEATSHEET: { label: 'Cheatsheet', icon: BookMarked, badge: 'bg-zinc-100 text-zinc-700', accent: 'text-zinc-700', color: 'zinc' },
  BOOK: { label: 'Book', icon: BookOpen, badge: 'bg-orange-100 text-orange-700', accent: 'text-orange-700', color: 'orange' },
  PROJECT: { label: 'Project', icon: Rocket, badge: 'bg-fuchsia-100 text-fuchsia-700', accent: 'text-fuchsia-700', color: 'fuchsia' },
  MINI_PROJECT: { label: 'Mini Project', icon: Rocket, badge: 'bg-pink-100 text-pink-700', accent: 'text-pink-700', color: 'pink' },
  ASSIGNMENT: { label: 'Assignment', icon: ClipboardCheck, badge: 'bg-green-100 text-green-700', accent: 'text-green-700', color: 'green' },
  INTERVIEW_QUESTION: { label: 'Interview', icon: Target, badge: 'bg-slate-100 text-slate-700', accent: 'text-slate-700', color: 'slate' },
  CERTIFICATION: { label: 'Certification', icon: BookOpen, badge: 'bg-purple-100 text-purple-700', accent: 'text-purple-700', color: 'purple' },
  REFERENCE: { label: 'Reference', icon: FileText, badge: 'bg-gray-100 text-gray-700', accent: 'text-gray-700', color: 'gray' },
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function safeOpen(url?: string | null) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

const COLLAPSED_MODULE_ID = '__collapsed__';

function calculateCareerStats(career?: CareerRoadmap | null) {
  if (!career) {
    return { modules: 0, weeks: 0, days: 0, topics: 0, resources: 0, progress: 0 };
  }

  const modules = career.modules ?? [];
  let totalTopics = 0, completedTopics = 0;

  modules.forEach(module => {
    module.weeks?.forEach(week => {
      week.days?.forEach(day => {
        day.topics?.forEach(topic => {
          totalTopics += 1;
          if ((topic as any).topicCompleted) completedTopics += 1;
        });
      });
    });
  });

  const totalWeeks = modules.reduce((sum, m) => sum + (m.weeks?.length ?? 0), 0);
  const totalDays = modules.reduce((sum, m) => sum + (m.weeks?.reduce((s, w) => s + (w.days?.length ?? 0), 0) ?? 0), 0);
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return { modules: modules.length, weeks: totalWeeks, days: totalDays, topics: totalTopics, resources: 0, progress };
}

// Memoized Resource Card
const ResourceCard = memo(function ResourceCard({ 
  resource, 
  onComplete, 
  isCompleted 
}: { 
  resource: CareerResource
  onComplete: (resourceId: string) => void
  isCompleted?: boolean 
}) {
  const meta = resourceMeta[resource.type] ?? resourceMeta.DOCUMENTATION;
  const Icon = meta.icon;
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      await onComplete(resource.id);
    } finally {
      setIsLoading(false);
    }
  }, [resource.id, onComplete]);

  return (
    <div className={`group rounded-xl border transition-all p-4 ${
      isCompleted 
        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 text-sm leading-snug">{resource.title}</h4>
            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-600 mb-2">{resource.provider}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {resource.difficulty && (
              <Badge variant="outline" className="text-xs">{resource.difficulty}</Badge>
            )}
            {resource.language && (
              <Badge variant="outline" className="text-xs">{resource.language}</Badge>
            )}
            <Badge variant="outline" className="text-xs">{resource.free === false ? 'Paid' : 'Free'}</Badge>
            {resource.verified && (
              <Badge className="text-xs bg-emerald-100 text-emerald-700">Verified</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button 
          type="button"
          size="sm" 
          variant="outline"
          className="flex-1 h-9 rounded-lg text-sm"
          onClick={() => safeOpen(resource.url)}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          Open
        </Button>
        {!isCompleted && (
          <Button 
            type="button"
            size="sm"
            className="flex-1 h-9 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? 'Marking...' : '✓ Complete'}
          </Button>
        )}
      </div>
    </div>
  );
});

// Memoized Topic Card
const TopicCard = memo(function TopicCard({ 
  topic, 
  onResourceComplete
}: { 
  topic: any
  onResourceComplete?: (resourceId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const completedResources = (topic.resources || []).filter((r: any) => r.completed).length;
  const totalResources = topic.resources?.length ?? 0;
  const topicPercent = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;
  const isComplete = topicPercent === 100 && totalResources > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <h4 className="font-semibold text-slate-900">{topic.title}</h4>
          {topic.objective && (
            <p className="text-xs text-slate-600 mt-1">{topic.objective}</p>
          )}
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <p className="text-xs text-slate-600">Progress</p>
            <p className="font-semibold text-slate-900">{topicPercent}%</p>
          </div>
          {isComplete && (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
          <Progress value={topicPercent} className="h-2" />
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(topic.resources || []).map((resource: CareerResource) => (
              <ResourceCard 
                key={resource.id}
                resource={resource}
                onComplete={onResourceComplete || (() => {})}
                isCompleted={(resource as any).completed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Memoized Day Card
const DayCard = memo(function DayCard({ 
  day, 
  onResourceComplete
}: { 
  day: any
  onResourceComplete?: (resourceId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const completedTopics = (day.topics || []).filter((t: any) => {
    const completed = (t.resources || []).filter((r: any) => r.completed).length;
    const total = t.resources?.length ?? 0;
    return total > 0 && completed === total;
  }).length;
  const totalTopics = day.topics?.length ?? 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <p className="text-xs text-slate-600 font-medium">Day {day.order + 1}</p>
          <h3 className="font-semibold text-slate-900">{day.title}</h3>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Badge variant="outline" className="text-xs">{completedTopics}/{totalTopics} topics</Badge>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
          {(day.topics || []).map((topic: any) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onResourceComplete={onResourceComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Memoized Week Card
const WeekCard = memo(function WeekCard({ 
  week,
  onResourceComplete
}: { 
  week: any
  onResourceComplete?: (resourceId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const completedDays = (week.days || []).filter((d: any) => {
    const dayTopics = d.topics || [];
    return dayTopics.length > 0 && dayTopics.every((t: any) => {
      const resources = t.resources || [];
      return resources.length > 0 && resources.every((r: any) => r.completed);
    });
  }).length;
  const totalDays = week.days?.length ?? 0;
  const weekPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Week {week.order + 1}</p>
          <h3 className="font-semibold text-slate-900 text-lg mt-1">{week.title}</h3>
          <Progress value={weekPercent} className="h-1.5 mt-2 w-32" />
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <p className="text-xs text-slate-600">{completedDays}/{totalDays} days</p>
            <p className="font-semibold text-slate-900">{weekPercent}%</p>
          </div>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
          {(week.days || []).map((day: any) => (
            <DayCard
              key={day.id}
              day={day}
              onResourceComplete={onResourceComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Memoized Module Card
const ModuleCard = memo(function ModuleCard({ 
  module, 
  onResourceComplete,
  isExpanded,
  onExpand
}: { 
  module: any
  onResourceComplete?: (resourceId: string) => void
  isExpanded?: boolean
  onExpand?: (moduleId: string) => void
}) {
  const completedWeeks = (module.weeks || []).filter((w: any) => {
    const weekDays = w.days || [];
    return weekDays.length > 0 && weekDays.every((d: any) => {
      const dayTopics = d.topics || [];
      return dayTopics.length > 0 && dayTopics.every((t: any) => {
        const resources = t.resources || [];
        return resources.length > 0 && resources.every((r: any) => r.completed);
      });
    });
  }).length;
  const totalWeeks = module.weeks?.length ?? 0;
  const modulePercent = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
  const isModuleComplete = modulePercent === 100 && totalWeeks > 0;

  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => onExpand?.(module.id)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1">
          <p className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Module {module.order + 1}</p>
          <h2 className="font-bold text-slate-900 text-xl mt-1">{module.title}</h2>
          {module.description && (
            <p className="text-sm text-slate-600 mt-2">{module.description}</p>
          )}
          <Progress value={modulePercent} className="h-2 mt-3 w-48" />
        </div>
        <div className="flex items-center gap-4 ml-6">
          <div className="text-right">
            <p className="text-sm text-slate-600 font-medium">{completedWeeks}/{totalWeeks} weeks</p>
            <p className="text-2xl font-bold text-slate-900">{modulePercent}%</p>
          </div>
          {isModuleComplete && (
            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-6 w-6 text-slate-400" />
          ) : (
            <ChevronRight className="h-6 w-6 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {(module.weeks || []).map((week: any) => (
            <WeekCard
              key={week.id}
              week={week}
              onResourceComplete={onResourceComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function Roadmap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState('');
  const urlState = useUrlState();
  useScrollToElement(urlState.resourceId);

  const [expandedModuleId, setExpandedModuleId] = useState('');

  const { data: careersData, isLoading: careersLoading } = useQuery({
    queryKey: ['published-career-roadmaps'],
    queryFn: async () => {
      const all = await careerRoadmapService.listCareers();
      // Only return published careers
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
      // Only fetch if career is published
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

  const effectiveExpandedModuleId = expandedModuleId || urlState.moduleId || '';

  const handleModuleExpand = useCallback((moduleId: string) => {
    setExpandedModuleId(effectiveExpandedModuleId === moduleId ? COLLAPSED_MODULE_ID : moduleId);
  }, [effectiveExpandedModuleId]);

  const career = careerQuery.data ?? null;
  const stats = calculateCareerStats(career);
  const hasRoadmap = Boolean(career?.modules?.length && career.modules.some((m: any) => (m.weeks?.length ?? 0) > 0));

  if (careersLoading || careerQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
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

  if (careerQuery.isLoading || careersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Career Header */}
        {hasRoadmap && career && (
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide mb-2">Learning Path</p>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">{career.title}</h1>
                <p className="text-blue-100 text-lg leading-relaxed">{career.description}</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Overall Progress</p>
                  <div className="flex items-end gap-2 mb-2">
                    <p className="text-4xl font-bold text-white">{stats.progress}%</p>
                  </div>
                  <Progress value={stats.progress} className="h-2 bg-blue-400" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-blue-100 text-xs font-medium">Modules</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.modules}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-blue-100 text-xs font-medium">Topics</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.topics}</p>
                  </div>
                </div>

                <Button type="button" className="w-full bg-white text-blue-600 hover:bg-slate-100 font-semibold h-11">
                  Continue Learning
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Career Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-slate-900 mb-3">Select Learning Path</label>
          <Select value={selectedSlug} onValueChange={setSelectedSlug}>
            <SelectTrigger className="h-11 rounded-lg">
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
        </div>

        {/* Modules */}
        {hasRoadmap && career?.modules ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Your Learning Journey</h2>
              <p className="text-sm text-slate-600">{stats.modules} Modules • {stats.topics} Topics</p>
            </div>
            
            <div className="space-y-4">
              {(career.modules || []).map((module: any) => (
                <div key={module.id} id={`module-${module.id}`}>
                  <ModuleCard
                    module={module}
                    onResourceComplete={handleResourceComplete}
                    isExpanded={expandedModuleId === module.id}
                    onExpand={() => handleModuleExpand(module.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Learning Path Selected</h3>
            <p className="text-slate-600">Choose a career path above to get started with your learning journey.</p>
          </div>
        )}
      </div>
    </div>
  );
}
