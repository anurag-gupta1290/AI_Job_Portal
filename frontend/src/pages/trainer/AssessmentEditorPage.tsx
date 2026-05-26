import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addQuestion,
  createAssessment,
  deleteAssessment,
  deleteQuestion,
  getAssessmentTrainer,
  getTrainerAttempts,
  updateAssessment,
  updateQuestion,
} from '../../api/trainer';
import type {
  AddQuestionRequest,
  Assessment,
  AssessmentQuestion,
  AttemptResult,
  CreateAssessmentRequest,
  OptionRequest,
  QuestionType,
} from '../../types';

// ── Sub-forms ─────────────────────────────────────────────────────

function SettingsForm({
  initial,
  onSave,
  busy,
}: {
  initial: CreateAssessmentRequest;
  onSave: (r: CreateAssessmentRequest) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState(initial);
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(form); }}
      className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
    >
      <h2 className="text-base font-semibold text-gray-800">Assessment Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passing score (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.passingScore}
            onChange={e => setForm(f => ({ ...f, passingScore: Number(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time limit (minutes)</label>
          <input
            type="number"
            min={1}
            value={form.timeLimitMinutes ?? ''}
            onChange={e =>
              setForm(f => ({ ...f, timeLimitMinutes: e.target.value ? Number(e.target.value) : undefined }))
            }
            placeholder="No limit"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={form.isPublished}
            onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          <label htmlFor="published" className="text-sm text-gray-700">Publish assessment</label>
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}

const emptyOption = (): OptionRequest => ({ text: '', isCorrect: false });

function QuestionForm({
  initial,
  orderIndex,
  onSave,
  onCancel,
  busy,
}: {
  initial?: Partial<AddQuestionRequest>;
  orderIndex: number;
  onSave: (r: AddQuestionRequest) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [type, setType] = useState<QuestionType>(initial?.type ?? 'MCQ');
  const [text, setText] = useState(initial?.text ?? '');
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [marks, setMarks] = useState(initial?.marks ?? 1);
  const [options, setOptions] = useState<OptionRequest[]>(
    initial?.options?.length ? initial.options : [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
  );

  function setOption(idx: number, field: keyof OptionRequest, value: string | boolean) {
    setOptions(opts => opts.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  }

  function markCorrect(idx: number) {
    setOptions(opts => opts.map((o, i) => ({ ...o, isCorrect: i === idx })));
  }

  function toggleCorrect(idx: number) {
    setOptions(opts => opts.map((o, i) => (i === idx ? { ...o, isCorrect: !o.isCorrect } : o)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((type === 'MCQ' || type === 'MULTI_SELECT') && !options.some(o => o.isCorrect)) {
      alert('Please mark at least one option as correct.');
      return;
    }
    if (type === 'MCQ' && options.filter(o => o.isCorrect).length > 1) {
      alert('MCQ allows only one correct answer. Use Multi-Select for multiple correct answers.');
      return;
    }
    onSave({
      type,
      text,
      explanation: explanation || undefined,
      orderIndex,
      marks,
      options: type !== 'SHORT_ANSWER' ? options.filter(o => o.text.trim()) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Q{orderIndex + 1}
        </span>
        <select
          value={type}
          onChange={e => setType(e.target.value as QuestionType)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="MCQ">Multiple Choice (single)</option>
          <option value="MULTI_SELECT">Multiple Select (many)</option>
          <option value="SHORT_ANSWER">Short Answer</option>
        </select>
        <input
          type="number"
          min={1}
          value={marks}
          onChange={e => setMarks(Number(e.target.value))}
          className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm"
          title="Marks"
        />
        <span className="text-xs text-gray-400">mark{marks !== 1 ? 's' : ''}</span>
      </div>

      <textarea
        required
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Question text *"
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
      />

      {(type === 'MCQ' || type === 'MULTI_SELECT') && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            {type === 'MCQ'
              ? 'Options — click radio to mark the single correct answer'
              : 'Options — check all correct answers (multiple allowed)'}
          </p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              {type === 'MCQ' ? (
                <input
                  type="radio"
                  name="correct"
                  checked={opt.isCorrect}
                  onChange={() => markCorrect(i)}
                  className="h-4 w-4 text-indigo-600"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={opt.isCorrect}
                  onChange={() => toggleCorrect(i)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
              )}
              <input
                value={opt.text}
                onChange={e => setOption(i, 'text', e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      )}

      {type === 'SHORT_ANSWER' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
          Short-answer responses are saved for review. Auto-grading applies only to MCQ questions.
        </div>
      )}

      <input
        value={explanation}
        onChange={e => setExplanation(e.target.value)}
        placeholder="Explanation shown after submission (optional)"
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save Question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Results panel ─────────────────────────────────────────────────

function ResultsPanel({ attempts, passingScore }: { attempts: AttemptResult[]; passingScore: number }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-400 text-sm">No attempts yet. Seekers haven't taken this assessment.</p>
      </div>
    );
  }

  const passed = attempts.filter(a => a.passed).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-sm text-gray-500 bg-white border border-gray-100 rounded-xl px-5 py-3">
        <span><span className="font-semibold text-gray-800">{attempts.length}</span> total attempts</span>
        <span><span className="font-semibold text-green-700">{passed}</span> passed</span>
        <span><span className="font-semibold text-red-600">{attempts.length - passed}</span> failed</span>
        <span>Passing score: <span className="font-semibold text-gray-800">{passingScore}%</span></span>
      </div>

      {attempts.map(a => (
        <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
            className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{a.seekerName ?? 'Unknown'}</p>
              <p className="text-xs text-gray-400">{a.seekerEmail}</p>
            </div>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ${
                a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {a.score}%
            </span>
            <span className={`text-xs font-medium shrink-0 ${a.passed ? 'text-green-600' : 'text-red-500'}`}>
              {a.passed ? 'Passed' : 'Failed'}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(a.submittedAt).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">{expandedId === a.id ? '▲' : '▼'}</span>
          </button>

          {expandedId === a.id && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 mb-2">Answer breakdown</p>
              {a.answers.map((ans, i) => (
                <div
                  key={ans.questionId}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    ans.isCorrect === true
                      ? 'border-green-200 bg-green-50'
                      : ans.isCorrect === false
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-800">
                      Q{i + 1}. {ans.questionText}
                    </p>
                    <span className="shrink-0">
                      {ans.isCorrect === true ? '✅' : ans.isCorrect === false ? '❌' : '📝'}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-500">
                    {ans.questionType === 'SHORT_ANSWER' ? (
                      <span>Answer: {ans.answerText || <em>No answer</em>}</span>
                    ) : (
                      <span>{ans.marksAwarded} mark{ans.marksAwarded !== 1 ? 's' : ''} awarded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function AssessmentEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const cId = Number(courseId);
  const qc = useQueryClient();

  const { data: assessment, isLoading, isError } = useQuery<Assessment>({
    queryKey: ['assessment-trainer', cId],
    queryFn: () => getAssessmentTrainer(cId),
    retry: false,
  });

  const [tab, setTab] = useState<'editor' | 'results'>('editor');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);

  const { data: attempts = [] } = useQuery<AttemptResult[]>({
    queryKey: ['assessment-attempts-trainer', cId],
    queryFn: () => getTrainerAttempts(cId),
    enabled: !!assessment && tab === 'results',
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['assessment-trainer', cId] });

  const createMut = useMutation({
    mutationFn: (r: CreateAssessmentRequest) => createAssessment(cId, r),
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: (r: CreateAssessmentRequest) => updateAssessment(cId, r),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteAssessment(cId),
    onSuccess: () => qc.setQueryData(['assessment-trainer', cId], undefined),
  });

  const addQMut = useMutation({
    mutationFn: (r: AddQuestionRequest) => addQuestion(cId, r),
    onSuccess: () => { invalidate(); setAddingQuestion(false); },
  });

  const updateQMut = useMutation({
    mutationFn: ({ id, r }: { id: number; r: AddQuestionRequest }) => updateQuestion(cId, id, r),
    onSuccess: () => { invalidate(); setEditingQuestion(null); },
  });

  const deleteQMut = useMutation({
    mutationFn: (qId: number) => deleteQuestion(cId, qId),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const defaultSettings: CreateAssessmentRequest = {
    title: 'Course Assessment',
    description: '',
    passingScore: 70,
    isPublished: false,
  };

  // No assessment yet — show create form
  if (isError || !assessment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Assessment</h1>
        <p className="text-gray-500 text-sm">No assessment exists yet. Create one below.</p>
        <SettingsForm
          initial={defaultSettings}
          onSave={r => createMut.mutate(r)}
          busy={createMut.isPending}
        />
        {createMut.isError && (
          <p className="text-sm text-red-600">Failed to create assessment.</p>
        )}
      </div>
    );
  }

  const questions = assessment.questions;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assessment</h1>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              assessment.isPublished
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {assessment.isPublished ? 'Published' : 'Draft'}
          </span>
          <button
            onClick={() => {
              if (confirm('Delete this entire assessment and all questions?')) {
                deleteMut.mutate();
              }
            }}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('editor')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'editor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setTab('results')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'results' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Results
        </button>
      </div>

      {tab === 'results' && (
        <ResultsPanel attempts={attempts} passingScore={assessment.passingScore} />
      )}

      {tab === 'editor' && <>

      {/* Settings */}
      <SettingsForm
        initial={{
          title: assessment.title,
          description: assessment.description,
          passingScore: assessment.passingScore,
          timeLimitMinutes: assessment.timeLimitMinutes,
          isPublished: assessment.isPublished,
        }}
        onSave={r => updateMut.mutate(r)}
        busy={updateMut.isPending}
      />

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Questions ({questions.length})
          </h2>
          {!addingQuestion && (
            <button
              onClick={() => { setAddingQuestion(true); setEditingQuestion(null); }}
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
            >
              + Add Question
            </button>
          )}
        </div>

        {addingQuestion && (
          <QuestionForm
            orderIndex={questions.length}
            onSave={r => addQMut.mutate(r)}
            onCancel={() => setAddingQuestion(false)}
            busy={addQMut.isPending}
          />
        )}

        {questions.map((q, idx) => (
          <div key={q.id}>
            {editingQuestion?.id === q.id ? (
              <QuestionForm
                initial={{
                  type: q.type,
                  text: q.text,
                  explanation: q.explanation ?? '',
                  orderIndex: q.orderIndex,
                  marks: q.marks,
                  options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect ?? false })),
                }}
                orderIndex={idx}
                onSave={r => updateQMut.mutate({ id: q.id, r })}
                onCancel={() => setEditingQuestion(null)}
                busy={updateQMut.isPending}
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">Q{idx + 1}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          q.type === 'MCQ'
                            ? 'bg-blue-100 text-blue-700'
                            : q.type === 'MULTI_SELECT'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {q.type === 'MCQ' ? 'MCQ' : q.type === 'MULTI_SELECT' ? 'Multi-Select' : 'Short Answer'}
                      </span>
                      <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{q.text}</p>

                    {(q.type === 'MCQ' || q.type === 'MULTI_SELECT') && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((o, oi) => (
                          <li
                            key={o.id}
                            className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                              o.isCorrect ? 'bg-green-50 text-green-800' : 'text-gray-600'
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {o.text}
                            {o.isCorrect && <span className="ml-auto text-green-600">✓ correct</span>}
                          </li>
                        ))}
                      </ul>
                    )}

                    {q.explanation && (
                      <p className="mt-2 text-xs text-gray-400 italic">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingQuestion(q); setAddingQuestion(false); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this question?')) deleteQMut.mutate(q.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {questions.length === 0 && !addingQuestion && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">No questions yet. Add your first question.</p>
          </div>
        )}
      </div>

      </>}
    </div>
  );
}
