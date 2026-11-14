import { Outlet } from 'react-router';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function SidebarLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-app md:p-3 md:pl-0">
      {/* Desktop sidebar (same gray as app bg, no border) */}
      <aside className="hidden w-[230px] shrink-0 overflow-y-auto md:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[260px] border-none bg-app p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main panel */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-panel">
        <TopBar onOpenMenu={() => setMobileMenuOpen(true)} />
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
