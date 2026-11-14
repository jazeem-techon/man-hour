import { useLocation, useNavigate } from 'react-router';
import { Menu, Search, Settings, HelpCircle } from 'lucide-react';
import { IconButton } from '@/components/shared/DashboardCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from './UserMenu';

const pageMeta: { match: (p: string) => boolean; title: string; subtitle: string }[] = [
  { match: (p) => p.startsWith('/dashboard'), title: 'Dashboard', subtitle: 'Monitor projects, hours and costs here' },
  { match: (p) => p.startsWith('/manhours'), title: 'Log Hours', subtitle: 'Record daily hours for projects or activities' },
  { match: (p) => p.startsWith('/projects/') && p.length > '/projects/'.length && !p.startsWith('/projects/salesman'), title: 'Project Details', subtitle: 'Financials, hours and team contributions' },
  { match: (p) => p.startsWith('/projects'), title: 'Projects', subtitle: 'Manage projects and assigned salespersons' },
  { match: (p) => p.startsWith('/timesheet'), title: 'Timesheet', subtitle: 'All man-hour log entries across projects and activities' },
  { match: (p) => p.startsWith('/salespersons'), title: 'Salespersons & Targets', subtitle: 'Manage salespersons and their targets' },
  { match: (p) => p.startsWith('/leaves'), title: 'Leaves', subtitle: 'Track employee leave' },
  { match: (p) => p.startsWith('/reports/by-employee'), title: 'Report: By Employee', subtitle: 'Hours and cost per employee' },
  { match: (p) => p.startsWith('/reports/by-project'), title: 'Report: By Project', subtitle: 'Hour logs and team contributions per project' },
  { match: (p) => p.startsWith('/reports/by-salesperson'), title: 'Report: By Salesperson', subtitle: 'Performance per salesperson' },
  { match: (p) => p.startsWith('/settings'), title: 'Settings', subtitle: 'Application settings and integrations' },
];

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const meta = pageMeta.find((m) => m.match(pathname)) ?? { title: '', subtitle: '' };

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-4 md:px-6 md:pt-5">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton className="md:hidden" aria-label="Open menu" onClick={onOpenMenu}>
          <Menu className="h-4 w-4" />
        </IconButton>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{meta.title}</h1>
          <p className="hidden truncate text-[13px] text-ink-secondary sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-gray-50 px-3 lg:flex">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search anything"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-secondary"
          />
          <kbd className="flex h-5 w-5 items-center justify-center rounded border border-line bg-white text-[10px] text-ink-secondary">⌘</kbd>
          <kbd className="flex h-5 w-5 items-center justify-center rounded border border-line bg-white text-[10px] text-ink-secondary">F</kbd>
        </div>
        {isAdmin && (
          <IconButton aria-label="Settings" className="hidden sm:inline-flex" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4" />
          </IconButton>
        )}
        <IconButton aria-label="Help" className="hidden sm:inline-flex">
          <HelpCircle className="h-4 w-4" />
        </IconButton>
        <UserMenu />
      </div>
    </header>
  );
}
