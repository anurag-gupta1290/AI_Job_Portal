import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchCourses } from '../../api/trainer';
import type { Course } from '../../types';

export default function CoursesPage() {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['public-courses', search, page],
    queryFn: () => searchCourses(search || undefined, page),
  });

  const courses = data?.content ?? [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
        <p className="text-gray-500 mt-1">Discover training courses to upskill</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(keyword); setPage(0); }}
        className="flex gap-2"
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search courses..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="bg-brand-600 text-white px-5 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: Course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{course.title}</h3>
                <p className="text-xs text-gray-500 mb-2">by {course.trainer.fullName}</p>
                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-brand-700 font-bold text-sm">
                    {course.fees === 0 ? 'Free' : `₹${course.fees.toLocaleString()}`}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{course.lessons.length} lessons</span>
                    {course.durationHours && <span>· {course.durationHours}h</span>}
                  </div>
                </div>
                {course.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {course.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
