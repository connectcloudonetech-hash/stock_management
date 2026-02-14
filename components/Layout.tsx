
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  Users, 
  LogOut,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../App';
import { UserRole } from '../types';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const LOGO_URL = "https://raw.githubusercontent.com/connectcloudonetech-hash/srinfotechaccounts/refs/heads/main/image/logo-512.png";

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <ArrowDownCircle size={20} />, label: 'Carry IN', path: '/carry-in' },
    { icon: <ArrowUpCircle size={20} />, label: 'Carry OUT', path: '/carry-out' },
    { icon: <History size={20} />, label: 'History', path: '/history' },
    { icon: <FileText size={20} />, label: 'Reports', path: '/reports' },
    { icon: <Users size={20} />, label: 'Customers', path: '/customers' },
  ];

  if (user?.role === UserRole.ADMIN) {
    menuItems.push({ icon: <Users size={20} />, label: 'Admin Users', path: '/users' });
  }

  const NavItem: React.FC<{ item: typeof menuItems[0] }> = ({ item }) => (
    <NavLink
      to={item.path}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) => `
        flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
          : 'text-slate-600 hover:bg-slate-100'}
      `}
    >
      {item.icon}
      <span className="font-medium whitespace-nowrap">{item.label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="mb-10 flex items-center space-x-3">
          <div className="w-10 h-10 flex-shrink-0">
            <img src={LOGO_URL} alt="SR INFOTECH Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-800 leading-none">SR</span>
            <span className="font-bold text-lg text-slate-800 leading-none">INFOTECH</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map((item) => <NavItem key={item.path} item={item} />)}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 mb-6 px-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase overflow-hidden border-2 border-slate-100">
               <span className="text-slate-500">{user?.username.charAt(0)}</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-slate-800 truncate text-sm">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <img src={LOGO_URL} alt="SR INFOTECH Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-slate-900">SR INFOTECH</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <nav className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-white p-6 shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center space-x-2">
                 <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
                 <span className="font-bold text-xl text-slate-900">Menu</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {menuItems.map((item) => <NavItem key={item.path} item={item} />)}
            </div>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center space-x-3 px-4 py-4 rounded-xl text-rose-600 bg-rose-50 font-semibold"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 lg:p-10 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-3 px-4 z-40 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {menuItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `flex flex-col items-center space-y-1 ${isActive ? 'text-red-600' : 'text-slate-500'}`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
