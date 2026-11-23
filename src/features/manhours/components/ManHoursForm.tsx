import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project, Employee } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitManHourLog, updateManHourLog, deleteManHourLog, fetchBusyEmployees, fetchFrequentProjectEmployees, saveProjectManhourName } from '@/api/manhourTrackerApi';
import { EmployeePicker } from './EmployeePicker';

const formSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  employeeIds: z.array(z.string()).min(1, 'Please select at least one employee'),
  task: z.string().min(1, 'Please select a task'),
  hours: z.number().min(0.5, 'Must be at least 0.5 hours').step(0.5),
  date: z.date(),
  note: z.string(),
});

interface ManHoursFormProps {
  projects: Project[];
  employees: Employee[];
  onSuccess?: () => void;
  /** Existing log entries of one timesheet row; when set the form edits them instead of creating new ones. */
  editLogs?: any[];
}

export function ManHoursForm({ projects, employees, onSuccess, editLogs }: ManHoursFormProps) {
  const first = editLogs?.[0];
  const isEdit = !!first;

  // Task select stores the task id (or its label); map the log's task name back to that value
  const initialTask = (() => {
    if (!first) return '';
    const proj: any = projects.find((p) => p._id === first.projectId?._id);
    const t = proj?.tasks?.find((x: any) => (x.description || x.taskName) === first.task || x.taskName === first.task);
    return t ? (t._id || t.description || t.taskName) : first.task || '';
  })();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: first?.projectId?._id ?? '',
      employeeIds: editLogs ? editLogs.map((l) => l.employeeId?._id).filter(Boolean) : [],
      task: initialTask,
      hours: first?.hours ?? 8,
      date: first?.date ? new Date(`${String(first.date).slice(0, 10)}T00:00:00`) : new Date(),
      note: first?.note ?? '',
    },
  });

  const selectedProjectId = form.watch('projectId');
  const selectedProject = projects.find(p => p._id === selectedProjectId);
  const projectTasks = selectedProject?.tasks || [];
  const selectedDate = form.watch('date');
  const hours = form.watch('hours');
  const employeeIds = form.watch('employeeIds');

  const [manhourNames, setManhourNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(projects.map((p: any) => [p._id, p.manhourName || ''])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyEmployeeIds, setBusyEmployeeIds] = useState<string[]>([]);
  const [leaveEmployeeIds, setLeaveEmployeeIds] = useState<string[]>([]);
  const [frequent, setFrequent] = useState<{ employeeId: string; entries: number }[]>([]);

  // Suggest the employees who most often log on the selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setFrequent([]);
      return;
    }
    let cancelled = false;
    fetchFrequentProjectEmployees(selectedProjectId)
      .then((rows) => { if (!cancelled) setFrequent(rows || []); })
      .catch(() => { if (!cancelled) setFrequent([]); });
    return () => { cancelled = true; };
  }, [selectedProjectId]);

  // Employees already on an activity that day can't take project hours
  useEffect(() => {
    async function loadBusyEmployees() {
      if (!selectedDate) return;
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const [busyIds, leaveIds] = await Promise.all([
          fetchBusyEmployees(dateStr, dateStr),
          fetchBusyEmployees(dateStr, dateStr, true),
        ]);
        setBusyEmployeeIds(busyIds || []);
        setLeaveEmployeeIds(leaveIds || []);

        const currentSelected = form.getValues('employeeIds');
        const validSelected = currentSelected.filter(id => !busyIds.includes(id));
        if (validSelected.length !== currentSelected.length) {
          form.setValue('employeeIds', validSelected);
        }
      } catch (err) {
        console.error('Failed to load busy employees', err);
      }
    }
    loadBusyEmployees();
  }, [selectedDate, form]);

  const unavailable = new Map<string, string>();
  employees.forEach((e) => {
    if (e.isOnLeave || leaveEmployeeIds.includes(e._id)) unavailable.set(e._id, 'On Leave');
    else if (busyEmployeeIds.includes(e._id)) unavailable.set(e._id, 'On Activity');
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const dateStr = format(values.date, 'yyyy-MM-dd');

      if (isEdit) {
        // reconcile the row: update kept people, add new ones, remove the unticked
        const existing = new Map<string, any>(editLogs!.map((l) => [l.employeeId?._id, l]));
        const ops: Promise<any>[] = [];
        values.employeeIds.forEach((id) => {
          const log = existing.get(id);
          ops.push(
            log
              ? updateManHourLog(log._id, { projectId: values.projectId, hours: values.hours, date: dateStr, task: values.task, note: values.note })
              : submitManHourLog({ projectId: values.projectId, employeeId: id, task: values.task, hours: values.hours, date: dateStr, note: values.note }),
          );
        });
        existing.forEach((log, id) => {
          if (!values.employeeIds.includes(id)) ops.push(deleteManHourLog(log._id));
        });
        const results = await Promise.allSettled(ops);
        const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (failed.length === 0) {
          toast.success('Entries updated');
        } else {
          const msg = (failed[0].reason as any)?.response?.data?.message || 'Failed to update entries';
          toast.error(`${failed.length} of ${ops.length} changes failed: ${msg}`);
        }
        if (failed.length < ops.length) onSuccess?.();
        return;
      }

      await Promise.all(
        values.employeeIds.map(employeeId =>
          submitManHourLog({
            projectId: values.projectId,
            employeeId,
            task: values.task,
            hours: values.hours,
            date: dateStr,
            note: values.note,
          })
        )
      );

      toast.success(`Successfully logged hours for ${values.employeeIds.length} employee(s)!`);
      form.reset({ hours: 8, date: new Date(), note: '', projectId: '', employeeIds: [], task: '' });
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to log hours:', error);
      toast.error(error.response?.data?.message || 'Failed to log hours');
    } finally {
      setIsSubmitting(false);
    }
  }

  const total = (Number(hours) || 0) * employeeIds.length;
  const removedCount = isEdit ? editLogs!.filter((l) => !employeeIds.includes(l.employeeId?._id)).length : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control as any}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={projects.map(p => ({ label: p.projectName || p.name || 'Unknown Project', value: p._id }))}
                    value={field.value}
                    onChange={(v) => { field.onChange(v); form.setValue('task', ''); }}
                    placeholder="Select a project"
                    searchPlaceholder="Search projects..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedProject && (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Project name <span className="font-normal text-ink-muted">(optional, saved for this project here only)</span></label>
              <Input
                placeholder="e.g. ALC"
                maxLength={100}
                value={manhourNames[selectedProject._id] ?? ''}
                onChange={(e) => setManhourNames((m) => ({ ...m, [selectedProject._id]: e.target.value }))}
                onBlur={async (e) => {
                  const id = selectedProject._id;
                  const name = e.target.value.trim();
                  if (name === ((selectedProject as any).manhourName || '')) return;
                  try {
                    await saveProjectManhourName(id, name);
                    (selectedProject as any).manhourName = name;
                  } catch {
                    toast.error('Failed to save project name');
                  }
                }}
              />
            </div>
          )}

          <FormField
            control={form.control as any}
            name="task"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={projectTasks.map((task: any) => {
                      const taskLabel = task.description || task.taskName || (typeof task === 'string' ? task : 'Unknown Task');
                      return { label: taskLabel, value: task._id || taskLabel };
                    })}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={selectedProjectId ? 'Select a task' : 'Select a project first'}
                    searchPlaceholder="Search tasks..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as any}
          name="employeeIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employees</FormLabel>
              <EmployeePicker
                employees={employees}
                value={field.value || []}
                onChange={field.onChange}
                suggestions={frequent}
                unavailable={unavailable}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control as any}
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours each</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" min="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                        {field.value ? format(field.value, 'LLL dd, y') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <FormField
          control={form.control as any}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note <span className="font-normal text-ink-muted">(optional)</span></FormLabel>
              <FormControl>
                <Textarea placeholder="What was worked on?" rows={2} className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between gap-3 border-t border-dashed border-line pt-4">
          <p className="text-[13px] text-ink-secondary">
            {employeeIds.length > 0
              ? `${employeeIds.length} ${employeeIds.length === 1 ? 'person' : 'people'} × ${Number(hours) || 0} hrs = ${total} hrs${removedCount > 0 ? ` · ${removedCount} removed` : ''}`
              : 'Pick at least one employee'}
          </p>
          <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-hover">
            {isSubmitting ? (isEdit ? 'Saving...' : 'Logging...') : isEdit ? 'Save changes' : 'Log Hours'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
