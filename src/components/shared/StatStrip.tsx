import { cn } from '@/lib/utils';

export type Stat = { label: string; value: string; tone?: 'default' | 'negative' };

/** One bordered card split into columns by dashed dividers (2 cols mobile, 3 tablet, all in a row on desktop). */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-white md:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            'min-w-0 border-l border-t border-dashed border-line px-5 py-4',
            // remove left border at the start of each row, top border on the first row
            'max-md:[&:nth-child(2n+1)]:border-l-0 max-md:[&:nth-child(-n+2)]:border-t-0',
            'md:max-lg:[&:nth-child(3n+1)]:border-l-0 md:max-lg:[&:nth-child(-n+3)]:border-t-0',
            'lg:border-t-0 lg:first:border-l-0'
          )}
        >
          <p className="truncate text-[13px] text-ink-secondary">{s.label}</p>
          <p
            className={cn('mt-2 truncate text-2xl font-normal tracking-tight', s.tone === 'negative' ? 'text-red-600' : 'text-ink')}
            title={s.value}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
