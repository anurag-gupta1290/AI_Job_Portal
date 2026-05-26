import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCertificate, getMyEnrolments } from '../../api/trainer';
import type { Enrolment } from '../../types';

export default function MyCoursesPage() {
  const queryClient = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: enrolments = [], isLoading } = useQuery({
    queryKey: ['my-enrolments'],
    queryFn: getMyEnrolments,
  });

  async function downloadCert(courseId: number, enrolmentId: number) {
    setDownloadingId(enrolmentId);
    try {
      const cert = await getCertificate(courseId);
      window.open(cert.fileUrl, '_blank');
    } catch {
      alert('Certificate not available. Please contact support.');
    } finally {
      setDownloadingId(null);
    }
  }

  // Refresh on mount so progress is up to date
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-enrolments'] });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-500 mt-1">
            {enrolments.length} course{enrolments.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button
          onClick={refresh}
          className="text-sm text-brand-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {enrolments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="text-brand-600 hover:underline font-medium">
            Browse courses →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrolments.map((enrolment: Enrolment) => {
            const isCompleted = enrolment.progressPct === 100;
            const isDownloading = downloadingId === enrolment.id;

            return (
              <div
                key={enrolment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex gap-4">
                  {enrolment.course.thumbnailUrl ? (
                    <img
                      src={enrolment.course.thumbnailUrl}
                      alt={enrolment.course.title}
                      className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📚</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/courses/${enrolment.course.id}`}
                      className="font-semibold text-gray-900 hover:text-brand-600 truncate block"
                    >
                      {enrolment.course.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enrolled {new Date(enrolment.enrolledAt).toLocaleDateString()}
                    </p>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>
                          {enrolment.completedLessonIds.length} / {enrolment.course.totalLessons} lessons
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isCompleted ? 'bg-green-500' : 'bg-brand-500'
                          }`}
                          style={{ width: `${enrolment.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {enrolment.completedAt && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Completed {new Date(enrolment.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-lg font-bold ${
                        isCompleted ? 'text-green-600' : 'text-brand-600'
                      }`}
                    >
                      {enrolment.progressPct}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/courses/${enrolment.course.id}`}
                    className="text-sm text-brand-600 hover:underline font-medium"
                  >
                    {isCompleted ? 'Review course' : 'Continue learning'} →
                  </Link>

                  {isCompleted && (
                    <button
                      onClick={() => downloadCert(enrolment.course.id, enrolment.id)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors"
                    >
                      🏆 {isDownloading ? 'Loading…' : 'Certificate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
