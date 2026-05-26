import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data as AuthResponse;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.fullName}!`);

      // Role-based redirect
      navigate(user.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed. Please check your credentials.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-brand-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-400 flex items-center justify-center">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-white tracking-tight">
            JobPortal
          </span>
        </div>

        <div>
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-4">
            Your next career
            <br />
            <span className="text-brand-400">starts here.</span>
          </h1>
          <p className="text-brand-300 text-lg leading-relaxed max-w-md">
            AI-powered job matching, skill gap analysis, and personalised training
            recommendations — all in one platform.
          </p>
        </div>

        <div className="flex gap-6 text-brand-400 text-sm">
          <span>10,000+ Jobs</span>
          <span>·</span>
          <span>500+ Companies</span>
          <span>·</span>
          <span>200+ Courses</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md animate-fade-in">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-1">
            Sign in
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Create one free
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
