import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Download, Clock, Briefcase, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { exportToExcel } from '@/lib/excel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchEmployees, fetchManHourLogs } from '@/api/manhourTrackerApi';

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
        if (data && data.length > 0) {
          setSelectedEmployee(data[0]._id);
        }
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

        const data = await fetchManHourLogs(params);
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
  
  // Data Filtering for Leaves (no backend API yet, defaulting to empty)
  const eLeaves: any[] = []; 

  // Summaries
  const totalHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0);
  
  // Project Breakdown
  const projectMap = new Map<string, any>();
  logs.forEach(log => {
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
  const leaveDays = eLeaves.reduce((sum, l) => sum + (differenceInDays(new Date(l.endDate), new Date(l.startDate)) + 1), 0);

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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Report: By Employee</h2>
        <p className="text-muted-foreground">View detailed hour logs and leave history per employee.</p>
      </div>

      <Card className="border-blue-100 shadow-sm bg-blue-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
            <SearchableSelect
              options={employees.map(e => ({ label: e.name, value: e._id }))}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Select Employee"
              searchPlaceholder="Search employees..."
              className="w-full md:w-[300px] bg-white"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal bg-white",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleExport} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm">
            <Download className="h-4 w-4 mr-2" /> Export to Excel
          </Button>
        </CardContent>
      </Card>

      {employee && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-100 shadow-sm relative overflow-hidden">
              {isLoadingLogs && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">Total Hours</CardTitle>
                <Clock className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalHours} hrs</div>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm relative overflow-hidden">
              {isLoadingLogs && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">Projects/Activities Involved</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{uniqueProjects}</div>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">Leave Days Taken</CardTitle>
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{leaveDays} days</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Leave History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {eLeaves.length > 0 ? (
                    eLeaves.map(l => (
                      <div key={l._id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            {l.leaveType === 'sick_leave' ? <Badge variant="outline" className="text-yellow-700 border-yellow-500 bg-yellow-50">Sick Leave</Badge> :
                             l.leaveType === 'no_paid' ? <Badge variant="outline" className="text-orange-700 border-orange-500 bg-orange-50">No Paid</Badge> :
                             <Badge variant="outline" className="text-blue-700 border-blue-500 bg-blue-50">Combo Off</Badge>}
                          </div>
                          <span className="capitalize text-sm font-medium text-muted-foreground">{l.status}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50 mt-1">
                          <span className="text-slate-500">From: {l.startDate}</span>
                          <span className="text-slate-500">To: {l.endDate}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No leave history found.</div>
                  )}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eLeaves.length > 0 ? (
                        eLeaves.map(l => (
                          <TableRow key={l._id}>
                            <TableCell>
                              {l.leaveType === 'sick_leave' ? <Badge variant="outline" className="text-yellow-700 border-yellow-500 bg-yellow-50">Sick Leave</Badge> :
                               l.leaveType === 'no_paid' ? <Badge variant="outline" className="text-orange-700 border-orange-500 bg-orange-50">No Paid</Badge> :
                               <Badge variant="outline" className="text-blue-700 border-blue-500 bg-blue-50">Combo Off</Badge>}
                            </TableCell>
                            <TableCell>{l.startDate}</TableCell>
                            <TableCell>{l.endDate}</TableCell>
                            <TableCell className="capitalize text-muted-foreground">{l.status}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No leave history found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm relative overflow-hidden">
              {isLoadingLogs && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}
              <CardHeader>
                <CardTitle className="text-slate-900">Project Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {projectBreakdown.length > 0 ? (
                    <>
                      {projectBreakdown.map(pb => (
                        <div key={pb.projectName} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-slate-800">{pb.projectName}</div>
                            <div className="font-bold text-blue-700">{pb.hours} hrs</div>
                          </div>
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50 mt-1">
                            <span className="text-slate-500">Entries: {pb.entries}</span>
                            <span className="text-slate-500">Last: {pb.lastDate ? format(new Date(pb.lastDate), 'dd MMM yyyy') : '-'}</span>
                          </div>
                        </div>
                      ))}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center font-bold text-slate-900 mt-2">
                        <span>Grand Total</span>
                        <span>{totalHours} hrs ({logs.length} entries)</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No project hours found.</div>
                  )}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project / Activity</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Entries</TableHead>
                        <TableHead className="text-right">Last Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectBreakdown.length > 0 ? (
                        <>
                          {projectBreakdown.map(pb => (
                            <TableRow key={pb.projectName}>
                              <TableCell className="font-medium">{pb.projectName}</TableCell>
                              <TableCell className="text-right font-semibold">{pb.hours} hrs</TableCell>
                              <TableCell className="text-right text-muted-foreground">{pb.entries}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{pb.lastDate ? format(new Date(pb.lastDate), 'dd MMM yyyy') : '-'}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-blue-50 font-bold text-slate-900 hover:bg-blue-50">
                            <TableCell>Grand Total</TableCell>
                            <TableCell className="text-right">{totalHours} hrs</TableCell>
                            <TableCell className="text-right">{logs.length}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No project hours found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
