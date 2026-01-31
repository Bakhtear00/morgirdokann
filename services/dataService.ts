import { supabase } from './supabaseClient';

import { supabase } from './supabaseClient';


// এগুলো যোগ করুন, অন্য ফাইলের ক্রস দূর হবে
export type Purchase = { id?: string; user_id?: string; date: string; type: string; pieces: number; kg: number; rate: number; total: number; created_at?: string; };
export type Sale = { id?: string; user_id?: string; date: string; type: string; pieces: number; kg: number; rate: number; total: number; mortality: number; created_at?: string; };
export type Expense = { id?: string; user_id?: string; date: string; category: string; amount: number; note?: string; };
export type Due = { id?: string; user_id?: string; customer_name: string; amount: number; status: string; };
export type CashLog = { id?: string; user_id?: string; date: string; amount: number; type: 'in' | 'out'; };
export type LotArchive = { id?: string; user_id?: string; type: string; total_purchase: number; total_sale: number; profit: number; pieces_at_reset: number; date: string; };



export const DataService = {
  // ডাটা আনার ফাংশনগুলো
  async getPurchases(): Promise<Purchase[]> {
    const { data } = await supabase.from('purchases').select('*').order('date', { ascending: false });
    return data || [];
  },

  async getSales(): Promise<Sale[]> {
    const { data } = await supabase.from('sales').select('*').order('date', { ascending: false });
    return data || [];
  },

  async getExpenses(): Promise<Expense[]> {
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    return data || [];
  },

  async getDues(): Promise<Due[]> {
    const { data } = await supabase.from('dues').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async getCashLogs(): Promise<CashLog[]> {
    const { data } = await supabase.from('cash_logs').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async getResets() {
    const { data } = await supabase.from('resets').select('type, reset_at');
    const resetMap: { [key: string]: string } = {};
    data?.forEach(r => { resetMap[r.type] = r.reset_at; });
    return resetMap;
  },

  async getLotHistory(): Promise<LotArchive[]> {
    const { data } = await supabase.from('lot_archive').select('*').order('date', { ascending: false });
    return data || [];
  },

  // লট রিসেট ফাংশন
  async resetLot(type: string, currentStock: any, totalPurchase: number, totalSale: number) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const profit = totalSale - totalPurchase;

    // আর্কাইভ করা
    await supabase.from('lot_archive').insert([{
      user_id: session.user.id,
      type,
      total_purchase: totalPurchase,
      total_sale: totalSale,
      profit,
      pieces_at_reset: currentStock.pieces || 0,
      date: new Date().toISOString()
    }]);

    // রিসেট টাইম আপডেট
    const { data: existing } = await supabase.from('resets').select('id').eq('user_id', session.user.id).eq('type', type).single();
    if (existing) {
      await supabase.from('resets').update({ reset_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('resets').insert([{ user_id: session.user.id, type, reset_at: new Date().toISOString() }]);
    }
  },

  // স্টক ক্যালকুলেশন
  calculateStock(purchases: Purchase[], sales: Sale[]) {
    const stock: { [key: string]: { pieces: number; kg: number; dead: number } } = {};
    purchases.forEach(p => {
      if (!stock[p.type]) stock[p.type] = { pieces: 0, kg: 0, dead: 0 };
      stock[p.type].pieces += Number(p.pieces) || 0;
      stock[p.type].kg += Number(p.kg) || 0;
    });
    sales.forEach(s => {
      if (!stock[s.type]) stock[s.type] = { pieces: 0, kg: 0, dead: 0 };
      stock[s.type].pieces -= (Number(s.pieces) || 0) + (Number(s.mortality) || 0);
      stock[s.type].kg -= Number(s.kg) || 0;
      stock[s.type].dead += Number(s.mortality) || 0;
    });
    return stock;
  }
};
