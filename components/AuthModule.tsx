import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, User, Lock, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface AuthModuleProps {
  onAuthSuccess: () => void;
}

const AuthModule: React.FC<AuthModuleProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { showToast } = useToast();

  const secretSuffix = "_dokan"; 

const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // পাসওয়ার্ড মাস্কিং
  const finalPassword = password + secretSuffix;

  try {
    if (isLogin) {
      // ইউজারনেম দিয়ে প্রোফাইল থেকে ইমেইল খুঁজে আনা
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        throw new Error('এই ইউজারনেমটি পাওয়া যায়নি!');
      }

      // প্রাপ্ত ইমেইল দিয়ে লগইন
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: finalPassword,
      });

      if (loginError) throw new Error('পাসওয়ার্ড সঠিক নয়!');
      onAuthSuccess();
    } else {
      // নতুন আইডি খোলার সময়
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: finalPassword,
        options: {
          data: { username }
        }
      });

      if (signUpError) throw signUpError;
      showToast('আইডি তৈরি হয়েছে! এখন লগইন করুন।', 'success');
      setIsLogin(true);
    }
  } catch (error: any) {
    showToast(error.message, 'error');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              {isLogin ? <LogIn className="text-green-600" size={32} /> : <UserPlus className="text-green-600" size={32} />}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            {isLogin ? 'লগইন করুন' : 'নতুন আইডি খুলুন'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="আপনার ইমেইল"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ইউজারনেম"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="পাসওয়ার্ড (১ বা ২ সংখ্যার)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : isLogin ? 'লগইন করুন' : 'আইডি তৈরি করুন'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setUsername('');
                setPassword('');
              }} 
              className="text-green-600 font-semibold hover:underline"
            >
              {isLogin ? 'আইডি নেই? নতুন খুলুন' : 'আগে থেকেই আইডি আছে? লগইন করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModule;
