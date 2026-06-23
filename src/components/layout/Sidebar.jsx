import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  LineChart, Users, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',  path: '/',          icon: LayoutDashboard },
  { name: 'POS System', path: '/pos',        icon: ShoppingCart },
  { name: 'Inventory',  path: '/inventory',  icon: Package },
  { name: 'Orders',     path: '/orders',     icon: ClipboardList },
  { name: 'Analytics',  path: '/analytics',  icon: LineChart },
  { name: 'Employees',  path: '/employees',  icon: Users },
  { name: 'Settings',   path: '/settings',   icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('tkr_auth');
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Brand */}
      <div className="px-6 pt-7 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 p-1">
            <img src="/tkr.png" alt="TK Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Tahir Khan<span className="text-emerald-400">.</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Restaurant ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="px-3 text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-3">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen(false)}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex-shrink-0 transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-110'}`}>
                  <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-400' : ''}`} />
                </span>
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
            TK
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">Tahir Khan</p>
            <p className="text-[10px] text-slate-500">Owner</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 mt-1"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
