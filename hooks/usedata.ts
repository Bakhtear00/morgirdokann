// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [],
    sales: [],
    expenses: [],
    dues: [],
    cashLogs: [],
    stock: {},
    resets: {},
    lotHistory: [],
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

      // রিসেট টাইম অনুযায়ী ডাটা ফিল্টার করা
      const currentPurchases = (purchases || []).filter((p) => {
        const resetTimeStr = resets?.[p.type];
        const resetTime = resetTimeStr ? new Date(resetTimeStr).getTime() : 0;
        return new Date(p.created_at || p.date).getTime() > resetTime;
      });

      const currentSales = (sales || []).filter((s) => {
        const resetTimeStr = resets?.[s.type];
        const resetTime = resetTimeStr ? new Date(resetTimeStr).getTime() : 0;
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
