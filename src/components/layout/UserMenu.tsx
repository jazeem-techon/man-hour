
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const getInitials = (name?: string) =>
  (name || 'U')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'U';

function Avatar({ initials, size }: { initials: string; size: 'sm' | 'lg' }) {
  return (
    <span
      className={
        size === 'sm'
          ? 'flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-ink-secondary'
          : 'flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-ink-secondary'
      }
    >
      {initials}
    </span>
  );
}


export function UserMenu() {
  const { user, logout } = useAuth();
  const name = (user?.name as string | undefined) || user?.username || 'User';
  const email = (user?.email as string | undefined) || user?.username || '';
  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Open user menu" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <Avatar initials={initials} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl border-line p-0 shadow-sm">
        <div className="flex flex-col items-center px-4 pb-3 pt-5 text-center">
          <Avatar initials={initials} size="lg" />
          <p className="mt-2 max-w-full truncate text-[13px] font-semibold text-ink">{name}</p>
          {email && <p className="max-w-full truncate text-[11px] text-ink-secondary">{email}</p>}
        </div>
        <DropdownMenuSeparator className="m-0 bg-line" />
        <div className="p-1.5">
          <DropdownMenuItem
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-logout focus:bg-gray-100 focus:text-logout"
            onSelect={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
