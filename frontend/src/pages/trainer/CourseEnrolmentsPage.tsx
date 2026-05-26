import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourseEnrolments, getCourseDetail } from '../../api/trainer';
import type { Enrolment } from '../../types';

export default function CourseEnrolmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [page, setPage] = useState(0);
  const id = Number(courseId);

  const { data: course } = useQuery({
    queryKey: ['trainer-course', id],
    queryFn: () => getCourseDetail(id),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['course-enrolments', id, page],
    queryFn: () => getCourseEnrolments(id, page),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  const enrolments = data?.content ?? [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Enrolments — {course?.title ?? '...'}
        </h1>
        <p className="text-gray-500 mt-1">{data?.totalElements ?? 0} learners enrolled</p>
      </div>

      {enrolments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No learners have enrolled in this course yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {enrolments.map((enrolment: Enrolment) => (
            <div key={enrolment.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm flex-shrink-0">
                {enrolment.seeker.fullName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{enrolment.seeker.fullName}</p>
                <p className="text-sm text-gray-500">{enrolment.seeker.email}</p>
              </div>

              <div className="text-sm text-gray-500 flex-shrink-0">
                Enrolled {new Date(enrolment.enrolledAt).toLocaleDateString()}
              </div>

              <div className="w-32 flex-shrink-0">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{enrolment.progressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      enrolment.progressPct === 100 ? 'bg-green-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${enrolment.progressPct}%` }}
                  />
                </div>
                {enrolment.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed {new Date(enrolment.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-400 flex-shrink-0 text-right">
                {enrolment.completedLessonIds.length} / {enrolment.course.totalLessons} lessons
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
