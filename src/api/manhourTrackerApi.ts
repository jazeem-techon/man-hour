import api from '@/lib/api';

// ─── Dashboard ───────────────────────────────────────────────────
export const fetchDashboardSummary = async (params?: any) => {
  const response = await api.get('/manhour-tracker/dashboard-summary', { params });
  return response.data;
};

// Admin dashboard with period filtering
export const fetchAdminDashboard = async (params?: {
  period?: string;
  year?: number;
  quarter?: number;
  month?: number;
}) => {
  const response = await api.get('/manhour-tracker/dashboard-summary', { params });
  return response.data;
};

// Salesperson dashboard — their own targets + project data
export const fetchSalespersonDashboard = async (params?: {
  period?: string;
  year?: number;
  quarter?: number;
  month?: number;
}) => {
  const response = await api.get('/manhour-tracker/salesperson/dashboard', { params });
  return response.data;
};

// ─── Salespeople & Targets ───────────────────────────────────────
export const fetchSalespeopleWithTargets = async (params?: any) => {
  const response = await api.get('/manhour-tracker/salespeople', { params });
  return response.data;
};

export const saveTarget = async (data: any) => {
  const response = await api.post('/manhour-tracker/targets', data);
  return response.data;
};

// ─── Projects ────────────────────────────────────────────────────
export const fetchManhourProjects = async (params?: any) => {
  const response = await api.get('/manhour-tracker/projects', { params });
  return response.data;
};

export const fetchProjectsBySalesperson = async (salespersonId: string, params?: any) => {
  const response = await api.get(`/manhour-tracker/projects/salesman/${salespersonId}`, { params });
  return response.data;
};

export const fetchProjectDetails = async (projectId: string) => {
  const response = await api.get(`/manhour-tracker/projects/${projectId}`);
  return response.data;
};

export const createProject = async (data: {
  projectName: string;
  customerId: string;
  salesPersonId: string;
  billingMethod: string;
  isActive: boolean;
}) => {
  const response = await api.post('/manhour-tracker/projects', data);
  return response.data;
};

// ─── Man-Hour Logging ────────────────────────────────────────────
export const submitManHourLog = async (data: {
  projectId?: string;
  activityId?: string;
  employeeId: string;
  task?: string;
  hours: number;
  date: string;
  note: string;
}) => {
  const response = await api.post('/manhour-tracker/log', data);
  return response.data;
};

export const fetchManHourLogs = async (params?: {
  projectId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  /** "only" = leave entries, "include" = timesheet + leave; omitted = timesheet entries without leave */
  leave?: "only" | "include";
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/manhour-tracker/log', { params });
  return response.data;
};

// ─── Form Data (Lightweight Dropdowns) ───────────────────────────
export const fetchFormData = async () => {
  const response = await api.get('/manhour-tracker/form-data');
  return response.data;
};

// ─── Employees ───────────────────────────────────────────────────
export const fetchEmployees = async () => {
  const response = await api.get('/manhour-tracker/employees');
  return response.data;
};

// ─── Customers (Tecbooks shared endpoint) ────────────────────────
export const fetchCustomers = async () => {
  const response = await api.get('/customer');
  return response.data;
};

// ─── Activities ──────────────────────────────────────────────────
export const fetchActivities = async () => {
  const response = await api.get('/manhour-tracker/activities');
  return response.data;
};

export const createActivity = async (data: { name: string }) => {
  const response = await api.post('/manhour-tracker/activities', data);
  return response.data;
};

export const fetchBusyEmployees = async (startDate: string, endDate?: string, leaveOnly = false) => {
  let url = `/manhour-tracker/busy-employees?startDate=${startDate}`;
  if (leaveOnly) {
    url += `&leave=only`;
  }
  if (endDate) {
    url += `&endDate=${endDate}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const updateManHourLog = async (
  logId: string,
  data: { hours?: number; date?: string; note?: string; task?: string; employeeId?: string; activityId?: string; projectId?: string },
) => {
  const response = await api.put(`/manhour-tracker/log/${logId}`, data);
  return response.data;
};

export const deleteManHourLog = async (logId: string) => {
  const response = await api.delete(`/manhour-tracker/log/${logId}`);
  return response.data;
};

export const fetchFrequentProjectEmployees = async (projectId: string, limit = 6) => {
  const response = await api.get(`/manhour-tracker/projects/${projectId}/frequent-employees`, { params: { limit } });
  return response.data as { employeeId: string; entries: number; hours: number; lastDate: string }[];
};

/** Man-hour-only name for a project. Stored separately; never changes the tecbooks project. Empty name clears it. */
export const saveProjectManhourName = async (projectId: string, name: string) => {
  const response = await api.put(`/manhour-tracker/projects/${projectId}/manhour-name`, { name });
  return response.data as { projectId: string; name: string };
};
