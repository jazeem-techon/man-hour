/** "Get Started" card with a circular progress ring. */
export function SetupProgress({ completed, total, title = 'Get Started' }: { completed: number; total: number; title?: string }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-secondary">{completed}/{total} Completed</p>
      </div>
    </div>
  );
}
