import { NavLink, Outlet } from 'react-router';
import { LayoutDashboard, Clock, Briefcase, UserCircle, Calendar as CalendarIcon, FileText, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
  { to: '/salespersons', label: 'Salespersons', icon: UserCircle, adminOnly: true },
  { to: '/leaves', label: 'Leaves', icon: CalendarIcon, adminOnly: true },
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
              "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-blue-700 text-white"
                : "text-blue-100 hover:bg-blue-800 hover:text-white"
            )
          }
        >
          <item.icon className="mr-3 h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
};

export function SidebarLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col bg-blue-900 text-blue-100 md:flex shadow-xl z-10">
        <div className="flex h-16 items-center border-b border-blue-800 px-6">
          <h1 className="text-xl font-bold text-white flex items-center">
            <Clock className="mr-2 h-6 w-6 text-blue-300" />
            ManHour Tracker
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <NavLinks />
        </div>
        <div className="border-t border-blue-800 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden shadow-sm z-10">
          <div className="flex items-center">
            <Clock className="mr-2 h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-blue-900">ManHour Tracker</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-blue-900">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col bg-blue-900 border-none text-blue-100">
              <div className="flex h-16 items-center border-b border-blue-800 px-6">
                <h1 className="text-xl font-bold text-white flex items-center">
                  <Clock className="mr-2 h-6 w-6 text-blue-300" />
                  Menu
                </h1>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3">
                <NavLinks onClick={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-blue-800 p-4 mt-auto">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
