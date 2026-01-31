\import React from 'react';
import { Package, RotateCcw } from 'lucide-react';

const StockModule = ({ stock = {}, lotHistory = [], onResetLot }: any) => {
  // নিশ্চিত করা হচ্ছে যেন stock সবসময় একটি অবজেক্ট হয়
  const safeStock = stock || {};
  const stockKeys = Object.keys(safeStock);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border">
        <h2 className="text-xl font-black flex items-center gap-2 text-gray-800">
          <Package className="text-emerald-600"/> বর্তমান স্টক
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stockKeys.length === 0 ? (
          <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-[2rem]">
            এখনো কোনো স্টক ডাটা নেই। ক্রয় এন্ট্রি করুন।
          </div>
        ) : (
          stockKeys.map((type) => (
            <div key={type} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  {type}
                </span>
                <button 
                  onClick={() => onResetLot && onResetLot(type)} 
                  className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-3xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">পরিমাণ</p>
                  <p className="text-xl font-black">
                    {safeStock[type]?.pieces || 0} টি
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-3xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">ওজন</p>
                  <p className="text-xl font-black">
                    {safeStock[type]?.kg?.toFixed(2) || 0} কেজি
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockModule;
