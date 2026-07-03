import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Loader2, ArrowUp, ArrowDown, Trash2, Plus, Save, Sparkles, ExternalLink, Edit2, Image as ImageIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { careerRoadmapService, type GeneratedRoadmap, type GeneratedRoadmapResponse } from '@/services/careerRoadmapService';
import type { CareerResource } from '@/types/api';

type DragState = { level: 'module' | 'week' | 'day' | 'topic'; path: number[] } | null;

type DiagnosticsState = GeneratedRoadmapResponse['diagnostics'] | null;

const DRAFT_KEY = 'pragyan_admin_roadmap_review_draft';

function qualityLabel(score: number) {
  if (score > 90) return 'Excellent';
  if (score >= 75) return 'Good';
  return 'Needs Improvement';
}

function qualityColor(score: number) {
  if (score > 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function detectDomainLabel(value?: string) {
  if (!value) return 'Unknown';
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function computeRoadmapStats(roadmap: GeneratedRoadmap) {
  const modules = roadmap.modules.length;
  const weeks = roadmap.modules.reduce((sum, module) => sum + module.weeks.length, 0);
  const days = roadmap.modules.reduce((sum, module) => sum + module.weeks.reduce((inner, week) => inner + week.days.length, 0), 0);
  const topics = roadmap.modules.reduce((sum, module) => sum + module.weeks.reduce((inner, week) => inner + week.days.reduce((d, day) => d + day.topics.length, 0), 0), 0);
  const projects = roadmap.modules.reduce((sum, module) => {
    const moduleProject = module.realWorldProject?.trim() ? 1 : 0;
    const miniProjects = module.weeks.reduce((inner, week) => inner + (week.miniProject?.trim() ? 1 : 0), 0);
    return sum + moduleProject + miniProjects;
  }, 0);
  const quizzes = roadmap.modules.reduce((sum, module) => sum + module.weeks.reduce((inner, week) => inner + (week.weeklyQuiz?.trim() ? 1 : 0), 0), 0);
  const assignments = roadmap.modules.reduce((sum, module) => sum + module.weeks.reduce((inner, week) => inner + (week.handsOnAssignment?.trim() ? 1 : 0), 0), 0);

  return { modules, weeks, days, topics, projects, quizzes, assignments };
}

const blankTopic = () => ({
  title: '',
  description: '',
  difficulty: 'Beginner',
  estimatedDuration: '45 min',
  learningObjective: '',
  prerequisite: '',
  handsOnTask: '',
  miniExercise: '',
  practicalTask: '',
  resources: [],
});

function cloneRoadmap(roadmap: GeneratedRoadmap): GeneratedRoadmap {
  return JSON.parse(JSON.stringify(roadmap)) as GeneratedRoadmap;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function generateDefaultRoadmap(careerName: string): GeneratedRoadmap {
  return {
    careerName,
    summary: '',
    modules: [
      {
        moduleNumber: 1,
        title: 'Foundations',
        description: 'Core concepts and setup.',
        weeks: [
          {
            weekNumber: 1,
            title: 'Orientation',
            description: 'Introduction and scope.',
            days: [
              {
                dayNumber: 1,
                title: 'Start here',
                description: 'Kickoff day.',
                topics: [blankTopic()],
              },
            ],
          },
        ],
      },
    ],
  };
}

export default function AdminRoadmapReviewPage() {
  const { user } = useAuth();
  const [careerName, setCareerName] = useState('');
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [roadmapSource, setRoadmapSource] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [isDirty, setIsDirty] = useState(false);
  const draftTimer = useRef<number | null>(null);

  const generated = useMutation({
    mutationFn: (name: string) => careerRoadmapService.generateRoadmap(name),
    onSuccess: (data) => {
      setRoadmap(data.roadmap);
      setRoadmapSource(data.source || null);
      setDiagnostics(data.diagnostics || null);
      setIsDirty(true);
    },
  });

  const approved = useMutation({
    mutationFn: (payload: GeneratedRoadmap) => careerRoadmapService.approveRoadmap(payload),
    onSuccess: () => {
      setIsDirty(false);
      window.localStorage.removeItem(DRAFT_KEY);
    },
  });

  const canEdit = useMemo(() => Boolean(user && user.role === 'ADMIN'), [user]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { careerName?: string; roadmap?: GeneratedRoadmap };
        if (parsed.careerName) setCareerName(parsed.careerName);
        if (parsed.roadmap) setRoadmap(parsed.roadmap);
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!roadmap) return;
    if (draftTimer.current) {
      window.clearTimeout(draftTimer.current);
    }
    draftTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ careerName, roadmap }));
    }, 30_000);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [careerName, roadmap]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (!canEdit) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>This workflow is only available to admin accounts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const updateRoadmap = (updater: (current: GeneratedRoadmap) => GeneratedRoadmap) => {
    setRoadmap((current) => {
      if (!current) return current;
      setIsDirty(true);
      return updater(cloneRoadmap(current));
    });
  };

  const saveDraft = () => {
    if (!roadmap) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ careerName, roadmap }));
    setIsDirty(false);
  };

  const addModule = () => {
    updateRoadmap((current) => ({
      ...current,
      modules: [
        ...current.modules,
        {
          moduleNumber: current.modules.length + 1,
          title: 'New module',
          description: '',
          weeks: [
            {
              weekNumber: 1,
              title: 'New week',
              description: '',
              days: [
                { dayNumber: 1, title: 'New day', description: '', topics: [blankTopic()] },
              ],
            },
          ],
        },
      ],
    }));
  };

  const approve = () => {
    if (!roadmap) return;
    approved.mutate(roadmap);
  };

  const rejectRoadmap = () => {
    setRoadmap(null);
    setRoadmapSource(null);
    setDiagnostics(null);
    setIsDirty(false);
    window.localStorage.removeItem(DRAFT_KEY);
  };

  const duplicateRoadmap = () => {
    if (!roadmap) return;
    const next = cloneRoadmap(roadmap);
    next.careerName = `${next.careerName} Copy`;
    next.approved = false;
    next.status = 'draft';
    next.generatedAt = new Date().toISOString();
    setCareerName(next.careerName);
    setRoadmap(next);
    setIsDirty(true);
  };

  const regenerateModule = async (moduleIndex: number) => {
    if (!roadmap) return;
    const result = await careerRoadmapService.generateRoadmap(roadmap.careerName);
    setDiagnostics(result.diagnostics || null);
    const replacement = result.roadmap.modules[moduleIndex] || result.roadmap.modules[0];
    updateRoadmap((current) => {
      const next = cloneRoadmap(current);
      next.modules[moduleIndex] = { ...replacement, moduleNumber: moduleIndex + 1 };
      return next;
    });
  };

  const regenerateWeek = async (moduleIndex: number, weekIndex: number) => {
    if (!roadmap) return;
    const result = await careerRoadmapService.generateRoadmap(roadmap.careerName);
    setDiagnostics(result.diagnostics || null);
    const replacement = result.roadmap.modules[moduleIndex]?.weeks[weekIndex] || result.roadmap.modules[0]?.weeks[0];
    if (!replacement) return;
    updateRoadmap((current) => {
      const next = cloneRoadmap(current);
      next.modules[moduleIndex].weeks[weekIndex] = { ...replacement, weekNumber: weekIndex + 1 };
      return next;
    });
  };

  const reorder = (level: NonNullable<DragState>['level'], path: number[], targetIndex: number) => {
    updateRoadmap((current) => {
      const next = cloneRoadmap(current);
      if (level === 'module') {
        next.modules = moveItem(next.modules, path[0], targetIndex);
        next.modules.forEach((module, index) => (module.moduleNumber = index + 1));
      }
      if (level === 'week') {
        const module = next.modules[path[0]];
        module.weeks = moveItem(module.weeks, path[1], targetIndex);
        module.weeks.forEach((week, index) => (week.weekNumber = index + 1));
      }
      if (level === 'day') {
        const day = next.modules[path[0]].weeks[path[1]].days;
        day.splice(targetIndex, 0, day.splice(path[2], 1)[0]);
        day.forEach((item, index) => (item.dayNumber = index + 1));
      }
      if (level === 'topic') {
        const topics = next.modules[path[0]].weeks[path[1]].days[path[2]].topics;
        topics.splice(targetIndex, 0, topics.splice(path[3], 1)[0]);
      }
      return next;
    });
  };

  const renderTopic = (moduleIndex: number, weekIndex: number, dayIndex: number, topicIndex: number) => {
    const topic = roadmap?.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex];
    if (!topic || !roadmap) return null;

    return (
      <Card
        key={`${moduleIndex}-${weekIndex}-${dayIndex}-${topicIndex}`}
        draggable
        onDragStart={() => setDragState({ level: 'topic', path: [moduleIndex, weekIndex, dayIndex, topicIndex] })}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => dragState && dragState.level === 'topic' && reorder('topic', dragState.path, topicIndex)}
        className="border-border/60 bg-background/80"
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">Topic</Badge>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                const next = cloneRoadmap(current);
                let topics = next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics;
                if (topicIndex > 0) topics = moveItem(topics, topicIndex, topicIndex - 1);
                next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics = topics;
                return next;
              })}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                const next = cloneRoadmap(current);
                let topics = next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics;
                if (topicIndex < topics.length - 1) topics = moveItem(topics, topicIndex, topicIndex + 1);
                next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics = topics;
                return next;
              })}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                const next = cloneRoadmap(current);
                next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics.splice(topicIndex, 1);
                return next;
              })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input value={topic.title} onChange={(event) => updateRoadmap((current) => {
            const next = cloneRoadmap(current);
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].title = event.target.value;
            return next;
          })} placeholder="Topic title" />
          <Textarea value={topic.description} onChange={(event) => updateRoadmap((current) => {
            const next = cloneRoadmap(current);
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].description = event.target.value;
            return next;
          })} placeholder="Topic description" />
          <div className="grid gap-2 md:grid-cols-2">
            <Input value={topic.difficulty} onChange={(event) => updateRoadmap((current) => {
              const next = cloneRoadmap(current);
              next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].difficulty = event.target.value;
              return next;
            })} placeholder="Difficulty" />
            <Input value={topic.estimatedDuration} onChange={(event) => updateRoadmap((current) => {
              const next = cloneRoadmap(current);
              next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].estimatedDuration = event.target.value;
              return next;
            })} placeholder="Estimated duration" />
          </div>
          <Textarea value={topic.learningObjective} onChange={(event) => updateRoadmap((current) => {
            const next = cloneRoadmap(current);
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].learningObjective = event.target.value;
            return next;
          })} placeholder="Learning objective" />
          <Textarea value={topic.prerequisite} onChange={(event) => updateRoadmap((current) => {
            const next = cloneRoadmap(current);
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].prerequisite = event.target.value;
            return next;
          })} placeholder="Prerequisite" />
          <Textarea value={topic.handsOnTask || topic.practicalTask} onChange={(event) => updateRoadmap((current) => {
            const next = cloneRoadmap(current);
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].handsOnTask = event.target.value;
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].practicalTask = event.target.value;
            return next;
          })} placeholder="Hands-on task" />
          <Textarea value={topic.miniExercise || ''} onChange={(event) => updateRoadmap((current) => {
            const next = cloneRoadmap(current);
            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics[topicIndex].miniExercise = event.target.value;
            return next;
          })} placeholder="Mini exercise" />

          <div className="mt-2">
            <ResourceManager topicId={(topic as any).id ?? null} />
          </div>

        </CardContent>
      </Card>
    );
  };

  function ResourceManager({ topicId }: { topicId: string | null }) {
    const [open, setOpen] = useState(false);
    const [resources, setResources] = useState<CareerResource[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('ALL');

    const normalizeResourceType = (value: string) => {
      const key = value.toUpperCase().replace(/\s+/g, '_');
      if (key === 'MINI_PROJECT' || key === 'ASSIGNMENT' || key === 'INTERVIEW_QUESTION') return key;
      return key;
    };

    const emptyForm = {
      type: 'Documentation',
      resourceType: 'DOCUMENTATION',
      title: '',
      provider: '',
      url: '',
      description: '',
      difficulty: '',
      estimatedDuration: '',
      duration: '',
      language: '',
      free: false,
      verified: false,
      rating: 0,
      tags: '',
      thumbnail: '',
    } as any;

    const [form, setForm] = useState<any>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);

    const resourceTypes = [
      'Documentation', 'Video', 'Notes', 'Practice', 'Article', 'Book', 'Cheatsheet', 'Mini Project', 'Assignment', 'Interview Question'
    ];

    useEffect(() => {
      let mounted = true;
      async function load() {
        if (!topicId) {
          setResources([]);
          return;
        }
        setLoading(true);
        try {
          const items = await careerRoadmapService.listResources(topicId, activeFilter === 'ALL' ? undefined : activeFilter as any);
          if (!mounted) return;
          setResources(Array.isArray(items) ? items : []);
        } finally {
          setLoading(false);
        }
      }
      load();
      return () => { mounted = false; };
    }, [topicId, activeFilter]);

    const grouped = resources.reduce((acc: Record<string, CareerResource[]>, r) => {
      const k = r.resourceType || r.type || 'Other';
      (acc[k] ||= []).push(r);
      return acc;
    }, {} as Record<string, CareerResource[]>);

    const reorder = async (type: string, fromIndex: number, toIndex: number) => {
      if (!topicId) return;
      const bucket = (grouped[type] || []).slice();
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= bucket.length || toIndex >= bucket.length) return;
      const [moved] = bucket.splice(fromIndex, 1);
      bucket.splice(toIndex, 0, moved);
      await careerRoadmapService.reorderResources(topicId, bucket.map((item) => item.id));
      const items = await careerRoadmapService.listResources(topicId, activeFilter === 'ALL' ? undefined : activeFilter as any);
      setResources(Array.isArray(items) ? items : []);
    };

    const save = async () => {
      if (!topicId) return alert('Save the topic first to attach resources.');
      const payload = {
        topicId,
        type: normalizeResourceType(form.type),
        resourceType: normalizeResourceType(form.type),
        title: form.title,
        provider: form.provider,
        url: form.url,
        description: form.description,
        estimatedDuration: form.estimatedDuration,
        duration: form.duration,
        difficulty: form.difficulty,
        language: form.language,
        isFree: Boolean(form.free),
        free: Boolean(form.free),
        verified: Boolean(form.verified),
        rating: Number(form.rating || 0),
        tags: String(form.tags || '').split(',').map((tag: string) => tag.trim()).filter(Boolean),
        thumbnail: form.thumbnail || undefined,
      } as any;

      try {
        if (editingId) {
          const updated = await careerRoadmapService.updateResource(editingId, payload);
          setResources((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
          setEditingId(null);
        } else {
          const created = await careerRoadmapService.addResource(payload);
          setResources((prev) => [created, ...prev]);
        }
        setForm(emptyForm);
      } catch (err: any) {
        console.error('Resource save failed', err);
        alert('Failed to save resource');
      }
    };

    const remove = async (id: string) => {
      if (!confirm('Delete resource?')) return;
      try {
        await careerRoadmapService.deleteResource(id);
        setResources((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        console.error(err);
        alert('Delete failed');
      }
    };

    const startEdit = (r: CareerResource) => {
      setEditingId(r.id);
      setForm({
        type: r.resourceType || r.type,
        resourceType: r.resourceType || r.type,
        title: r.title,
        provider: r.provider,
        url: r.url,
        description: r.description,
        difficulty: r.difficulty,
        estimatedDuration: r.estimatedDuration || r.duration,
        duration: r.duration,
        language: r.language,
        free: r.isFree ?? r.free,
        verified: Boolean(r.verified),
        rating: r.rating || 0,
        tags: Array.isArray(r.tags) ? r.tags.join(', ') : '',
        thumbnail: r.thumbnail,
      });
      setOpen(true);
    };

    const duplicate = async (r: CareerResource) => {
      if (!topicId) return;
      try {
        const payload = { ...r, topicId } as any;
        delete payload.id;
        const created = await careerRoadmapService.addResource(payload);
        setResources((prev) => [created, ...prev]);
      } catch (err) {
        console.error(err);
        alert('Duplicate failed');
      }
    };

    return (
      <div className="mt-4 border-t pt-4">
        <button type="button" onClick={() => setOpen((s) => !s)} className="text-sm font-medium text-primary mb-3">
          {open ? 'Hide' : 'Show'} Learning Resources
        </button>
        {open ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'VIDEO', 'DOCUMENTATION', 'PRACTICE', 'PROJECT', 'INTERVIEW_QUESTION'].map((filter) => (
                <button key={filter} type="button" className={`btn ${activeFilter === filter ? 'btn-primary' : ''}`} onClick={() => setActiveFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                {resourceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="input" placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
              <input className="input" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <input className="input" placeholder="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
              <input className="input" placeholder="Estimated Duration" value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} />
              <input className="input" placeholder="Estimated Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              <input className="input" placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              <input className="input" placeholder="Rating (0-5)" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              <input className="input" placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(form.free)} onChange={(e) => setForm({ ...form, free: e.target.checked })} /> Free Resource
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(form.verified)} onChange={(e) => setForm({ ...form, verified: e.target.checked })} /> Verified
              </label>
              <input className="input" placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
            </div>
            <textarea className="textarea w-full" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={save}>{editingId ? 'Update Resource' : 'Save Resource'}</button>
              {editingId ? <button className="btn" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button> : null}
            </div>

            <div className="mt-4 space-y-4">
              {loading ? <div>Loading...</div> : Object.keys(grouped).length === 0 ? <div className="text-sm text-muted-foreground">No resources yet.</div> : (
                Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <h4 className="font-semibold">{type}</h4>
                    <div className="grid gap-2 mt-2">
                      {items.map((r, index) => (
                        <div key={r.id} className="flex items-center justify-between border p-3 rounded">
                          <div className="flex items-center gap-3">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{r.title}</div>
                              <div className="text-sm text-muted-foreground">{r.provider}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="btn" onClick={() => reorder(type, index, Math.max(0, index - 1))}><ArrowUp className="w-4 h-4" /></button>
                            <button className="btn" onClick={() => reorder(type, index, Math.min(items.length - 1, index + 1))}><ArrowDown className="w-4 h-4" /></button>
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-primary mr-2"><ExternalLink className="w-4 h-4" /></a>
                            <button className="btn" onClick={() => startEdit(r)}><Edit2 className="w-4 h-4" /></button>
                            <button className="btn" onClick={() => duplicate(r)}><Copy className="w-4 h-4" /></button>
                            <button className="btn btn-danger" onClick={() => remove(r.id)}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Roadmap Review & Approval
            </div>
            <h1 className="mt-2 text-3xl font-bold">Generate and approve a curriculum</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/70">Create a preview, edit the structure, then persist the reviewed roadmap into MongoDB.</p>
          </div>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <Input value={careerName} onChange={(event) => setCareerName(event.target.value)} placeholder="Career name" />
            <div className="flex gap-3">
              <Button disabled={generated.isPending || !careerName.trim()} onClick={() => generated.mutate(careerName.trim())}>
                {generated.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate preview
              </Button>
              <Button variant="outline" onClick={() => setRoadmap(generateDefaultRoadmap(careerName || 'New career'))}>
                Use starter draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            <ShieldCheck className="h-4 w-4" />
            Roadmap Review & Approval
          </div>
          <h1 className="mt-2 text-3xl font-bold">Review {roadmap.careerName}</h1>
          {roadmapSource ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-yellow-300">
              <span className="rounded-full border border-yellow-300/30 bg-yellow-950 px-2 py-1">Generated via {roadmapSource}</span>
              {roadmapSource === 'fallback' ? <span className="text-yellow-200">AI generation is not available; this is a fallback template.</span> : null}
            </div>
          ) : null}
          <p className="mt-2 max-w-3xl text-sm text-white/70">Edit the curriculum in place, reorder sections, autosave drafts, then approve when ready.</p>
        </div>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-3 p-6">
          <Input value={roadmap.careerName} onChange={(event) => updateRoadmap((current) => ({ ...current, careerName: event.target.value }))} placeholder="Career name" />
          <Textarea value={roadmap.summary} onChange={(event) => updateRoadmap((current) => ({ ...current, summary: event.target.value }))} placeholder="Summary" />
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveDraft} variant="outline"><Save className="mr-2 h-4 w-4" />Save draft</Button>
            <Button onClick={duplicateRoadmap} variant="outline"><Copy className="mr-2 h-4 w-4" />Duplicate roadmap</Button>
            <Button onClick={addModule} variant="outline"><Plus className="mr-2 h-4 w-4" />Add module</Button>
            <Button onClick={approve} disabled={approved.isPending}>
              {approved.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve roadmap
            </Button>
            <Button variant="destructive" onClick={rejectRoadmap}>Reject roadmap</Button>
            <Button variant="ghost" onClick={() => setRoadmap(null)}>Generate again</Button>
          </div>
        </CardContent>
      </Card>

      {roadmap ? (() => {
        const score = diagnostics?.quality?.score ?? 0;
        const status = qualityLabel(score);
        const stats = computeRoadmapStats(roadmap);
        const warnings = [
          ...(diagnostics?.warnings || []),
          ...(diagnostics?.quality?.warnings || []),
        ].filter((value, index, arr) => value && arr.indexOf(value) === index);
        const domainLabel = detectDomainLabel(diagnostics?.detectedDomain || roadmap.templateKey);
        const confidence = diagnostics?.confidence ?? 0;

        return (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>AI Curriculum Quality Report</CardTitle>
              <CardDescription>Transparent diagnostics for admin review and approval decisions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Score</p>
                  <p className="mt-1 text-2xl font-semibold">{score} / 100</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Quality Status</p>
                  <p className="mt-1 text-2xl font-semibold">{status}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Detected Domain</p>
                  <p className="mt-1 text-base font-semibold">{domainLabel}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</p>
                  <p className="mt-1 text-2xl font-semibold">{Math.round(confidence * 100)}%</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Roadmap Source</p>
                  <p className="mt-1 text-base font-semibold">{roadmapSource === 'fallback' ? 'Fallback' : roadmapSource === 'gemini' ? 'Gemini' : 'Template'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Regenerated</p>
                  <p className="mt-1 text-base font-semibold">{diagnostics?.regenerated ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prerequisite Graph</p>
                  <p className="mt-1 text-base font-semibold">{diagnostics?.prerequisiteGraphValid ? 'Valid' : 'Needs Review'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Matched Aliases</p>
                  <p className="mt-1 text-sm font-medium">{diagnostics?.matchedAliases?.length ? diagnostics.matchedAliases.join(', ') : 'None'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quality Progress</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${qualityColor(score)}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Recommendation</p>
                <p className="mt-1 text-sm text-muted-foreground">{diagnostics?.quality?.recommendation || 'No recommendation available.'}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Warnings</p>
                {warnings.length ? (
                  <div className="grid gap-2">
                    {warnings.map((warning, index) => (
                      <div key={`${warning}-${index}`} className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900">
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No warnings found.</p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-semibold">Why this roadmap?</p>
                <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  <p>Based on {domainLabel} template</p>
                  <p>Personalized for {roadmap.careerName}</p>
                  <p>Difficulty progression validated: {diagnostics?.quality?.passed ? 'Yes' : 'Review required'}</p>
                  <p>Prerequisite violations detected: {diagnostics?.prerequisiteGraphValid ? 'No' : 'Yes'}</p>
                  <p>AI confidence: {Math.round(confidence * 100)}%</p>
                  <p>Quality score: {score}/100</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Curriculum Statistics</p>
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Modules</p><p className="text-xl font-semibold">{stats.modules}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Weeks</p><p className="text-xl font-semibold">{stats.weeks}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Days</p><p className="text-xl font-semibold">{stats.days}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Topics</p><p className="text-xl font-semibold">{stats.topics}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Projects</p><p className="text-xl font-semibold">{stats.projects}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Quizzes</p><p className="text-xl font-semibold">{stats.quizzes}</p></div>
                  <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Assignments</p><p className="text-xl font-semibold">{stats.assignments}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })() : null}

      <div className="space-y-6">
        {roadmap.modules.map((module, moduleIndex) => (
          <Card
            key={`${moduleIndex}-${module.moduleNumber}`}
            draggable
            onDragStart={() => setDragState({ level: 'module', path: [moduleIndex] })}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dragState && dragState.level === 'module' && reorder('module', dragState.path, moduleIndex)}
            className="border-border/70 shadow-sm"
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Module {module.moduleNumber}</CardTitle>
                  <CardDescription>Drag, edit, or remove this module.</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => ({ ...current, modules: moveItem(current.modules, moduleIndex, Math.max(0, moduleIndex - 1)) }))}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => ({ ...current, modules: moveItem(current.modules, moduleIndex, Math.min(current.modules.length - 1, moduleIndex + 1)) }))}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" disabled={generated.isPending} onClick={() => regenerateModule(moduleIndex)}>Regenerate module</Button>
                  <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => ({ ...current, modules: current.modules.filter((_, index) => index !== moduleIndex) }))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <Input value={module.title} onChange={(event) => updateRoadmap((current) => {
                const next = cloneRoadmap(current);
                next.modules[moduleIndex].title = event.target.value;
                return next;
              })} />
              <Textarea value={module.description} onChange={(event) => updateRoadmap((current) => {
                const next = cloneRoadmap(current);
                next.modules[moduleIndex].description = event.target.value;
                return next;
              })} />
            </CardHeader>
            <CardContent className="space-y-4">
              {module.weeks.map((week, weekIndex) => (
                <Card
                  key={`${moduleIndex}-${weekIndex}-${week.weekNumber}`}
                  draggable
                  onDragStart={() => setDragState({ level: 'week', path: [moduleIndex, weekIndex] })}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dragState && dragState.level === 'week' && reorder('week', dragState.path, weekIndex)}
                  className="border-border/60 bg-muted/20"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">Week {week.weekNumber}</CardTitle>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                          const next = cloneRoadmap(current);
                          next.modules[moduleIndex].weeks = moveItem(next.modules[moduleIndex].weeks, weekIndex, Math.max(0, weekIndex - 1));
                          return next;
                        })}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                          const next = cloneRoadmap(current);
                          next.modules[moduleIndex].weeks = moveItem(next.modules[moduleIndex].weeks, weekIndex, Math.min(next.modules[moduleIndex].weeks.length - 1, weekIndex + 1));
                          return next;
                        })}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" disabled={generated.isPending} onClick={() => regenerateWeek(moduleIndex, weekIndex)}>Regenerate week</Button>
                        <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                          const next = cloneRoadmap(current);
                          next.modules[moduleIndex].weeks.splice(weekIndex, 1);
                          return next;
                        })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Input value={week.title} onChange={(event) => updateRoadmap((current) => {
                      const next = cloneRoadmap(current);
                      next.modules[moduleIndex].weeks[weekIndex].title = event.target.value;
                      return next;
                    })} />
                    <Textarea value={week.description} onChange={(event) => updateRoadmap((current) => {
                      const next = cloneRoadmap(current);
                      next.modules[moduleIndex].weeks[weekIndex].description = event.target.value;
                      return next;
                    })} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {week.days.map((day, dayIndex) => (
                      <Card
                        key={`${moduleIndex}-${weekIndex}-${dayIndex}-${day.dayNumber}`}
                        draggable
                        onDragStart={() => setDragState({ level: 'day', path: [moduleIndex, weekIndex, dayIndex] })}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => dragState && dragState.level === 'day' && reorder('day', dragState.path, dayIndex)}
                        className="border-border/60 bg-background/70"
                      >
                        <CardHeader className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-sm">Day {day.dayNumber}</CardTitle>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                                const next = cloneRoadmap(current);
                                next.modules[moduleIndex].weeks[weekIndex].days = moveItem(next.modules[moduleIndex].weeks[weekIndex].days, dayIndex, Math.max(0, dayIndex - 1));
                                return next;
                              })}><ArrowUp className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                                const next = cloneRoadmap(current);
                                next.modules[moduleIndex].weeks[weekIndex].days = moveItem(next.modules[moduleIndex].weeks[weekIndex].days, dayIndex, Math.min(next.modules[moduleIndex].weeks[weekIndex].days.length - 1, dayIndex + 1));
                                return next;
                              })}><ArrowDown className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => updateRoadmap((current) => {
                                const next = cloneRoadmap(current);
                                next.modules[moduleIndex].weeks[weekIndex].days.splice(dayIndex, 1);
                                return next;
                              })}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <Input value={day.title} onChange={(event) => updateRoadmap((current) => {
                            const next = cloneRoadmap(current);
                            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].title = event.target.value;
                            return next;
                          })} />
                          <Textarea value={day.description} onChange={(event) => updateRoadmap((current) => {
                            const next = cloneRoadmap(current);
                            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].description = event.target.value;
                            return next;
                          })} />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {day.topics.map((topic, topicIndex) => renderTopic(moduleIndex, weekIndex, dayIndex, topicIndex))}
                          <Button variant="outline" size="sm" onClick={() => updateRoadmap((current) => {
                            const next = cloneRoadmap(current);
                            next.modules[moduleIndex].weeks[weekIndex].days[dayIndex].topics.push(blankTopic());
                            return next;
                          })}>
                            <Plus className="mr-2 h-4 w-4" />Add topic
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => updateRoadmap((current) => {
                      const next = cloneRoadmap(current);
                      next.modules[moduleIndex].weeks[weekIndex].days.push({ dayNumber: next.modules[moduleIndex].weeks[weekIndex].days.length + 1, title: 'New day', description: '', topics: [blankTopic()] });
                      return next;
                    })}>
                      <Plus className="mr-2 h-4 w-4" />Add day
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateRoadmap((current) => {
                const next = cloneRoadmap(current);
                next.modules[moduleIndex].weeks.push({ weekNumber: next.modules[moduleIndex].weeks.length + 1, title: 'New week', description: '', days: [{ dayNumber: 1, title: 'New day', description: '', topics: [blankTopic()] }] });
                return next;
              })}>
                <Plus className="mr-2 h-4 w-4" />Add week
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
