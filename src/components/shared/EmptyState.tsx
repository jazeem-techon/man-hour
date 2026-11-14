import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

/** Faded stacked-placeholder illustration in a soft gray circle. */
export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex h-full min-h-[200px] flex-1 flex-col items-center justify-center px-4 py-8 text-center', className)}>
      <div className="relative mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gray-200/60">
        <div className="absolute left-3 top-9 h-12 w-16 rounded-lg bg-white/70" />
        <div className="relative w-20 space-y-1.5 rounded-lg bg-white p-2.5 shadow-sm">
          <div className="h-1.5 w-full rounded-full bg-gray-200" />
          <div className="h-1.5 w-2/3 rounded-full bg-gray-200" />
          <div className="h-1.5 w-1/2 rounded-full bg-gray-100" />
        </div>
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-ink-secondary">{description}</p>}
    </div>
  );
}
