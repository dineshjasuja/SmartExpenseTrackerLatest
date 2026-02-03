
import React, { useMemo, useState } from 'react';
import { Budget, Expense } from '../types';

interface SettingsProps {
  budgets: Budget[];
  expenses: Expense[];
  userName: string;
  onUpdateBudget: (category: string, limit: number) => void;
  onDeleteBudget: (category: string) => void;
  onLogout: () => void;
  onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  budgets, 
  expenses,
  userName,
  onUpdateBudget, 
  onDeleteBudget,
  onLogout,
  onClearData
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  }, [budgets]);

  const handleInputChange = (category: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onUpdateBudget(category, numValue);
    } else if (value === '') {
      onUpdateBudget(category, 0);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const limit = parseInt(newCategoryLimit, 10) || 0;
    onUpdateBudget(newCategoryName.trim(), limit);
    setNewCategoryName('');
    setNewCategoryLimit('');
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert("No transaction data to export.");
      return;
    }

    const headers = ['User', 'Date', 'Category', 'Amount (INR)', 'Description'];
    const rows = expenses.map(e => [
      `"${userName.replace(/"/g, '""')}"`,
      new Date(e.date).toLocaleDateString(),
      e.category,
      e.amount,
      `"${e.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smartspend-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 pb-32 space-y-8 overflow-y-auto h-full no-scrollbar bg-gray-50/50">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-gray-900">Settings</h2>
      </div>

      {/* Profile Card with Sign Out Icon */}
      <div className="bg-indigo-600 rounded-[2rem] p-8 shadow-xl shadow-indigo-200 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black border border-white/20 shadow-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Signed in as</span>
              <h3 className="text-xl font-extrabold truncate max-w-[150px]">{userName}</h3>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center transition-all active:scale-90 group"
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Monthly Budgets */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-indigo-900/5 border border-gray-100">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">Monthly Caps</h3>
            <div className="bg-indigo-600 px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200">
              <span className="text-xs font-black text-white uppercase tracking-widest">₹{totalBudget.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-400 leading-relaxed mt-2">Set spending targets per category.</p>
        </div>
        
        <div className="space-y-6">
          {budgets.map((budget) => (
            <div key={budget.category} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 group">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onDeleteBudget(budget.category)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                  title="Remove Category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <label className="text-base font-bold text-gray-700">{budget.category}</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-sm">₹</span>
                <input
                  type="number"
                  value={budget.limit === 0 ? '' : budget.limit}
                  onChange={(e) => handleInputChange(budget.category, e.target.value)}
                  className="w-28 pl-6 pr-3 py-3 text-right text-base font-black text-indigo-600 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="0"
                />
              </div>
            </div>
          ))}

          {/* Add New Category Form */}
          <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Add Custom Category</h4>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Category Name (e.g. Gym)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Cap (₹)"
                  value={newCategoryLimit}
                  onChange={(e) => setNewCategoryLimit(e.target.value)}
                  className="flex-1 px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-100 focus:bg-white outline-none transition-all"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account & Data Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-indigo-900/5 border border-gray-100 mb-10">
        <h3 className="text-xl font-black text-gray-900 mb-8">Account & Data</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-5">
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-600">Export Transactions</span>
              <span className="text-[10px] text-gray-400 font-black uppercase">Download CSV file</span>
            </div>
            <button 
              onClick={handleExportCSV}
              className="px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm transition-all active:scale-90"
            >
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
