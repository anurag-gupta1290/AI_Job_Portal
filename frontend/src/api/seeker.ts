import { apiClient } from './client';
import type {
  SeekerProfile, SeekerStats, Application, PageResponse,
  SkillLevel, ProfileVisibility,
} from '@/types';

export const seekerApi = {
  getProfile: () =>
    apiClient.get<{ data: SeekerProfile }>('/seeker/profile'),

  updateProfile: (data: {
    headline?: string;
    summary?: string;
    location?: string;
    visibility?: ProfileVisibility;
    currentSalary?: number;
    expectedSalary?: number;
    totalExperience?: number;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    activelyLooking?: boolean;
  }) => apiClient.put<{ data: SeekerProfile }>('/seeker/profile', data),

  uploadResume: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ data: string }>('/seeker/profile/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addExperience: (data: {
    company: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
  }) => apiClient.post<{ data: SeekerProfile }>('/seeker/profile/experience', data),

  deleteExperience: (id: number) =>
    apiClient.delete(`/seeker/profile/experience/${id}`),

  addEducation: (data: {
    institution: string;
    degree: string;
    field?: string;
    year?: number;
    grade?: string;
  }) => apiClient.post<{ data: SeekerProfile }>('/seeker/profile/education', data),

  deleteEducation: (id: number) =>
    apiClient.delete(`/seeker/profile/education/${id}`),

  addSkill: (data: { skillId: number; level: SkillLevel; years?: number }) =>
    apiClient.post<{ data: SeekerProfile }>('/seeker/profile/skills', data),

  removeSkill: (skillId: number) =>
    apiClient.delete(`/seeker/profile/skills/${skillId}`),

  apply: (jobId: number, coverLetter?: string) =>
    apiClient.post<{ data: Application }>(`/seeker/jobs/${jobId}/apply`, { coverLetter }),

  getApplications: (page = 0, size = 10) =>
    apiClient.get<{ data: PageResponse<Application> }>(
      `/seeker/applications?page=${page}&size=${size}`
    ),

  getDashboardStats: () =>
    apiClient.get<{ data: SeekerStats }>('/seeker/dashboard/stats'),
};
