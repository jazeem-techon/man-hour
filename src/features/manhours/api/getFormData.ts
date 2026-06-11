import { fetchFormData } from '@/api/manhourTrackerApi';
import { Project, Employee } from '@/types';

export interface ManHoursFormData {
  projects: Project[];
  employees: Employee[];
}

/**
 * Fetches active projects and employees from the dedicated /form-data endpoint.
 * This returns scoped data for the current user (filtered by role on the backend).
 */
export async function getManHoursFormData(): Promise<ManHoursFormData> {
  const res = await fetchFormData();

  const actualData = res?.data || res;
  
  const projectsData = Array.isArray(actualData?.projects) ? actualData.projects : [];
  const employeesData = Array.isArray(actualData?.employees) ? actualData.employees : [];

  return {
    projects: projectsData,
    employees: employeesData
  };
}
