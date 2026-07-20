import { useState } from 'react';
import { useUpcomingHiringDrives } from '@/hooks/useRecruitment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Calendar,
  MapPin,
  Building2,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { HiringDrive } from '@/types/recruitment';

export default function HiringDrivesPage() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: drivesData, isLoading } = useUpcomingHiringDrives(page, limit);

  const drives = drivesData?.data || [];
  const totalDrives = drivesData?.pagination?.total || 0;
  const totalPages = drivesData?.pagination?.totalPages || 1;

  const getStatusBadge = (drive: HiringDrive) => {
    const registrationDeadline = drive.registrationDeadline
      ? new Date(drive.registrationDeadline)
      : null;
    const driveDate = new Date(drive.driveDate);
    const now = new Date();

    if (registrationDeadline && registrationDeadline < now) {
      return {
        label: 'Registration Closed',
        variant: 'destructive' as const,
      };
    }

    if (driveDate < now) {
      return {
        label: 'Completed',
        variant: 'secondary' as const,
      };
    }

    return {
      label: 'Active',
      variant: 'default' as const,
    };
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: string | Date) => {
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Completed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">Hiring Drives</h1>
          <p className="text-emerald-100 text-lg">Discover recruitment drives happening near you.</p>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{totalDrives}</div>
              <div className="text-emerald-100 text-sm">Upcoming Drives</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">
                {drives.filter(d => new Date(d.driveDate) > new Date()).length}
              </div>
              <div className="text-emerald-100 text-sm">This Month</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold text-white">
                {new Set(drives.map(d => d.company?.id)).size}
              </div>
              <div className="text-emerald-100 text-sm">Companies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
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
        ) : drives.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hiring drives found</h3>
              <p className="text-gray-500">
                Check back later for upcoming recruitment drives.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {drives.map(drive => {
                const status = getStatusBadge(drive);
                const isRegistrationOpen =
                  !drive.registrationDeadline ||
                  new Date(drive.registrationDeadline) > new Date();

                return (
                  <Card key={drive.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{drive.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-2">
                            <Building2 className="h-4 w-4" />
                            {drive.company?.name}
                          </CardDescription>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Description */}
                      {drive.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{drive.description}</p>
                      )}

                      {/* Details Grid */}
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Drive Date</div>
                            <div className="font-medium text-gray-900">
                              {formatDate(drive.driveDate)}
                            </div>
                          </div>
                        </div>

                        {drive.venue && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Venue
                              </div>
                              <div className="font-medium text-gray-900">{drive.venue}</div>
                            </div>
                          </div>
                        )}

                        {drive.registrationDeadline && (
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Registration Deadline
                              </div>
                              <div className="font-medium text-gray-900">
                                {formatDate(drive.registrationDeadline)}
                              </div>
                            </div>
                          </div>
                        )}

                        {drive.mode && (
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">
                                Mode
                              </div>
                              <div className="font-medium text-gray-900">{drive.mode}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Time Until Drive */}
                      <div className="bg-emerald-50 rounded-lg px-3 py-2">
                        <div className="text-sm font-medium text-emerald-900">
                          {getDaysUntil(drive.driveDate)}
                        </div>
                      </div>
                    </CardContent>

                    {/* Actions */}
                    <div className="border-t p-4">
                      {isRegistrationOpen ? (
                        <Button className="w-full" variant="default">
                          <span>Register Now</span>
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button className="w-full" variant="outline" disabled>
                          Registration Closed
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
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
    </div>
  );
}
