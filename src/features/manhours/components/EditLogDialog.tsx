import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateManHourLog } from '@/api/manhourTrackerApi';

export type EditableLog = {
  _id: string;
  hours: number;
  date: string;
  note?: string;
  task?: string;
  projectId?: { projectName: string } | null;
  activityId?: { name: string; isLeave?: boolean } | null;
  employeeId?: { name: string } | null;
};

type Props = {
  /** One log = edit that entry. Several logs = edit date/task/note of all of them together (hours untouched). */
  logs: EditableLog[] | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditLogDialog({ logs, onClose, onSaved }: Props) {
  const [hours, setHours] = useState('');
  const [date, setDate] = useState('');
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const first = logs?.[0];
  const bulk = (logs?.length ?? 0) > 1;

  useEffect(() => {
    if (!first) return;
    setHours(String(first.hours));
    setDate((first.date || '').slice(0, 10));
    setTask(first.task || '');
    setNote(bulk ? '' : first.note || '');
  }, [logs]); // eslint-disable-line react-hooks/exhaustive-deps

  const isProject = !!first?.projectId;
  const isLeave = !!first?.activityId?.isLeave;
  const noun = isLeave ? 'Leave' : 'Entry';
  const hoursNum = Number(hours);
  const hoursValid = bulk || (hours !== '' && hoursNum > 0 && hoursNum <= 24 && hoursNum % 0.5 === 0);
  const canSave = !!first && hoursValid && !!date && (!isProject || task.trim() !== '');

  const save = async () => {
    if (!logs || !canSave) return;
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        logs.map((l) =>
          updateManHourLog(l._id, {
            ...(bulk ? {} : { hours: hoursNum }),
            date,
            // in bulk mode only overwrite notes if the admin typed one
            ...(!bulk || note.trim() ? { note } : {}),
            ...(isProject ? { task: task.trim() } : {}),
          }),
        ),
      );
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length === 0) {
        toast.success(isLeave ? (bulk ? `Updated ${logs.length} leave days` : 'Leave updated') : bulk ? `Updated ${logs.length} entries` : 'Entry updated');
        onSaved();
      } else {
        const msg = (failed[0].reason as any)?.response?.data?.message || `Failed to update ${noun.toLowerCase()}`;
        toast.error(bulk ? `${failed.length} of ${logs.length} failed: ${msg}` : msg);
        if (failed.length < logs.length) onSaved(); // some succeeded — refresh
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!logs} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-md rounded-xl border-line bg-white">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">{bulk ? `Edit ${logs!.length} ${isLeave ? 'Leave Days' : 'Entries'}` : `Edit ${noun}`}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {bulk ? 'Changes apply to every employee in this group. Hours stay as they are.' : first?.employeeId?.name || '—'}
            {' · '}
            {first?.projectId?.projectName || first?.activityId?.name || '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {!bulk && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-hours">{isLeave ? 'Hours off' : 'Hours'}</Label>
                <Input id="edit-hours" type="number" step="0.5" min="0.5" max="24" value={hours} onChange={(e) => setHours(e.target.value)} />
                {hours !== '' && !hoursValid && <p className="text-xs text-red-600">Use multiples of 0.5, up to 24.</p>}
              </div>
            )}
          </div>

          {isProject && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-task">Task</Label>
              <Input id="edit-task" value={task} onChange={(e) => setTask(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-note">Note{bulk && ' (leave empty to keep existing)'}</Label>
            <Textarea id="edit-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isLeave ? 'Reason for leave (optional)' : 'What was worked on?'} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving} className="h-8 text-[13px]">Cancel</Button>
          <Button onClick={save} disabled={!canSave || saving} className="h-8 bg-primary text-[13px] hover:bg-primary-hover">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
