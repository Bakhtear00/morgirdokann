import React, { useMemo, useState } from 'react';
import { Package, RotateCcw, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { POULTRY_TYPES } from '../constants';
import { Purchase, Sale, LotArchive } from '../types';

interface StockModuleProps {
  stock: any;
  purchases: Purchase[];
  sales: Sale[];
  resets: { [key: string]: string };
  lotHistory: LotArchive[];
  onHardReset?: () => void; // মাস্টার রিসেট ফাংশন
}

const StockModule: React.FC<StockModuleProps> = ({ stock, purchases, sales, resets, lotHistory, onHardReset }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // লট অনুযায়ী কেনা-বেচা এবং লাভ/লস হিসাব
  const lotStats = useMemo(() => {
    const stats: any = {};
    POULTRY_TYPES.forEach(type => {
      const resetTime = resets[type] ? new Date(resets[type]).getTime() : 0;
      
      const currentPurchases = (purchases || []).filter(p => p.type === type && new Date(p.created_at || p.date).getTime() > resetTime);
      const currentSales = (sales || []).filter(s => s.type === type && new Date(s.created_at || s.date).getTime() > resetTime);

      const totalBuy = currentPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const totalSell = currentSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

      stats[type] = {
        buy: totalBuy,
        sell: totalSell,
        profit: totalSell - totalBuy
      };
    });
    return stats;
  }, [purchases, sales, resets]);

  const totalStock = Object.values(stock || {}).reduce((acc: number, curr: any) => acc + (curr.pieces || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* ১. টপ বড় কার্ড (আপনার ছবির মতো ডিজাইন) */}
      <div className="bg-[#10b981] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div className="text-left">
            <h2 className="text-3xl font-black mb-4">দোকানের মোট মুরগি</h2>
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-black tracking-tighter">
                {new Intl.NumberFormat('bn-BD').format(totalStock)}
              </span>
              <span className="text-3xl font-bold opacity-80">টি</span>
            </div>
          </div>
          <div className="hidden md:block bg-white/20 p-6 rounded-3xl backdrop-blur-md">
            <Package size={80} className="text-white" />
          </div>
        </div>
        
        {/* মাস্টার রিসেট বাটন (কোণায়) */}
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold border border-white/20 transition-all"
        >
          <RotateCcw size={16} /> মাস্টার রিসেট
        </button>
      </div>

      {/* ২. ক্যাটাগরি কার্ডসমূহ (বড় এবং পরিষ্কার) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {POULTRY_TYPES.map(type => {
          const s = stock[type] || { pieces: 0, kg: 0 };
          const stat = lotStats[type];
          const isProfit = stat.profit >= 0;

          return (
            <div key={type} className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-gray-50 hover:border-green-100 transition-all">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-gray-800">{type}</h3>
                <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                  <Package size={24} />
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">বর্তমানে আছে</p>
                <p className="text-5xl font-black text-gray-800">
                   {new Intl.NumberFormat('bn-BD').format(s.pieces)} <span className="text-xl">টি</span>
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-dashed">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">মোট ক্রয়:</span>
                  <span className="text-gray-700">৳{stat.buy.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">মোট বিক্রয়:</span>
                  <span className="text-gray-700">৳{stat.sell.toLocaleString('bn-BD')}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-2xl mt-2 ${isProfit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span className="text-xs font-black uppercase">লাভ / লস:</span>
                  <span className="text-xl font-black italic">৳{stat.profit.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ৩. হিস্ট্রি টেবিল (আপনার ছবির স্টাইল) */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">লট আর্কাইভ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-black uppercase text-gray-400">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Sales</th>
                <th className="px-4 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lotHistory.map((h, i) => (
                <tr key={i} className="text-sm font-bold text-gray-700 hover:bg-gray-50">
                  <td className="px-4 py-4">{h.type}</td>
                  <td className="px-4 py-4 text-right">৳{h.total_sale.toLocaleString('bn-BD')}</td>
                  <td className={`px-4 py-4 text-right ${h.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ৳{h.profit.toLocaleString('bn-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* রিসেট কনফার্মেশন পপআপ */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2">সব রিসেট করবেন?</h2>
            <p className="text-gray-500 text-sm mb-6 font-bold">এটি করলে বর্তমানের সব লট হিসাব মুছে যাবে। আপনি কি নিশ্চিত?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">বাতিল</button>
              <button 
                onClick={() => { onHardReset?.(); setShowResetConfirm(false); }} 
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                হ্যাঁ, রিসেট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockModule;
