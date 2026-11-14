import { ReactNode } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small 32px bordered icon button used in card headers. */
export function IconButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-secondary transition-colors hover:bg-gray-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PlusButton({ label = 'Add', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      {...props}
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}

export function MoreButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <IconButton aria-label="More options" {...props}>
      <MoreVertical className="h-4 w-4" />
    </IconButton>
  );
}

type DashboardCardProps = {
  title: ReactNode;
  /** Controls rendered on the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function DashboardCard({ title, actions, children, className, bodyClassName }: DashboardCardProps) {
  return (
    <section className={cn('flex h-full min-h-[320px] flex-col rounded-xl border border-line bg-white p-4', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-dashed border-line pb-3">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('flex min-h-0 flex-1 flex-col pt-3', bodyClassName)}>{children}</div>
    </section>
  );
}
