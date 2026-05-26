import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Briefcase, Clock, BadgeCheck,
  Building2, Users, Send, CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi } from '@/api/jobs';
import { seekerApi } from '@/api/seeker';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time',
  CONTRACT: 'Contract', INTERNSHIP: 'Internship', FREELANCE: 'Freelance',
};
const EXP_LEVEL_LABEL: Record<string, string> = {
  FRESHER: 'Fresher', JUNIOR: 'Junior', MID: 'Mid-level', SENIOR: 'Senior', LEAD: 'Lead',
};

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} per year`;
  if (min) return `From ${fmt(min)} per year`;
  return `Up to ${fmt(max!)} per year`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied, setApplied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(Number(id)),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: () => seekerApi.apply(Number(id), coverLetter || undefined),
    onSuccess: () => {
      toast.success('Application submitted!');
      setApplied(true);
      setShowApplyModal(false);
      qc.invalidateQueries({ queryKey: ['seeker-stats'] });
      qc.invalidateQueries({ queryKey: ['seeker-applications'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Failed to apply. Please try again.';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data?.data?.data) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 font-medium">Job not found</p>
        <Link to="/jobs" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
          <ArrowLeft size={14} /> Back to jobs
        </Link>
      </div>
    );
  }

  const job = data.data.data;
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const isSeeker = user?.role === 'ROLE_JOB_SEEKER';

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> Back to results
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden flex-shrink-0">
            {job.company?.logoUrl ? (
              <img src={job.company.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={24} />
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
              <span>{job.company?.name ?? 'Company'}</span>
              {job.company?.isVerified && <BadgeCheck size={15} className="text-brand-500" />}
              {job.company?.industry && (
                <span className="text-gray-400">· {job.company.industry}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-500">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
              )}
              {job.jobType && (
                <span className="flex items-center gap-1">
                  <Briefcase size={13} /> {JOB_TYPE_LABEL[job.jobType] ?? job.jobType}
                </span>
              )}
              {job.experienceLevel && (
                <span className="flex items-center gap-1">
                  <Users size={13} /> {EXP_LEVEL_LABEL[job.experienceLevel] ?? job.experienceLevel}
                </span>
              )}
              {salary && (
                <span className="flex items-center gap-1"><Clock size={13} /> {salary}</span>
              )}
            </div>
          </div>

          {/* Apply button */}
          {isSeeker && (
            <div className="flex-shrink-0">
              {applied ? (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold">
                  <CheckCircle2 size={16} /> Applied
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  <Send size={15} /> Apply Now
                </button>
              )}
            </div>
          )}
        </div>

        {/* Skills required */}
        {job.skills.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span
                  key={s.skillId}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    s.isMandatory ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {s.skillName}
                  {s.requiredLevel && (
                    <span className="ml-1 opacity-70">({s.requiredLevel.toLowerCase()})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {job.description && (
            <Section title="Job Description">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </Section>
          )}
          {job.responsibilities && (
            <Section title="Responsibilities">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p>
            </Section>
          )}
          {job.requirements && (
            <Section title="Requirements">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Section title="Job Details">
            <dl className="space-y-2 text-sm">
              {job.deadline && (
                <div>
                  <dt className="text-gray-500 text-xs">Apply by</dt>
                  <dd className="font-medium text-gray-800">
                    {new Date(job.deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 text-xs">Applications</dt>
                <dd className="font-medium text-gray-800">{job.applicationCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Posted</dt>
                <dd className="font-medium text-gray-800">
                  {new Date(job.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </dd>
              </div>
            </dl>
          </Section>

          {job.company && (
            <Section title="About the Company">
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-800">{job.company.name}</p>
                {job.company.industry && <p className="text-gray-500">{job.company.industry}</p>}
                {job.company.size && <p className="text-gray-500">Size: {job.company.size}</p>}
                {job.company.location && (
                  <p className="text-gray-500 flex items-center gap-1">
                    <MapPin size={11} /> {job.company.location}
                  </p>
                )}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Apply for {job.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{job.company?.name}</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Cover Letter <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={5}
                className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                placeholder="Tell the employer why you're a great fit…"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {applyMutation.isPending ? 'Submitting…' : (
                  <><Send size={14} /> Submit Application</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  );
}
