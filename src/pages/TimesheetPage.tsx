import { LogsTable } from '@/features/manhours/components/LogsTable';

export function TimesheetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Timesheet</h2>
        <p className="text-muted-foreground">View all individual man-hour log entries across projects and activities.</p>
      </div>
      
      <LogsTable />
    </div>
  );
}
