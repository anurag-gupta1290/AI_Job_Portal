import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import { Users, UserCheck, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@/types';
import clsx from 'clsx';

interface StatCard {
  label: string;
  key: keyof DashboardStats;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const cards: StatCard[] = [
  { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
  { label: 'Active Users', key: 'activeUsers', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Job Seekers', key: 'jobSeekers', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Employers', key: 'jobProviders', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Trainers', key: 'trainers', icon: GraduationCap, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data as DashboardStats),
    refetchInterval: 30_000,
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Real-time platform analytics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                <Icon size={18} className={card.color} />
              </div>
              {isLoading ? (
                <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 font-display">
                  {data?.[card.key]?.toLocaleString() ?? '—'}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-brand-50 hover:text-brand-700 transition text-sm font-medium text-gray-700"
          >
            <Users size={16} />
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}
