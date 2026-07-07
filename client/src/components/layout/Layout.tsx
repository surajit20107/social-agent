import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarCollapsed(false)}
        className="fixed top-3 left-3 z-30 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu size={20} />
      </button>

      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'
        }`}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}