import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calculator, CreditCard, Loader2, Package, 
  ShoppingBag, ShoppingCart, Users, Wallet, LogOut 
} from 'lucide-react';


import { supabase } from './services/supabaseClient'; 
import { useData } from './hooks/usedata'; 
import { DataService } from './services/dataService'; // এটি যোগ করা হয়েছে

import AuthModule from './components/AuthModule';
import PurchaseModule from './components/PurchaseModule';
import SalesModule from './components/SalesModule';
import StockModule from './components/StockModule';
import ExpenseModule from './components/ExpenseModule';
import CashModule from './components/CashModule';
import DueModule from './components/DueModule';
import ReportModule from './components/ReportModule';
import DenominationModule from './components/DenominationModule';

import { ToastProvider } from './contexts/ToastContext';

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('purchase');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const data = useData(isLoggedIn, false);
  const { loading, refresh } = data;

  // লট রিসেট করার ফাংশন
// App.tsx এর handleResetLot ফাংশনটি এভাবে লিখুন
const handleResetLot = async (type: string) => {
  try {
    const currentStock = (data.stock && data.stock[type]) || { pieces: 0, kg: 0 };
    const resetTime = (data.resets && data.resets[type]) ? new Date(data.resets[type]).getTime() : 0;
    
    const lotPurchases = (data.purchases || []).filter(p => p.type === type && new Date(p.created_at || p.date).getTime() > resetTime);
    const lotSales = (data.sales || []).filter(s => s.type === type && new Date(s.created_at || s.date).getTime() > resetTime);

    const totalPurchase = lotPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const totalSale = lotSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    // @ts-ignore (যদি টাইপ এরর দেখায় তবে এটি সাময়িক সমাধান)
    await DataService.resetLot(type, currentStock, totalPurchase, totalSale);
    refresh(); 
  } catch (error) {
    console.error("Reset failed:", error);
  }
};
  const menuNames: { [key: string]: string } = {
    purchase: 'কেনাকাটা',
    sales: 'বিক্রয়',
    stock: 'স্টক ও লট',
    expense: 'খরচ',
    due: 'বাকি',
    cash: 'ক্যাশ বক্স',
    calc: 'ক্যালকুলেটর',
    reports: 'রিপোর্ট'
  };

  if (!authChecked) return (
    <div className="h-screen flex items-center justify-center font-bold text-gray-500">চেক করা হচ্ছে...</div>
  );

  if (!isLoggedIn) return <AuthModule onAuthSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* ডেস্কটপ সাইডবার */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full shadow-sm">
        <div className="p-6 border-b bg-white sticky top-0">
          <h1 className="text-xl font-black text-green-600">বেলায়িত পোল্ট্রি</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {Object.keys(menuNames).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-2xl font-bold transition-all ${
                activeTab === tab ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'hover:bg-green-50 text-gray-600'
              }`}
            >
              {menuNames[tab]}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 mt-10 flex items-center gap-2 font-bold rounded-2xl">
            <LogOut size={18} /> লগআউট
          </button>
        </nav>
      </aside>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-1 lg:ml-64 p-4 pb-24 min-h-screen">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <Loader2 className="animate-spin text-green-600 w-10 h-10 mb-2" />
            <p className="text-gray-500 font-bold italic">ডেটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeTab === 'purchase' && <PurchaseModule purchases={data.purchases || []} refresh={refresh} />}
            {activeTab === 'sales' && <SalesModule sales={data.sales || []} refresh={refresh} />}
            
            {activeTab === 'stock' && (
              <StockModule 
                stock={data.stock || {}} 
                purchases={data.purchases || []} 
                sales={data.sales || []}
                resets={data.resets || {}}
                lotHistory={data.lotHistory || []}
                onResetLot={handleResetLot} // এখানে রিসেট ফাংশন পাঠানো হয়েছে
              />
            )}

            {activeTab === 'expense' && <ExpenseModule expenses={data.expenses || []} refresh={refresh} />}
            {activeTab === 'due' && <DueModule dues={data.dues || []} refresh={refresh} />}
            {activeTab === 'cash' && <CashModule cashLogs={data.cashLogs || []} refresh={refresh} />}
            
            {activeTab === 'calc' && <DenominationModule cashLogs={data.cashLogs || []} refresh={refresh} />}
            {activeTab === 'reports' && <ReportModule purchases={data.purchases || []} sales={data.sales || []} expenses={data.expenses || []} />}
          </div>
        )}
      </main>

      {/* মোবাইল নিচের মেনু */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('purchase')} className={`p-2 flex flex-col items-center flex-1 ${activeTab === 'purchase' ? 'text-green-600' : 'text-gray-400'}`}>
          <ShoppingBag size={20}/><span className="text-[10px] font-bold mt-1">কেনা</span>
        </button>
        <button onClick={() => setActiveTab('sales')} className={`p-2 flex flex-col items-center flex-1 ${activeTab === 'sales' ? 'text-green-600' : 'text-gray-400'}`}>
          <ShoppingCart size={20}/><span className="text-[10px] font-bold mt-1">বেচা</span>
        </button>
        <button onClick={() => setActiveTab('stock')} className={`p-2 flex flex-col items-center flex-1 ${activeTab === 'stock' ? 'text-green-600' : 'text-gray-400'}`}>
          <Package size={20}/><span className="text-[10px] font-bold mt-1">স্টক</span>
        </button>
        <button onClick={() => setActiveTab('calc')} className={`p-2 flex flex-col items-center flex-1 ${activeTab === 'calc' ? 'text-green-600' : 'text-gray-400'}`}>
          <Calculator size={20}/><span className="text-[10px] font-bold mt-1">হিসাব</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`p-2 flex flex-col items-center flex-1 ${activeTab === 'reports' ? 'text-green-600' : 'text-gray-400'}`}>
          <BarChart3 size={20}/><span className="text-[10px] font-bold mt-1">রিপোর্ট</span>
        </button>
      </nav>
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
