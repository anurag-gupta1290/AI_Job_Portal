import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCourse,
  updateCourse,
  getCourseDetail,
  addLesson,
  updateLesson,
  deleteLesson,
  addMaterial,
  deleteMaterial,
  uploadThumbnail,
} from '../../api/trainer';
import type { CourseStatus, AddLessonRequest, AddMaterialRequest, MaterialType, LessonDto } from '../../types';

const MATERIAL_TYPES: MaterialType[] = ['PDF', 'SLIDES', 'ASSIGNMENT', 'LINK'];
const STATUS_OPTIONS: CourseStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export default function CreateCoursePage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const courseId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [fees, setFees] = useState('0');
  const [durationHours, setDurationHours] = useState('');
  const [status, setStatus] = useState<CourseStatus>('DRAFT');
  const [error, setError] = useState('');

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonOrder, setLessonOrder] = useState('0');
  const [lessonPreview, setLessonPreview] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [editPreview, setEditPreview] = useState(false);

  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<MaterialType>('LINK');
  const [matUrl, setMatUrl] = useState('');

  const { data: course } = useQuery({
    queryKey: ['trainer-course', courseId],
    queryFn: () => getCourseDetail(courseId),
    enabled: isEdit,
  });

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description ?? '');
      setSyllabus(course.syllabus ?? '');
      setFees(String(course.fees));
      setDurationHours(course.durationHours ? String(course.durationHours) : '');
      setStatus(course.status);
    }
  }, [course]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description,
        syllabus,
        fees: parseFloat(fees) || 0,
        durationHours: durationHours ? parseFloat(durationHours) : undefined,
        status,
      };
      return isEdit ? updateCourse(courseId, payload) : createCourse(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainer-courses'] });
      if (!isEdit) navigate(`/trainer/courses/${data.id}/edit`);
    },
    onError: () => setError('Failed to save course. Please try again.'),
  });

  const addLessonMutation = useMutation({
    mutationFn: () => {
      const req: AddLessonRequest = {
        title: lessonTitle,
        videoUrl: lessonVideoUrl.trim() || undefined,
        durationMinutes: lessonDuration ? parseInt(lessonDuration) : undefined,
        orderIndex: parseInt(lessonOrder) || 0,
        isPreview: lessonPreview,
      };
      return addLesson(courseId, req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-course', courseId] });
      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonDuration('');
      setLessonOrder(String((course?.lessons.length ?? 0) + 1));
      setLessonPreview(false);
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: (lessonId: number) => {
      const req: AddLessonRequest = {
        title: editTitle,
        videoUrl: editVideoUrl.trim() || undefined,
        durationMinutes: editDuration ? parseInt(editDuration) : undefined,
        orderIndex: parseInt(editOrder) || 0,
        isPreview: editPreview,
      };
      return updateLesson(courseId, lessonId, req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-course', courseId] });
      setEditingLesson(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: number) => deleteLesson(courseId, lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-course', courseId] }),
  });

  const addMatMutation = useMutation({
    mutationFn: () => {
      const req: AddMaterialRequest = { title: matTitle, type: matType, fileUrl: matUrl };
      return addMaterial(courseId, req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-course', courseId] });
      setMatTitle('');
      setMatUrl('');
    },
  });

  const deleteMatMutation = useMutation({
    mutationFn: (matId: number) => deleteMaterial(courseId, matId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-course', courseId] }),
  });

  const thumbnailMutation = useMutation({
    mutationFn: (file: File) => uploadThumbnail(courseId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-course', courseId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    saveMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Course' : 'Create Course'}
      </h1>

      {/* ── Basic Info ── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. React for Beginners"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="What will learners achieve?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus</label>
          <textarea
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Topics covered..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fees (₹)</label>
            <input
              type="number"
              min="0"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CourseStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Course'}
        </button>
      </form>

      {/* ── Thumbnail (edit only) ── */}
      {isEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Thumbnail</h2>
          {course?.thumbnailUrl && (
            <img src={course.thumbnailUrl} alt="Thumbnail" className="w-40 h-24 object-cover rounded-lg" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) thumbnailMutation.mutate(file);
            }}
            className="block text-sm text-gray-600"
          />
          {thumbnailMutation.isPending && <p className="text-sm text-gray-400">Uploading…</p>}
        </div>
      )}

      {/* ── Lessons (edit only) ── */}
      {isEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Lessons</h2>

          {(course?.lessons ?? []).map((lesson) => (
            <div key={lesson.id} className="rounded-lg border border-gray-200 overflow-hidden">
              {editingLesson?.id === lesson.id ? (
                <div className="p-3 bg-gray-50 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Lesson title"
                      className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="number"
                      value={editOrder}
                      onChange={(e) => setEditOrder(e.target.value)}
                      placeholder="Order"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <input
                    value={editVideoUrl}
                    onChange={(e) => setEditVideoUrl(e.target.value)}
                    placeholder="Video URL (YouTube, Vimeo, or direct link)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      placeholder="Duration (minutes)"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600 px-2">
                      <input
                        type="checkbox"
                        checked={editPreview}
                        onChange={(e) => setEditPreview(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Free preview
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateLessonMutation.mutate(lesson.id)}
                      disabled={updateLessonMutation.isPending}
                      className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-brand-700 disabled:opacity-60"
                    >
                      {updateLessonMutation.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingLesson(null)}
                      className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-400 shrink-0">#{lesson.orderIndex}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{lesson.title}</span>
                    {lesson.videoUrl
                      ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">🎬 Video</span>
                      : <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">No video</span>
                    }
                    {lesson.isPreview && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded shrink-0">Preview</span>
                    )}
                  </div>
                  <div className="flex gap-3 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
                        setEditTitle(lesson.title);
                        setEditVideoUrl(lesson.videoUrl ?? '');
                        setEditDuration(lesson.durationMinutes ? String(lesson.durationMinutes) : '');
                        setEditOrder(String(lesson.orderIndex));
                        setEditPreview(lesson.isPreview);
                      }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteLessonMutation.mutate(lesson.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Add Lesson</p>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Lesson title"
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="number"
                value={lessonOrder}
                onChange={(e) => setLessonOrder(e.target.value)}
                placeholder="Order"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <input
              value={lessonVideoUrl}
              onChange={(e) => setLessonVideoUrl(e.target.value)}
              placeholder="Video URL (YouTube, Vimeo, or direct link)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(e.target.value)}
                placeholder="Duration (minutes)"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 px-2">
                <input
                  type="checkbox"
                  checked={lessonPreview}
                  onChange={(e) => setLessonPreview(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Free preview
              </label>
            </div>
            <button
              onClick={() => lessonTitle.trim() && addLessonMutation.mutate()}
              disabled={addLessonMutation.isPending}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 disabled:opacity-60"
            >
              {addLessonMutation.isPending ? 'Adding…' : 'Add Lesson'}
            </button>
          </div>
        </div>
      )}

      {/* ── Materials (edit only) ── */}
      {isEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Materials</h2>

          {(course?.materials ?? []).map((mat) => (
            <div key={mat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mr-2">{mat.type}</span>
                <span className="text-sm font-medium text-gray-800">{mat.title}</span>
              </div>
              <button
                onClick={() => deleteMatMutation.mutate(mat.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Add Material</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                placeholder="Material title"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={matType}
                onChange={(e) => setMatType(e.target.value as MaterialType)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input
              value={matUrl}
              onChange={(e) => setMatUrl(e.target.value)}
              placeholder="URL or file link"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => matTitle.trim() && addMatMutation.mutate()}
              disabled={addMatMutation.isPending}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-700 disabled:opacity-60"
            >
              {addMatMutation.isPending ? 'Adding…' : 'Add Material'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
