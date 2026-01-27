import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calculator, CreditCard, Loader2, Package, 
  ShoppingBag, ShoppingCart, Users, Wallet 
} from 'lucide-react';

import { BENGALI_TEXT } from './constants';
import { useData } from './hooks/usedata';
import { supabase } from './lib/supabase'; // সুপাবেস ইমপোর্ট করতে হবে

import AuthModule from './components/AuthModule'; // নতুন ইউজারনেম লগইন মডিউল
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
  const isSettingUp = false; 

  // লগইন স্ট্যাটাস চেক করা
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

  const data = useData(isLoggedIn, isSettingUp);
  const { loading, refresh } = data;
  const [activeTab, setActiveTab] = useState('purchase');

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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:pl-64">
      {/* বাকি সাইডবার এবং মেইন কন্টেন্ট আগের মতোই থাকবে */}
      {/* ... (পূর্বের সাইডবার কোড) ... */}
      <main className="p-4 lg:p-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-green-600">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold">ডেটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {activeTab === 'purchase' && <PurchaseModule purchases={data.purchases} refresh={refresh} />}
            {activeTab === 'sales' && <SalesModule sales={data.sales} refresh={refresh} />}
            {/* ... বাকি মডিউলগুলো ... */}
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
