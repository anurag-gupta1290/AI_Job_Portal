import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Clock, Building2, BadgeCheck } from 'lucide-react';
import clsx from 'clsx';
import type { JobPost } from '@/types';

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobCard({ job }: { job: JobPost }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 overflow-hidden">
          {job.company?.logoUrl ? (
            <img src={job.company.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Building2 size={20} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate text-sm">
            {job.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <span className="truncate">{job.company?.name ?? 'Company'}</span>
            {job.company?.isVerified && (
              <BadgeCheck size={13} className="text-brand-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {job.location}
          </span>
        )}
        {job.jobType && (
          <span className="flex items-center gap-1">
            <Briefcase size={11} /> {JOB_TYPE_LABEL[job.jobType] ?? job.jobType}
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> {salary}
          </span>
        )}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 4).map((s) => (
            <span
              key={s.skillId}
              className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                s.isMandatory
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {s.skillName}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
