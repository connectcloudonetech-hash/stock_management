
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Plus,
  Minus,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Tags,
  ChevronRight,
  Clock,
  ArrowRight,
  ChevronDown,
  Calendar,
  Layers,
  Zap,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { stockService } from '../lib/services/stockService';
import { StockMovement, MovementType, Customer } from '../types';
import { DashboardSkeleton } from '../components/Skeleton';

type CategoryPeriod = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
type CategoryTypeFilter = 'BOTH' | MovementType.IN | MovementType.OUT;

export const Dashboard: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [categoryPeriod, setCategoryPeriod] = useState<CategoryPeriod>('ALL');
  const [categoryType, setCategoryType] = useState<CategoryTypeFilter>('BOTH');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 800));
      const [m, c] = await Promise.all([
        stockService.getMovements(),
        stockService.getCustomers()
      ]);
      const sortedMovements = [...m].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(sortedMovements);
      setCustomers(c);
      setLoading(false);
    };
    fetchData();
  }, []);

  const categories = stockService.getCategories();

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const custName = customers.find(c => c.id === m.customer_id)?.name.toLowerCase() || '';
      const matchesSearch = m.category.toLowerCase().includes(filterQuery.toLowerCase()) || custName.includes(filterQuery.toLowerCase());
      const matchesCategory = selectedCategory ? m.category === selectedCategory : true;
      
      const now = new Date();
      const mDate = new Date(m.date);
      let matchesPeriod = true;
      
      if (selectedPeriod === 'TODAY') matchesPeriod = mDate.toDateString() === now.toDateString();
      else if (selectedPeriod === 'MONTH') matchesPeriod = mDate.getMonth() === now.getMonth() && mDate.getFullYear() === now.getFullYear();

      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [movements, filterQuery, selectedCategory, selectedPeriod, customers]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Calculate category balances based on the specific categoryPeriod and categoryType selections
    const balances: Record<string, number> = {};
    categories.forEach(cat => balances[cat] = 0);

    movements.forEach(m => {
      const mDate = new Date(m.date);
      let matchesPeriod = true;

      // Period Filtering
      if (categoryPeriod === 'TODAY') {
        matchesPeriod = mDate.toDateString() === todayStr;
      } else if (categoryPeriod === 'WEEK') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        matchesPeriod = mDate >= startOfWeek;
      } else if (categoryPeriod === 'MONTH') {
        matchesPeriod = mDate.getMonth() === now.getMonth() && mDate.getFullYear() === now.getFullYear();
      } else if (categoryPeriod === 'YEAR') {
        matchesPeriod = mDate.getFullYear() === now.getFullYear();
      }

      // Type Filtering & Logic
      if (matchesPeriod) {
        if (categoryType === 'BOTH') {
          // Standard Net Balance
          if (m.type === MovementType.IN) {
            balances[m.category] = (balances[m.category] || 0) + m.nos;
          } else {
            balances[m.category] = (balances[m.category] || 0) - m.nos;
          }
        } else if (categoryType === m.type) {
          // Gross sum for only IN or only OUT
          balances[m.category] = (balances[m.category] || 0) + m.nos;
        }
      }
    });

    const todayIn = movements.filter(m => new Date(m.date).toDateString() === todayStr && m.type === MovementType.IN).reduce((sum, m) => sum + m.nos, 0);
    const todayOut = movements.filter(m => new Date(m.date).toDateString() === todayStr && m.type === MovementType.OUT).reduce((sum, m) => sum + m.nos, 0);

    return {
      today: {
        in: todayIn,
        out: todayOut,
        net: todayIn - todayOut
      },
      balances
    };
  }, [movements, categoryPeriod, categoryType, categories]);

  if (loading) return <DashboardSkeleton />;

  const pinnedCategories = categories.filter(c => c !== 'OTHERS');

  return (
    <div className="space-y-10 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">CARRYING IN/OUT</h1>
          <p className="text-slate-800 font-bold">SR INFOTECH Stock Maintenance Center</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/carry-in" className="flex items-center space-x-2 px-6 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition shadow-xl shadow-red-200 active:scale-95 uppercase text-xs tracking-widest">
            <Plus size={18} />
            <span>Carry IN</span>
          </Link>
          <Link to="/carry-out" className="flex items-center space-x-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition shadow-xl shadow-slate-200 active:scale-95 uppercase text-xs tracking-widest">
            <Minus size={18} />
            <span>Carry OUT</span>
          </Link>
        </div>
      </header>

      {/* Main Stats Cards - Enhanced Today Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="flex items-center space-x-3 mb-4 relative z-10">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                 <ArrowDownCircle size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Today's Inward</span>
           </div>
           <p className="text-4xl font-black text-emerald-600 relative z-10">{stats.today.in}</p>
           <p className="text-[10px] font-bold text-emerald-800 uppercase mt-1">Pieces Received</p>
        </div>

        <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="flex items-center space-x-3 mb-4 relative z-10">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                 <ArrowUpCircle size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Today's Outward</span>
           </div>
           <p className="text-4xl font-black text-rose-600 relative z-10">{stats.today.out}</p>
           <p className="text-[10px] font-bold text-rose-800 uppercase mt-1">Pieces Released</p>
        </div>

        <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
           <div className="flex items-center space-x-3 mb-4 relative z-10">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                 <Activity size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Net Flow Balance</span>
           </div>
           <p className={`text-4xl font-black relative z-10 ${stats.today.net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
             {stats.today.net > 0 ? '+' : ''}{stats.today.net}
           </p>
           <p className="text-[10px] font-bold text-slate-800 uppercase mt-1">Stock Delta Today</p>
        </div>
      </section>

      {/* Category Balances Summary */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
           <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center">
              <Tags size={14} className="mr-2" /> Stock by Category
           </h2>
           
           <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Type Filter */}
              <div className="relative inline-block w-full sm:w-auto">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <select 
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value as CategoryTypeFilter)}
                  className="w-full sm:w-48 pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer shadow-sm"
                >
                  <option value="BOTH">Net Balance</option>
                  <option value={MovementType.IN}>Carry IN Only</option>
                  <option value={MovementType.OUT}>Carry OUT Only</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
              </div>

              {/* Period Filter */}
              <div className="relative inline-block w-full sm:w-auto">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={14} />
                <select 
                  value={categoryPeriod}
                  onChange={(e) => setCategoryPeriod(e.target.value as CategoryPeriod)}
                  className="w-full sm:w-48 pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">This Week</option>
                  <option value="MONTH">This Month</option>
                  <option value="YEAR">This Year</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {pinnedCategories.map(cat => {
            const balance = stats.balances[cat] || 0;
            const isNegative = balance < 0;
            const isNeutral = balance === 0;
            
            return (
              <div key={cat} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center hover:border-red-200 transition-all hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-black text-slate-700 uppercase mb-1 truncate tracking-tighter">{cat}</p>
                <p className={`text-xl font-black ${
                  categoryType === MovementType.IN ? 'text-emerald-600' :
                  categoryType === MovementType.OUT ? 'text-rose-600' :
                  isNegative ? 'text-rose-600' : isNeutral ? 'text-slate-400' : 'text-slate-900'
                }`}>
                  {categoryType === 'BOTH' 
                    ? (balance > 0 ? `+${balance}` : balance)
                    : balance
                  }
                </p>
                {(categoryPeriod !== 'ALL' || categoryType !== 'BOTH') && (
                   <div className={`mt-1 h-1 w-8 mx-auto rounded-full opacity-60 ${
                     categoryType === MovementType.IN ? 'bg-emerald-200' :
                     categoryType === MovementType.OUT ? 'bg-rose-200' :
                     'bg-red-200'
                   }`}></div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent History Section */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent History</h2>
              <p className="text-xs text-slate-800 font-bold uppercase tracking-widest">Latest transaction logs</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-red-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="QUICK SEARCH..." 
                value={filterQuery} 
                onChange={(e) => setFilterQuery(e.target.value.toUpperCase())} 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-red-500/5 transition text-[11px] font-black uppercase tracking-wider text-slate-900" 
              />
            </div>
            <Link 
              to="/history" 
              className="flex items-center space-x-2 text-[11px] font-black text-red-600 uppercase tracking-widest hover:translate-x-1 transition-transform"
            >
              <span>View Full Audit</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-700 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-8 py-5">Item Category</th>
                <th className="px-8 py-5">Party / Customer</th>
                <th className="px-8 py-5">Movement</th>
                <th className="px-8 py-5 text-right">Nos</th>
                <th className="px-8 py-5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.slice(0, 8).map(m => {
                const c = customers.find(cust => cust.id === m.customer_id);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition cursor-default">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 text-sm uppercase">{m.category}</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-800 font-bold uppercase tracking-tight">
                      {c?.name || <span className="text-slate-500 italic">INTERNAL</span>}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        m.type === MovementType.IN 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {m.type === MovementType.IN ? <ArrowDownCircle size={10} className="mr-1.5" /> : <ArrowUpCircle size={10} className="mr-1.5" />}
                        {m.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-sm font-black text-slate-900">{m.nos}</span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-900">{new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase">{new Date(m.date).getFullYear()}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Clock size={64} className="text-slate-500 mb-4" />
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">No activity found in this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredMovements.length > 8 && (
          <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-center">
            <Link to="/history" className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-50 hover:text-red-600 transition shadow-sm">
              Explore More Transactions
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};
