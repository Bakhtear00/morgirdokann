import { useState, useEffect, useCallback } from 'react';
// নিচে 'type' কীওয়ার্ডটি যোগ করা হয়েছে যাতে ক্রস না আসে
import { DataService } from '../services/dataService';
import type { Purchase, Sale, Expense, Due, CashLog, LotArchive } from '../services/dataService';

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

      // রিসেট টাইম অনুযায়ী ফিল্টার
      const currentPurchases = (purchases || []).filter(p => {
        const resetTime = resets[p.type] ? new Date(resets[p.type]).getTime() : 0;
        return new Date(p.created_at || p.date).getTime() > resetTime;
      });

      const currentSales = (sales || []).filter(s => {
        const resetTime = resets[s.type] ? new Date(resets[s.type]).getTime() : 0;
        return new Date(s.created_at || s.date).getTime() > resetTime;
      });

      const stock = DataService.calculateStock(currentPurchases, currentSales);
      
      setData({ 
        purchases: currentPurchases, 
        sales: currentSales, 
        expenses: expenses || [], 
        dues: dues || [], 
        cashLogs: cashLogs || [], 
        stock: stock || {}, 
        resets: resets || {}, 
        lotHistory: lotHistory || [] 
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
