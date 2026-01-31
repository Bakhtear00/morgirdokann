
import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
// সার্ভিস থেকে টাইপ ইম্পোর্ট করা হলো যাতে ক্রস না আসে
import type { Purchase, Sale, Expense } from '../services/dataService';

interface ReportModuleProps {
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
}

const ReportModule: React.FC<ReportModuleProps> = ({ purchases = [], sales = [], expenses = [] }) => {
  const [filter, setFilter] = useState('all');

  const filterItems = (items: any[]) => {
    if (!items) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return items.filter(item => {
      const d = new Date(item.created_at || item.date).getTime();
      if (filter === 'today') return d >= today;
      return true;
    });
  };

  const p = filterItems(purchases);
  const s = filterItems(sales);
  const e = filterItems(expenses);

  const buy = p.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const sell = s.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const exp = e.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const profit = sell - buy - exp;

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* হেডার কার্ড */}
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
        <h2 className="text-xl font-black flex items-center gap-2 text-gray-800">
          <BarChart3 className="text-emerald-600 w-6 h-6"/> লাভ-ক্ষতি রিপোর্ট
        </h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="bg-emerald-50 text-emerald-700 p-2 px-4 rounded-2xl text-sm font-bold border-none outline-none ring-2 ring-emerald-100"
        >
          <option value="all">সব সময়</option>
          <option value="today">আজকের হিসাব</option>
        </select>
      </div>

      {/* মেইন রিপোর্ট কার্ডস */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-gray-400 text-xs font-black uppercase mb-2 tracking-widest">মোট কেনা</p>
          <p className="text-4xl font-black text-gray-800">৳{buy.toLocaleString('bn-BD')}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-gray-400 text-xs font-black uppercase mb-2 tracking-widest">মোট বিক্রি</p>
          <p className="text-4xl font-black text-gray-800">৳{sell.toLocaleString('bn-BD')}</p>
        </div>

        <div className={`p-8 rounded-[2.5rem] shadow-md border-2 transition-all ${profit >= 0 ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-xs font-black uppercase mb-2 tracking-widest">মোট লাভ/লস</p>
              <p className="text-4xl font-black text-white">৳{profit.toLocaleString('bn-BD')}</p>
            </div>
            <Wallet className="text-white/30 w-10 h-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModule;
