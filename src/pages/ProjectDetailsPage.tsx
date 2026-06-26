import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Banknote, Activity, Briefcase, Users } from 'lucide-react';
import { fetchProjectDetails } from '@/api/manhourTrackerApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Toggle state to view charts by Cost or by Hours
  const [chartMetric, setChartMetric] = useState<'cost' | 'hours'>('cost');

  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProjectDetails(projectId);
        setProjectData(data);

        // Auto-switch to 'hours' view if labor costs are 0 but hours exist
        const actualData = data?.data || data;
        const laborCost = actualData?.financials?.laborCost || 0;
        const totalHours = actualData?.financials?.loggedHours || 0;
        if (laborCost === 0 && totalHours > 0) {
          setChartMetric('hours');
        }
      } catch (error) {
        console.error("Failed to fetch project details:", error);
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const actualData = projectData?.data || projectData;

  if (!actualData || !actualData.project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Project Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  const { project, financials, dailyBreakdown = [], taskBreakdown = [], employeeBreakdown = [] } = actualData;
  const status = project.status || (project.isActive ? 'Active' : 'Inactive');
  const isActiveStatus = status === 'In progress' || status === 'Active';

  // Enrich task breakdown with real names if backend returned raw ObjectIds
  const enrichedTaskBreakdown = taskBreakdown.map((t: any) => {
    const isMongoId = /^[a-f\d]{24}$/i.test(t.taskName || '');
    if (isMongoId || !t.taskName) {
      const idToFind = t.taskId || t.taskName;
      const matchedTask = project?.tasks?.find((pt: any) => pt._id === idToFind);
      if (matchedTask) {
        return {
          ...t,
          taskName: matchedTask.taskName || matchedTask.description || t.taskName
        };
      }
    }
    return t;
  });

  // Check if we actually have non-zero data for the selected metric
  const hasDailyData = dailyBreakdown.some((d: any) => (d[chartMetric] || 0) > 0);
  const hasTaskData = enrichedTaskBreakdown.some((t: any) => (t[chartMetric] || 0) > 0);

  const calculatedManHourCost = employeeBreakdown.reduce((sum: number, emp: any) => sum + (emp.cost || 0), 0);
  const calculatedNetProfit = (financials?.grossProfit || 0) - calculatedManHourCost;

  // Formatting helpers
  const formatNumber = (val: number) => (val || 0).toLocaleString();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  console.log(financials);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="h-8 w-8 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {project.projectName}
            <Badge variant={isActiveStatus ? "default" : "secondary"} className={isActiveStatus ? "bg-blue-100 text-blue-800 border-none" : ""}>
              {status}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1 flex-wrap text-sm">
            <Briefcase className="h-4 w-4" /> {project.projectId}
            <span className="text-slate-300">|</span>
            <span>Customer: <strong className="text-slate-700">{project.customerId?.name || 'N/A'}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Salesperson: <strong className="text-slate-700">{project.salespersonName || 'Not Assigned'}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Billing: <strong className="text-slate-700">{project.billingMethod || 'N/A'}</strong></span>
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(financials.revenue || 0)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-orange-100 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Banknote className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(financials.totalCost
              || 0)}</div>
            {project.costBudget > 0 && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Budget: {formatCurrency(project.costBudget)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-black`}>
              {formatCurrency(financials?.grossProfit || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-indigo-100 bg-indigo-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Man Hour Cost</CardTitle>
            <Banknote className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(financials?.manHourCost || financials?.manhourCost || calculatedManHourCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-violet-100 bg-violet-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Activity className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${((project.revenueBudget || 0) - (project.costBudget || 0) - (calculatedManHourCost || 0)) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(project.revenueBudget && project.costBudget ? ((project.revenueBudget - project.costBudget) - calculatedManHourCost) : (financials?.netProfit ?? calculatedNetProfit))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Toggles */}
      <div className="flex justify-end space-x-2">
        <Button
          variant={chartMetric === 'cost' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartMetric('cost')}
          className={chartMetric === 'cost' ? 'bg-blue-600' : ''}
        >
          View Costs
        </Button>
        <Button
          variant={chartMetric === 'hours' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartMetric('hours')}
          className={chartMetric === 'hours' ? 'bg-blue-600' : ''}
        >
          View Hours
        </Button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Breakdown Bar Chart */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-800">Daily Breakdown</CardTitle>
            <CardDescription className="text-slate-500">Man-hours logged per day</CardDescription>
          </CardHeader>
          <CardContent>
            {hasDailyData ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis
                      tickFormatter={(val) => chartMetric === 'cost' ? formatCurrency(val) : `${val} hrs`}
                      axisLine={false} tickLine={false} tick={{ fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(value: any) => chartMetric === 'cost' ? formatCurrency(value) : `${value} hrs`}
                      labelFormatter={(label) => `Date: ${label}`}
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar
                      dataKey={chartMetric}
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
                {dailyBreakdown.length > 0 ? `Total ${chartMetric} is 0. Switch view to see other metrics.` : "No daily breakdown data available"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Distribution Pie Chart */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-800">Task Distribution</CardTitle>
            <CardDescription className="text-slate-500">Breakdown of logged tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTaskData ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrichedTaskBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey={chartMetric}
                      nameKey="taskName"
                    >
                      {enrichedTaskBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => chartMetric === 'cost' ? formatCurrency(value) : `${value} hrs`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
                {enrichedTaskBreakdown.length > 0 ? `Total ${chartMetric} is 0. Switch view to see other metrics.` : "No task data available"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Breakdown Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Employee Breakdown
          </CardTitle>
          <CardDescription>Details of logged hours per employee.</CardDescription>
        </CardHeader>
        <CardContent>
          {employeeBreakdown.length > 0 ? (
            <>
              <div className="md:hidden space-y-3">
                {employeeBreakdown.map((emp: any, idx: number) => (
                  <div key={emp.employeeId || idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center">
                    <div className="font-medium text-slate-800">{emp.employeeName}</div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatNumber(emp.hours)} hrs</div>
                      <div className="text-sm text-slate-500">{formatCurrency(emp.cost)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead className="text-right">Logged Hours</TableHead>
                      <TableHead className="text-right">Labor Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeBreakdown.map((emp: any, idx: number) => (
                      <TableRow key={emp.employeeId || idx}>
                        <TableCell className="font-medium">{emp.employeeName}</TableCell>
                        <TableCell className="text-right">{formatNumber(emp.hours)} hrs</TableCell>
                        <TableCell className="text-right">{formatCurrency(emp.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              No employee data available for this project.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
