
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Calendar, 
  Tag, 
  Building2,
  Loader2,
  FileText,
  ChevronDown,
  Clock,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  Info,
  CalendarDays,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  File as FilePdf,
  Activity,
  Banknote
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { stockService } from '../lib/services/stockService';
import { Customer, StockMovement, MovementType } from '../types';
import { ReportsSkeleton } from '../components/Skeleton';

type ReportTab = 'TODAY' | 'MONTHLY' | 'CUSTOMER' | 'CATEGORY' | 'TYPE' | 'CUSTOM';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('TODAY');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allMovements, setAllMovements] = useState<StockMovement[]>([]);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);

  // Filter Selection States
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedMovementType, setSelectedMovementType] = useState<MovementType>(MovementType.IN);
  const [dateRange, setDateRange] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const categories = stockService.getCategories().filter(c => c !== 'OTHERS');
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025", "2026"];

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const [c, m] = await Promise.all([
      stockService.getCustomers(),
      stockService.getMovements()
    ]);
    setCustomers(c);
    setAllMovements(m);
    setLoading(false);
  };

  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const mDate = new Date(m.date);
      const today = new Date();
      
      if (activeTab === 'TODAY') {
        return mDate.toDateString() === today.toDateString();
      }
      
      if (activeTab === 'MONTHLY') {
        const mYear = mDate.getFullYear().toString();
        const mMonthName = mDate.toLocaleString('default', { month: 'long' });
        return mYear === selectedYear && mMonthName === selectedMonth;
      }
      
      if (activeTab === 'CUSTOMER') {
        return selectedCustomerId ? m.customer_id === selectedCustomerId : true;
      }
      
      if (activeTab === 'CATEGORY') {
        return selectedCategoryId ? m.category === selectedCategoryId : true;
      }

      if (activeTab === 'TYPE') {
        return m.type === selectedMovementType;
      }
      
      if (activeTab === 'CUSTOM') {
        const startMatch = !dateRange.start || m.date >= dateRange.start;
        const endMatch = !dateRange.end || m.date <= dateRange.end;
        return startMatch && endMatch;
      }
      return true;
    });
  }, [allMovements, activeTab, selectedYear, selectedMonth, selectedCustomerId, selectedCategoryId, selectedMovementType, dateRange]);

  const stats = useMemo(() => {
    const totalIn = filteredMovements
      .filter(m => m.type === MovementType.IN)
      .reduce((sum, m) => sum + m.nos, 0);
    const totalOut = filteredMovements
      .filter(m => m.type === MovementType.OUT)
      .reduce((sum, m) => sum + m.nos, 0);
    const totalAmount = filteredMovements
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    
    return {
      totalIn,
      totalOut,
      netNos: totalIn - totalOut,
      totalAmount
    };
  }, [filteredMovements]);

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'INTERNAL';

  const handleExportPdf = () => {
    if (filteredMovements.length === 0) return;
    setIsExporting('pdf');
    
    setTimeout(() => {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFillColor(239, 68, 68); 
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SR INFOTECH", 15, 18);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("INVENTORY AUDIT SYSTEM", 15, 26);
      
      doc.setFontSize(14);
      doc.text("ACCOUNT STATEMENT", pageWidth - 15, 22, { align: 'right' });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`REPORT TYPE:`, 15, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`${activeTab.toUpperCase()}`, 45, 45);
      
      doc.setFont("helvetica", "bold");
      doc.text(`GENERATED:`, 15, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleString().toUpperCase()}`, 45, 50);

      let y = 65;
      doc.setFillColor(241, 245, 249); 
      doc.rect(10, y - 5, pageWidth - 20, 10, 'F');
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      
      doc.text("DATE", 15, y);
      doc.text("CUSTOMER", 38, y);
      doc.text("CATEGORY", 80, y);
      doc.text("IN (+)", 115, y, { align: 'right' });
      doc.text("OUT (-)", 135, y, { align: 'right' });
      doc.text("WEIGHT", 155, y, { align: 'right' });
      doc.text("AMOUNT (INR)", pageWidth - 15, y, { align: 'right' });

      doc.setDrawColor(203, 213, 225);
      doc.line(10, y + 5, pageWidth - 10, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42); 
      y += 10;

      const categoryTotals: Record<string, { in: number, out: number }> = {};

      filteredMovements.forEach((m) => {
        if (y > 275) {
          doc.addPage();
          y = 25;
          doc.setFillColor(241, 245, 249);
          doc.rect(10, y - 5, pageWidth - 20, 10, 'F');
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text("DATE", 15, y);
          doc.text("CUSTOMER", 38, y);
          doc.text("CATEGORY", 80, y);
          doc.text("IN (+)", 115, y, { align: 'right' });
          doc.text("OUT (-)", 135, y, { align: 'right' });
          doc.text("WEIGHT", 155, y, { align: 'right' });
          doc.text("AMOUNT (INR)", pageWidth - 15, y, { align: 'right' });
          y += 10;
        }

        const isIn = m.type === MovementType.IN;
        
        if (!categoryTotals[m.category]) {
          categoryTotals[m.category] = { in: 0, out: 0 };
        }
        if (isIn) {
          categoryTotals[m.category].in += m.nos;
        } else {
          categoryTotals[m.category].out += m.nos;
        }

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(m.date, 15, y);
        
        doc.setFont("helvetica", "bold");
        doc.text(getCustomerName(m.customer_id).toUpperCase().substring(0, 20), 38, y);
        
        doc.setFont("helvetica", "normal");
        doc.text(m.category.toUpperCase().substring(0, 20), 80, y);

        if (isIn) {
          doc.setTextColor(16, 185, 129);
          doc.setFont("helvetica", "bold");
          doc.text(m.nos.toString(), 115, y, { align: 'right' });
        } else {
          doc.setTextColor(203, 213, 225);
          doc.text("-", 115, y, { align: 'right' });
        }

        if (!isIn) {
          doc.setTextColor(225, 29, 72);
          doc.setFont("helvetica", "bold");
          doc.text(m.nos.toString(), 135, y, { align: 'right' });
        } else {
          doc.setTextColor(203, 213, 225);
          doc.text("-", 135, y, { align: 'right' });
        }

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.text(m.weight ? `${m.weight}` : "-", 155, y, { align: 'right' });
        doc.text((m.amount || 0).toLocaleString(), pageWidth - 15, y, { align: 'right' });

        doc.setDrawColor(241, 245, 249);
        doc.line(10, y + 4, pageWidth - 10, y + 4);
        y += 8;
      });

      y += 5;
      if (y > 270) { doc.addPage(); y = 25; }
      doc.setFillColor(30, 41, 59); 
      doc.rect(10, y - 5, pageWidth - 20, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("OVERALL TOTALS", 15, y + 2);
      doc.text(stats.totalIn.toString(), 115, y + 2, { align: 'right' });
      doc.text(stats.totalOut.toString(), 135, y + 2, { align: 'right' });
      doc.text(stats.totalAmount.toLocaleString(), pageWidth - 15, y + 2, { align: 'right' });
      
      y += 20;
      if (y > 240) { doc.addPage(); y = 25; }
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY BY CATEGORY", 15, y);
      y += 8;
      
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, pageWidth - 30, Object.keys(categoryTotals).length * 7 + 8, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("CATEGORY", 20, y);
      doc.text("TOTAL IN", 100, y, { align: 'right' });
      doc.text("TOTAL OUT", 130, y, { align: 'right' });
      doc.text("NET BALANCE", pageWidth - 20, y, { align: 'right' });
      y += 6;
      doc.line(20, y - 2, pageWidth - 20, y - 2);

      Object.entries(categoryTotals).forEach(([cat, vals]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(cat.toUpperCase(), 20, y);
        
        doc.setFont("helvetica", "normal");
        doc.text(vals.in.toString(), 100, y, { align: 'right' });
        doc.text(vals.out.toString(), 130, y, { align: 'right' });
        
        const net = vals.in - vals.out;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(net >= 0 ? 16 : 225, net >= 0 ? 185 : 29, net >= 0 ? 129 : 72);
        doc.text(net.toString(), pageWidth - 20, y, { align: 'right' });
        
        y += 7;
        if (y > 280) { doc.addPage(); y = 25; }
      });

      doc.save(`SR_STATEMENT_${activeTab}_${new Date().getTime()}.pdf`);
      setIsExporting(null);
    }, 1200);
  };

  const handleExportExcel = () => {
    if (filteredMovements.length === 0) return;
    setIsExporting('excel');

    setTimeout(() => {
      const data = filteredMovements.map(m => ({
        DATE: m.date,
        TYPE: m.type,
        CUSTOMER: getCustomerName(m.customer_id).toUpperCase(),
        CATEGORY: m.category.toUpperCase(),
        "IN (+)": m.type === MovementType.IN ? m.nos : 0,
        "OUT (-)": m.type === MovementType.OUT ? m.nos : 0,
        WEIGHT_KG: m.weight || 0,
        AMOUNT_INR: m.amount || 0,
        REMARKS: (m.remarks || '').toUpperCase()
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Statement");
      XLSX.writeFile(wb, `SR_REPORT_${activeTab}_${new Date().getTime()}.xlsx`);
      setIsExporting(null);
    }, 1000);
  };

  if (loading) return <ReportsSkeleton />;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.25em]">Financial Intelligence</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Statement Center</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-block">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={16} />
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as ReportTab)}
              className="pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer shadow-sm"
            >
              <option value="TODAY">Today's Activity</option>
              <option value="MONTHLY">Monthly Audit</option>
              <option value="CUSTOMER">Customer Ledger</option>
              <option value="CATEGORY">Category Breakdown</option>
              <option value="TYPE">Movement Type</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handleExportPdf}
              disabled={!!isExporting || filteredMovements.length === 0}
              className="flex items-center space-x-2 px-6 py-3.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition shadow-xl shadow-red-100 active:scale-95 disabled:opacity-50"
            >
              {isExporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FilePdf size={14} />}
              <span>PDF Statement</span>
            </button>
            <button 
              onClick={handleExportExcel}
              disabled={!!isExporting || filteredMovements.length === 0}
              className="flex items-center space-x-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
            >
              {isExporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              <span>Excel Log</span>
            </button>
          </div>
        </div>
      </header>

      {/* Configuration & Summary Dashboard */}
      <section className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center space-x-2">
                <Info className="text-red-500" size={18} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Report Configuration</h3>
             </div>
             <button onClick={load} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                <RefreshCw size={18} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {activeTab === 'TODAY' && (
              <div className="lg:col-span-3 flex items-center bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                <Clock className="text-emerald-500 mr-4" size={24} />
                <div>
                   <p className="text-sm font-black text-emerald-900 uppercase">Snapshot: Today</p>
                   <p className="text-xs text-emerald-600 font-bold uppercase">{new Date().toDateString()}</p>
                </div>
              </div>
            )}

            {activeTab === 'MONTHLY' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <CalendarDays size={12} className="mr-2" /> Select Year
                  </label>
                  <div className="relative group">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer uppercase">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Clock size={12} className="mr-2" /> Select Month
                  </label>
                  <div className="relative group">
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer uppercase">
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'TYPE' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Layers size={12} className="mr-2" /> Movement Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl">
                   <button 
                    onClick={() => setSelectedMovementType(MovementType.IN)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMovementType === MovementType.IN ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                   >
                      CARRY IN
                   </button>
                   <button 
                    onClick={() => setSelectedMovementType(MovementType.OUT)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMovementType === MovementType.OUT ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                   >
                      CARRY OUT
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'CATEGORY' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Tag size={12} className="mr-2" /> Stock Category
                </label>
                <div className="relative group">
                  <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer uppercase">
                    <option value="">ALL CATEGORIES</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                </div>
              </div>
            )}

            {activeTab === 'CUSTOMER' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Building2 size={12} className="mr-2" /> Target Partner
                </label>
                <div className="relative group">
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 appearance-none outline-none focus:ring-4 focus:ring-red-500/5 transition cursor-pointer uppercase">
                    <option value="">ALL CUSTOMERS</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                </div>
              </div>
            )}

            {activeTab === 'CUSTOM' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Calendar size={12} className="mr-2" /> Date From
                  </label>
                  <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-red-500/5 transition" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Calendar size={12} className="mr-2" /> Date To
                  </label>
                  <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-red-500/5 transition" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Executive Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700">
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><ArrowDownCircle size={64} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total IN (+)</p>
              <p className="text-3xl font-black text-emerald-600">{stats.totalIn} <span className="text-xs font-bold text-slate-400 uppercase">pcs</span></p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><ArrowUpCircle size={64} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total OUT (-)</p>
              <p className="text-3xl font-black text-rose-600">{stats.totalOut} <span className="text-xs font-bold text-slate-400 uppercase">pcs</span></p>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Activity size={64} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Flow Balance</p>
              <p className={`text-3xl font-black ${stats.netNos >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {stats.netNos > 0 ? '+' : ''}{stats.netNos} <span className="text-xs font-bold text-slate-400 uppercase">pcs</span>
              </p>
           </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Statement Ledger</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredMovements.length} matching records</p>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6">Customer / Party</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6 text-center bg-emerald-50/30 text-emerald-600 border-x border-slate-100">IN (+)</th>
                <th className="px-8 py-6 text-center bg-rose-50/30 text-rose-600 border-r border-slate-100">OUT (-)</th>
                <th className="px-8 py-6 text-right">Weight (KG)</th>
                <th className="px-8 py-6 text-right bg-slate-100/30 text-slate-900">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6 text-sm font-bold text-slate-500 whitespace-nowrap">{m.date}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-slate-900 uppercase max-w-[200px] truncate">
                      {getCustomerName(m.customer_id)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{m.category}</span>
                  </td>
                  <td className="px-8 py-6 text-center bg-emerald-50/10 border-x border-slate-50">
                    {m.type === MovementType.IN ? (
                      <span className="text-base font-black text-emerald-600">{m.nos}</span>
                    ) : (
                      <span className="text-slate-200 font-black">-</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center bg-rose-50/10 border-r border-slate-50">
                    {m.type === MovementType.OUT ? (
                      <span className="text-base font-black text-rose-600">{m.nos}</span>
                    ) : (
                      <span className="text-slate-200 font-black">-</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-slate-500">{m.weight || '-'}</td>
                  <td className="px-8 py-6 text-right bg-slate-50/10">
                    <span className="text-sm font-black text-slate-900">₹ {(m.amount || 0).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-40 text-center">
                    <div className="flex flex-col items-center opacity-10">
                       <FileText size={80} />
                       <p className="mt-6 text-sm font-black uppercase tracking-[0.4em]">No matching records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Summary Footer Widget (Mobile Optimized) */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl z-40 border border-slate-800">
         <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Transactional Quantity</span>
            <span className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-bold">{filteredMovements.length} Records</span>
         </div>
         <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Current Stock Delta</p>
            <p className={`text-2xl font-black ${stats.netNos >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.netNos > 0 ? '+' : ''}{stats.netNos} PIECES
            </p>
         </div>
      </div>
    </div>
  );
};
