import { Routes, Route, Navigate } from 'react-router';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ManHoursPage } from './pages/ManHoursPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SalespersonsPage } from './pages/SalespersonsPage';
import { LeavesPage } from './pages/LeavesPage';
import { ReportByEmployeePage } from './pages/ReportByEmployeePage';
import { ReportByProjectPage } from './pages/ReportByProjectPage';
import { Toaster } from 'sonner';
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<SidebarLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/manhours" element={<ManHoursPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/salespersons" element={<SalespersonsPage />} />
          <Route path="/salesperson" element={<Navigate to="/salespersons" replace />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/reports/by-employee" element={<ReportByEmployeePage />} />
          <Route path="/reports/by-project" element={<ReportByProjectPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}
