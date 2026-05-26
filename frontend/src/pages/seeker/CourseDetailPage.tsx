import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  enrolInCourse,
  getCertificate,
  getCourseSessions,
  getMyEnrolments,
  getPublicCourse,
  markLessonComplete,
  updateWatchProgress,
} from '../../api/trainer';
import { useAuthStore } from '@/store/authStore';
import type { LessonDto, LiveSession } from '../../types';

const MaterialIcon: Record<string, string> = {
  PDF: '📄',
  SLIDES: '📊',
  ASSIGNMENT: '📝',
  LINK: '🔗',
};

const PlatformIcon: Record<string, string> = {
  ZOOM: '🎥',
  JITSI: '📡',
  GOOGLE_MEET: '📹',
  OTHER: '🔗',
};

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID  or  youtu.be/ID
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      const v = u.pathname.slice(1);
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    // vimeo.com/ID
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com') {
      const v = u.pathname.slice(1);
      if (v) return `https://player.vimeo.com/video/${v}`;
    }
  } catch {
    // not a valid URL — fall through
  }
  return url;
}

function VideoPlayer({
  lesson,
  courseId,
  enrolled,
}: {
  lesson: LessonDto;
  courseId: number;
  enrolled: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPctRef = useRef(0);

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration || !enrolled) return;
    const pct = Math.round((v.currentTime / v.duration) * 100);
    if (pct >= lastPctRef.current + 5 && pct <= 100) {
      lastPctRef.current = pct;
      updateWatchProgress(courseId, lesson.id, pct).catch(() => {});
    }
  }

  if (!lesson.videoUrl) return null;

  const isExternal =
    lesson.videoUrl.startsWith('http://') || lesson.videoUrl.startsWith('https://');

  const embedUrl = isExternal ? toEmbedUrl(lesson.videoUrl) : lesson.videoUrl;

  return (
    <div className="mt-3 rounded-lg overflow-hidden bg-black">
      {isExternal ? (
        <iframe
          src={embedUrl}
          title={lesson.title}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={lesson.videoUrl}
          controls
          className="w-full aspect-video"
          onTimeUpdate={onTimeUpdate}
        />
      )}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [certLoading, setCertLoading] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['public-course', courseId],
    queryFn: () => getPublicCourse(courseId),
  });

  const isSeeker = user?.role === 'ROLE_JOB_SEEKER';
  const enrolled = course?.enrolled ?? false;

  const { data: myEnrolments } = useQuery({
    queryKey: ['my-enrolments'],
    queryFn: getMyEnrolments,
    enabled: isSeeker && enrolled,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', courseId],
    queryFn: () => getCourseSessions(courseId),
  });

  const currentEnrolment = myEnrolments?.find(e => e.course.id === courseId);
  const completedIds = new Set(currentEnrolment?.completedLessonIds ?? []);
  const isCompleted = (currentEnrolment?.progressPct ?? 0) === 100;

  const enrolMutation = useMutation({
    mutationFn: () => enrolInCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-enrolments'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId: number) => markLessonComplete(courseId, lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-enrolments'] }),
  });

  async function handleDownloadCert() {
    setCertLoading(true);
    try {
      const cert = await getCertificate(courseId);
      window.open(cert.fileUrl, '_blank');
    } catch {
      alert('Certificate not available yet. Please ensure the course is completed.');
    } finally {
      setCertLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!course) return <p className="text-center py-12 text-gray-500">Course not found.</p>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Course header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
            <span className="text-6xl">📚</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h1>
              <p className="text-sm text-gray-500">by {course.trainer.fullName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-brand-700">
                {course.fees === 0 ? 'Free' : `₹${course.fees.toLocaleString()}`}
              </p>
              <p className="text-xs text-gray-400">{course.totalEnrolled} enrolled</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {course.skills.map((skill) => (
              <span key={skill} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>

          {course.description && (
            <p className="text-gray-600 mt-4 text-sm leading-relaxed">{course.description}</p>
          )}

          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
            <span>{course.lessons.length} lessons</span>
            {course.durationHours && <span>{course.durationHours} hours</span>}
          </div>

          {isSeeker && !enrolled && (
            <button
              onClick={() => enrolMutation.mutate()}
              disabled={enrolMutation.isPending}
              className="mt-5 w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
            >
              {enrolMutation.isPending ? 'Enrolling…' : 'Enrol Now'}
            </button>
          )}

          {enrolled && (
            <div className="mt-5 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-700 font-medium text-sm">Enrolled</span>
                  <span className="text-green-700 text-sm font-bold">
                    {currentEnrolment?.progressPct ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${currentEnrolment?.progressPct ?? 0}%` }}
                  />
                </div>
              </div>

              {isCompleted && (
                <button
                  onClick={handleDownloadCert}
                  disabled={certLoading}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  🏆 {certLoading ? 'Generating…' : 'Download Certificate'}
                </button>
              )}
              <button
                onClick={() => navigate(`/courses/${courseId}/assessment`)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                📝 Take Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Syllabus */}
      {course.syllabus && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Syllabus</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{course.syllabus}</p>
        </div>
      )}

      {/* Lessons */}
      {course.lessons.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Lessons ({course.lessons.length})
          </h2>
          <div className="space-y-2">
            {course.lessons.map((lesson: LessonDto) => {
              const isDone = completedIds.has(lesson.id);
              const isExpanded = expandedLessonId === lesson.id;
              const canWatch = enrolled && isSeeker && lesson.videoUrl;

              return (
                <div
                  key={lesson.id}
                  className={`rounded-lg border ${isDone ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between p-3">
                    <div
                      className={`flex items-center gap-3 flex-1 min-w-0 ${canWatch ? 'cursor-pointer' : ''}`}
                      onClick={() => canWatch && setExpandedLessonId(isExpanded ? null : lesson.id)}
                    >
                      <span className="text-xs text-gray-400 w-6 text-right shrink-0">
                        {isDone ? '✅' : lesson.orderIndex + '.'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                        {lesson.durationMinutes && (
                          <p className="text-xs text-gray-400">{lesson.durationMinutes} min</p>
                        )}
                      </div>
                      {lesson.isPreview && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded shrink-0">
                          Preview
                        </span>
                      )}
                      {canWatch && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {isExpanded ? '▲' : '▶'}
                        </span>
                      )}
                    </div>

                    {enrolled && isSeeker && !isDone && (
                      <button
                        onClick={() => completeMutation.mutate(lesson.id)}
                        disabled={completeMutation.isPending}
                        className="text-xs text-brand-600 hover:underline disabled:opacity-40 shrink-0 ml-2"
                      >
                        Mark complete
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <VideoPlayer lesson={lesson} courseId={courseId} enrolled={enrolled} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Materials */}
      {course.materials.length > 0 && (enrolled || course.materials.some((m) => m.type === 'LINK')) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Materials</h2>
          <div className="space-y-2">
            {course.materials.map((mat) => (
              <div key={mat.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <span className="text-lg">{MaterialIcon[mat.type] ?? '📎'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{mat.title}</p>
                  <p className="text-xs text-gray-400">{mat.type}</p>
                </div>
                {mat.fileUrl && (
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Sessions */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Live Sessions ({sessions.length})
          </h2>
          <div className="space-y-3">
            {sessions.map((s: LiveSession) => (
              <div key={s.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{PlatformIcon[s.platform] ?? '🔗'}</span>
                      <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    </div>
                    {s.description && (
                      <p className="text-xs text-gray-500 mb-2">{s.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {s.scheduledAt && (
                        <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                      )}
                      {s.durationMinutes && <span>{s.durationMinutes} min</span>}
                      <span className="capitalize">{s.platform.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {enrolled && (
                      <a
                        href={s.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-center"
                      >
                        Join →
                      </a>
                    )}
                    {s.recordingUrl && (
                      <a
                        href={s.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 text-center"
                      >
                        Recording
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
