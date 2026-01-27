import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calculator, CreditCard, Loader2, Package, 
  ShoppingBag, ShoppingCart, Users, Wallet, LogOut 
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { useData } from './hooks/useData'; // খেয়াল করুন 'useData' বড় হাতের D

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

  const menu = [
    { id: 'purchase', icon: ShoppingBag, label: 'কেনা' },
    { id: 'sales', icon: ShoppingCart, label: 'বেচা' },
    { id: 'stock', icon: Package, label: 'স্টক' },
    { id: 'expense', icon: CreditCard, label: 'খরচ' },
    { id: 'due', icon: Users, label: 'বাকি' },
    { id: 'cash', icon: Wallet, label: 'ক্যাশ' },
    { id: 'calc', icon: Calculator, label: 'ক্যালকুলেটর' },
    { id: 'reports', icon: BarChart3, label: 'রিপোর্ট' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-green-600">মুরগির দোকান</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">লগআউট</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-64 p-4 lg:p-10 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-green-600">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold">ডেটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeTab === 'purchase' && <PurchaseModule purchases={data.purchases} refresh={refresh} />}
            {activeTab === 'sales' && <SalesModule sales={data.sales} refresh={refresh} />}
            {activeTab === 'stock' && <StockModule stock={data.stock} refresh={refresh} />}
            {activeTab === 'expense' && <ExpenseModule expenses={data.expenses} refresh={refresh} />}
            {activeTab === 'due' && <DueModule dues={data.dues} refresh={refresh} />}
            {activeTab === 'cash' && <CashModule cashLogs={data.cashLogs} refresh={refresh} />}
            {activeTab === 'calc' && <DenominationModule refresh={refresh} />}
            {activeTab === 'reports' && <ReportModule data={data} />}
          </div>
        )}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-3 grid grid-cols-4 gap-1 z-50 shadow-2xl">
        {menu.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === item.id ? 'bg-green-600 text-white' : 'text-gray-500'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
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
