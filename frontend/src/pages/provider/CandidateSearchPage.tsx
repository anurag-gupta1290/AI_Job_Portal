import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { providerApi } from '@/api/provider';
import {
  Search, MapPin, Briefcase, Users, Star, ExternalLink, FileText
} from 'lucide-react';
import type { SeekerProfile } from '@/types';

function CandidateCard({ profile }: { profile: SeekerProfile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-brand-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{profile.fullName}</p>
              {profile.headline && (
                <p className="text-xs text-gray-500 truncate">{profile.headline}</p>
              )}
            </div>
            {profile.activelyLooking && (
              <span className="shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                Actively Looking
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            {profile.location && (
              <span className="flex items-center gap-1"><MapPin size={11} />{profile.location}</span>
            )}
            {profile.totalExperience != null && (
              <span className="flex items-center gap-1"><Briefcase size={11} />{profile.totalExperience} yrs exp</span>
            )}
            {profile.expectedSalary && (
              <span>Expected ₹{(profile.expectedSalary / 100000).toFixed(1)}L/yr</span>
            )}
          </div>

          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 6).map((s) => (
                <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {s.skillName}
                </span>
              ))}
              {profile.skills.length > 6 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                  +{profile.skills.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-700">{profile.completionScore}%</span>
          </div>
          <p className="text-xs text-gray-400">Profile strength</p>

          <div className="flex gap-2">
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors"
              >
                <FileText size={12} /> Resume
              </a>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs px-2.5 py-1.5 border border-brand-200 rounded-lg text-brand-700 hover:bg-brand-50 transition-colors"
            >
              {expanded ? 'Less' : 'View'} Profile
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {profile.summary && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
            </div>
          )}

          {profile.experiences.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Experience</p>
              <div className="space-y-1.5">
                {profile.experiences.map((e) => (
                  <div key={e.id} className="text-xs text-gray-600">
                    <span className="font-medium">{e.title}</span> at {e.company}
                    <span className="text-gray-400 ml-2">
                      {e.startDate} – {e.isCurrent ? 'Present' : e.endDate ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.educations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</p>
              <div className="space-y-1">
                {profile.educations.map((e) => (
                  <div key={e.id} className="text-xs text-gray-600">
                    <span className="font-medium">{e.degree}</span>{e.field ? ` in ${e.field}` : ''} – {e.institution}
                    {e.year && <span className="text-gray-400 ml-1">({e.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                <ExternalLink size={12} /> LinkedIn
              </a>
            )}
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                <ExternalLink size={12} /> GitHub
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateSearchPage() {
  const [filters, setFilters] = useState({
    keyword: '', location: '', skillName: '', minExp: '', maxExp: '',
  });
  const [activeFilters, setActiveFilters] = useState(filters);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-search', activeFilters, page],
    queryFn: async () => {
      const res = await providerApi.searchCandidates({
        keyword:   activeFilters.keyword   || undefined,
        location:  activeFilters.location  || undefined,
        skillName: activeFilters.skillName || undefined,
        minExp:    activeFilters.minExp ? Number(activeFilters.minExp) : undefined,
        maxExp:    activeFilters.maxExp ? Number(activeFilters.maxExp) : undefined,
        page,
        size: 20,
      });
      return res.data.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters(filters);
    setPage(0);
  };

  const candidates = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Candidate Search</h1>
        <p className="text-gray-500 text-sm">Search our talent pool by skill, location, and experience.</p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
              placeholder="Name or headline"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              placeholder="Location"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <input
            type="text"
            value={filters.skillName}
            onChange={(e) => setFilters((f) => ({ ...f, skillName: e.target.value }))}
            placeholder="Skill (e.g. React, Java)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />

          <div className="flex gap-2">
            <input
              type="number"
              value={filters.minExp}
              onChange={(e) => setFilters((f) => ({ ...f, minExp: e.target.value }))}
              placeholder="Min exp (yrs)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <input
              type="number"
              value={filters.maxExp}
              onChange={(e) => setFilters((f) => ({ ...f, maxExp: e.target.value }))}
              placeholder="Max exp (yrs)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Search size={14} /> Search Candidates
          </button>
          <button
            type="button"
            onClick={() => {
              const empty = { keyword: '', location: '', skillName: '', minExp: '', maxExp: '' };
              setFilters(empty);
              setActiveFilters(empty);
              setPage(0);
            }}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          {data && (
            <span className="text-sm text-gray-500 ml-auto">
              {data.totalElements} candidate{data.totalElements !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-36 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Users size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-1">No candidates found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((profile: SeekerProfile) => (
            <CandidateCard key={profile.id} profile={profile} />
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
