import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Employee } from '@/types';
import { Activity } from '@/features/manhours/api/getFormData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, AlertTriangle, Check, ChevronDown, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitManHourLog, createActivity, sendWhatsAppMessage } from '@/api/manhourTrackerApi';

const formSchema = z.object({
  activityId: z.string().min(1, 'Please select an activity'),
  employeeIds: z.array(z.string()).min(1, 'Please select at least one employee'),
  hours: z.number().min(0.5, 'Must be at least 0.5 hours').step(0.5),
  dates: z.array(z.date()).min(1, 'Please select at least one date'),
  note: z.string(),
});

interface ActivityHoursFormProps {
  activities: Activity[];
  employees: Employee[];
  onActivityCreated: () => void;
}

export function ActivityHoursForm({ activities, employees, onActivityCreated }: ActivityHoursFormProps) {
  const activeAvailableEmployees = employees.filter(e => !e.isOnLeave);
  const employeesOnLeave = employees.filter(e => e.isOnLeave);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityId: '',
      employeeIds: [],
      hours: 8,
      dates: [new Date()],
      note: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [showNewActivityInput, setShowNewActivityInput] = useState(false);

  async function handleCreateActivity() {
    if (!newActivityName.trim()) return;
    setIsCreatingActivity(true);
    try {
      const res = await createActivity({ name: newActivityName });
      toast.success('Activity created successfully!');
      setNewActivityName('');
      setShowNewActivityInput(false);
      onActivityCreated(); // Refresh activities list
      if (res?.data?._id) {
        form.setValue('activityId', res.data._id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create activity');
    } finally {
      setIsCreatingActivity(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const promises: Promise<any>[] = [];
      values.employeeIds.forEach(employeeId => {
        values.dates.forEach(date => {
          promises.push(
            submitManHourLog({
              activityId: values.activityId,
              employeeId: employeeId,
              hours: values.hours,
              date: format(date, 'yyyy-MM-dd'),
              note: values.note,
            })
          );
        });
      });

      await Promise.all(promises);

      toast.success(`Successfully logged hours for ${values.employeeIds.length} employee(s) across ${values.dates.length} date(s)!`);
      form.reset({ hours: 8, dates: [new Date()], note: '', activityId: '', employeeIds: [] });
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
          <CardTitle className="text-blue-900">New Activity Entry</CardTitle>
          <CardDescription>Fill out the details below to log hours against an activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control as any}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity</FormLabel>
                      <FormControl>
                        {showNewActivityInput ? (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Activity name..."
                              value={newActivityName}
                              onChange={(e) => setNewActivityName(e.target.value)}
                              disabled={isCreatingActivity}
                            />
                            <Button type="button" onClick={handleCreateActivity} disabled={isCreatingActivity || !newActivityName.trim()}>
                              Save
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setShowNewActivityInput(false)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <SearchableSelect
                                options={activities.map(a => ({ label: a.name || 'Unknown Activity', value: a._id }))}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select an activity"
                                searchPlaceholder="Search activities..."
                              />
                            </div>
                            <Button type="button" variant="outline" size="icon" onClick={() => setShowNewActivityInput(true)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
                                const allIds = activeAvailableEmployees.map(e => e._id);
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
                                const isDisabled = e.isOnLeave;

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
                                          (On Leave)
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
                  name="dates"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2.5">
                      <FormLabel className="mb-1">Dates</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {field.value?.length > 0 ? (
                                <span>{field.value.length} date(s) selected</span>
                              ) : (
                                <span>Pick dates</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="multiple"
                            selected={field.value}
                            onSelect={field.onChange}
                            numberOfMonths={2}
                            disabled={(date) => date < new Date("1900-01-01")}
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
