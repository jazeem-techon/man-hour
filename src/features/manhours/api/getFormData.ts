import { fetchFormData, fetchActivities } from '@/api/manhourTrackerApi';
import { Project, Employee } from '@/types';

export interface Activity {
  _id: string;
  name: string;
}

export interface ManHoursFormData {
  projects: Project[];
  employees: Employee[];
  activities: Activity[];
}

/**
 * Fetches active projects and employees from the dedicated /form-data endpoint.
 * This returns scoped data for the current user (filtered by role on the backend).
 */
export async function getManHoursFormData(): Promise<ManHoursFormData> {
  const [res, activitiesRes] = await Promise.all([
    fetchFormData(),
    fetchActivities().catch(() => []) // Fallback to empty array if fails
  ]);

  const actualData = res?.data || res;
  
  const projectsData = Array.isArray(actualData?.projects) ? actualData.projects : [];
  const employeesData = Array.isArray(actualData?.employees) ? actualData.employees : [];
  const activitiesData = Array.isArray(activitiesRes?.data || activitiesRes) ? (activitiesRes?.data || activitiesRes) : [];

  return {
    projects: projectsData,
    employees: employeesData,
    activities: activitiesData
  };
}
