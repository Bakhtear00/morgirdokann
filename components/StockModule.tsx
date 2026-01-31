import React, { useMemo } from 'react';
import { Package, RotateCcw, TrendingUp, TrendingDown, History } from 'lucide-react';
import type { Purchase, Sale, LotArchive } from '../services/dataService';

interface StockModuleProps {
  stock?: any;
  purchases?: Purchase[];
  sales?: Sale[];
  resets?: any;
  lotHistory?: LotArchive[];
  onResetLot?: (type: string) => void;
}

export const StockModule: React.FC<StockModuleProps> = ({ 
  stock = {}, 
  purchases = [], 
  sales = [], 
  resets = {}, 
  lotHistory = [], 
  onResetLot 
}) => {

  // টোটাল কেনা ও বেচার হিসাব (রিসেটের পরের টুকু)
  const stats = useMemo(() => {
    const types = Object.keys(stock);
    const result: any = {};
    
    types.forEach(type => {
      const pTotal = purchases
        .filter(p => p.type === type)
        .reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const sTotal = sales
        .filter(s => s.type === type)
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      
      result[type] = { pTotal, sTotal };
    });
    return result;
  }, [stock, purchases, sales]);

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-20">
      {/* হেডার */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
        <h2 className="text-xl font-black flex items-center gap-2 text-gray-800">
          <Package className="text-emerald-600 w-6 h-6"/> বর্তমান স্টক ও লট
        </h2>
      </div>

      {/* স্টক কার্ডস */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(stock).length === 0 ? (
          <div className="bg-gray-50 p-10 rounded-[2.5rem] text-center text-gray-400 border-2 border-dashed">
            কোনো ডাটা পাওয়া যায়নি
          </div>
        ) : (
          Object.keys(stock).map(type => (
            <div key={type} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  {type}
                </span>
                <button 
                  onClick={() => onResetLot && onResetLot(type)}
                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                  title="লট রিসেট করুন"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-3xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">পরিমাণ</p>
                  <p className="text-xl font-black text-gray-800">{stock[type]?.pieces || 0} টি</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ওজন (কেজি)</p>
                  <p className="text-xl font-black text-gray-800">{stock[type]?.kg?.toFixed(2) || 0} কেজি</p>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-dashed">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-gray-500">৳{stats[type]?.pTotal?.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-gray-500">৳{stats[type]?.sTotal?.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* লট হিস্ট্রি সেকশন */}
      <div className="space-y-4">
        <h3 className="text-lg font-black flex items-center gap-2 text-gray-700 px-2">
          <History className="text-gray-400" size={20}/> গত লট সমূহের হিসাব
        </h3>
        <div className="space-y-3">
          {lotHistory.length === 0 ? (
            <p className="text-sm text-gray-400 px-4">এখনো কোনো লট ক্লোজ করা হয়নি।</p>
          ) : (
            lotHistory.map((history, idx) => (
              <div key={idx} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-black text-gray-800">{history.type}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{new Date(history.date).toLocaleDateString('bn-BD')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${history.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {history.profit >= 0 ? '+' : ''}৳{history.profit.toLocaleString('bn-BD')}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold">লাভ/লস</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StockModule;
