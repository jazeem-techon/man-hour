import { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Copy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchManHourLogs } from '@/api/manhourTrackerApi';
import { getManHoursFormData } from '../api/getFormData';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

type Mode = 'schedule' | 'absent';

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
const dmy = (day: string) => format(new Date(`${day}T00:00:00`), 'dd/MM/yyyy');
const upper = (s?: string) => (s || 'UNKNOWN').toUpperCase();

/** Groups people under a title, drops duplicates, biggest group first, and formats the numbered blocks. */
function formatBlocks(groups: Map<string, { name: string; people: string[] }>): string[] {
  return Array.from(groups.values())
    .sort((a, b) => b.people.length - a.people.length)
    .map((g) => `*${g.name}*\n${g.people.map((p, i) => `${i + 1}.${p}`).join('\n')}`);
}

function addPerson(groups: Map<string, { name: string; people: string[] }>, key: string, name: string, person: string) {
  if (!groups.has(key)) groups.set(key, { name, people: [] });
  const g = groups.get(key)!;
  if (!g.people.includes(person)) g.people.push(person);
}

/** Schedule: who works where on that day. */
function buildSchedule(day: string, logs: any[], names: Map<string, string>): string {
  const groups = new Map<string, { name: string; people: string[] }>();
  logs.forEach((log) => {
    const key = log.projectId?._id || log.activityId?._id || 'other';
    const name = upper(names.get(log.projectId?._id) || log.projectId?.projectName || log.activityId?.name || 'OTHER');
    addPerson(groups, key, name, upper(log.employeeId?.name));
  });
  return [`*… ${dmy(day)} SCHEDULE …*`, ...formatBlocks(groups)].join('\n\n\n');
}

/** Absent: people on leave that day, listed under the project they most recently worked on. */
function buildAbsent(day: string, leaveLogs: any[], recentLogs: any[], names: Map<string, string>): string {
  // newest project entry per employee
  const lastProject = new Map<string, { id: string; name: string; date: string }>();
  recentLogs.forEach((log) => {
    if (!log.projectId || !log.employeeId?._id) return;
    const prev = lastProject.get(log.employeeId._id);
    if (!prev || String(log.date) > prev.date) {
      lastProject.set(log.employeeId._id, { id: log.projectId._id, name: upper(names.get(log.projectId._id) || log.projectId.projectName), date: String(log.date) });
    }
  });

  const groups = new Map<string, { name: string; people: string[] }>();
  leaveLogs.forEach((log) => {
    const proj = lastProject.get(log.employeeId?._id);
    addPerson(groups, proj?.id || 'none', proj?.name || 'NO RECENT PROJECT', upper(log.employeeId?.name));
  });
  return [`*Today Absent ${dmy(day)}*`, ...formatBlocks(groups)].join('\n\n');
}

export function ScheduleTemplate() {
  const [mode, setMode] = useState<Mode>('schedule');
  const [day, setDay] = useState(ymd(new Date()));
  const [text, setText] = useState('');
  const [rebuild, setRebuild] = useState<(() => string) | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        // project name set in Log Hours, shown instead of the project label
        const names = new Map<string, string>();
        try {
          (await getManHoursFormData()).projects.forEach((p: any) => { if (p.manhourName) names.set(p._id, p.manhourName); });
        } catch { /* fall back to project labels */ }
        let build: () => string;
        let empty: boolean;
        if (mode === 'schedule') {
          const res = await fetchManHourLogs({ startDate: day, endDate: day, page: 1, limit: 10000 });
          const rows: any[] = res.data || [];
          empty = rows.length === 0;
          build = () => buildSchedule(day, rows, names);
        } else {
          const prevDay = ymd(addDays(new Date(`${day}T00:00:00`), -1));
          const weekAgo = ymd(addDays(new Date(`${day}T00:00:00`), -14));
          const [leaveRes, recentRes] = await Promise.all([
            fetchManHourLogs({ leave: 'only', startDate: day, endDate: day, page: 1, limit: 10000 }),
            fetchManHourLogs({ startDate: weekAgo, endDate: prevDay, page: 1, limit: 10000 }),
          ]);
          const leaveRows: any[] = leaveRes.data || [];
          const recentRows: any[] = recentRes.data || [];
          empty = leaveRows.length === 0;
          build = () => buildAbsent(day, leaveRows, recentRows, names);
        }
        if (cancelled) return;
        setIsEmpty(empty);
        setRebuild(() => build);
        setText(empty ? '' : build());
      } catch (err) {
        console.error('Failed to load template', err);
        if (!cancelled) {
          setIsEmpty(true);
          setRebuild(null);
          setText('');
          toast.error('Failed to load entries for this date');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [day, mode]);

  const shift = (n: number) => setDay(ymd(addDays(new Date(`${day}T00:00:00`), n)));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Template copied');
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.');
    }
  };

  const modeCls = (active: boolean) =>
    cn('rounded-md px-3 py-1 text-[13px] font-medium transition-colors', active ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary hover:text-ink');

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-white p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-line pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-lg bg-gray-100 p-0.5">
            <button type="button" className={modeCls(mode === 'schedule')} onClick={() => setMode('schedule')}>Schedule</button>
            <button type="button" className={modeCls(mode === 'absent')} onClick={() => setMode('absent')}>Absent</button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => shift(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-secondary hover:bg-gray-50 hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              className="h-8 rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-primary"
            />
            <button
              type="button"
              aria-label="Next day"
              onClick={() => shift(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-secondary hover:bg-gray-50 hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 gap-1.5 text-[13px]"
            disabled={isEmpty || !rebuild}
            onClick={() => rebuild && setText(rebuild())}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button onClick={copy} disabled={!text} className="h-8 gap-1.5 bg-primary text-[13px] hover:bg-primary-hover">
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col pt-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 bg-gray-200/70" style={{ width: `${40 + ((i * 17) % 45)}%` }} />
            ))}
          </div>
        ) : isEmpty ? (
          mode === 'schedule' ? (
            <EmptyState title="No entries for this date" description="Log hours for this day and the schedule will be generated here." />
          ) : (
            <EmptyState title="No one on leave" description="Anyone with leave on this date will be listed here." />
          )
        ) : (
          <>
            <p className="mb-2 text-xs text-ink-secondary">
              {mode === 'absent'
                ? 'People are listed under the project they last worked on. Edit the text if needed, then copy it.'
                : 'Edit the text if needed (for example to add times), then copy it.'}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="min-h-[320px] w-full flex-1 resize-none rounded-lg border border-line bg-surface p-4 font-mono text-[13px] leading-6 text-ink outline-none focus:border-primary"
            />
          </>
        )}
      </div>
    </div>
  );
}
