import { useState } from 'react';
import { employees, manHours, projects, salespersons } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Download, Clock, Users, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { exportToExcel } from '@/lib/excel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ReportByProjectPage() {
  const [selectedProject, setSelectedProject] = useState<string>('p1'); // Default to Abu Dhabi Metro Expansion
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const project = projects.find(p => p._id === selectedProject);
  const salesperson = salespersons.find(s => s._id === project?.salespersonId);
  
  // Data Filtering
  const pManHours = manHours.filter(mh => {
    if (mh.projectId !== selectedProject) return false;
    if (dateRange?.from && new Date(mh.date) < dateRange.from) return false;
    if (dateRange?.to && new Date(mh.date) > dateRange.to) return false;
    return true;
  });

  // Summaries
  const totalHours = pManHours.reduce((sum, mh) => sum + mh.hours, 0);
  const uniqueEmployees = new Set(pManHours.map(mh => mh.employeeId)).size;

  // Employee Breakdown
  const employeeBreakdown = Array.from(new Set(pManHours.map(mh => mh.employeeId))).map(eid => {
    const e = employees.find(emp => emp._id === eid);
    const eEntries = pManHours.filter(mh => mh.employeeId === eid);
    const eHours = eEntries.reduce((sum, mh) => sum + mh.hours, 0);
    const lastDate = [...eEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
    
    return {
      employeeName: e?.name || 'Unknown',
      department: e?.department || '-',
      hours: eHours,
      entries: eEntries.length,
      lastDate
    };
  }).sort((a, b) => b.hours - a.hours);

  const handleExport = () => {
    if (!project) return;
    
    const exportData = employeeBreakdown.map(eb => ({
      Project: project?.name || 'Unnamed Project',
      Employee: eb.employeeName,
      Department: eb.department,
      'Total Hours': eb.hours,
      Entries: eb.entries,
      'Last Date': eb.lastDate
    }));

    exportToExcel(exportData, `Project_Report_${(project?.name || 'Unnamed').replace(/\s+/g, '_')}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Report: By Project</h2>
        <p className="text-muted-foreground">View detailed hour logs and team contributions per project.</p>
      </div>

      <Card className="border-blue-100 shadow-sm bg-blue-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
            <SearchableSelect
              options={projects.map(p => ({ label: p.name || 'Unnamed Project', value: p._id }))}
              value={selectedProject}
              onChange={setSelectedProject}
              placeholder="Select Project"
              searchPlaceholder="Search projects..."
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

      {project && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">Total Hours</CardTitle>
                <Clock className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalHours} hrs</div>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">Team Members</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{uniqueEmployees}</div>
              </CardContent>
            </Card>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-900">Salesperson</CardTitle>
                <UserCircle className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 truncate" title={salesperson?.name}>
                  {salesperson?.name || '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Employee Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:hidden space-y-4">
                {employeeBreakdown.length > 0 ? (
                  <>
                    {employeeBreakdown.map(eb => (
                      <div key={eb.employeeName} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-slate-800">{eb.employeeName}</div>
                          <div className="font-bold text-blue-700">{eb.hours} hrs</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{eb.department}</div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-50">
                          <span className="text-slate-500">Entries: {eb.entries}</span>
                          <span className="text-slate-500">Last: {eb.lastDate}</span>
                        </div>
                      </div>
                    ))}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center font-bold text-slate-900 mt-2">
                      <span>Grand Total</span>
                      <span>{totalHours} hrs ({pManHours.length} entries)</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No employee hours found for this project.</div>
                )}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Total Hours</TableHead>
                      <TableHead className="text-right">Entries</TableHead>
                      <TableHead className="text-right">Last Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeBreakdown.length > 0 ? (
                      <>
                        {employeeBreakdown.map(eb => (
                          <TableRow key={eb.employeeName}>
                            <TableCell className="font-medium">{eb.employeeName}</TableCell>
                            <TableCell className="text-muted-foreground">{eb.department}</TableCell>
                            <TableCell className="text-right font-semibold">{eb.hours} hrs</TableCell>
                            <TableCell className="text-right text-muted-foreground">{eb.entries}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{eb.lastDate}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-bold text-slate-900 hover:bg-blue-50">
                          <TableCell colSpan={2}>Grand Total</TableCell>
                          <TableCell className="text-right">{totalHours} hrs</TableCell>
                          <TableCell className="text-right">{pManHours.length}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No employee hours found for this project.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
