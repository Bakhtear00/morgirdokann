import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calculator, CreditCard, Loader2, Package, 
  ShoppingBag, ShoppingCart, Users, Wallet, LogOut 
} from 'lucide-react';

import { supabase } from './services/supabaseClient'; 
import { useData } from './hooks/usedata'; // আপনার ফাইল লিস্ট অনুযায়ী usedata (ছোট হাতের d)

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
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-green-600">মুরগির দোকান</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['purchase', 'sales', 'stock', 'expense', 'due', 'cash', 'calc', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2 rounded-lg capitalize ${
                activeTab === tab ? 'bg-green-600 text-white shadow-md' : 'hover:bg-green-50'
              }`}
            >
              {tab === 'calc' ? 'ক্যালকুলেটর' : tab === 'reports' ? 'রিপোর্ট' : tab}
            </button>
          ))}
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 mt-10 flex items-center gap-2"
          >
            <LogOut size={18} /> লগআউট
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 pb-24">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <Loader2 className="animate-spin text-green-600 w-10 h-10 mb-2" />
            <p className="text-gray-500 font-medium">ডেটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeTab === 'purchase' && <PurchaseModule purchases={data.purchases || []} refresh={refresh} />}
            {activeTab === 'sales' && <SalesModule sales={data.sales || []} refresh={refresh} />}
            {activeTab === 'stock' && <StockModule stock={data.stock || []} refresh={refresh} />}
            {activeTab === 'expense' && <ExpenseModule expenses={data.expenses || []} refresh={refresh} />}
            {activeTab === 'due' && <DueModule dues={data.dues || []} refresh={refresh} />}
            {activeTab === 'cash' && <CashModule cashLogs={data.cashLogs || []} refresh={refresh} />}
            {activeTab === 'calc' && <DenominationModule refresh={refresh} />}
            {activeTab === 'reports' && <ReportModule data={data} />}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50">
        <button onClick={() => setActiveTab('purchase')} className={`p-2 ${activeTab === 'purchase' ? 'text-green-600' : 'text-gray-400'}`}><ShoppingBag size={20}/></button>
        <button onClick={() => setActiveTab('sales')} className={`p-2 ${activeTab === 'sales' ? 'text-green-600' : 'text-gray-400'}`}><ShoppingCart size={20}/></button>
        <button onClick={() => setActiveTab('stock')} className={`p-2 ${activeTab === 'stock' ? 'text-green-600' : 'text-gray-400'}`}><Package size={20}/></button>
        <button onClick={() => setActiveTab('reports')} className={`p-2 ${activeTab === 'reports' ? 'text-green-600' : 'text-gray-400'}`}><BarChart3 size={20}/></button>
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
