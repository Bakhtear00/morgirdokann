import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';
import { Purchase, Sale, Expense, DueRecord, CashLog, LotArchive } from '../types';

interface AppData {
  purchases: Purchase[];
  sales: Sale[];
  expenses: Expense[];
  dues: DueRecord[];
  cashLogs: CashLog[];
  stock: { [key: string]: { pieces: number; kg: number; dead: number; } };
  resets: { [key: string]: string };
  lotHistory: LotArchive[];
}

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppData>({
    purchases: [], sales: [], expenses: [], dues: [], cashLogs: [],
    stock: {}, resets: {}, lotHistory: []
  });

  const fetchData = useCallback(async () => {
    if (!isLoggedIn || isSettingUp) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [allPurchases, allSales, expenses, dues, cashLogs, lotHistory, resets] = await Promise.all([
        DataService.getPurchases(),
        DataService.getSales(),
        DataService.getExpenses(),
        DataService.getDues(),
        DataService.getCashLogs(),
        DataService.getLotHistory(),
        DataService.getResets()
      ]);

      // লজিক: রিসেট টাইমের পরের ডেটাগুলো ফিল্টার করা (যাতে আগের লট উধাও থাকে)
      const currentPurchases = allPurchases.filter(p => {
        const resetTime = resets[p.type] ? new Date(resets[p.type]) : new Date(0);
        return new Date(p.created_at || 0) > resetTime;
      });

      const currentSales = allSales.filter(s => {
        const resetTime = resets[s.type] ? new Date(resets[s.type]) : new Date(0);
        return new Date(s.created_at || 0) > resetTime;
      });

      // সুরক্ষিত স্টক ক্যালকুলেশন
      const stock = DataService.calculateStock(currentPurchases, currentSales);
      
      setData({ 
        purchases: currentPurchases, 
        sales: currentSales, 
        expenses, 
        dues, 
        cashLogs, 
        stock, 
        resets, 
        lotHistory 
      });
    } catch (error) {
      console.error("ডেটা লোড করতে সমস্যা হয়েছে:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, isSettingUp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, refresh: fetchData };
};
