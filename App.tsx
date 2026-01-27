import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calculator, CreditCard, Loader2, Package, 
  ShoppingBag, ShoppingCart, Users, Wallet, LogOut 
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { useData } from './hooks/usedata'; 

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

  if (!authChecked) return <div className="h-screen flex items-center justify-center font-bold">লোড হচ্ছে...</div>;
  if (!isLoggedIn) return <AuthModule onAuthSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-64 bg-white border-b lg:border-r border-gray-200 p-4 lg:fixed lg:h-full">
        <h1 className="text-xl font-bold text-green-600 mb-6">মুরগির দোকান</h1>
        <nav className="flex flex-wrap lg:flex-col gap-2">
          <button onClick={() => setActiveTab('purchase')} className={`px-4 py-2 rounded-lg ${activeTab === 'purchase' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>কেনা</button>
          <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 rounded-lg ${activeTab === 'sales' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>বেচা</button>
          <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-lg ${activeTab === 'stock' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>স্টক</button>
          <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-lg ${activeTab === 'expense' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>খরচ</button>
          <button onClick={() => setActiveTab('due')} className={`px-4 py-2 rounded-lg ${activeTab === 'due' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>বাকি</button>
          <button onClick={() => setActiveTab('cash')} className={`px-4 py-2 rounded-lg ${activeTab === 'cash' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>ক্যাশ</button>
          <button onClick={() => setActiveTab('calc')} className={`px-4 py-2 rounded-lg ${activeTab === 'calc' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>ক্যালকুলেটর</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg ${activeTab === 'reports' ? 'bg-green-600 text-white' : 'hover:bg-green-50'}`}>রিপোর্ট</button>
          <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={18}/> লগআউট</button>
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-green-600">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p>ডেটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {activeTab === 'purchase' && <PurchaseModule purchases={data.purchases} refresh={refresh} />}
            {activeTab === 'sales' && <SalesModule sales={data.sales} refresh={refresh} />}
            {activeTab === 'stock' && <StockModule stock={data.stock} refresh={refresh} />}
            {activeTab === 'expense' && <ExpenseModule expenses={data.expenses} refresh={refresh} />}
            {activeTab === 'due' && <DueModule dues={data.dues} refresh={refresh} />}
            {activeTab === 'cash' && <CashModule cashLogs={data.cashLogs} refresh={refresh} />}
            {activeTab === 'calc' && <DenominationModule refresh={refresh} />}
            {activeTab === 'reports' && <ReportModule data={data} />}
          </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
