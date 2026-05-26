import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, ArrowRight, Search } from 'lucide-react';
import { seekerApi } from '@/api/seeker';
import type { ApplicationStatus } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  APPLIED:     { label: 'Applied',     color: 'bg-gray-100 text-gray-700' },
  VIEWED:      { label: 'Viewed',      color: 'bg-blue-50 text-blue-700' },
  SHORTLISTED: { label: 'Shortlisted', color: 'bg-brand-50 text-brand-700' },
  INTERVIEW:   { label: 'Interview',   color: 'bg-violet-50 text-violet-700' },
  OFFERED:     { label: 'Offered',     color: 'bg-emerald-50 text-emerald-700' },
  REJECTED:    { label: 'Rejected',    color: 'bg-red-50 text-red-600' },
};

const PIPELINE: ApplicationStatus[] = [
  'APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED',
];

export default function ApplicationsPage() {
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'ALL'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['seeker-applications', page],
    queryFn: () => seekerApi.getApplications(page, 20),
  });

  const all = data?.data?.data?.content ?? [];
  const totalPages = data?.data?.data?.totalPages ?? 0;
  const applications = filterStatus === 'ALL'
    ? all
    : all.filter((a) => a.status === filterStatus);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track the status of your job applications</p>
        </div>
        <Link
          to="/jobs"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Search size={15} /> Find Jobs
        </Link>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterStatus === 'ALL'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({all.length})
        </button>
        {PIPELINE.map((s) => {
          const count = all.filter((a) => a.status === s).length;
          if (count === 0) return null;
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === s
                  ? 'ring-2 ring-offset-1 ring-brand-400 ' + cfg.color
                  : cfg.color + ' hover:opacity-80'
              }`}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">No applications yet</p>
          <p className="text-sm text-gray-400 mt-1">Start applying to jobs to track them here</p>
          <Link to="/jobs" className="mt-4 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
            Browse open jobs <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            return (
              <Link
                key={app.id}
                to={`/jobs/${app.job.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-brand-100 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <Briefcase size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{app.job.title}</p>
                  <p className="text-xs text-gray-500 truncate">{app.job.companyName ?? '—'}</p>
                  {app.job.location && (
                    <p className="text-xs text-gray-400">{app.job.location}</p>
                  )}
                </div>

                {/* Pipeline tracker */}
                <div className="hidden sm:flex items-center gap-1">
                  {PIPELINE.slice(0, 5).map((s, idx) => {
                    const current = PIPELINE.indexOf(app.status);
                    const done = idx <= current && app.status !== 'REJECTED';
                    return (
                      <div key={s} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          done ? 'bg-brand-500' : app.status === 'REJECTED' && idx <= PIPELINE.indexOf(app.status) ? 'bg-red-400' : 'bg-gray-200'
                        }`} />
                        {idx < 4 && <div className={`w-4 h-0.5 ${done && idx < current ? 'bg-brand-400' : 'bg-gray-200'}`} />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(app.appliedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
