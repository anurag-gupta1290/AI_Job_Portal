import { apiClient } from './client';
import type { JobPost, PageResponse, JobType, ExperienceLevel } from '@/types';

export interface JobSearchParams {
  keyword?: string;
  location?: string;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  size?: number;
  sortBy?: 'relevance' | 'date';
}

export const jobsApi = {
  search: (params: JobSearchParams = {}) => {
    const q = new URLSearchParams();
    if (params.keyword)         q.set('keyword', params.keyword);
    if (params.location)        q.set('location', params.location);
    if (params.jobType)         q.set('jobType', params.jobType);
    if (params.experienceLevel) q.set('experienceLevel', params.experienceLevel);
    if (params.salaryMin != null) q.set('salaryMin', String(params.salaryMin));
    if (params.salaryMax != null) q.set('salaryMax', String(params.salaryMax));
    q.set('page', String(params.page ?? 0));
    q.set('size', String(params.size ?? 20));
    q.set('sortBy', params.sortBy ?? 'relevance');
    return apiClient.get<{ data: PageResponse<JobPost> }>(`/jobs/search?${q}`);
  },

  getById: (id: number) =>
    apiClient.get<{ data: JobPost }>(`/jobs/${id}`),
};
