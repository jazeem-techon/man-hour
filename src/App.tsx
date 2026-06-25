import { Routes, Route, Navigate } from 'react-router';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ManHoursPage } from './features/manhours/pages/ManHoursPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SalespersonsPage } from './pages/SalespersonsPage';
import { LeavesPage } from './pages/LeavesPage';
import { ReportByEmployeePage } from './pages/ReportByEmployeePage';
import { ReportByProjectPage } from './pages/ReportByProjectPage';
import { SalespersonReportPage } from './pages/SalespersonReportPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TimesheetPage } from './pages/TimesheetPage';
import { Toaster } from 'sonner';
import { useAuth } from './features/auth/hooks/useAuth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <>
      <Routes>
        {/* TODO: restore to /login once backend auth is working */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/manhours" element={<AdminRoute><ManHoursPage /></AdminRoute>} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/salesman/:salespersonId" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
          <Route path="/timesheet" element={<TimesheetPage />} />
          <Route path="/salespersons" element={<AdminRoute><SalespersonsPage /></AdminRoute>} />
          <Route path="/salesperson" element={<Navigate to="/salespersons" replace />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/reports/by-employee" element={<AdminRoute><ReportByEmployeePage /></AdminRoute>} />
          <Route path="/reports/by-salesperson" element={<SalespersonReportPage />} />
          <Route path="/reports/by-project" element={<ReportByProjectPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}
