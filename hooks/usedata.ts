import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';
import { Purchase, Sale, Expense, Due, CashLog, LotArchive } from '../types';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [] as Purchase[],
    sales: [] as Sale[],
    allPurchases: [] as Purchase[], // রিপোর্টের জন্য পূর্ণ ইতিহাস
    allSales: [] as Sale[],         // রিপোর্টের জন্য পূর্ণ ইতিহাস
    expenses: [] as Expense[],
    dues: [] as Due[],
    cashLogs: [] as CashLog[],
    stock: {} as { [key: string]: { pieces: number; kg: number; dead: number } },
    resets: {} as { [key: string]: string },
    lotHistory: [] as LotArchive[],
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

      // ১. শুধুমাত্র স্টকের জন্য বর্তমান লট ফিল্টার করা
      const currentPurchases = allPurchases.filter(p => {
        const resetTimeStr = resets[p.type];
        const resetTime = resetTimeStr ? new Date(resetTimeStr).getTime() : 0;
        const itemTime = new Date(p.created_at || p.date).getTime();
        return itemTime > resetTime;
      });

      const currentSales = allSales.filter(s => {
        const resetTimeStr = resets[s.type];
        const resetTime = resetTimeStr ? new Date(resetTimeStr).getTime() : 0;
        const itemTime = new Date(s.created_at || s.date).getTime();
        return itemTime > resetTime;
      });

      // ২. বর্তমান লটের ওপর ভিত্তি করে স্টক হিসাব করা
      const stock = DataService.calculateStock(currentPurchases, currentSales);
      
      setData({ 
        purchases: currentPurchases, // বর্তমান লটের কেনাকাটা
        sales: currentSales,         // বর্তমান লটের বিক্রয়
        allPurchases,                // রিপোর্টের জন্য সব কেনাকাটা
        allSales,                    // রিপোর্টের জন্য সব বিক্রয়
        expenses, 
        dues, 
        cashLogs, 
        stock, 
        resets, 
        lotHistory 
      });
    } catch (error) {
      console.error("Data Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, isSettingUp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, refresh: fetchData };
};
