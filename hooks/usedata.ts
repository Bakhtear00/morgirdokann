import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';
import { Purchase, Sale, Expense, DueRecord, CashLog, LotArchive } from '../types';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
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

      // ফিল্টারিং লজিক: লট শেষ হওয়ার আগের ডেটা বাদ দেওয়া
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
        expenses, dues, cashLogs, stock, resets, lotHistory 
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
