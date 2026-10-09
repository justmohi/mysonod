import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUnionSettings } from '../context/UnionSettingsContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  runTransaction, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import type { CertificateApplication, HeirItem, Transaction, CitizenProfile } from '../types';
import { toBengaliNumber, generateTrackingId, formatCurrencyBn, cleanNidNumber } from '../utils/bengali';
import { cleanDataForFirestore } from '../utils/firestore';
import { clearCurrentApplicationData, setCurrentApplicationData } from '../utils/currentApplication';
import { buildCitizenProfile, createCitizenProfileId } from '../utils/citizenProfile';
import { 
  Users, 
  Plus, 
  Trash2, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Camera, 
  Paperclip,
  ArrowLeft
} from 'lucide-react';

interface WarishApplicationFormProps {
  onSuccess?: (app: CertificateApplication) => void;
  onCancel?: () => void;
}

export const WarishApplicationForm: React.FC<WarishApplicationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { currentUser, userProfile } = useAuth();
  const { settings } = useUnionSettings();

  // 1. Deceased Person Information Fields (মৃত ব্যক্তির তথ্য)
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedIdType, setDeceasedIdType] = useState('জাতীয় পরিচয়পত্র');
  const [deceasedIdNumber, setDeceasedIdNumber] = useState('');
  const [guardianType, setGuardianType] = useState<'father' | 'husband'>('father');
  const [guardianName, setGuardianName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [village, setVillage] = useState('');
  const [wardNo, setWardNo] = useState('০১');
  const [postOffice, setPostOffice] = useState(settings.postOffice || 'হালসা-৭০৩১');
  const [deceasedDate, setDeceasedDate] = useState('');

  // Photo & Attachment Upload States
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);

  // 2. Applicant Information Fields (আবেদনকারীর তথ্য)
  const [applicantNameBn, setApplicantNameBn] = useState('');
  const [applicantNameEn, setApplicantNameEn] = useState('');
  const [applicantRelation, setApplicantRelation] = useState('ছেলে');
  const [applicantMobile, setApplicantMobile] = useState('');
  const [applicantNid, setApplicantNid] = useState('');

  // 3. Dynamic Warish List Table State
  const [heirs, setHeirs] = useState<HeirItem[]>([
    {
      name: '',
      relation: 'স্ত্রী',
      nidOrBirth: '',
      dob: '',
      age: '',
      remarks: 'আইনগত ওয়ারিশ'
    }
  ]);

  // 4. Applicant Declaration & Validation
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sharedProfileFound, setSharedProfileFound] = useState<CitizenProfile | null>(null);

  // Handle Photo Selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024) {
        alert('ছবির আকার সর্বোচ্চ ১০০ কেবি হতে হবে (Photo must be under 100 KB)');
        return;
      }
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Multiple Attachments Selection
  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (files.length > 5) {
        alert('সর্বোচ্চ ৫টি ফাইল সংযুক্ত করতে পারবেন (Maximum 5 attachments allowed)');
        return;
      }
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        names.push(files[i].name);
      }
      setAttachmentNames(names);
    }
  };

  // Dynamic Row Addition
  const handleAddHeir = () => {
    setHeirs(prev => [
      ...prev,
      {
        name: '',
        relation: 'ছেলে',
        nidOrBirth: '',
        dob: '',
        age: '',
        remarks: 'আইনগত ওয়ারিশ'
      }
    ]);
  };

  // Dynamic Row Removal
  const handleRemoveHeir = (index: number) => {
    if (heirs.length <= 1) {
      alert('কমপক্ষে একজন ওয়ারিশের তথ্য থাকা আবশ্যক (Minimum 1 heir is required)');
      return;
    }
    setHeirs(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dynamic Row Field Update
  const handleUpdateHeir = (index: number, field: keyof HeirItem, value: string) => {
    setHeirs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-compute age if DOB is selected
      if (field === 'dob' && value) {
        try {
          const birthDate = new Date(value);
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
          if (calculatedAge >= 0 && calculatedAge < 120) {
            updated[index].age = calculatedAge.toString();
          }
        } catch {
          // ignore date parse issues
        }
      }

      return updated;
    });
  };

  // Reuse only sanitized citizen identity/address data shared by NID.
  useEffect(() => {
    const rawNid = applicantNid.trim();
    let cancelled = false;

    if (cleanNidNumber(rawNid).length < 10) {
      setSharedProfileFound(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const profileId = await createCitizenProfileId(rawNid);
        if (!profileId) return;

        const snapshot = await getDoc(doc(db, 'citizen_profiles', profileId));
        if (!snapshot.exists() || cancelled) return;

        const profile = snapshot.data() as CitizenProfile;
        setSharedProfileFound(profile);

        setGuardianName(
          profile.guardianType === 'husband'
            ? profile.spouseName || ''
            : profile.fatherName || ''
        );
        setGuardianType(profile.guardianType === 'husband' ? 'husband' : 'father');
        setMotherName(profile.motherName || '');
        setApplicantMobile(profile.mobile || '');
        setVillage(profile.presentVillage || profile.village || '');
        setWardNo(profile.presentWard || profile.wardNo || wardNo);
        setPostOffice(profile.presentPost || profile.postOffice || '');
      } catch (err) {
        console.error('Warish shared NID profile lookup error:', err);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [applicantNid]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentUser) {
      setErrorMessage('আবেদন সম্পন্ন করতে অনুগ্রহ করে সাইন ইন করুন');
      return;
    }

    if (!declarationAgreed) {
      setErrorMessage('অনুগ্রহ করে অঙ্গীকারনামায় টিক চিহ্ন দিয়ে সম্মতি প্রদান করুন');
      return;
    }

    if (!deceasedName.trim()) {
      setErrorMessage('মৃত ব্যক্তির নাম লিখুন');
      return;
    }

    if (!village.trim()) {
      setErrorMessage('গ্রাম/মহল্লার নাম লিখুন');
      return;
    }

    // Validate Heirs: at least one heir must have a name
    const validHeirs = heirs.filter(h => h.name.trim() !== '');
    if (validHeirs.length === 0) {
      setErrorMessage('কমপক্ষে একজন ওয়ারিশের নাম উল্লেখ করুন');
      return;
    }

    const feeAmount = 2.0;
    const currentBalance = userProfile?.balance ?? 0;
    if (currentBalance < feeAmount) {
      setErrorMessage(`আপনার ওয়ালেটে অপর্যাপ্ত ব্যালেন্স রয়েছে (বর্তমান ব্যালেন্স: ${formatCurrencyBn(currentBalance)} টাকা)। উত্তরাধিকারী সনদের সরকারি ফি ${formatCurrencyBn(feeAmount)} টাকা পরিশোধ করতে ব্যালেন্স রিচার্জ করুন।`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Wipe previous stored application data completely to prevent stale state bleed
      clearCurrentApplicationData();

      const trackingId = generateTrackingId('inheritance');
      const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();
      const userDocRef = doc(db, 'users', currentUser.uid);
      const appDocRef = doc(db, 'applications', appId);
      const citizenProfileId = await createCitizenProfileId(applicantNid);
      const citizenProfileRef = citizenProfileId
        ? doc(db, 'citizen_profiles', citizenProfileId)
        : null;

      const finalApplicantNameBn = applicantNameBn.trim() || '-';
      const finalApplicantNameEn = '';
      const finalGuardianName = guardianName.trim() || '-';
      const finalMotherName = motherName.trim() || '-';
      const finalMobile = applicantMobile.trim();
      const finalApplicantRelation = applicantRelation.trim() || '-';
      const finalDeceasedIdNumber = deceasedIdNumber.trim() || '-';
      const finalDeceasedDate = deceasedDate || '-';

      const rawApplication: CertificateApplication = {
        id: appId,
        trackingId,
        userId: currentUser.uid,
        userName: applicantNameBn.trim() || deceasedName.trim(),
        userEmail: currentUser.email || '',
        certificateType: 'inheritance',
        certificateTitleBn: 'উত্তরাধিকারী সনদ',
        certificateTitleEn: 'Heir Certificate',
        language: 'bn',
        applicantNameBn: finalApplicantNameBn,
        applicantNameEn: finalApplicantNameEn,
        fatherName: finalGuardianName,
        motherName: finalMotherName,
        gender: 'male',
        maritalStatus: 'বিবাহিত',
        nidOrBirthReg: applicantNid.trim() || deceasedIdNumber.trim() || trackingId,
        mobile: finalMobile,
        applicantRelation: finalApplicantRelation,
        // Address
        presentVillage: village.trim(),
        presentWard: wardNo,
        presentPost: postOffice.trim(),
        presentUpazila: settings.upazila || 'মিরপুর',
        presentDistrict: settings.district || 'কুষ্টিয়া',
        permanentVillage: village.trim(),
        permanentWard: wardNo,
        permanentPost: postOffice.trim(),
        permanentUpazila: settings.upazila || 'মিরপুর',
        permanentDistrict: settings.district || 'কুষ্টিয়া',
        village: village.trim(),
        wardNo,
        postOffice: postOffice.trim(),
        // Deceased Specific Fields
        deceasedPersonName: deceasedName.trim(),
        deceasedDate: finalDeceasedDate,
        deceasedIdType: deceasedIdNumber.trim() ? deceasedIdType : '-',
        deceasedIdNumber: finalDeceasedIdNumber,
        deceasedFatherOrHusbandType: guardianType,
        deceasedFatherOrHusbandName: finalGuardianName,
        deceasedPhotoUrl: photoDataUrl || undefined,
        attachmentUrls: attachmentNames,
        heirs: validHeirs,
        fee: feeAmount,
        status: 'Approved',
        issuingOfficer: `চেয়ারম্যান, ${settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'}`,
        createdAt: nowIso,
        approvedAt: nowIso
      };

      // 2. Set as active unified application in global state / localStorage
      const unifiedApp = setCurrentApplicationData(rawApplication);

      // Firestore transaction: deduct fee + record application + record transaction
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User record not found');
        }

        const currentBal = userDoc.data()?.balance ?? 0;
        if (currentBal < feeAmount) {
          throw new Error('Insufficient balance');
        }

        const newBalance = Number((currentBal - feeAmount).toFixed(2));

        // 1. Deduct wallet
        transaction.update(userDocRef, {
          balance: newBalance,
          updatedAt: nowIso
        });

        // 2. Insert application
        const cleanedApp = cleanDataForFirestore({
          ...unifiedApp,
          createdAtServer: serverTimestamp()
        });
        transaction.set(appDocRef, cleanedApp);

        if (citizenProfileRef && citizenProfileId) {
          const citizenProfile = buildCitizenProfile(
            rawApplication,
            citizenProfileId,
            nowIso
          );
          transaction.set(
            citizenProfileRef,
            cleanDataForFirestore(citizenProfile),
            { merge: true }
          );
        }

        // 3. Insert transaction log
        const trxId = `trx_${Date.now()}`;
        const trxRef = doc(db, 'transactions', trxId);
        const trxData: Transaction = {
          id: trxId,
          userId: currentUser.uid,
          type: 'fee_deduction',
          amount: feeAmount,
          balanceAfter: newBalance,
          description: `উত্তরাধিকারী সনদ আবেদন ফি কর্তন (ট্র্যাকিং: ${trackingId})`,
          referenceId: appId,
          createdAt: nowIso
        };
        transaction.set(trxRef, cleanDataForFirestore(trxData));
      });

      setSuccessMessage(`উত্তরাধিকারী সনদ সফলভাবে দাখিল ও অনুমোদিত হয়েছে! ট্র্যাকিং নম্বর: ${trackingId}`);

      if (onSuccess) {
        onSuccess(unifiedApp);
      }
    } catch (err: any) {
      console.error('Error submitting warish application:', err);
      handleFirestoreError(err, OperationType.WRITE, 'applications');
      setErrorMessage(err.message || 'আবেদন দাখিলে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-bangla">
      {/* Form Header */}
      <div className="bg-[#09432f] text-white p-5 sm:p-6 border-b border-emerald-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                উত্তরাধিকারী সনদ আবেদন ফরম
              </h2>
              <p className="text-xs sm:text-sm text-emerald-300 mt-0.5">
                {settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ ডিজিটাল সেন্টার'}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>পূর্বের পাতায় ফিরুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">সতর্কতা:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-bold">{successMessage}</p>
          </div>
        )}

        {/* Section 1: মৃত ব্যক্তির তথ্য (Deceased Person Information) */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="text-base font-bold text-slate-900">
              মৃত ব্যক্তির তথ্য
            </h3>
          </div>

          {/* 3-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Row 1 - Column 1: মৃত ব্যক্তির নাম */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মৃত ব্যক্তির নাম <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                placeholder="নাম *"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition shadow-2xs"
              />
            </div>

            {/* Row 1 - Column 2: পরিচয়পত্র নির্বাচন করুন */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                পরিচয়পত্র নির্বাচন করুন
              </label>
              <div className="flex gap-1.5">
                <select
                  value={deceasedIdType}
                  onChange={(e) => setDeceasedIdType(e.target.value)}
                  className="w-1/2 bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-2 py-2 text-xs text-slate-900 font-semibold transition"
                >
                  <option value="জাতীয় পরিচয়পত্র">জাতীয় পরিচয়পত্র</option>
                  <option value="জন্ম নিবন্ধন">জন্ম নিবন্ধন</option>
                  <option value="মৃত্যু সনদ নং">মৃত্যু সনদ নং</option>
                </select>
                <input
                  type="text"
                  value={deceasedIdNumber}
                  onChange={(e) => setDeceasedIdNumber(e.target.value)}
                  placeholder="পরিচয়পত্র নম্বর (ঐচ্ছিক)"
                  className="w-1/2 bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-500 transition"
                />
              </div>
            </div>

            {/* Row 1 - Column 3: পিতা / স্বামী বেছে নিন */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                পিতা / স্বামী বেছে নিন
              </label>
              <div className="flex gap-1.5">
                <select
                  value={guardianType}
                  onChange={(e) => setGuardianType(e.target.value as 'father' | 'husband')}
                  className="w-28 bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-2 py-2 text-xs text-slate-900 font-semibold transition"
                >
                  <option value="father">পিতা</option>
                  <option value="husband">স্বামী</option>
                </select>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="পিতা/স্বামীর নাম (ঐচ্ছিক)"
                  className="flex-1 bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition"
                />
              </div>
            </div>

            {/* Row 2 - Column 1: মাতা */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মাতা:
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="মাতার নাম (ঐচ্ছিক)"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition"
              />
            </div>

            {/* Row 2 - Column 2: গ্রাম/মহল্লা */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                গ্রাম/মহল্লা <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="গ্রাম/মহল্লা *"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition"
              />
            </div>

            {/* Row 2 - Column 3: ওয়ার্ড */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ওয়ার্ড <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 font-medium transition"
              >
                {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map((w) => (
                  <option key={w} value={w}>ওয়ার্ড নং {w}</option>
                ))}
              </select>
            </div>

            {/* Row 3 - Column 1: ডাকঘর */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ডাকঘর: <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={postOffice}
                onChange={(e) => setPostOffice(e.target.value)}
                placeholder="ডাকঘর *"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition"
              />
            </div>

            {/* Row 3 - Column 2: ছবি (সম্প্রতি তোলা = 30-100 KB) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ছবি (সম্প্রতি তোলা = 30-100 KB)
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="w-full bg-[#E0FFFF] border border-cyan-800/40 hover:border-blue-600 rounded-md px-3 py-2 text-xs text-slate-700 flex items-center justify-between cursor-pointer transition"
                >
                  <span className="truncate max-w-[170px]">
                    {photoFileName || 'Choose File'}
                  </span>
                  <Camera className="w-4 h-4 text-cyan-800" />
                </label>
              </div>
            </div>

            {/* Row 3 - Column 3: সংযুক্তি (সর্বোচ্চ ৫টি, প্রতিটি ২০-৮০ কেবি) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                সংযুক্তি (সর্বোচ্চ ৫টি, প্রতিটি ২০-৮০ কেবি)
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="attachments-upload"
                  multiple
                  onChange={handleAttachmentsChange}
                  className="hidden"
                />
                <label
                  htmlFor="attachments-upload"
                  className="w-full bg-[#E0FFFF] border border-cyan-800/40 hover:border-blue-600 rounded-md px-3 py-2 text-xs text-slate-700 flex items-center justify-between cursor-pointer transition"
                >
                  <span className="truncate max-w-[170px]">
                    {attachmentNames.length > 0 ? `${attachmentNames.length} টি ফাইল সংযুক্ত` : 'Choose Files'}
                  </span>
                  <Paperclip className="w-4 h-4 text-cyan-800" />
                </label>
              </div>
            </div>

            {/* Row 4 - Center Aligned: মৃত্যুর তারিখ */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center pt-2">
              <div className="w-full sm:w-80">
                <label className="block text-xs font-bold text-center text-slate-800 mb-1">
                  মৃত্যুর তারিখ (ঐচ্ছিক)
                </label>
                <input
                  type="date"
                  value={deceasedDate}
                  onChange={(e) => setDeceasedDate(e.target.value)}
                  className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-center text-slate-900 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Warish List Table Section */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-base font-bold text-slate-900">
                ওয়ারিশগণের তালিকা
              </h3>
            </div>

            {/* Left-Aligned Bright Blue Action Button: "একজন যোগ করুন" */}
            <button
              type="button"
              onClick={handleAddHeir}
              className="cursor-pointer bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>একজন যোগ করুন</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-blue-400 rounded-xl bg-white shadow-xs">
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[700px]">
              {/* Bright Blue Table Header (#1E90FF) with bold white text */}
              <thead>
                <tr className="bg-[#1E90FF] text-white">
                  <th className="py-2.5 px-3 border-r border-blue-300 w-16 text-center font-bold">
                    ক্রমিক নং
                  </th>
                  <th className="py-2.5 px-3 border-r border-blue-300 text-left font-bold min-w-[160px]">
                    নাম
                  </th>
                  <th className="py-2.5 px-3 border-r border-blue-300 w-32 text-left font-bold">
                    সম্পর্ক
                  </th>
                  <th className="py-2.5 px-3 border-r border-blue-300 text-left font-bold min-w-[150px]">
                    ভোটার আইডি / জন্ম সনদ
                  </th>
                  <th className="py-2.5 px-3 border-r border-blue-300 w-36 text-center font-bold">
                    জন্ম তারিখ
                  </th>
                  <th className="py-2.5 px-3 text-left font-bold">
                    মন্তব্য
                  </th>
                  <th className="py-2.5 px-2 w-12 text-center font-bold">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {heirs.map((heir, index) => (
                  <tr key={index} className="hover:bg-cyan-50/40 transition">
                    {/* 1. ক্রমিক নং */}
                    <td className="py-2 px-3 text-center font-bold text-slate-800 border-r border-slate-200 bg-slate-50/50">
                      {toBengaliNumber(index + 1)}
                    </td>

                    {/* 2. নাম */}
                    <td className="py-2 px-2 border-r border-slate-200">
                      <input
                        type="text"
                        required
                        value={heir.name}
                        onChange={(e) => handleUpdateHeir(index, 'name', e.target.value)}
                        placeholder="ওয়ারিশের নাম *"
                        className="w-full bg-[#E0FFFF] border border-cyan-800/30 focus:border-blue-600 rounded px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </td>

                    {/* 3. সম্পর্ক */}
                    <td className="py-2 px-2 border-r border-slate-200">
                      <select
                        value={heir.relation}
                        onChange={(e) => handleUpdateHeir(index, 'relation', e.target.value)}
                        className="w-full bg-[#E0FFFF] border border-cyan-800/30 focus:border-blue-600 rounded px-2 py-1.5 text-xs text-slate-900 font-medium"
                      >
                        <option value="স্ত্রী">স্ত্রী</option>
                        <option value="স্বামী">স্বামী</option>
                        <option value="পুত্র">পুত্র</option>
                        <option value="কন্যা">কন্যা</option>
                        <option value="পিতা">পিতা</option>
                        <option value="মাতা">মাতা</option>
                        <option value="ভাই">ভাই</option>
                        <option value="বোন">বোন</option>
                        <option value="পৌত্র">পৌত্র</option>
                        <option value="পৌত্রী">পৌত্রী</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </td>

                    {/* 4. ভোটার আইডি / জন্ম সনদ */}
                    <td className="py-2 px-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={heir.nidOrBirth}
                        onChange={(e) => handleUpdateHeir(index, 'nidOrBirth', e.target.value)}
                        placeholder="ভোটার আইডি / জন্ম সনদ নং"
                        className="w-full bg-[#E0FFFF] border border-cyan-800/30 focus:border-blue-600 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                      />
                    </td>

                    {/* 5. জন্ম তারিখ */}
                    <td className="py-2 px-2 border-r border-slate-200">
                      <input
                        type="date"
                        value={heir.dob || ''}
                        onChange={(e) => handleUpdateHeir(index, 'dob', e.target.value)}
                        className="w-full bg-[#E0FFFF] border border-cyan-800/30 focus:border-blue-600 rounded px-2 py-1.5 text-xs text-slate-900 text-center"
                      />
                    </td>

                    {/* 6. মন্তব্য */}
                    <td className="py-2 px-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={heir.remarks || ''}
                        onChange={(e) => handleUpdateHeir(index, 'remarks', e.target.value)}
                        placeholder="মন্তব্য (জীবিত/ওয়ারিশ)"
                        className="w-full bg-[#E0FFFF] border border-cyan-800/30 focus:border-blue-600 rounded px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </td>

                    {/* Delete action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveHeir(index)}
                        disabled={heirs.length <= 1}
                        title="এই সারিটি মুছুন"
                        className="cursor-pointer text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sharedProfileFound && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
            এনআইডি অনুযায়ী পূর্বের সনদ থেকে আবেদনকারীর ব্যক্তিগত ও ঠিকানার তথ্য স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে।
            অন্য উদ্যোক্তার হিসাব, ট্র্যাকিং বা সনদ-সংক্রান্ত তথ্য দেখানো হচ্ছে না।
          </div>
        )}

        {/* Section 3: আবেদনকারীর তথ্য (Applicant Information for Contact & Tracking) */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="text-base font-bold text-slate-900">
              আবেদনকারীর তথ্য ও যোগাযোগ
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                আবেদনকারীর এনআইডি / জন্ম নিবন্ধন
              </label>
              <input
                type="text"
                value={applicantNid}
                onChange={(e) => setApplicantNid(e.target.value)}
                placeholder="১০, ১৩ বা ১৭ ডিজিট"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                আবেদনকারীর মোবাইল
              </label>
              <input
                type="text"
                value={applicantMobile}
                onChange={(e) => setApplicantMobile(e.target.value)}
                placeholder="মোবাইল নম্বর"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                আবেদনকারীর নাম (বাংলা)
              </label>
              <input
                type="text"
                value={applicantNameBn}
                onChange={(e) => setApplicantNameBn(e.target.value)}
                placeholder="আবেদনকারীর নাম (ঐচ্ছিক)"
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                মৃত ব্যক্তির সাথে আবেদনকারীর সম্পর্ক
              </label>
              <select
                value={applicantRelation}
                onChange={(e) => setApplicantRelation(e.target.value)}
                className="w-full bg-[#E0FFFF] border border-cyan-800/40 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md px-3 py-2 text-sm text-slate-900 font-medium transition"
              >
                <option value="">সম্পর্ক নির্বাচন করুন (ঐচ্ছিক)</option>
                <option value="পুত্র">পুত্র</option>
                <option value="কন্যা">কন্যা</option>
                <option value="স্ত্রী">স্ত্রী</option>
                <option value="স্বামী">স্বামী</option>
                <option value="ভাই">ভাই</option>
                <option value="বোন">বোন</option>
                <option value="পিতা">পিতা</option>
                <option value="মাতা">মাতা</option>
                <option value="অন্যান্য ওয়ারিশ">অন্যান্য ওয়ারিশ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Applicant Declaration & Submission Area */}
        {/* Light Pink/Peach highlighted declaration box (#FFE4E1 or #FADBD8) */}
        <div className="bg-[#FFE4E1] border-2 border-rose-300 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={declarationAgreed}
              onChange={(e) => setDeclarationAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 rounded border-rose-400 focus:ring-emerald-500 cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-sm text-slate-900 leading-relaxed font-semibold">
              আমি এই মর্মে অঙ্গীকার করছি যে, উপরে বর্ণিত তথ্যাবলী সম্পূর্ণ সত্য। যেকোনো সময় আমার প্রদত্ত তথ্য অসত্য প্রমাণিত হলে সনদ/প্রত্যয়ন বাতিল বলে গণ্য হবে এবং আইনানুগ ব্যবস্থা গ্রহণ করা হবে।
            </span>
          </label>
        </div>

        {/* Submission Button Section */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>আবেদন ফি: <b>২.০০ টাকা</b> (তাৎক্ষণিক অনুমোদন ও ডিজিটাল প্রিন্ট কপি প্রস্তুত)</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !declarationAgreed}
            className="w-full sm:w-auto cursor-pointer bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm sm:text-base px-8 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>আবেদন জমা হচ্ছে...</span>
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
