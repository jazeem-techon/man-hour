import { NavLink, Outlet } from 'react-router';
import { LayoutDashboard, Clock, Briefcase, UserCircle, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/features/auth/hooks/useAuth';

type NavItem = {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manhours', label: 'Log Hours', icon: Clock, adminOnly: true },
  { to: '/projects', label: 'Projects', icon: Briefcase },
  { to: '/timesheet', label: 'Timesheet', icon: FileText },
  { to: '/salespersons', label: 'Salespersons', icon: UserCircle, adminOnly: true },
  // { to: '/leaves', label: 'Leaves', icon: CalendarIcon, adminOnly: true },
  { to: '/reports/by-salesperson', label: 'Report: By Salesperson', icon: FileText, adminOnly: true },
  { to: '/reports/by-employee', label: 'Report: By Employee', icon: FileText, adminOnly: true },
];

const NavLinks = ({ onClick }: { onClick?: () => void }) => {
  const { isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="flex flex-col space-y-1">
      {filteredNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200",
              isActive
                ? "bg-brand-primary text-white shadow-sm"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors")} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export function SidebarLayout() {
  const { logout, isAdmin } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col bg-[#061239] text-slate-300 md:flex shadow-xl z-10 border-r border-slate-200/10">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <h1 className="text-xl font-bold text-white flex items-center">
            <Clock className="mr-2 h-6 w-6 text-brand-primary" />
            ManHour Tracker
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <NavLinks />
        </div>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 group"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:hidden shadow-sm z-10">
          <div className="flex items-center">
            <Clock className="mr-2 h-6 w-6 text-brand-primary" />
            <span className="text-lg font-bold text-[#061239]">ManHour</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="text-slate-500 hover:text-slate-700">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </header>

        {/* Page Content */}
        {/* Add padding-bottom on mobile to account for the fixed bottom nav */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50">
          {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full px-1 transition-colors",
                  isActive ? "text-brand-primary" : "text-slate-500 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-5 w-5 mb-1", isActive ? "text-brand-primary" : "text-slate-500")} />
                  <span className="text-[10px] font-medium truncate w-full text-center">
                    {item.label.replace('Report: ', '')}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
}
