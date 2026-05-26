import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/client';
import type { AdminUser, PageResponse } from '@/types';
import { Search, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const roleLabel: Record<string, string> = {
  ROLE_JOB_SEEKER: 'Job Seeker',
  ROLE_JOB_PROVIDER: 'Employer',
  ROLE_TRAINING_PROVIDER: 'Trainer',
  ROLE_ADMIN: 'Admin',
};

const roleBadge: Record<string, string> = {
  ROLE_JOB_SEEKER: 'bg-brand-100 text-brand-700',
  ROLE_JOB_PROVIDER: 'bg-amber-100 text-amber-700',
  ROLE_TRAINING_PROVIDER: 'bg-violet-100 text-violet-700',
  ROLE_ADMIN: 'bg-gray-200 text-gray-700',
};

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () =>
      adminApi.getUsers(page, 20).then((r) => r.data.data as PageResponse<AdminUser>),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User status updated`);
    },
    onError: () => toast.error('Failed to update user status'),
  });

  const filtered = search
    ? data?.content.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : data?.content;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data?.totalElements ?? 0} total users
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                          roleBadge[user.role]
                        )}
                      >
                        {roleLabel[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'ROLE_ADMIN' && (
                        <button
                          onClick={() => toggleMutation.mutate(user.id)}
                          disabled={toggleMutation.isPending}
                          className={clsx(
                            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition',
                            user.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          )}
                        >
                          {user.isActive ? (
                            <>
                              <UserX size={13} /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} /> Activate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {(data.number ?? 0) + 1} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
