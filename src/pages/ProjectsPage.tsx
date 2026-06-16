import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnDef
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  fetchManhourProjects
} from '@/api/manhourTrackerApi';



export function ProjectsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const d = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000);
    return d.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const d = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000);
    return d.toISOString().split('T')[0];
  });


  const loadData = async () => {
    try {
      setIsLoading(true);
      const projectsRes = await fetchManhourProjects({ startDate, endDate, limit: 1000 });
      setData(Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || []));
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load page data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const filteredData = useMemo(() => data, [data]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('createdAt');
        return <div>{date ? new Date(date as string).toLocaleDateString() : '-'}</div>;
      }
    },
    {
      accessorKey: 'projectName',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Job Id <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>

      ),
      cell: ({ row }) => {
        const pId = row.original?._id;
        const displayId = row.getValue('projectName') as string;
        return (
          <Link to={`/projects/${pId}`} className="text-blue-600 hover:underline font-medium">
            {displayId}
          </Link>
        );
      }
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => {
        const cust = row.original?.customerId;
        return <div className="truncate max-w-[200px]" title={cust?.name}>{cust?.name || '-'}</div>;
      }
    },

    {
      accessorKey: 'salespersonName',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Sales Man <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const spName = row.getValue('salespersonName') ||
          row.original?.salesperson?.name ||
          row.original?.salesPersonId?.name ||
          row.original?.salesperson;
        return <div>{spName as string || 'Not Assigned'}</div>;
      }
    },
    {
      accessorKey: 'financials.revenue',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Revenue <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rev = row.original.financials?.revenue;
        return <div className="text-right font-medium">{rev ? formatCurrency(rev) : '-'}</div>;
      }
    },
    {
      accessorKey: 'financials.totalCost',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
         Purchase Cost <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const cost = row.original.financials?.totalCost;
        return <div className="text-right font-medium">{cost ? formatCurrency(cost) : '-'}</div>;
      }
    },
    {
      accessorKey: 'financials.loggedHours',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Man Hours <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const hrs = row.original?.financials?.loggedHours as number;
        return <div className="text-right font-medium">{hrs || 0}h</div>;
      }
    },
   {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const isActive = status === 'In progress' || status === 'Active';
        return (
          <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-none" : ""}>
            {status || 'Unknown'}
          </Badge>
        );
      }
    },
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h2>
        <p className="text-muted-foreground">Manage projects and assigned salespersons.</p>
      </div>


      <Card className="border-blue-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900">Projects Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center py-4 justify-between px-2 gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Input
                placeholder="Filter projects..."
                value={(table.getColumn("projectName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("projectName")?.setFilterValue(event.target.value)
                }
                className="max-w-sm w-full"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
                <span className="text-slate-500 font-medium">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id.replace('financials.', 'Financials: ')}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="md:hidden space-y-4">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <div key={row.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                  {row.getVisibleCells().map((cell) => {
                    const getHeaderLabel = (id: string) => {
                      if (id === 'createdAt') return 'Date';
                      if (id === 'projectName') return 'Job Id';
                      if (id === 'customer') return 'Customer';
                      if (id === 'salespersonName') return 'Sales Man';
                      if (id === 'financials_revenue') return 'Revenue';
                      if (id === 'financials_totalCost') return 'Purchase Cost';
                      if (id === 'financials_loggedHours') return 'Total Man Hours';
                      if (id === 'status') return 'Status';
                      return id;
                    };
                    return (
                      <div key={cell.id} className="flex justify-between items-center text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                        <span className="font-semibold text-slate-600 mr-4">
                          {getHeaderLabel(cell.column.id)}
                        </span>
                        <span className="text-right text-slate-800 break-words max-w-[60%]">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-slate-500">No projects found.</div>
            )}
          </div>
          <div className="hidden md:block rounded-md border">
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
          <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
              {table.getFilteredRowModel().rows.length} row(s) total.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 space-x-0 sm:space-x-0 lg:space-x-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount() || 1}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
