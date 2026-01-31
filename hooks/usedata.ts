import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';

export const useData = (isLoggedIn: boolean) => {
  const [data, setData] = useState({
    purchases: [],
    sales: [],
    expenses: [],
    dues: [],
    stock: {},
    resets: {},
    lotHistory: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
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

      const currentStock = DataService.calculateStock(purchases || [], sales || []);
      
      setData({
        purchases: purchases || [],
        sales: sales || [],
        expenses: expenses || [],
        dues: dues || [],
        stock: currentStock || {},
        resets: resets || {},
        lotHistory: lotHistory || [],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...data, loading, refresh: fetchData };
};
