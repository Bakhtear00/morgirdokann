import React, { useState } from 'react';
import { BarChart3, Calendar, Filter } from 'lucide-react';

const ReportModule = ({ data }: any) => {
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const filterData = (items: any[]) => {
    if (!items) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return items.filter(item => {
      const itemDate = new Date(item.created_at || item.date).getTime();
      if (filter === 'today') return itemDate >= today;
      if (filter === 'week') return itemDate >= oneWeekAgo;
      if (filter === 'month') return itemDate >= firstDayOfMonth;
      return true; // All time
    });
  };

  const filteredPurchases = filterData(data?.allPurchases || []);
  const filteredSales = filterData(data?.allSales || []);
  const filteredExpenses = filterData(data?.expenses || []);

  const totalBuy = filteredPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalSell = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalExp = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalSell - totalBuy - totalExp;

  const filterNames = { today: 'আজ', week: 'এই সপ্তাহ', month: 'এই মাস', all: 'সব সময়' };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-green-600 w-7 h-7" />
          <h2 className="text-2xl font-black text-gray-800">ব্যবসায়িক রিপোর্ট</h2>
        </div>
        
        {/* ফিল্টার বাটনসমূহ */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto overflow-x-auto">
          {Object.entries(filterNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === key ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="কেনাকাটা" amount={totalBuy} color="text-emerald-600" desc={`${filterNames[filter]}র ক্রয়`} />
        <StatCard title="বিক্রয়" amount={totalSell} color="text-blue-600" desc={`${filterNames[filter]}র বিক্রয়`} />
        <StatCard title="খরচ" amount={totalExp} color="text-orange-600" desc={`${filterNames[filter]}র খরচ`} />
        
        <div className={`p-6 rounded-[2rem] shadow-sm border-2 ${netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 text-sm font-black uppercase">নিট লাভ/লস</p>
            <Calendar size={16} className="text-gray-400" />
          </div>
          <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ৳{new Intl.NumberFormat('bn-BD').format(netProfit)}
          </p>
          <p className="text-[10px] font-bold opacity-60 mt-1">সব খরচ বাদে নিট হিসাব</p>
        </div>
      </div>

      {/* সহজ ডাটা সামারি */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="font-black text-gray-800 mb-4">বিস্তারিত তথ্য ({filterNames[filter]})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">মোট চালান</p>
            <p className="text-xl font-black">{filteredPurchases.length} টি</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">বিক্রয় রসিদ</p>
            <p className="text-xl font-black">{filteredSales.length} টি</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">খরচ হয়েছে</p>
            <p className="text-xl font-black">{filteredExpenses.length} বার</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, color, desc }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <p className="text-gray-400 text-[10px] font-black uppercase mb-1">{title}</p>
    <p className={`text-2xl font-black ${color}`}>৳{new Intl.NumberFormat('bn-BD').format(amount)}</p>
    <p className="text-[10px] font-bold text-gray-400 mt-2">{desc}</p>
  </div>
);

export default ReportModule;
