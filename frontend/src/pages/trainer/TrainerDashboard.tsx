import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, PlusCircle, List } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getDashboard } from '../../api/trainer';

export default function TrainerDashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: getDashboard,
  });

  const completionRate =
    stats && stats.totalEnrolments > 0
      ? Math.round((stats.completedEnrolments / stats.totalEnrolments) * 100)
      : 0;

  const cards = [
    {
      label: 'Published Courses',
      value: isLoading ? '…' : String(stats?.publishedCourses ?? 0),
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Total Enrolments',
      value: isLoading ? '…' : String(stats?.totalEnrolments ?? 0),
      icon: Users,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Completion Rate',
      value: isLoading ? '…' : `${completionRate}%`,
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Trainer Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome, {user?.fullName}. Manage your courses.</p>
        </div>
        <Link
          to="/trainer/courses/new"
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
        >
          <PlusCircle size={16} />
          New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/trainer/courses/new"
              className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors"
            >
              <PlusCircle size={18} />
              <span className="font-medium text-sm">Create New Course</span>
            </Link>
            <Link
              to="/trainer/courses"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <List size={18} />
              <span className="font-medium text-sm">View All Courses</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Overall Progress</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              {stats?.completedEnrolments ?? 0} of {stats?.totalEnrolments ?? 0} learners completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
