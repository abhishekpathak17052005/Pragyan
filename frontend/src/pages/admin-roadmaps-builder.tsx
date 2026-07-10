import { useState, useMemo, useCallback, useEffect } from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAutoSave } from '@/hooks/useAutoSave';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import type { CareerRoadmap, CareerRoadmapModule, CareerRoadmapWeek, CareerRoadmapDay, CareerRoadmapTopic, CareerRoadmapResource } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { 
  Plus, Search, Trash2, ChevronDown, ChevronRight, Edit2, Copy, Eye, EyeOff,
  BookOpen, Loader2, Save, X, GripVertical
} from 'lucide-react';
import { CareerModal } from '@/components/roadmap-builder/CareerModal';
import { ModuleModal, WeekModal, DayModal, TopicModal, ResourceModal } from '@/components/roadmap-builder/HierarchyModals';

// ============ MAIN PAGE ============

export default function AdminRoadmapBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const [contextIds, setContextIds] = useState<{
    moduleId?: string;
    weekId?: string;
    dayId?: string;
    topicId?: string;
  }>({});

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch all careers
  const { data: careers = [], isLoading: careersLoading } = useQuery({
    queryKey: ['admin-careers-full'],
    queryFn: () => careerRoadmapService.listAdminCareers(),
    retry: false,
  });

  // Fetch selected career with full hierarchy
  const { data: selectedCareer, isLoading: careerLoading } = useQuery({
    queryKey: ['career-full', selectedCareerId],
    queryFn: () => {
      if (!selectedCareerId) return null;
      return careerRoadmapService.getCareerWithProgress(selectedCareerId);
    },
    enabled: Boolean(selectedCareerId),
    retry: false,
  });

  // Auto-select first career
  if (careers.length > 0 && !selectedCareerId) {
    setTimeout(() => setSelectedCareerId(careers[0].id), 0);
  }

  const filteredCareers = useMemo(() => {
    if (!searchQuery) return careers;
    return careers.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [careers, searchQuery]);

  // Mutations
  const createCareerMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createCareer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers-full'] });
      setToast({ message: 'Career created successfully', type: 'success' });
      setCareerModalOpen(false);
    },
    onError: () => {
      setToast({ message: 'Failed to create career', type: 'error' });
    },
  });

  const publishCareerMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.publishCareer(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-full', selectedCareerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-careers-full'] });
      setToast({ message: 'Career published successfully', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Failed to publish career', type: 'error' });
    },
  });

  const unpublishCareerMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.publishCareer(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-full', selectedCareerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-careers-full'] });
      setToast({ message: 'Career unpublished', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Failed to unpublish career', type: 'error' });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-full', selectedCareerId] });
      setModuleModalOpen(false);
      setToast({ message: 'Module added successfully', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Failed to add module', type: 'error' });
    },
  });

  // Auto-save career updates
  const { autoSave: autoSaveCareer, isSaving: isAutoSaving } = useAutoSave(
    async (career: CareerRoadmap) => {
      return careerRoadmapService.updateCareer(career.id, {
        title: career.title,
        description: career.description,
      });
    },
    1500 // Wait 1.5s before saving
  );

  // Auto-save when career title/description changes
  useEffect(() => {
    if (selectedCareer) {
      autoSaveCareer(selectedCareer);
    }
  }, [selectedCareer?.title, selectedCareer?.description]);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* ============ SIDEBAR ============ */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Roadmaps
          </h1>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>
        </div>

        {/* New Button */}
        <div className="p-3 border-b border-slate-200">
          <Button 
            onClick={() => setCareerModalOpen(true)} 
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-9"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            New Career
          </Button>
        </div>

        {/* Career List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCareers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No careers found</p>
          ) : (
            filteredCareers.map(career => (
              <button
                key={career.id}
                onClick={() => setSelectedCareerId(career.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCareerId === career.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex-1 truncate">{career.title}</div>
                <Badge 
                  variant={career.status === 'published' ? 'default' : 'secondary'} 
                  className="text-xs shrink-0"
                >
                  {career.status === 'published' ? 'Live' : 'Draft'}
                </Badge>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ============ MAIN EDITOR ============ */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {!selectedCareer ? (
          <div className="flex items-center justify-center h-full text-slate-600">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p>Select a career to begin editing</p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            {/* Career Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{selectedCareer.title}</h1>
                    <p className="text-slate-600 mt-1">{selectedCareer.description}</p>
                    {isAutoSaving && <p className="text-xs text-slate-500 mt-2">Saving...</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={selectedCareer.status === 'published' ? 'default' : 'outline'}
                      onClick={() => {
                        if (selectedCareer.status === 'published') {
                          unpublishCareerMutation.mutate(selectedCareer.id);
                        } else {
                          publishCareerMutation.mutate(selectedCareer.id);
                        }
                      }}
                      disabled={publishCareerMutation.isPending || unpublishCareerMutation.isPending}
                      size="sm"
                    >
                      {publishCareerMutation.isPending || unpublishCareerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : selectedCareer.status === 'published' ? (
                        <Eye className="w-4 h-4 mr-2" />
                      ) : (
                        <EyeOff className="w-4 h-4 mr-2" />
                      )}
                      {selectedCareer.status === 'published' ? 'Published' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Modules Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Learning Modules</h2>
                <Button 
                  onClick={() => {
                    setContextIds({ });
                    setModuleModalOpen(true);
                  }}
                  size="sm" 
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </Button>
              </div>

              {careerLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : selectedCareer.modules && selectedCareer.modules.length > 0 ? (
                <div className="space-y-3">
                  {selectedCareer.modules.map((module) => (
                    <ModuleCardComponent key={module.id} module={module} />
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-50 border-dashed">
                  <CardContent className="py-12 text-center text-slate-600">
                    No modules yet. Create one to get started.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}
      <CareerModal
        isOpen={careerModalOpen}
        isLoading={createCareerMutation.isPending}
        onClose={() => setCareerModalOpen(false)}
        onSave={(data) => createCareerMutation.mutate(data)}
      />

      <ModuleModal
        isOpen={moduleModalOpen}
        isLoading={createModuleMutation.isPending}
        onClose={() => setModuleModalOpen(false)}
        onSave={(data) => {
          if (selectedCareerId) {
            createModuleMutation.mutate({ careerId: selectedCareerId, ...data });
          }
        }}
      />

      <ModuleModal
        isOpen={moduleModalOpen}
        isLoading={createModuleMutation.isPending}
        onClose={() => setModuleModalOpen(false)}
        onSave={(data) => {
          if (selectedCareerId) {
            createModuleMutation.mutate({ careerId: selectedCareerId, ...data });
          }
        }}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ============ MODULE CARD COMPONENT ============

function ModuleCardComponent({ module }: { module: CareerRoadmapModule }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-200"
      >
        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
        <div className="flex-1">
          <p className="text-xs text-slate-600 font-medium">Module {module.order + 1}</p>
          <h3 className="font-semibold text-slate-900">{module.title}</h3>
          {module.description && <p className="text-sm text-slate-600 mt-1">{module.description}</p>}
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </button>

      {isExpanded && module.weeks && module.weeks.length > 0 && (
        <CardContent className="pt-4 space-y-3">
          {module.weeks.map((week) => (
            <WeekCardComponent key={week.id} week={week} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function WeekCardComponent({ week }: { week: CareerRoadmapWeek }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-slate-50 border-l-4 border-l-blue-500">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3 flex items-center gap-2"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <p className="font-medium text-slate-900">{week.title}</p>
      </button>

      {isExpanded && week.days && week.days.length > 0 && (
        <CardContent className="pt-0 pb-3 space-y-2">
          {week.days.map((day) => (
            <DayCardComponent key={day.id} day={day} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function DayCardComponent({ day }: { day: CareerRoadmapDay }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-300 rounded-lg bg-white p-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <p className="text-sm font-medium">{day.title}</p>
      </button>

      {isExpanded && day.topics && day.topics.length > 0 && (
        <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-200 pl-2">
          {day.topics.map((topic) => (
            <TopicCardComponent key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicCardComponent({ topic }: { topic: CareerRoadmapTopic }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="text-sm">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 font-medium text-slate-900">
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {topic.title}
      </button>

      {isExpanded && topic.resources && topic.resources.length > 0 && (
        <div className="mt-1 ml-4 space-y-1">
          {topic.resources.map((resource) => (
            <div key={resource.id} className="text-xs p-1 bg-blue-50 rounded border border-blue-200 flex items-center justify-between">
              <span className="truncate">{resource.title}</span>
              <span className="text-blue-600 font-medium ml-2 shrink-0">{resource.provider}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
