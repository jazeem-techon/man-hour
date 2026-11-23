import { useEffect, useState } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { fetchManHourLogs, submitManHourLog, deleteManHourLog, updateManHourLog } from '@/api/manhourTrackerApi';
import { getManHoursFormData, ManHoursFormData } from '@/features/manhours/api/getFormData';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { EmptyState } from '@/components/shared/EmptyState';
import { DashboardCard } from '@/components/shared/DashboardCard';
import { exportToExcel } from '@/lib/excel';

const LIMIT = 50;
const today = () => format(new Date(), 'yyyy-MM-dd');

// ─── Add Leave dialog ───────────────────────────────────────────
function AddLeaveDialog({
  open, onOpenChange, formData, onAdded, editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  formData: ManHoursFormData | null;
  onAdded: () => void;
  /** When set, the form edits this existing leave entry instead of adding new ones. */
  editing?: any | null;
}) {
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const employeeOptions = (formData?.employees || []).map((e) => ({ label: e.name, value: e._id }));
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [hours, setHours] = useState('8');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const day = String(editing.date).slice(0, 10);
      setEmployeeIds(editing.employeeId?._id ? [editing.employeeId._id] : []);
      setLeaveTypeId(editing.activityId?._id || '');
      setStartDate(day);
      setEndDate(day);
      setHours(String(editing.hours));
      setNote(editing.note || '');
    } else {
      setEmployeeIds([]);
      setLeaveTypeId(formData?.leaveTypes?.[0]?._id || '');
      setStartDate(today());
      setEndDate(today());
      setHours('8');
      setNote('');
    }
  }, [open, formData, editing]);

  const hoursNum = Number(hours);
  const hoursValid = hoursNum > 0 && hoursNum <= 24 && hoursNum % 0.5 === 0;
  const rangeValid = !!startDate && !!endDate && endDate >= startDate;
  const canSave = employeeIds.length > 0 && !!leaveTypeId && hoursValid && rangeValid;
  const noTypes = !!formData && formData.leaveTypes.length === 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const days = eachDayOfInterval({ start: new Date(`${startDate}T00:00:00`), end: new Date(`${endDate}T00:00:00`) });
      const results = await Promise.allSettled(
        employeeIds.flatMap((employeeId) => days.map((d, i) => {
          const date = format(d, 'yyyy-MM-dd');
          // editing: the first day updates the existing entry, any extra days are added
          if (editing && i === 0) {
            return updateManHourLog(editing._id, { employeeId, activityId: leaveTypeId, date, hours: hoursNum, note });
          }
          return submitManHourLog({ activityId: leaveTypeId, employeeId, hours: hoursNum, date, note });
        })),
      );
      const totalEntries = results.length;
      const replaced = results.reduce((n, r) => n + (r.status === 'fulfilled' ? (r.value as any)?.replaced || 0 : 0), 0);
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length === 0) {
        const note = replaced > 0 ? ` ${replaced} timesheet ${replaced === 1 ? 'entry' : 'entries'} on those days ${replaced === 1 ? 'was' : 'were'} replaced by leave.` : '';
        const empText = employeeIds.length > 1 ? ` for ${employeeIds.length} employees` : '';
        toast.success((editing ? (days.length > 1 ? `Leave updated and extended to ${days.length} days.` : 'Leave updated.') : `Leave added for ${days.length} day${days.length > 1 ? 's' : ''}${empText}.`) + note);
      } else {
        const msg = (failed[0].reason as any)?.response?.data?.message || (editing ? 'Failed to update leave' : 'Failed to add leave');
        toast.error(`${failed.length} of ${totalEntries} entries failed: ${msg}`);
      }
      if (failed.length < totalEntries) {
        onAdded();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-md rounded-xl border-line bg-white">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">{editing ? 'Edit Leave' : 'Add Leave'}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {editing ? 'Change this leave. Extending the range adds the extra days.' : 'One entry is created for each day in the range.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            {editing ? (
              <SearchableSelect
                options={employeeOptions}
                value={employeeIds[0] || ''}
                onChange={(v) => setEmployeeIds(v ? [v] : [])}
                placeholder="Select employee"
                searchPlaceholder="Search employee..."
              />
            ) : (
              <SearchableMultiSelect
                options={employeeOptions}
                value={employeeIds}
                onChange={setEmployeeIds}
                placeholder="Select employees"
                searchPlaceholder="Search employee..."
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Leave type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} disabled={noTypes}>
              <SelectTrigger><SelectValue placeholder={noTypes ? 'No leave types found' : 'Select leave type'} /></SelectTrigger>
              <SelectContent>
                {formData?.leaveTypes.map((t) => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noTypes && <p className="text-xs text-ink-secondary">Create an activity with "leave" in its name (e.g. "Sick leave 2026") to use it here.</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leave-start">From</Label>
              <Input id="leave-start" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-end">To</Label>
              <Input id="leave-end" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-hours">Hrs/day</Label>
              <Input id="leave-hours" type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>
          {!rangeValid && <p className="text-xs text-red-600">End date cannot be before start date.</p>}
          {!hoursValid && <p className="text-xs text-red-600">Hours must be a multiple of 0.5, up to 24.</p>}

          <div className="space-y-1.5">
            <Label htmlFor="leave-note">Note</Label>
            <Textarea id="leave-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-8 text-[13px]">Cancel</Button>
          <Button onClick={save} disabled={!canSave || saving} className="h-8 bg-primary text-[13px] hover:bg-primary-hover">
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Add leave'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ───────────────────────────────────────────────────────
export function LeavesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [formData, setFormData] = useState<ManHoursFormData | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getManHoursFormData().then(setFormData).catch(() => toast.error('Failed to load employees'));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetchManHourLogs({ leave: 'only', page, limit: LIMIT });
        setLogs(res.data || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error('Failed to load leaves', err);
        toast.error('Failed to load leaves');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // fetch every leave entry, not just the visible page
      const res = await fetchManHourLogs({ leave: 'only', page: 1, limit: 100000 });
      const rows: any[] = res.data || [];
      if (rows.length === 0) {
        toast.error('No leave to export');
        return;
      }
      const data = rows
        .slice()
        .sort((x, y) => (x.employeeId?.name || '').localeCompare(y.employeeId?.name || '') || String(x.date).localeCompare(String(y.date)))
        .map((l) => ({
          Employee: l.employeeId?.name || '-',
          'Leave Type': l.activityId?.name || 'Leave',
          Date: l.date ? format(new Date(l.date), 'dd MMM yyyy') : '-',
          Hours: l.hours,
          Note: l.note || '',
        }));
      exportToExcel(data, `Leave_Report_${format(new Date(), 'yyyy-MM-dd')}`, 'Leaves');
    } catch (err) {
      console.error('Failed to export leaves', err);
      toast.error('Failed to export leave');
    } finally {
      setIsExporting(false);
    }
  };
  const totalPages = Math.ceil(total / LIMIT) || 1;

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteManHourLog(deleting._id);
      toast.success('Leave entry deleted');
      setDeleting(null);
      reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4">
      <div className="flex shrink-0 justify-end gap-2">
        <Button variant="outline" onClick={handleExport} disabled={isExporting || total === 0} className="h-8 gap-1.5 text-[13px]">
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
        <Button onClick={() => setAdding(true)} className="h-8 gap-1.5 bg-primary text-[13px] hover:bg-primary-hover">
          <Plus className="h-4 w-4" />
          Add Leave
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} className="flex-1" />
      ) : (
        <DashboardCard
          title="Leave Entries"
          actions={<span className="text-xs text-ink-secondary">{total} total</span>}
          className="min-h-0 flex-1"
          bodyClassName="p-0 pt-0"
        >
          {logs.length === 0 ? (
            <EmptyState title="No leave recorded" description="Leave you add will appear here, separate from the timesheet." />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave type</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="w-44" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="whitespace-nowrap font-medium">{log.date ? format(new Date(log.date), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell>{log.employeeId?.name || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            {log.activityId?.name || 'Leave'}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">{log.hours} hrs</TableCell>
                        <TableCell className="max-w-[240px] truncate text-ink-secondary" title={log.note}>{log.note || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-[13px] text-primary hover:bg-primary-tint hover:text-primary"
                            onClick={() => setEditing(log)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-[13px] text-logout hover:bg-orange-50 hover:text-logout"
                            onClick={() => setDeleting(log)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line pt-3">
                <div className="text-[13px] text-ink-secondary">
                  Showing {Math.min((page - 1) * LIMIT + 1, total)} to {Math.min(page * LIMIT, total)} of {total} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="mr-1 h-4 w-4" />Previous
                  </Button>
                  <span className="px-2 text-[13px] text-ink-secondary">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next<ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DashboardCard>
      )}

      <AddLeaveDialog
        open={adding || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setAdding(false);
            setEditing(null);
          }
        }}
        formData={formData}
        editing={editing}
        onAdded={() => {
          if (!editing) setPage(1);
          reload();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && !isDeleting && setDeleting(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this leave entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.employeeId?.name} · {deleting?.hours} hrs on {deleting?.date ? format(new Date(deleting.date), 'dd MMM yyyy') : '-'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
