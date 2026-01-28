import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';

export const useData = (isLoggedIn: boolean, isSettingUp: boolean) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    purchases: [], sales: [], expenses: [], dues: [], 
    cashLogs: [], stock: {}, resets: {}, lotHistory: []
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

      const stock = DataService.calculateStock(purchases, sales);
      
      setData({ 
        purchases, sales, expenses, dues, cashLogs, stock, resets, lotHistory 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, isSettingUp]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { ...data, loading, refresh: fetchData };
};
