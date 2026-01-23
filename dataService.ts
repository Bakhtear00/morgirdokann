import { Purchase, Sale, DueRecord, Expense, CashLog, LotArchive } from '../types';
import { POULTRY_TYPES } from '../constants.tsx';
import { supabase } from './supabaseClient';

const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
};

const checkAndTriggerAutoSave = async (type: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: resetsData } = await supabase.from('user_resets').select('last_reset_time').eq('user_id', user.id).eq('poultry_type', type).single();
    const lastSaveTime = resetsData ? new Date(resetsData.last_reset_time).toISOString() : new Date(0).toISOString();

    const { data: purchases } = await supabase.from('purchases').select('pieces, total').eq('user_id', user.id).eq('type', type).gt('created_at', lastSaveTime);
    const { data: sales } = await supabase.from('sales').select('pieces, mortality, total').eq('user_id', user.id).eq('type', type).gt('created_at', lastSaveTime);

    if (!purchases || !sales) return;

    const totalPurchasePieces = purchases.reduce((sum, p) => sum + (Number(p.pieces) || 0), 0);
    const totalSaleAndDeadPieces = sales.reduce((sum, s) => sum + (Number(s.pieces) || 0) + (Number(s.mortality) || 0), 0);
    
    if ((totalPurchasePieces > 0) && (totalPurchasePieces - totalSaleAndDeadPieces <= 0)) {
        const totalBuy = purchases.reduce((sum, p) => sum + p.total, 0);
        const totalSell = sales.reduce((sum, s) => sum + s.total, 0);
        
        if (totalBuy === 0 && totalSell === 0) return;

        const newHistoryEntry = {
            user_id: user.id,
            type: type,
            total_purchase: totalBuy,
            total_sale: totalSell,
            profit: totalSell - totalBuy
        };
        
        const { error: archiveError } = await supabase.from('lot_archives').insert([newHistoryEntry]);
        if (archiveError) throw archiveError;

        const { error: resetError } = await supabase.from('user_resets').upsert({ user_id: user.id, poultry_type: type, last_reset_time: new Date().toISOString() }, { onConflict: 'user_id, poultry_type' });
        if (resetError) throw resetError;

        showToast(`${type} -এর স্টক শেষ হওয়ায় লটের হিসাবটি স্বয়ংক্রিয়ভাবে সেভ হয়েছে।`, 'info');
    }
};

export const DataService = {
  // --- Auth ---
  signUp: async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
  },
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if(error) throw error;
  },
  signOut: async () => await supabase.auth.signOut(),
  getUser: async () => (await supabase.auth.getUser()).data.user,
  
  // --- Setup Check ---
  checkDbSetup: async () => {
    try {
        // Try to query a table that should exist.
        // limit(0) makes it a very cheap query.
        const { error } = await supabase.from('purchases').select('id').limit(0);
        // If an error occurs (e.g., table not found), it will be caught.
        return !error;
    } catch (e) {
        return false;
    }
  },

  // --- Data Access ---
  getPurchases: async (): Promise<Purchase[]> => {
    const { data, error } = await supabase.from('purchases').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  addPurchase: async (p: Omit<Purchase, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const { error } = await supabase.from('purchases').insert([{ ...p, user_id: user.id }]);
    if (error) throw error;
    await checkAndTriggerAutoSave(p.type);
  },
  updatePurchase: async (p: Omit<Purchase, 'id' | 'created_at' | 'user_id'>, id: string) => {
    const { error } = await supabase.from('purchases').update(p).eq('id', id);
    if (error) throw error;
    await checkAndTriggerAutoSave(p.type);
  },
  deletePurchase: async (id: string) => {
    const { data } = await supabase.from('purchases').select('type').eq('id', id).single();
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) throw error;
    if(data) await checkAndTriggerAutoSave(data.type);
  },

  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  addSale: async (s: Omit<Sale, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const { error } = await supabase.from('sales').insert([{ ...s, user_id: user.id }]);
    if (error) throw error;
    await checkAndTriggerAutoSave(s.type);
  },
  updateSale: async (s: Omit<Sale, 'id' | 'created_at' | 'user_id'>, id: string) => {
    const { error } = await supabase.from('sales').update(s).eq('id', id);
    if (error) throw error;
    await checkAndTriggerAutoSave(s.type);
  },
  deleteSale: async (id: string) => {
    const { data } = await supabase.from('sales').select('type').eq('id', id).single();
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    if(data) await checkAndTriggerAutoSave(data.type);
  },
  
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  addExpense: async (e: Omit<Expense, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const { error } = await supabase.from('expenses').insert([{ ...e, user_id: user.id }]);
    if (error) throw error;
  },
  updateExpense: async (e: Omit<Expense, 'id' | 'created_at' | 'user_id'>, id: string) => {
    const { error } = await supabase.from('expenses').update(e).eq('id', id);
    if (error) throw error;
  },
  deleteExpense: async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },

  getDues: async (): Promise<DueRecord[]> => {
    const { data, error } = await supabase.from('dues').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  addDue: async (d: Omit<DueRecord, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const { error } = await supabase.from('dues').insert([{ ...d, user_id: user.id }]);
    if (error) throw error;
  },
  updateDue: async (d: Partial<Omit<DueRecord, 'id' | 'created_at' | 'user_id'>>, id: string) => {
    const { error } = await supabase.from('dues').update(d).eq('id', id);
    if (error) throw error;
  },
  deleteDue: async (id: string) => {
    const { error } = await supabase.from('dues').delete().eq('id', id);
    if (error) throw error;
  },

  getCashLogs: async (): Promise<CashLog[]> => {
    const { data, error } = await supabase.from('cash_logs').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  addCashLog: async (c: Omit<CashLog, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const { error } = await supabase.from('cash_logs').insert([{ ...c, user_id: user.id }]);
    if (error) throw error;
  },
  updateCashLog: async (c: Omit<CashLog, 'id'|'created_at'|'user_id'>, id: string) => {
    const { error } = await supabase.from('cash_logs').update(c).eq('id', id);
    if (error) throw error;
  },
  deleteCashLog: async (id: string) => {
    const { error } = await supabase.from('cash_logs').delete().eq('id', id);
    if (error) throw error;
  },

  getLotHistory: async (): Promise<LotArchive[]> => {
    const { data, error } = await supabase.from('lot_archives').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  getResets: async (): Promise<{ [key: string]: string }> => {
    const { data, error } = await supabase.from('user_resets').select('poultry_type, last_reset_time');
    if (error) throw error;
    return data.reduce((acc, curr) => {
      acc[curr.poultry_type] = curr.last_reset_time;
      return acc;
    }, {});
  },

  calculateStock: (purchases: Purchase[], sales: Sale[]) => {
    const stockByType: { [key: string]: { pieces: number; kg: number; dead: number; } } = {};
    POULTRY_TYPES.forEach(type => stockByType[type] = { pieces: 0, kg: 0, dead: 0 });
    purchases.forEach(p => {
      stockByType[p.type].pieces += Number(p.pieces) || 0;
      stockByType[p.type].kg += Number(p.kg) || 0;
    });
    sales.forEach(s => {
      stockByType[s.type].pieces -= (Number(s.pieces) || 0) + (Number(s.mortality) || 0);
      stockByType[s.type].dead += Number(s.mortality) || 0;
    });
    return stockByType;
  }
};