import { useState } from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, EyeOff, Trash2, Loader2, BookOpen, Calendar, Clock, FileText, Link as LinkIcon, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';

type ModalType = 'module' | 'week' | 'day' | 'topic' | 'resource' | null;

export default function AdminRoadmapBuilderSimple() {
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalContext, setModalContext] = useState<any>({});

  // Fetch all careers
  const { data: careers = [], isLoading: careersLoading } = useQuery({
    queryKey: ['admin-careers'],
    queryFn: () => careerRoadmapService.listAdminCareers(),
  });

  const selectedCareer = careers.find(c => c.id === selectedCareerId);

  // Mutations
  const createCareerMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createCareer(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const createModuleMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createModule(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const createWeekMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createWeek(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const createDayMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createDay(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createTopic(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.addResource(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      careerRoadmapService.publishCareer(id, published),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteCareer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setSelectedCareerId('');
    },
  });

  // Edit mutations
  const updateCareerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateCareer(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateModule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const updateWeekMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateWeek(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateDay(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateTopic(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateResource(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  // Delete mutations for nested items
  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteModule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const deleteWeekMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteWeek(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteDay(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteResource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] }),
  });

  const toggleExpand = (type: string, id: string) => {
    const stateMap = {
      module: [expandedModules, setExpandedModules],
      week: [expandedWeeks, setExpandedWeeks],
      day: [expandedDays, setExpandedDays],
      topic: [expandedTopics, setExpandedTopics],
    } as const;

    const [state, setState] = stateMap[type as keyof typeof stateMap];
    const newSet = new Set(state);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setState(newSet);
  };

  const openModal = (type: ModalType, context: any = {}) => {
    setModalType(type);
    setModalContext(context);
  };

  const closeModal = () => {
    setModalType(null);
    setModalContext({});
  };

  const filteredCareers = careers.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Career Roadmap Builder</h1>
          <p className="text-slate-600">Create and manage complete learning paths</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Career List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Careers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Button
                  onClick={() => openModal('module', { careerId: 'new' })}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Career
                </Button>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {careersLoading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : filteredCareers.length === 0 ? (
                    <p className="text-sm text-slate-500">No careers</p>
                  ) : (
                    filteredCareers.map(career => (
                      <button
                        key={career.id}
                        onClick={() => setSelectedCareerId(career.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCareerId === career.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{career.title || career.name}</span>
                          <Badge variant={career.status === 'published' ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {career.status === 'published' ? 'Live' : 'Draft'}
                          </Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedCareerId ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">Select a career or create a new one</p>
                  <Button onClick={() => openModal('module', { careerId: 'new' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Career
                  </Button>
                </CardContent>
              </Card>
            ) : !selectedCareer ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{selectedCareer.title || selectedCareer.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-2">{selectedCareer.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant={selectedCareer.status === 'published' ? 'default' : 'outline'}
                        onClick={() =>
                          publishMutation.mutate({
                            id: selectedCareerId,
                            published: selectedCareer.status !== 'published',
                          })
                        }
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : selectedCareer.status === 'published' ? (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Delete this career? This cannot be undone.')) {
                            deleteMutation.mutate(selectedCareerId);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Add Module Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Modules</h3>
                    <Button
                      size="sm"
                      onClick={() => openModal('module', { careerId: selectedCareerId })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                  </div>

                  {/* Modules List */}
                  {!selectedCareer.modules || selectedCareer.modules.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50">
                      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-4">No modules yet</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openModal('module', { careerId: selectedCareerId })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Module
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCareer.modules.map((module, moduleIndex) => (
                        <div key={module.id} className="border rounded-lg bg-white shadow-sm">
                          <button
                            onClick={() => toggleExpand('module', module.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {expandedModules.has(module.id) ? (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
                              <div className="text-left">
                                <p className="text-xs text-slate-500 font-medium">Module {moduleIndex + 1}</p>
                                <p className="font-semibold text-slate-900">{module.title}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {module.weeks?.length || 0} weeks
                            </Badge>
                          </button>

                          {/* Weeks */}
                          {expandedModules.has(module.id) && (
                            <div className="px-4 pb-4 space-y-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal('week', { moduleId: module.id });
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Week
                              </Button>

                              {module.weeks && module.weeks.length > 0 && (
                                <div className="space-y-2 ml-4 border-l-2 border-slate-200 pl-4">
                                  {module.weeks.map((week, weekIndex) => (
                                    <div key={week.id} className="border rounded-lg bg-slate-50">
                                      <button
                                        onClick={() => toggleExpand('week', week.id)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          {expandedWeeks.has(week.id) ? (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                          )}
                                          <div className="text-left">
                                            <p className="text-xs text-slate-500">Week {weekIndex + 1}</p>
                                            <p className="text-sm font-medium text-slate-900">{week.title}</p>
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {week.days?.length || 0} days
                                        </Badge>
                                      </button>

                                      {/* Days */}
                                      {expandedWeeks.has(week.id) && (
                                        <div className="px-3 pb-3 space-y-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openModal('day', { weekId: week.id });
                                            }}
                                          >
                                            <Plus className="w-3 h-3 mr-2" />
                                            Add Day
                                          </Button>

                                          {week.days && week.days.length > 0 && (
                                            <div className="space-y-2 ml-2 border-l border-slate-200 pl-3">
                                              {week.days.map((day, dayIndex) => (
                                                <div key={day.id} className="border rounded-lg bg-white">
                                                  <button
                                                    onClick={() => toggleExpand('day', day.id)}
                                                    className="w-full px-2 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      {expandedDays.has(day.id) ? (
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                      ) : (
                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                      )}
                                                      <div className="text-left">
                                                        <p className="text-xs text-slate-500">Day {dayIndex + 1}</p>
                                                        <p className="text-sm font-medium text-slate-900">{day.title}</p>
                                                      </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                      {day.topics?.length || 0} topics
                                                    </Badge>
                                                  </button>

                                                  {/* Topics */}
                                                  {expandedDays.has(day.id) && (
                                                    <div className="px-2 pb-2 space-y-2">
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full text-xs"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          openModal('topic', { dayId: day.id });
                                                        }}
                                                      >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add Topic
                                                      </Button>

                                                      {day.topics && day.topics.length > 0 && (
                                                        <div className="space-y-1 ml-2 border-l border-slate-200 pl-2">
                                                          {day.topics.map((topic) => (
                                                            <div key={topic.id} className="border rounded bg-slate-50">
                                                              <button
                                                                onClick={() => toggleExpand('topic', topic.id)}
                                                                className="w-full px-2 py-1.5 flex items-center justify-between hover:bg-slate-100 transition-colors"
                                                              >
                                                                <div className="flex items-center gap-2">
                                                                  {expandedTopics.has(topic.id) ? (
                                                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                                                  ) : (
                                                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                                                  )}
                                                                  <p className="text-xs font-medium text-slate-900">{topic.title}</p>
                                                                </div>
                                                                <Badge variant="outline" className="text-xs">
                                                                  {topic.resources?.length || 0} resources
                                                                </Badge>
                                                              </button>

                                                              {/* Resources */}
                                                              {expandedTopics.has(topic.id) && (
                                                                <div className="px-2 pb-2 space-y-1">
                                                                  <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="w-full text-xs h-7"
                                                                    onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      openModal('resource', { topicId: topic.id });
                                                                    }}
                                                                  >
                                                                    <Plus className="w-3 h-3 mr-1" />
                                                                    Add Resource
                                                                  </Button>

                                                                  {topic.resources && topic.resources.length > 0 && (
                                                                    <div className="space-y-1 ml-1">
                                                                      {topic.resources.map((resource) => (
                                                                        <div
                                                                          key={resource.id}
                                                                          className="px-2 py-1 bg-white border rounded text-xs"
                                                                        >
                                                                          <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                              <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                                                              <span className="font-medium truncate">{resource.title}</span>
                                                                            </div>
                                                                            <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                                                              {resource.type}
                                                                            </Badge>
                                                                          </div>
                                                                          <p className="text-xs text-slate-500 mt-0.5 truncate">{resource.url}</p>
                                                                        </div>
                                                                      ))}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status Info */}
                  <div className={`rounded-lg p-4 ${selectedCareer.status === 'published' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-sm ${selectedCareer.status === 'published' ? 'text-green-900' : 'text-blue-900'}`}>
                      <strong>Status:</strong>{' '}
                      {selectedCareer.status === 'published'
                        ? 'Published - Students can see this roadmap'
                        : 'Draft - Students cannot see this yet. Add content and publish when ready.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalType && <ModalRenderer type={modalType} context={modalContext} onClose={closeModal} />}
    </div>
  );
}

// Modal Renderer Component
function ModalRenderer({ type, context, onClose }: { type: ModalType; context: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const mutations = {
    module: useMutation({
      mutationFn: (data: any) => {
        if (context.careerId === 'new') {
          return careerRoadmapService.createCareer({
            name: data.title,
            description: data.description,
            status: 'draft',
          });
        }
        return careerRoadmapService.createModule({
          careerId: context.careerId,
          title: data.title,
          description: data.description,
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
        onClose();
      },
    }),
    week: useMutation({
      mutationFn: (data: any) =>
        careerRoadmapService.createWeek({
          moduleId: context.moduleId,
          weekNumber: data.weekNumber || 1,
          title: data.title,
          description: data.description,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
        onClose();
      },
    }),
    day: useMutation({
      mutationFn: (data: any) =>
        careerRoadmapService.createDay({
          weekId: context.weekId,
          dayNumber: data.dayNumber || 1,
          title: data.title,
          description: data.description,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
        onClose();
      },
    }),
    topic: useMutation({
      mutationFn: (data: any) =>
        careerRoadmapService.createTopic({
          dayId: context.dayId,
          title: data.title,
          description: data.description,
          objective: data.objective,
          order: 0,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
        onClose();
      },
    }),
    resource: useMutation({
      mutationFn: (data: any) =>
        careerRoadmapService.addResource({
          topicId: context.topicId,
          title: data.title,
          url: data.url,
          provider: data.provider || 'Unknown',
          type: data.type || 'DOCUMENTATION',
          free: data.free !== false,
          verified: data.verified === true,
          language: data.language || 'English',
          difficulty: data.difficulty || 'Beginner',
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
        onClose();
      },
    }),
  };

  const mutation = mutations[type as keyof typeof mutations];

  const handleSubmit = () => {
    if (!formData.title) {
      alert('Title is required');
      return;
    }
    mutation.mutate(formData);
  };

  const labels = {
    module: context.careerId === 'new' ? 'Create Career' : 'Add Module',
    week: 'Add Week',
    day: 'Add Day',
    topic: 'Add Topic',
    resource: 'Add Resource',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{labels[type as keyof typeof labels]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title *
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter title"
            />
          </div>

          {type !== 'resource' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          )}

          {type === 'resource' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL *
                </label>
                <Input
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Provider
                </label>
                <Input
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., MDN, Coursera, YouTube"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <Select
                  value={formData.type || 'DOCUMENTATION'}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="ARTICLE">Article</SelectItem>
                    <SelectItem value="PRACTICE">Practice</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                    <SelectItem value="BOOK">Book</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Difficulty
                </label>
                <Select
                  value={formData.difficulty || 'Beginner'}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.free !== false}
                    onChange={(e) => setFormData({ ...formData, free: e.target.checked })}
                  />
                  Free
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.verified === true}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  />
                  Verified
                </label>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {context.careerId === 'new' ? 'Create' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
