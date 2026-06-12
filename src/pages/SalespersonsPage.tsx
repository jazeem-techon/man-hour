import { useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Loader2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchSalespeopleWithTargets, saveTarget } from '@/api/manhourTrackerApi';
import { formatCurrency } from '@/lib/utils';

const formSchema = z.object({
  salesPersonId: z.string().min(1, 'Salesperson is required'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  targetType: z.enum(['revenueTarget', 'gpTarget', 'netProfitTarget']),
  amount: z.coerce.number().min(0, 'Target must be a positive number'),
});

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


export function SalespersonsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesPersonId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      targetType: 'revenueTarget',
      amount: 0
    },
  });

  const selectedSalesPersonId = form.watch('salesPersonId');
  const selectedSalesperson = data.find(s => s._id === selectedSalesPersonId);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchSalespeopleWithTargets();
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
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        salesPersonId: values.salesPersonId,
        month: values.month,
        year: values.year,
        revenueTarget: values.targetType === 'revenueTarget' ? values.amount : 0,
        gpTarget: values.targetType === 'gpTarget' ? values.amount : 0,
        netProfitTarget: values.targetType === 'netProfitTarget' ? values.amount : 0,
      };

      await saveTarget(payload);
      toast.success('Target updated successfully!');
      form.reset({ ...values, amount: 0 }); // keep selected salesperson/month but reset amount
      loadData(); // refresh data
    } catch (error) {
      console.error("Failed to update target", error);
      toast.error("Failed to update target");
    }
  }

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
        return <div className="text-right font-medium text-green-700">{rev ? formatCurrency(rev) : '-'}</div>;
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
        return <div className="text-right font-medium text-red-600">{tc ? formatCurrency(tc) : '-'}</div>;
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
        return <div className={`text-right font-medium ${gp < 0 ? 'text-red-600' : 'text-green-700'}`}>{gp ? formatCurrency(gp) : '-'}</div>;
      }
    },
    {
      accessorKey: 'actuals.margin',
      header: ({ column }) => (
        <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold w-full justify-end" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Margin % <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const margin = row.original?.actuals?.margin as number;
        return <div className="text-right font-medium">{margin ? `${margin.toFixed(2)}%` : '-'}</div>;
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
      pagination: { pageSize: 5 },
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
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Salespersons & Targets</h2>
          <p className="text-muted-foreground">Manage your sales team and set revenue targets.</p>
        </div>

        <Card className="border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-blue-900">Set Salesperson Target</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="salesPersonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salesperson</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Salesperson" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {data.map(sp => (
                              <SelectItem key={sp._id} value={sp._id}>{sp.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input readOnly value={selectedSalesperson?.email || 'Select a salesperson to view email'} className="bg-gray-50 text-gray-500" />
                  </div>



                  <FormField
                    control={form.control as any}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="revenueTarget">Revenue Target</SelectItem>
                            <SelectItem value="gpTarget">Gross Profit Target</SelectItem>
                            <SelectItem value="netProfitTarget">Net Profit Target</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (AED)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                    Save Target
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-blue-900">Salesperson Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center py-4 justify-between px-2">
              <Input
                placeholder="Filter names..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
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
                        No salespersons found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} row(s) total.
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
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
