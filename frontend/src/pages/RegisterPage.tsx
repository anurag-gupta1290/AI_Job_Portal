import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Eye, EyeOff, Loader2, User, Building2, GraduationCap } from 'lucide-react';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse, Role } from '@/types';
import clsx from 'clsx';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(150),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ROLE_JOB_SEEKER', 'ROLE_JOB_PROVIDER', 'ROLE_TRAINING_PROVIDER']),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

type RegisterableRole = 'ROLE_JOB_SEEKER' | 'ROLE_JOB_PROVIDER' | 'ROLE_TRAINING_PROVIDER';

const roles: { value: RegisterableRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'ROLE_JOB_SEEKER',
    label: 'Job Seeker',
    description: 'Find jobs & upskill',
    icon: User,
  },
  {
    value: 'ROLE_JOB_PROVIDER',
    label: 'Employer',
    description: 'Post jobs & hire',
    icon: Building2,
  },
  {
    value: 'ROLE_TRAINING_PROVIDER',
    label: 'Trainer',
    description: 'Create & deliver courses',
    icon: GraduationCap,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'ROLE_JOB_SEEKER' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data);
      const { user, accessToken, refreshToken } = res.data.data as AuthResponse;
      setAuth(user, accessToken, refreshToken);
      toast.success('Account created! Welcome to JobPortal.');
      navigate(user.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Briefcase size={15} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-gray-900">JobPortal</span>
        </div>

        <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
          Create your account
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Already have one?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a…
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = selectedRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('role', r.value)}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all text-xs font-medium',
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <Icon size={18} className={active ? 'text-brand-600' : 'text-gray-400'} />
                    <span>{r.label}</span>
                    <span className={clsx('text-[10px] font-normal', active ? 'text-brand-500' : 'text-gray-400')}>
                      {r.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              {...register('fullName')}
              placeholder="Arjun Sharma"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-xs text-center text-gray-400">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}
