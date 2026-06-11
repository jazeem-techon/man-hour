import api from '@/lib/api';

// ─── Dashboard ───────────────────────────────────────────────────
export const fetchDashboardSummary = async (params?: any) => {
  const response = await api.get('/manhour-tracker/dashboard-summary', { params });
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
  projectId: string;
  employeeId: string;
  task: string;
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
