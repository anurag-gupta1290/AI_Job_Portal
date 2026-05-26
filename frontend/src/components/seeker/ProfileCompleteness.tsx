import clsx from 'clsx';

export default function ProfileCompleteness({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-amber-500' :
                'bg-red-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800">Profile Completeness</p>
        <span className={clsx(
          'text-xs font-bold px-2 py-0.5 rounded-full',
          pct >= 80 ? 'bg-emerald-50 text-emerald-700' :
          pct >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-600'
        )}>
          {pct}%
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {pct < 100 && (
        <p className="text-xs text-gray-500 mt-2">
          {pct < 40
            ? 'Add your headline, summary and resume to get noticed.'
            : pct < 70
            ? 'Add experience, education and skills to improve your score.'
            : 'Almost there — add your LinkedIn URL to reach 100%.'}
        </p>
      )}
    </div>
  );
}
