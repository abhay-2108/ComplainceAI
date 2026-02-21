
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  // Simple mapping to get title from path
  const getTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/violations': return 'Violations List';
      case '/policies': return 'Policy Management';
      case '/reports': return 'Compliance Reports';
      case '/audit-logs': return 'Audit Logs';
      case '/settings': return 'System Settings';
      default: return 'Overview';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans selection:bg-primary/20">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 transition-all duration-300">
        <Navbar
          title={getTitle(location.pathname)}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

