import { useLocation } from 'react-router-dom';
import { Bell, RefreshCw, Menu } from 'lucide-react';
import { useData } from '../../context/DataContext';

const routeTitles = {
  '/': 'Dashboard',
  '/pos': 'Point of Sale',
  '/inventory': 'Inventory Management',
  '/orders': 'Orders',
  '/analytics': 'Business Analytics',
  '/employees': 'Employee Management',
  '/settings': 'System Settings',
};

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

import { useState, useEffect } from 'react';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { fetchAll, loading } = useData();
  const title = routeTitles[location.pathname] || 'ERP System';

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {today} · <LiveClock />
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={fetchAll}
          disabled={loading}
          title="Refresh data from Google Sheets"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{loading ? 'Syncing…' : 'Sync'}</span>
        </button>

        <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}
