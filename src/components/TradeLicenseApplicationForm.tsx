import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnionSettings } from '../context/UnionSettingsContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { CertificateApplication, Transaction } from '../types';
import { 
  toBengaliNumber, 
  generateTrackingId, 
  formatCurrencyBn, 
  numberToWordsBn, 
  numberToWordsEn 
} from '../utils/bengali';
import { cleanDataForFirestore } from '../utils/firestore';
import { clearCurrentApplicationData, setCurrentApplicationData, getCurrentApplicationData } from '../utils/currentApplication';
import { syncPermanentFromPresent, type AddressFields } from '../utils/addressSync';
import { 
  Building2, 
  Briefcase, 
  User, 
  MapPin, 
  Calculator, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft, 
  Camera, 
  Coins, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface TradeLicenseApplicationFormProps {
  onSuccess?: (app: CertificateApplication) => void;
  onCancel?: () => void;
}

export const TradeLicenseApplicationForm: React.FC<TradeLicenseApplicationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { currentUser, userProfile } = useAuth();
  const { settings } = useUnionSettings();

  // ----------------------------------------------------
  // Section 1: অফিসিয়াল তথ্য (Official Information)
  // ----------------------------------------------------
  const currentYear = new Date().getFullYear();
  const defaultFiscalYear = `${currentYear}-${currentYear + 1}`;
  const [fiscalYear, setFiscalYear] = useState<string>(defaultFiscalYear);

  // ----------------------------------------------------
  // Section 2: ব্যবসায়িক তথ্য (Business Information)
  // ----------------------------------------------------
  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('মুদি ও স্টেশনারি');
  const [businessCapital, setBusinessCapital] = useState<number>(200000);
  const [businessStartDate, setBusinessStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showCapitalOnPrint, setShowCapitalOnPrint] = useState<boolean>(true);
  const [businessAddress, setBusinessAddress] = useState<string>('');

  // ----------------------------------------------------
  // Section 3: মালিকের তথ্য (Owner Information)
  // ----------------------------------------------------
  const [ownerName, setOwnerName] = useState<string>(userProfile?.name || '');
  const [ownerFatherOrHusbandName, setOwnerFatherOrHusbandName] = useState<string>('');
  const [ownerMotherName, setOwnerMotherName] = useState<string>('');
  const [businessNature, setBusinessNature] = useState<string>('একক মালিকানা');
  const [ownerNidOrBirth, setOwnerNidOrBirth] = useState<string>('');
  const [tinNumber, setTinNumber] = useState<string>('');
  const [ownerMobile, setOwnerMobile] = useState<string>(userProfile?.phone || '');
  const [ownerPhotoDataUrl, setOwnerPhotoDataUrl] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState<string>('');

  // ----------------------------------------------------
  // Section 4: লাইভ ঠিকানা কপি সিস্টেম (Address Auto-Sync)
  // ----------------------------------------------------
  const [presentAddress, setPresentAddress] = useState<AddressFields>({
    holdingNo: '',
    village: '',
    wardNo: '০১',
    postOffice: settings.postOffice || 'হালসা-৭০৩১',
    upazila: settings.upazila || 'মিরপুর',
    district: settings.district || 'কুষ্টিয়া'
  });

  const [sameAsPresent, setSameAsPresent] = useState<boolean>(true);

  const [permanentAddress, setPermanentAddress] = useState<AddressFields>({
    holdingNo: '',
    village: '',
    wardNo: '০১',
    postOffice: settings.postOffice || 'হালসা-৭০৩১',
    upazila: settings.upazila || 'মিরপুর',
    district: settings.district || 'কুষ্টিয়া'
  });

  // Handle live synchronization when present address fields change
  const updatePresentField = (field: keyof AddressFields, value: string) => {
    setPresentAddress(prev => {
      const updated = { ...prev, [field]: value };
      if (sameAsPresent) {
        setPermanentAddress(syncPermanentFromPresent(updated));
      }
      return updated;
    });
  };

  const updatePermanentField = (field: keyof AddressFields, value: string) => {
    setPermanentAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleSameAddress = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      setPermanentAddress(syncPermanentFromPresent(presentAddress));
    }
  };

  // Sync default business address from village/ward if empty
  useEffect(() => {
    if (!businessAddress && presentAddress.village) {
      setBusinessAddress(`${presentAddress.village}, ওয়ার্ড নং ${presentAddress.wardNo}, ${presentAddress.postOffice}`);
    }
  }, [presentAddress.village, presentAddress.wardNo, presentAddress.postOffice, businessAddress]);

  // ----------------------------------------------------
  // Section 5: মেয়াদ ও ফি (Auto Calculations)
  // ----------------------------------------------------
  const [validityStart, setValidityStart] = useState<string>(`${currentYear}-07-01`);
  const [validityEnd, setValidityEnd] = useState<string>(`${currentYear + 1}-06-30`);
  const [licenseFee, setLicenseFee] = useState<number>(500);
  const [professionTax, setProfessionTax] = useState<number>(200);
  const [tradeTax, setTradeTax] = useState<number>(0);

  // Auto-calculated VAT (15% of license fee)
  const vatAmount = Math.round(licenseFee * 0.15);

  // Auto sum: License Fee + VAT + Profession Tax + Trade Tax
  const totalAmount = licenseFee + vatAmount + (professionTax || 0) + (tradeTax || 0);

  // ----------------------------------------------------
  // Form State & Feedback
  // ----------------------------------------------------
  const [declarationAgreed, setDeclarationAgreed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle Photo File Upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        alert('ছবির আকার সর্বোচ্চ ২০০ কেবি হতে হবে (Photo must be under 200 KB)');
        return;
      }
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOwnerPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentUser) {
      setErrorMessage('আবেদন সম্পন্ন করতে অনুগ্রহ করে সাইন ইন করুন');
      return;
    }

    if (!businessName.trim()) {
      setErrorMessage('ব্যবসা প্রতিষ্ঠানের নাম পূরণ করুন');
      return;
    }

    if (!ownerName.trim()) {
      setErrorMessage('মালিকের নাম পূরণ করুন');
      return;
    }

    if (!ownerFatherOrHusbandName.trim()) {
      setErrorMessage('মালিকের পিতা/স্বামীর নাম পূরণ করুন');
      return;
    }

    if (!ownerMotherName.trim()) {
      setErrorMessage('মালিকের মাতার নাম পূরণ করুন');
      return;
    }

    if (!ownerNidOrBirth.trim()) {
      setErrorMessage('এনআইডি অথবা জন্ম নিবন্ধন নম্বর পূরণ করুন');
      return;
    }

    if (!presentAddress.village.trim()) {
      setErrorMessage('বর্তমান ঠিকানার গ্রাম/মহল্লা পূরণ করুন');
      return;
    }

    const applicationFee = 2.0; // Portal issuance fee
    const currentBalance = userProfile?.balance ?? 0;
    if (currentBalance < applicationFee) {
      setErrorMessage(`আপনার ওয়ালেটে অপর্যাপ্ত ব্যালেন্স রয়েছে (বর্তমান ব্যালেন্স: ${formatCurrencyBn(currentBalance)})। সরকারি আবেদন ফি ${formatCurrencyBn(applicationFee)} পরিশোধ করতে ওয়ালেটে ব্যালেন্স রিচার্জ করুন।`);
      return;
    }

    setIsSubmitting(true);

    try {
      const trackingId = generateTrackingId('TRD');
      const appId = `app_trd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();
      const userDocRef = doc(db, 'users', currentUser.uid);
      const appDocRef = doc(db, 'applications', appId);

      const finalPermanent = sameAsPresent ? syncPermanentFromPresent(presentAddress) : permanentAddress;

      const newApplication: CertificateApplication = {
        id: appId,
        trackingId,
        userId: currentUser.uid,
        userName: ownerName.trim(),
        userEmail: currentUser.email || '',
        certificateType: 'trade_license',
        certificateTitleBn: 'ট্রেড লাইসেন্স',
        certificateTitleEn: 'Trade License',
        language: 'bn',

        // Applicant & Owner
        applicantNameBn: ownerName.trim(),
        applicantNameEn: ownerName.trim(),
        fatherName: ownerFatherOrHusbandName.trim(),
        motherName: ownerMotherName.trim(),
        ownerName: ownerName.trim(),
        ownerFatherOrHusbandName: ownerFatherOrHusbandName.trim(),
        ownerMotherName: ownerMotherName.trim(),
        ownerNidOrBirth: ownerNidOrBirth.trim(),
        nidOrBirthReg: ownerNidOrBirth.trim(),
        tinNumber: tinNumber.trim() || undefined,
        ownerPhotoUrl: ownerPhotoDataUrl || undefined,
        mobile: ownerMobile.trim() || userProfile?.phone || '০১৭০০-০০০০০০',
        gender: 'male',
        maritalStatus: 'বিবাহিত',

        // Business Fields
        fiscalYear: fiscalYear.trim() || defaultFiscalYear,
        businessName: businessName.trim(),
        businessType: businessType.trim(),
        businessNature: businessNature.trim(),
        businessCapital: Number(businessCapital) || 0,
        businessStartDate: businessStartDate || undefined,
        showCapitalOnPrint: Boolean(showCapitalOnPrint),
        businessAddress: businessAddress.trim() || `${presentAddress.village}, ${presentAddress.postOffice}`,

        // Present Address
        holdingNo: presentAddress.holdingNo?.trim() || undefined,
        presentVillage: presentAddress.village.trim(),
        presentWard: presentAddress.wardNo,
        presentPost: presentAddress.postOffice.trim(),
        presentUpazila: presentAddress.upazila.trim(),
        presentDistrict: presentAddress.district.trim(),
        village: presentAddress.village.trim(),
        wardNo: presentAddress.wardNo,
        postOffice: presentAddress.postOffice.trim(),

        // Permanent Address
        permanentVillage: finalPermanent.village.trim(),
        permanentWard: finalPermanent.wardNo,
        permanentPost: finalPermanent.postOffice.trim(),
        permanentUpazila: finalPermanent.upazila.trim(),
        permanentDistrict: finalPermanent.district.trim(),

        // Fees & Validity
        validityStart,
        validityEnd,
        licenseFee: Number(licenseFee) || 0,
        vatAmount: Number(vatAmount) || 0,
        professionTax: Number(professionTax) || 0,
        tradeTax: Number(tradeTax) || 0,
        totalAmount: Number(totalAmount) || 0,

        // Status & Administration
        fee: applicationFee,
        status: 'Approved',
        issuingOfficer: `চেয়ারম্যান, ${settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'}`,
        createdAt: nowIso,
        approvedAt: nowIso
      };

      // Atomic Transaction: Deduct wallet fee + store application + log transaction
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User record not found');
        }

        const currentBal = userDoc.data()?.balance ?? 0;
        if (currentBal < applicationFee) {
          throw new Error('Insufficient balance');
        }

        const newBalance = Number((currentBal - applicationFee).toFixed(2));

        // Deduct
        transaction.update(userDocRef, {
          balance: newBalance,
          updatedAt: nowIso
        });

        clearCurrentApplicationData();
        const unified = setCurrentApplicationData(newApplication);

        // Insert Application
        const cleanedApp = cleanDataForFirestore({
          ...unified,
          createdAtServer: serverTimestamp()
        });
        transaction.set(appDocRef, cleanedApp);

        // Insert Transaction
        const trxId = `trx_${Date.now()}`;
        const trxRef = doc(db, 'transactions', trxId);
        const trxData: Transaction = {
          id: trxId,
          userId: currentUser.uid,
          type: 'fee_deduction',
          amount: applicationFee,
          balanceAfter: newBalance,
          description: `ট্রেড লাইসেন্স আবেদন ফি কর্তন (লাইসেন্স নং: ${trackingId})`,
          referenceId: appId,
          createdAt: nowIso
        };
        transaction.set(trxRef, cleanDataForFirestore(trxData));
      });

      setSuccessMessage(`ট্রেড লাইসেন্স সফলভাবে ইস্যু ও অনুমোদিত হয়েছে! লাইসেন্স নং: ${trackingId}`);

      if (onSuccess) {
        const unified = getCurrentApplicationData() || newApplication;
        onSuccess(unified);
      }
    } catch (err: any) {
      console.error('Error submitting trade license application:', err);
      handleFirestoreError(err, OperationType.WRITE, 'applications');
      setErrorMessage(err.message || 'ট্রেড লাইসেন্স আবেদন প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-bangla">
      {/* Top Banner Header with Forest Green Theme */}
      <div className="bg-[#006A4E] text-white p-5 sm:p-6 border-b border-[#005C36]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  ট্রেড লাইসেন্স আবেদন ফরম
                </h2>
                <span className="bg-emerald-800 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-600/50">
                  TRADE LICENSE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
                {settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'} • ব্যবসা পরিচালনা অনুমতিপত্র
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>পূর্বের তালিকায় ফিরুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">সতর্কতা:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold">{successMessage}</p>
          </div>
        )}

        {/* ========================================================
            Section 1: অফিসিয়াল তথ্য (Official Information)
            ======================================================== */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
            <span className="w-1.5 h-6 bg-[#006A4E] rounded-full"></span>
            <h3 className="text-base font-bold text-[#006A4E] flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>সেকশন ১: অফিসিয়াল তথ্য</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                অর্থবছর (Fiscal Year) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="যেমন: 2026-2027"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 font-medium transition"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                চলতি অর্থবছরের মেয়াদকাল নির্দেশ করে (যেমন: ২০২৬-২০২৭)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                লাইসেন্স কর্তৃপক্ষ
              </label>
              <input
                type="text"
                disabled
                value={settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                আবেদন প্রক্রিয়া
              </label>
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>তাৎক্ষণিক অনলাইন অনুমোদন ও ডিজিটাল কপি</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            Section 2: ব্যবসায়িক তথ্য (Business Information)
            ======================================================== */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
            <span className="w-1.5 h-6 bg-[#006A4E] rounded-full"></span>
            <h3 className="text-base font-bold text-[#006A4E] flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>সেকশন ২: ব্যবসায়িক তথ্য</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ব্যবসা প্রতিষ্ঠানের নাম */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ব্যবসা প্রতিষ্ঠানের নাম <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="যেমন: মেসার্স আমবাড়ীয়া ট্রেডার্স / জননী এন্টারপ্রাইজ *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-semibold transition"
              />
            </div>

            {/* ব্যবসায়ের ধরন */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ব্যবসায়ের ধরন <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="যেমন: মুদি ও মনোহরী, ওষুধ ব্যবসা, খাদ্যশস্য *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            {/* ব্যবসার মূলধন (টাকা) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ব্যবসার মূলধন (টাকা) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={businessCapital || ''}
                  onChange={(e) => setBusinessCapital(Number(e.target.value))}
                  placeholder="যেমন: ২০০০০০ *"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg pl-8 pr-3 py-2 text-sm text-slate-900 font-semibold transition"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">৳</span>
              </div>
            </div>

            {/* ব্যবসা শুরুর তারিখ */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ব্যবসা শুরুর তারিখ
              </label>
              <input
                type="date"
                value={businessStartDate}
                onChange={(e) => setBusinessStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            {/* Checkbox: প্রিন্টে মূলধন দেখাবে */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-emerald-50/80 hover:bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 w-full transition">
                <input
                  type="checkbox"
                  checked={showCapitalOnPrint}
                  onChange={(e) => setShowCapitalOnPrint(e.target.checked)}
                  className="w-4 h-4 text-[#006A4E] rounded border-slate-300 focus:ring-[#006A4E] cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-950">
                  প্রিন্টে মূলধন দেখাবে (Show Capital on Certificate)
                </span>
              </label>
            </div>

            {/* প্রতিষ্ঠানের ঠিকানা */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                প্রতিষ্ঠানের ঠিকানা <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="যেমন: আমবাড়ীয়া বাজার, ওয়ার্ড নং ০১, ডাকঘর: হালসা, উপজেলা: মিরপুর, জেলা: কুষ্টিয়া"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            Section 3: মালিকের তথ্য (Owner Information)
            ======================================================== */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
            <span className="w-1.5 h-6 bg-[#006A4E] rounded-full"></span>
            <h3 className="text-base font-bold text-[#006A4E] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>সেকশন ৩: মালিকের তথ্য</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* মালিকের নাম */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মালিকের নাম <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="মালিকের পূর্ণ নাম *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 font-semibold transition"
              />
            </div>

            {/* পিতা/স্বামীর নাম */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                পিতা/স্বামীর নাম <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerFatherOrHusbandName}
                onChange={(e) => setOwnerFatherOrHusbandName(e.target.value)}
                placeholder="পিতা অথবা স্বামীর নাম *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            {/* মাতার নাম */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মাতার নাম <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerMotherName}
                onChange={(e) => setOwnerMotherName(e.target.value)}
                placeholder="মাতার নাম *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            {/* ব্যবসায় প্রকৃতি */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ব্যবসায় প্রকৃতি <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={businessNature}
                onChange={(e) => setBusinessNature(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 font-medium transition"
              >
                <option value="একক মালিকানা">একক মালিকানা (Sole Proprietorship)</option>
                <option value="যৌথ / অংশীদারি">যৌথ / অংশীদারি (Partnership)</option>
                <option value="প্রাইভেট লিমিটেড কোম্পানি">প্রাইভেট লিমিটেড কোম্পানি (Private Ltd)</option>
                <option value="পাবলিক লিমিটেড কোম্পানি">পাবলিক লিমিটেড কোম্পানি (Public Ltd)</option>
                <option value="সমবায় সমিতি">সমবায় সমিতি (Cooperative)</option>
                <option value="অন্যান্য">অন্যান্য (Other)</option>
              </select>
            </div>

            {/* এনআইডি/জন্ম নিবন্ধন */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                এনআইডি / জন্ম নিবন্ধন নম্বর <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerNidOrBirth}
                onChange={(e) => setOwnerNidOrBirth(e.target.value)}
                placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি বা জন্ম নিবন্ধন *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 font-mono transition"
              />
            </div>

            {/* টিন (ঐচ্ছিক) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ই-টিন নম্বর (TIN - ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="১২ ডিজিটের ই-টিন নম্বর"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 font-mono transition"
              />
            </div>

            {/* মোবাইল নম্বর */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মোবাইল নম্বর <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value)}
                placeholder="০১XXXXXXXXX *"
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] focus:ring-1 focus:ring-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 font-mono transition"
              />
            </div>

            {/* মালিকের ছবি (ঐচ্ছিক) */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মালিকের ছবি (ঐচ্ছিক - সর্বোচ্চ ২০০ কেবি)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="trade-license-photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="trade-license-photo"
                  className="cursor-pointer bg-white border border-slate-300 hover:border-[#006A4E] rounded-lg px-4 py-2 text-xs text-slate-700 flex items-center gap-2 transition"
                >
                  <Camera className="w-4 h-4 text-[#006A4E]" />
                  <span>{photoFileName || 'ছবি নির্বাচন করুন (Choose Photo)'}</span>
                </label>
                {ownerPhotoDataUrl && (
                  <div className="w-9 h-9 rounded-lg border border-emerald-400 overflow-hidden shadow-2xs">
                    <img src={ownerPhotoDataUrl} alt="Owner" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            Section 4: লাইভ ঠিকানা কপি সিস্টেম (Address Auto-Sync)
            ======================================================== */}
        <div className="bg-[#EBF7F2] p-4 sm:p-5 rounded-2xl border border-emerald-300 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-6 bg-[#006A4E] rounded-full"></span>
              <h3 className="text-base font-bold text-[#006A4E] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>সেকশন ৪: লাইভ ঠিকানা কপি সিস্টেম (Address Auto-Sync)</span>
              </h3>
            </div>

            {/* Interactive Checkbox: স্থায়ী ঠিকানা বর্তমান ঠিকানার মতোই */}
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-emerald-300 px-3 py-1.5 rounded-lg shadow-2xs select-none hover:bg-emerald-50 transition">
              <input
                type="checkbox"
                checked={sameAsPresent}
                onChange={(e) => handleToggleSameAddress(e.target.checked)}
                className="w-4 h-4 text-[#006A4E] rounded border-slate-300 focus:ring-[#006A4E] cursor-pointer"
              />
              <span className="text-xs font-bold text-emerald-950">
                স্থায়ী ঠিকানা বর্তমান ঠিকানার মতোই (Auto-Sync)
              </span>
            </label>
          </div>

          {/* Part A: মালিকের বর্তমান ঠিকানা */}
          <div>
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>মালিকের বর্তমান ঠিকানা (Present Address)</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">হোল্ডিং/বাড়ি নং</label>
                <input
                  type="text"
                  value={presentAddress.holdingNo || ''}
                  onChange={(e) => updatePresentField('holdingNo', e.target.value)}
                  placeholder="যেমন: ১২/ক"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">গ্রাম/মহল্লা/সড়ক *</label>
                <input
                  type="text"
                  required
                  value={presentAddress.village}
                  onChange={(e) => updatePresentField('village', e.target.value)}
                  placeholder="গ্রাম বা সড়কের নাম *"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ওয়ার্ড নং *</label>
                <select
                  value={presentAddress.wardNo}
                  onChange={(e) => updatePresentField('wardNo', e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-md px-2 py-1.5 text-xs text-slate-900"
                >
                  {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map((w) => (
                    <option key={w} value={w}>ওয়ার্ড {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ডাকঘর *</label>
                <input
                  type="text"
                  required
                  value={presentAddress.postOffice}
                  onChange={(e) => updatePresentField('postOffice', e.target.value)}
                  placeholder="ডাকঘর *"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">উপজেলা ও জেলা</label>
                <input
                  type="text"
                  disabled
                  value={`${presentAddress.upazila}, ${presentAddress.district}`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-md px-2 py-1.5 text-[11px] text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Part B: মালিকের স্থায়ী ঠিকানা */}
          <div className="pt-2 border-t border-emerald-200/80">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                <span>মালিকের স্থায়ী ঠিকানা (Permanent Address)</span>
              </span>
              {sameAsPresent && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100/90 font-bold px-2 py-0.5 rounded border border-emerald-300">
                  ✓ বর্তমান ঠিকানার সাথে লাইভ সংযুক্ত
                </span>
              )}
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">হোল্ডিং/বাড়ি নং</label>
                <input
                  type="text"
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentAddress.holdingNo : permanentAddress.holdingNo}
                  onChange={(e) => updatePermanentField('holdingNo', e.target.value)}
                  placeholder="হোল্ডিং নং"
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">গ্রাম/মহল্লা/সড়ক *</label>
                <input
                  type="text"
                  required
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentAddress.village : permanentAddress.village}
                  onChange={(e) => updatePermanentField('village', e.target.value)}
                  placeholder="গ্রাম বা সড়কের নাম *"
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ওয়ার্ড নং *</label>
                <select
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentAddress.wardNo : permanentAddress.wardNo}
                  onChange={(e) => updatePermanentField('wardNo', e.target.value)}
                  className={`w-full border rounded-md px-2 py-1.5 text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                >
                  {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map((w) => (
                    <option key={w} value={w}>ওয়ার্ড {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ডাকঘর *</label>
                <input
                  type="text"
                  required
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentAddress.postOffice : permanentAddress.postOffice}
                  onChange={(e) => updatePermanentField('postOffice', e.target.value)}
                  placeholder="ডাকঘর *"
                  className={`w-full border rounded-md px-2.5 py-1.5 text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">উপজেলা ও জেলা</label>
                <input
                  type="text"
                  disabled={sameAsPresent}
                  value={`${sameAsPresent ? presentAddress.upazila : permanentAddress.upazila}, ${sameAsPresent ? presentAddress.district : permanentAddress.district}`}
                  onChange={(e) => updatePermanentField('upazila', e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-md px-2 py-1.5 text-[11px] text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            Section 5: মেয়াদ ও ফি (Auto Calculations)
            ======================================================== */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
            <span className="w-1.5 h-6 bg-[#006A4E] rounded-full"></span>
            <h3 className="text-base font-bold text-[#006A4E] flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>সেকশন ৫: মেয়াদ ও সরকারি ফি (Auto Calculations)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* মেয়াদ শুরু */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মেয়াদ শুরু <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={validityStart}
                onChange={(e) => setValidityStart(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            {/* মেয়াদ শেষ */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মেয়াদ শেষ <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={validityEnd}
                onChange={(e) => setValidityEnd(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-lg px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            {/* লাইসেন্স ফি (টাকা) */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                লাইসেন্স ফি (টাকা) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={licenseFee || ''}
                  onChange={(e) => setLicenseFee(Number(e.target.value))}
                  placeholder="যেমন: ৫০০"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-lg pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 transition"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">৳</span>
              </div>
            </div>

            {/* ভ্যাট (১৫%) Auto calculated */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ভ্যাট (১৫% - স্বয়ংক্রিয় গণনাকৃত)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={`${formatCurrencyBn(vatAmount)} (${toBengaliNumber(vatAmount)} টাকা)`}
                  className="w-full bg-emerald-50/80 border border-emerald-300 rounded-lg px-3 py-2 text-sm font-bold text-emerald-900 cursor-not-allowed"
                />
              </div>
            </div>

            {/* পেশা কর */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                পেশা কর (Profession Tax)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={professionTax || ''}
                  onChange={(e) => setProfessionTax(Number(e.target.value))}
                  placeholder="যেমন: ২০০"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-lg pl-8 pr-3 py-2 text-sm text-slate-900 transition"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">৳</span>
              </div>
            </div>

            {/* বাণিজ্যিক কর */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                বাণিজ্যিক কর (Trade Tax)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={tradeTax || ''}
                  onChange={(e) => setTradeTax(Number(e.target.value))}
                  placeholder="যেমন: ০"
                  className="w-full bg-white border border-slate-300 focus:border-[#006A4E] rounded-lg pl-8 pr-3 py-2 text-sm text-slate-900 transition"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">৳</span>
              </div>
            </div>
          </div>

          {/* Auto sum: Total Amount Summary Card */}
          <div className="mt-4 bg-[#006A4E] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs uppercase text-emerald-200 tracking-wider font-bold block">
                মোট পরিশোধযোগ্য টাকা (Total Amount)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                {formatCurrencyBn(totalAmount)}
              </div>
              <div className="text-xs text-emerald-100 font-semibold mt-1">
                কথায়: {numberToWordsBn(totalAmount)}
              </div>
            </div>

            <div className="text-right text-xs text-emerald-200 space-y-0.5">
              <div>লাইসেন্স ফি: ৳ {toBengaliNumber(licenseFee)}</div>
              <div>ভ্যাট (১৫%): ৳ {toBengaliNumber(vatAmount)}</div>
              <div>পেশা কর: ৳ {toBengaliNumber(professionTax)}</div>
              <div>বাণিজ্যিক কর: ৳ {toBengaliNumber(tradeTax)}</div>
            </div>
          </div>
        </div>

        {/* Declaration Box */}
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={declarationAgreed}
              onChange={(e) => setDeclarationAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#006A4E] rounded border-slate-300 focus:ring-[#006A4E] cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
              আমি এই মর্মে অঙ্গীকার করছি যে, উপরে বর্ণিত তথ্যাবলী সম্পূর্ণ সত্য ও নির্ভুল। যেকোনো সময় আমার প্রদত্ত তথ্য অসত্য প্রমাণিত হলে ট্রেড লাইসেন্স বাতিল বলে গণ্য হবে এবং আইনানুগ ব্যবস্থা গ্রহণ করা যাবে।
            </span>
          </label>
        </div>

        {/* Submit Button Section */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>পোর্টাল প্রসেসিং ফি: <b>২.০০ টাকা</b> (তাৎক্ষণিক অনুমোদন ও ডিজিটাল প্রিন্ট কপি প্রস্তুত)</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !declarationAgreed}
            className="w-full sm:w-auto cursor-pointer bg-[#006A4E] hover:bg-[#005C36] disabled:opacity-50 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>ট্রেড লাইসেন্স ইস্যু হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>আবেদন জমা দিন (Submit Application)</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
