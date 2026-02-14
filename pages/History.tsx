
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History as HistoryIcon,
  FileSpreadsheet,
  File as FilePdf,
  Loader2,
  Edit2,
  ChevronDown,
  Building2,
  Package,
  Activity,
  Banknote
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { stockService } from '../lib/services/stockService';
import { StockMovement, MovementType, Customer } from '../types';
import { TableSkeleton } from '../components/Skeleton';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | MovementType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const categories = stockService.getCategories().filter(cat => cat !== 'OTHERS');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 600));
      const [m, c] = await Promise.all([
        stockService.getMovements(),
        stockService.getCustomers()
      ]);
      setMovements(m);
      setCustomers(c);
      setLoading(false);
    };
    load();
  }, []);

  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || id || '-';

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const searchMatch = m.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          getCustomerName(m.customer_id).toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = filterType === 'ALL' || m.type === filterType;
      const categoryMatch = selectedCategory === 'ALL' || m.category === selectedCategory;
      const customerMatch = selectedCustomerId === 'ALL' || m.customer_id === selectedCustomerId;

      return searchMatch && typeMatch && categoryMatch && customerMatch;
    });
  }, [movements, searchTerm, filterType, selectedCategory, selectedCustomerId, customers]);

  const stats = useMemo(() => {
    return filteredMovements.reduce((acc, m) => {
      if (m.type === MovementType.IN) {
        acc.in += m.nos;
      } else {
        acc.out += m.nos;
      }
      return acc;
    }, { in: 0, out: 0 });
  }, [filteredMovements]);

  const handleEdit = (m: StockMovement) => {
    const path = m.type === MovementType.IN ? `/carry-in/${m.id}` : `/carry-out/${m.id}`;
    navigate(path);
  };

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
      doc.text("STOCK STATEMENT", pageWidth - 15, 22, { align: 'right' });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`DATE GENERATED:`, 15, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleString().toUpperCase()}`, 45, 45);
      
      doc.setFont("helvetica", "bold");
      doc.text(`SCOPE:`, 15, 50);
      doc.setFont("helvetica", "normal");
      const customerFilterName = selectedCustomerId === 'ALL' ? 'ALL PARTIES' : getCustomerName(selectedCustomerId);
      doc.text(`${selectedCategory === 'ALL' ? 'ALL CATEGORIES' : selectedCategory} | ${customerFilterName}`, 45, 50);

      let y = 65;
      doc.setFillColor(241, 245, 249); 
      doc.rect(10, y - 5, pageWidth - 20, 10, 'F');
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      
      doc.text("DATE", 15, y);
      doc.text("CUSTOMER", 38, y);
      doc.text("CATEGORY", 85, y);
      doc.text("IN (+)", 115, y, { align: 'right' });
      doc.text("OUT (-)", 135, y, { align: 'right' });
      doc.text("WEIGHT", 155, y, { align: 'right' });
      doc.text("AMOUNT", 175, y, { align: 'right' });
      doc.text("REMARKS", pageWidth - 15, y, { align: 'right' });

      doc.setDrawColor(203, 213, 225);
      doc.line(10, y + 5, pageWidth - 10, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42); 
      y += 10;

      const catSummary: Record<string, { in: number, out: number }> = {};

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
          doc.text("CATEGORY", 85, y);
          doc.text("IN (+)", 115, y, { align: 'right' });
          doc.text("OUT (-)", 135, y, { align: 'right' });
          doc.text("WEIGHT", 155, y, { align: 'right' });
          doc.text("AMOUNT", 175, y, { align: 'right' });
          y += 10;
        }

        const isIn = m.type === MovementType.IN;
        
        // Aggregate for bottom summary
        if (!catSummary[m.category]) catSummary[m.category] = { in: 0, out: 0 };
        if (isIn) catSummary[m.category].in += m.nos;
        else catSummary[m.category].out += m.nos;

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(m.date, 15, y);
        
        doc.setFont("helvetica", "bold");
        doc.text(getCustomerName(m.customer_id).toUpperCase().substring(0, 20), 38, y);
        
        doc.setFont("helvetica", "normal");
        doc.text(m.category.toUpperCase().substring(0, 15), 85, y);

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
        doc.text((m.amount || 0).toString(), 175, y, { align: 'right' });
        doc.text((m.remarks || "-").toUpperCase().substring(0, 10), pageWidth - 15, y, { align: 'right' });

        doc.setDrawColor(241, 245, 249);
        doc.line(10, y + 4, pageWidth - 10, y + 4);
        y += 8;
      });

      y += 4;
      if (y > 280) { doc.addPage(); y = 20; }
      
      doc.setFillColor(30, 41, 59); 
      doc.rect(10, y - 5, pageWidth - 20, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("OVERALL TOTALS", 15, y + 2);
      
      doc.text(stats.in.toString(), 115, y + 2, { align: 'right' });
      doc.text(stats.out.toString(), 135, y + 2, { align: 'right' });

      doc.setFontSize(6);
      doc.text(`BALANCE: ${stats.in - stats.out} PIECES`, 38, y + 2);

      // --- Category Summary at the end ---
      y += 20;
      if (y > 230) { doc.addPage(); y = 25; }
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY BY CATEGORY", 15, y);
      y += 8;
      
      doc.setFillColor(248, 250, 252);
      doc.rect(10, y - 5, pageWidth - 20, (Object.keys(catSummary).length * 8) + 12, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("CATEGORY", 15, y);
      doc.text("TOTAL IN", 115, y, { align: 'right' });
      doc.text("TOTAL OUT", 135, y, { align: 'right' });
      doc.text("NET BALANCE", pageWidth - 15, y, { align: 'right' });
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y - 2, pageWidth - 15, y - 2);

      Object.entries(catSummary).forEach(([cat, vals]) => {
        if (y > 275) { doc.addPage(); y = 25; }
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(cat.toUpperCase(), 15, y);
        doc.setFont("helvetica", "normal");
        doc.text(vals.in.toString(), 115, y, { align: 'right' });
        doc.text(vals.out.toString(), 135, y, { align: 'right' });
        
        const net = vals.in - vals.out;
        if (net > 0) doc.setTextColor(16, 185, 129);
        else if (net < 0) doc.setTextColor(225, 29, 72);
        else doc.setTextColor(30, 41, 59);
        
        doc.setFont("helvetica", "bold");
        doc.text(net.toString(), pageWidth - 15, y, { align: 'right' });
        y += 8;
      });

      doc.save(`SR_HISTORY_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsExporting(null);
    }, 1000);
  };

  const handleExportExcel = () => {
    if (filteredMovements.length === 0) return;
    setIsExporting('excel');

    setTimeout(() => {
      const data = filteredMovements.map(m => ({
        DATE: m.date,
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
      XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
      XLSX.writeFile(wb, `SR_AUDIT_LOG_${new Date().getTime()}.xlsx`);
      setIsExporting(null);
    }, 800);
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Statement Ledger</h1>
          <p className="text-slate-500 font-medium">Quantified physical audit for stock movements.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportPdf}
            disabled={!!isExporting || filteredMovements.length === 0}
            className="flex items-center space-x-2 px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition disabled:opacity-50 active:scale-95 uppercase tracking-wider shadow-xl shadow-red-100"
          >
            {isExporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FilePdf size={16} />}
            <span>Download PDF</span>
          </button>
          <button 
            onClick={handleExportExcel}
            disabled={!!isExporting || filteredMovements.length === 0}
            className="flex items-center space-x-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition disabled:opacity-50 active:scale-95 uppercase tracking-wider shadow-xl shadow-slate-200"
          >
            {isExporting === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span>Export Excel</span>
          </button>
        </div>
      </header>

      {/* Audit Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="SEARCH BY PARTY OR PRODUCT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition shadow-sm uppercase font-bold text-slate-900"
          />
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full pl-10 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-red-500/10 appearance-none"
            >
              <option value="ALL">ALL PARTIES</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-red-500/10 appearance-none"
            >
              <option value="ALL">ALL CATEGORIES</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-10 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-red-500/10 appearance-none"
            >
              <option value="ALL">ALL MOVEMENTS</option>
              <option value={MovementType.IN}>INBOUND (+)</option>
              <option value={MovementType.OUT}>OUTBOUND (-)</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowDownCircle size={64} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quantity IN (+)</p>
          <p className="text-3xl font-black text-emerald-600">{stats.in} <span className="text-xs uppercase font-bold text-slate-400">pcs</span></p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowUpCircle size={64} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quantity OUT (-)</p>
          <p className="text-3xl font-black text-rose-600">{stats.out} <span className="text-xs uppercase font-bold text-slate-400">pcs</span></p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity size={64} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Flow Balance</p>
          <p className={`text-3xl font-black ${stats.in - stats.out >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {stats.in - stats.out > 0 ? '+' : ''}{stats.in - stats.out} <span className="text-xs uppercase font-bold text-slate-400">pcs</span>
          </p>
        </div>
      </div>

      {/* Accounting Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-8"><TableSkeleton rows={10} /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 whitespace-nowrap">Date</th>
                <th className="px-8 py-6 whitespace-nowrap">Customer / Party</th>
                <th className="px-8 py-6 whitespace-nowrap">Product Category</th>
                <th className="px-8 py-6 whitespace-nowrap text-center bg-emerald-50/30 text-emerald-600 border-x border-slate-100">IN (+)</th>
                <th className="px-8 py-6 whitespace-nowrap text-center bg-rose-50/30 text-rose-600 border-r border-slate-100">OUT (-)</th>
                <th className="px-8 py-6 whitespace-nowrap text-right">Weight (KG)</th>
                <th className="px-8 py-6 whitespace-nowrap text-right text-slate-900 bg-slate-100/30">Amount (INR)</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length > 0 ? filteredMovements.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-5">
                    <span className="text-sm text-slate-600 font-bold whitespace-nowrap">{m.date}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm text-slate-900 font-black uppercase whitespace-nowrap max-w-[200px] truncate">{getCustomerName(m.customer_id)}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">{m.category}</div>
                  </td>
                  <td className="px-8 py-5 text-center bg-emerald-50/10 border-x border-slate-50">
                    {m.type === MovementType.IN ? (
                      <span className="text-base font-black text-emerald-600">{m.nos}</span>
                    ) : (
                      <span className="text-slate-200 font-black">-</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center bg-rose-50/10 border-r border-slate-50">
                    {m.type === MovementType.OUT ? (
                      <span className="text-base font-black text-rose-600">{m.nos}</span>
                    ) : (
                      <span className="text-slate-200 font-black">-</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-sm text-slate-500 font-bold">{m.weight ? `${m.weight}` : "-"}</span>
                  </td>
                  <td className="px-8 py-5 text-right bg-slate-50/10">
                    <span className="text-sm font-black text-slate-900">₹ {(m.amount || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-8 py-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-10">
                      <HistoryIcon size={80} />
                      <p className="text-sm font-black uppercase tracking-[0.4em]">No Audit Records Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
