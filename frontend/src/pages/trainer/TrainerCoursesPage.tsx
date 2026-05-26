import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyCourses, updateCourse } from '../../api/trainer';
import type { Course, CourseStatus } from '../../types';

const STATUS_BADGE: Record<CourseStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export default function TrainerCoursesPage() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-courses', page],
    queryFn: () => getMyCourses(page),
  });

  const statusMutation = useMutation({
    mutationFn: ({ course, status }: { course: Course; status: CourseStatus }) =>
      updateCourse(course.id, {
        title: course.title,
        description: course.description,
        syllabus: course.syllabus,
        fees: course.fees,
        durationHours: course.durationHours,
        status,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-courses'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  const courses = data?.content ?? [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <Link
          to="/trainer/courses/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          + New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
          <Link
            to="/trainer/courses/new"
            className="text-brand-600 hover:underline font-medium"
          >
            Create your first course →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course: Course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex gap-4"
            >
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📚</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[course.status]}`}
                  >
                    {course.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{course.lessons.length} lessons</span>
                  <span>{course.totalEnrolled} enrolled</span>
                  <span>₹{course.fees.toLocaleString()}</span>
                  {course.durationHours && <span>{course.durationHours}h</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <Link
                  to={`/trainer/courses/${course.id}/edit`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Edit
                </Link>
                <Link
                  to={`/trainer/courses/${course.id}/enrolments`}
                  className="text-sm text-gray-600 hover:underline"
                >
                  Enrolments
                </Link>
                <Link
                  to={`/trainer/courses/${course.id}/sessions`}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Live Sessions
                </Link>
                <Link
                  to={`/trainer/courses/${course.id}/assessment`}
                  className="text-sm text-purple-600 hover:underline"
                >
                  Assessment
                </Link>
                {course.status === 'DRAFT' && (
                  <button
                    onClick={() => statusMutation.mutate({ course, status: 'PUBLISHED' })}
                    className="text-sm text-green-600 hover:underline text-left"
                  >
                    Publish
                  </button>
                )}
                {course.status === 'PUBLISHED' && (
                  <button
                    onClick={() => statusMutation.mutate({ course, status: 'ARCHIVED' })}
                    className="text-sm text-gray-500 hover:underline text-left"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
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
