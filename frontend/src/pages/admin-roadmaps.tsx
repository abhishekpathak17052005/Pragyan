import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { careerRoadmapService, type CareerTopicSearchResult } from '@/services/careerRoadmapService';
import type { CareerResource } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Pencil, ShieldCheck, Loader2, ArrowUpDown, CheckCircle2 } from 'lucide-react';

const resourceTypes = ['DOCUMENTATION', 'VIDEO', 'PRACTICE', 'PROJECT', 'BOOK', 'NOTES', 'INTERVIEW_QUESTION', 'CERTIFICATION', 'REFERENCE'] as const;

type ResourceFormState = {
  topicId: string;
  type: CareerResource['type'];
  title: string;
  provider: string;
  url: string;
  thumbnail: string;
  duration: string;
  free: boolean;
  language: string;
  difficulty: string;
  order: string;
  verified: boolean;
};

const defaultResourceForm = (topicId = ''): ResourceFormState => ({
  topicId,
  type: 'DOCUMENTATION',
  title: '',
  provider: '',
  url: '',
  thumbnail: '',
  duration: '',
  free: true,
  language: 'en',
  difficulty: '',
  order: '0',
  verified: false,
});

export default function AdminRoadmapManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(defaultResourceForm());

  const topicSearchQuery = useQuery({
    queryKey: ['admin-topic-search', topicSearch],
    queryFn: () => careerRoadmapService.searchTopics({ q: topicSearch, page: 1, limit: 12 }),
    enabled: Boolean(topicSearch.trim()),
    retry: false,
  });

  const resourceListQuery = useQuery({
    queryKey: ['admin-topic-resources', selectedTopicId],
    queryFn: () => careerRoadmapService.listResources(selectedTopicId),
    enabled: Boolean(selectedTopicId),
    retry: false,
  });

  useEffect(() => {
    if (selectedTopicId) {
      setResourceForm((current) => ({ ...current, topicId: selectedTopicId }));
    }
  }, [selectedTopicId]);

  const addResourceMutation = useMutation({
    mutationFn: careerRoadmapService.addResource,
    onSuccess: async () => {
      setResourceForm(defaultResourceForm(selectedTopicId));
      setEditingResourceId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-topic-resources', selectedTopicId] });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<ResourceFormState, 'order'>> & { order?: number; metadata?: Record<string, unknown> } }) =>
      careerRoadmapService.updateResource(id, {
        topicId: input.topicId,
        type: input.type,
        title: input.title,
        provider: input.provider,
        url: input.url,
        thumbnail: input.thumbnail,
        duration: input.duration,
        free: input.free,
        language: input.language,
        difficulty: input.difficulty,
        order: input.order,
        verified: input.verified,
        metadata: input.metadata,
      }),
    onSuccess: async () => {
      setEditingResourceId(null);
      setResourceForm(defaultResourceForm(selectedTopicId));
      await queryClient.invalidateQueries({ queryKey: ['admin-topic-resources', selectedTopicId] });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: careerRoadmapService.deleteResource,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-topic-resources', selectedTopicId] });
    },
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>This manager is only available for admin accounts.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const editableResources = resourceListQuery.data ?? [];
  const topicSearchResults: CareerTopicSearchResult[] = topicSearchQuery.data?.data ?? [];

  const submitResource = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTopicId) return;

    const payload = {
      topicId: resourceForm.topicId || selectedTopicId,
      type: resourceForm.type,
      title: resourceForm.title,
      provider: resourceForm.provider,
      url: resourceForm.url,
      thumbnail: resourceForm.thumbnail || undefined,
      duration: resourceForm.duration || undefined,
      free: resourceForm.free,
      language: resourceForm.language || undefined,
      difficulty: resourceForm.difficulty || undefined,
      order: Number(resourceForm.order || 0),
      verified: resourceForm.verified,
    };

    if (editingResourceId) {
      updateResourceMutation.mutate({ id: editingResourceId, input: payload });
      return;
    }

    addResourceMutation.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            <ShieldCheck className="h-4 w-4" />
            Admin Resource Manager
          </div>
          <h1 className="mt-2 text-3xl font-bold">Topic resources only</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70">Use the roadmap review page to generate and approve curriculum. Keep this page focused on resource curation.</p>
          <div className="mt-4">
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href="/admin/roadmap-review">Open roadmap review</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Search topics</CardTitle>
            <CardDescription>Find a topic, then manage its resources.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search topics" className="pl-9" value={topicSearch} onChange={(event) => setTopicSearch(event.target.value)} />
            </div>
            <div className="space-y-3">
              {topicSearchQuery.isFetching ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching topics...</div>
              ) : topicSearchResults.length ? (
                topicSearchResults.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className={`w-full rounded-2xl border p-4 text-left transition-all hover:border-primary/40 ${selectedTopicId === topic.id ? 'border-primary bg-primary/5' : 'border-border/70 bg-background'}`}
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      setResourceForm(defaultResourceForm(topic.id));
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{topic.title}</p>
                        <p className="text-xs text-muted-foreground">{topic.day?.week?.career?.name} · Week {topic.day?.week?.weekNumber} · Day {topic.day?.dayNumber}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">{topic.resources?.length ?? 0} resources</Badge>
                    </div>
                  </button>
                ))
              ) : topicSearch.trim() ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">No topics found for this search.</div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">Search topics to attach or edit resources.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resource manager</CardTitle>
            <CardDescription>Attach documentation, video, practice, project, book, notes, interview question, certification, or reference links to the selected topic.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTopicId ? (
              <form className="space-y-3" onSubmit={submitResource}>
                <Select value={resourceForm.type} onValueChange={(value) => setResourceForm((current) => ({ ...current, type: value as CareerResource['type'] }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Resource type" /></SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Resource title" value={resourceForm.title} onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Provider" value={resourceForm.provider} onChange={(event) => setResourceForm((current) => ({ ...current, provider: event.target.value }))} />
                  <Input placeholder="URL" value={resourceForm.url} onChange={(event) => setResourceForm((current) => ({ ...current, url: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Duration" value={resourceForm.duration} onChange={(event) => setResourceForm((current) => ({ ...current, duration: event.target.value }))} />
                  <Input placeholder="Language" value={resourceForm.language} onChange={(event) => setResourceForm((current) => ({ ...current, language: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Difficulty" value={resourceForm.difficulty} onChange={(event) => setResourceForm((current) => ({ ...current, difficulty: event.target.value }))} />
                  <Input type="number" min="0" placeholder="Order" value={resourceForm.order} onChange={(event) => setResourceForm((current) => ({ ...current, order: event.target.value }))} />
                </div>
                <Input placeholder="Thumbnail URL (optional)" value={resourceForm.thumbnail} onChange={(event) => setResourceForm((current) => ({ ...current, thumbnail: event.target.value }))} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={resourceForm.free} onChange={(event) => setResourceForm((current) => ({ ...current, free: event.target.checked }))} />
                  Free resource
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={resourceForm.verified} onChange={(event) => setResourceForm((current) => ({ ...current, verified: event.target.checked }))} />
                  Verified resource
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" className="rounded-xl" disabled={addResourceMutation.isPending || updateResourceMutation.isPending}>
                    {editingResourceId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editingResourceId ? 'Update resource' : 'Add resource'}
                  </Button>
                  {editingResourceId ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setEditingResourceId(null);
                        setResourceForm(defaultResourceForm(selectedTopicId));
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">Select a topic first.</div>
            )}

            <div className="mt-6 space-y-3">
              {resourceListQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading resources...</div>
              ) : editableResources.length ? (
                editableResources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{resource.title}</p>
                          <Badge variant="outline" className="rounded-full border-border/60 px-3 py-1.5">{resource.type}</Badge>
                          {resource.verified ? <Badge className="rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Verified</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{resource.provider} · {resource.duration || 'No duration'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingResourceId(resource.id);
                            setResourceForm({
                              topicId: selectedTopicId,
                              type: resource.type,
                              title: resource.title,
                              provider: resource.provider,
                              url: resource.url,
                              thumbnail: resource.thumbnail || '',
                              duration: resource.duration || '',
                              free: Boolean(resource.free),
                              language: resource.language || 'en',
                              difficulty: resource.difficulty || '',
                              order: String(resource.order ?? 0),
                              verified: Boolean(resource.verified),
                            });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteResourceMutation.mutate(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">No resources attached yet.</div>
              )}
            </div>
            {selectedTopicId && editableResources.length > 1 ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                <span>Reorder resources to control the display order students see.</span>
                <Button type="button" variant="outline" className="rounded-xl">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Reorder resources
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
