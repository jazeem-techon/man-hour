import { TableSkeleton } from '@/components/shared/Skeletons';
import { useState, useEffect, useMemo } from 'react';
import { fetchManHourLogs } from '@/api/manhourTrackerApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteManHourLog } from '@/api/manhourTrackerApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EditLogDialog } from './EditLogDialog';
import { LogHoursDialog } from './LogHoursDialog';
import type { EditableLog } from './EditLogDialog';
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

export function LogsTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<GroupedLog | null>(null);
  const [editingLogs, setEditingLogs] = useState<EditableLog[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingGroup, setEditingGroup] = useState<any[] | null>(null);
  const [deletingLog, setDeletingLog] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingLog) return;
    setIsDeleting(true);
    try {
      await deleteManHourLog(deletingLog._id);
      toast.success('Entry deleted');
      setDeletingLog(null);
      setSelectedGroup(null);
      setReloadKey((k) => k + 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };
  const { isAdmin } = useAuth();
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
  }, [page, refreshKey, reloadKey]);

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
    return <TableSkeleton className="flex-1" />;
  }

  return (
    <>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-line">
        <div className="mx-4 flex shrink-0 items-center justify-between border-b border-dashed border-line py-3">
          <h3 className="text-[15px] font-semibold text-ink">Timesheet Entries</h3>
          <span className="text-xs text-ink-secondary">{totalCount} total</span>
        </div>
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
         {/* Scrollable area: header stays pinned, pagination sits below */}
         <div className="min-h-0 flex-1 overflow-auto">
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
          <table className="hidden w-full min-w-[820px] table-fixed text-[13px] md:table">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[220px]" />
              <col />
              <col className="w-[120px]" />
              <col className="w-[100px]" />
              <col className="w-[140px]" />
              {isAdmin && <col className="w-[90px]" />}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-ink-secondary [&>th]:px-4 [&>th]:py-3 [&>th]:shadow-[inset_0_-1px_0_#E5E7EB]">
                <th>Date</th>
                <th>Project / Activity</th>
                <th>Task</th>
                <th>Employees</th>
                <th className="text-right">Hours</th>
                <th className="text-right">Cost</th>
                {isAdmin && <th className="text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {groupedLogs.length > 0 ? (
                groupedLogs.map((group) => (
                  <tr key={group.id} className="transition-colors hover:bg-gray-50 [&>td]:px-4 [&>td]:py-3 [&>td]:align-middle">
                    <td className="whitespace-nowrap font-medium text-ink">
                      {group.date ? format(new Date(group.date), 'dd MMM yyyy') : '-'}
                    </td>
                    <td>
                      {group.projectId ? (
                        <div className="min-w-0">
                          <p className="truncate font-medium text-primary" title={group.projectId.projectName}>{group.projectId.projectName}</p>
                          <p className="truncate text-xs text-ink-secondary">{group.projectId.projectId}</p>
                        </div>
                      ) : group.activityId ? (
                        <span className="inline-flex max-w-full truncate rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          {group.activityId.name}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-ink-secondary">
                      <p className="line-clamp-2 break-words" title={group.task || undefined}>{group.task || '-'}</p>
                    </td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)} className="h-8 text-[13px]">
                        <Users className="mr-1.5 h-4 w-4 text-ink-secondary" />
                        View ({group.employees.length})
                      </Button>
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {group.totalHours} hrs
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right font-medium text-ink">
                      {formatCurrency(group.totalCost)}
                    </td>
                    {isAdmin && (
                      <td className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[13px] text-primary hover:bg-primary-tint hover:text-primary" onClick={() => (group.projectId ? setEditingGroup(group.employees) : setSelectedGroup(group))}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-ink-secondary">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
         </div>

          {/* Pagination Controls (pinned to bottom of card) */}
          <div className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-line bg-white px-4 py-3 sm:flex-row">
            <div className="text-[13px] text-ink-secondary">
              Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm" className="h-8 text-[13px]"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="px-2 text-[13px] text-ink-secondary">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm" className="h-8 text-[13px]"
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
              <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                <div className="flex flex-col gap-1">
                <p><strong>Date:</strong> {selectedGroup.date ? format(new Date(selectedGroup.date), 'dd MMM yyyy') : '-'}</p>
                <p><strong>Project/Activity:</strong> {selectedGroup.projectId?.projectName || selectedGroup.activityId?.name || '-'}</p>
                <p><strong>Task:</strong> {selectedGroup.task || '-'}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-1.5 text-[13px]"
                    onClick={() => {
                      const all = selectedGroup.employees;
                      setSelectedGroup(null);
                      setEditingLogs(all);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit all ({selectedGroup.employees.length})
                  </Button>
                )}
              </div>
            )}
            
            <div className="max-h-[60vh] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    {isAdmin && <TableHead className="w-44" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroup?.employees.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">{log.employeeId?.name || '-'}</TableCell>
                      <TableCell className="text-right">{log.hours} hrs</TableCell>
                      <TableCell className="text-right">{formatCurrency(log.hours * (log.employeeId?.cost || 0))}</TableCell>
                      {isAdmin && (
                        <TableCell className="whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-[13px] text-primary hover:bg-primary-tint hover:text-primary"
                            onClick={() => {
                              setSelectedGroup(null);
                              setEditingLogs([log]);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-[13px] text-logout hover:bg-orange-50 hover:text-logout"
                            onClick={() => {
                              setSelectedGroup(null);
                              setDeletingLog(log);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {selectedGroup?.employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-4 text-slate-500">No employees found.</TableCell>
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
      <AlertDialog open={!!deletingLog} onOpenChange={(o) => !o && !isDeleting && setDeletingLog(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingLog?.employeeId?.name} · {deletingLog?.hours} hrs on {deletingLog?.date ? format(new Date(deletingLog.date), 'dd MMM yyyy') : '-'}. This removes it from the timesheet and reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LogHoursDialog
        open={!!editingGroup}
        onOpenChange={(o) => !o && setEditingGroup(null)}
        editLogs={editingGroup ?? undefined}
        onLogged={() => setReloadKey((k) => k + 1)}
      />

      <EditLogDialog
        logs={editingLogs}
        onClose={() => setEditingLogs(null)}
        onSaved={() => {
          setEditingLogs(null);
          setSelectedGroup(null);
          setReloadKey((k) => k + 1);
        }}
      />
    </>
  );
}

