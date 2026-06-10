import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { leaves, employees } from '@/data/mockData';
import { Leave } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, ArrowUpDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/excel';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel,
  getFilteredRowModel,
  flexRender, 
  SortingState,
  ColumnDef,
  ColumnFiltersState
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  leaveType: z.enum(['combo_off', 'sick_leave', 'no_paid']),
  startDate: z.date(),
  endDate: z.date(),
  note: z.string(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

type LeaveWithDetails = Leave & {
  employeeName: string;
  duration: number;
};

export function LeavesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: '',
      leaveType: 'combo_off',
      startDate: new Date(),
      endDate: new Date(),
      note: '',
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success('Leave requested successfully!');
    form.reset();
  }

  const leavesData: LeaveWithDetails[] = useMemo(() => leaves.map(l => {
    const emp = employees.find(e => e._id === l.employeeId);
    const duration = differenceInDays(new Date(l.endDate), new Date(l.startDate)) + 1;
    return {
      ...l,
      employeeName: emp?.name || 'Unknown',
      duration
    };
  }), []);

  const columns = useMemo<ColumnDef<LeaveWithDetails>[]>(() => [
    {
      accessorKey: 'employeeName',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Employee <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'leaveType',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Leave Type <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const type = row.getValue('leaveType') as string;
        if (type === 'sick_leave') return <Badge variant="outline" className="text-yellow-700 border-yellow-500 bg-yellow-50">Sick Leave</Badge>;
        if (type === 'no_paid') return <Badge variant="outline" className="text-orange-700 border-orange-500 bg-orange-50">No Paid</Badge>;
        return <Badge variant="outline" className="text-blue-700 border-blue-500 bg-blue-50">Combo Off</Badge>;
      }
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Start Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          End Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Duration <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-right">{row.getValue('duration')} days</div>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'active' ? "default" : "secondary"} className={status === 'active' ? "bg-green-100 text-green-800 hover:bg-green-200 border-none" : ""}>
            {status === 'active' ? 'Active' : 'Ended'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'note',
      header: 'Note',
      cell: ({ row }) => <div className="max-w-[200px] truncate" title={row.getValue('note')}>{row.getValue('note')}</div>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const status = row.getValue('status');
        if (status === 'active') {
          return <Button variant="outline" size="sm" onClick={() => toast.success('Leave ended')}>End Leave</Button>;
        }
        return <span className="text-muted-foreground">-</span>;
      }
    }
  ], []);

  const table = useReactTable({
    data: leavesData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  const handleExport = () => {
    const dataToExport = table.getFilteredRowModel().rows.map(row => ({
      Employee: row.original.employeeName,
      'Leave Type': row.original.leaveType,
      'Start Date': row.original.startDate,
      'End Date': row.original.endDate,
      'Duration (Days)': row.original.duration,
      Status: row.original.status,
      Note: row.original.note,
    }));
    exportToExcel(dataToExport, 'Leaves_Report');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-blue-900">Leaves</h2>
        <p className="text-muted-foreground">Manage employee leave requests.</p>
      </div>

      <Card className="border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-900">Add Leave Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
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
                          {employees.map(e => (
                            <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="combo_off">Combo Off</SelectItem>
                          <SelectItem value="sick_leave">Sick Leave</SelectItem>
                          <SelectItem value="no_paid">No Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2.5">
                      <FormLabel className="mb-1">Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2.5">
                      <FormLabel className="mb-1">End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                Submit Leave
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-blue-100 shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
          <CardTitle className="text-blue-900">Leaves Directory</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Select
              value={(table.getColumn('employeeName')?.getFilterValue() as string) ?? ""}
              onValueChange={(val) => table.getColumn('employeeName')?.setFilterValue(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map(e => <SelectItem key={e._id} value={e.name}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <Select
              value={(table.getColumn('leaveType')?.getFilterValue() as string) ?? ""}
              onValueChange={(val) => table.getColumn('leaveType')?.setFilterValue(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                <SelectItem value="combo_off">Combo Off</SelectItem>
                <SelectItem value="sick_leave">Sick Leave</SelectItem>
                <SelectItem value="no_paid">No Paid</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No leave records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
