import { useState } from 'react';
import { employees, manHours, leaves, projects } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Download, Clock, Briefcase, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { exportToExcel } from '@/lib/excel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ReportByEmployeePage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('e1'); // Default to Mohammed Al Hashimi
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const employee = employees.find(e => e._id === selectedEmployee);
  
  // Data Filtering
  const eManHours = manHours.filter(mh => {
    if (mh.employeeId !== selectedEmployee) return false;
    if (dateRange?.from && new Date(mh.date) < dateRange.from) return false;
    if (dateRange?.to && new Date(mh.date) > dateRange.to) return false;
    return true;
  });

  const eLeaves = leaves.filter(l => l.employeeId === selectedEmployee);

  // Summaries
  const totalHours = eManHours.reduce((sum, mh) => sum + mh.hours, 0);
  const uniqueProjects = new Set(eManHours.map(mh => mh.projectId)).size;
  const leaveDays = eLeaves.reduce((sum, l) => sum + (differenceInDays(new Date(l.endDate), new Date(l.startDate)) + 1), 0);

  // Project Breakdown
  const projectBreakdown = Array.from(new Set(eManHours.map(mh => mh.projectId))).map(pid => {
    const p = projects.find(proj => proj._id === pid);
    const pEntries = eManHours.filter(mh => mh.projectId === pid);
    const pHours = pEntries.reduce((sum, mh) => sum + mh.hours, 0);
    const lastDate = [...pEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
    
    return {
      projectName: p?.name || 'Unknown',
      hours: pHours,
      entries: pEntries.length,
      lastDate
    };
  }).sort((a, b) => b.hours - a.hours);

  const handleExport = () => {
    if (!employee) return;
    
    const exportData = projectBreakdown.map(pb => ({
      Employee: employee.name,
      Project: pb.projectName,
      'Total Hours': pb.hours,
      Entries: pb.entries,
      'Last Date': pb.lastDate
    }));

    exportToExcel(exportData, `Employee_Report_${employee.name.replace(/\s+/g, '_')}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-blue-900">Report: By Employee</h2>
        <p className="text-muted-foreground">View detailed hour logs and leave history per employee.</p>
      </div>

      <Card className="border-blue-100 shadow-sm bg-blue-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full md:w-[300px] bg-white">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Total Hours</CardTitle>
                <Clock className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalHours}h</div>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Projects Involved</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{uniqueProjects}</div>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Leave Days Taken</CardTitle>
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
                <CardTitle className="text-blue-900">Leave History</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-blue-900">Project Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
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
                            <TableCell className="text-right">{pb.hours}h</TableCell>
                            <TableCell className="text-right text-muted-foreground">{pb.entries}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{pb.lastDate}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-bold text-blue-900 hover:bg-blue-50">
                          <TableCell>Grand Total</TableCell>
                          <TableCell className="text-right">{totalHours}h</TableCell>
                          <TableCell className="text-right">{eManHours.length}</TableCell>
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
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
