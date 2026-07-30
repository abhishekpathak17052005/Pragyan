import { useState, useCallback, useMemo, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import type { CareerRoadmap } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, BookOpen, AlertCircle, Copy, Download, Edit2, RefreshCw, X } from 'lucide-react';

type ModalType = 'career' | 'module' | null;

interface ModalData {
  id?: string;
  title: string;
  description?: string;
  duration?: number;
}

type CareerCardProps = {
  career: CareerRoadmap;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
};

const isPublished = (career?: Pick<CareerRoadmap, 'approved' | 'status'> | null) =>
  Boolean(career?.approved || career?.status === 'published');

const getCareerTitle = (career: Pick<CareerRoadmap, 'title' | 'name'>) => career.title || career.name;

const isLegacyRoadmap = (career?: CareerRoadmap | null) =>
  career?.source === 'legacy-roadmap';

const formatDate = (value?: string) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString();
};

const stripAnsiCodes = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, '');

const isMissingDeleteError = (message: string) =>
  /no record was found for a delete|record.*delete.*not found|depends on one or more records/i.test(message);

const getErrorMessage = (error: unknown, fallback: string) => {
  const normalize = (message?: string) => {
    const cleaned = stripAnsiCodes(message || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return fallback;
    if (/prisma\./i.test(cleaned) || isMissingDeleteError(cleaned)) return fallback;
    return cleaned;
  };

  if (error instanceof Error) return normalize(error.message);
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    return normalize(maybeError.response?.data?.message || maybeError.message);
  }
  return fallback;
};

const CareerCard = memo(({ career, isSelected, isChecked, onSelect, onToggleCheck }: CareerCardProps) => (
  <div
    className={`w-full min-w-0 p-3 rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
      isSelected
        ? 'bg-purple-100 border border-purple-300'
        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
    }`}
    onClick={onSelect}
  >
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleCheck();
      }}
      className="mt-0.5 flex-shrink-0"
      aria-label={`${isChecked ? 'Deselect' : 'Select'} ${getCareerTitle(career)}`}
      type="button"
    >
      <Checkbox checked={isChecked} aria-hidden />
    </button>
    <div className="min-w-0 flex-1">
      <div className="font-medium text-sm leading-5 break-words line-clamp-2">{getCareerTitle(career)}</div>
      <div className="text-xs text-muted-foreground mt-1 break-words">
        {career.totalWeeks} weeks - {career.modules?.length || 0} modules
      </div>
      <Badge className="mt-2 text-xs" variant={isPublished(career) ? 'default' : 'secondary'}>
        {isLegacyRoadmap(career) ? 'Legacy' : isPublished(career) ? 'Published' : 'Draft'}
      </Badge>
    </div>
  </div>
));

export default function AdminRoadmapBuilderOptimized() {
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData>({ title: '' });
  const [modalError, setModalError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCareers, setSelectedCareers] = useState<Set<string>>(new Set());
  const [removedCareerIds, setRemovedCareerIds] = useState<Set<string>>(new Set());

  // Queries with caching
  const { data: careers = [], isLoading: careersLoading, isFetching: careersFetching, refetch: refetchCareers } = useQuery({
    queryKey: ['admin-careers'],
    queryFn: () => careerRoadmapService.listAdminCareers(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: 'always',
  });

  const visibleCareers = useMemo(
    () => careers.filter((career) => !removedCareerIds.has(career.id)),
    [careers, removedCareerIds]
  );

  const selectedCareer = useMemo(() => visibleCareers.find(c => c.id === selectedCareerId), [visibleCareers, selectedCareerId]);
  
  const filteredCareers = useMemo(() => 
    visibleCareers.filter(c => 
      getCareerTitle(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [visibleCareers, searchQuery]
  );

  const removeCareersFromUi = useCallback((ids: string[]) => {
    const idSet = new Set(ids);

    setRemovedCareerIds((previous) => new Set([...previous, ...ids]));
    setSelectedCareerId((current) => (idSet.has(current) ? '' : current));
    setSelectedCareers((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    queryClient.setQueryData<CareerRoadmap[]>(['admin-careers'], (current = []) =>
      current.filter((career) => !idSet.has(career.id))
    );
  }, [queryClient]);

  // Mutations
  const createCareerMutation = useMutation({
    mutationFn: (data: Parameters<typeof careerRoadmapService.createCareer>[0]) => careerRoadmapService.createCareer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setError('');
      setSuccess('Career created successfully');
      setModalType(null);
      setModalData({ title: '' });
      setModalError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown) => {
      setModalError(getErrorMessage(err, 'Failed to create career. Please try again.'));
      console.error('Create career error:', err);
    },
  });

  const updateCareerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof careerRoadmapService.updateCareer>[1] }) =>
      careerRoadmapService.updateCareer(id, data),
    onSuccess: (updatedCareer) => {
      queryClient.setQueryData<CareerRoadmap[]>(['admin-careers'], (current = []) =>
        current.map((career) =>
          career.id === updatedCareer.id
            ? { ...career, ...updatedCareer, modules: career.modules, weeks: career.weeks }
            : career
        )
      );
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setError('');
      setSuccess('Career updated successfully');
      setModalType(null);
      setModalData({ title: '' });
      setModalError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown) => {
      setModalError(getErrorMessage(err, 'Failed to update career. Please try again.'));
      console.error('Update career error:', err);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.publishCareer(id, !isPublished(selectedCareer)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setError('');
      setSuccess(`Career ${isPublished(selectedCareer) ? 'unpublished' : 'published'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to publish career'));
      console.error('Publish career error:', err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteCareer(id),
    onSuccess: (_result, deletedId) => {
      removeCareersFromUi([deletedId]);
      setError('');
      setSuccess('Career deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown, deletedId) => {
      const message = stripAnsiCodes(err instanceof Error ? err.message : '').replace(/\s+/g, ' ');
      if (isMissingDeleteError(message)) {
        removeCareersFromUi([deletedId]);
        setError('');
        setSuccess('That roadmap was removed from the list.');
        setTimeout(() => setSuccess(''), 3000);
        return;
      }
      setError(getErrorMessage(err, 'Unable to delete this roadmap. Refresh the list and try again.'));
      console.error('Delete career error:', err);
    },
  });

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map(id => careerRoadmapService.deleteCareer(id))
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} out of ${ids.length} careers`);
      }
      
      return results;
    },
    onSuccess: () => {
      const count = selectedCareers.size;
      removeCareersFromUi(Array.from(selectedCareers));
      setError('');
      setSuccess(`${count} career/careers deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to delete some careers'));
      console.error('Bulk delete error:', err);
    },
  });

  const bulkDuplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const career = visibleCareers.find(c => c.id === id);
      if (!career) {
        throw new Error('Career not found in local cache');
      }
      
      return careerRoadmapService.createCareer({
        name: `${getCareerTitle(career)} (Copy)`,
        description: career.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setError('');
      setSuccess('Career duplicated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to duplicate career'));
      console.error('Duplicate career error:', err);
    },
  });

  const canMutateSelectedCareer = selectedCareer && !isLegacyRoadmap(selectedCareer);
  const selectedCareerItems = useMemo(
    () => visibleCareers.filter((career) => selectedCareers.has(career.id)),
    [visibleCareers, selectedCareers]
  );
  const canBulkDeleteSelectedCareers = selectedCareerItems.length > 0 && selectedCareerItems.every((career) => !isLegacyRoadmap(career));

  // Handlers
  const toggleCareerSelection = useCallback((careerId: string) => {
    setSelectedCareers(prev => {
      const next = new Set(prev);
      next.has(careerId) ? next.delete(careerId) : next.add(careerId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCareers.size === filteredCareers.length) {
      setSelectedCareers(new Set());
    } else {
      setSelectedCareers(new Set(filteredCareers.map(c => c.id)));
    }
  }, [filteredCareers, selectedCareers.size]);

  const handleSaveCareer = useCallback(async () => {
    try {
      setModalError('');
      
      // Validation
      const titleTrimmed = modalData.title?.trim();
      if (!titleTrimmed) {
        setModalError('Career title is required');
        return;
      }

      if (titleTrimmed.length < 3) {
        setModalError('Career title must be at least 3 characters');
        return;
      }

      if (titleTrimmed.length > 100) {
        setModalError('Career title must be less than 100 characters');
        return;
      }

      const descTrimmed = modalData.description?.trim();
      if (!descTrimmed) {
        setModalError('Description is required');
        return;
      }

      if (descTrimmed.length < 10) {
        setModalError('Description must be at least 10 characters');
        return;
      }

      if (descTrimmed.length > 500) {
        setModalError('Description must be less than 500 characters');
        return;
      }

      // Check for duplicates
      const isDuplicate = visibleCareers.some(c => 
        c.id !== modalData.id && getCareerTitle(c).toLowerCase().trim() === titleTrimmed.toLowerCase()
      );
      
      if (isDuplicate) {
        setModalError(`A career with title "${titleTrimmed}" already exists`);
        return;
      }

      if (modalData.id) {
        await updateCareerMutation.mutateAsync({
          id: modalData.id,
          data: {
            title: titleTrimmed,
            name: titleTrimmed,
            description: descTrimmed,
          },
        });
        return;
      }

      await createCareerMutation.mutateAsync({
        name: titleTrimmed,
        description: descTrimmed,
        status: 'draft',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setModalError(`Failed to ${modalData.id ? 'update' : 'create'} career: ${message}`);
    }
  }, [modalData, createCareerMutation, updateCareerMutation, visibleCareers]);

  const handleExportCareer = useCallback((career: CareerRoadmap) => {
    const data = JSON.stringify(career, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${career.slug || career.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setModalData({ title: '' });
    setModalError('');
  }, []);

  const handleOpenCreateCareer = useCallback(() => {
    setModalData({ title: '' });
    setModalError('');
    setModalType('career');
  }, []);

  const handleOpenEditCareer = useCallback((career: CareerRoadmap) => {
    setModalData({
      id: career.id,
      title: getCareerTitle(career),
      description: career.description,
    });
    setModalError('');
    setModalType('career');
  }, []);

  const isCareerModalSaving = createCareerMutation.isPending || updateCareerMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-600" />
            Roadmap Builder
          </h1>
          <p className="text-slate-600 mt-2">Create and manage learning paths efficiently</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start animate-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 text-sm text-red-700">{error}</div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="-mr-2 -mt-2 h-8 w-8 p-0 text-red-700 hover:bg-red-100"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 animate-in">
            Success: {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Careers List */}
          <Card className="min-w-0 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <CardTitle className="min-w-0 text-lg">
                  Careers ({visibleCareers.length})
                  {searchQuery && filteredCareers.length !== visibleCareers.length && (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {filteredCareers.length} shown
                    </span>
                  )}
                </CardTitle>
                  {selectedCareers.size > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {selectedCareers.size} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Search careers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button 
                  className="w-full gap-2" 
                  onClick={handleOpenCreateCareer}
                  disabled={createCareerMutation.isPending}
                >
                  <Plus className="w-4 h-4" />
                  New Career
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => refetchCareers()}
                  disabled={careersFetching}
                >
                  <RefreshCw className={`w-4 h-4 ${careersFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedCareers.size > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={handleSelectAll}
                  >
                    {selectedCareers.size === filteredCareers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full gap-1 text-xs"
                    onClick={() => {
                      if (confirm(`Delete ${selectedCareers.size} career/careers? This cannot be undone.`)) {
                        bulkDeleteMutation.mutate(Array.from(selectedCareers));
                      }
                    }}
                    disabled={bulkDeleteMutation.isPending || !canBulkDeleteSelectedCareers}
                    title={!canBulkDeleteSelectedCareers ? 'Legacy roadmaps are read-only in this builder' : undefined}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete ({selectedCareers.size})
                  </Button>
                </div>
              )}

              {/* Career List */}
              <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden pr-1">
                {careersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : filteredCareers.length === 0 ? (
                  <div className="py-4 text-sm text-muted-foreground">
                    {visibleCareers.length > 0 ? (
                      <>
                        <p>No careers match "{searchQuery}".</p>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </Button>
                      </>
                    ) : (
                      <p>No careers found</p>
                    )}
                  </div>
                ) : (
                  filteredCareers.map(career => (
                    <CareerCard
                      key={career.id}
                      career={career}
                      isSelected={selectedCareerId === career.id}
                      isChecked={selectedCareers.has(career.id)}
                      onSelect={() => setSelectedCareerId(career.id)}
                      onToggleCheck={() => toggleCareerSelection(career.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Area - Career Details */}
          <Card className="min-w-0 lg:col-span-3">
            <CardHeader className="pb-4 border-b">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="min-w-0 break-words text-lg">
                  {selectedCareer ? getCareerTitle(selectedCareer) : 'Select a career to get started'}
                </CardTitle>
                {selectedCareer && (
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportCareer(selectedCareer)}
                      disabled={false}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => bulkDuplicateMutation.mutate(selectedCareer.id)}
                      disabled={bulkDuplicateMutation.isPending}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditCareer(selectedCareer)}
                      disabled={!canMutateSelectedCareer || updateCareerMutation.isPending}
                      title={!canMutateSelectedCareer ? 'Legacy roadmaps are read-only in this builder' : 'Edit career'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isPublished(selectedCareer) ? 'destructive' : 'default'}
                      onClick={() => publishMutation.mutate(selectedCareer.id)}
                      disabled={publishMutation.isPending || !canMutateSelectedCareer}
                      title={!canMutateSelectedCareer ? 'Legacy roadmaps are read-only in this builder' : undefined}
                    >
                      {publishMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isPublished(selectedCareer) ? (
                        'Unpublish'
                      ) : (
                        'Publish'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Delete this career? This cannot be undone.')) {
                          deleteMutation.mutate(selectedCareer.id);
                        }
                      }}
                      disabled={deleteMutation.isPending || !canMutateSelectedCareer}
                      title={!canMutateSelectedCareer ? 'Legacy roadmaps are read-only in this builder' : undefined}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedCareer ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No career selected. Create a new one or select from the list.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Career Overview */}
                  <div>
                    <h3 className="font-semibold text-sm text-slate-700 mb-2">Description</h3>
                    <p className="text-sm text-slate-600 break-words">{selectedCareer.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 gap-3 rounded-lg border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Weeks</p>
                      <p className="text-xl font-bold text-purple-600">{selectedCareer.totalWeeks || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Modules</p>
                      <p className="text-xl font-bold text-blue-600">{selectedCareer.modules?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <Badge className="mt-1 text-xs">
                        {isLegacyRoadmap(selectedCareer) ? 'Legacy Roadmap' : isPublished(selectedCareer) ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Created</p>
                      <p className="text-sm font-medium">{formatDate(selectedCareer.createdAt)}</p>
                    </div>
                  </div>

                  {/* Modules Preview */}
                  {selectedCareer.modules && selectedCareer.modules.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Modules ({selectedCareer.modules.length})</h3>
                      <div className="space-y-2">
                        {selectedCareer.modules.slice(0, 5).map((module, idx) => (
                          <div key={module.id} className="p-3 bg-slate-50 rounded border text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <span className="min-w-0 flex-1 break-words font-medium">{module.title}</span>
                              <span className="flex-shrink-0 text-xs text-slate-500">{module.weeks?.length || 0} weeks</span>
                            </div>
                          </div>
                        ))}
                        {selectedCareer.modules.length > 5 && (
                          <p className="text-xs text-slate-500 py-2">+{selectedCareer.modules.length - 5} more modules</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal */}
      {modalType === 'career' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{modalData.id ? 'Edit Career' : 'Create New Career'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Career Title *</label>
                <Input
                  placeholder="e.g., Full Stack Developer"
                  value={modalData.title}
                  onChange={(e) => {
                    setModalData({ ...modalData, title: e.target.value });
                    if (modalError) setModalError('');
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Describe this career path..."
                  value={modalData.description || ''}
                  onChange={(e) => {
                    setModalData({ ...modalData, description: e.target.value });
                    if (modalError) setModalError('');
                  }}
                  className="mt-1 min-h-24"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={handleCloseModal} disabled={isCareerModalSaving}>Cancel</Button>
                <Button 
                  onClick={handleSaveCareer}
                  disabled={isCareerModalSaving}
                >
                  {isCareerModalSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    modalData.id ? 'Save Changes' : 'Create'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
