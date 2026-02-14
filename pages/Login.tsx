import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../App';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const LOGO_URL = "https://raw.githubusercontent.com/connectcloudonetech-hash/srinfotechaccounts/refs/heads/main/image/logo-512.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        login('admin', UserRole.ADMIN);
        navigate('/dashboard');
      } else if (username === 'staff' && password === 'staff') {
        login('staff', UserRole.STAFF);
        navigate('/dashboard');
      } else {
        setError('Invalid username or password. Please try admin/admin.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-100 via-slate-50 to-orange-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-200 mb-6 p-2 rotate-3 hover:rotate-0 transition-transform overflow-hidden">
            <img src={LOGO_URL} alt="SR INFOTECH Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SR INFOTECH</h1>
          <p className="text-slate-500 font-medium mt-1">Stock Maintenance System</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/50 animate-in fade-in zoom-in duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center space-x-3 animate-in shake">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-slate-600 font-medium">Remember me</span>
              </label>
              <button type="button" className="text-sm text-red-600 font-bold hover:underline">Forgot?</button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-xl shadow-red-200 flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center mt-10 text-slate-400 text-xs font-medium uppercase tracking-widest">
          SR INFOTECH &bull; DUBAI, UAE
        </p>
      </div>
    </div>
  );
};