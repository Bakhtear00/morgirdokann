import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';

const ReportModule = ({ allPurchases = [], allSales = [], expenses = [] }: any) => {
  const [filter, setFilter] = useState('all');

  const filterItems = (items: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return items.filter(item => {
      const d = new Date(item.created_at || item.date).getTime();
      if (filter === 'today') return d >= today;
      return true;
    });
  };

  const p = filterItems(allPurchases);
  const s = filterItems(allSales);
  const e = filterItems(expenses);

  const buy = p.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const sell = s.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const exp = e.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black flex items-center gap-2"><BarChart3/> রিপোর্ট</h2>
        <select onChange={(e) => setFilter(e.target.value)} className="p-2 rounded-lg border">
          <option value="all">সব সময়</option>
          <option value="today">আজ</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-gray-500 font-bold">মোট কেনা</p>
          <p className="text-2xl font-black text-emerald-600">৳{buy.toLocaleString('bn-BD')}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-gray-500 font-bold">মোট বিক্রি</p>
          <p className="text-2xl font-black text-blue-600">৳{sell.toLocaleString('bn-BD')}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-gray-500 font-bold">নিট লাভ</p>
          <p className="text-2xl font-black text-green-600">৳{(sell - buy - exp).toLocaleString('bn-BD')}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportModule;
