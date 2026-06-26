import { useState, useEffect } from 'react';
import { fetchManHourLogs } from '@/api/manhourTrackerApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function LogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

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

  const totalPages = Math.ceil(totalCount / limit) || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 text-blue-600">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm mt-6">
      <CardContent className="p-0">
        {/* Mobile View */}
        <div className="md:hidden p-4 space-y-4">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log._id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-900">{log.employeeId?.name || '-'}</div>
                    <div className="text-sm text-slate-500">{log.date ? format(new Date(log.date), 'dd MMM yyyy') : '-'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                      {log.hours} hrs
                    </Badge>
                    <span className="text-xs font-semibold text-slate-600">
                      {formatCurrency(log.hours * (log.employeeId?.cost || 0))}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-50 mt-1">
                  {log.projectId ? (
                    <div className="flex flex-col mb-1">
                      <span className="font-medium text-blue-700">{log.projectId.projectName}</span>
                      <span className="text-xs text-slate-500">{log.projectId.projectId}</span>
                    </div>
                  ) : log.activityId ? (
                    <div className="mb-1">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">
                        {log.activityId.name}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-slate-500">-</div>
                  )}
                  {log.task && (
                    <div className="text-sm text-slate-600 mt-1">
                      <span className="font-medium text-slate-500 text-xs uppercase tracking-wider mr-1">Task:</span>
                      {log.task}
                    </div>
                  )}
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
                <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                <TableHead className="font-semibold text-slate-700">Project / Activity</TableHead>
                <TableHead className="font-semibold text-slate-700">Task</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Hours</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log._id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">
                      {log.date ? format(new Date(log.date), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{log.employeeId?.name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      {log.projectId ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-700">{log.projectId.projectName}</span>
                          <span className="text-xs text-slate-500">{log.projectId.projectId}</span>
                        </div>
                      ) : log.activityId ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">
                          {log.activityId.name}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {log.task || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
                        {log.hours} hrs
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-600">
                      {formatCurrency(log.hours * (log.employeeId?.cost || 0))}
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
  );
}
