import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { projects, salespersons, manHours } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel,
  flexRender, 
  SortingState,
  ColumnDef
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  salespersonId: z.string().min(1, 'Please select a salesperson'),
  isActive: z.boolean(),
});

type ProjectWithStats = typeof projects[0] & {
  salespersonName: string;
  totalHours: number;
  employeeCount: number;
};

export function ProjectsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', salespersonId: '', isActive: true },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success('Project added successfully!');
    form.reset({ name: '', salespersonId: '', isActive: true });
  }

  const projectData: ProjectWithStats[] = useMemo(() => projects.map(p => {
    const sp = salespersons.find(s => s._id === p.salespersonId);
    const pManHours = manHours.filter(mh => mh.projectId === p._id);
    return {
      ...p,
      salespersonName: sp?.name || 'Unknown',
      totalHours: pManHours.reduce((sum, mh) => sum + mh.hours, 0),
      employeeCount: new Set(pManHours.map(mh => mh.employeeId)).size
    };
  }), []);

  const columns = useMemo<ColumnDef<ProjectWithStats>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Project Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'salespersonName',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Salesperson <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-none" : ""}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'totalHours',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Hours <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-right font-medium">{row.getValue('totalHours')}h</div>
    },
    {
      accessorKey: 'employeeCount',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Employees <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-right">{row.getValue('employeeCount')}</div>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <Button variant="outline" size="sm" onClick={() => toast.success('Status toggled')}>Toggle Status</Button>
      )
    }
  ], []);

  const table = useReactTable({
    data: projectData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-blue-900">Projects</h2>
        <p className="text-muted-foreground">Manage projects and assigned salespersons.</p>
      </div>

      <Card className="border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-900">Add New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dubai Metro Expansion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salespersonId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Salesperson</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a salesperson" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salespersons.map(s => (
                          <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === 'true')} value={field.value ? 'true' : 'false'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                Add Project
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-900">Projects Directory</CardTitle>
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
                      No projects found.
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
