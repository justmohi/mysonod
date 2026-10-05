import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { CertificateApplication } from '../types';
import { getCertificateCategory } from '../types';
import { cleanDataForFirestore } from '../utils/firestore';
import { toBengaliNumber } from '../utils/bengali';
import { X, Save, AlertCircle, CheckCircle2, Edit3, Eye, Home, MapPin } from 'lucide-react';

interface EditCertificateModalProps {
  application: CertificateApplication | null;
  onClose: () => void;
  onSaveSuccess: (updatedApp: CertificateApplication) => void;
  onViewCertificate?: (app: CertificateApplication) => void;
}

export const EditCertificateModal: React.FC<EditCertificateModalProps> = ({
  application,
  onClose,
  onSaveSuccess,
  onViewCertificate
}) => {
  if (!application) return null;

  const [applicantNameBn, setApplicantNameBn] = useState(application.applicantNameBn || '');
  const [applicantNameEn, setApplicantNameEn] = useState(application.applicantNameEn || '');
  const [fatherName, setFatherName] = useState(application.fatherName || '');
  const [motherName, setMotherName] = useState(application.motherName || '');
  const [spouseName, setSpouseName] = useState(application.spouseName || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(application.gender || 'male');
  const [maritalStatus, setMaritalStatus] = useState(application.maritalStatus || 'বিবাহিত');
  const [nidOrBirthReg, setNidOrBirthReg] = useState(application.nidOrBirthReg || '');
  const [mobile, setMobile] = useState(application.mobile || '');
  const [dob, setDob] = useState(application.dob || '');

  // Present Address
  const [presentVillage, setPresentVillage] = useState(application.presentVillage || application.village || '');
  const [presentWard, setPresentWard] = useState(application.presentWard || application.wardNo || '০১');
  const [presentPost, setPresentPost] = useState(application.presentPost || application.postOffice || 'হালসা-৭০৩১');
  const [presentUpazila, setPresentUpazila] = useState(application.presentUpazila || 'মিরপুর');
  const [presentDistrict, setPresentDistrict] = useState(application.presentDistrict || 'কুষ্টিয়া');

  // Permanent Address
  const isInitiallySame = !application.permanentVillage || (
    application.presentVillage === application.permanentVillage && 
    application.presentWard === application.permanentWard
  );
  const [sameAsPresent, setSameAsPresent] = useState(isInitiallySame);
  const [permanentVillage, setPermanentVillage] = useState(application.permanentVillage || application.village || '');
  const [permanentWard, setPermanentWard] = useState(application.permanentWard || application.wardNo || '০১');
  const [permanentPost, setPermanentPost] = useState(application.permanentPost || application.postOffice || 'হালসা-৭০৩১');
  const [permanentUpazila, setPermanentUpazila] = useState(application.permanentUpazila || 'মিরপুর');
  const [permanentDistrict, setPermanentDistrict] = useState(application.permanentDistrict || 'কুষ্টিয়া');

  const [village, setVillage] = useState(application.village || '');
  const [wardNo, setWardNo] = useState(application.wardNo || '');
  const [postOffice, setPostOffice] = useState(application.postOffice || 'হালসা-৭০৩১');
  const [holdingNo, setHoldingNo] = useState(application.holdingNo || '');

  // Specifics
  const [annualIncome, setAnnualIncome] = useState<number | string>(application.annualIncome ?? 180000);
  const [incomeSource, setIncomeSource] = useState(application.incomeSource || 'ব্যবসা ও কৃষি');
  const [businessName, setBusinessName] = useState(application.businessName || '');
  const [businessType, setBusinessType] = useState(application.businessType || '');
  const [businessAddress, setBusinessAddress] = useState(application.businessAddress || '');
  const [businessCapital, setBusinessCapital] = useState<number | string>(application.businessCapital ?? 500000);
  const [deceasedPersonName, setDeceasedPersonName] = useState(application.deceasedPersonName || '');
  const [previousHusbandName, setPreviousHusbandName] = useState(application.previousHusbandName || '');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const permVill = (sameAsPresent ? presentVillage : permanentVillage).trim();
      const permWrd = (sameAsPresent ? presentWard : permanentWard).trim();
      const permPst = (sameAsPresent ? presentPost : permanentPost).trim();
      const permUpz = (sameAsPresent ? presentUpazila : permanentUpazila).trim() || 'মিরপুর';
      const permDst = (sameAsPresent ? presentDistrict : permanentDistrict).trim() || 'কুষ্টিয়া';

      const updatePayload: Record<string, any> = {
        applicantNameBn: applicantNameBn.trim(),
        applicantNameEn: applicantNameEn.trim() || applicantNameBn.trim(),
        userName: applicantNameBn.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        gender,
        maritalStatus,
        nidOrBirthReg: nidOrBirthReg.trim(),
        mobile: mobile.trim(),
        // Present Address
        presentVillage: presentVillage.trim(),
        presentVillageEn: presentVillage.trim(),
        presentWard: presentWard.trim(),
        presentPost: presentPost.trim(),
        presentPostEn: presentPost.trim(),
        presentUpazila: presentUpazila.trim() || 'মিরপুর',
        presentUpazilaEn: 'Mirpur',
        presentDistrict: presentDistrict.trim() || 'কুষ্টিয়া',
        presentDistrictEn: 'Kushtia',
        // Permanent Address
        permanentVillage: permVill,
        permanentVillageEn: permVill,
        permanentWard: permWrd,
        permanentPost: permPst,
        permanentPostEn: permPst,
        permanentUpazila: permUpz,
        permanentUpazilaEn: 'Mirpur',
        permanentDistrict: permDst,
        permanentDistrictEn: 'Kushtia',
        // Legacy
        village: permVill,
        wardNo: permWrd,
        postOffice: permPst,
        updatedAt: new Date().toISOString()
      };

      if (spouseName.trim()) updatePayload.spouseName = spouseName.trim();
      if (dob) updatePayload.dob = dob;
      if (holdingNo.trim()) updatePayload.holdingNo = holdingNo.trim();

      if (application.certificateType === 'income') {
        updatePayload.annualIncome = Number(annualIncome) || 0;
        updatePayload.incomeSource = incomeSource.trim() || 'ব্যবসা ও কৃষি';
      } else if (application.certificateType === 'trade_license') {
        if (businessName.trim()) updatePayload.businessName = businessName.trim();
        if (businessType.trim()) updatePayload.businessType = businessType.trim();
        if (businessAddress.trim()) updatePayload.businessAddress = businessAddress.trim();
        if (businessCapital) updatePayload.businessCapital = Number(businessCapital) || 0;
      } else if (application.certificateType === 'inheritance') {
        if (deceasedPersonName.trim()) updatePayload.deceasedPersonName = deceasedPersonName.trim();
      } else if (application.certificateType === 'non_remarriage') {
        if (previousHusbandName.trim()) updatePayload.previousHusbandName = previousHusbandName.trim();
      }

      const cleaned = cleanDataForFirestore(updatePayload);
      const appDocRef = doc(db, 'applications', application.id);
      await updateDoc(appDocRef, cleaned);

      const updatedFullApp: CertificateApplication = {
        ...application,
        ...cleaned
      } as CertificateApplication;

      setSuccessMsg('সনদের তথ্য সফলভাবে আপডেট করা হয়েছে এবং নতুন লেআউট জেনারেট করা হয়েছে!');
      onSaveSuccess(updatedFullApp);
    } catch (err: any) {
      console.error('Error updating certificate:', err);
      handleFirestoreError(err, OperationType.UPDATE, `applications/${application.id}`);
      setErrorMsg(err.message || 'আপডেট করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl my-auto overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Edit3 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">সনদ সম্পাদন করুন (Edit Certificate)</h3>
              <p className="text-xs text-emerald-200">
                স্মারক নং: <span className="font-mono">{application.trackingId}</span> • {application.certificateTitleBn}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
              {onViewCertificate && (
                <button
                  type="button"
                  onClick={() => onViewCertificate({ ...application, applicantNameBn, nidOrBirthReg })}
                  className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-3 py-1 rounded-lg flex items-center gap-1 transition shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>আপডেটেড সনদ দেখুন</span>
                </button>
              )}
            </div>
          )}

          {/* Section: Applicant Personal Info */}
          <div>
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-1">
              ১. ব্যক্তিগত তথ্য
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  আবেদনকারীর নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={applicantNameBn}
                  onChange={(e) => setApplicantNameBn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  আবেদনকারীর নাম (ইংরেজিতে)
                </label>
                <input
                  type="text"
                  value={applicantNameEn}
                  onChange={(e) => setApplicantNameEn(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পিতার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মাতার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্বামী / স্ত্রীর নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">লিঙ্গ *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="male">পুরুষ</option>
                    <option value="female">মহিলা</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বৈবাহিক অবস্থা</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="বিবাহিত">বিবাহিত</option>
                    <option value="অবিবাহিত">অবিবাহিত</option>
                    <option value="বিধবা">বিধবা</option>
                    <option value="বিপত্নীক">বিপত্নীক</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  এনআইডি / জন্ম নিবন্ধন নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={nidOrBirthReg}
                  onChange={(e) => setNidOrBirthReg(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  জন্ম তারিখ
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Address (Present & Permanent) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-1">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>২. বর্তমান ও স্থায়ী ঠিকানা</span>
              </h4>

              <label className="cursor-pointer inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-300 transition text-[11px] font-semibold text-emerald-900 select-none">
                <input
                  type="checkbox"
                  checked={sameAsPresent}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSameAsPresent(checked);
                    if (checked) {
                      setPermanentVillage(presentVillage);
                      setPermanentWard(presentWard);
                      setPermanentPost(presentPost);
                      setPermanentUpazila(presentUpazila);
                      setPermanentDistrict(presentDistrict);
                    }
                  }}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>বর্তমান ঠিকানাই স্থায়ী ঠিকানা (একই)</span>
              </label>
            </div>

            {/* Present Address */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-emerald-800 block mb-2">
                বর্তমান ঠিকানা:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">গ্রাম / মহল্লা *</label>
                  <input
                    type="text"
                    required
                    value={presentVillage}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPresentVillage(v);
                      setVillage(v);
                      if (sameAsPresent) setPermanentVillage(v);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ওয়ার্ড নং *</label>
                  <input
                    type="text"
                    required
                    value={presentWard}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPresentWard(v);
                      setWardNo(v);
                      if (sameAsPresent) setPermanentWard(v);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ডাকঘর *</label>
                  <input
                    type="text"
                    required
                    value={presentPost}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPresentPost(v);
                      setPostOffice(v);
                      if (sameAsPresent) setPermanentPost(v);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">উপজেলা *</label>
                  <input
                    type="text"
                    required
                    value={presentUpazila}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPresentUpazila(v);
                      if (sameAsPresent) setPermanentUpazila(v);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">জেলা *</label>
                  <input
                    type="text"
                    required
                    value={presentDistrict}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPresentDistrict(v);
                      if (sameAsPresent) setPermanentDistrict(v);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className={`p-3 rounded-xl border transition-all ${
              sameAsPresent ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <span className="text-[11px] font-bold text-emerald-800 block mb-2">
                স্থায়ী ঠিকানা: {sameAsPresent && <span className="text-[10px] text-emerald-600 font-normal">(বর্তমান ঠিকানার অনুরূপ)</span>}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">গ্রাম / মহল্লা *</label>
                  <input
                    type="text"
                    required
                    disabled={sameAsPresent}
                    value={sameAsPresent ? presentVillage : permanentVillage}
                    onChange={(e) => setPermanentVillage(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ওয়ার্ড নং *</label>
                  <input
                    type="text"
                    required
                    disabled={sameAsPresent}
                    value={sameAsPresent ? presentWard : permanentWard}
                    onChange={(e) => setPermanentWard(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ডাকঘর *</label>
                  <input
                    type="text"
                    required
                    disabled={sameAsPresent}
                    value={sameAsPresent ? presentPost : permanentPost}
                    onChange={(e) => setPermanentPost(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">উপজেলা *</label>
                  <input
                    type="text"
                    required
                    disabled={sameAsPresent}
                    value={sameAsPresent ? presentUpazila : permanentUpazila}
                    onChange={(e) => setPermanentUpazila(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">জেলা *</label>
                  <input
                    type="text"
                    required
                    disabled={sameAsPresent}
                    value={sameAsPresent ? presentDistrict : permanentDistrict}
                    onChange={(e) => setPermanentDistrict(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      sameAsPresent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 max-w-xs">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">হোল্ডিং নং</label>
                <input
                  type="text"
                  value={holdingNo}
                  onChange={(e) => setHoldingNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Specific Details for Certificate Type */}
          {application.certificateType === 'income' && (
            <div>
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-1">
                ৩. বার্ষিক আয় সংক্রান্ত তথ্য
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বার্ষিক আয় (টাকায়) *</label>
                  <input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">আয়ের প্রধান উৎস *</label>
                  <input
                    type="text"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {application.certificateType === 'trade_license' && (
            <div>
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-1">
                ৩. ব্যবসার তথ্য
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রতিষ্ঠানের নাম</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ব্যবসার ধরণ</label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রতিষ্ঠানের ঠিকানা</label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মূলধন (টাকায়)</label>
                  <input
                    type="number"
                    value={businessCapital}
                    onChange={(e) => setBusinessCapital(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {getCertificateCategory(application.certificateType) === 'deceased' && (
            <div>
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-1">
                ৩. ওয়ারিশ সংক্রান্ত তথ্য
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মৃত ব্যক্তির নাম</label>
                <input
                  type="text"
                  value={deceasedPersonName}
                  onChange={(e) => setDeceasedPersonName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
