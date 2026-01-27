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
        const totalBuy = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
        const totalSell = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
        
        if (totalBuy === 0 && totalSell === 0) return;

        const { error: archiveError } = await supabase.from('lot_archives').insert([{
            user_id: user.id,
            type: type,
            total_purchase: totalBuy,
            total_sale: totalSell,
            profit: totalSell - totalBuy,
            date: new Date().toISOString()
        }]);
        
        if (archiveError) throw archiveError;

        await supabase.from('user_resets').upsert({ 
          user_id: user.id, 
          poultry_type: type, 
          last_reset_time: new Date().toISOString() 
        }, { onConflict: 'user_id, poultry_type' });

        showToast(`${type} -এর স্টক শেষ হওয়ায় হিসাবটি সংরক্ষণ করা হয়েছে।`, 'info');
    }
};

export const DataService = {
  // --- লগইন এবং ইউজার ---
  signUp: async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
  },
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signOut: async () => await supabase.auth.signOut(),
  getUser: async () => (await supabase.auth.getUser()).data.user,
  
  // --- ক্রয় (Purchase) ---
  getPurchases: async (): Promise<Purchase[]> => {
    const { data, error } = await supabase.from('purchases').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addPurchase: async (p: Omit<Purchase, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("লগইন প্রয়োজন");
    const { data, error } = await supabase.from('purchases').insert([{ ...p, user_id: user.id }]).select().single();
    if (error) throw error;
    await checkAndTriggerAutoSave(p.type);
    return data;
  },
  updatePurchase: async (p: Omit<Purchase, 'id' | 'created_at' | 'user_id'>, id: string) => {
    const { data: originalPurchase } = await supabase.from('purchases').select('is_credit, type').eq('id', id).single();
    const { data: originalCashLog } = await supabase.from('cash_logs').select('id').like('note', `%[ref:purchase:${id}]%`).single();
    const { error } = await supabase.from('purchases').update(p).eq('id', id);
    if (error) throw error;

    const wasCash = !originalPurchase?.is_credit;
    const isNowCash = !p.is_credit;
    if (wasCash && !isNowCash && originalCashLog) {
      await supabase.from('cash_logs').delete().eq('id', originalCashLog.id);
    } else if (isNowCash) {
      const cashLogData = { amount: p.total, date: p.date, note: `মাল ক্রয়: ${p.type} [ref:purchase:${id}]` };
      if (originalCashLog) await supabase.from('cash_logs').update(cashLogData).eq('id', originalCashLog.id);
      else await DataService.addCashLog({ type: 'WITHDRAW', ...cashLogData });
    }
    await checkAndTriggerAutoSave(p.type);
  },
  deletePurchase: async (id: string) => {
    const { data: purchaseToDelete } = await supabase.from('purchases').select('type, is_credit').eq('id', id).single();
    if (purchaseToDelete && !purchaseToDelete.is_credit) {
      const { data: cashLog } = await supabase.from('cash_logs').select('id').like('note', `%[ref:purchase:${id}]%`).single();
      if (cashLog) await supabase.from('cash_logs').delete().eq('id', cashLog.id);
    }
    await supabase.from('purchases').delete().eq('id', id);
    if (purchaseToDelete) await checkAndTriggerAutoSave(purchaseToDelete.type);
  },

  // --- বিক্রয় (Sales) ---
  getSales: async (): Promise<Sale[]> => {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addSale: async (s: Omit<Sale, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("লগইন প্রয়োজন");
    const { data, error } = await supabase.from('sales').insert([{ ...s, user_id: user.id }]).select().single();
    if (error) throw error;
    await checkAndTriggerAutoSave(s.type);
    return data;
  },
  updateSale: async (s: Omit<Sale, 'id' | 'created_at' | 'user_id'>, id: string) => {
    const { data: originalCashLog } = await supabase.from('cash_logs').select('id').like('note', `%[ref:sale:${id}]%`).single();
    const { error } = await supabase.from('sales').update(s).eq('id', id);
    if (error) throw error;
    const cashLogData = { amount: s.total, date: s.date, note: `বিক্রয় থেকে আয়: ${s.type} [ref:sale:${id}]` };
    if (originalCashLog) await supabase.from('cash_logs').update(cashLogData).eq('id', originalCashLog.id);
    else await DataService.addCashLog({ type: 'ADD', ...cashLogData });
    await checkAndTriggerAutoSave(s.type);
  },
  deleteSale: async (id: string) => {
    const { data: saleToDelete } = await supabase.from('sales').select('type').eq('id', id).single();
    const { data: cashLog } = await supabase.from('cash_logs').select('id').like('note', `%[ref:sale:${id}]%`).single();
    if (cashLog) await supabase.from('cash_logs').delete().eq('id', cashLog.id);
    await supabase.from('sales').delete().eq('id', id);
    if (saleToDelete) await checkAndTriggerAutoSave(saleToDelete.type);
  },

  // --- খরচ ও ক্যাশ (Expense & Cash) ---
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addExpense: async (e: Omit<Expense, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("লগইন প্রয়োজন");
    await supabase.from('expenses').insert([{ ...e, user_id: user.id }]);
  },
  getDues: async (): Promise<DueRecord[]> => {
    const { data, error } = await supabase.from('dues').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  getCashLogs: async (): Promise<CashLog[]> => {
    const { data, error } = await supabase.from('cash_logs').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addCashLog: async (c: Omit<CashLog, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("লগইন প্রয়োজন");
    await supabase.from('cash_logs').insert([{ ...c, user_id: user.id }]);
  },

  // --- রিপোর্ট ও স্টক হিসাব ---
  getLotHistory: async (): Promise<LotArchive[]> => {
    const { data, error } = await supabase.from('lot_archives').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  getResets: async () => {
    const { data } = await supabase.from('user_resets').select('poultry_type, last_reset_time');
    return (data || []).reduce((acc: any, curr: any) => {
      acc[curr.poultry_type] = curr.last_reset_time;
      return acc;
    }, {});
  },

  calculateStock: (purchases: Purchase[], sales: Sale[]) => {
    const stock: any = {};
    const safePurchases = Array.isArray(purchases) ? purchases : [];
    const safeSales = Array.isArray(sales) ? sales : [];

    POULTRY_TYPES.forEach(t => stock[t] = { pieces: 0, kg: 0, dead: 0 });

    safePurchases.forEach(p => {
      if (p && stock[p.type]) {
        stock[p.type].pieces += Number(p.pieces) || 0;
        stock[p.type].kg += Number(p.kg) || 0;
      }
    });

    safeSales.forEach(s => {
      if (s && stock[s.type]) {
        stock[s.type].pieces -= (Number(s.pieces) || 0) + (Number(s.mortality) || 0);
        stock[s.type].dead += Number(s.mortality) || 0;
      }
    });
    return stock;
  }
};
