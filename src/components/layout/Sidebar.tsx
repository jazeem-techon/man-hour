import { NavLink } from 'react-router';
import { LayoutDashboard, Clock, Briefcase, UserCircle, FileText, CalendarOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

type NavItem = { to: string; label: string; icon: LucideIcon; adminOnly?: boolean };

const mainNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timesheet', label: 'Timesheet', icon: FileText },
  { to: '/leaves', label: 'Leaves', icon: CalendarOff, adminOnly: true },
  { to: '/projects', label: 'Projects', icon: Briefcase },
  { to: '/salespersons', label: 'Salespersons', icon: UserCircle, adminOnly: true },
];

const reportNav: { to: string; label: string; color: string; adminOnly?: boolean }[] = [
  { to: '/reports/by-salesperson', label: 'By Salesperson', color: 'bg-blue-600', adminOnly: true },
  { to: '/reports/by-employee', label: 'By Employee', color: 'bg-pink-500', adminOnly: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const items = mainNav.filter((i) => !i.adminOnly || isAdmin);
  const reports = reportNav.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col gap-4 px-4 py-5">
      <div className="flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Clock className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">ManHour</span>
      </div>

      <WorkspaceSwitcher />

      <nav className="flex flex-col gap-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary hover:bg-white/60 hover:text-ink'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {reports.length > 0 && (
        <>
          <div className="border-t border-dashed border-line" />
          <div>
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Reports</p>
            <div className="flex flex-col gap-0.5">
              {reports.map((r) => (
                <NavLink
                  key={r.to}
                  to={r.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary hover:bg-white/60 hover:text-ink'
                    )
                  }
                >
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded text-white', r.color)}>
                    <FileText className="h-2.5 w-2.5" />
                  </span>
                  {r.label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
