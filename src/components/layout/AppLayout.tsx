import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-200',
          'md:ml-[var(--sidebar-width)]',
          collapsed && 'md:ml-[var(--sidebar-collapsed-width)]',
        )}
      >
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-[var(--color-border)] bg-white sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded text-[var(--color-text-secondary)] hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--color-primary)] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">ID</span>
            </div>
            <span className="font-bold text-[15px]">InfoDesk</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
