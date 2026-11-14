import { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { exportToExcel } from '@/lib/excel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchEmployees, fetchManHourLogs } from '@/api/manhourTrackerApi';
import { TableSkeleton, StatStripSkeleton } from '@/components/shared/Skeletons';
import { StatStrip } from '@/components/shared/StatStrip';
import { DashboardCard } from '@/components/shared/DashboardCard';
import { EmptyState } from '@/components/shared/EmptyState';

const fmtDate = (d?: string) => (d ? format(new Date(d), 'dd MMM yyyy') : '-');
const fmtHours = (h: number) => (Math.round(h * 10) / 10).toLocaleString();

export function ReportByEmployeePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await fetchEmployees();
        setEmployees(data || []);
      } catch (err) {
        console.error("Failed to load employees", err);
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;

    async function loadLogs() {
      setIsLoadingLogs(true);
      try {
        const params: any = { employeeId: selectedEmployee, limit: 10000 };
        if (dateRange?.from) params.startDate = dateRange.from.toISOString();
        if (dateRange?.to) {
            const toDate = new Date(dateRange.to);
            toDate.setUTCHours(23, 59, 59, 999);
            params.endDate = toDate.toISOString();
        }

        const data = await fetchManHourLogs({ ...params, leave: "include" });
        setLogs(data.data || []);
      } catch (err) {
        console.error("Failed to load logs", err);
      } finally {
        setIsLoadingLogs(false);
      }
    }

    loadLogs();
  }, [selectedEmployee, dateRange]);

  const employee = employees.find(e => e._id === selectedEmployee);
  
  // Leave entries come back as logs on leave activities. Split them from worked hours.
  const isLeaveLog = (l: any) => !!l.activityId?.isLeave;
  const workLogs = logs.filter((l) => !isLeaveLog(l));
  const leaveLogs = logs.filter(isLeaveLog);

  // Merge consecutive leave days of the same type into one range.
  const eLeaves: { _id: string; leaveType: string; startDate: string; endDate: string; days: number }[] = (() => {
    const byType = new Map<string, Set<string>>();
    leaveLogs.forEach((l) => {
      const type = l.activityId?.name || 'Leave';
      const day = String(l.date).slice(0, 10);
      if (!byType.has(type)) byType.set(type, new Set());
      byType.get(type)!.add(day);
    });
    const ranges: { _id: string; leaveType: string; startDate: string; endDate: string; days: number }[] = [];
    byType.forEach((daySet, type) => {
      const days = Array.from(daySet).sort();
      let start = days[0];
      let prev = days[0];
      let count = 1;
      const push = () => ranges.push({ _id: type + start, leaveType: type, startDate: start, endDate: prev, days: count });
      for (let i = 1; i < days.length; i++) {
        const gap = (new Date(days[i]).getTime() - new Date(prev).getTime()) / 86400000;
        if (gap === 1) { prev = days[i]; count++; }
        else { push(); start = days[i]; prev = days[i]; count = 1; }
      }
      push();
    });
    return ranges.sort((x, y) => y.startDate.localeCompare(x.startDate));
  })();

  // Summaries (worked hours only; leave is shown separately)
  const totalHours = workLogs.reduce((sum, log) => sum + (log.hours || 0), 0);

  // Project Breakdown
  const projectMap = new Map<string, any>();
  workLogs.forEach(log => {
    const isProject = !!log.projectId;
    const id = isProject ? log.projectId._id : (log.activityId ? log.activityId._id : 'unknown');
    const name = isProject ? log.projectId.projectName : (log.activityId ? log.activityId.name : 'Unknown');

    if (!projectMap.has(id)) {
      projectMap.set(id, { projectName: name, hours: 0, entries: 0, lastDate: log.date });
    }

    const p = projectMap.get(id);
    p.hours += (log.hours || 0);
    p.entries += 1;
    if (new Date(log.date) > new Date(p.lastDate)) {
      p.lastDate = log.date;
    }
  });

  const projectBreakdown = Array.from(projectMap.values()).sort((a, b) => b.hours - a.hours);
  const uniqueProjects = projectBreakdown.length;
  const leaveDays = eLeaves.reduce((sum, l) => sum + l.days, 0);

  const handleExport = () => {
    if (!employee) return;
    
    const exportData = projectBreakdown.map(pb => ({
      Employee: employee.name,
      Project: pb.projectName,
      'Total Hours': pb.hours,
      Entries: pb.entries,
      'Last Date': pb.lastDate ? format(new Date(pb.lastDate), 'dd MMM yyyy') : '-'
    }));

    exportToExcel(exportData, `Employee_Report_${employee.name.replace(/\s+/g, '_')}`);
  };

  if (isLoadingEmployees) {
    return <TableSkeleton />;
  }

  const maxHours = projectBreakdown[0]?.hours || 1;
  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
      : format(dateRange.from, 'LLL dd, y')
    : 'Pick a date range';

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
          <SearchableSelect
            options={employees.map(e => ({ label: e.name, value: e._id }))}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            placeholder="Select Employee"
            searchPlaceholder="Search employees..."
            defaultOpen={!selectedEmployee}
            className="h-9 w-full bg-white text-[13px] md:w-[280px]"
          />

          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn('h-9 w-full justify-start bg-white text-left text-[13px] font-normal md:w-[280px]', !dateRange && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-ink-secondary" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <button
                type="button"
                aria-label="Clear date range"
                onClick={() => setDateRange(undefined)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-secondary hover:bg-gray-50 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Button onClick={handleExport} disabled={!employee} className="h-9 w-full gap-2 bg-primary text-[13px] hover:bg-primary-hover md:w-auto">
          <Download className="h-4 w-4" /> Export to Excel
        </Button>
      </div>

      {!employee ? (
        <DashboardCard title="Employee Report" className="min-h-[360px]">
          <EmptyState title="Select an employee" description="Pick an employee above to see their hours, projects and leave." />
        </DashboardCard>
      ) : isLoadingLogs ? (
        <div className="space-y-4">
          <StatStripSkeleton count={3} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TableSkeleton rows={5} cols={4} />
            <TableSkeleton rows={5} cols={4} />
          </div>
        </div>
      ) : (
        <>
          <StatStrip
            stats={[
              { label: 'Total Hours', value: `${fmtHours(totalHours)} hrs` },
              { label: 'Projects / Activities', value: String(uniqueProjects) },
              { label: 'Leave Days Taken', value: `${leaveDays} ${leaveDays === 1 ? 'day' : 'days'}` },
            ]}
          />

          <div className="grid items-start gap-4 lg:grid-cols-5">
            {/* Leave history */}
            <DashboardCard
              title="Leave History"
              className="min-h-0 lg:col-span-2"
              actions={<span className="text-xs text-ink-secondary">{leaveDays} {leaveDays === 1 ? 'day' : 'days'} total</span>}
            >
              {eLeaves.length === 0 ? (
                <EmptyState title="No leave taken" description="Leave recorded for this employee will appear here." className="min-h-[160px]" />
              ) : (
                <ul className="divide-y divide-dashed divide-line">
                  {eLeaves.map((l) => (
                    <li key={l._id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <span className="inline-flex max-w-full truncate rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">{l.leaveType}</span>
                        <p className="mt-1.5 text-xs text-ink-secondary">
                          {fmtDate(l.startDate)}
                          {l.endDate !== l.startDate && ` – ${fmtDate(l.endDate)}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-ink">{l.days} {l.days === 1 ? 'day' : 'days'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>

            {/* Project breakdown */}
            <DashboardCard
              title="Project Breakdown"
              className="min-h-0 lg:col-span-3"
              actions={<span className="text-xs text-ink-secondary">{projectBreakdown.length} {projectBreakdown.length === 1 ? 'item' : 'items'}</span>}
              bodyClassName="p-0 pt-0"
            >
              {projectBreakdown.length === 0 ? (
                <EmptyState title="No hours logged" description="Hours logged by this employee will appear here." className="min-h-[200px]" />
              ) : (
                <>
                  <div className="max-h-[520px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow>
                          <TableHead>Project / Activity</TableHead>
                          <TableHead className="w-[200px]">Hours</TableHead>
                          <TableHead className="text-right">Entries</TableHead>
                          <TableHead className="text-right">Last Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectBreakdown.map((pb) => (
                          <TableRow key={pb.projectName}>
                            <TableCell className="font-medium text-ink">{pb.projectName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((pb.hours / maxHours) * 100, 3)}%` }} />
                                </div>
                                <span className="w-14 shrink-0 text-right text-[13px] font-medium text-ink">{fmtHours(pb.hours)} hrs</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-ink-secondary">{pb.entries}</TableCell>
                            <TableCell className="whitespace-nowrap text-right text-ink-secondary">{fmtDate(pb.lastDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between border-t border-line bg-primary-tint px-4 py-3 text-[13px] font-semibold text-ink">
                    <span>Grand Total</span>
                    <span>{fmtHours(totalHours)} hrs · {workLogs.length} entries</span>
                  </div>
                </>
              )}
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}
