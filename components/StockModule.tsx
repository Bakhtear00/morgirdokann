import React, { useMemo } from 'react';
import { Package, History, ArrowUpRight, ArrowDownRight, CircleDollarSign } from 'lucide-react';
import { POULTRY_TYPES } from '../constants.tsx';
import { Purchase, Sale, LotArchive } from '../types';

interface StockModuleProps {
  stock: { [key: string]: { pieces: number; kg: number; dead: number; } };
  purchases: Purchase[];
  sales: Sale[];
  resets: { [key: string]: string };
  lotHistory: LotArchive[];
}

const StockModule: React.FC<StockModuleProps> = ({ stock, purchases, sales, resets, lotHistory }) => {

  // বর্তমান লটের হিসাব করার লজিক
  const currentLotsSummary = useMemo(() => {
    const summary: { [key: string]: any } = {};
    
    POULTRY_TYPES.forEach(type => {
      const resetTime = resets[type] ? new Date(resets[type]).getTime() : 0;

      // ফিল্টার: শুধুমাত্র লাস্ট রিসেট এর পরের ডেটা
      const lotPurchases = purchases.filter(p => p.type === type && new Date(p.created_at || p.date).getTime() > resetTime);
      const lotSales = sales.filter(s => s.type === type && new Date(s.created_at || s.date).getTime() > resetTime);

      const totalBuy = lotPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const totalSell = lotSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      
      summary[type] = {
        buyAmount: totalBuy,
        sellAmount: totalSell,
        profit: totalSell - totalBuy,
        buyCount: lotPurchases.reduce((sum, p) => sum + (Number(p.pieces) || 0), 0),
        sellCount: lotSales.reduce((sum, s) => sum + (Number(s.pieces) || 0), 0)
      };
    });
    return summary;
  }, [purchases, sales, resets]);

  const totalStockPieces = Object.values(stock || {}).reduce((acc, curr) => acc + (curr.pieces || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* টপ কার্ড: দোকানের মোট মজুদ */}
      <div className="bg-gradient-to-br from-green-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-xl text-center border-b-8 border-teal-900/50">
          <p className="text-green-100 text-xs font-black uppercase tracking-[0.2em] mb-2">দোকানের মোট মজুদ মুরগি</p>
          <p className="text-6xl font-black">{new Intl.NumberFormat('bn-BD').format(totalStockPieces)} <span className="text-xl font-normal opacity-70">টি</span></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {POULTRY_TYPES.map(type => {
          const s = stock[type] || { pieces: 0, kg: 0, dead: 0 };
          const lot = currentLotsSummary[type];
          const isProfit = lot.profit >= 0;

          return (
            <div key={type} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
              {/* কার্ড হেডার */}
              <div className="p-6 pb-4 border-b border-dashed border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-2xl font-black text-gray-800">{type}</h4>
                  <div className="bg-green-50 text-green-600 p-2 rounded-xl">
                    <Package size={20} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">বর্তমানে স্টকে আছে</p>
                  <p className="text-4xl font-black text-indigo-600">
                    {new Intl.NumberFormat('bn-BD').format(s.pieces)} <span className="text-sm font-bold">টি</span>
                  </p>
                </div>
              </div>

              {/* চলমান লটের হিসাব */}
              <div className="p-6 bg-gray-50/50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <CircleDollarSign size={14} className="text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">চলমান লটের হিসাব</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">মোট কেনা:</span>
                  <span className="font-black text-gray-700">৳{new Intl.NumberFormat('bn-BD').format(lot.buyAmount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">মোট বিক্রি:</span>
                  <span className="font-black text-gray-700">৳{new Intl.NumberFormat('bn-BD').format(lot.sellAmount)}</span>
                </div>

                <div className={`mt-4 p-3 rounded-2xl flex justify-between items-center ${isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <span className="text-xs font-black uppercase">{isProfit ? 'বর্তমান লাভ' : 'বর্তমান লস'}</span>
                  <div className="flex items-center gap-1">
                    {isProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span className="text-lg font-black">৳{new Intl.NumberFormat('bn-BD').format(Math.abs(lot.profit))}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* লট ইতিহাস টেবিল */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
            <History className="w-5 h-5 text-indigo-500" /> শেষ হওয়া লটের ইতিহাস
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase font-black text-left border-b">
                  <th className="px-4 py-4">টাইপ</th>
                  <th className="px-4 py-4">তারিখ</th>
                  <th className="px-4 py-4 text-right">ক্রয়</th>
                  <th className="px-4 py-4 text-right">বিক্রয়</th>
                  <th className="px-4 py-4 text-right">লাভ/লস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lotHistory.length > 0 ? lotHistory.map((lot) => (
                  <tr key={lot.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-5 font-black text-gray-800">{lot.type}</td>
                    <td className="px-4 py-5 text-xs font-bold text-gray-400">{new Date(lot.date).toLocaleDateString('bn-BD')}</td>
                    <td className="px-4 py-5 text-right font-bold">৳{lot.total_purchase.toLocaleString('bn-BD')}</td>
                    <td className="px-4 py-5 text-right font-bold">৳{lot.total_sale.toLocaleString('bn-BD')}</td>
                    <td className={`px-4 py-5 text-right font-black ${lot.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ৳{Math.abs(lot.profit).toLocaleString('bn-BD')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-300 font-bold italic">কোনো ইতিহাস নেই।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default StockModule;
