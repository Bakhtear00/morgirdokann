import { useState, useEffect, useCallback } from 'react';
// এখানে টাইপগুলো সরাসরি ডাটা সার্ভিস থেকে আসবে
import { DataService, Purchase, Sale, Expense, Due, CashLog, LotArchive } from '../services/dataService';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [] as Purchase[],
    sales: [] as Sale[],
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
      const [purchases, sales, expenses, dues, cashLogs, lotHistory, resets] = await Promise.all([
        DataService.getPurchases(),
        DataService.getSales(),
        DataService.getExpenses(),
        DataService.getDues(),
        DataService.getCashLogs(),
        DataService.getLotHistory(),
        DataService.getResets()
      ]);

      // ১. বর্তমান লটের জন্য কেনা-বেচা ফিল্টার করা
      const currentPurchases = purchases.filter(p => {
        const resetTimeStr = resets[p.type];
        const resetTime = resetTimeStr ? new Date(resetTimeStr).getTime() : 0;
        return new Date(p.created_at || p.date).getTime() > resetTime;
      });

      const currentSales = sales.filter(s => {
        const resetTimeStr = resets[s.type];
        const resetTime = resetTimeStr ? new Date(resetTimeStr).getTime() : 0;
        return new Date(s.created_at || s.date).getTime() > resetTime;
      });

      // ২. বর্তমান লটের ওপর ভিত্তি করে স্টক হিসাব করা
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
