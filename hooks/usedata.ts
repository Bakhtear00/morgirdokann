import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';
import { Purchase, Sale, Expense, Due, CashLog, LotArchive } from '../types';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [] as Purchase[],
    sales: [] as Sale[],
    allPurchases: [] as Purchase[], // এখানে যাতে ক্রস না আসে তাই টাইপ ঠিক করা হলো
    allSales: [] as Sale[],         // এখানে যাতে ক্রস না আসে তাই টাইপ ঠিক করা হলো
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

      // ফিল্টারিং লজিক
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

      const stock = DataService.calculateStock(currentPurchases, currentSales);
      
      setData({ 
        purchases: currentPurchases, 
        sales: currentSales, 
        allPurchases: allPurchases || [], // নিশ্চিত করা হলো যাতে খালি না থাকে
        allSales: allSales || [],         // নিশ্চিত করা হলো যাতে খালি না থাকে
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
