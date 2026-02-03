
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Expense, Category, Budget } from '../types';
import { getCategoryColor } from '../constants';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets }) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    budgetBar: true,
    trends: true,
    history: true
  });

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredExpenses = useMemo(() => {
    if (!startDate && !endDate) {
      // Default: current month
      return expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    return expenses.filter(e => {
      const d = new Date(e.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      // Set end time to the very end of the day for inclusive filtering
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  }, [expenses, currentMonth, currentYear, startDate, endDate]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  }, [budgets]);

  const currentBalance = useMemo(() => {
    return totalBudget - totalSpent;
  }, [totalBudget, totalSpent]);

  const categoryData = useMemo(() => {
    const categories = Array.from(new Set([...budgets.map(b => b.category), ...filteredExpenses.map(e => e.category)]));
    const data = categories.map(cat => {
      const spent = filteredExpenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: cat, value: spent };
    }).filter(d => d.value > 0);
    return data;
  }, [filteredExpenses, budgets]);

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const spent = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);
      data.push({ name: monthName, spent });
    }
    return data;
  }, [expenses]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const CardHeader = ({ title, section, isVisible }: { title: string, section: keyof typeof expandedSections, isVisible: boolean }) => (
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h3>
      <button 
        onClick={() => toggleSection(section)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isVisible ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6 pb-40 overflow-y-auto h-full no-scrollbar bg-gray-50/50">
      
      {/* Search / Filter Section */}
      <section className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/40 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filter History</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-tighter">From</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-tighter">To</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <button 
            onClick={clearFilters}
            className="mt-4 w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 active:scale-95 transition-all"
          >
            Clear Filters & Show Current Month
          </button>
        )}
      </section>

      {/* Visual Hero Summary Card */}
      <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                {(!startDate && !endDate) ? "Current Month's Spending" : "Range Spending"}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black">₹{totalSpent.toLocaleString('en-IN')}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${totalSpent > totalBudget ? 'bg-red-400/30' : 'bg-white/20'}`}>
                  {Math.round((totalSpent / (totalBudget || 1)) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Remaining Budget</span>
              <span className={`text-2xl font-black mt-1 ${currentBalance < 0 ? 'text-red-300' : 'text-white'}`}>
                ₹{Math.max(0, currentBalance).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                style={{ width: `${Math.min(100, (totalSpent / (totalBudget || 1)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider opacity-80">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white" />
                Selected Data: {filteredExpenses.length} entries
              </span>
              <span>Total Cap: ₹{totalBudget.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Breakdown Card */}
      <section className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
        <CardHeader title="Breakdown" section="categories" isVisible={expandedSections.categories} />
        {expandedSections.categories && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8}
                    dataKey="value" strokeWidth={0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {categoryData.map(cat => (
                <div key={cat.name} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100/50">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: getCategoryColor(cat.name) }} />
                  <span className="text-[11px] text-gray-700 font-extrabold truncate uppercase">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Trends Card */}
      <section className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
        <CardHeader title="Trends" section="trends" isVisible={expandedSections.trends} />
        {expandedSections.trends && (
          <div className="h-64 w-full animate-in slide-in-from-top-2 duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Line 
                  type="monotone" dataKey="spent" stroke="#4F46E5" strokeWidth={5} 
                  dot={{ r: 6, fill: '#4F46E5', strokeWidth: 3, stroke: '#fff' }} 
                  activeDot={{ r: 10 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* History Card */}
      <section className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
        <CardHeader title="Activity History" section="history" isVisible={expandedSections.history} />
        {expandedSections.history && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredExpenses.slice().reverse().map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-3xl border border-gray-100/50 transition-transform active:scale-95">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                    style={{ backgroundColor: getCategoryColor(expense.category) }}>
                    {expense.category[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-900 text-sm truncate">{expense.description}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <p className="font-black text-gray-900 text-base whitespace-nowrap">₹{expense.amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
            {filteredExpenses.length === 0 && (
              <div className="flex flex-col items-center py-10 gap-2">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-bold text-sm">No transactions in this period.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
