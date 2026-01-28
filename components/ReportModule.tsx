import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Purchase, Sale, Expense, CashLog } from '../types';

interface ReportModuleProps {
  data: {
    purchases: Purchase[];
    sales: Sale[];
    expenses: Expense[];
    cashLogs: CashLog[];
  };
}

const ReportModule: React.FC<ReportModuleProps> = ({ data }) => {
  // সুরক্ষিত ডেটা হ্যান্ডলিং
  const purchases = data?.purchases || [];
  const sales = data?.sales || [];
  const expenses = data?.expenses || [];

  const totalBuy = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalSell = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalSell - totalBuy - totalExp;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-green-600 w-6 h-6" />
        <h2 className="text-2xl font-black text-gray-800">ব্যবসায়িক রিপোর্ট</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-bold mb-1">মোট কেনাকাটা</p>
          <p className="text-2xl font-black text-emerald-600">৳{new Intl.NumberFormat('bn-BD').format(totalBuy)}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-bold mb-1">মোট বিক্রয়</p>
          <p className="text-2xl font-black text-blue-600">৳{new Intl.NumberFormat('bn-BD').format(totalSell)}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-bold mb-1">মোট খরচ</p>
          <p className="text-2xl font-black text-orange-600">৳{new Intl.NumberFormat('bn-BD').format(totalExp)}</p>
        </div>

        <div className={`p-6 rounded-[2rem] shadow-sm border ${netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-gray-500 text-sm font-bold mb-1">নিট লাভ/লোকসান</p>
          <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ৳{new Intl.NumberFormat('bn-BD').format(Math.abs(netProfit))}
          </p>
        </div>
      </div>

      {/* খালি অবস্থার জন্য মেসেজ */}
      {purchases.length === 0 && sales.length === 0 && (
        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-100">
          <p className="text-gray-400 font-bold italic">রিপোর্ট দেখানোর জন্য পর্যাপ্ত ডেটা নেই।</p>
        </div>
      )}
    </div>
  );
};

export default ReportModule;
