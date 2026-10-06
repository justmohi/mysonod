import React from 'react';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { useUnionSettings } from '../context/UnionSettingsContext';
import { toBengaliNumber, formatCurrencyBn } from '../utils/bengali';
import { 
  PhoneCall, 
  Wallet, 
  PlusCircle, 
  Bell, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  Menu,
  Sparkles,
  Building2
} from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenMobileMenu: () => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenMobileMenu, currentView }) => {
  const { currentUser, userProfile, isAdmin, isOperator, logout, toggleAdminMode } = useAuth();
  const { settings } = useUnionSettings();

  const balance = userProfile?.balance ?? 0;
  const isBalanceLow = balance < 2.0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner with Union Name, Helpline, and Government Branding */}
      <div className="bg-[#0e6245] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-semibold tracking-wide flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-300 inline" />
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | <strong className="text-emerald-200">{settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'} ডিজিটাল সেন্টার</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-100 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
            <span>হেল্পলাইন: {settings.mobileNumber || '০১৭৪১-১৮৫৭৬৫'} </span>
          </div>

          {/* Admin Role Indicator / Toggle for Authorized Admin */}
          {currentUser && (
            isAuthorizedAdminEmail(currentUser.email) ? (
              <button
                onClick={toggleAdminMode}
                title="ভূমিকা পরিবর্তন করুন (নাগরিক প্রিভিউ / ইউপি প্রশাসক)"
                className="cursor-pointer px-2.5 py-0.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-300 font-semibold shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>মোড: {isAdmin ? 'ইউপি প্রশাসক (Admin)' : 'নাগরিক ভিউ (Preview)'}</span>
              </button>
            ) : (
              <div
                className="px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border bg-emerald-800 text-white border-emerald-500"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>মোড: {isOperator ? 'ইউনিয়ন উদ্যোক্তা (Operator)' : 'নাগরিক সেবা (User)'}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Notice Ticker Bar */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-1.5 flex items-center overflow-hidden text-xs text-emerald-950">
        <div className="flex items-center gap-1.5 font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded mr-3 shrink-0 uppercase tracking-wider text-[11px] animate-pulse">
          <Bell className="w-3 h-3" />
          <span>জরুরি নোটিশ</span>
        </div>
        <div className="relative overflow-hidden w-full whitespace-nowrap">
          <div className="notice-ticker inline-block text-emerald-900 font-medium">
            📢 MySonod পোর্টালে স্বাগতম! নাগরিকত্ব, চারিত্রিক, ওয়ারিশ, পারিবারিক ও আয়ের সনদ এবং ট্রেড লাইসেন্সের সরকারি ফি মাত্র ২/- (দুই) টাকা। আবেদন দাখিলের পূর্বে প্রয়োজনীয় ওয়ালেট ব্যালেন্স নিশ্চিত করুন। জরুরি প্রয়োজনে ০১৯৩১৩৭৯৪৯৭ বা ইউনিয়ন ডিজিটাল সেন্টারে যোগাযোগ করুন।
          </div>
        </div>
      </div>

      {/* Main Header Navigation Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & App Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
            aria-label="মেনু খুলুন"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div 
            onClick={() => onNavigate('dashboard')} 
            className="cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 border border-emerald-600">
              <span className="font-extrabold text-base tracking-tighter">MS</span>
            </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">MySonod</h1>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  {settings.unionName ? `${settings.unionName} ডিজিটাল সেন্টার` : 'ইউনিয়ন ডিজিটাল সেন্টার অনলাইন সেবা পোর্টাল'}
                </p>
              </div>
          </div>
        </div>

        {/* Right Side: Wallet Balance & User Profile */}
        <div className="flex items-center gap-3">
          {/* Real-time Wallet Balance Badge (Mandatory Requirement) */}
          <div className={`flex items-center rounded-xl p-1.5 pl-3 border transition-all ${
            isBalanceLow 
              ? 'bg-red-50 border-red-300 text-red-900 ring-2 ring-red-400/20' 
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2 mr-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isBalanceLow ? 'bg-red-200 text-red-700' : 'bg-emerald-600 text-white shadow-xs'
              }`}>
                <Wallet className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  ওয়ালেট ব্যালেন্স
                </span>
                <span className={`text-base font-extrabold tracking-tight ${
                  isBalanceLow ? 'text-red-600' : 'text-emerald-800'
                }`}>
                  {formatCurrencyBn(balance)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('add_balance')}
              className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-xs"
              title="ব্যালেন্স রিচার্জ করুন"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">এড ব্যালেন্স</span>
            </button>
          </div>

          {/* User Profile & Quick Actions */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="hidden lg:block text-right">
              <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                {userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'নাগরিক'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {isAdmin ? '🛡️ প্রশাসক' : isOperator ? '🏢 ইউনিয়ন উদ্যোক্তা' : '👤 নাগরিক'}
              </span>
            </div>

            <button
              onClick={() => onNavigate('settings')}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
              title="ব্যবহারকারী প্রোফাইল"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300">
                {(userProfile?.name || 'না')[0]}
              </div>
            </button>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="লগ আউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
