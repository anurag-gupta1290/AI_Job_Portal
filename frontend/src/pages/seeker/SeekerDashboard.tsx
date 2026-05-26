import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, BookOpen, Star, Search, ArrowRight, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { seekerApi } from '@/api/seeker';
import { jobsApi } from '@/api/jobs';
import ProfileCompleteness from '@/components/seeker/ProfileCompleteness';
import JobCard from '@/components/jobs/JobCard';
import type { ApplicationStatus } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  APPLIED:     { label: 'Applied',      color: 'bg-gray-100 text-gray-700' },
  VIEWED:      { label: 'Viewed',       color: 'bg-blue-50 text-blue-700' },
  SHORTLISTED: { label: 'Shortlisted',  color: 'bg-brand-50 text-brand-700' },
  INTERVIEW:   { label: 'Interview',    color: 'bg-violet-50 text-violet-700' },
  OFFERED:     { label: 'Offered',      color: 'bg-emerald-50 text-emerald-700' },
  REJECTED:    { label: 'Rejected',     color: 'bg-red-50 text-red-600' },
};

export default function SeekerDashboard() {
  const { user } = useAuthStore();

  const { data: statsRes } = useQuery({
    queryKey: ['seeker-stats'],
    queryFn: () => seekerApi.getDashboardStats(),
  });

  const { data: profileRes } = useQuery({
    queryKey: ['seeker-profile'],
    queryFn: () => seekerApi.getProfile(),
  });

  const { data: applicationsRes } = useQuery({
    queryKey: ['seeker-applications', 0],
    queryFn: () => seekerApi.getApplications(0, 5),
  });

  const { data: jobsRes } = useQuery({
    queryKey: ['jobs-recent'],
    queryFn: () => jobsApi.search({ size: 4, sortBy: 'date' }),
  });

  const stats = statsRes?.data?.data;
  const profile = profileRes?.data?.data;
  const applications = applicationsRes?.data?.data?.content ?? [];
  const recentJobs = jobsRes?.data?.data?.content ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-0.5">
          Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm">Here's what's happening with your job search.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Applications',
            value: stats?.applications ?? 0,
            icon: Briefcase,
            color: 'text-brand-600',
            bg: 'bg-brand-50',
            href: '/applications',
          },
          {
            label: 'Saved Jobs',
            value: stats?.savedJobs ?? 0,
            icon: Star,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            href: '/jobs',
          },
          {
            label: 'Enrolled Courses',
            value: stats?.enrolledCourses ?? 0,
            icon: BookOpen,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            href: '/courses',
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.href}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Applications */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-semibold text-gray-900">Recent Applications</h2>
              <Link to="/applications" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="px-5 pb-5 text-center py-8">
                <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No applications yet.</p>
                <Link to="/jobs" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                  Browse jobs <ArrowRight size={11} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {applications.map((app) => {
                  const cfg = STATUS_CONFIG[app.status];
                  return (
                    <div key={app.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{app.job.title}</p>
                        <p className="text-xs text-gray-500 truncate">{app.job.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Latest Jobs</h2>
              <Link to="/jobs" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                Search all <ArrowRight size={12} />
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <Search size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No jobs found yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentJobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Profile completeness */}
          {profile && <ProfileCompleteness score={profile.completionScore} />}

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</p>
            <Link
              to="/jobs"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-50 hover:text-brand-700 transition-all text-sm font-medium text-gray-700 group"
            >
              <span className="flex items-center gap-2">
                <Search size={15} /> Search Jobs
              </span>
              <ArrowRight size={14} className="text-gray-400 group-hover:text-brand-500" />
            </Link>
            <Link
              to="/seeker/profile"
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-50 hover:text-brand-700 transition-all text-sm font-medium text-gray-700 group"
            >
              <span className="flex items-center gap-2">
                <Briefcase size={15} /> Edit Profile
              </span>
              <ArrowRight size={14} className="text-gray-400 group-hover:text-brand-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
