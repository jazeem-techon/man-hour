import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Project, Employee } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitManHourLog } from '@/api/manhourTrackerApi';

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
}

export function ManHoursForm({ projects, employees }: ManHoursFormProps) {
  const activeAvailableEmployees = employees.filter(e => !e.isOnLeave);
  const employeesOnLeave = employees.filter(e => e.isOnLeave);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: '',
      employeeIds: [],
      task: '',
      hours: 8,
      date: new Date(),
      note: '',
    },
  });

  const selectedProjectId = form.watch('projectId');
  const selectedProject = projects.find(p => p._id === selectedProjectId);
  
  const projectTasks = selectedProject?.tasks || [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const promises = values.employeeIds.map(employeeId => 
        submitManHourLog({
          projectId: values.projectId,
          employeeId: employeeId,
          task: values.task,
          hours: values.hours,
          date: format(values.date, 'yyyy-MM-dd'),
          note: values.note
        })
      );
      
      await Promise.all(promises);
      
      toast.success(`Successfully logged hours for ${values.employeeIds.length} employee(s)!`);
      form.reset({ hours: 8, date: new Date(), note: '', projectId: '', employeeIds: [], task: '' });
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p._id} value={p._id}>{p.projectName || p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                  ? activeAvailableEmployees
                                      .filter(e => field.value.includes(e._id))
                                      .map(e => e.name)
                                      .join(', ')
                                  : "Select employees"}
                              </div>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] lg:w-[400px] p-2" align="start">
                          <div className="max-h-[200px] overflow-y-auto space-y-1">
                            {activeAvailableEmployees.map((e) => {
                              const isSelected = field.value?.includes(e._id);
                              return (
                                <div
                                  key={e._id}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors hover:bg-slate-100",
                                    isSelected ? "bg-blue-50 text-blue-900 font-medium" : ""
                                  )}
                                  onClick={() => {
                                    const current = field.value || [];
                                    const updated = isSelected
                                      ? current.filter((id: string) => id !== e._id)
                                      : [...current, e._id];
                                    field.onChange(updated);
                                  }}
                                >
                                  <div className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  <span>{e.name}</span>
                                </div>
                              );
                            })}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectTasks.map((task: any) => {
                            const taskLabel = task.description || task.taskName || (typeof task === 'string' ? task : 'Unknown Task');
                            const taskId = task._id || taskLabel;
                            return (
                              <SelectItem key={taskId} value={taskId}>
                                {taskLabel}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
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

                <FormField
                  control={form.control as any}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2.5">
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
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
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
