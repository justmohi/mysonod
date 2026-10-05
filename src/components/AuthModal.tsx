import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BdGovernmentSeal } from './OfficialLogos';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { login, loginOperator, signup, loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOperatorLogin, setIsOperatorLogin] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isOperatorLogin) {
        await loginOperator(email, password);
      } else if (isSignUp) {
        if (!name.trim()) throw new Error('দয়া করে আপনার পূর্ণ নাম লিখুন');
        if (password.length < 6) throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
        await signup(name, email, password, phone);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে পুনরায় চেষ্টা করুন।';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'এই ইমেইল দিয়ে পূর্বেই একাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'পাসওয়ার্ড আরও শক্তিশালী করুন (কমপক্ষে ৬ অক্ষর)।';
      } else if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Firebase কনসোলে Email/Password সাইন-ইন সক্রিয় করা নেই। অনুগ্রহ করে নিচে "Google দিয়ে সরাসরি সাইন ইন" বোতামে ক্লিক করুন।';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Professional Header & Branding */}
        <div className="bg-[#006a4e] text-white px-6 pt-7 pb-6 text-center relative shadow-inner">
          <div className="flex justify-center mb-3">
            <div className="p-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 shadow-md">
              <BdGovernmentSeal className="w-16 h-16 drop-shadow-sm" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-serif">
            ই-প্রত্যয়ন পোর্টাল
          </h2>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            ১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ ডিজিটাল সেন্টার
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold text-emerald-50">
            {isOperatorLogin ? 'ইউনিয়ন উদ্যোক্তা লগইন' : 'নাগরিক সেবা লগইন'}
          </div>
          <p className="text-[11px] text-emerald-200/90 font-normal mt-0.5">
            মিরপুর, কুষ্টিয়া
          </p>
        </div>

        {/* Login mode switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onClick={() => {
              setIsOperatorLogin(false);
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold text-center transition cursor-pointer ${
              !isOperatorLogin ? 'text-emerald-800 border-b-2 border-[#006a4e] bg-white font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            নাগরিক লগইন
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOperatorLogin(true);
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold text-center transition cursor-pointer ${
              isOperatorLogin ? 'text-amber-800 border-b-2 border-amber-500 bg-white font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            উদ্যোক্তা লগইন
          </button>
        </div>

        {!isOperatorLogin && (
          <div className="flex border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold text-center transition cursor-pointer ${
                !isSignUp ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              লগইন
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold text-center transition cursor-pointer ${
                isSignUp ? 'text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              নতুন নিবন্ধন
            </button>
          </div>
        )}
        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isOperatorLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition shadow-2xs text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="আপনার মোবাইল নম্বর লিখুন"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition shadow-2xs text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ইমেইল এড্রেস <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল এড্রেস লিখুন"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition shadow-2xs text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition shadow-2xs text-gray-800 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full py-2.5 px-4 bg-[#006a4e] hover:bg-[#084d34] text-white font-bold rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-70 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isOperatorLogin ? 'উদ্যোক্তা লগইন করুন' : (isSignUp ? 'একাউন্ট তৈরি করুন' : 'পোর্টালে প্রবেশ করুন')}</span>
                </>
              )}
            </button>
          </form>

          {/* Google Sign-in: citizens only */}
          {!isOperatorLogin && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={loading}
              className="cursor-pointer w-full py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-2.5 shadow-2xs active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Google দিয়ে সরাসরি সাইন ইন</span>
            </button>
          </div>
          )}
        </div>

        {/* Footer Security / Government Notice */}
        <div className="bg-gray-50 border-t border-gray-200/80 py-3 px-4 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            কারিগরি সহায়তায়: ইউনিয়ন ডিজিটাল সেন্টার | গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
          </p>
        </div>
      </div>
    </div>
  );
};
