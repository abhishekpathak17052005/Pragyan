import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, EyeOff, Trash2, Loader2, BookOpen } from 'lucide-react';

export default function AdminRoadmaps() {
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Fetch all careers
  const { data: careers = [], isLoading: careersLoading } = useQuery({
    queryKey: ['admin-careers'],
    queryFn: () => careerRoadmapService.listAdminCareers(),
  });

  // Fetch selected career details
  const { data: selectedCareer, isLoading: careerLoading } = useQuery({
    queryKey: ['career-detail', selectedCareerId],
    queryFn: () => {
      if (!selectedCareerId) return null;
      return careerRoadmapService.listAdminCareers().then(careers =>
        careers.find(c => c.id === selectedCareerId) || null
      );
    },
    enabled: !!selectedCareerId,
  });

  // Create career mutation
  const createCareerMutation = useMutation({
    mutationFn: (data: any) => careerRoadmapService.createCareer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '' });
    },
  });

  // Publish/Unpublish mutation
  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      careerRoadmapService.publishCareer(id, selectedCareer?.status !== 'published'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      queryClient.invalidateQueries({ queryKey: ['career-detail', selectedCareerId] });
    },
  });

  // Delete career mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteCareer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
      setSelectedCareerId('');
    },
  });

  const handleCreateCareer = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill in all fields');
      return;
    }
    createCareerMutation.mutate(formData);
  };

  const filteredCareers = careers.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Career Roadmaps</h1>
          <p className="text-slate-600">Manage learning paths for students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Career List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Careers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full"
                  disabled={createCareerMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Career
                </Button>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {careersLoading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : filteredCareers.length === 0 ? (
                    <p className="text-sm text-slate-500">No careers found</p>
                  ) : (
                    filteredCareers.map(career => (
                      <button
                        key={career.id}
                        onClick={() => setSelectedCareerId(career.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCareerId === career.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">{career.title || career.name}</span>
                          <Badge variant={career.status === 'published' ? 'default' : 'secondary'} className="text-xs">
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

          {/* Main Content - Career Details */}
          <div className="lg:col-span-3">
            {!selectedCareerId ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-slate-600">Select a career to view details</p>
                </CardContent>
              </Card>
            ) : careerLoading ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </CardContent>
              </Card>
            ) : selectedCareer ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedCareer.title || selectedCareer.name}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{selectedCareer.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedCareer.status === 'published' ? 'default' : 'outline'}
                        onClick={() => publishMutation.mutate(selectedCareerId)}
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : selectedCareer.status === 'published' ? (
                          <Eye className="w-4 h-4 mr-2" />
                        ) : (
                          <EyeOff className="w-4 h-4 mr-2" />
                        )}
                        {selectedCareer.status === 'published' ? 'Published' : 'Publish'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Delete this career?')) {
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

                <CardContent className="space-y-8">
                  {/* Modules Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Modules</h3>
                      <Button size="sm" onClick={() => alert('Add Module feature coming soon')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Module
                      </Button>
                    </div>

                    {!selectedCareer.modules || selectedCareer.modules.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg bg-slate-50">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-600 mb-4">No modules yet</p>
                        <Button size="sm" variant="outline" onClick={() => alert('Add Module feature coming soon')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Module
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedCareer.modules.map(module => (
                          <div key={module.id} className="border rounded-lg p-4 bg-slate-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-slate-900">{module.title}</h4>
                                <p className="text-sm text-slate-600">{module.description}</p>
                              </div>
                              <span className="text-sm text-slate-600">
                                {module.weeks?.length || 0} week{(module.weeks?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Weeks */}
                            {module.weeks && module.weeks.length > 0 && (
                              <div className="mt-4 ml-4 space-y-2 border-l-2 border-slate-300 pl-4">
                                {module.weeks.map(week => (
                                  <div key={week.id}>
                                    <p className="text-sm font-medium text-slate-900">{week.title}</p>
                                    <p className="text-xs text-slate-600">{week.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Status:</strong> {selectedCareer.status === 'published' ? 'Published - Students can see this' : 'Draft - Students cannot see this'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Create Career Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Career</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Frontend Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the career path"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createCareerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCareer}
                  disabled={createCareerMutation.isPending}
                >
                  {createCareerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
