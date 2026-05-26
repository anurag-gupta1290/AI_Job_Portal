import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { providerApi } from '@/api/provider';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, CheckCircle, Calendar, Award, PlusCircle, Building2
} from 'lucide-react';
import type { ProviderDashboardStats } from '@/types';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 font-display">{value}</p>
      )}
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function ProviderDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: async () => {
      const res = await providerApi.getDashboard();
      return res.data.data as ProviderDashboardStats;
    },
    retry: false,
  });

  const stats = data ?? {
    activeJobs: 0, totalJobs: 0, totalApplicants: 0,
    shortlisted: 0, interviewed: 0, offered: 0,
  };

  const cards = [
    { label: 'Active Jobs',       value: stats.activeJobs,      icon: Briefcase,   color: 'text-brand-600',   bg: 'bg-brand-50' },
    { label: 'Total Jobs',        value: stats.totalJobs,       icon: Building2,   color: 'text-violet-600',  bg: 'bg-violet-50' },
    { label: 'Total Applicants',  value: stats.totalApplicants, icon: Users,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Shortlisted',       value: stats.shortlisted,     icon: CheckCircle, color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Interviewed',       value: stats.interviewed,     icon: Calendar,    color: 'text-sky-600',     bg: 'bg-sky-50' },
    { label: 'Offered',           value: stats.offered,         icon: Award,       color: 'text-rose-600',    bg: 'bg-rose-50' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
            Employer Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Welcome, {user?.fullName}. Manage your job postings and applicants.
          </p>
        </div>
        <Link
          to="/provider/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
        >
          <PlusCircle size={16} />
          Post a Job
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((s) => (
          <StatCard key={s.label} {...s} isLoading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Post a New Job',        href: '/provider/jobs/new',     icon: PlusCircle },
              { label: 'Manage My Jobs',        href: '/provider/jobs',         icon: Briefcase },
              { label: 'Search Candidates',     href: '/provider/candidates',   icon: Users },
              { label: 'Update Company Profile',href: '/provider/company',      icon: Building2 },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all text-sm text-gray-700 font-medium"
              >
                <Icon size={16} className="text-brand-500" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 mb-4">ATS Pipeline</h2>
          <div className="space-y-3">
            {[
              { stage: 'Shortlisted', count: stats.shortlisted, color: 'bg-amber-100 text-amber-700' },
              { stage: 'Interview',   count: stats.interviewed, color: 'bg-sky-100 text-sky-700' },
              { stage: 'Offered',     count: stats.offered,     color: 'bg-emerald-100 text-emerald-700' },
            ].map(({ stage, count, color }) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stage}</span>
                {isLoading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
                ) : (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${color}`}>
                    {count} candidates
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
