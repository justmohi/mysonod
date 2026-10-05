import React, { useState, useEffect } from 'react';
import { useUnionSettings } from '../context/UnionSettingsContext';
import { useAuth } from '../context/AuthContext';
import type { UnionSettings } from '../types';
import { BdGovernmentSeal, UnionCouncilSeal, WatermarkShapla } from './OfficialLogos';
import { 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Image as ImageIcon, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  Eye,
  Upload,
  Trash2
} from 'lucide-react';

export const UnionSettingsManager: React.FC = () => {
  const { settings, updateSettings, resetToDefault, uploadLogo, removeLogo } = useUnionSettings();
  const { userProfile, isOperator } = useAuth();

  const [formState, setFormState] = useState<UnionSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync formState when settings change externally
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleChange = (field: keyof UnionSettings, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  // Upload custom union branding directly to Firebase Cloud Storage.
  const handleFileUpload = async (
    field: 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl',
    file: File | null
  ) => {
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsSaving(true);
      const url = await uploadLogo(field, file, userProfile?.name || 'ইউনিয়ন উদ্যোক্তা');
      setFormState(prev => ({ ...prev, [field]: url }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'ফাইলটি Firebase Storage-এ সংরক্ষণ করা যায়নি');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetLogo = async (
    field: 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl'
  ) => {
    try {
      setErrorMessage(null);
      setIsSaving(true);
      await removeLogo(field, userProfile?.name || 'ইউনিয়ন উদ্যোক্তা');
      setFormState(prev => ({ ...prev, [field]: '' }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'লোগো রিমুভ করা যায়নি');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.unionName.trim()) {
      setErrorMessage('ইউনিয়নের নাম আবশ্যক');
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateSettings(formState, userProfile?.name || 'এডমিন কর্মকর্তা');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'সেটিংস সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সকল ইউনিয়ন তথ্য ডিফল্ট মানে ফিরিয়ে আনতে চান?')) {
      setIsSaving(true);
      try {
        await resetToDefault(userProfile?.name || 'এডমিন কর্মকর্তা');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } catch (err: any) {
        setErrorMessage(err.message || 'রিসেট করতে ব্যর্থ হয়েছে');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>ডাইনামিক ইউপি কনফিগারেশন মডিউল</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-700" />
              <span>ইউনিয়ন ও পোর্টাল সেটিংস (Union Settings)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              এখানে পরিবর্তিত যেকোনো তথ্য (ইউনিয়নের নাম, চেয়ারম্যানের নাম, মোবাইল, ডাকঘর ও কাস্টম লোগো) অবিলম্বে সকল সনদপত্র, প্রিভিউ এবং শীর্ষ পোর্টাল হেডারে কার্যকর হবে.{isOperator && ' এই তথ্য শুধু আপনার উদ্যোক্তা অ্যাকাউন্টের ইউনিয়ন workspace-এ সংরক্ষিত হবে।'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="cursor-pointer px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
              title="ডিফল্ট মানে ফিরিয়ে আনুন"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>ডিফল্ট রিকভার</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">ইউনিয়ন সেটিংস সফলভাবে ক্লাউডে সংরক্ষিত হয়েছে এবং সনদে লাইভ কার্যকর করা হয়েছে!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Live Preview Card */}
      <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-xs border-2 border-emerald-700/40 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-emerald-700/20 pb-2 mb-3">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-700" />
            <span>সনদপত্র হেডার লাইভ প্রিভিউ (Live Header Preview)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">লাইভ আপডেট</span>
        </div>

        {/* Background Watermark in Live Preview */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
          {formState.watermarkLogoUrl ? (
            <img src={formState.watermarkLogoUrl} alt="Watermark Preview" className="w-28 h-28 object-contain" />
          ) : (
            <WatermarkShapla className="w-28 h-28" />
          )}
        </div>

        <div className="relative z-10 flex items-start justify-between gap-3 text-center py-2">
          {/* Top Left Logo Preview */}
          <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white/70 rounded-lg border border-slate-200">
            {formState.govtLogoUrl ? (
              <img 
                src={formState.govtLogoUrl} 
                alt="Govt Logo" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <BdGovernmentSeal className="w-14 h-14" />
            )}
          </div>

          {/* Center Text Stack */}
          <div className="flex-1 px-2">
            <h4 className="text-xs font-bold text-red-700">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h4>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0d5c3a] mt-0.5">
              {formState.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'}
            </h3>
            <p className="text-xs text-slate-800 font-medium">
              ডাকঘর: {formState.postOffice || 'হালসা-৭০৩১'}, উপজেলা: {formState.upazila || 'মিরপুর'}, জেলা: {formState.district || 'কুষ্টিয়া'}।
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] text-slate-700 mt-1">
              <span>চেয়ারম্যান: <strong className="text-emerald-950 font-bold">{formState.chairmanName || 'মোঃ সাইফুদ্দিন মন্ডল'}</strong></span>
              <span>•</span>
              <span>ইমেইল: <strong className="font-mono">{formState.officialEmail || 'udc.ambaria@gmail.com'}</strong></span>
              <span>•</span>
              <span>মোবাইল: <strong className="font-mono">{formState.mobileNumber || '০১৭৪১-১৮৫৭৬৫'}</strong></span>
            </div>
          </div>

          {/* Top Right Logo Preview */}
          <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white/70 rounded-lg border border-slate-200">
            {formState.unionLogoUrl ? (
              <img 
                src={formState.unionLogoUrl} 
                alt="Union Logo" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <UnionCouncilSeal className="w-14 h-14" />
            )}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section A: Union & Regional Information */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              ক
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ইউনিয়ন ও আঞ্চলিক ভৌগোলিক তথ্য (Union & Regional Information)
              </h3>
              <p className="text-xs text-slate-500">
                সনদের শীর্ষ টাইটেল এবং ঠিকানা ধারায় প্রদর্শিত এলাকার নাম
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ইউনিয়নের নাম (বাংলায়) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.unionName}
                onChange={(e) => handleChange('unionName', e.target.value)}
                placeholder="যেমন: ১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ইউনিয়নের নাম (ইংরেজিতে)
              </label>
              <input
                type="text"
                value={formState.unionNameEn || ''}
                onChange={(e) => handleChange('unionNameEn', e.target.value)}
                placeholder="e.g. 12 NO. AMBARIYA UNION PARISHAD"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ডাকঘর (Post Office - বাংলায়) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.postOffice}
                onChange={(e) => handleChange('postOffice', e.target.value)}
                placeholder="যেমন: হালসা-৭০৩১"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ডাকঘর (Post Office - ইংরেজিতে)
              </label>
              <input
                type="text"
                value={formState.postOfficeEn || ''}
                onChange={(e) => handleChange('postOfficeEn', e.target.value)}
                placeholder="e.g. Halsa-7031"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                উপজেলা (Upazila - বাংলায়) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.upazila}
                onChange={(e) => handleChange('upazila', e.target.value)}
                placeholder="যেমন: মিরপুর"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                উপজেলা (Upazila - ইংরেজিতে)
              </label>
              <input
                type="text"
                value={formState.upazilaEn || ''}
                onChange={(e) => handleChange('upazilaEn', e.target.value)}
                placeholder="e.g. Mirpur"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জেলা (District - বাংলায়) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.district}
                onChange={(e) => handleChange('district', e.target.value)}
                placeholder="যেমন: কুষ্টিয়া"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জেলা (District - ইংরেজিতে)
              </label>
              <input
                type="text"
                value={formState.districtEn || ''}
                onChange={(e) => handleChange('districtEn', e.target.value)}
                placeholder="e.g. Kushtia"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section B: Authority & Contact Information */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              খ
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                কর্তৃপক্ষ ও যোগাযোগ তথ্য (Authority & Contact Information)
              </h3>
              <p className="text-xs text-slate-500">
                চেয়ারম্যানের নাম, সীলমোহর ও সরকারি যোগাযোগের তথ্যসমূহ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                চেয়ারম্যানের নাম (বাংলায়) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.chairmanName}
                  onChange={(e) => handleChange('chairmanName', e.target.value)}
                  placeholder="যেমন: মোঃ সাইফুদ্দিন মন্ডল"
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                চেয়ারম্যানের নাম (ইংরেজিতে)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.chairmanNameEn || ''}
                  onChange={(e) => handleChange('chairmanNameEn', e.target.value)}
                  placeholder="e.g. Md. Saifuddin Mukul"
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                চেয়ারম্যান/অফিস মোবাইল নং <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  placeholder="যেমন: ০১৭৪১-১৮৫৭৬৫"
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিসিয়াল ইমেইল (Official Email) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formState.officialEmail}
                  onChange={(e) => handleChange('officialEmail', e.target.value)}
                  placeholder="যেমন: udc.ambaria@gmail.com"
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section C: Direct Logo & Watermark File Upload */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              গ
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                লোগো ও জলছাপ সরাসরি আপলোড (Direct Logo & Watermark File Upload)
              </h3>
              <p className="text-xs text-slate-500">
                কম্পিউটার বা ডিভাইস থেকে সরাসরি ইমেজ ফাইল আপলোড করুন (PNG, JPG, SVG, WebP)। আপলোডের পর এটি আপনার ইউনিয়ন workspace-এর সকল সনদপত্রে লাইভ যুক্ত হবে।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* 1. Government Emblem (Top Left) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                {formState.govtLogoUrl ? (
                  <img 
                    src={formState.govtLogoUrl} 
                    alt="Govt Logo Preview" 
                    className="max-w-full max-h-full object-contain" 
                  />
                ) : (
                  <BdGovernmentSeal className="w-12 h-12" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার লোগো (Government Emblem - Top Left)
                  </label>
                  {formState.govtLogoUrl ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      কাস্টম লোগো সংরক্ষিত (Saved)
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      ডিফল্ট ভেক্টর সিল সক্রিয়
                    </span>
                  )}
                </div>

                {/* Direct File Upload & Reset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition active:scale-98">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>নতুন লোগো আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileUpload('govtLogoUrl', file);
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleResetLogo('govtLogoUrl')}
                    disabled={!formState.govtLogoUrl}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-2 text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="ডিফল্ট অফিশিয়াল লোগোতে ফিরে যান"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ডিফল্ট লোগো রিমুভ / রিসেট</span>
                  </button>
                </div>


              </div>
            </div>

            {/* 2. Union Council Logo (Top Right) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                {formState.unionLogoUrl ? (
                  <img 
                    src={formState.unionLogoUrl} 
                    alt="Union Logo Preview" 
                    className="max-w-full max-h-full object-contain" 
                  />
                ) : (
                  <UnionCouncilSeal className="w-12 h-12" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    ইউনিয়ন পরিষদ লোগো (Union Council Logo - Top Right)
                  </label>
                  {formState.unionLogoUrl ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      কাস্টম লোগো সংরক্ষিত (Saved)
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      ডিফল্ট ভেক্টর সিল সক্রিয়
                    </span>
                  )}
                </div>

                {/* Direct File Upload & Reset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition active:scale-98">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>নতুন লোগো আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileUpload('unionLogoUrl', file);
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleResetLogo('unionLogoUrl')}
                    disabled={!formState.unionLogoUrl}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-2 text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="ডিফল্ট অফিশিয়াল লোগোতে ফিরে যান"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ডিফল্ট লোগো রিমুভ / রিসেট</span>
                  </button>
                </div>


              </div>
            </div>

            {/* 3. Center Watermark Logo (Water Lily/Shapla) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                {formState.watermarkLogoUrl ? (
                  <img 
                    src={formState.watermarkLogoUrl} 
                    alt="Watermark Preview" 
                    className="max-w-full max-h-full object-contain opacity-50" 
                  />
                ) : (
                  <WatermarkShapla className="w-12 h-12 opacity-60" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    মাঝখানের জলছাপ লোগো (Center Watermark Logo - Water Lily/Shapla)
                  </label>
                  {formState.watermarkLogoUrl ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      কাস্টম জলছাপ সংরক্ষিত (Saved)
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      ডিফল্ট শাপলা জলছাপ সক্রিয়
                    </span>
                  )}
                </div>

                {/* Direct File Upload & Reset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition active:scale-98">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>নতুন জলছাপ আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileUpload('watermarkLogoUrl', file);
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleResetLogo('watermarkLogoUrl')}
                    disabled={!formState.watermarkLogoUrl}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-2 text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="ডিফল্ট অফিশিয়াল জলছাপে ফিরে যান"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ডিফল্ট লোগো রিমুভ / রিসেট</span>
                  </button>
                </div>


              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন (Save Settings)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
