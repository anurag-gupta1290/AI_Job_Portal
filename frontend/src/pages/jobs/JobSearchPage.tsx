import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { jobsApi } from '@/api/jobs';
import JobCard from '@/components/jobs/JobCard';
import type { JobType, ExperienceLevel } from '@/types';

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
];

const EXP_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'JUNIOR', label: 'Junior (1-3 yrs)' },
  { value: 'MID', label: 'Mid (3-6 yrs)' },
  { value: 'SENIOR', label: 'Senior (6-10 yrs)' },
  { value: 'LEAD', label: 'Lead (10+ yrs)' },
];

export default function JobSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<JobType | ''>('');
  const [expLevel, setExpLevel] = useState<ExperienceLevel | ''>('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [submittedLocation, setSubmittedLocation] = useState('');

  const queryParams = {
    keyword: submittedKeyword || undefined,
    location: submittedLocation || undefined,
    jobType: (jobType || undefined) as JobType | undefined,
    experienceLevel: (expLevel || undefined) as ExperienceLevel | undefined,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    salaryMax: salaryMax ? Number(salaryMax) : undefined,
    page,
    size: 20,
    sortBy,
  };

  const { data, isFetching } = useQuery({
    queryKey: ['jobs-search', queryParams],
    queryFn: () => jobsApi.search(queryParams),
    placeholderData: (prev) => prev,
  });

  const jobs = data?.data?.data?.content ?? [];
  const totalPages = data?.data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.data?.totalElements ?? 0;

  const hasActiveFilters = jobType || expLevel || salaryMin || salaryMax;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedKeyword(keyword);
    setSubmittedLocation(location);
    setPage(0);
  }

  function clearFilters() {
    setJobType('');
    setExpLevel('');
    setSalaryMin('');
    setSalaryMax('');
    setPage(0);
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-4">Find Jobs</h1>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-transparent">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            placeholder="Job title, keyword or company"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="w-48 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-transparent">
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors flex items-center gap-1.5 ${
            showFilters || hasActiveFilters
              ? 'bg-brand-50 border-brand-300 text-brand-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job Type</label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={jobType}
                onChange={(e) => { setJobType(e.target.value as JobType); setPage(0); }}
              >
                <option value="">All types</option>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={expLevel}
                onChange={(e) => { setExpLevel(e.target.value as ExperienceLevel); setPage(0); }}
              >
                <option value="">All levels</option>
                {EXP_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Salary (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={salaryMin}
                onChange={(e) => { setSalaryMin(e.target.value); setPage(0); }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Salary (₹)</label>
              <input
                type="number"
                placeholder="e.g. 1500000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={salaryMax}
                onChange={(e) => { setSalaryMax(e.target.value); setPage(0); }}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {isFetching ? 'Searching…' : `${totalElements.toLocaleString()} job${totalElements !== 1 ? 's' : ''} found`}
        </p>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as 'relevance' | 'date'); setPage(0); }}
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="date">Sort: Latest</option>
        </select>
      </div>

      {/* Job grid */}
      {isFetching && jobs.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <Search size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords or remove some filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
