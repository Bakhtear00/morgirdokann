import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';
// এখান থেকে টাইপগুলো সরাসরি নেওয়া হচ্ছে
import type { Purchase, Sale, Expense, Due, LotArchive } from '../services/dataService';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [] as Purchase[],
    sales: [] as Sale[],
    expenses: [] as Expense[],
    dues: [] as Due[],
    stock: {} as any,
    resets: {} as any,
    lotHistory: [] as LotArchive[],
  });

  const fetchData = useCallback(async () => {
    if (!isLoggedIn || isSettingUp) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [purchases, sales, expenses, dues, lotHistory, resets] = await Promise.all([
        DataService.getPurchases(),
        DataService.getSales(),
        DataService.getExpenses(),
        DataService.getDues(),
        DataService.getLotHistory(),
        DataService.getResets()
      ]);

      const currentPurchases = purchases.filter(p => {
        const resetTime = resets[p.type] ? new Date(resets[p.type]).getTime() : 0;
        return new Date(p.created_at || p.date).getTime() > resetTime;
      });

      const currentSales = sales.filter(s => {
        const resetTime = resets[s.type] ? new Date(resets[s.type]).getTime() : 0;
        return new Date(s.created_at || s.date).getTime() > resetTime;
      });

      const stock = DataService.calculateStock(currentPurchases, currentSales);
      
      setData({ 
        purchases: currentPurchases, 
        sales: currentSales, 
        expenses, 
        dues, 
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
