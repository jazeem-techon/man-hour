import { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { Link } from 'react-router';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchSalespeopleWithTargets } from '@/api/manhourTrackerApi';
import { formatCurrency } from '@/lib/utils';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-600 bg-red-50 rounded-md border border-red-200">
        <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
        <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
        <pre className="whitespace-pre-wrap text-sm mt-4">{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}


export function SalespersonReportPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
    return firstDay.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    // Get the last day of the current month
    const lastDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0));
    return lastDay.toISOString().split('T')[0];
  });

  const totals = useMemo(() => {
    let targetAmount = 0;
    let revenue = 0;
    let totalCost = 0;
    let grossProfit = 0;

    data.forEach(item => {
      const t = item.target || {};
      let amt = 0;
      if (t.revenueTarget > 0) amt = t.revenueTarget;
      else if (t.gpTarget > 0) amt = t.gpTarget;
      else if (t.netProfitTarget > 0) amt = t.netProfitTarget;
      targetAmount += amt;

      revenue += (item.actuals?.revenue || 0);
      totalCost += (item.actuals?.totalCost || 0);
      grossProfit += (item.actuals?.grossProfit || 0);
    });

    return { targetAmount, revenue, totalCost, grossProfit };
  }, [data]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchSalespeopleWithTargets({ startDate, endDate });
      setData(Array.isArray(res) ? res : (res?.data || []));
    } catch (error) {
      console.error("Failed to fetch salespeople", error);
      toast.error("Failed to load salespeople data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);



  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.original?._id;
        const name = row.getValue('name') as string;
        return (
          <Link to={`/projects/salesman/${id}`} className="text-blue-600 hover:underline font-medium">
            {name}
          </Link>
        );
      }
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: 'targetType',
      accessorFn: (row) => {
        const t = row.target || {};
        if (t.revenueTarget > 0) return 'Revenue Target';
        if (t.gpTarget > 0) return 'GP Target';
        if (t.netProfitTarget > 0) return 'NP Target';
        return '-';
      },
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-start" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Target Type <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const target = row.original?.target || {};
        let type = '-';
        if (target.revenueTarget > 0) type = 'Revenue Target';
        else if (target.gpTarget > 0) type = 'GP Target';
        else if (target.netProfitTarget > 0) type = 'NP Target';

        return (
          <div className="flex items-center gap-2 font-medium">
            {type !== '-' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">ACTIVE</span>}
            <span>{type}</span>
          </div>
        );
      }
    },
    {
      id: 'targetAmount',
      accessorFn: (row) => {
        const t = row.target || {};
        if (t.revenueTarget > 0) return t.revenueTarget;
        if (t.gpTarget > 0) return t.gpTarget;
        if (t.netProfitTarget > 0) return t.netProfitTarget;
        return 0;
      },
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Target Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const target = row.original?.target || {};
        let amount = 0;
        if (target.revenueTarget > 0) amount = target.revenueTarget;
        else if (target.gpTarget > 0) amount = target.gpTarget;
        else if (target.netProfitTarget > 0) amount = target.netProfitTarget;

        return (
          <div className="text-right font-medium">
            {amount > 0 ? formatCurrency(amount) : '-'}
          </div>
        );
      }
    },
    {
      accessorKey: 'actuals.revenue',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Actual Revenue <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rev = row.original?.actuals?.revenue as number;
        return <div className="text-right font-medium ">{rev ? formatCurrency(rev) : '-'}</div>;
      }
    },
    {
      accessorKey: 'actuals.totalCost',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Cost <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const tc = row.original?.actuals?.totalCost as number;
        return <div className="text-right font-medium ">{tc ? formatCurrency(tc) : '-'}</div>;
      }
    },
    {
      accessorKey: 'actuals.grossProfit',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Gross Profit <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const gp = row.original?.actuals?.grossProfit as number;
        return <div className={`text-right font-medium `}>{gp ? formatCurrency(gp) : '-'}</div>;
      }
    }
  ], []);

  const table = useReactTable({
    data,
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
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Salesperson Report</h2>
          <p className="text-muted-foreground">View salesperson performance across a specific date range.</p>
        </div>



        <Card className="border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-900">Salesperson Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center py-4 justify-between px-2 gap-4">
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full lg:w-auto">
                <Input
                  placeholder="Filter names..."
                  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("name")?.setFilterValue(event.target.value)
                  }
                  className="w-full sm:max-w-[200px]"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-[150px]"
                  />
                  <span className="text-slate-500 font-medium hidden sm:inline">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-[150px]"
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto mt-2 lg:mt-0 ml-auto">
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
                          {column.id.replace('target.', 'Target: ').replace('actuals.', 'Actual: ')}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="md:hidden space-y-4">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <div key={row.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-3">
                    {row.getVisibleCells().map((cell) => {
                      const getHeaderLabel = (id: string) => {
                        if (id === 'name') return 'Name';
                        if (id === 'email') return 'Email';
                        if (id === 'targetType') return 'Target Type';
                        if (id === 'targetAmount') return 'Target Amount';
                        if (id === 'actuals_revenue') return 'Actual Revenue';
                        if (id === 'actuals_totalCost') return 'Total Cost';
                        if (id === 'actuals_grossProfit') return 'Gross Profit';
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
                <div className="text-center p-4 text-slate-500">No salespersons found.</div>
              )}
            </div>

            <div className="md:hidden mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Totals Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Total Target</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totals.targetAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Total Actual Revenue</span>
                  <span className="font-bold">{formatCurrency(totals.revenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Total Cost</span>
                  <span className="font-bold">{formatCurrency(totals.totalCost)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="font-bold text-slate-800">Total Gross Profit</span>
                  <span className="font-bold">{formatCurrency(totals.grossProfit)}</span>
                </div>
              </div>
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
                        No salespersons found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 font-bold">
                    {table.getHeaderGroups()[0].headers.map((header, i) => {
                      const id = header.column.id;
                      if (id === 'targetAmount') {
                        return <TableCell key={id} className="text-right">{formatCurrency(totals.targetAmount)}</TableCell>
                      }
                      if (id === 'actuals_revenue') {
                        return <TableCell key={id} className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                      }
                      if (id === 'actuals_totalCost') {
                        return <TableCell key={id} className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                      }
                      if (id === 'actuals_grossProfit') {
                        return <TableCell key={id} className="text-right">{formatCurrency(totals.grossProfit)}</TableCell>
                      }
                      if (i === 0) {
                        return <TableCell key={id}>Total</TableCell>
                      }
                      return <TableCell key={id}></TableCell>
                    })}
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
    </ErrorBoundary>
  );
}
