import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { providerApi } from '@/api/provider';
import toast from 'react-hot-toast';
import {
  Briefcase, PlusCircle, Users, Eye, Edit3, XCircle,
  MapPin, IndianRupee, Clock
} from 'lucide-react';
import type { JobPost, JobStatus } from '@/types';

const STATUS_BADGE: Record<JobStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DRAFT:  'bg-gray-100 text-gray-600',
  PAUSED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-red-100 text-red-600',
};

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default function ProviderJobsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['provider-jobs', page],
    queryFn: async () => {
      const res = await providerApi.getMyJobs(page, 20);
      return res.data.data;
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => providerApi.closeJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
      toast.success('Job closed');
    },
    onError: () => toast.error('Failed to close job'),
  });

  const jobs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-500 text-sm">{data?.totalElements ?? 0} postings total</p>
        </div>
        <Link
          to="/provider/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
        >
          <PlusCircle size={16} />
          Post a Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Briefcase size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-1">No job postings yet</p>
          <p className="text-gray-500 text-sm mb-5">Post your first job to start receiving applications.</p>
          <Link
            to="/provider/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            <PlusCircle size={16} /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: JobPost) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-brand-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[job.status]}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {job.location}
                      </span>
                    )}
                    {job.jobType && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} /> {job.jobType.replace('_', ' ')}
                      </span>
                    )}
                    {formatSalary(job.salaryMin, job.salaryMax) && (
                      <span className="flex items-center gap-1">
                        <IndianRupee size={12} /> {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                    )}
                    {job.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Closes {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.slice(0, 5).map((s) => (
                        <span key={s.skillId} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {s.skillName}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{job.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <Users size={14} className="text-brand-500" />
                    {job.applicationCount} applicants
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye size={12} /> {job.viewCount} views
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      to={`/provider/jobs/${job.id}/applications`}
                      className="flex items-center gap-1 px-3 py-1.5 border border-brand-200 text-brand-700 text-xs font-medium rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <Users size={12} /> View Applicants
                    </Link>
                    <Link
                      to={`/provider/jobs/${job.id}/edit`}
                      className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Edit3 size={14} />
                    </Link>
                    {job.status !== 'CLOSED' && (
                      <button
                        onClick={() => {
                          if (confirm('Close this job? No new applications will be accepted.')) {
                            closeMutation.mutate(job.id);
                          }
                        }}
                        disabled={closeMutation.isPending}
                        className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
