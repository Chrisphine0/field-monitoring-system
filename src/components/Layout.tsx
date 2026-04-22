import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Leaf, LayoutDashboard, Map as MapIcon, UserPlus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export function Layout({ children, user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#f1f5f2] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col fixed inset-y-0 shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2d5a27] rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/10">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-800 block leading-tight">SmartSeason</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">System Control</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              location.pathname === '/' 
                ? 'bg-[#2d5a27] text-white shadow-lg shadow-emerald-900/10' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <Link
            to="/fields"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              location.pathname === '/fields' 
                ? 'bg-[#2d5a27] text-white shadow-lg shadow-emerald-900/10' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            Field Registry
          </Link>

          {isAdmin && (
            <Link
              to="/agents"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                location.pathname === '/agents' 
                  ? 'bg-[#2d5a27] text-white shadow-lg shadow-emerald-900/10' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Agent Personnel
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'Coordinator' : 'Field Agent'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-500 font-bold hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Terminate Session
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
