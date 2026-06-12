import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock, Users, Briefcase, Banknote, Activity, Percent,
  TrendingUp, Target, Loader2, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchAdminDashboard, fetchSalespersonDashboard } from '@/api/manhourTrackerApi';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Period Filter Component ────────────────────────────────────
function PeriodFilter({
  period, year, quarter, month,
  onPeriodChange, onYearChange, onQuarterChange, onMonthChange,
}: {
  period: string;
  year: number;
  quarter: number;
  month: number;
  onPeriodChange: (v: string) => void;
  onYearChange: (v: number) => void;
  onQuarterChange: (v: number) => void;
  onMonthChange: (v: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-500" />
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[100px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === 'quarterly' && (
        <Select value={String(quarter)} onValueChange={(v) => onQuarterChange(Number(v))}>
          <SelectTrigger className="w-[100px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Q1</SelectItem>
            <SelectItem value="2">Q2</SelectItem>
            <SelectItem value="3">Q3</SelectItem>
            <SelectItem value="4">Q4</SelectItem>
          </SelectContent>
        </Select>
      )}

      {period === 'monthly' && (
        <Select value={String(month)} onValueChange={(v) => onMonthChange(Number(v))}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, gradient, subtitle }: {
  title: string;
  value: string;
  icon: any;
  gradient: string;
  subtitle?: string;
}) {
  return (
    <Card className={`${gradient} text-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
        <Icon className="h-5 w-5 text-white/60" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Target Pie Chart ────────────────────────────────────────
function TargetPieChart({ label, progressData, icon: Icon }: {
  label: string;
  progressData: { target: number; actual: number; percentage: number; remaining: number; isAchieved: boolean } | null;
  icon?: any;
}) {
  if (!progressData) {
    return null;
  }

  const { target, actual, percentage, remaining, isAchieved } = progressData;
  const isNegative = actual < 0;
  
  const safePercentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
  const achievedPct = isNegative ? 0 : Math.min(Math.max(safePercentage, 0), 100);
  const pendingPct = Math.max(100 - achievedPct, 0);
  
  const isEmpty = achievedPct === 0 && pendingPct === 0;

  const data = isEmpty 
    ? [{ name: 'No Data', value: 100, fill: '#f1f5f9' }] // Slate-100 for empty state
    : [
        { name: 'Target Achieved', value: achievedPct, fill: '#5cb85c' },
        { name: 'Target Pending', value: pendingPct, fill: '#1d78c1' }
      ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.08 || isEmpty) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        style={{ textShadow: '0px 2px 5px rgba(0,0,0,0.5)' }}
      >
        <tspan x={x} dy="-0.2em" fontSize="28" fontWeight="800" fontFamily="system-ui, sans-serif">{`${(percent * 100).toFixed(0)}%`}</tspan>
        <tspan x={x} dy="1.4em" fontSize="13" fontWeight="600" fillOpacity={0.95}>{`(${name})`}</tspan>
      </text>
    );
  };

  return (
    <div className="p-6 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-6">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-5 w-5 text-indigo-600/80" />}
          <span className="text-base font-bold text-slate-800 tracking-tight">{label}</span>
        </div>
        {!isEmpty && (
          isAchieved ? (
            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs px-2.5 py-0.5 shadow-sm">
              ✅ Achieved
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 text-slate-500 bg-slate-50 border-slate-200 shadow-sm">
              In Progress
            </Badge>
          )
        )}
      </div>

      {/* Pie Chart */}
      <div className="h-[320px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={135}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {!isEmpty && (
              <Tooltip
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            )}
            <Legend 
              verticalAlign="bottom" 
              height={40} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '14px', fontWeight: '500', paddingTop: '10px' }}
              formatter={(value, entry: any) => {
                if (value === 'No Data') return <span className="text-slate-400 ml-1">No Data Available</span>;
                return (
                  <span className="text-slate-700 ml-1">
                    {value} <span className="font-semibold ml-0.5">({entry.payload.value.toFixed(0)}%)</span>
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 w-full text-center mt-6">
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Target</p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(target || 0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Actual</p>
          <p className={`text-sm font-bold ${isNegative ? 'text-red-600' : 'text-emerald-700'}`}>
            {formatCurrency(actual || 0)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Remaining</p>
          <p className={`text-sm font-bold ${remaining === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {formatCurrency(remaining || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────
function AdminDashboard({ data }: { data: any }) {
  const summary = data?.summary || {};
  const monthlyTrend = data?.monthlyTrend || [];
  const topEmployees = data?.topEmployees || [];
  const projects = data?.projects || [];

  const fmt = (v: number) => (v || 0).toLocaleString();

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Projects"
          value={fmt(summary.projectsCount)}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          subtitle={`${fmt(summary.activeProjectsCount || 0)} active`}
        />
        <StatCard
          title="Total Man-Hours"
          value={`${fmt(summary.totalManHours)}h`}
          icon={Clock}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
        />
        <StatCard
          title="Man-Hour Cost"
          value={formatCurrency(summary.totalManHourCost || 0)}
          icon={Banknote}
          gradient="bg-gradient-to-br from-violet-600 to-violet-800"
        />
      </div>

      {/* Chart + Top Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="lg:col-span-4 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-800">Monthly Cost Trend</CardTitle>
            <CardDescription>Man-hour cost over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {monthlyTrend.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b' }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => [formatCurrency(value), name]}
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="manHourCost" name="Man-Hour Cost" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
                No trend data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Employees Table */}
        <Card className="lg:col-span-3 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Top Employees
            </CardTitle>
            <CardDescription>By logged hours</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {topEmployees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topEmployees.slice(0, 8).map((emp: any, idx: number) => (
                    <TableRow key={emp.employeeId || idx}>
                      <TableCell className="font-medium">{emp.employeeName || 'Unknown'}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-900">{fmt(emp.totalHours)}h</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(emp.totalCost || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
                No employee data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            All Projects
          </CardTitle>
          <CardDescription>Project overview with financials</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {projects.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Project</TableHead>
                    <TableHead>Salesperson</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p: any) => {
                    const f = p.financials || {};
                    const status = p.status || 'Unknown';
                    const isActive = status === 'In progress' || status === 'Active';
                    return (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">
                          <Link to={`/projects/${p._id}`} className="text-blue-600 hover:underline">
                            {p.projectName || p.projectId}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.salespersonName || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isActive ? 'default' : 'secondary'}
                            className={isActive ? 'bg-blue-100 text-blue-800 border-none' : ''}
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(f.loggedHours)}h</TableCell>
                        <TableCell className="text-right">{formatCurrency(f.totalCost || 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[150px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
              No projects found for this period
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Salesperson Dashboard ──────────────────────────────────────
function SalespersonDashboard({ data }: { data: any }) {
  const salesperson = data?.salesperson || {};
  const target = data?.target || {};
  const actuals = data?.actuals || {};
  const monthlyTarget = data?.monthlyTarget || null;
  const quarterlyTarget = data?.quarterlyTarget || null;
  const projects = data?.projects || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const projectsCount = data?.projectsCount || projects.length;

  const fmt = (v: number) => (v || 0).toLocaleString();

  const hasTargets = !!monthlyTarget || !!quarterlyTarget;
  
  // Calculate an overall achievement percentage for the summary card (if available)
  const targetAchievementPct = monthlyTarget?.percentage || 0;

  return (
    <>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-xl p-6 text-white shadow-lg">
        <h3 className="text-2xl font-bold">
          Welcome back, {salesperson.name || 'Salesperson'} 👋
        </h3>
        <p className="text-blue-100 mt-1">
          Here's your performance overview. Keep pushing towards your targets!
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 mb-6">
        <StatCard
          title="Total Projects"
          value={fmt(projectsCount)}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-blue-600 to-blue-800"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(actuals.grossProfit || 0)}
          icon={Activity}
          gradient={`bg-gradient-to-br ${(actuals.grossProfit || 0) < 0 ? 'from-red-600 to-red-800' : 'from-violet-600 to-violet-800'}`}
        />
        <StatCard
          title="Target Achievement"
          value={`${targetAchievementPct.toFixed(1)}%`}
          icon={Target}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-800"
        />
        <StatCard
          title="Monthly Achieved"
          value={formatCurrency(monthlyTarget?.actual || 0)}
          icon={Banknote}
          gradient="bg-gradient-to-br from-amber-600 to-amber-800"
        />
        <StatCard
          title="Quarterly Achieved"
          value={formatCurrency(quarterlyTarget?.actual || 0)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
        />
      </div>

      {/* Target vs Actual Progress */}
      <Card className="shadow-sm border-slate-200 overflow-hidden bg-slate-50/30">
        <CardHeader className="bg-white border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2 uppercase tracking-wide">
            <Target className="h-5 w-5 text-indigo-600" />
            Target vs Target Achievement
          </CardTitle>
          <CardDescription>
            Your monthly and quarterly target progress
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {hasTargets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TargetPieChart
                label="Monthly Target Achievement"
                progressData={monthlyTarget}
                icon={Calendar}
              />
              <TargetPieChart
                label="Quarterly Target Achievement"
                progressData={quarterlyTarget}
                icon={TrendingUp}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-md bg-white">
              <Target className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">No targets set</p>
              <p className="text-xs mt-1">Ask your admin to set your monthly and quarterly targets.</p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Chart + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Monthly Performance Trend */}
        <Card className="lg:col-span-4 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-800">Monthly Performance</CardTitle>
            <CardDescription>Revenue & cost trends for your projects</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {monthlyTrend.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b' }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => [formatCurrency(value), name]}
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
                No trend data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Projects */}
        <Card className="lg:col-span-3 shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              My Projects
            </CardTitle>
            <CardDescription>{projectsCount} project{projectsCount !== 1 ? 's' : ''} assigned</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {projects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p: any) => {
                    const f = p.financials || {};
                    return (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">
                          <Link to={`/projects/${p._id}`} className="text-blue-600 hover:underline">
                            {p.projectName || p.projectId}
                          </Link>
                          <p className="text-xs text-muted-foreground">{p.customerName || ''}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-900">
                          {(f.loggedHours || 0).toLocaleString()}h
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(f.totalCost || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground border border-dashed rounded-md bg-slate-50/50">
                No projects assigned
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ─── Main Dashboard Page ────────────────────────────────────────
export function DashboardPage() {
  const { isAdmin, isSalesperson, user } = useAuth();

  const now = new Date();
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const params: any = { period, year };
        if (period === 'quarterly') params.quarter = quarter;
        if (period === 'monthly') params.month = month;

        let res: any;
        if (isSalesperson) {
          res = await fetchSalespersonDashboard(params);
        } else {
          res = await fetchAdminDashboard(params);
        }

        // Handle both { data: { ... } } and direct { ... } shapes
        setDashboardData(res?.data || res);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast.error('Failed to load dashboard data');
        setDashboardData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [period, year, quarter, month, isAdmin, isSalesperson]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const periodLabel =
    period === 'monthly'
      ? new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })
      : period === 'quarterly'
        ? `Q${quarter} ${year}`
        : String(year);

  return (
    <div className="space-y-6">
      {/* Page Header + Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Dashboard</h2>
          <p className="text-muted-foreground">
            {isSalesperson ? (
              'Your performance overview'
            ) : (
              <>
                Company-wide operations overview {' — '}
                <span className="font-medium text-slate-700">{periodLabel}</span>
              </>
            )}
          </p>
        </div>
        {!isSalesperson && (
          <PeriodFilter
            period={period}
            year={year}
            quarter={quarter}
            month={month}
            onPeriodChange={setPeriod}
            onYearChange={setYear}
            onQuarterChange={setQuarter}
            onMonthChange={setMonth}
          />
        )}
      </div>

      {/* Role-based content */}
      {isSalesperson ? (
        <SalespersonDashboard data={dashboardData} />
      ) : (
        <AdminDashboard data={dashboardData} />
      )}
    </div>
  );
}
