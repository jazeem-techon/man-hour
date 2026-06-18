import { useState, useEffect } from 'react';
import { getManHoursFormData, ManHoursFormData } from '../api/getFormData';
import { ManHoursForm } from '../components/ManHoursForm';
import { ActivityHoursForm } from '../components/ActivityHoursForm';
import { Loader2 } from 'lucide-react';


export function ManHoursPage() {
  const [data, setData] = useState<ManHoursFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'project' | 'activity'>('project');

  useEffect(() => {
    async function loadData() {
      try {
        const formData = await getManHoursFormData();
        setData(formData);
      } catch (err) {
        setError('Failed to load form data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-900">Log Man-Hours</h2>
          <p className="text-muted-foreground">Record daily hours for your active projects or activities.</p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setFormType('project')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${formType === 'project' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Project
          </button>
          <button
            onClick={() => setFormType('activity')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${formType === 'activity' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Activity
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12 text-blue-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-lg font-medium">Loading form data...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {!isLoading && !error && data && (
        formType === 'project' ? (
          <ManHoursForm projects={data.projects} employees={data.employees} />
        ) : (
          <ActivityHoursForm activities={data.activities} employees={data.employees} onActivityCreated={async () => {
            setIsLoading(true);
            try {
              const formData = await getManHoursFormData();
              setData(formData);
            } finally {
              setIsLoading(false);
            }
          }} />
        )
      )}
    </div>
  );
}
