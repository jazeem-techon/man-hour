import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const bar = 'bg-gray-200/70';

/** Card-shaped table placeholder: header row + body rows. */
export function TableSkeleton({ rows = 8, cols = 5, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-white', className)} aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between border-b border-dashed border-line px-4 py-3 mx-0">
        <Skeleton className={cn('h-4 w-40', bar)} />
        <Skeleton className={cn('h-4 w-16', bar)} />
      </div>
      <div className="grid gap-4 bg-gray-50 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3 w-16', bar)} />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid items-center gap-4 px-4 py-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', bar, c === 0 ? 'w-20' : c % 2 ? 'w-3/4' : 'w-1/2')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatStripSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-white md:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-l border-t border-dashed border-line px-5 py-4 first:border-l-0 lg:border-t-0">
          <Skeleton className={cn('h-3 w-20', bar)} />
          <Skeleton className={cn('mt-3 h-6 w-28', bar)} />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-line bg-white p-4">
      <div className="border-b border-dashed border-line pb-3">
        <Skeleton className={cn('h-4 w-36', bar)} />
      </div>
      <div className="mt-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className={cn('h-8 w-8 rounded-full', bar)} />
            <div className="flex-1 space-y-2">
              <Skeleton className={cn('h-3 w-1/2', bar)} />
              <Skeleton className={cn('h-3 w-1/3', bar)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dashboard placeholder: stat strip + 2x2 cards. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <StatStripSkeleton />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
