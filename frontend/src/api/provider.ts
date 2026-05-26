import { apiClient } from '@/api/client';
import type {
  Company,
  JobPost,
  ApplicationDetail,
  SeekerProfile,
  ProviderDashboardStats,
  CreateJobPostRequest,
  UpdateApplicationStatusRequest,
  PageResponse,
  ApiResponse,
} from '@/types';

const base = '/provider';

export const providerApi = {
  // ── Dashboard ──────────────────────────────────────────────────
  getDashboard: () =>
    apiClient.get<ApiResponse<ProviderDashboardStats>>(`${base}/dashboard`),

  // ── Company ────────────────────────────────────────────────────
  getCompany: () =>
    apiClient.get<ApiResponse<Company>>(`${base}/company`),

  createCompany: (data: {
    name: string;
    description?: string;
    industry?: string;
    size?: string;
    website?: string;
    location?: string;
  }) => apiClient.post<ApiResponse<Company>>(`${base}/company`, data),

  updateCompany: (data: {
    name?: string;
    description?: string;
    industry?: string;
    size?: string;
    website?: string;
    location?: string;
  }) => apiClient.put<ApiResponse<Company>>(`${base}/company`, data),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<string>>(`${base}/company/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getCompanyById: (id: number) =>
    apiClient.get<ApiResponse<Company>>(`${base}/company/${id}`),

  // ── Job Postings ───────────────────────────────────────────────
  createJob: (data: CreateJobPostRequest) =>
    apiClient.post<ApiResponse<JobPost>>(`${base}/jobs`, data),

  getMyJobs: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<JobPost>>>(`${base}/jobs?page=${page}&size=${size}`),

  updateJob: (id: number, data: Partial<CreateJobPostRequest>) =>
    apiClient.put<ApiResponse<JobPost>>(`${base}/jobs/${id}`, data),

  closeJob: (id: number) =>
    apiClient.patch<ApiResponse<JobPost>>(`${base}/jobs/${id}/close`),

  // ── Applicant Tracking ─────────────────────────────────────────
  getApplicants: (jobId: number, status?: string, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    return apiClient.get<ApiResponse<PageResponse<ApplicationDetail>>>(
      `${base}/jobs/${jobId}/applications?${params}`
    );
  },

  updateApplicationStatus: (
    applicationId: number,
    data: UpdateApplicationStatusRequest
  ) =>
    apiClient.patch<ApiResponse<ApplicationDetail>>(
      `${base}/applications/${applicationId}/status`,
      data
    ),

  // ── Candidate Search ───────────────────────────────────────────
  searchCandidates: (params: {
    keyword?: string;
    location?: string;
    skillName?: string;
    minExp?: number;
    maxExp?: number;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.keyword)  q.set('keyword', params.keyword);
    if (params.location) q.set('location', params.location);
    if (params.skillName) q.set('skillName', params.skillName);
    if (params.minExp != null) q.set('minExp', String(params.minExp));
    if (params.maxExp != null) q.set('maxExp', String(params.maxExp));
    q.set('page', String(params.page ?? 0));
    q.set('size', String(params.size ?? 20));
    return apiClient.get<ApiResponse<PageResponse<SeekerProfile>>>(
      `${base}/candidates?${q}`
    );
  },

  getCandidateProfile: (profileId: number) =>
    apiClient.get<ApiResponse<SeekerProfile>>(`${base}/candidates/${profileId}`),
};
