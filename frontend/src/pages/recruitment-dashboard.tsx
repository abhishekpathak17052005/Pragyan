import { useState } from 'react';
import { useOpenJobs, useStudentApplications, useUpcomingHiringDrives } from '@/hooks/useRecruitment';
import { useApplyJob, useWithdrawApplication } from '@/hooks/useRecruitment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Briefcase, FileText, Calendar, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { RecruitmentJob, JobApplication, HiringDrive } from '@/types/recruitment';

export default function RecruitmentDashboard() {
  const [page, setPage] = useState(1);
  const limit = 10;

  // Queries
  const { data: jobsData, isLoading: jobsLoading } = useOpenJobs(page, limit);
  const { data: applicationsData, isLoading: appsLoading } = useStudentApplications(page, limit);
  const { data: drivesData, isLoading: drivesLoading } = useUpcomingHiringDrives(page, limit);

  // Mutations
  const applyJobMutation = useApplyJob();
  const withdrawMutation = useWithdrawApplication();

  const handleApplyJob = async (jobId: string) => {
    try {
      await applyJobMutation.mutateAsync({
        jobId,
      });
      toast({
        title: 'Success',
        description: 'Application submitted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async (appId: string) => {
    try {
      await withdrawMutation.mutateAsync(appId);
      toast({
        title: 'Success',
        description: 'Application withdrawn',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to withdraw application',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPLIED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-purple-100 text-purple-800',
      ASSESSMENT: 'bg-yellow-100 text-yellow-800',
      INTERVIEW: 'bg-orange-100 text-orange-800',
      HR: 'bg-indigo-100 text-indigo-800',
      OFFERED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      JOINED: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Competitive';
    if (min && max) return `₹${(min / 100000).toFixed(1)}-${(max / 100000).toFixed(1)} LPA`;
    if (min) return `₹${(min / 100000).toFixed(1)} LPA`;
    return `Up to ₹${(max! / 100000).toFixed(1)} LPA`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recruitment Dashboard</h1>
          <p className="text-gray-600">Explore job opportunities and manage your applications</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Open Jobs
            </TabsTrigger>
            <TabsTrigger value="applications">
              <FileText className="w-4 h-4 mr-2" />
              My Applications
            </TabsTrigger>
            <TabsTrigger value="drives">
              <Calendar className="w-4 h-4 mr-2" />
              Hiring Drives
            </TabsTrigger>
          </TabsList>

          {/* Open Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4 mt-6">
            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : jobsData?.data && jobsData.data.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {jobsData.data.map((job) => (
                    <Card key={job.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {job.company?.logo && (
                                <img
                                  src={job.company.logo}
                                  alt={job.company.name}
                                  className="w-8 h-8 rounded"
                                />
                              )}
                              {job.title}
                            </CardTitle>
                            <CardDescription>{job.company?.name}</CardDescription>
                          </div>
                          <Badge variant="secondary">{job.employmentType}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{job.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {job.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.salaryMin || job.salaryMax ? (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                          ) : null}
                        </div>

                        {job.skillsRequired && job.skillsRequired.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Required Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {job.skillsRequired.map((skill) => (
                                <Badge key={skill} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => handleApplyJob(job.id)}
                          disabled={applyJobMutation.isPending}
                          className="w-full"
                        >
                          {applyJobMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            'Apply Now'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {jobsData.pagination?.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= (jobsData.pagination?.totalPages || 1)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No open jobs available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="applications" className="space-y-4 mt-6">
            {appsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : applicationsData?.data && applicationsData.data.length > 0 ? (
              <div className="grid gap-4">
                {applicationsData.data.map((app) => (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{app.job?.title}</CardTitle>
                          <CardDescription>{app.job?.company?.name}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600">
                        <p>Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                        <p>Last updated {new Date(app.updatedAt).toLocaleDateString()}</p>
                      </div>

                      {app.job?.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{app.job.location}</span>
                        </div>
                      )}

                      <Button
                        variant="destructive"
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawMutation.isPending}
                        className="w-full"
                      >
                        {withdrawMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          'Withdraw Application'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No applications yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Hiring Drives Tab */}
          <TabsContent value="drives" className="space-y-4 mt-6">
            {drivesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : drivesData?.data && drivesData.data.length > 0 ? (
              <div className="grid gap-4">
                {drivesData.data.map((drive) => (
                  <Card key={drive.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{drive.title}</CardTitle>
                          <CardDescription>{drive.company?.name}</CardDescription>
                        </div>
                        <Badge variant="outline">{drive.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {drive.description && <p className="text-sm text-gray-600">{drive.description}</p>}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(drive.driveDate).toLocaleDateString()}</span>
                        </div>
                        {drive.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{drive.venue}</span>
                          </div>
                        )}
                      </div>

                      {drive.mode && (
                        <div>
                          <Badge variant="secondary">{drive.mode}</Badge>
                        </div>
                      )}

                      <Button className="w-full">Register for Drive</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming hiring drives</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
