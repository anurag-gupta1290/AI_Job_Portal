import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Briefcase, GraduationCap, Code2, Upload,
  Plus, Trash2, Save, Globe, Github, Linkedin, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { seekerApi } from '@/api/seeker';
import { skillsApi } from '@/api/client';
import ProfileCompleteness from '@/components/seeker/ProfileCompleteness';
import type { Skill, SkillLevel, ProfileVisibility } from '@/types';

const SKILL_LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const VISIBILITY_OPTS: { value: ProfileVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'EMPLOYERS_ONLY', label: 'Employers Only' },
  { value: 'PRIVATE', label: 'Private' },
];

export default function SeekerProfilePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info' | 'experience' | 'education' | 'skills'>('info');

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['seeker-profile'],
    queryFn: () => seekerApi.getProfile(),
  });
  const { data: skillsRes } = useQuery({
    queryKey: ['skills-all'],
    queryFn: () => skillsApi.getAll(),
  });

  const profile = profileRes?.data?.data;
  const allSkills: Skill[] = skillsRes?.data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: seekerApi.updateProfile,
    onSuccess: () => { toast.success('Profile saved'); qc.invalidateQueries({ queryKey: ['seeker-profile'] }); },
    onError: () => toast.error('Failed to save profile'),
  });

  const resumeMutation = useMutation({
    mutationFn: seekerApi.uploadResume,
    onSuccess: () => { toast.success('Resume uploaded'); qc.invalidateQueries({ queryKey: ['seeker-profile'] }); },
    onError: () => toast.error('Upload failed'),
  });

  const delExpMutation = useMutation({
    mutationFn: seekerApi.deleteExperience,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seeker-profile'] }),
    onError: () => toast.error('Could not delete'),
  });

  const delEduMutation = useMutation({
    mutationFn: seekerApi.deleteEducation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seeker-profile'] }),
    onError: () => toast.error('Could not delete'),
  });

  const removeSkillMutation = useMutation({
    mutationFn: seekerApi.removeSkill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seeker-profile'] }),
    onError: () => toast.error('Could not remove skill'),
  });

  if (isLoading || !profile) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
    ))}</div>;
  }

  return (
    <div className="animate-fade-in max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Profile</h1>
        <ProfileCompleteness score={profile.completionScore} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'info', label: 'About', icon: User },
          { key: 'experience', label: 'Experience', icon: Briefcase },
          { key: 'education', label: 'Education', icon: GraduationCap },
          { key: 'skills', label: 'Skills', icon: Code2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── About ─────────────────────────────────────── */}
      {tab === 'info' && (
        <AboutTab
          profile={profile}
          onSave={(data: any) => updateMutation.mutate(data)}
          saving={updateMutation.isPending}
          onResumeUpload={(file: any) => resumeMutation.mutate(file)}
          uploadingResume={resumeMutation.isPending}
        />
      )}

      {/* ── Experience ────────────────────────────────── */}
      {tab === 'experience' && (
        <ExperienceTab
          experiences={profile.experiences}
          onAdd={(data: any) =>
            seekerApi.addExperience(data).then(() => {
              toast.success('Experience added');
              qc.invalidateQueries({ queryKey: ['seeker-profile'] });
            }).catch(() => toast.error('Failed to add'))
          }
          onDelete={(id: any) => delExpMutation.mutate(id)}
        />
      )}

      {/* ── Education ────────────────────────────────── */}
      {tab === 'education' && (
        <EducationTab
          educations={profile.educations}
          onAdd={(data: any) =>
            seekerApi.addEducation(data).then(() => {
              toast.success('Education added');
              qc.invalidateQueries({ queryKey: ['seeker-profile'] });
            }).catch(() => toast.error('Failed to add'))
          }
          onDelete={(id: any) => delEduMutation.mutate(id)}
        />
      )}

      {/* ── Skills ──────────────────────────────────── */}
      {tab === 'skills' && (
        <SkillsTab
          skills={profile.skills}
          allSkills={allSkills}
          onAdd={(data: any) =>
            seekerApi.addSkill(data).then(() => {
              toast.success('Skill saved');
              qc.invalidateQueries({ queryKey: ['seeker-profile'] });
            }).catch(() => toast.error('Failed to add skill'))
          }
          onRemove={(skillId: any) => removeSkillMutation.mutate(skillId)}
        />
      )}
    </div>
  );
}

// ── About Tab ─────────────────────────────────────────────────────

function AboutTab({ profile, onSave, saving, onResumeUpload, uploadingResume }: any) {
  const [form, setForm] = useState({
    headline: profile.headline ?? '',
    summary: profile.summary ?? '',
    location: profile.location ?? '',
    visibility: profile.visibility ?? 'PUBLIC',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
    portfolioUrl: profile.portfolioUrl ?? '',
    activelyLooking: profile.activelyLooking ?? false,
    totalExperience: profile.totalExperience ?? '',
    expectedSalary: profile.expectedSalary ?? '',
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Professional Headline</Label>
          <input className={inputCls} placeholder="e.g. Senior React Developer at Startup"
            value={form.headline} onChange={(e) => set('headline', e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <Label>Professional Summary</Label>
          <textarea className={inputCls} rows={4} placeholder="Describe your experience and goals…"
            value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>

        <div>
          <Label>Location</Label>
          <input className={inputCls} placeholder="City, State" value={form.location}
            onChange={(e) => set('location', e.target.value)} />
        </div>

        <div>
          <Label>Profile Visibility</Label>
          <select className={inputCls} value={form.visibility}
            onChange={(e) => set('visibility', e.target.value)}>
            {VISIBILITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <Label>Years of Experience</Label>
          <input type="number" className={inputCls} min={0} placeholder="0"
            value={form.totalExperience} onChange={(e) => set('totalExperience', e.target.value)} />
        </div>

        <div>
          <Label>Expected Salary (₹/year)</Label>
          <input type="number" className={inputCls} placeholder="1200000"
            value={form.expectedSalary} onChange={(e) => set('expectedSalary', e.target.value)} />
        </div>

        <div>
          <Label><Linkedin size={13} className="inline mr-1" />LinkedIn URL</Label>
          <input className={inputCls} placeholder="https://linkedin.com/in/…"
            value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
        </div>

        <div>
          <Label><Github size={13} className="inline mr-1" />GitHub URL</Label>
          <input className={inputCls} placeholder="https://github.com/…"
            value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} />
        </div>

        <div>
          <Label><Globe size={13} className="inline mr-1" />Portfolio URL</Label>
          <input className={inputCls} placeholder="https://myportfolio.com"
            value={form.portfolioUrl} onChange={(e) => set('portfolioUrl', e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="actively" checked={form.activelyLooking}
            onChange={(e) => set('activelyLooking', e.target.checked)}
            className="w-4 h-4 rounded accent-brand-600" />
          <label htmlFor="actively" className="text-sm text-gray-700">
            Actively looking for jobs
          </label>
        </div>
      </div>

      {/* Resume upload */}
      <div className="pt-4 border-t border-gray-100">
        <Label>Resume</Label>
        {profile.resumeUrl && (
          <p className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
            ✓ Resume uploaded —{' '}
            <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="underline">
              view current
            </a>
          </p>
        )}
        <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all w-fit">
          <Upload size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            {uploadingResume ? 'Uploading…' : 'Upload PDF or DOCX (max 5 MB)'}
          </span>
          <input type="file" accept=".pdf,.docx" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onResumeUpload(e.target.files[0]); }} />
        </label>
      </div>

      <button
        onClick={() => onSave({
          ...form,
          totalExperience: form.totalExperience ? Number(form.totalExperience) : undefined,
          expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : undefined,
        })}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

// ── Experience Tab ─────────────────────────────────────────────────

function ExperienceTab({ experiences, onAdd, onDelete }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company: '', title: '', description: '', startDate: '', endDate: '', isCurrent: false });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.company || !form.title || !form.startDate) return toast.error('Company, title and start date are required');
    await onAdd({ ...form, endDate: form.isCurrent ? undefined : form.endDate || undefined });
    setForm({ company: '', title: '', description: '', startDate: '', endDate: '', isCurrent: false });
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      {experiences.map((exp: any) => (
        <div key={exp.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Briefcase size={18} className="text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
            <p className="text-sm text-gray-600">{exp.company}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {exp.startDate} – {exp.isCurrent ? 'Present' : (exp.endDate ?? '—')}
            </p>
            {exp.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exp.description}</p>}
          </div>
          <button onClick={() => onDelete(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all w-full justify-center">
          <Plus size={15} /> Add Experience
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">New Experience</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Company *</Label><input className={inputCls} value={form.company} onChange={(e) => set('company', e.target.value)} /></div>
            <div><Label>Job Title *</Label><input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div><Label>Start Date *</Label><input type="date" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
            <div>
              <Label>End Date</Label>
              <input type="date" className={inputCls} value={form.endDate} disabled={form.isCurrent}
                onChange={(e) => set('endDate', e.target.value)} />
              <label className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => set('isCurrent', e.target.checked)} className="accent-brand-600" />
                Currently working here
              </label>
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Education Tab ──────────────────────────────────────────────────

function EducationTab({ educations, onAdd, onDelete }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ institution: '', degree: '', field: '', year: '', grade: '' });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.institution || !form.degree) return toast.error('Institution and degree are required');
    await onAdd({ ...form, year: form.year ? Number(form.year) : undefined });
    setForm({ institution: '', degree: '', field: '', year: '', grade: '' });
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      {educations.map((edu: any) => (
        <div key={edu.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={18} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{edu.degree}{edu.field && ` in ${edu.field}`}</p>
            <p className="text-sm text-gray-600">{edu.institution}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {edu.year ?? '—'}{edu.grade && ` · ${edu.grade}`}
            </p>
          </div>
          <button onClick={() => onDelete(edu.id)} className="text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all w-full justify-center">
          <Plus size={15} /> Add Education
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">New Education</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label>Institution *</Label><input className={inputCls} value={form.institution} onChange={(e) => set('institution', e.target.value)} /></div>
            <div><Label>Degree *</Label><input className={inputCls} placeholder="B.Tech, MBA…" value={form.degree} onChange={(e) => set('degree', e.target.value)} /></div>
            <div><Label>Field of Study</Label><input className={inputCls} placeholder="Computer Science…" value={form.field} onChange={(e) => set('field', e.target.value)} /></div>
            <div><Label>Graduation Year</Label><input type="number" className={inputCls} placeholder="2022" value={form.year} onChange={(e) => set('year', e.target.value)} /></div>
            <div><Label>Grade / GPA</Label><input className={inputCls} placeholder="8.5 CGPA" value={form.grade} onChange={(e) => set('grade', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={submit} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skills Tab ─────────────────────────────────────────────────────

function SkillsTab({ skills, allSkills, onAdd, onRemove }: any) {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState<SkillLevel>('INTERMEDIATE');
  const [years, setYears] = useState('');

  async function submit() {
    if (!skillId) return toast.error('Select a skill');
    await onAdd({ skillId: Number(skillId), level, years: years ? Number(years) : undefined });
    setSkillId(''); setYears('');
  }

  const addedIds = new Set(skills.map((s: any) => s.skillId));

  return (
    <div className="space-y-4">
      {/* Current skills */}
      {skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((s: any) => (
              <div key={s.id} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-brand-50 rounded-full">
                <span className="text-xs font-medium text-brand-700">{s.skillName}</span>
                <span className="text-xs text-brand-400">· {s.level.toLowerCase()}</span>
                <button onClick={() => onRemove(s.skillId)}
                  className="ml-1 text-brand-300 hover:text-red-500 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add skill */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add a Skill</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Skill</Label>
            <select className={inputCls} value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">Select skill…</option>
              {allSkills
                .filter((s: Skill) => !addedIds.has(s.id))
                .map((s: Skill) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
          </div>
          <div>
            <Label>Proficiency</Label>
            <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value as SkillLevel)}>
              {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <Label>Years of experience</Label>
            <input type="number" min={0} className={inputCls} placeholder="2"
              value={years} onChange={(e) => setYears(e.target.value)} />
          </div>
        </div>
        <button onClick={submit}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
          <Plus size={14} /> Add Skill
        </button>
      </div>
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

const inputCls =
  'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all';
