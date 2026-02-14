
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Loader2,
  Building2,
  FileText,
  Download,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  FileSpreadsheet,
  File as FilePdf,
  History as HistoryIcon,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Package,
  Wallet,
  Zap,
  Trophy,
  Banknote
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Customer, StockMovement, MovementType } from '../types';
import { stockService } from '../lib/services/stockService';
import { TableSkeleton } from '../components/Skeleton';

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allMovements, setAllMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCustomerForReport, setSelectedCustomerForReport] = useState<Customer | null>(null);
  const [customerMovements, setCustomerMovements] = useState<StockMovement[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  // Handle reopening the modal if redirected back from CarryIn/Out
  useEffect(() => {
    if (!loading && customers.length > 0 && location.state?.reopenId) {
      const targetCustomer = customers.find(c => c.id === location.state.reopenId);
      if (targetCustomer) {
        handleViewReport(targetCustomer);
        // Clear the state so it doesn't reopen on every refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [loading, customers, location.state]);

  const fetchData = async () => {
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

  // Aggregate stats for the whole directory
  const directoryStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const activeToday = new Set(
      allMovements
        .filter(m => m.date === today && m.customer_id)
        .map(m => m.customer_id)
    ).size;

    return {
      totalPartners: customers.length,
      activeToday
    };
  }, [customers, allMovements]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ name: customer.name });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleViewReport = async (customer: Customer) => {
    setSelectedCustomerForReport(customer);
    setLoadingReport(true);
    const movements = await stockService.getMovementsByCustomerId(customer.id);
    setCustomerMovements(movements);
    setLoadingReport(false);
  };

  const customerStats = useMemo(() => {
    if (!customerMovements.length) return { in: 0, out: 0, net: 0, amount: 0 };
    const totalIn = customerMovements.filter(m => m.type === MovementType.IN).reduce((sum, m) => sum + m.nos, 0);
    const totalOut = customerMovements.filter(m => m.type === MovementType.OUT).reduce((sum, m) => sum + m.nos, 0);
    const totalAmount = customerMovements.reduce((sum, m) => sum + (m.amount || 0), 0);
    return {
      in: totalIn,
      out: totalOut,
      net: totalIn - totalOut,
      amount: totalAmount
    };
  }, [customerMovements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const finalName = formData.name.toUpperCase();

    try {
      if (editingCustomer) {
        // In a real app, this would be an API call to update the customer
        setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...c, name: finalName } : c));
      } else {
        await stockService.addCustomer(finalName);
      }
      
      // Refresh all directory data to sync global summaries and lists
      await fetchData();
      
      setIsSubmitting(false);
      setIsModalOpen(false);
      
      // Scroll to top to show the updated summary cards
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Failed to save customer:", error);
      setIsSubmitting(false);
    }
  };

  const handleQuickEntry = (type: MovementType) => {
    if (!selectedCustomerForReport) return;
    const path = type === MovementType.IN ? '/carry-in' : '/carry-out';
    navigate(path, { state: { customerId: selectedCustomerForReport.id } });
  };

  const handleEditMovement = (m: StockMovement) => {
    if (!selectedCustomerForReport) return;
    const path = m.type === MovementType.IN ? `/carry-in/${m.id}` : `/carry-out/${m.id}`;
    navigate(path, { state: { customerId: selectedCustomerForReport.id } });
  };

  const exportPdf = () => {
    if (!selectedCustomerForReport || customerMovements.length === 0) return;
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
      doc.text("CUSTOMER STATEMENT", pageWidth - 15, 22, { align: 'right' });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`CUSTOMER NAME:`, 15, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`${selectedCustomerForReport.name.toUpperCase()}`, 45, 45);
      
      doc.setFont("helvetica", "bold");
      doc.text(`STATEMENT DATE:`, 15, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleString().toUpperCase()}`, 45, 50);

      let y = 65;
      doc.setFillColor(241, 245, 249); 
      doc.rect(10, y - 5, pageWidth - 20, 10, 'F');
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      
      doc.text("DATE", 15, y);
      doc.text("PRODUCT", 40, y);
      doc.text("IN (+)", 115, y, { align: 'right' });
      doc.text("OUT (-)", 140, y, { align: 'right' });
      doc.text("WEIGHT", 165, y, { align: 'right' });
      doc.text("AMOUNT (INR)", pageWidth - 15, y, { align: 'right' });

      doc.setDrawColor(203, 213, 225);
      doc.line(10, y + 5, pageWidth - 10, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42); 
      y += 10;

      const categoryTotals: Record<string, { in: number, out: number }> = {};

      customerMovements.forEach((m) => {
        if (y > 275) {
          doc.addPage();
          y = 25;
          doc.setFillColor(241, 245, 249);
          doc.rect(10, y - 5, pageWidth - 20, 10, 'F');
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text("DATE", 15, y);
          doc.text("PRODUCT", 40, y);
          doc.text("IN (+)", 115, y, { align: 'right' });
          doc.text("OUT (-)", 140, y, { align: 'right' });
          doc.text("WEIGHT", 165, y, { align: 'right' });
          doc.text("AMOUNT (INR)", pageWidth - 15, y, { align: 'right' });
          y += 10;
        }

        const isIn = m.type === MovementType.IN;
        
        // Populate category summary data
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
        doc.text(m.category.toUpperCase().substring(0, 35), 40, y);

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
          doc.text(m.nos.toString(), 140, y, { align: 'right' });
        } else {
          doc.setTextColor(203, 213, 225);
          doc.text("-", 140, y, { align: 'right' });
        }

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.text(m.weight ? `${m.weight}` : "-", 165, y, { align: 'right' });
        doc.text((m.amount || 0).toLocaleString(), pageWidth - 15, y, { align: 'right' });

        doc.setDrawColor(241, 245, 249);
        doc.line(10, y + 4, pageWidth - 10, y + 4);
        y += 8;
      });

      // LEDGER TOTALS LINE
      y += 4;
      if (y > 280) { doc.addPage(); y = 20; }
      
      doc.setFillColor(30, 41, 59);
      doc.rect(10, y - 5, pageWidth - 20, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TOTALS", 15, y + 2);
      
      doc.text(customerStats.in.toString(), 115, y + 2, { align: 'right' });
      doc.text(customerStats.out.toString(), 140, y + 2, { align: 'right' });
      doc.text(customerStats.amount.toLocaleString(), pageWidth - 15, y + 2, { align: 'right' });

      doc.setFontSize(6);
      doc.text(`NET BALANCE: ${customerStats.net} PIECES`, 40, y + 2);

      // --- ADD CATEGORY SUMMARY AT BOTTOM ---
      y += 25;
      if (y > 230) { doc.addPage(); y = 25; }
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY BY CATEGORY", 15, y);
      y += 8;
      
      // Calculate height of the summary box
      const summaryRows = Object.keys(categoryTotals).length;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, pageWidth - 30, summaryRows * 7 + 10, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("CATEGORY", 20, y);
      doc.text("TOTAL IN", 100, y, { align: 'right' });
      doc.text("TOTAL OUT", 130, y, { align: 'right' });
      doc.text("NET BALANCE", pageWidth - 20, y, { align: 'right' });
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y - 2, pageWidth - 20, y - 2);

      Object.entries(categoryTotals).forEach(([cat, vals]) => {
        if (y > 280) {
          doc.addPage();
          y = 25;
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y - 4, pageWidth - 30, 20, 'F');
          y += 6;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(cat.toUpperCase(), 20, y);
        
        doc.setFont("helvetica", "normal");
        doc.text(vals.in.toString(), 100, y, { align: 'right' });
        doc.text(vals.out.toString(), 130, y, { align: 'right' });
        
        const net = vals.in - vals.out;
        doc.setFont("helvetica", "bold");
        // Color coding for net balance
        if (net > 0) doc.setTextColor(16, 185, 129); // Green
        else if (net < 0) doc.setTextColor(225, 29, 72); // Red
        else doc.setTextColor(30, 41, 59); // Default
        
        doc.text(net.toString(), pageWidth - 20, y, { align: 'right' });
        
        y += 7;
      });

      doc.save(`SR_STMT_${selectedCustomerForReport.name.toUpperCase().replace(/\s+/g, '_')}.pdf`);
      setIsExporting(null);
    }, 1000);
  };

  const exportExcel = () => {
    if (!selectedCustomerForReport) return;
    setIsExporting('excel');
    setTimeout(() => {
      const header = [
        ["SR INFOTECH - CUSTOMER STATEMENT"],
        ["Customer Name", selectedCustomerForReport.name.toUpperCase()],
        ["Report Date", new Date().toLocaleString()],
        [],
        ["DATE", "TYPE", "PRODUCT", "CARRY IN (NOS)", "CARRY OUT (NOS)", "WEIGHT (KG)", "AMOUNT (INR)", "VALUE / REMARKS"]
      ];
      const body = customerMovements.map(m => [
        m.date, 
        m.type, 
        m.category.toUpperCase(), 
        m.type === MovementType.IN ? m.nos : 0, 
        m.type === MovementType.OUT ? m.nos : 0, 
        m.weight || 0, 
        m.amount || 0,
        (m.remarks || '').toUpperCase()
      ]);
      const ws = XLSX.utils.aoa_to_sheet([...header, ...body]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(wb, `${selectedCustomerForReport.name.toUpperCase()}_Report.xlsx`);
      setIsExporting(null);
    }, 1000);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Customer Directory</h1>
          <p className="text-slate-500 font-medium">Manage corporate profiles and audit transaction history.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-xl shadow-red-100 active:scale-95 uppercase">
          <Plus size={18} />
          <span>New Customer</span>
        </button>
      </header>

      {/* Directory-Wide Summary Section */}
      {!loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center space-x-3 mb-4 relative z-10">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Partners</span>
            </div>
            <p className="text-3xl font-black text-slate-900 relative z-10">{directoryStats.totalPartners}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Registered Accounts</p>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center space-x-3 mb-4 relative z-10">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Zap size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Today</span>
            </div>
            <p className="text-3xl font-black text-emerald-600 relative z-10">{directoryStats.activeToday}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Movement recorded</p>
          </div>
        </section>
      )}

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="SEARCH CUSTOMERS..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition shadow-sm font-bold text-slate-900 uppercase" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-white h-32 rounded-[40px] border border-slate-100"></div>)
        ) : (
          filteredCustomers.map(c => (
            <div key={c.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-200 transition-all group flex items-start justify-between cursor-pointer" onClick={() => handleViewReport(c)}>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6">
                  <Building2 size={28} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">{c.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Audit profile</p>
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleOpenModal(c)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Edit2 size={16} /></button>
                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" onClick={() => setCustomers(customers.filter(cust => cust.id !== c.id))}><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCustomerForReport && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedCustomerForReport(null)}></div>
          <div className="relative bg-white w-full max-w-6xl max-h-[92vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            {/* Header */}
            <div className="p-10 bg-white border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-200">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomerForReport.name}</h2>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Movement Statement</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 mr-4 border-r pr-4 border-slate-100">
                  <button 
                    onClick={() => handleQuickEntry(MovementType.IN)}
                    className="flex items-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition shadow-lg shadow-emerald-50"
                  >
                    <PlusCircle size={14} />
                    <span>Quick IN</span>
                  </button>
                  <button 
                    onClick={() => handleQuickEntry(MovementType.OUT)}
                    className="flex items-center space-x-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-lg shadow-slate-100"
                  >
                    <MinusCircle size={14} />
                    <span>Quick OUT</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button 
                    onClick={exportPdf} 
                    disabled={!!isExporting}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-700 shadow-xl shadow-red-100 transition disabled:opacity-50"
                  >
                    {isExporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FilePdf size={14} />}
                    <span>PDF Statement</span>
                  </button>
                  <button 
                    onClick={exportExcel} 
                    disabled={!!isExporting}
                    className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition shadow-xl shadow-slate-200 disabled:opacity-50"
                  >
                    {isExporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                    <span>XLSX Log</span>
                  </button>
                  <button onClick={() => setSelectedCustomerForReport(null)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition ml-4"><X size={28} /></button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 space-y-8">
              {/* Summary Cards Section */}
              {!loadingReport && customerMovements.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <ArrowDownCircle size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbound</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">{customerStats.in}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total pieces received</p>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                        <ArrowUpCircle size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outbound</span>
                    </div>
                    <p className="text-2xl font-black text-rose-600">{customerStats.out}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total pieces released</p>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Package size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Balance</span>
                    </div>
                    <p className={`text-2xl font-black ${customerStats.net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {customerStats.net > 0 ? '+' : ''}{customerStats.net}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Current Stock Units</p>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              {loadingReport ? <TableSkeleton rows={10} /> : customerMovements.length > 0 ? (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-6">Date</th>
                        <th className="px-8 py-6 text-center">Type</th>
                        <th className="px-8 py-6">Product</th>
                        <th className="px-8 py-6 text-right">Pieces</th>
                        <th className="px-8 py-6 text-right">Amount (INR)</th>
                        <th className="px-8 py-6">Value / Remarks</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerMovements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition group">
                          <td className="px-8 py-5 text-sm text-slate-600 font-bold">{m.date}</td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${m.type === MovementType.IN ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {m.type === MovementType.IN ? "+" : "-"}{m.type}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase">{m.category}</td>
                          <td className="px-8 py-5 text-right text-sm font-black text-slate-900">{m.nos}</td>
                          <td className="px-8 py-5 text-right text-sm font-black text-slate-900">₹ {(m.amount || 0).toLocaleString()}</td>
                          <td className="px-8 py-5 text-xs text-slate-400 font-bold uppercase max-w-xs truncate">{m.remarks || '-'}</td>
                          <td className="px-8 py-5 text-right">
                            <button 
                              onClick={() => handleEditMovement(m)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-10">
                  <HistoryIcon size={96} className="mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.5em]">No activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-md rounded-40px shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingCustomer ? 'Edit' : 'New'} Customer</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase">Customer / Company Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 font-black text-slate-900 uppercase" 
                  placeholder="E.G. RELIANCE INDUSTRIES"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 flex items-center justify-center disabled:opacity-50 uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                  Confirm Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
