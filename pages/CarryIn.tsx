
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowDownCircle, Check, Loader2, User, FileText, Banknote, Plus, Tag, ChevronDown, Edit3 } from 'lucide-react';
import { stockService, CATEGORIES } from '../lib/services/stockService';
import { Customer } from '../types';

export const CarryIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    customer_id: '',
    nos: '',
    weight: '',
    amount: '',
    remarks: ''
  });

  const categories = stockService.getCategories();

  useEffect(() => {
    const loadData = async () => {
      const c = await stockService.getCustomers();
      setCustomers(c);

      if (id) {
        const movement = await stockService.getMovementById(id);
        if (movement) {
          const isPredefinedCategory = categories.includes(movement.category);
          setFormData({
            date: movement.date,
            category: isPredefinedCategory ? movement.category : 'OTHERS',
            customer_id: movement.customer_id || '',
            nos: movement.nos.toString(),
            weight: movement.weight?.toString() || '',
            amount: movement.amount?.toString() || '',
            remarks: movement.remarks || ''
          });
          if (!isPredefinedCategory) {
            setCustomCategory(movement.category);
          }
        }
      } else if (location.state?.customerId) {
        setFormData(prev => ({ ...prev, customer_id: location.state.customerId }));
      }
    };
    loadData();
  }, [id, categories, location.state]);

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const created = await stockService.addCustomer(newCustomerName.toUpperCase());
      setCustomers([...customers, created]);
      setFormData({ ...formData, customer_id: created.id });
      setNewCustomerName('');
      setIsAddingNewCustomer(false);
    } catch (err) {
      alert('Error adding customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = formData.category === 'OTHERS' ? customCategory : formData.category;
    if (!finalCategory) {
      alert("Please select or type a product name");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        date: formData.date,
        category: finalCategory.toUpperCase(),
        customer_id: formData.customer_id,
        nos: Number(formData.nos),
        weight: formData.weight ? Number(formData.weight) : undefined,
        amount: formData.amount ? Number(formData.amount) : undefined,
        remarks: formData.remarks.toUpperCase()
      };

      if (id) {
        await stockService.updateMovement(id, payload);
      } else {
        await stockService.carryIn(payload);
      }
      
      setShowSuccess(true);
      // If we came from a specific customer, go back to customers and tell it to reopen that customer
      const targetPath = location.state?.customerId ? '/customers' : '/dashboard';
      const targetState = location.state?.customerId ? { reopenId: location.state.customerId } : undefined;
      
      setTimeout(() => navigate(targetPath, { state: targetState, replace: true }), 1500);
    } catch (err) {
      alert('Failed to save movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-50">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{id ? 'Entry Updated!' : 'Carry IN Recorded!'}</h2>
        <p className="text-slate-500 font-medium">Inventory updated successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center space-x-3 text-slate-800">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
          <ArrowDownCircle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Edit Carry IN' : 'New Carry IN'}</h1>
          <p className="text-slate-500 font-medium text-sm">
            {id ? 'Modify the details of this incoming transaction.' : 'Record incoming transaction by product.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase">Date</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 transition text-slate-900 font-bold"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-slate-700 uppercase">Customer</label>
              {!id && (
                <button type="button" onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)} className="text-xs font-bold text-red-600 uppercase">
                  {isAddingNewCustomer ? 'Cancel' : 'Add My Self'}
                </button>
              )}
            </div>
            {isAddingNewCustomer ? (
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="NAME..." 
                  value={newCustomerName} 
                  onChange={(e) => setNewCustomerName(e.target.value.toUpperCase())} 
                  className="flex-1 px-4 py-4 bg-red-50 border border-red-200 rounded-2xl text-slate-900 font-bold uppercase" 
                />
                <button type="button" onClick={handleAddNewCustomer} className="px-4 py-4 bg-red-600 text-white rounded-2xl font-bold uppercase">Add</button>
              </div>
            ) : (
              <select required value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_1rem_center] bg-no-repeat uppercase">
                <option value="">CHOOSE CUSTOMER</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase">Product</label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 transition text-slate-900 font-bold appearance-none uppercase"
            >
              <option value="">SELECT PRODUCT</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={18} />
            </div>
          </div>
          
          {formData.category === 'OTHERS' && (
            <div className="relative mt-3 animate-in slide-in-from-top-2 duration-300">
              <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
              <input 
                required
                type="text" 
                placeholder="TYPE YOUR CUSTOM PRODUCT NAME..." 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-4 bg-red-50 border border-red-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition text-slate-900 font-bold uppercase"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase">No. of Pieces</label>
            <input type="number" required value={formData.nos} onChange={(e) => setFormData({...formData, nos: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase">Weight (kg)</label>
            <input type="number" step="any" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold" placeholder="0.00" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase">Carry IN Amount (INR)</label>
          <div className="relative">
            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="number" step="any" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold" placeholder="0.00" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase">Value / Remarks</label>
          <textarea 
            value={formData.remarks} 
            onChange={(e) => setFormData({...formData, remarks: e.target.value.toUpperCase()})} 
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium h-24 uppercase" 
            placeholder="NOTES..." 
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl flex items-center justify-center transition-all active:scale-[0.98] uppercase">
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
          {id ? 'Update Entry' : 'Confirm Carry IN'}
        </button>
      </form>
    </div>
  );
};
