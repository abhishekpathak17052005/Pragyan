import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, EyeOff, Trash2, Loader2, BookOpen, Edit2, ChevronDown, ChevronRight, Link as LinkIcon } from 'lucide-react';

type ModalType = 'module' | 'week' | 'day' | 'topic' | 'resource' | null;

export default function AdminRoadmapBuilderFinal() {
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalContext, setModalContext] = useState<any>({});

  const { data: careers = [], isLoading: careersLoading } = useQuery({
    queryKey: ['admin-careers'],
    queryFn: () => careerRoadmapService.listAdminCareers(),
  });

  const selectedCareer = careers.find(c => c.id === selectedCareerId);

  // Create mutations
  const createCareerMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createCareer(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createModule(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const createWeekMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createWeek(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const createDayMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createDay(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createTopic(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.addResource(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  // Update mutations
  const updateCareerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateCareer(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateModule(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const updateWeekMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateWeek(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateDay(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateTopic(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => careerRoadmapService.updateResource(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  // Delete mutations
  const deleteCareerMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteCareer(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); setSelectedCareerId(''); },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteModule(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const deleteWeekMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteWeek(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteDay(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteTopic(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteResource(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-careers'] }); },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => careerRoadmapService.publishCareer(id, published),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      console.log('✅ Career published successfully');
    },
    onError: (error: any) => {
      console.error('❌ Error publishing career:', error);
      alert(`Error publishing career: ${error?.message || 'Unknown error'}`);
    },
  });

  const toggleExpand = (type: 'module' | 'week' | 'day' | 'topic', id: string) => {
    const stateMap = {
      module: [expandedModules, setExpandedModules],
      week: [expandedWeeks, setExpandedWeeks],
      day: [expandedDays, setExpandedDays],
      topic: [expandedTopics, setExpandedTopics],
    } as const;

    const [state, setState] = stateMap[type];
    const newSet = new Set(state);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Roadmap Builder</h1>
          <p className="text-slate-600">Create and manage learning paths with full edit/delete capability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Careers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Button onClick={() => openModal('module', { careerId: 'new' })} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> New Career
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await careerRoadmapService.fixResourceTitles();
                      const data = await response.json?.() || response;
                      alert(`✅ Fixed ${data.data?.fixed || data.fixed} resource titles!`);
                      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
                    } catch (error: any) {
                      alert(`❌ Error: ${error.message}`);
                    }
                  }}
                  variant="outline"
                  className="w-full text-xs"
                >
                  🔧 Fix Resource Titles
                </Button>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCareers.map(career => (
                    <button
                      key={career.id}
                      onClick={() => setSelectedCareerId(career.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCareerId === career.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate flex-1">{career.title || career.name}</span>
                        <Badge variant={career.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {career.status === 'published' ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                    </button>
                  ))}
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
                  <p className="text-slate-600 mb-4">Select or create a career</p>
                </CardContent>
              </Card>
            ) : !selectedCareer ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{selectedCareer.title || selectedCareer.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-2">{selectedCareer.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedCareer.status === 'published' ? 'default' : 'outline'}
                        onClick={() => {
                          console.log('Publishing:', { id: selectedCareerId, published: selectedCareer.status !== 'published' });
                          publishMutation.mutate({ id: selectedCareerId, published: selectedCareer.status !== 'published' });
                        }}
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : (selectedCareer.status === 'published' ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />)}
                        {selectedCareer.status === 'published' ? 'Published' : 'Publish'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openModal('module', { careerId: selectedCareerId, isEdit: true, data: selectedCareer })}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { if (confirm('Delete?')) deleteCareerMutation.mutate(selectedCareerId); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Modules</h3>
                    <Button size="sm" onClick={() => openModal('module', { careerId: selectedCareerId })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Module
                    </Button>
                  </div>

                  {!selectedCareer.modules?.length ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-slate-600">No modules yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCareer.modules.map((module, idx) => (
                        <div key={module.id} className="border rounded-lg bg-white">
                          <button
                            onClick={() => toggleExpand('module', module.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {expandedModules.has(module.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <div className="text-left">
                                <p className="text-xs text-slate-500">Module {idx + 1}</p>
                                <p className="font-semibold">{module.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{module.weeks?.length || 0} weeks</Badge>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openModal('module', { careerId: selectedCareerId, moduleId: module.id, isEdit: true, data: module }); }}>
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteModuleMutation.mutate(module.id); }}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </button>

                          {expandedModules.has(module.id) && (
                            <div className="px-4 pb-4 space-y-2 border-t">
                              <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => openModal('week', { moduleId: module.id })}>
                                <Plus className="w-3 h-3 mr-2" /> Add Week
                              </Button>
                              {module.weeks?.map((week, widx) => (
                                <div key={week.id} className="border rounded bg-slate-50 p-3">
                                  <button className="w-full flex justify-between items-center" onClick={() => toggleExpand('week', week.id)}>
                                    <div className="flex items-center gap-2">
                                      {expandedWeeks.has(week.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                      <div className="text-left">
                                        <p className="text-xs text-slate-500">Week {widx + 1}</p>
                                        <p className="text-sm font-semibold">{week.title}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openModal('week', { moduleId: module.id, weekId: week.id, isEdit: true, data: week }); }}>
                                        <Edit2 className="w-3 h-3 text-blue-600" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteWeekMutation.mutate(week.id); }}>
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                      </Button>
                                    </div>
                                  </button>

                                  {expandedWeeks.has(week.id) && (
                                    <div className="ml-6 mt-2 space-y-1">
                                      <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => openModal('day', { weekId: week.id })}>
                                        <Plus className="w-3 h-3 mr-1" /> Add Day
                                      </Button>
                                      {week.days?.map((day, didx) => (
                                        <div key={day.id} className="border rounded bg-white p-2 text-xs">
                                          <button className="w-full flex justify-between items-center" onClick={() => toggleExpand('day', day.id)}>
                                            <div className="flex items-center gap-1">
                                              {expandedDays.has(day.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                              <span className="font-semibold">{day.title}</span>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); openModal('day', { weekId: week.id, dayId: day.id, isEdit: true, data: day }); }}>
                                                <Edit2 className="w-2 h-2 text-blue-600" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteDayMutation.mutate(day.id); }}>
                                                <Trash2 className="w-2 h-2 text-red-600" />
                                              </Button>
                                            </div>
                                          </button>

                                          {expandedDays.has(day.id) && (
                                            <div className="ml-4 mt-1 space-y-1">
                                              <Button size="sm" variant="outline" className="w-full text-xs h-6" onClick={() => openModal('topic', { dayId: day.id })}>
                                                <Plus className="w-2 h-2 mr-1" /> Topic
                                              </Button>
                                              {day.topics?.map(topic => (
                                                <div key={topic.id} className="border rounded bg-slate-50 p-1 text-xs">
                                                  <button className="w-full flex justify-between items-center" onClick={() => toggleExpand('topic', topic.id)}>
                                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                                      {expandedTopics.has(topic.id) ? <ChevronDown className="w-2 h-2 shrink-0" /> : <ChevronRight className="w-2 h-2 shrink-0" />}
                                                      <span className="font-semibold truncate">{topic.title}</span>
                                                    </div>
                                                    <div className="flex gap-0.5 shrink-0 ml-1">
                                                      <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={(e) => { e.stopPropagation(); openModal('topic', { dayId: day.id, topicId: topic.id, isEdit: true, data: topic }); }}>
                                                        <Edit2 className="w-2 h-2 text-blue-600" />
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteTopicMutation.mutate(topic.id); }}>
                                                        <Trash2 className="w-2 h-2 text-red-600" />
                                                      </Button>
                                                    </div>
                                                  </button>

                                                  {expandedTopics.has(topic.id) && (
                                                    <div className="ml-3 mt-0.5 space-y-0.5">
                                                      <Button size="sm" variant="outline" className="w-full text-xs h-5" onClick={() => openModal('resource', { topicId: topic.id })}>
                                                        <Plus className="w-2 h-2 mr-0.5" /> Resource
                                                      </Button>
                                                      {topic.resources?.map(resource => (
                                                        <div key={resource.id} className="px-1 py-0.5 bg-white rounded border text-xs flex justify-between items-center">
                                                          <div className="flex items-center gap-1 flex-1 min-w-0">
                                                            <LinkIcon className="w-2 h-2 shrink-0" />
                                                            <span className="truncate">{resource.title}</span>
                                                          </div>
                                                          <div className="flex gap-0.5 shrink-0 ml-1">
                                                            <Button size="sm" variant="ghost" className="h-3 w-3 p-0" onClick={() => openModal('resource', { topicId: topic.id, resourceId: resource.id, isEdit: true, data: resource })}>
                                                              <Edit2 className="w-1.5 h-1.5 text-blue-600" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-3 w-3 p-0" onClick={() => { if (confirm('Delete?')) deleteResourceMutation.mutate(resource.id); }}>
                                                              <Trash2 className="w-1.5 h-1.5 text-red-600" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <Modal
          type={modalType}
          context={modalContext}
          onClose={closeModal}
          mutations={{
            module: { create: createModuleMutation, update: updateModuleMutation },
            week: { create: createWeekMutation, update: updateWeekMutation },
            day: { create: createDayMutation, update: updateDayMutation },
            topic: { create: createTopicMutation, update: updateTopicMutation },
            resource: { create: createResourceMutation, update: updateResourceMutation },
          }}
        />
      )}
    </div>
  );
}

function Modal({ type, context, onClose, mutations }: any) {
  const [formData, setFormData] = useState<any>(context.data || {});

  const mutation = context.isEdit ? mutations[type]?.update : mutations[type]?.create;
  const isEdit = context.isEdit || false;

  const handleSubmit = async () => {
    // For resources, title is auto-generated so don't require it
    if (type !== 'resource' && !formData.title) {
      alert('Title is required');
      return;
    }

    try {
      if (isEdit && context[`${type}Id`]) {
        let editPayload: any = {};
        
        // For resources, don't include title (it's auto-generated)
        if (type === 'resource') {
          // Only send fields that were provided
          if (formData.url) editPayload.url = formData.url;
          if (formData.provider) editPayload.provider = formData.provider;
          if (formData.type) editPayload.type = formData.type;
          if (formData.description) editPayload.description = formData.description;
        } else {
          // For other types, include title
          editPayload.title = formData.title;
          
          // For week edits, ensure weekNumber is present and is a number
          if (type === 'week') {
            if (formData.weekNumber) {
              editPayload.weekNumber = typeof formData.weekNumber === 'string' 
                ? parseInt(formData.weekNumber) 
                : formData.weekNumber;
            }
            // Don't include description for weeks
          } else if (type === 'day') {
            if (formData.description) editPayload.description = formData.description;
            if (formData.dayNumber) editPayload.dayNumber = formData.dayNumber;
            if (formData.estimatedHours) editPayload.estimatedHours = formData.estimatedHours;
          } else if (type === 'topic') {
            if (formData.description) editPayload.description = formData.description;
            if (formData.objective) editPayload.objective = formData.objective;
            if (formData.difficulty) editPayload.difficulty = formData.difficulty;
            if (formData.estimatedTime) editPayload.estimatedTime = formData.estimatedTime;
            if (formData.order !== undefined) editPayload.order = formData.order;
            if (formData.quizUrl) editPayload.quizUrl = formData.quizUrl;
            if (formData.miniProjectUrl) editPayload.miniProjectUrl = formData.miniProjectUrl;
          } else {
            if (formData.description) editPayload.description = formData.description;
          }
        }
        
        console.log('Updating with payload:', { type, editPayload });
        await mutation.mutateAsync({ id: context[`${type}Id`], data: editPayload });
      } else {
        let payload: any = { ...formData };
        
        if (type === 'week') {
          if (!context.moduleId) {
            alert('Error: Module ID not found. Please refresh and try again.');
            return;
          }
          payload.moduleId = context.moduleId;
          payload.weekNumber = parseInt(formData.weekNumber) || 1;
        } else if (type === 'day') {
          if (!context.weekId) {
            alert('Error: Week ID not found. Please refresh and try again.');
            return;
          }
          payload.weekId = context.weekId;
          payload.dayNumber = parseInt(formData.dayNumber) || 1;
        } else if (type === 'topic') {
          if (!context.dayId) {
            alert('Error: Day ID not found. Please refresh and try again.');
            return;
          }
          payload.dayId = context.dayId;
          // Don't set order - let backend auto-calculate based on existing topics
        } else if (type === 'resource') {
          if (!context.topicId) {
            alert('Error: Topic ID not found. Please refresh and try again.');
            return;
          }
          if (!formData.url) {
            alert('URL is required for resources');
            return;
          }
          payload.topicId = context.topicId;
          payload.type = formData.type || 'DOCUMENTATION';
          payload.url = formData.url;
          payload.provider = formData.provider || 'Unknown';
          payload.free = formData.free !== false;
        }
        
        console.log('Creating payload:', { type, payload, context });
        await mutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating item:', err);
      alert(`Error: ${err?.message || 'Failed to create item'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit' : 'Add'} {type.charAt(0).toUpperCase() + type.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {type !== 'resource' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <Input value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter title" />
            </div>
          )}

          {type !== 'resource' && type !== 'week' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" rows={3} />
            </div>
          )}

          {type === 'resource' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL *</label>
                <Input value={formData.url || ''} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <Input value={formData.provider || ''} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} placeholder="e.g., MDN, YouTube" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <Select value={formData.type || 'DOCUMENTATION'} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation?.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={mutation?.isPending}>
              {mutation?.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update' : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
