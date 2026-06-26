import { useState, useEffect, useMemo } from 'react';
import { fetchManHourLogs } from '@/api/manhourTrackerApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GroupedLog {
  id: string;
  date: string;
  projectId?: { _id: string, projectName: string, projectId: string };
  activityId?: { _id: string, name: string };
  task: string;
  totalHours: number;
  totalCost: number;
  employees: any[];
}

export function LogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<GroupedLog | null>(null);
  const limit = 100;

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        const res = await fetchManHourLogs({ page, limit });
        setLogs(res.data || []);
        setTotalCount(res.total || 0);
      } catch (err) {
        console.error("Failed to load logs", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, [page]);

  const groupedLogs = useMemo(() => {
    const map = new Map<string, GroupedLog>();
    logs.forEach(log => {
      const pId = log.projectId?._id || '';
      const aId = log.activityId?._id || '';
      const key = `${log.date}-${pId}-${aId}-${log.task || ''}`;
      
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          date: log.date,
          projectId: log.projectId,
          activityId: log.activityId,
          task: log.task,
          totalHours: 0,
          totalCost: 0,
          employees: []
        });
      }
      const group = map.get(key)!;
      group.employees.push(log);
      group.totalHours += log.hours || 0;
      group.totalCost += (log.hours || 0) * (log.employeeId?.cost || 0);
    });
    return Array.from(map.values());
  }, [logs]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 text-blue-600">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm mt-6">
        <CardContent className="p-0">
          {/* Mobile View */}
          <div className="md:hidden p-4 space-y-4">
            {groupedLogs.length > 0 ? (
              groupedLogs.map((group) => (
                <div key={group.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-slate-500 font-medium">{group.date ? format(new Date(group.date), 'dd MMM yyyy') : '-'}</div>
                      <div className="mt-1">
                        {group.projectId ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-blue-700">{group.projectId.projectName}</span>
                            <span className="text-xs text-slate-500">{group.projectId.projectId}</span>
                          </div>
                        ) : group.activityId ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">
                            {group.activityId.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                        {group.totalHours} hrs
                      </Badge>
                      <span className="text-xs font-semibold text-slate-600">
                        {formatCurrency(group.totalCost)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50 mt-1 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                      {group.task && (
                        <>
                          <span className="font-medium text-slate-500 text-xs uppercase tracking-wider mr-1">Task:</span>
                          {group.task}
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGroup(group)} className="text-blue-600 h-8">
                      <Users className="w-4 h-4 mr-2" />
                      {group.employees.length} Employees
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No logs found.
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block rounded-md border-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Project / Activity</TableHead>
                  <TableHead className="font-semibold text-slate-700">Task</TableHead>
                  <TableHead className="font-semibold text-slate-700">Employees</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total Hours</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedLogs.length > 0 ? (
                  groupedLogs.map((group) => (
                    <TableRow key={group.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">
                        {group.date ? format(new Date(group.date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {group.projectId ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-blue-700">{group.projectId.projectName}</span>
                            <span className="text-xs text-slate-500">{group.projectId.projectId}</span>
                          </div>
                        ) : group.activityId ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">
                            {group.activityId.name}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {group.task || '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)} className="h-8">
                          <Users className="w-4 h-4 mr-2 text-slate-500" />
                          View ({group.employees.length})
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                          {group.totalHours} hrs
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-600">
                        {formatCurrency(group.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4 border-t border-slate-200">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium px-2">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Employees Logged
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedGroup && (
              <div className="mb-4 text-sm text-slate-600 flex flex-col gap-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                <p><strong>Date:</strong> {selectedGroup.date ? format(new Date(selectedGroup.date), 'dd MMM yyyy') : '-'}</p>
                <p><strong>Project/Activity:</strong> {selectedGroup.projectId?.projectName || selectedGroup.activityId?.name || '-'}</p>
                <p><strong>Task:</strong> {selectedGroup.task || '-'}</p>
              </div>
            )}
            
            <div className="max-h-[60vh] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup?.employees.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">{log.employeeId?.name || '-'}</TableCell>
                      <TableCell className="text-right">{log.hours} hrs</TableCell>
                      <TableCell className="text-right">{formatCurrency(log.hours * (log.employeeId?.cost || 0))}</TableCell>
                    </TableRow>
                  ))}
                  {selectedGroup?.employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-slate-500">No employees found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-end gap-6 border-t pt-4">
              <div className="text-right">
                <span className="text-sm text-slate-500 mr-2">Total Hours:</span>
                <span className="font-bold text-slate-700">{selectedGroup?.totalHours} hrs</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-slate-500 mr-2">Total Cost:</span>
                <span className="font-bold text-slate-700">{formatCurrency(selectedGroup?.totalCost || 0)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

