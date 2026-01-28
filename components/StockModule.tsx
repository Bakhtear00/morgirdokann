import React, { useMemo, useState } from 'react';
import { Package, History, TrendingUp, TrendingDown, RotateCcw, AlertTriangle } from 'lucide-react';
import { POULTRY_TYPES } from '../constants';

interface StockModuleProps {
  stock: any;
  purchases: any[];
  sales: any[];
  resets: any;
  lotHistory: any[];
  onResetLot?: (type: string) => void; // এই ফাংশনটা থাকলে বাটন আসবে
}

const StockModule: React.FC<StockModuleProps> = ({ stock, purchases = [], sales = [], resets = {}, lotHistory = [], onResetLot }) => {
  const [confirmType, setConfirmType] = useState<string | null>(null);

  const lotStats = useMemo(() => {
    const stats: any = {};
    POULTRY_TYPES.forEach(type => {
      const resetTime = resets[type] ? new Date(resets[type]).getTime() : 0;
      const currentPurchases = purchases.filter(p => p.type === type && new Date(p.created_at || p.date).getTime() > resetTime);
      const currentSales = sales.filter(s => s.type === type && new Date(s.created_at || s.date).getTime() > resetTime);

      const totalBuy = currentPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const totalSell = currentSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

      stats[type] = { buy: totalBuy, sell: totalSell, profit: totalSell - totalBuy };
    });
    return stats;
  }, [purchases, sales, resets]);

  const totalStock = Object.values(stock || {}).reduce((acc: number, curr: any) => acc + (Number(curr.pieces) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* ১. টপ বড় কার্ড */}
      <div className="bg-[#10b981] p-10 rounded-[2.5rem] text-white shadow-xl flex justify-between items-center relative overflow-hidden">
        <div>
          <h2 className="text-2xl font-black mb-2 opacity-90 text-white">দোকানের মোট মুরগি</h2>
          <div className="flex items-baseline gap-2 text-white">
            <span className="text-7xl font-black">{new Intl.NumberFormat('bn-BD').format(totalStock)}</span>
            <span className="text-2xl font-bold">টি</span>
          </div>
        </div>
        <div className="bg-white/20 p-5 rounded-3xl">
          <Package size={60} className="text-white" />
        </div>
      </div>

      {/* ২. ক্যাটাগরি কার্ডসমূহ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {POULTRY_TYPES.map(type => {
          const s = stock[type] || { pieces: 0 };
          const stat = lotStats[type];
          const isProfit = stat.profit >= 0;

          return (
            <div key={type} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative group">
              
              {/* কোণার রিসেট বক্স বাটন */}
              <button 
                onClick={() => setConfirmType(type)}
                className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all border border-gray-100"
                title="লট রিসেট করুন"
              >
                <RotateCcw size={18} />
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-800">{type}</h3>
              </div>

              <div className="mb-8">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1">বর্তমানে আছে</p>
                <p className="text-5xl font-black text-gray-800">
                  {new Intl.NumberFormat('bn-BD').format(s.pieces)} <span className="text-lg">টি</span>
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-dashed border-gray-100">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">মোট ক্রয়:</span>
                  <span className="text-gray-700 font-black">৳{stat.buy.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">মোট বিক্রয়:</span>
                  <span className="text-gray-700 font-black">৳{stat.sell.toLocaleString('bn-BD')}</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-2xl mt-4 ${isProfit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span className="text-xs font-black uppercase tracking-tighter">{isProfit ? 'বর্তমান লাভ' : 'বর্তমান লস'}</span>
                  <div className="flex items-center gap-1">
                    {isProfit ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                    <span className="text-2xl font-black italic">৳{Math.abs(stat.profit).toLocaleString('bn-BD')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* রিসেট কনফার্মেশন পপআপ */}
      {confirmType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle size={50} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2">{confirmType} রিসেট?</h2>
            <p className="text-gray-500 text-sm mb-6 font-bold">এই লটের লাভ-লস আর্কাইভে জমা হবে এবং স্টক ০ হয়ে যাবে।</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmType(null)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold">না</button>
              <button 
                onClick={() => { onResetLot?.(confirmType); setConfirmType(null); }} 
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold"
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
