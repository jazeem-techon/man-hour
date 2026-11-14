import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LogsTable } from '@/features/manhours/components/LogsTable';
import { LogHoursDialog } from '@/features/manhours/components/LogHoursDialog';
import { ScheduleTemplate } from '@/features/manhours/components/ScheduleTemplate';
import { cn } from '@/lib/utils';

type Tab = 'entries' | 'template';

export function TimesheetPage() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<Tab>('entries');

  const tabCls = (active: boolean) =>
    cn(
      'rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors',
      active ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary hover:text-ink',
    );

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-lg bg-gray-100 p-1">
          <button type="button" className={tabCls(tab === 'entries')} onClick={() => setTab('entries')}>Entries</button>
          <button type="button" className={tabCls(tab === 'template')} onClick={() => setTab('template')}>Template</button>
        </div>

        {isAdmin && tab === 'entries' && (
          <Button onClick={() => setOpen(true)} className="h-8 gap-1.5 bg-primary text-[13px] hover:bg-primary-hover">
            <Plus className="h-4 w-4" />
            Log Hours
          </Button>
        )}
      </div>

      {isAdmin && (
        <LogHoursDialog open={open} onOpenChange={setOpen} onLogged={() => setRefreshKey((k) => k + 1)} />
      )}

      {tab === 'entries' ? <LogsTable refreshKey={refreshKey} /> : <ScheduleTemplate />}
    </div>
  );
}
