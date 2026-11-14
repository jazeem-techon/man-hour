import { Clock, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function WorkspaceSwitcher() {
  const { user } = useAuth();
  const name = (user?.companyName as string | undefined) || 'ManHour Tracker';

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
        <Clock className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-muted" />
    </button>
  );
}
