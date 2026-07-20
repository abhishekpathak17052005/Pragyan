import { useState, useMemo } from 'react';
import { useOpenJobs, useApplyJob } from '@/hooks/useRecruitment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Search,
  Heart,
  BookmarkCheck,
  Building2,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { RecruitmentJob, EmploymentType, WorkMode } from '@/types/recruitment';
import { EmploymentType as EmploymentTypeEnum, WorkMode as WorkModeEnum } from '@/types/recruitment';

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<RecruitmentJob | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    location: '',
    employmentType: '',
    workMode: '',
    sortBy: 'newest',
  });

  const limit = 12;

  // Queries
  const { data: jobsData, isLoading: jobsLoading } = useOpenJobs(page, limit);
  
  // TODO: Implement saved jobs functionality
  // const { data: savedJobsData } = useSavedJobs(1, 100);
  
  // Mutations
  const applyJobMutation = useApplyJob();
  // TODO: Implement save/unsave job mutations
  // const saveJobMutation = useSaveJob();
  // const unsaveJobMutation = useUnsaveJob();

  const jobs = jobsData?.data || [];
  const totalJobs = jobsData?.pagination?.total || 0;
  const totalPages = jobsData?.pagination?.totalPages || 1;
  const savedJobIds = new Set(); // TODO: Update when saved jobs endpoint exists

  // Filter and search logic
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(q) ||
          job.company?.name.toLowerCase().includes(q) ||
          job.skillsRequired?.some(skill => skill.toLowerCase().includes(q))
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Employment type filter
    if (filters.employmentType) {
      filtered = filtered.filter(job => job.employmentType === filters.employmentType);
    }

    // Work mode filter
    if (filters.workMode) {
      filtered = filtered.filter(job => job.mode === filters.workMode);
    }

    // Sort
    if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === 'deadline') {
      filtered.sort((a, b) => {
        const dateA = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : 0;
        const dateB = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : 0;
        return dateA - dateB;
      });
    }

    return filtered;
  }, [jobs, searchQuery, filters]);

  const handleSaveJob = async (job: RecruitmentJob) => {
    try {
      // TODO: Implement save job functionality
      // if (savedJobIds.has(job.id)) {
      //   await unsaveJobMutation.mutateAsync(job.id);
      //   toast({ title: 'Removed from saved jobs' });
      // } else {
      //   await saveJobMutation.mutateAsync(job.id);
      //   toast({ title: 'Added to saved jobs' });
      // }
      toast({ title: 'Save job feature coming soon!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update saved jobs',
        variant: 'destructive',
      });
    }
  };

  const handleApplyJob = async (job: RecruitmentJob) => {
    try {
      await applyJobMutation.mutateAsync({ jobId: job.id });
      toast({ title: 'Success', description: 'Application submitted successfully' });
      setShowDetails(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (job: RecruitmentJob) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">My Opportunities</h1>
          <p className="text-blue-100 text-lg">Find internships and jobs matching your skills.</p>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{totalJobs}</div>
              <div className="text-blue-100 text-sm">Available Jobs</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">
                {jobs.filter(j => j.employmentType === EmploymentTypeEnum.INTERNSHIP).length}
              </div>
              <div className="text-blue-100 text-sm">Internships</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">
                {jobs.filter(j => j.mode === WorkModeEnum.REMOTE).length}
              </div>
              <div className="text-blue-100 text-sm">Remote</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{savedJobIds.size}</div>
              <div className="text-blue-100 text-sm">Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <Select value={filters.location} onValueChange={value => setFilters({ ...filters, location: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              <SelectItem value="bangalore">Bangalore</SelectItem>
              <SelectItem value="delhi">Delhi</SelectItem>
              <SelectItem value="mumbai">Mumbai</SelectItem>
              <SelectItem value="pune">Pune</SelectItem>
              <SelectItem value="hyderabad">Hyderabad</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.employmentType}
            onValueChange={value => setFilters({ ...filters, employmentType: value })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Employment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value={EmploymentTypeEnum.FULL_TIME}>Full Time</SelectItem>
              <SelectItem value={EmploymentTypeEnum.PART_TIME}>Part Time</SelectItem>
              <SelectItem value={EmploymentTypeEnum.INTERNSHIP}>Internship</SelectItem>
              <SelectItem value={EmploymentTypeEnum.CONTRACT}>Contract</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.workMode} onValueChange={value => setFilters({ ...filters, workMode: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Work Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Modes</SelectItem>
              <SelectItem value={WorkModeEnum.REMOTE}>Remote</SelectItem>
              <SelectItem value={WorkModeEnum.HYBRID}>Hybrid</SelectItem>
              <SelectItem value={WorkModeEnum.ONSITE}>Onsite</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={value => setFilters({ ...filters, sortBy: value })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="deadline">Deadline Soon</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                location: '',
                employmentType: '',
                workMode: '',
                sortBy: 'newest',
              })
            }
          >
            Clear
          </Button>
        </div>

        {/* Results */}
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredJobs.map(job => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleViewDetails(job)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {job.company?.verified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {job.employmentType}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-2">
                          <Building2 className="h-4 w-4" />
                          {job.company?.name}
                        </CardDescription>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSaveJob(job);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            savedJobIds.has(job.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {job.salaryMin && job.salaryMax
                            ? `${job.salaryMin}K - ${job.salaryMax}K`
                            : 'Negotiable'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.mode || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {job.applicationDeadline
                            ? new Date(job.applicationDeadline).toLocaleDateString()
                            : 'No deadline'}
                        </span>
                      </div>
                    </div>

                    {job.skillsRequired && job.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.skillsRequired.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skillsRequired.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.skillsRequired.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          handleViewDetails(job);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={e => {
                          e.stopPropagation();
                          handleApplyJob(job);
                        }}
                        disabled={applyJobMutation.isPending}
                        className="flex-1"
                      >
                        {applyJobMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Job Details Drawer */}
      {selectedJob && (
        <Sheet open={showDetails} onOpenChange={setShowDetails}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <SheetTitle className="text-2xl mb-2">{selectedJob.title}</SheetTitle>
                  <SheetDescription className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedJob.company?.name}
                  </SheetDescription>
                </div>
                {selectedJob.company?.verified && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Location</div>
                  <div className="text-sm font-medium mt-1">{selectedJob.location || 'TBD'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Employment Type</div>
                  <div className="text-sm font-medium mt-1">{selectedJob.employmentType}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Work Mode</div>
                  <div className="text-sm font-medium mt-1">{selectedJob.mode || 'TBD'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Salary</div>
                  <div className="text-sm font-medium mt-1">
                    {selectedJob.salaryMin && selectedJob.salaryMax
                      ? `${selectedJob.salaryMin}K - ${selectedJob.salaryMax}K`
                      : 'Negotiable'}
                  </div>
                </div>
                {selectedJob.experienceLevel && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Experience</div>
                    <div className="text-sm font-medium mt-1">{selectedJob.experienceLevel}</div>
                  </div>
                )}
                {selectedJob.applicationDeadline && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Deadline</div>
                    <div className="text-sm font-medium mt-1">
                      {new Date(selectedJob.applicationDeadline).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}

              {/* Skills */}
              {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skillsRequired.map(skill => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Info */}
              {selectedJob.company && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">About Company</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-2">{selectedJob.company.name}</div>
                    {selectedJob.company.description && (
                      <p className="text-sm text-gray-600">{selectedJob.company.description}</p>
                    )}
                    {selectedJob.company.website && (
                      <a
                        href={selectedJob.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-3 inline-block"
                      >
                        Visit Website →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleSaveJob(selectedJob)}
                  variant="outline"
                  className="flex-1"
                >
                  <Heart className={`h-4 w-4 mr-2 ${savedJobIds.has(selectedJob.id) ? 'fill-current' : ''}`} />
                  {savedJobIds.has(selectedJob.id) ? 'Saved' : 'Save Job'}
                </Button>
                <Button
                  onClick={() => handleApplyJob(selectedJob)}
                  disabled={applyJobMutation.isPending}
                  className="flex-1"
                >
                  {applyJobMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply Now
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
