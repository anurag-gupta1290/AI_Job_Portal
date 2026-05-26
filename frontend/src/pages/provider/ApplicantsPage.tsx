import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '@/api/provider';
import toast from 'react-hot-toast';
import {
  Users, ArrowLeft, ChevronDown, ExternalLink, FileText,
  Linkedin, Github, Mail, MapPin, Briefcase
} from 'lucide-react';
import type { ApplicationDetail, ApplicationStatus } from '@/types';

const PIPELINE_STAGES: ApplicationStatus[] = [
  'APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED',
];

const STAGE_COLORS: Record<ApplicationStatus, string> = {
  APPLIED:    'bg-gray-100 text-gray-600',
  VIEWED:     'bg-blue-100 text-blue-700',
  SHORTLISTED:'bg-amber-100 text-amber-700',
  INTERVIEW:  'bg-sky-100 text-sky-700',
  OFFERED:    'bg-emerald-100 text-emerald-700',
  REJECTED:   'bg-red-100 text-red-600',
};

function ApplicantCard({
  app,
  onStatusChange,
  isPending,
}: {
  app: ApplicationDetail;
  onStatusChange: (id: number, status: ApplicationStatus, notes?: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(app.providerNotes ?? '');
  const seeker = app.seeker;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                {seeker.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{seeker.fullName}</p>
                {seeker.headline && (
                  <p className="text-xs text-gray-500 truncate">{seeker.headline}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {seeker.location && (
                <span className="flex items-center gap-1"><MapPin size={11} />{seeker.location}</span>
              )}
              {seeker.totalExperience != null && (
                <span className="flex items-center gap-1"><Briefcase size={11} />{seeker.totalExperience} yrs exp</span>
              )}
              {seeker.expectedSalary && (
                <span>Expected ₹{(seeker.expectedSalary / 100000).toFixed(1)}L</span>
              )}
              <span className="flex items-center gap-1"><Mail size={11} />{seeker.email}</span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {seeker.resumeUrl && (
                <a href={seeker.resumeUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors">
                  <FileText size={12} /> Resume
                </a>
              )}
              {seeker.linkedinUrl && (
                <a href={seeker.linkedinUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors">
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              {seeker.githubUrl && (
                <a href={seeker.githubUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors">
                  <Github size={12} /> GitHub
                </a>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                {expanded ? 'Less' : 'More'} details
                <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STAGE_COLORS[app.status]}`}>
              {app.status}
            </span>
            {app.matchScore != null && (
              <span className="text-xs text-gray-500">{Math.round(app.matchScore)}% match</span>
            )}
            <p className="text-xs text-gray-400">
              {new Date(app.appliedAt).toLocaleDateString()}
            </p>

            {/* Status change dropdown */}
            <select
              defaultValue={app.status}
              disabled={isPending}
              onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className="text-xs text-gray-500 hover:text-brand-600 underline"
            >
              {notesOpen ? 'Hide notes' : app.providerNotes ? 'Edit notes' : 'Add notes'}
            </button>
          </div>
        </div>

        {/* Notes panel */}
        {notesOpen && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this candidate…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              onClick={() => onStatusChange(app.id, app.status, notes)}
              disabled={isPending}
              className="mt-2 px-4 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              Save Notes
            </button>
          </div>
        )}
      </div>

      {/* Expanded skills / experience */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
          {seeker.skills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {seeker.skills.map((s) => (
                  <span key={s.skillId} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-xs rounded-full">
                    {s.skillName}
                    {s.level && <span className="text-gray-400 ml-1">· {s.level}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {seeker.experiences.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience</p>
              <div className="space-y-1.5">
                {seeker.experiences.map((e, i) => (
                  <div key={i} className="text-xs text-gray-600">
                    <span className="font-medium">{e.title}</span> at {e.company}
                    {e.isCurrent && <span className="ml-1 text-emerald-600">(Current)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {seeker.educations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</p>
              <div className="space-y-1.5">
                {seeker.educations.map((e, i) => (
                  <div key={i} className="text-xs text-gray-600">
                    <span className="font-medium">{e.degree}</span>{e.field ? ` in ${e.field}` : ''} – {e.institution}
                    {e.year && <span className="text-gray-400 ml-1">({e.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {app.coverLetter && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cover Letter</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', jobId, statusFilter, page],
    queryFn: async () => {
      const res = await providerApi.getApplicants(Number(jobId), statusFilter || undefined, page, 20);
      return res.data.data;
    },
    enabled: !!jobId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: ApplicationStatus; notes?: string }) =>
      providerApi.updateApplicationStatus(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants', jobId] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
      toast.success('Application updated');
    },
    onError: () => toast.error('Failed to update application'),
  });

  const applicants = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/provider/jobs" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Applicants</h1>
          <p className="text-gray-500 text-sm">{data?.totalElements ?? 0} applications received</p>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['', ...PIPELINE_STAGES].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              statusFilter === s
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-700'
            }`}
          >
            {s || 'All Stages'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-40 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Users size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-1">No applicants yet</p>
          <p className="text-gray-500 text-sm">Applications will appear here once candidates apply.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((app: ApplicationDetail) => (
            <ApplicantCard
              key={app.id}
              app={app}
              isPending={statusMutation.isPending}
              onStatusChange={(id, status, notes) =>
                statusMutation.mutate({ id, status, notes })
              }
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
