import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project, Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, AlertTriangle, Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitManHourLog, fetchBusyEmployees, sendWhatsAppMessage } from '@/api/manhourTrackerApi';

const formSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  employeeIds: z.array(z.string()).min(1, 'Please select at least one employee'),
  task: z.string().min(1, 'Please select a task'),
  hours: z.number().min(0.5, 'Must be at least 0.5 hours').step(0.5),
  date: z.date(),
  time: z.string().optional(),
  note: z.string(),
  sendToWhatsAppGroup: z.boolean(),
});

interface ManHoursFormProps {
  projects: Project[];
  employees: Employee[];
}

export function ManHoursForm({ projects, employees }: ManHoursFormProps) {
  const employeesOnLeave = employees.filter(e => e.isOnLeave);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: '',
      employeeIds: [],
      task: '',
      hours: 8,
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      note: '',
      sendToWhatsAppGroup: false,
    },
  });

  const selectedProjectId = form.watch('projectId');
  const selectedProject = projects.find(p => p._id === selectedProjectId);
  
  const projectTasks = selectedProject?.tasks || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [busyEmployeeIds, setBusyEmployeeIds] = useState<string[]>([]);

  const selectedDate = form.watch('date');

  // Fetch busy employees when date range changes
  useEffect(() => {
    async function loadBusyEmployees() {
      if (!selectedDate) return;
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const busyIds = await fetchBusyEmployees(dateStr, dateStr);
        setBusyEmployeeIds(busyIds || []);
        
        // Also remove busy employees from currently selected values
        const currentSelected = form.getValues('employeeIds');
        const validSelected = currentSelected.filter(id => !busyIds.includes(id));
        if (validSelected.length !== currentSelected.length) {
          form.setValue('employeeIds', validSelected);
        }
      } catch (err) {
        console.error("Failed to load busy employees", err);
      }
    }
    loadBusyEmployees();
  }, [selectedDate, form]);

  const trulyAvailableEmployees = employees.filter(e => !e.isOnLeave && !busyEmployeeIds.includes(e._id));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const promises: Promise<any>[] = [];
      let dateTimeStr = format(values.date, 'yyyy-MM-dd');
      if (values.time) {
        dateTimeStr += `T${values.time}:00`;
      }

      values.employeeIds.forEach(employeeId => {
        promises.push(
          submitManHourLog({
            projectId: values.projectId,
            employeeId: employeeId,
            task: values.task,
            hours: values.hours,
            date: dateTimeStr,
            note: values.note,
          })
        );
      });
      
      await Promise.all(promises);

      if (values.sendToWhatsAppGroup) {
        try {
          const dateStr = format(values.date, 'dd/MM/yyyy');
          const timeStr = values.time ? format(new Date(`1970-01-01T${values.time}`), 'h:mm a') : '';
          const projectName = selectedProject?.projectName || selectedProject?.name || 'Unknown Project';
          
          let empListStr = '';
          values.employeeIds.forEach((id, index) => {
            const emp = employees.find(e => e._id === id);
            empListStr += `${index + 1}.${emp?.name?.toUpperCase() || 'UNKNOWN'}\n`;
          });

          const message = `… ${dateStr}_SCHEDUL…\n\n ${projectName}  ${timeStr}\n\n${empListStr}`;
          
          await sendWhatsAppMessage({
            message: message.trim()
          });
        } catch (waErr) {
          console.error("Failed to send WhatsApp message", waErr);
          toast.error("Logs saved, but failed to send WhatsApp message.");
        }
      }
      
      toast.success(`Successfully logged hours for ${values.employeeIds.length} employee(s)!`);
      form.reset({ hours: 8, date: new Date(), time: format(new Date(), 'HH:mm'), note: '', projectId: '', employeeIds: [], task: '', sendToWhatsAppGroup: false });
    } catch (error: any) {
      console.error('Failed to log hours:', error);
      toast.error(error.response?.data?.message || 'Failed to log hours');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {employeesOnLeave.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md flex items-start shadow-sm">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Notice:</strong> The following employees are currently on leave and have been excluded from the dropdown: 
            <span className="font-semibold ml-1">
              {employeesOnLeave.map(e => e.name).join(', ')}
            </span>
          </div>
        </div>
      )}

      <Card className="border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-900">New Entry</CardTitle>
          <CardDescription>Fill out the details below to log new hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          onChange={field.onChange}
                          placeholder="Select a project"
                          searchPlaceholder="Search projects..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="employeeIds"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2.5">
                      <FormLabel className="mb-1">Employees</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              <div className="flex-1 truncate text-left pr-2">
                                {field.value?.length > 0
                                  ? trulyAvailableEmployees
                                      .filter(e => field.value.includes(e._id))
                                      .map(e => e.name)
                                      .join(', ')
                                  : "Select employees"}
                              </div>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] lg:w-[400px] p-0" align="start">
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                              placeholder="Search employees..."
                              value={employeeSearch}
                              onChange={(e) => setEmployeeSearch(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center justify-between border-b px-3 py-1 bg-slate-50">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                const allIds = trulyAvailableEmployees.map(e => e._id);
                                field.onChange(allIds);
                              }}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-muted-foreground"
                              onClick={() => field.onChange([])}
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto space-y-1 p-2">
                            {employees
                              .filter((e) => e.name.toLowerCase().includes(employeeSearch.toLowerCase()))
                              .map((e) => {
                              const isSelected = field.value?.includes(e._id);
                              const isBusy = busyEmployeeIds.includes(e._id);
                              const isDisabled = e.isOnLeave || isBusy;
                              
                              return (
                                <div
                                  key={e._id}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors",
                                    isDisabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "cursor-pointer hover:bg-slate-100",
                                    isSelected && !isDisabled ? "bg-blue-50 text-blue-900 font-medium" : ""
                                  )}
                                  onClick={() => {
                                    if (isDisabled) return;
                                    const current = field.value || [];
                                    const updated = isSelected
                                      ? current.filter((id: string) => id !== e._id)
                                      : [...current, e._id];
                                    field.onChange(updated);
                                  }}
                                >
                                  <div className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                                    isDisabled ? "border-slate-300" : "border-primary",
                                    isSelected && !isDisabled ? "bg-primary text-primary-foreground" : "opacity-50"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={cn(isDisabled && "text-slate-500")}>{e.name}</span>
                                    {isDisabled && (
                                      <span className="text-[10px] text-red-500 font-medium leading-none mt-0.5">
                                        {e.isOnLeave ? '(On Leave)' : '(On Activity)'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {employees.filter((e) => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).length === 0 && (
                              <div className="py-4 text-center text-sm text-slate-500">No employees found.</div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            const taskId = task._id || taskLabel;
                            return { label: taskLabel, value: taskId };
                          })}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a task"
                          searchPlaceholder="Search tasks..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" min="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-2.5">
                  <FormField
                    control={form.control as any}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex-1 flex flex-col">
                        <FormLabel className="mb-1">Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "LLL dd, y") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="time"
                    render={({ field }) => (
                      <FormItem className="flex-1 flex flex-col">
                        <FormLabel className="mb-1">Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control as any}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What was worked on?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="sendToWhatsAppGroup"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-slate-50">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium text-slate-800">
                        Send message to WhatsApp group
                      </FormLabel>
                      <CardDescription className="text-xs">
                        This will dispatch a message to the configured WhatsApp group detailing this log entry.
                      </CardDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Logging...' : 'Log Hours'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
