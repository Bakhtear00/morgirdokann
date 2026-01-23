import React, { useState } from 'react';
import { Clipboard, Check, Database, AlertTriangle } from 'lucide-react';
import { BENGALI_TEXT } from '../constants.tsx';

interface DatabaseSetupGuideProps {
    onSetupComplete: () => void;
}

const SQL_SCRIPT = `-- 1. Create tables for your poultry app data

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT NOT NULL,
  pieces INT NOT NULL,
  kg NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  date DATE NOT NULL,
  is_credit BOOLEAN DEFAULT FALSE
);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT NOT NULL,
  pieces INT,
  kg NUMERIC,
  rate NUMERIC,
  mortality INT DEFAULT 0,
  total NUMERIC NOT NULL,
  date DATE NOT NULL,
  is_cash BOOLEAN DEFAULT TRUE
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  date DATE NOT NULL
);

CREATE TABLE dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  customer_name TEXT NOT NULL,
  mobile TEXT,
  address TEXT,
  amount NUMERIC NOT NULL,
  paid NUMERIC DEFAULT 0,
  date DATE NOT NULL
);

CREATE TABLE cash_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('OPENING', 'ADD', 'WITHDRAW')),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  denominations JSONB
);

CREATE TABLE lot_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT NOT NULL,
  total_purchase NUMERIC NOT NULL,
  total_sale NUMERIC NOT NULL,
  profit NUMERIC NOT NULL
);

CREATE TABLE user_resets (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    poultry_type TEXT NOT NULL,
    last_reset_time TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, poultry_type)
);

-- 2. Enable Row Level Security (RLS) for all tables
-- This ensures users can only access their own data.

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resets ENABLE ROW LEVEL SECURITY;

-- 3. Create policies to allow users to manage their own data

-- Purchases
CREATE POLICY "Allow users to manage their own purchases" ON purchases
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sales
CREATE POLICY "Allow users to manage their own sales" ON sales
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Allow users to manage their own expenses" ON expenses
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dues
CREATE POLICY "Allow users to manage their own dues" ON dues
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cash Logs
CREATE POLICY "Allow users to manage their own cash logs" ON cash_logs
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lot Archives
CREATE POLICY "Allow users to manage their own lot archives" ON lot_archives
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Resets
CREATE POLICY "Allow users to manage their own reset timestamps" ON user_resets
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`;

const DatabaseSetupGuide: React.FC<DatabaseSetupGuideProps> = ({ onSetupComplete }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(SQL_SCRIPT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-3xl border-2 border-yellow-200">
                <div className="text-center mb-6">
                    <Database className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-800">{BENGALI_TEXT.dbSetupTitle}</h1>
                    <p className="text-gray-500 mt-2">{BENGALI_TEXT.dbSetupInstructions}</p>
                </div>

                <div className="relative bg-gray-900 text-white p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-64 border border-gray-700">
                    <button onClick={copyToClipboard} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-xs">
                        {copied ? <Check size={14} /> : <Clipboard size={14} />}
                        {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
                    </button>
                    <pre><code>{SQL_SCRIPT}</code></pre>
                </div>
                
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                উপরের কোডটি রান করার পর, এই পেজটি রিফ্রেশ করতে নিচের বাটনে ক্লিক করুন।
                            </p>
                        </div>
                    </div>
                </div>

                <button onClick={onSetupComplete} className="mt-6 w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all">
                    সেটআপ সম্পন্ন হয়েছে, রিফ্রেশ করুন
                </button>
            </div>
        </div>
    );
};

export default DatabaseSetupGuide;
