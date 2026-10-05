import React, { useState } from 'react';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toBengaliNumber, formatCurrencyBn } from '../utils/bengali';
import { 
  Settings, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Save, 
  LogOut, 
  HelpCircle, 
  PhoneCall, 
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

import { UnionSettingsManager } from './UnionSettingsManager';
import { useUnionSettings } from '../context/UnionSettingsContext';

export const SettingsView: React.FC = () => {
  const { currentUser, userProfile, isAdmin, toggleAdminMode, logout } = useAuth();
  const { settings } = useUnionSettings();

  const [activeTab, setActiveTab] = useState<'profile' | 'union_settings'>(isAdmin ? 'union_settings' : 'profile');
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [savedMsg, setSavedMsg] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setSavedMsg(false);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString()
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Settings Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              {isAdmin ? 'প্রশাসনিক ও নাগরিক সেটিংস' : 'ব্যবহারকারী প্রোফাইল'}
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              সেটিংস ও কনফিগারেশন
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin 
                ? 'ইউনিয়ন পরিষদের প্রাতিষ্ঠানিক তথ্য, সনদ হেডার এবং ব্যক্তিগত প্রোফাইল নিয়ন্ত্রণ' 
                : 'আপনার ব্যক্তিগত তথ্য হালনাগাদ ও ইউনিয়ন পরিষদ সেবা সংক্রান্ত তথ্যাবলী'}
            </p>
          </div>

          {isAuthorizedAdminEmail(currentUser?.email) ? (
            <button
              onClick={toggleAdminMode}
              className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-xs bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-600"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>মোড: {isAdmin ? 'ইউপি প্রশাসক (Admin) - নাগরিক মোডে যান' : 'নাগরিক ভিউ - এডমিন মোডে ফিরুন'}</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border bg-emerald-50 text-emerald-800 border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ভূমিকা: সাধারণ সেবাগ্রহীতা (User)</span>
            </div>
          )}
        </div>

        {/* Admin Tab Switcher */}
        {isAdmin && (
          <div className="flex gap-2 mt-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('union_settings')}
              className={`cursor-pointer pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'union_settings'
                  ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>ইউনিয়ন ও পোর্টাল সেটিংস (Union Settings)</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`cursor-pointer pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>ব্যক্তিগত প্রোফাইল (Personal Profile)</span>
            </button>
          </div>
        )}
      </div>

      {isAdmin && activeTab === 'union_settings' ? (
        <UnionSettingsManager />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card & Form */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-700" />
              <span>ব্যক্তিগত তথ্য হালনাগাদ</span>
            </h3>

          {savedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পূর্ণ নাম (বাংলা বা ইংরেজি)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইমেইল এড্রেস (অপরিবর্তনযোগ্য)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>লগ আউট</span>
              </button>
            </div>
          </form>
        </div>

        {/* Union Info & Citizen Charter */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">ইউনিয়ন পরিষদ পরিচিতি</h3>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <div>
              <span className="text-slate-400 block font-semibold">পরিষদের নাম:</span>
              <span className="font-bold text-slate-900">{settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">অবস্থান:</span>
              <span>ডাকঘর: {settings.postOffice || 'হালসা-৭০৩১'}, উপজেলা: {settings.upazila || 'মিরপুর'}, জেলা: {settings.district || 'কুষ্টিয়া'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">সরকারি সেবা ফি:</span>
              <span className="font-bold text-emerald-800">২.০০ টাকা (ই-প্রত্যয়ন সনদ)</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">যোগাযোগ ও হেল্পলাইন:</span>
              <span className="font-mono font-bold text-slate-800">{settings.mobileNumber || '০১৭৪১-১৮৫৭৬৫'}</span>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 mt-4 leading-relaxed">
            <strong className="block mb-1 text-emerald-950 font-bold">ই-প্রত্যয়ন নির্দেশিকা:</strong>
            ডিজিটাল বাংলাদেশ থেকে স্মার্ট বাংলাদেশ বিনির্মাণে ইউনিয়ন পরিষদের সকল সনদপত্র এখন অনলাইনে স্বয়ংক্রিয়ভাবে ডাউনলোড ও কিউআর কোডের মাধ্যমে সত্যতা নিশ্চিত করা যায়।
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
