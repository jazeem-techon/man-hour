import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { projects, employees, manHours, salespersons } from '@/data/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Briefcase, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DashboardPage() {
  const activeProjects = projects.filter(p => p.isActive);
  const activeEmployees = employees.filter(e => e.isActive);
  const employeesOnLeave = employees.filter(e => e.isActive && e.isOnLeave);
  const totalHours = manHours.reduce((sum, mh) => sum + mh.hours, 0);

  // Project Stats
  const projectStats = activeProjects.map(p => {
    const pManHours = manHours.filter(mh => mh.projectId === p._id);
    const sp = salespersons.find(s => s._id === p.salespersonId);
    return {
      ...p,
      salespersonName: sp?.name || 'Unknown',
      totalHours: pManHours.reduce((sum, mh) => sum + mh.hours, 0),
      employeeCount: new Set(pManHours.map(mh => mh.employeeId)).size
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  // Employee Stats
  const employeeStats = activeEmployees.map(e => {
    const eManHours = manHours.filter(mh => mh.employeeId === e._id);
    return {
      ...e,
      totalHours: eManHours.reduce((sum, mh) => sum + mh.hours, 0),
      projectCount: new Set(eManHours.map(mh => mh.projectId)).size
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  // Mock chart data for 6 months (Jan-Jun)
  const chartData = [
    { name: 'Jan', 'Abu Dhabi Metro': 12, 'ADNOC Digital': 5, 'Dubai Mall ELV': 0 },
    { name: 'Feb', 'Abu Dhabi Metro': 15, 'ADNOC Digital': 10, 'Dubai Mall ELV': 5 },
    { name: 'Mar', 'Abu Dhabi Metro': 20, 'ADNOC Digital': 12, 'Dubai Mall ELV': 8 },
    { name: 'Apr', 'Abu Dhabi Metro': 18, 'ADNOC Digital': 15, 'Dubai Mall ELV': 12 },
    { name: 'May', 'Abu Dhabi Metro': 22, 'ADNOC Digital': 20, 'Dubai Mall ELV': 18 },
    { name: 'Jun', 'Abu Dhabi Metro': 25, 'ADNOC Digital': 25.5, 'Dubai Mall ELV': 24 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your man-hour tracking operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees on Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeesOnLeave.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Hours per Project</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="Abu Dhabi Metro" stackId="a" fill="#1E3A8A" radius={[0, 0, 4, 4]} />
                <Bar dataKey="ADNOC Digital" stackId="a" fill="#2563EB" />
                <Bar dataKey="Dubai Mall ELV" stackId="a" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeStats.slice(0, 5).map((e) => (
                  <TableRow key={e._id}>
                    <TableCell className="font-medium">
                      {e.name}
                      {e.isOnLeave && <Badge variant="outline" className="ml-2">Leave</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.department}</TableCell>
                    <TableCell className="text-right font-semibold">{e.totalHours}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectStats.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.salespersonName}</TableCell>
                  <TableCell className="text-right font-semibold">{p.totalHours}h</TableCell>
                  <TableCell className="text-right">{p.employeeCount}</TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
