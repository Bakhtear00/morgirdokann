
import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [], sales: [], expenses: [], dues: [], cashLogs: [],
    stock: {}, resets: {}, lotHistory: [],
    allPurchases: [], allSales: [] // সব ডেটা রাখার জন্য নতুন দুইটা ঘর
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

      // শুধুমাত্র স্টকের জন্য ফিল্টারিং
      const currentPurchases = allPurchases.filter(p => {
        const resetTime = resets[p.type] ? new Date(resets[p.type]) : new Date(0);
        return new Date(p.created_at || 0) > resetTime;
      });

      const currentSales = allSales.filter(s => {
        const resetTime = resets[s.type] ? new Date(resets[s.type]) : new Date(0);
        return new Date(s.created_at || 0) > resetTime;
      });

      const stock = DataService.calculateStock(currentPurchases, currentSales);
      
      setData({ 
        purchases: currentPurchases, 
        sales: currentSales, 
        allPurchases, // রিপোর্টের জন্য সব কেনা
        allSales,     // রিপোর্টের জন্য সব বেচা
        expenses, dues, cashLogs, stock, resets, lotHistory 
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
