import React, { useMemo, useState } from 'react';
import { Package, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
// সার্ভিস থেকে সরাসরি টাইপ ইম্পোর্ট
import type { Purchase, Sale, LotArchive } from '../services/dataService';

interface StockModuleProps {
  stock: any;
  purchases: Purchase[];
  sales: Sale[];
  resets: any;
  lotHistory: LotArchive[];
  onResetLot?: (type: string) => void;
}

export const StockModule: React.FC<StockModuleProps> = ({ 
  stock, purchases, sales, resets, lotHistory, onResetLot 
}) => {
  // আপনার বাকি কোড...

  const [resettingType, setResettingType] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // হোল্ড টু রিসেট লজিক
  const startHolding = (type: string) => {
    setResettingType(type);
    timerRef.current = setTimeout(() => {
      onResetLot?.(type);
      setResettingType(null);
      alert(`${type} রিসেট সফল হয়েছে!`);
    }, 2000); // ২ সেকেন্ড চেপে ধরে রাখতে হবে
  };

  const stopHolding = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setResettingType(null);
  };

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
      <div className="bg-[#10b981] p-10 rounded-[2.5rem] text-white shadow-xl flex justify-between items-center relative overflow-hidden border-b-8 border-green-700/30">
        <div>
          <h2 className="text-2xl font-black mb-2 opacity-90 text-white">দোকানের মোট মুরগি</h2>
          <div className="flex items-baseline gap-2 text-white">
            <span className="text-7xl font-black tracking-tighter">{new Intl.NumberFormat('bn-BD').format(totalStock)}</span>
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
          const isCurrentlyResetting = resettingType === type;

          return (
            <div key={type} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
              
              {/* হোল্ড টু রিসেট বাটন (ডান কোণায়) */}
              <button 
                onMouseDown={() => startHolding(type)}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={() => startHolding(type)}
                onTouchEnd={stopHolding}
                className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border flex items-center gap-2 select-none active:scale-90 ${
                  isCurrentlyResetting ? 'bg-red-500 text-white border-red-500 scale-110' : 'bg-gray-50 text-gray-400 border-gray-100'
                }`}
              >
                <RotateCcw size={18} className={isCurrentlyResetting ? 'animate-spin' : ''} />
                {isCurrentlyResetting && <span className="text-[10px] font-black uppercase">Hold...</span>}
              </button>

              <div className="mb-6">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">{type}</h3>
              </div>

              <div className="mb-8">
                <p className="text-gray-400 text-xs font-bold uppercase mb-1 tracking-widest">বর্তমানে আছে</p>
                <p className="text-6xl font-black text-gray-800">
                  {new Intl.NumberFormat('bn-BD').format(s.pieces)} <span className="text-xl">টি</span>
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400 uppercase text-[10px]">মোট ক্রয়</span>
                  <span className="text-gray-700 font-black">৳{stat.buy.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400 uppercase text-[10px]">মোট বিক্রয়</span>
                  <span className="text-gray-700 font-black">৳{stat.sell.toLocaleString('bn-BD')}</span>
                </div>
                
                {/* লাভ-লস বক্স */}
                <div className={`flex justify-between items-center p-5 rounded-[1.5rem] mt-4 ${isProfit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span className="text-xs font-black uppercase tracking-tighter">লাভ / লস</span>
                  <div className="flex items-center gap-1 font-black">
                    {isProfit ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                    <span className="text-3xl italic">৳{Math.abs(stat.profit).toLocaleString('bn-BD')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ৩. লট আর্কাইভ টেবিল */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-800">
          <History size={24} className="text-green-500"/> শেষ হওয়া লটের ইতিহাস
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 font-black uppercase text-[10px] border-b border-gray-50">
                <th className="pb-4 px-4">টাইপ</th>
                <th className="pb-4 px-4 text-right">মোট বিক্রি</th>
                <th className="pb-4 px-4 text-right tracking-widest">লাভ/লস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lotHistory.length > 0 ? lotHistory.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors font-bold text-gray-700">
                  <td className="py-5 px-4">{h.type}</td>
                  <td className="py-5 px-4 text-right">৳{h.total_sale.toLocaleString('bn-BD')}</td>
                  <td className={`py-5 px-4 text-right font-black ${h.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ৳{Math.abs(h.profit).toLocaleString('bn-BD')}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-12 text-center text-gray-300 font-bold italic tracking-widest">কোনো ইতিহাস পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockModule;
