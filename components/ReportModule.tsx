
import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { Purchase, Sale, Expense } from '../services/dataService';

interface ReportProps {
  purchases?: Purchase[];
  sales?: Sale[];
  expenses?: Expense[];
}

const ReportModule: React.FC<ReportProps> = ({ purchases = [], sales = [], expenses = [] }) => {
  const [filter, setFilter] = useState('all');

  const filterItems = (items: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return (items || []).filter(item => {
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

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border">
        <h2 className="text-xl font-black flex items-center gap-2 text-gray-800">
          <BarChart3 className="text-green-600"/> রিপোর্ট
        </h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-gray-50 p-2 rounded-xl text-sm font-bold border-none">
          <option value="all">সব সময়</option>
          <option value="today">আজ</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase mb-1">মোট কেনা</p>
          <p className="text-3xl font-black text-emerald-600">৳{buy.toLocaleString('bn-BD')}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase mb-1">মোট বিক্রি</p>
          <p className="text-3xl font-black text-blue-600">৳{sell.toLocaleString('bn-BD')}</p>
        </div>
        <div className={`p-6 rounded-[2rem] shadow-sm border ${ (sell-buy-exp) >= 0 ? 'bg-green-50' : 'bg-red-50' }`}>
          <p className="text-gray-500 text-xs font-black uppercase mb-1">লাভ/লস</p>
          <p className={`text-3xl font-black ${(sell-buy-exp) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ৳{(sell - buy - exp).toLocaleString('bn-BD')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportModule;
