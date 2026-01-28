import React, { useState, useMemo } from 'react';
import { 
  Calculator, RotateCcw, Banknote, Save, History, 
  Edit2, Trash2
} from 'lucide-react';
import { NOTES, getLocalDateString } from '../constants.tsx';
import { DataService } from '../services/dataService';
import { CashLog } from '../types';
import HoldToDeleteButton from './HoldToDeleteButton';
import { useToast } from '../contexts/ToastContext';

interface DenominationModuleProps {
  cashLogs?: CashLog[]; // Optional করে দেওয়া হয়েছে যাতে ক্রাশ না করে
  refresh: () => void;
}

const DenominationModule: React.FC<DenominationModuleProps> = ({ cashLogs = [], refresh }) => {
  const [counts, setCounts] = useState<{ [key: number]: string }>(
    Object.fromEntries(NOTES.map(n => [n, '']))
  );
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const { addToast } = useToast();

  const systemBalance = useMemo(() => {
    // cashLogs খালি থাকলেও যাতে ক্রাশ না করে
    return (cashLogs || []).reduce((sum, log) => {
      if (log.id === editingLogId) return sum;
      if (log.type === 'WITHDRAW') return sum - (Number(log.amount) || 0);
      return sum + (Number(log.amount) || 0);
    }, 0);
  }, [cashLogs, editingLogId]);

  const physicalTotal = useMemo(() => {
    return NOTES.reduce((sum, note) => sum + (note * (Number(counts[note]) || 0)), 0);
  }, [counts]);

  const gap = physicalTotal - systemBalance;

  const historyList = useMemo(() => {
    return (cashLogs || []).filter(log => log.denominations && Object.keys(log.denominations).length > 0);
  }, [cashLogs]);

  const handleClear = () => {
    setCounts(Object.fromEntries(NOTES.map(n => [n, ''])));
    setEditingLogId(null);
    addToast('ফর্ম রিসেট করা হয়েছে।', 'info');
  };

  const handleInputChange = (note: number, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setCounts({ ...counts, [note]: value });
    }
  };

  const handleSave = async () => {
    if (physicalTotal <= 0) {
      addToast('অনুগ্রহ করে নোটের সংখ্যা লিখুন।', 'error');
      return;
    }

    const denominationsToSave = Object.fromEntries(
      Object.entries(counts).filter(([_, value]) => Number(value) > 0)
    );
    
    const logDate = getLocalDateString();
    const logData: Omit<CashLog, 'id'> = {
        type: gap >= 0 ? 'ADD' : 'WITHDRAW',
        amount: Math.abs(gap),
        date: logDate,
        note: gap === 0 ? 'ক্যাশ হিসাব মেলানো হয়েছে' : `ক্যাশ সমন্বয় (${gap > 0 ? 'বেশি' : 'কম'} ৳${Math.abs(gap).toLocaleString('bn-BD')})`,
        denominations: denominationsToSave as { [key: string]: string }
    };

    try {
      if (editingLogId) {
          await DataService.updateCashLog(logData, editingLogId);
          addToast('হিসাব আপডেট হয়েছে!', 'success');
      } else {
          await DataService.addCashLog(logData);
          addToast('ক্যাশ সেভ হয়েছে!', 'success');
      }
      setEditingLogId(null);
      setCounts(Object.fromEntries(NOTES.map(n => [n, ''])));
      refresh();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleEdit = (log: CashLog) => {
    if (log.denominations) {
        const initialCounts = Object.fromEntries(NOTES.map(n => [n, '']));
        const hydratedCounts = { ...initialCounts, ...log.denominations };
        setCounts(hydratedCounts);
        setEditingLogId(log.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await DataService.deleteCashLog(id);
      addToast('মুছা হয়েছে!', 'success');
      if (editingLogId === id) {
          setCounts(Object.fromEntries(NOTES.map(n => [n, ''])));
          setEditingLogId(null);
      }
      refresh();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <InfoCard title="ক্যাশ এ আছে" description="সিস্টেম ব্যালেন্স" amount={systemBalance} color="bg-blue-100 text-blue-800" />
          <InfoCard title="হাতে গুনে পাওয়া টাকা" description="আপনার ইনপুট দেওয়া হিসাব" amount={physicalTotal} color="bg-emerald-100 text-emerald-800" />
          <GapCard title="পার্থক্য" description="কম বা বেশি" gap={gap} />
        </div>

        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border-2 border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 border-b pb-4">
            <Calculator className="w-7 h-7 text-indigo-600" />
            {editingLogId ? 'হিসাব সংশোধন' : 'নোট গণনা করুন'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {NOTES.map(note => (
              <div key={note} className="bg-gray-50/70 p-3 rounded-xl border border-gray-200">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2 mb-1.5">
                  ৳{note.toLocaleString('bn-BD')}
                </label>
                <input
                  type="text" inputMode="numeric"
                  value={counts[note]}
                  onChange={(e) => handleInputChange(note, e.target.value)}
                  className="w-full bg-white text-center font-black text-lg py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-lg shadow-lg">
              <Save className="inline mr-2" size={20} /> সেভ করুন
            </button>
            <button onClick={handleClear} className="bg-gray-100 px-6 rounded-xl text-gray-600 font-bold">রিসেট</button>
          </div>
        </div>
      </div>
      
      {/* ইতিহাস টেবিল - এখানে সব বাংলায় দেওয়া আছে */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-gray-100">
        <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" /> পূর্বের হিসাব
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-black border-b text-left">
                <th className="px-4 py-3">তারিখ</th>
                <th className="px-4 py-3">বিবরণ</th>
                <th className="px-4 py-3 text-right">টাকা</th>
                <th className="px-4 py-3 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-4">{new Date(log.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-4 py-4">{log.note}</td>
                  <td className="px-4 py-4 text-right font-bold text-indigo-600">৳{log.amount.toLocaleString('bn-BD')}</td>
                  <td className="px-4 py-4 text-center space-x-2">
                    <button onClick={() => handleEdit(log)} className="text-blue-500"><Edit2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// কার্ড কম্পোনেন্টগুলো
const InfoCard = ({ title, description, amount, color }: any) => (
  <div className={`p-6 rounded-[2.5rem] shadow-sm ${color}`}>
    <p className="text-sm font-black uppercase">{title}</p>
    <p className="text-[10px] mb-2">{description}</p>
    <p className="text-4xl font-black text-right">৳{amount.toLocaleString('bn-BD')}</p>
  </div>
);

const GapCard = ({ title, gap }: any) => (
  <div className={`p-6 rounded-[2.5rem] shadow-sm ${gap >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    <p className="text-sm font-black uppercase">{title}</p>
    <p className="text-3xl font-black text-right">{gap >= 0 ? 'বেশি' : 'কম'} ৳{Math.abs(gap).toLocaleString('bn-BD')}</p>
  </div>
);

export default DenominationModule;
