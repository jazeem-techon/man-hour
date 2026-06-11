import { useState, useEffect } from 'react';
import { getManHoursFormData, ManHoursFormData } from '../api/getFormData';
import { ManHoursForm } from '../components/ManHoursForm';
import { Loader2 } from 'lucide-react';

export function ManHoursPage() {
  const [data, setData] = useState<ManHoursFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-blue-900">Log Man-Hours</h2>
        <p className="text-muted-foreground">Record daily hours for your active projects.</p>
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
        <ManHoursForm projects={data.projects} employees={data.employees} />
      )}
    </div>
  );
}
