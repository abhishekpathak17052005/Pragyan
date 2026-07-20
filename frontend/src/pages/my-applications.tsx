import { useState } from 'react';
import { useStudentApplications, useWithdrawApplication } from '@/hooks/useRecruitment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
  Building2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { JobApplication, ApplicationStatus } from '@/types/recruitment';
import { ApplicationStatus as ApplicationStatusEnum } from '@/types/recruitment';

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [ApplicationStatusEnum.APPLIED]: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800',
    icon: <Briefcase className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.SHORTLISTED]: {
    label: 'Shortlisted',
    color: 'bg-purple-100 text-purple-800',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.ASSESSMENT]: {
    label: 'Assessment',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.INTERVIEW]: {
    label: 'Interview',
    color: 'bg-orange-100 text-orange-800',
    icon: <Calendar className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.HR]: {
    label: 'HR Round',
    color: 'bg-cyan-100 text-cyan-800',
    icon: <Briefcase className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.OFFERED]: {
    label: 'Offered',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.REJECTED]: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  [ApplicationStatusEnum.JOINED]: {
    label: 'Joined',
    color: 'bg-emerald-100 text-emerald-800',
    icon: <CheckCircle className="h-4 w-4" />,
  },
};

const statusTimeline = [
  ApplicationStatusEnum.APPLIED,
  ApplicationStatusEnum.SHORTLISTED,
  ApplicationStatusEnum.ASSESSMENT,
  ApplicationStatusEnum.INTERVIEW,
  ApplicationStatusEnum.HR,
  ApplicationStatusEnum.OFFERED,
  ApplicationStatusEnum.JOINED,
];

export default function MyApplicationsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: applicationsData, isLoading } = useStudentApplications(page, limit);
  const withdrawMutation = useWithdrawApplication();

  const applications = applicationsData?.data || [];
  const totalApplications = applicationsData?.pagination?.total || 0;
  const totalPages = applicationsData?.pagination?.totalPages || 1;

  // Statistics
  const stats = {
    total: totalApplications,
    applied: applications.filter(a => a.status === ApplicationStatusEnum.APPLIED).length,
    shortlisted: applications.filter(a => a.status === ApplicationStatusEnum.SHORTLISTED).length,
    offered: applications.filter(a => a.status === ApplicationStatusEnum.OFFERED).length,
    joined: applications.filter(a => a.status === ApplicationStatusEnum.JOINED).length,
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      await withdrawMutation.mutateAsync(applicationId);
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

  const getStatusPosition = (status: ApplicationStatus) => {
    return statusTimeline.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">My Applications</h1>
          <p className="text-purple-100 text-lg">Track your job applications and progress.</p>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-purple-100 text-sm">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{stats.applied}</div>
              <div className="text-purple-100 text-sm">Applied</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{stats.shortlisted}</div>
              <div className="text-purple-100 text-sm">Shortlisted</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{stats.offered}</div>
              <div className="text-purple-100 text-sm">Offered</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{stats.joined}</div>
              <div className="text-purple-100 text-sm">Joined</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 mb-6">
                Browse and apply to jobs to track your progress here.
              </p>
              <Button asChild>
                <a href="/recruitment">Browse Jobs</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map(application => {
              const job = application.job;
              const status = application.status;
              const statusInfo = statusConfig[status];
              const currentPosition = getStatusPosition(status);
              const isRejected = status === ApplicationStatusEnum.REJECTED;

              return (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Building2 className="h-4 w-4" />
                          {job.company?.name}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                        {status === ApplicationStatusEnum.APPLIED && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWithdraw(application.id)}
                            disabled={withdrawMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {withdrawMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Withdrawing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Withdraw
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Location
                        </div>
                        <div className="font-medium flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {job.location || 'TBD'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Type
                        </div>
                        <div className="font-medium">{job.employmentType}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Applied
                        </div>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Salary
                        </div>
                        <div className="font-medium">
                          {job.salaryMin && job.salaryMax
                            ? `${job.salaryMin}K - ${job.salaryMax}K`
                            : 'Negotiable'}
                        </div>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    {!isRejected && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-4">Application Progress</div>
                        <div className="flex items-center justify-between gap-1">
                          {statusTimeline.map((s, idx) => {
                            const isActive = idx <= currentPosition;
                            const isCurrent = s === status;

                            return (
                              <div key={s} className="flex flex-col items-center flex-1">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                    isCurrent
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                                      : isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  {isCurrent ? '●' : isActive ? '✓' : idx + 1}
                                </div>
                                <div className="text-xs text-gray-600 mt-2 text-center leading-tight">
                                  {s === ApplicationStatusEnum.OFFERED ? 'Offer' : s}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-red-900">Application Rejected</div>
                            <p className="text-sm text-red-700 mt-1">
                              Your application didn't move forward. Keep applying to other opportunities!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {status === ApplicationStatusEnum.OFFERED && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-green-900">You Got An Offer!</div>
                            <p className="text-sm text-green-700 mt-1">
                              Congratulations! The company has extended an offer. Check your email for
                              details.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {status === ApplicationStatusEnum.JOINED && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-emerald-900">You Joined!</div>
                            <p className="text-sm text-emerald-700 mt-1">
                              Welcome aboard! Best of luck in your new role.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
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
          </div>
        )}
      </div>
    </div>
  );
}
