import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getAssessment, getMyAttempts, submitAttempt } from '../../api/trainer';
import type { AnswerRequest, AssessmentQuestion, AttemptResult } from '../../types';

// ── Result panel ─────────────────────────────────────────────────

function ResultPanel({ result, onRetry }: { result: AttemptResult; onRetry: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div
        className={`rounded-2xl p-8 text-center ${
          result.passed
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200'
            : 'bg-gradient-to-br from-red-50 to-rose-100 border border-red-200'
        }`}
      >
        <div className="text-6xl font-black mb-2" style={{ color: result.passed ? '#16a34a' : '#dc2626' }}>
          {result.score}%
        </div>
        <p className={`text-lg font-semibold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
          {result.passed ? '🎉 Passed!' : '❌ Not passed'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Passing score: {result.passingScore}%
        </p>
        {result.submittedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Submitted {new Date(result.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Per-question review */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800">Answer Review</h3>
        {result.answers.map((a, i) => (
          <div
            key={a.questionId}
            className={`border rounded-xl overflow-hidden ${
              a.isCorrect === true
                ? 'border-green-200'
                : a.isCorrect === false
                ? 'border-red-200'
                : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left p-4 flex items-center gap-3"
            >
              <span className="text-sm font-medium text-gray-700 flex-1">
                Q{i + 1}. {a.questionText}
              </span>
              <span className="text-sm shrink-0">
                {a.isCorrect === true ? '✅' : a.isCorrect === false ? '❌' : '📝'}
              </span>
              <span className="text-xs text-gray-400">{expanded === i ? '▲' : '▼'}</span>
            </button>

            {expanded === i && (
              <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                {a.questionType === 'MCQ' ? (
                  <p className="text-xs text-gray-500">
                    {a.isCorrect
                      ? 'Correct answer selected.'
                      : a.selectedOptionId
                      ? 'Wrong option selected.'
                      : 'No answer selected.'}
                    {' '}{a.marksAwarded}/{a.marksAwarded + (a.isCorrect ? 0 : 1)} marks
                  </p>
                ) : a.questionType === 'MULTI_SELECT' ? (
                  <p className="text-xs text-gray-500">
                    {a.isCorrect
                      ? 'All correct options selected.'
                      : (a.selectedOptionIds?.length ?? 0) > 0
                      ? 'Incorrect combination selected.'
                      : 'No options selected.'}
                    {' '}{a.marksAwarded} marks awarded
                  </p>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your answer:</p>
                    <p className="text-sm bg-gray-50 rounded p-2 text-gray-700">
                      {a.answerText || <span className="italic text-gray-400">No answer</span>}
                    </p>
                  </div>
                )}
                {a.explanation && (
                  <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-800">
                    <span className="font-semibold">Explanation: </span>{a.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onRetry}
        className="w-full border border-indigo-300 text-indigo-700 py-2.5 rounded-xl font-medium hover:bg-indigo-50"
      >
        Retake Assessment
      </button>
    </div>
  );
}

// ── Quiz form ─────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function QuizForm({
  questions,
  onSubmit,
  busy,
  timeLimitMinutes,
}: {
  questions: AssessmentQuestion[];
  onSubmit: (answers: AnswerRequest[]) => void;
  busy: boolean;
  timeLimitMinutes?: number;
}) {
  const [answers, setAnswers] = useState<Record<number, AnswerRequest>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(
    timeLimitMinutes ? timeLimitMinutes * 60 : null,
  );

  // Refs so the interval callback always sees the latest values without re-registering
  const answersRef = useRef(answers);
  const onSubmitRef = useRef(onSubmit);
  const didAutoSubmit = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  useEffect(() => {
    if (!timeLimitMinutes) return;
    const deadline = Date.now() + timeLimitMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const remaining = Math.round((deadline - Date.now()) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        if (!didAutoSubmit.current) {
          didAutoSubmit.current = true;
          onSubmitRef.current(
            questions.map(q => answersRef.current[q.id] ?? { questionId: q.id }),
          );
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []); // intentionally empty — runs once on mount

  function setMcq(questionId: number, optionId: number) {
    setAnswers(a => ({ ...a, [questionId]: { questionId, selectedOptionId: optionId } }));
  }

  function toggleMultiSelect(questionId: number, optionId: number, checked: boolean) {
    setAnswers(a => {
      const prev = a[questionId]?.selectedOptionIds ?? [];
      const next = checked ? [...prev, optionId] : prev.filter(id => id !== optionId);
      return { ...a, [questionId]: { questionId, selectedOptionIds: next } };
    });
  }

  function setShort(questionId: number, text: string) {
    setAnswers(a => ({ ...a, [questionId]: { questionId, answerText: text } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(questions.map(q => answers[q.id] ?? { questionId: q.id }));
  }

  const isWarning = timeLeft !== null && timeLeft <= 60 && timeLeft > 30;
  const isCritical = timeLeft !== null && timeLeft <= 30;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {timeLeft !== null && (
        <div
          className={`sticky top-0 z-10 flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm border ${
            isCritical
              ? 'bg-red-600 border-red-700 text-white animate-pulse'
              : isWarning
              ? 'bg-orange-500 border-orange-600 text-white'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span>⏱ Time remaining</span>
          <span className="text-lg font-mono tracking-widest">{formatTime(timeLeft)}</span>
        </div>
      )}

      {questions.map((q, idx) => {
        const ans = answers[q.id];
        return (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex gap-3 items-start mb-3">
              <span className="text-xs text-gray-400 mt-0.5 shrink-0">Q{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{q.text}</p>
                <span className="text-xs text-gray-400">
                  {q.type === 'MCQ' ? 'Multiple choice' : q.type === 'MULTI_SELECT' ? 'Multiple select' : 'Short answer'} · {q.marks} mark{q.marks !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {q.type === 'MCQ' ? (
              <div className="space-y-2 ml-6">
                {q.options.map((opt, oi) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                      ans?.selectedOptionId === opt.id
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt.id}
                      checked={ans?.selectedOptionId === opt.id}
                      onChange={() => setMcq(q.id, opt.id)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-xs font-medium text-gray-500 w-4">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    <span className="text-sm text-gray-800">{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : q.type === 'MULTI_SELECT' ? (
              <div className="space-y-2 ml-6">
                <p className="text-xs text-amber-600 font-medium">Select all that apply</p>
                {q.options.map((opt, oi) => {
                  const selected = ans?.selectedOptionIds?.includes(opt.id) ?? false;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                        selected
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={e => toggleMultiSelect(q.id, opt.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-medium text-gray-500 w-4">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      <span className="text-sm text-gray-800">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={ans?.answerText ?? ''}
                onChange={e => setShort(q.id, e.target.value)}
                placeholder="Type your answer here…"
                rows={3}
                className="w-full ml-6 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Submit Assessment'}
      </button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const { id: courseIdStr } = useParams<{ id: string }>();
  const courseId = Number(courseIdStr);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'list' | 'take'>('list');
  const [latestResult, setLatestResult] = useState<AttemptResult | null>(null);

  const { data: assessment, isLoading: loadingAssessment, isError } = useQuery({
    queryKey: ['assessment-seeker', courseId],
    queryFn: () => getAssessment(courseId),
    retry: false,
  });

  const { data: attempts = [], refetch: refetchAttempts } = useQuery({
    queryKey: ['my-attempts', courseId],
    queryFn: () => getMyAttempts(courseId),
    enabled: !!assessment,
  });

  const submitMut = useMutation({
    mutationFn: (answers: AnswerRequest[]) => submitAttempt(courseId, answers),
    onSuccess: result => {
      setLatestResult(result);
      refetchAttempts();
      setMode('list');
    },
  });

  if (loadingAssessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">No assessment available for this course yet.</p>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="mt-4 text-indigo-600 hover:underline text-sm"
        >
          ← Back to course
        </button>
      </div>
    );
  }

  const bestScore = attempts.length
    ? Math.max(...attempts.map(a => a.score))
    : null;
  const hasPassed = attempts.some(a => a.passed);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{assessment.courseTitle}</p>
        </div>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back
        </button>
      </div>

      {assessment.description && (
        <p className="text-gray-600 text-sm">{assessment.description}</p>
      )}

      <div className="flex gap-4 text-sm text-gray-500">
        <span>{assessment.questions.length} questions</span>
        <span>Passing: {assessment.passingScore}%</span>
        {assessment.timeLimitMinutes && <span>{assessment.timeLimitMinutes} min</span>}
        {bestScore !== null && (
          <span className={hasPassed ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
            Best: {bestScore}%{hasPassed ? ' ✓ Passed' : ''}
          </span>
        )}
      </div>

      {mode === 'list' && (
        <div className="space-y-4">
          {latestResult && (
            <ResultPanel result={latestResult} onRetry={() => { setLatestResult(null); setMode('take'); }} />
          )}

          {!latestResult && (
            <>
              {attempts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Previous attempts</h3>
                  {attempts.map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm"
                    >
                      <span className="text-gray-600">Attempt {i + 1}</span>
                      <span className={a.passed ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {a.score}% — {a.passed ? 'Passed' : 'Failed'}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(a.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setMode('take')}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700"
              >
                {attempts.length > 0 ? 'Retake Assessment' : 'Start Assessment'}
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'take' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              {assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => setMode('list')}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
          <QuizForm
            questions={assessment.questions}
            onSubmit={ans => submitMut.mutate(ans)}
            busy={submitMut.isPending}
            timeLimitMinutes={assessment.timeLimitMinutes}
          />
          {submitMut.isError && (
            <p className="text-sm text-red-600 text-center">Submission failed. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
