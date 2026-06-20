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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ArrowUpDown, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  fetchManhourProjects,
  fetchProjectsBySalesperson
} from '@/api/manhourTrackerApi';



export function ProjectsPage() {
  const { salespersonId } = useParams<{ salespersonId: string }>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [data, setData] = useState<any[]>([]);
  const [backendTotals, setBackendTotals] = useState<any>(null);
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
      let projectsRes;
      if (salespersonId) {
        projectsRes = await fetchProjectsBySalesperson(salespersonId, { startDate, endDate, limit: 1000 });
      } else {
        projectsRes = await fetchManhourProjects({ startDate, endDate, limit: 1000 });
      }
      setData(Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || []));
      if (projectsRes && !Array.isArray(projectsRes)) {
        const t = projectsRes.totals || projectsRes;
        setBackendTotals({
          revenue: t.totalRevenue || 0,
          totalCost: t.totalPurchaseCost || 0,
          laborCost: t.totalManHourCost || 0,
          grossProfit: t.totalGp || 0,
          net: t.totalNet || 0,
        });
      } else {
        setBackendTotals(null);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load page data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, salespersonId]);

  const filteredData = useMemo(() => data, [data]);

  const uniqueSalespersons = useMemo(() => {
    const spSet = new Set<string>();
    data.forEach(row => {
      const name = row.salespersonName || row.salesperson?.name || row.salesPersonId?.name || row.salesperson || 'Not Assigned';
      if (typeof name === 'string') {
        spSet.add(name);
      }
    });
    return Array.from(spSet).sort();
  }, [data]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'projectDate',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('projectDate');
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
        const description = row.original?.description as string;
        return (
          <div className="flex flex-col">
            <Link to={`/projects/${pId}`} className="text-blue-600 hover:underline font-medium">
              {displayId}
            </Link>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
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
      id: 'salespersonName',
      accessorFn: (row) => row.salespersonName || row.salesperson?.name || row.salesPersonId?.name || row.salesperson || 'Not Assigned',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Sales Man <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return <div>{row.getValue('salespersonName') as string}</div>;
      }
    },
    {
      id: 'revenue',
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
      id: 'totalCost',
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
      id: 'laborCost',
      accessorKey: 'financials.laborCost',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Man Hour Cost <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const cost = row.original?.financials?.laborCost as number;
        return <div className="text-right font-medium">{cost ? formatCurrency(cost) : '-'}</div>;
      }
    },
    // {
    //   id: 'grossProfit',
    //   accessorKey: 'financials.grossProfit',
    //   header: ({ column }) => (
    //     <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    //       Gross Profit <ArrowUpDown className="h-4 w-4 ml-2" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     const gp = row.original?.financials?.grossProfit as number;
    //     return <div className="text-right font-medium">{gp !== undefined ? formatCurrency(gp) : '-'}</div>;
    //   }
    // },
    // {
    //   id: 'netProfit',
    //   accessorFn: (row) => (row.financials?.grossProfit || 0) - (row.financials?.laborCost || 0),
    //   header: ({ column }) => (
    //     <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    //       Net Profit <ArrowUpDown className="h-4 w-4 ml-2" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     const gp = row.original?.financials?.grossProfit || 0;
    //     const labor = row.original?.financials?.laborCost || 0;
    //     const net = gp - labor;
    //     return <div className="text-right font-medium">{formatCurrency(net)}</div>;
    //   }
    // },
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

  const totals = backendTotals || { revenue: 0, totalCost: 0, laborCost: 0, grossProfit: 0, net: 0 };

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
          <div className="flex flex-col lg:flex-row lg:items-center py-4 justify-between px-2 gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full lg:w-auto">
              <Input
                placeholder="Filter projects..."
                value={(table.getColumn("projectName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("projectName")?.setFilterValue(event.target.value)
                }
                className="w-full sm:max-w-[200px]"
              />
              <Select
                value={(table.getColumn("salespersonName")?.getFilterValue() as string) || "all"}
                onValueChange={(value) =>
                  table.getColumn("salespersonName")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full sm:max-w-[200px]">
                  <SelectValue placeholder="All Salesmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salesmen</SelectItem>
                  {uniqueSalespersons.map((sp) => (
                    <SelectItem key={sp} value={sp}>
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                />
                <span className="text-slate-500 font-medium">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto lg:ml-auto">
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
                        {column.id.replace('financials.', 'Financials: ').replace('revenue', 'Revenue').replace('totalCost', 'Purchase Cost').replace('laborCost', 'Man Hour Cost').replace('grossProfit', 'Gross Profit').replace('netProfit', 'Net Profit')}
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
                      if (id === 'projectDate') return 'Date';
                      if (id === 'projectName') return 'Job Id';
                      if (id === 'customer') return 'Customer';
                      if (id === 'salespersonName') return 'Sales Man';
                      if (id === 'revenue' || id === 'financials_revenue') return 'Revenue';
                      if (id === 'totalCost' || id === 'financials_totalCost') return 'Purchase Cost';
                      if (id === 'laborCost' || id === 'financials_laborCost') return 'Man Hour Cost';
                      if (id === 'grossProfit' || id === 'financials_grossProfit') return 'Gross Profit';
                      if (id === 'netProfit') return 'Net Profit';
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
            {table.getRowModel().rows?.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm mt-6">
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">Totals Summary</h3>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-slate-600">Revenue</span>
                  <span className="text-right font-bold text-slate-800">{formatCurrency(totals.revenue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-slate-600">Purchase Cost</span>
                  <span className="text-right font-bold text-slate-800">{formatCurrency(totals.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-slate-600">Man Hour Cost</span>
                  <span className="text-right font-bold text-slate-800">{formatCurrency(totals.laborCost)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-slate-600">Gross Profit</span>
                  <span className="text-right font-bold text-slate-800">{formatCurrency(totals.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-600">Net Profit</span>
                  <span className="text-right font-bold text-slate-800">{formatCurrency(totals.net)}</span>
                </div>
              </div>
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
              <TableFooter>
                <TableRow className="bg-slate-50 hover:bg-slate-50 font-bold">
                  {table.getHeaderGroups()[0].headers.map((header, i) => {
                    const id = header.column.id;
                    if (id === 'revenue' || id === 'financials_revenue' || id === 'financials.revenue') {
                      return <TableCell key={id} className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                    }
                    if (id === 'totalCost' || id === 'financials_totalCost' || id === 'financials.totalCost') {
                      return <TableCell key={id} className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                    }
                    if (id === 'laborCost' || id === 'financials_laborCost' || id === 'financials.laborCost') {
                      return <TableCell key={id} className="text-right">{formatCurrency(totals.laborCost)}</TableCell>
                    }
                    if (id === 'grossProfit' || id === 'financials_grossProfit' || id === 'financials.grossProfit') {
                      return <TableCell key={id} className="text-right">{formatCurrency(totals.grossProfit)}</TableCell>
                    }
                    if (id === 'netProfit') {
                      return <TableCell key={id} className="text-right">{formatCurrency(totals.net)}</TableCell>
                    }
                    if (i === 0) {
                      return <TableCell key={id}>Total</TableCell>
                    }
                    return <TableCell key={id}></TableCell>
                  })}
                </TableRow>
                <TableRow className="bg-slate-50 hover:bg-slate-50 font-bold border-t">
                  <TableCell colSpan={table.getHeaderGroups()[0].headers.length}>
                    <div className="flex justify-end gap-12 pr-4 sm:pr-8">
                       <div className="flex items-center gap-3">
                          <span className="text-slate-600 uppercase text-xs tracking-wider">Gross Profit</span>
                          <span className="text-slate-900 text-base">{formatCurrency(totals.grossProfit)}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-slate-600 uppercase text-xs tracking-wider">Net Profit</span>
                          <span className="text-slate-900 text-base">{formatCurrency(totals.net)}</span>
                       </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
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
