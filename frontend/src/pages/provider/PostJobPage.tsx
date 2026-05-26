import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '@/api/provider';
import { skillsApi } from '@/api/client';
import toast from 'react-hot-toast';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import type { Skill, JobPost } from '@/types';

const schema = z.object({
  title:           z.string().min(1, 'Title is required').max(200),
  description:     z.string().min(10, 'Description is required'),
  requirements:    z.string().optional(),
  responsibilities:z.string().optional(),
  location:        z.string().max(200).optional(),
  jobType:         z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
  experienceLevel: z.enum(['FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']),
  status:          z.enum(['DRAFT', 'ACTIVE']).default('ACTIVE'),
  salaryMin:       z.number().positive().optional().nullable(),
  salaryMax:       z.number().positive().optional().nullable(),
  deadline:        z.string().optional(),
  maxApplicants:   z.number().positive().int().optional().nullable(),
  skills: z.array(z.object({
    skillId:       z.number(),
    requiredLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    isMandatory:   z.boolean().default(true),
  })).optional(),
});

type FormValues = z.infer<typeof schema>;

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] as const;
const EXP_LEVELS = ['FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'] as const;
const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export default function PostJobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([]);

  const { data: existingJob } = useQuery<JobPost | null>({
    queryKey: ['job-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await providerApi.getMyJobs(0, 100);
      const jobs = res.data.data?.content ?? [];
      return jobs.find((j) => String(j.id) === id) ?? null;
    },
    enabled: isEdit,
  });

  const {
    register, handleSubmit, control, watch,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingJob
      ? {
          title: existingJob.title,
          description: existingJob.description ?? '',
          requirements: existingJob.requirements ?? '',
          responsibilities: existingJob.responsibilities ?? '',
          location: existingJob.location ?? '',
          jobType: existingJob.jobType ?? 'FULL_TIME',
          experienceLevel: existingJob.experienceLevel ?? 'MID',
          status: (existingJob.status as 'DRAFT' | 'ACTIVE') ?? 'ACTIVE',
          salaryMin: existingJob.salaryMin ?? null,
          salaryMax: existingJob.salaryMax ?? null,
          deadline: existingJob.deadline ?? '',
          maxApplicants: null,
          skills: existingJob.skills.map((s) => ({
            skillId: s.skillId,
            requiredLevel: s.requiredLevel,
            isMandatory: s.isMandatory,
          })),
        }
      : { jobType: 'FULL_TIME', experienceLevel: 'MID', status: 'ACTIVE' },
  });

  const { fields: skillFields, append: addSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'skills',
  });

  const handleSkillSearch = async (q: string) => {
    setSkillSearch(q);
    if (q.length < 2) { setSkillSuggestions([]); return; }
    const res = await skillsApi.search(q);
    setSkillSuggestions(res.data.data ?? []);
  };

  const selectSkill = (skill: Skill) => {
    const exists = skillFields.some((f) => f.skillId === skill.id);
    if (!exists) addSkill({ skillId: skill.id, isMandatory: true });
    setSkillSearch('');
    setSkillSuggestions([]);
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        salaryMin: values.salaryMin ?? undefined,
        salaryMax: values.salaryMax ?? undefined,
        maxApplicants: values.maxApplicants ?? undefined,
        deadline: values.deadline || undefined,
      };
      if (isEdit && id) {
        return providerApi.updateJob(Number(id), payload);
      }
      return providerApi.createJob(payload as Parameters<typeof providerApi.createJob>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
      toast.success(isEdit ? 'Job updated!' : 'Job posted successfully!');
      navigate('/provider/jobs');
    },
    onError: () => toast.error('Failed to save job posting'),
  });

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Briefcase size={24} className="text-brand-600" />
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Job Posting' : 'Post a New Job'}
          </h1>
          <p className="text-gray-500 text-sm">Fill in the details to attract the right candidates.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-800">Job Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="e.g. Senior React Developer"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type <span className="text-red-500">*</span></label>
              <select
                {...register('jobType')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level <span className="text-red-500">*</span></label>
              <select
                {...register('experienceLevel')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                {EXP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                <option value="ACTIVE">Active (Publish now)</option>
                <option value="DRAFT">Draft (Save for later)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...register('location')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="e.g. Bangalore, India or Remote"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (₹/yr)</label>
              <input
                type="number"
                {...register('salaryMin', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="e.g. 600000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (₹/yr)</label>
              <input
                type="number"
                {...register('salaryMax', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="e.g. 1200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
              <input
                type="date"
                {...register('deadline')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-800">Job Description</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Describe the role, team, and what the candidate will work on…"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea
              {...register('requirements')}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="List the qualifications, skills, and experience required…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
            <textarea
              {...register('responsibilities')}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Key responsibilities and day-to-day tasks…"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Required Skills</h2>

          <div className="relative">
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => handleSkillSearch(e.target.value)}
              placeholder="Search and add skills (e.g. React, Python)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {skillSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {skillSuggestions.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => selectSkill(skill)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {skill.name}
                    <span className="ml-2 text-xs text-gray-400">{skill.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {skillFields.length > 0 && (
            <div className="space-y-2">
              {skillFields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    Skill #{field.skillId}
                  </span>
                  <select
                    {...register(`skills.${idx}.requiredLevel`)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="">Any level</option>
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      {...register(`skills.${idx}.isMandatory`)}
                      defaultChecked
                    />
                    Mandatory
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/provider/jobs')}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending
              ? 'Saving…'
              : isEdit
                ? 'Save Changes'
                : watch('status') === 'DRAFT'
                  ? 'Save as Draft'
                  : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
