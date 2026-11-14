import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Lock, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Calendar, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchAdminDashboard, fetchSalespersonDashboard } from '@/api/manhourTrackerApi';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { StatStrip } from '@/components/shared/StatStrip';
import { DashboardCard } from '@/components/shared/DashboardCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';

const initials = (name?: string) => (name || 'U').substring(0, 2).toUpperCase();
const fmt = (v: number) => (v || 0).toLocaleString();
const triggerCls = 'h-8 text-[13px] shrink-0';

// ─── Period Filter ──────────────────────────────────────────────
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
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto md:overflow-visible">
      <Calendar className="hidden h-4 w-4 text-ink-muted sm:block" />
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className={`${triggerCls} w-[120px]`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="quarterly">Quarterly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className={`${triggerCls} w-[90px]`}>
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
          <SelectTrigger className={`${triggerCls} w-[80px]`}>
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
          <SelectTrigger className={`${triggerCls} w-[130px]`}>
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

// ─── Admin Notes (private notepad, stored in this browser) ─────
const NOTES_KEY = 'admin-notes';

function NotesCard() {
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(NOTES_KEY) || ''; } catch { return ''; }
  });
  const ref = useRef<HTMLTextAreaElement>(null);

  const update = (v: string) => {
    setValue(v);
    try { localStorage.setItem(NOTES_KEY, v); } catch { /* storage unavailable */ }
  };

  const wrap = (before: string, after = before) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    update(value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    });
  };

  const prefix = (text: string) => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    update(value.slice(0, lineStart) + text + value.slice(lineStart));
    requestAnimationFrame(() => el.focus());
  };

  const tools = [
    { icon: Bold, label: 'Bold', run: () => wrap('**') },
    { icon: Italic, label: 'Italic', run: () => wrap('_') },
    { icon: Underline, label: 'Underline', run: () => wrap('<u>', '</u>') },
    { icon: Strikethrough, label: 'Strikethrough', run: () => wrap('~~') },
    { icon: List, label: 'Bulleted list', run: () => prefix('- ') },
    { icon: ListOrdered, label: 'Numbered list', run: () => prefix('1. ') },
  ];

  return (
    <DashboardCard
      title="Admin Notes"
      actions={<Lock className="h-4 w-4 text-ink-muted" aria-label="Private" />}
      className="bg-surface"
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Write down anything here..."
        className="min-h-[180px] w-full flex-1 resize-none bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
      />
      <div className="flex items-center gap-1 pt-2 text-ink-muted">
        {tools.map(({ icon: Icon, label, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={run}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-gray-200/60 hover:text-ink"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}

// ─── Shared list/chart blocks ───────────────────────────────────
function TrendChart({ data, bars, emptyTitle }: {
  data: any[];
  bars: { key: string; name: string; fill: string }[];
  emptyTitle: string;
}) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} description="Data will appear here once hours are logged." />;
  }
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
          <Tooltip
            formatter={(value: any, name: any) => [formatCurrency(value), name]}
            cursor={{ fill: '#F3F4F6' }}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgb(0 0 0 / 0.05)', fontSize: 12 }}
          />
          {bars.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.fill} radius={[4, 4, 0, 0]} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectList({ projects, showSalesperson, emptyTitle }: { projects: any[]; showSalesperson?: boolean; emptyTitle: string }) {
  if (!projects.length) {
    return <EmptyState title={emptyTitle} description="Projects will appear here." />;
  }
  return (
    <ul className="divide-y divide-dashed divide-line">
      {projects.map((p: any) => {
        const f = p.financials || {};
        return (
          <li key={p._id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <Link to={`/projects/${p._id}`} className="block truncate text-sm font-medium text-ink hover:text-primary">
                {p.projectName || p.projectId}
              </Link>
              <p className="truncate text-xs text-ink-secondary">
                {showSalesperson ? p.salespersonName || 'Unassigned' : p.customerName || '—'}
                {' · '}{fmt(f.loggedHours)} hrs · {formatCurrency(f.totalCost || 0)}
              </p>
            </div>
            {p.status && <StatusBadge status={p.status} />}
          </li>
        );
      })}
    </ul>
  );
}

const sortByDate = (list: any[]) =>
  [...list].sort((a: any, b: any) => {
    const dateA = a.projectDate ? new Date(a.projectDate).getTime() : 0;
    const dateB = b.projectDate ? new Date(b.projectDate).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);

// ─── Target Pie Chart ───────────────────────────────────────────
function TargetPieChart({ label, progressData, icon: Icon }: {
  label: string;
  progressData: { target: number; actual: number; percentage: number; remaining: number; isAchieved: boolean } | null;
  icon?: any;
}) {
  if (!progressData) return null;

  const { target, actual, percentage, remaining } = progressData;
  const isNegative = actual < 0;

  const safePercentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
  const achievedPct = isNegative ? 0 : Math.min(Math.max(safePercentage, 0), 100);
  const pendingPct = Math.max(100 - achievedPct, 0);
  const isEmpty = achievedPct === 0 && pendingPct === 0;

  let achievedColor = '#1D4ED8';
  if (achievedPct < 50) achievedColor = '#ef4444';
  else if (achievedPct < 80) achievedColor = '#f59e0b';

  let pendingColor = '#F3F4F6';
  if (achievedPct === 0 && !isEmpty) pendingColor = '#ef4444';

  const data = isEmpty
    ? [{ name: 'No Data', value: 100, fill: '#F3F4F6' }]
    : [
      { name: 'Target Achieved', value: achievedPct, fill: achievedColor },
      { name: 'Target Pending', value: pendingPct, fill: pendingColor },
    ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.08 || isEmpty) return null;
    const radius = percent === 1 ? 0 : innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    return (
      <text x={x} y={y} fill="#111827" textAnchor="middle" dominantBaseline="central">
        <tspan x={x} dy="-0.2em" fontSize="22" fontWeight="600">{`${(percent * 100).toFixed(0)}%`}</tspan>
      </text>
    );
  };

  return (
    <DashboardCard
      title={<span className="flex items-center gap-2">{Icon && <Icon className="h-4 w-4 text-ink-secondary" />}{label}</span>}
      className="min-h-0"
    >
      <div className="relative h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={105} dataKey="value" stroke="#ffffff" strokeWidth={3}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {!isEmpty && (
              <Tooltip
                formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }}
              />
            )}
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value, entry: any) =>
                value === 'No Data'
                  ? <span className="ml-1 text-ink-muted">No Data Available</span>
                  : <span className="ml-1 text-ink-secondary">{value} <span className="font-semibold text-ink">({entry.payload.value.toFixed(0)}%)</span></span>
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 divide-x divide-dashed divide-line border-t border-dashed border-line pt-3 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Target</p>
          <p className="mt-1 text-[13px] font-medium text-ink">{formatCurrency(target || 0)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Actual</p>
          <p className={`mt-1 text-[13px] font-medium ${isNegative ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(actual || 0)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Remaining</p>
          <p className={`mt-1 text-[13px] font-medium ${remaining === 0 ? 'text-green-700' : 'text-amber-600'}`}>{formatCurrency(remaining || 0)}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────
function AdminDashboard({ data }: { data: any }) {
  const summary = data?.summary || {};
  const monthlyTrend = data?.monthlyTrend || [];
  const topEmployees = (data?.topEmployees || []).slice(0, 8);
  const projects = sortByDate(data?.projects || []);

  return (
    <>
      <StatStrip
        stats={[
          { label: 'Total Projects', value: fmt(summary.projectsCount) },
          { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue || 0) },
          { label: 'Total Cost', value: formatCurrency(summary.totalCost || 0) },
          { label: 'Man-Hour Cost', value: formatCurrency(summary.totalManHourCost || 0) },
          { label: 'Gross Profit', value: formatCurrency(summary.grossProfit || 0), tone: (summary.grossProfit || 0) < 0 ? 'negative' : 'default' },
          { label: 'Net Profit', value: formatCurrency(summary.netProfit || 0), tone: (summary.netProfit || 0) < 0 ? 'negative' : 'default' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="Monthly Cost Trend">
          <TrendChart
            data={monthlyTrend}
            bars={[{ key: 'manHourCost', name: 'Man-Hour Cost', fill: '#1D4ED8' }]}
            emptyTitle="No trend data yet"
          />
        </DashboardCard>

        <DashboardCard title="Top Employees">
          {topEmployees.length > 0 ? (
            <ul className="divide-y divide-dashed divide-line">
              {topEmployees.map((emp: any, idx: number) => (
                <li key={emp.employeeId || idx} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-ink-secondary">
                    {initials(emp.employeeName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{emp.employeeName || 'Unknown'}</p>
                    <p className="text-xs text-ink-secondary">{formatCurrency(emp.totalCost || 0)}</p>
                  </div>
                  <span className="text-sm text-ink">{fmt(emp.totalHours)} hrs</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No employee data yet" description="Logged hours by employee will appear here." />
          )}
        </DashboardCard>

        <DashboardCard title="Recent Projects">
          <ProjectList projects={projects} showSalesperson emptyTitle="No projects for this period" />
        </DashboardCard>

        <NotesCard />
      </div>
    </>
  );
}

// ─── Salesperson Dashboard ──────────────────────────────────────
function SalespersonDashboard({ data }: { data: any }) {
  const actuals = data?.actuals || {};
  const monthlyTarget = data?.monthlyTarget || null;
  let quarterlyTarget = data?.quarterlyTarget || null;

  if (monthlyTarget?.target && quarterlyTarget) {
    const adjustedTarget = monthlyTarget.target * 3;
    const adjustedPercentage = adjustedTarget > 0 ? (quarterlyTarget.actual / adjustedTarget) * 100 : 0;
    const adjustedRemaining = Math.max(0, adjustedTarget - quarterlyTarget.actual);
    quarterlyTarget = {
      ...quarterlyTarget,
      target: adjustedTarget,
      percentage: adjustedPercentage,
      remaining: adjustedRemaining,
      isAchieved: quarterlyTarget.actual >= adjustedTarget,
    };
  }
  const allProjects = data?.projects || [];
  const projectsCount = data?.projectsCount || allProjects.length;
  const projects = sortByDate(allProjects);
  const monthlyTrend = data?.monthlyTrend || [];
  const hasTargets = !!monthlyTarget || !!quarterlyTarget;
  const targetAchievementPct = Math.max(monthlyTarget?.percentage || 0, quarterlyTarget?.percentage || 0);

  return (
    <>
      <StatStrip
        stats={[
          { label: 'Total Projects', value: fmt(projectsCount) },
          { label: 'Total Revenue', value: formatCurrency(actuals.revenue || 0) },
          { label: 'Total Cost', value: formatCurrency(actuals.totalCost || 0) },
          { label: 'Gross Profit', value: formatCurrency(actuals.grossProfit || 0), tone: (actuals.grossProfit || 0) < 0 ? 'negative' : 'default' },
          { label: 'Net', value: formatCurrency(actuals.grossProfit || 0), tone: (actuals.grossProfit || 0) < 0 ? 'negative' : 'default' },
          { label: 'Target Achievement', value: `${targetAchievementPct.toFixed(1)}%` },
        ]}
      />

      {hasTargets ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TargetPieChart label="Monthly Target Achievement" progressData={monthlyTarget} icon={Calendar} />
          <TargetPieChart label="Quarterly Target Achievement" progressData={quarterlyTarget} icon={TrendingUp} />
        </div>
      ) : (
        <DashboardCard title="Targets" className="min-h-[260px]">
          <EmptyState title="No targets set" description="Ask your admin to set your monthly and quarterly targets." />
        </DashboardCard>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="Monthly Performance">
          <TrendChart
            data={monthlyTrend}
            bars={[
              { key: 'revenue', name: 'Revenue', fill: '#1D4ED8' },
              { key: 'cost', name: 'Cost', fill: '#93C5FD' },
            ]}
            emptyTitle="No trend data yet"
          />
        </DashboardCard>

        <DashboardCard title="My Projects" actions={<span className="text-xs text-ink-secondary">{projectsCount} assigned</span>}>
          <ProjectList projects={projects} emptyTitle="No projects assigned" />
        </DashboardCard>
      </div>
    </>
  );
}

// ─── Main Dashboard Page ────────────────────────────────────────
export function DashboardPage() {
  const { isAdmin, isSalesperson } = useAuth();

  const now = new Date();
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoTargets, setHasNoTargets] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setHasNoTargets(false);
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
      } catch (error: any) {
        console.error('Failed to load dashboard:', error);
        if (isSalesperson && error?.response?.status === 404) {
          setHasNoTargets(true);
        } else {
          toast.error('Failed to load dashboard data');
        }
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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
      </div>

      {hasNoTargets ? (
        <DashboardCard title="Targets" className="min-h-[360px]">
          <EmptyState title="No targets assigned" description="No targets assigned to you for this period. Please contact your company admin." />
        </DashboardCard>
      ) : isSalesperson ? (
        <SalespersonDashboard data={dashboardData} />
      ) : (
        <AdminDashboard data={dashboardData} />
      )}
    </div>
  );
}
