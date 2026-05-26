import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, GraduationCap,
  LogOut, Bell, Settings, UserCircle, FileText,
  Building2, PlusCircle, Search, BookOpen, List
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const navItems = {
  ROLE_ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
  ],
  ROLE_JOB_SEEKER: [
    { label: 'Dashboard',       href: '/dashboard',     icon: LayoutDashboard },
    { label: 'Find Jobs',       href: '/jobs',          icon: Briefcase },
    { label: 'My Applications', href: '/applications',  icon: FileText },
    { label: 'My Profile',      href: '/seeker/profile',icon: UserCircle },
    { label: 'Browse Courses',  href: '/courses',       icon: GraduationCap },
    { label: 'My Courses',      href: '/my-courses',    icon: BookOpen },
  ],
  ROLE_JOB_PROVIDER: [
    { label: 'Dashboard',         href: '/dashboard',           icon: LayoutDashboard },
    { label: 'Post a Job',        href: '/provider/jobs/new',   icon: PlusCircle },
    { label: 'My Jobs',           href: '/provider/jobs',       icon: Briefcase },
    { label: 'Search Candidates', href: '/provider/candidates', icon: Search },
    { label: 'Company Profile',   href: '/provider/company',    icon: Building2 },
  ],
  ROLE_TRAINING_PROVIDER: [
    { label: 'Dashboard',   href: '/trainer/dashboard',  icon: LayoutDashboard },
    { label: 'My Courses',  href: '/trainer/courses',    icon: List },
    { label: 'New Course',  href: '/trainer/courses/new',icon: PlusCircle },
    { label: 'Marketplace', href: '/courses',            icon: GraduationCap },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const items = user ? (navItems[user.role] ?? []) : [];

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue even if request fails
    }
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const roleLabel = {
    ROLE_ADMIN: 'Admin',
    ROLE_JOB_SEEKER: 'Job Seeker',
    ROLE_JOB_PROVIDER: 'Employer',
    ROLE_TRAINING_PROVIDER: 'Trainer',
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-950 text-white flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-brand-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              JobPortal
            </span>
          </Link>
        </div>

        {/* User badge */}
        {user && (
          <div className="px-4 py-4 border-b border-brand-800">
            <div className="bg-brand-900 rounded-xl p-3">
              <p className="text-sm font-semibold text-white truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-brand-300 mt-0.5 truncate">{user.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-brand-700 text-brand-200 rounded-full">
                {roleLabel[user.role]}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-brand-800 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-300 hover:bg-brand-800 hover:text-white transition-all"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-3 sticky top-0 z-10">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
            <Bell size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <Settings size={18} />
          </button>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
