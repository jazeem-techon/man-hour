import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getManHoursFormData, ManHoursFormData } from '../api/getFormData';
import { ManHoursForm } from './ManHoursForm';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after hours are logged successfully (dialog is closed first). */
  onLogged?: () => void;
  /** Entries of one timesheet row; when set the dialog edits them. */
  editLogs?: any[];
};

export function LogHoursDialog({ open, onOpenChange, onLogged, editLogs }: Props) {
  const [data, setData] = useState<ManHoursFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getManHoursFormData());
    } catch {
      setError('Failed to load form data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch fresh data every time the modal opens (leave/busy state changes).
  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleSuccess = () => {
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-xl border-line bg-white">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">{editLogs ? 'Edit Hours' : 'Log Hours'}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {editLogs ? 'Change the details, add people, or untick people to remove their entry.' : 'Record daily hours against a project.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center p-12 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-3 text-sm font-medium">Loading form data...</span>
          </div>
        )}

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {!isLoading && !error && data && (
          <ManHoursForm projects={data.projects} employees={data.employees} onSuccess={handleSuccess} editLogs={editLogs} />
        )}
      </DialogContent>
    </Dialog>
  );
}
