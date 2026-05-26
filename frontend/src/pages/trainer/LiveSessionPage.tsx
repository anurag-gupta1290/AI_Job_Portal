import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSession,
  deleteSession,
  getCourseSessions,
  updateSession,
} from '../../api/trainer';
import type {
  CreateLiveSessionRequest,
  LiveSession,
  LiveSessionPlatform,
  UpdateLiveSessionRequest,
} from '../../types';

const PLATFORMS: { value: LiveSessionPlatform; label: string }[] = [
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'JITSI', label: 'Jitsi' },
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm = (): CreateLiveSessionRequest => ({
  title: '',
  description: '',
  scheduledAt: '',
  durationMinutes: 60,
  platform: 'ZOOM',
  meetingUrl: '',
});

export default function LiveSessionPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const cId = Number(courseId);
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', cId],
    queryFn: () => getCourseSessions(cId),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [form, setForm] = useState<CreateLiveSessionRequest>(emptyForm());
  const [recordingUrl, setRecordingUrl] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['sessions', cId] });

  const createMutation = useMutation({
    mutationFn: (req: CreateLiveSessionRequest) => createSession(cId, req),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, req }: { sessionId: number; req: UpdateLiveSessionRequest }) =>
      updateSession(cId, sessionId, req),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: number) => deleteSession(cId, sessionId),
    onSuccess: invalidate,
  });

  function resetForm() {
    setForm(emptyForm());
    setRecordingUrl('');
    setEditingSession(null);
    setShowForm(false);
  }

  function startEdit(s: LiveSession) {
    setEditingSession(s);
    setForm({
      title: s.title,
      description: s.description ?? '',
      scheduledAt: s.scheduledAt ? s.scheduledAt.slice(0, 16) : '',
      durationMinutes: s.durationMinutes ?? 60,
      platform: s.platform,
      meetingUrl: s.meetingUrl,
    });
    setRecordingUrl(s.recordingUrl ?? '');
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      scheduledAt: form.scheduledAt ? form.scheduledAt + ':00' : undefined,
    };
    if (editingSession) {
      updateMutation.mutate({ sessionId: editingSession.id, req: { ...payload, recordingUrl } });
    } else {
      createMutation.mutate(payload);
    }
  }

  const busy = createMutation.isPending || updateMutation.isPending;

  const platformBadgeColor: Record<LiveSessionPlatform, string> = {
    ZOOM: 'bg-blue-100 text-blue-800',
    JITSI: 'bg-green-100 text-green-800',
    GOOGLE_MEET: 'bg-red-100 text-red-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Schedule Session
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            {editingSession ? 'Edit Session' : 'New Live Session'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Session title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="What will be covered?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
              <select
                required
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value as LiveSessionPlatform }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                {PLATFORMS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                value={form.durationMinutes ?? ''}
                onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled date &amp; time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL *</label>
              <input
                required
                type="url"
                value={form.meetingUrl}
                onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>

            {editingSession && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Recording URL</label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={e => setRecordingUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600">Failed to save session. Please try again.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : editingSession ? 'Update Session' : 'Schedule Session'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-center py-12">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No live sessions scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformBadgeColor[s.platform]}`}
                    >
                      {s.platform.replace('_', ' ')}
                    </span>
                    {s.recordingUrl && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                        Recording available
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 truncate">{s.title}</h3>
                  {s.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                    {s.scheduledAt && (
                      <span>
                        {new Date(s.scheduledAt).toLocaleString()}
                      </span>
                    )}
                    {s.durationMinutes && <span>{s.durationMinutes} min</span>}
                  </div>
                  <div className="mt-2 flex gap-3">
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Join Meeting →
                    </a>
                    {s.recordingUrl && (
                      <a
                        href={s.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        Watch Recording →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this session?')) deleteMutation.mutate(s.id);
                    }}
                    className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
