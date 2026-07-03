import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import type { CareerResource, CareerRoadmap, CareerRoadmapSummary, CareerTopic } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, BookOpen, PlayCircle, FileText, Target, Rocket, ClipboardCheck, BookMarked, NotebookPen, Clock3, Sparkles, Layers3, GraduationCap, Loader2, ChevronRight } from 'lucide-react';

const resourceMeta: Record<string, { label: string; icon: typeof BookOpen; badge: string; accent: string }> = {
  DOCUMENTATION: { label: 'Documentation', icon: BookOpen, badge: 'bg-sky-100 text-sky-700', accent: 'text-sky-700' },
  VIDEO: { label: 'Video', icon: PlayCircle, badge: 'bg-rose-100 text-rose-700', accent: 'text-rose-700' },
  NOTES: { label: 'Notes', icon: FileText, badge: 'bg-amber-100 text-amber-700', accent: 'text-amber-700' },
  PRACTICE: { label: 'Practice', icon: ClipboardCheck, badge: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-700' },
  ARTICLE: { label: 'Article', icon: NotebookPen, badge: 'bg-violet-100 text-violet-700', accent: 'text-violet-700' },
  CHEATSHEET: { label: 'Cheatsheet', icon: BookMarked, badge: 'bg-zinc-100 text-zinc-700', accent: 'text-zinc-700' },
  BOOK: { label: 'Book', icon: GraduationCap, badge: 'bg-orange-100 text-orange-700', accent: 'text-orange-700' },
  PROJECT: { label: 'Project', icon: Rocket, badge: 'bg-fuchsia-100 text-fuchsia-700', accent: 'text-fuchsia-700' },
  MINI_PROJECT: { label: 'Mini Project', icon: Rocket, badge: 'bg-fuchsia-100 text-fuchsia-700', accent: 'text-fuchsia-700' },
  ASSIGNMENT: { label: 'Assignment', icon: ClipboardCheck, badge: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-700' },
  INTERVIEW_QUESTION: { label: 'Interview Question', icon: Target, badge: 'bg-slate-100 text-slate-700', accent: 'text-slate-700' },
  CERTIFICATION: { label: 'Certification', icon: GraduationCap, badge: 'bg-orange-100 text-orange-700', accent: 'text-orange-700' },
  REFERENCE: { label: 'Reference', icon: FileText, badge: 'bg-zinc-100 text-zinc-700', accent: 'text-zinc-700' },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function safeOpen(url?: string | null) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function normalizeResourceType(type?: string | null) {
  return (type || 'DOCUMENTATION').toUpperCase();
}

function countCareerStats(career?: CareerRoadmap | null) {
  if (!career) {
    return { weeks: 0, days: 0, topics: 0, resources: 0 };
  }

  const weeks = career.weeks?.length ?? 0;
  const days = career.weeks?.reduce((total, week) => total + (week.days?.length ?? 0), 0) ?? 0;
  const topics = career.weeks?.reduce((total, week) => {
    return total + (week.days?.reduce((dayTotal, day) => dayTotal + (day.topics?.length ?? 0), 0) ?? 0);
  }, 0) ?? 0;
  const resources = career.weeks?.reduce((total, week) => {
    return total + (week.days?.reduce((dayTotal, day) => {
      return dayTotal + (day.topics?.reduce((topicTotal, topic) => topicTotal + (topic.resources?.length ?? 0), 0) ?? 0);
    }, 0) ?? 0);
  }, 0) ?? 0;

  return { weeks, days, topics, resources };
}

function ResourceCard({ resource, topic }: { resource: CareerResource; topic: CareerTopic }) {
  const meta = resourceMeta[resource.type] ?? resourceMeta.DOCUMENTATION;
  const Icon = meta.icon;

  return (
    <Card className="group border-border/70 bg-card/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.badge}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-semibold text-foreground">{resource.title}</h4>
              <Badge variant="outline" className={`border-0 ${meta.badge}`}>{meta.label}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{resource.provider}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                <Clock3 className="h-3.5 w-3.5" />
                {resource.estimatedDuration || resource.duration || topic.estimatedTime}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">{resource.difficulty || topic.difficulty}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">{resource.free === false ? 'Paid' : 'Free'}</span>
              {resource.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Verified</span> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground line-clamp-1">{resource.language || 'Language not specified'}</p>
          <Button size="sm" className="rounded-xl" onClick={() => safeOpen(resource.url)}>
            Open Link <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TopicBlock({ topic }: { topic: CareerTopic }) {
  const [activeType, setActiveType] = useState<string>('ALL');
  const resourceGroups = useMemo(() => {
    return (topic.resources || []).reduce<Record<string, CareerResource[]>>((acc, resource) => {
      const bucketType = normalizeResourceType(resource.resourceType || resource.type);
      const bucket = acc[bucketType] || [];
      bucket.push(resource);
      acc[bucketType] = bucket;
      return acc;
    }, {});
  }, [topic.resources]);

  const orderedTypes = Object.keys(resourceGroups).sort((left, right) => {
    const leftOrder = Object.keys(resourceMeta).indexOf(left);
    const rightOrder = Object.keys(resourceMeta).indexOf(right);
    return leftOrder - rightOrder;
  });

  const visibleTypes = activeType === 'ALL' ? orderedTypes : orderedTypes.filter((type) => type === activeType);

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-foreground">{topic.title}</h4>
            <Badge variant="outline" className="border-0 bg-muted text-muted-foreground">{topic.difficulty}</Badge>
          </div>
          {topic.description ? <p className="text-sm text-muted-foreground">{topic.description}</p> : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock3 className="h-3.5 w-3.5" />
            {topic.estimatedTime}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">#{topic.order + 1}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {['ALL', 'DOCUMENTATION', 'VIDEO', 'PRACTICE', 'PROJECT', 'MINI_PROJECT', 'NOTES', 'BOOK', 'INTERVIEW_QUESTION'].map((type) => (
            <button key={type} type="button" className={`rounded-full border px-3 py-1 text-xs ${activeType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} onClick={() => setActiveType(type)}>
              {type}
            </button>
          ))}
        </div>
        {visibleTypes.map((type) => {
          const resources = resourceGroups[type] || [];
          const meta = resourceMeta[type] ?? resourceMeta.DOCUMENTATION;
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => safeOpen(resources[0]?.url)}
              className={`flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${meta.badge}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${meta.accent}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{resources.length} resource{resources.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <ExternalLink className={`h-4 w-4 ${meta.accent}`} />
            </button>
          );
        })}
      </div>

      {topic.quizUrl || topic.miniProjectUrl ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {topic.quizUrl ? (
            <Button variant="outline" className="rounded-xl" onClick={() => safeOpen(topic.quizUrl)}>
              Quiz <Target className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
          {topic.miniProjectUrl ? (
            <Button variant="outline" className="rounded-xl" onClick={() => safeOpen(topic.miniProjectUrl)}>
              Mini Project <Rocket className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {visibleTypes.map((type) => {
          const resources = resourceGroups[type] || [];
          const meta = resourceMeta[type] ?? resourceMeta.DOCUMENTATION;
          if (!resources.length) return null;

          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5" />
                {meta.label}
              </div>
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} topic={topic} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Roadmap() {
  const { user } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState('');

  const careersQuery = useQuery({
    queryKey: ['career-roadmaps'],
    queryFn: () => careerRoadmapService.listCareers(),
    retry: false,
  });

  const careers = careersQuery.data ?? [];

  useEffect(() => {
    if (selectedSlug) return;
    const fallback = user?.careerTrack ? slugify(user.careerTrack) : careers[0]?.slug;
    if (fallback) {
      setSelectedSlug(fallback);
    }
  }, [careers, selectedSlug, user?.careerTrack]);

  const activeCareer = useMemo(() => {
    return careers.find((career) => career.slug === selectedSlug) || careers[0] || null;
  }, [careers, selectedSlug]);

  const careerQuery = useQuery({
    queryKey: ['career-roadmap', activeCareer?.slug],
    queryFn: () => careerRoadmapService.getCareer(activeCareer?.slug || ''),
    enabled: Boolean(activeCareer?.slug),
    retry: false,
  });

  const career = careerQuery.data ?? null;
  const stats = countCareerStats(career);
  const hasRoadmap = Boolean(career?.weeks?.length && career.weeks.some((week) => (week.days?.length ?? 0) > 0));

  const dayCountLabel = hasRoadmap ? `${stats.days} day${stats.days === 1 ? '' : 's'}` : '--';
  const topicCountLabel = hasRoadmap ? `${stats.topics} topic${stats.topics === 1 ? '' : 's'}` : '--';
  const resourceCountLabel = hasRoadmap ? `${stats.resources} resource${stats.resources === 1 ? '' : 's'}` : '--';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Career Roadmap
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{hasRoadmap ? career?.name : 'No roadmap yet'}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
                {hasRoadmap
                  ? 'Database-driven roadmap content only. Every week, day, topic, and resource is loaded from MongoDB so students always see the same reviewed roadmap.'
                  : 'No generated roadmap exists yet. Ask your admin to create a roadmap or open the admin manager to add one.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
            {[
              { label: 'Weeks', value: hasRoadmap ? stats.weeks : '--' },
              { label: 'Days', value: dayCountLabel },
              { label: 'Topics', value: topicCountLabel },
              { label: 'Resources', value: resourceCountLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Choose roadmap</CardTitle>
            <CardDescription>Select a stored career blueprint. The default follows your profile career track when available.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select a career roadmap" />
                  </SelectTrigger>
                  <SelectContent>
                    {careers.map((careerOption: CareerRoadmapSummary) => (
                      <SelectItem key={careerOption.slug} value={careerOption.slug}>
                        {careerOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">Stored in MongoDB</Badge>
                <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">No hardcoded URLs</Badge>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              {career?.description || 'Load a career roadmap to see the full week, day, topic, and resource hierarchy.'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" />
              What students get
            </CardTitle>
            <CardDescription>Each topic exposes only database-sourced learning actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4">
              <Target className="mt-0.5 h-4 w-4 text-primary" />
              <span>Expandable topic blocks with topic descriptions, time estimates, and difficulty badges.</span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4">
              <BookOpen className="mt-0.5 h-4 w-4 text-primary" />
              <span>Resource cards for documentation, video, notes, practice, article, cheatsheet, book, and project links.</span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <span>Future-ready schema so AI or admin can attach resources later without changing the student UI.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {careerQuery.isLoading || careersQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-[24px] border border-border/70 bg-card py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading roadmap from the database...
        </div>
      ) : hasRoadmap && career ? (
        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-4">
            <Accordion type="multiple" className="space-y-3">
              {career.weeks.map((week) => (
                <AccordionItem key={week.id} value={week.id} className="rounded-[24px] border border-border/70 bg-card px-5 shadow-sm">
                  <AccordionTrigger className="py-5 text-left no-underline hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-4 pr-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Week {week.weekNumber}</p>
                        <h2 className="mt-1 text-lg font-semibold text-foreground">{week.title}</h2>
                        {week.description ? <p className="mt-1 text-sm text-muted-foreground">{week.description}</p> : null}
                      </div>
                      <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">{week.days?.length ?? 0} day{(week.days?.length ?? 0) === 1 ? '' : 's'}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple" className="space-y-3">
                      {week.days?.map((day) => (
                        <AccordionItem key={day.id} value={day.id} className="rounded-[20px] border border-border/60 bg-background px-4 shadow-sm">
                          <AccordionTrigger className="py-4 hover:no-underline">
                            <div className="flex w-full items-center justify-between gap-4 pr-2">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Day {day.dayNumber}</p>
                                <h3 className="mt-1 text-base font-semibold text-foreground">{day.title}</h3>
                                {day.description ? <p className="mt-1 text-sm text-muted-foreground">{day.description}</p> : null}
                              </div>
                              <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">{day.topics?.length ?? 0} topics</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Accordion type="multiple" className="space-y-3">
                              {day.topics?.map((topic) => (
                                <AccordionItem key={topic.id} value={topic.id} className="rounded-[18px] border border-border/60 bg-muted/20 px-4 shadow-sm">
                                  <AccordionTrigger className="py-4 hover:no-underline">
                                    <div className="flex w-full items-center justify-between gap-4 pr-2">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="text-base font-semibold text-foreground">{topic.title}</h4>
                                          <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">{topic.difficulty}</Badge>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {topic.estimatedTime}
                                          </span>
                                          <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            {topic.resources?.length ?? 0} resources
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <TopicBlock topic={topic} />
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-4">
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-5 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">Target career</p>
                <h3 className="mt-1 text-2xl font-bold">{career.name}</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">Stored roadmap with {stats.weeks} week{stats.weeks === 1 ? '' : 's'} and {topicCountLabel}.</p>
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Weeks</p>
                    <p className="mt-1 font-semibold text-foreground">{stats.weeks}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Days</p>
                    <p className="mt-1 font-semibold text-foreground">{stats.days}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Topics</p>
                    <p className="mt-1 font-semibold text-foreground">{stats.topics}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resources</p>
                    <p className="mt-1 font-semibold text-foreground">{stats.resources}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                  The same roadmap can be reused for every student. Admins only attach resources here once, and the frontend always reads from the database.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Resource rules
                </CardTitle>
                <CardDescription>These checks keep the roadmap consistent and future-ready.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/60 bg-background p-3">Documentation and video links open directly from the stored URL.</div>
                <div className="rounded-2xl border border-border/60 bg-background p-3">Quiz and project links are also stored against the topic, not hardcoded in React.</div>
                <div className="rounded-2xl border border-border/60 bg-background p-3">When AI generates new content later, admins can review it and attach final resources before publish.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>No career roadmap yet</CardTitle>
            <CardDescription>Use the admin resource manager to create a career roadmap and attach week/day/topic resources.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => safeOpen('/admin/roadmaps')}>Open Admin Manager</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
