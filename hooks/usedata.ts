
import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../services/dataService';

// টাইপগুলো সরাসরি এখানেই লিখে দিলাম যাতে কোনো ক্রস না আসে
interface Purchase { id?: string; user_id?: string; date: string; type: string; pieces: number; kg: number; rate: number; total: number; created_at?: string; }
interface Sale { id?: string; user_id?: string; date: string; type: string; pieces: number; kg: number; rate: number; total: number; mortality: number; created_at?: string; }
interface Expense { id?: string; user_id?: string; date: string; category: string; amount: number; note?: string; created_at?: string; }
interface Due { id?: string; user_id?: string; customer_name: string; amount: number; mobile?: string; status: string; created_at?: string; }
interface CashLog { id?: string; user_id?: string; date: string; amount: number; type: 'in' | 'out'; note?: string; created_at?: string; }
interface LotArchive { id?: string; user_id?: string; type: string; total_purchase: number; total_sale: number; profit: number; pieces_at_reset: number; date: string; }

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

      // ফিল্টারিং লজিক (রিসেট টাইমের পর থেকে)
      const currentPurchases = (purchases || []).filter((p: any) => {
        const resetTime = (resets as any)[p.type] ? new Date((resets as any)[p.type]).getTime() : 0;
        return new Date(p.created_at || p.date).getTime() > resetTime;
      });

      const currentSales = (sales || []).filter((s: any) => {
        const resetTime = (resets as any)[s.type] ? new Date((resets as any)[s.type]).getTime() : 0;
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
