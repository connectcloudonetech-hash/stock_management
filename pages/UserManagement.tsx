
import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, User as UserIcon, Check, Lock, X } from 'lucide-react';
import { UserRole, UserProfile } from '../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([
    { id: '1', username: 'ADMIN', role: UserRole.ADMIN, full_name: 'ADMINISTRATOR' },
    { id: '2', username: 'MANAGER1', role: UserRole.MANAGER, full_name: 'STORE MANAGER' },
    { id: '3', username: 'STAFF1', role: UserRole.STAFF, full_name: 'FRONT DESK STAFF' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: UserRole.STAFF,
    full_name: '',
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const created: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username.toUpperCase(),
      full_name: newUser.full_name.toUpperCase(),
      role: newUser.role,
    };
    setUsers([...users, created]);
    setIsAdding(false);
    setNewUser({ username: '', password: '', role: UserRole.STAFF, full_name: '' });
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Staff Management</h1>
          <p className="text-slate-500 font-medium">Control access levels and manage team credentials.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100 active:scale-95 uppercase"
          >
            <UserPlus size={18} />
            <span>Add New User</span>
          </button>
        )}
      </header>

      {isAdding && (
        <div className="bg-white p-8 rounded-[32px] border border-blue-200 shadow-2xl shadow-blue-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Create New Profile</h2>
            <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    required
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value.toUpperCase()})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 placeholder-slate-400 uppercase"
                    placeholder="E.G. MOHAMMED AHMED"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Role</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 appearance-none uppercase"
                  >
                    <option value={UserRole.STAFF}>Staff User</option>
                    <option value={UserRole.MANAGER}>Store Manager</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Username</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">@</span>
                  <input 
                    required
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value.toUpperCase()})}
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 placeholder-slate-400 uppercase"
                    placeholder="USERNAME"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    required
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-900 placeholder-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex space-x-3">
              <button 
                type="submit" 
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-100 flex items-center justify-center uppercase tracking-widest text-xs"
              >
                <Check className="mr-2" size={18} />
                Confirm Account
              </button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-8 -mt-8 transition-colors group-hover:bg-blue-50"></div>
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                <UserIcon size={32} />
              </div>
              <div className="flex space-x-1">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                <button 
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  onClick={() => setUsers(users.filter(x => x.id !== u.id))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{u.full_name}</h3>
              <p className="text-xs text-slate-400 mb-6 font-black uppercase tracking-[0.2em]">@{u.username}</p>
              
              <div className={`
                inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest
                ${u.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700' : 
                  u.role === UserRole.MANAGER ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}
              `}>
                <Shield size={12} className="mr-2" />
                {u.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
