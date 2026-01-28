import React, { useState } from 'react';
import { BarChart3, Calendar } from 'lucide-react';

// প্রপসগুলো ডেসট্রাকচার করে নেওয়া হলো যাতে ক্রাশ না করে
const ReportModule = ({ allPurchases = [], allSales = [], expenses = [] }: any) => {
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const filterData = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return items.filter(item => {
      const itemDate = new Date(item.created_at || item.date).getTime();
      if (filter === 'today') return itemDate >= today;
      if (filter === 'week') return itemDate >= oneWeekAgo;
      if (filter === 'month') return itemDate >= firstDayOfMonth;
      return true;
    });
  };

  const p = filterData(allPurchases);
  const s = filterData(allSales);
  const e = filterData(expenses);

  const buy = p.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const sell = s.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const exp = e.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const profit = sell - buy - exp;

  const filterNames: any = { today: 'আজ', week: 'এই সপ্তাহ', month: 'এই মাস', all: 'সব সময়' };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <BarChart3 className="text-green-600" /> রিপোর্ট
        </h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-gray-50 border-none text-sm font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 ring-green-500"
        >
          {Object.entries(filterNames).map(([key, name]: any) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="মোট কেনা" amount={buy} color="text-emerald-600" />
        <StatCard title="মোট বিক্রি" amount={sell} color="text-blue-600" />
        <div className={`p-6 rounded-[2rem] shadow-sm border ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">নিট লাভ/লস</p>
          <p className={`text-3xl font-black ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ৳{new Intl.NumberFormat('bn-BD').format(profit)}
          </p>
          <p className="text-[10px] font-bold opacity-50 mt-1">{filterNames[filter]}র হিসাব</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-gray-100">
        <p className="text-gray-400 text-xs font-bold uppercase mb-4 text-center tracking-[0.2em]">খরচের হিসাব</p>
        <div className="flex justify-between items-center border-t pt-4">
          <span className="font-bold text-gray-600">মোট খরচ ({filterNames[filter]})</span>
          <span className="text-xl font-black text-orange-600 font-mono">৳{exp.toLocaleString('bn-BD')}</span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-3xl font-black ${color}`}>৳{new Intl.NumberFormat('bn-BD').format(amount)}</p>
  </div>
);

export default ReportModule;
