import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { projects, employees } from '@/data/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const formSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  employeeId: z.string().min(1, 'Please select an employee'),
  hours: z.number().min(0.5, 'Must be at least 0.5 hours').step(0.5),
  date: z.date(),
  note: z.string(),
});

export function ManHoursPage() {
  const activeProjects = projects.filter(p => p.isActive);
  const activeAvailableEmployees = employees.filter(e => e.isActive && !e.isOnLeave);
  const employeesOnLeave = employees.filter(e => e.isActive && e.isOnLeave);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: '',
      employeeId: '',
      hours: 8,
      date: new Date(),
      note: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success('Hours logged successfully!');
    form.reset({ hours: 8, date: new Date(), note: '', projectId: '', employeeId: '' });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-blue-900">Log Man-Hours</h2>
        <p className="text-muted-foreground">Record daily hours for your active projects.</p>
      </div>

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
                          {activeProjects.map(p => (
                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeAvailableEmployees.map(e => (
                            <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                          ))}
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

              <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                Log Hours
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
