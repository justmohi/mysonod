import React, { useMemo, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { CertificateApplication } from '../types';
import { getCertificateCategory } from '../types';
import { cleanDataForFirestore } from '../utils/firestore';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  Home,
  FileText,
  User,
  MapPin,
  ListChecks
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EditCertificateModalProps {
  application: CertificateApplication | null;
  onClose: () => void;
  onSaveSuccess: (updatedApp: CertificateApplication) => void;
  onViewCertificate?: (app: CertificateApplication) => void;
}

type EditableField = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'textarea' | 'select' | 'checkbox';
  options?: Array<{ value: string; label: string }>;
  section: 'personal' | 'present' | 'permanent' | 'certificate';
};

const EDITABLE_FIELDS: EditableField[] = [
  // Personal
  { key: 'applicantNameBn', label: 'আবেদনকারীর নাম (বাংলায়)', section: 'personal' },
  { key: 'applicantNameEn', label: 'আবেদনকারীর নাম (ইংরেজিতে)', section: 'personal' },
  { key: 'fatherName', label: 'পিতার নাম', section: 'personal' },
  { key: 'fatherNameEn', label: 'পিতার নাম (ইংরেজিতে)', section: 'personal' },
  { key: 'motherName', label: 'মাতার নাম', section: 'personal' },
  { key: 'motherNameEn', label: 'মাতার নাম (ইংরেজিতে)', section: 'personal' },
  { key: 'spouseName', label: 'স্বামী / স্ত্রীর নাম', section: 'personal' },
  { key: 'spouseNameEn', label: 'স্বামী / স্ত্রীর নাম (ইংরেজিতে)', section: 'personal' },
  {
    key: 'gender',
    label: 'লিঙ্গ',
    type: 'select',
    options: [
      { value: 'male', label: 'পুরুষ' },
      { value: 'female', label: 'মহিলা' },
      { value: 'other', label: 'অন্যান্য' }
    ],
    section: 'personal'
  },
  {
    key: 'maritalStatus',
    label: 'বৈবাহিক অবস্থা',
    type: 'select',
    options: [
      { value: 'বিবাহিত', label: 'বিবাহিত' },
      { value: 'অবিবাহিত', label: 'অবিবাহিত' },
      { value: 'বিধবা', label: 'বিধবা' },
      { value: 'বিপত্নীক', label: 'বিপত্নীক' }
    ],
    section: 'personal'
  },
  { key: 'nidOrBirthReg', label: 'এনআইডি / জন্ম নিবন্ধন নম্বর', section: 'personal' },
  { key: 'mobile', label: 'মোবাইল নম্বর', section: 'personal' },
  { key: 'email', label: 'ইমেইল', type: 'email', section: 'personal' },
  { key: 'dob', label: 'জন্ম তারিখ', type: 'date', section: 'personal' },
  { key: 'occupation', label: 'পেশা', section: 'personal' },

  // Present address
  { key: 'presentVillage', label: 'বর্তমান গ্রাম / মহল্লা', section: 'present' },
  { key: 'presentVillageEn', label: 'বর্তমান গ্রাম / মহল্লা (ইংরেজিতে)', section: 'present' },
  { key: 'presentWard', label: 'বর্তমান ওয়ার্ড', section: 'present' },
  { key: 'presentPost', label: 'বর্তমান ডাকঘর', section: 'present' },
  { key: 'presentPostEn', label: 'বর্তমান ডাকঘর (ইংরেজিতে)', section: 'present' },
  { key: 'presentUpazila', label: 'বর্তমান উপজেলা', section: 'present' },
  { key: 'presentUpazilaEn', label: 'বর্তমান উপজেলা (ইংরেজিতে)', section: 'present' },
  { key: 'presentDistrict', label: 'বর্তমান জেলা', section: 'present' },
  { key: 'presentDistrictEn', label: 'বর্তমান জেলা (ইংরেজিতে)', section: 'present' },

  // Permanent / legacy address
  { key: 'permanentVillage', label: 'স্থায়ী গ্রাম / মহল্লা', section: 'permanent' },
  { key: 'permanentVillageEn', label: 'স্থায়ী গ্রাম / মহল্লা (ইংরেজিতে)', section: 'permanent' },
  { key: 'permanentWard', label: 'স্থায়ী ওয়ার্ড', section: 'permanent' },
  { key: 'permanentPost', label: 'স্থায়ী ডাকঘর', section: 'permanent' },
  { key: 'permanentPostEn', label: 'স্থায়ী ডাকঘর (ইংরেজিতে)', section: 'permanent' },
  { key: 'permanentUpazila', label: 'স্থায়ী উপজেলা', section: 'permanent' },
  { key: 'permanentUpazilaEn', label: 'স্থায়ী উপজেলা (ইংরেজিতে)', section: 'permanent' },
  { key: 'permanentDistrict', label: 'স্থায়ী জেলা', section: 'permanent' },
  { key: 'permanentDistrictEn', label: 'স্থায়ী জেলা (ইংরেজিতে)', section: 'permanent' },
  { key: 'village', label: 'গ্রাম / মহল্লা (Legacy)', section: 'permanent' },
  { key: 'villageEn', label: 'গ্রাম / মহল্লা (Legacy, English)', section: 'permanent' },
  { key: 'wardNo', label: 'ওয়ার্ড নং (Legacy)', section: 'permanent' },
  { key: 'postOffice', label: 'ডাকঘর (Legacy)', section: 'permanent' },
  { key: 'postOfficeEn', label: 'ডাকঘর (Legacy, English)', section: 'permanent' },
  { key: 'holdingNo', label: 'হোল্ডিং নং', section: 'permanent' },

  // Certificate-specific entered data
  { key: 'annualIncome', label: 'বাৎসরিক আয় (টাকা)', type: 'number', section: 'certificate' },
  { key: 'incomeSource', label: 'আয়ের উৎস', section: 'certificate' },
  { key: 'monthlyIncome', label: 'মাসিক আয় (টাকা)', type: 'number', section: 'certificate' },
  { key: 'businessName', label: 'প্রতিষ্ঠানের নাম', section: 'certificate' },
  { key: 'businessType', label: 'ব্যবসার ধরণ', section: 'certificate' },
  { key: 'businessNature', label: 'ব্যবসার প্রকৃতি', section: 'certificate' },
  { key: 'businessAddress', label: 'ব্যবসার ঠিকানা', section: 'certificate' },
  { key: 'businessCapital', label: 'ব্যবসার মূলধন', type: 'number', section: 'certificate' },
  { key: 'businessStartDate', label: 'ব্যবসা শুরুর তারিখ', type: 'date', section: 'certificate' },
  { key: 'showCapitalOnPrint', label: 'সনদে মূলধন দেখাবেন', type: 'checkbox', section: 'certificate' },
  { key: 'fiscalYear', label: 'অর্থবছর', section: 'certificate' },
  { key: 'ownerName', label: 'মালিকের নাম', section: 'certificate' },
  { key: 'ownerFatherOrHusbandName', label: 'মালিকের পিতা / স্বামীর নাম', section: 'certificate' },
  { key: 'ownerMotherName', label: 'মালিকের মায়ের নাম', section: 'certificate' },
  { key: 'ownerNidOrBirth', label: 'মালিকের NID / জন্ম নিবন্ধন', section: 'certificate' },
  { key: 'ownerPhotoUrl', label: 'মালিকের ছবির URL', type: 'textarea', section: 'certificate' },
  { key: 'tinNumber', label: 'TIN নম্বর', section: 'certificate' },
  { key: 'validityStart', label: 'কার্যকারিতা শুরুর তারিখ', type: 'date', section: 'certificate' },
  { key: 'validityEnd', label: 'কার্যকারিতা শেষের তারিখ', type: 'date', section: 'certificate' },
  { key: 'licenseFee', label: 'লাইসেন্স ফি', type: 'number', section: 'certificate' },
  { key: 'vatAmount', label: 'VAT', type: 'number', section: 'certificate' },
  { key: 'professionTax', label: 'পেশা কর', type: 'number', section: 'certificate' },
  { key: 'tradeTax', label: 'ট্রেড কর', type: 'number', section: 'certificate' },
  { key: 'totalAmount', label: 'মোট টাকা', type: 'number', section: 'certificate' },
  { key: 'deceasedPersonName', label: 'মৃত ব্যক্তির নাম', section: 'certificate' },
  { key: 'deceasedDate', label: 'মৃত্যুর তারিখ', type: 'date', section: 'certificate' },
  { key: 'deceasedIdType', label: 'মৃত ব্যক্তির ID-এর ধরণ', section: 'certificate' },
  { key: 'deceasedIdNumber', label: 'মৃত ব্যক্তির ID নম্বর', section: 'certificate' },
  { key: 'deceasedFatherOrHusbandType', label: 'মৃত ব্যক্তির পিতা / স্বামী', section: 'certificate' },
  { key: 'deceasedFatherOrHusbandName', label: 'মৃত ব্যক্তির পিতা / স্বামীর নাম', section: 'certificate' },
  { key: 'applicantRelation', label: 'আবেদনকারীর সম্পর্ক', section: 'certificate' },
  { key: 'deceasedPhotoUrl', label: 'মৃত ব্যক্তির ছবির URL', type: 'textarea', section: 'certificate' },
  { key: 'previousHusbandName', label: 'পূর্বের স্বামীর নাম', section: 'certificate' },
  { key: 'deathPersonName', label: 'মৃত্যু সনদের ব্যক্তির নাম', section: 'certificate' },
  { key: 'deathDate', label: 'মৃত্যুর তারিখ', type: 'date', section: 'certificate' },
  { key: 'deathPlace', label: 'মৃত্যুর স্থান', section: 'certificate' },
  { key: 'nationality', label: 'জাতীয়তা', section: 'certificate' },
  { key: 'communityName', label: 'সম্প্রদায়ের নাম', section: 'certificate' },
  { key: 'religion', label: 'ধর্ম', section: 'certificate' },
  { key: 'voterAreaOld', label: 'পুরাতন ভোটার এলাকা', section: 'certificate' },
  { key: 'voterAreaNew', label: 'নতুন ভোটার এলাকা', section: 'certificate' },
  { key: 'voterTransferReason', label: 'ভোটার এলাকা পরিবর্তনের কারণ', type: 'textarea', section: 'certificate' },
  { key: 'correctionField', label: 'সংশোধনের ফিল্ড', section: 'certificate' },
  { key: 'correctionOldValue', label: 'পুরাতন তথ্য', section: 'certificate' },
  { key: 'correctionNewValue', label: 'নতুন তথ্য', section: 'certificate' },
  { key: 'correctionDetails', label: 'সংশোধনের বিস্তারিত', type: 'textarea', section: 'certificate' },
  { key: 'guardianName', label: 'অভিভাবকের নাম', section: 'certificate' },
  { key: 'guardianRelation', label: 'অভিভাবকের সম্পর্ক', section: 'certificate' },
  { key: 'permissionPurpose', label: 'অনুমতির উদ্দেশ্য', type: 'textarea', section: 'certificate' },
  { key: 'landDescription', label: 'জমির বিবরণ', type: 'textarea', section: 'certificate' },
  { key: 'landAmount', label: 'জমির পরিমাণ', section: 'certificate' },
  { key: 'agricultureType', label: 'কৃষির ধরণ', section: 'certificate' },
  { key: 'agricultureLand', label: 'কৃষি জমির পরিমাণ', section: 'certificate' },
  { key: 'freedomFighterName', label: 'মুক্তিযোদ্ধার নাম', section: 'certificate' },
  { key: 'freedomFighterRelation', label: 'মুক্তিযোদ্ধার সাথে সম্পর্ক', section: 'certificate' },
  { key: 'freedomFighterNumber', label: 'মুক্তিযোদ্ধা নম্বর', section: 'certificate' },
  { key: 'disabilityType', label: 'প্রতিবন্ধিতার ধরণ', section: 'certificate' },
  { key: 'disabilityDescription', label: 'প্রতিবন্ধিতার বিবরণ', type: 'textarea', section: 'certificate' },
  { key: 'unemploymentDuration', label: 'বেকারত্বের সময়কাল', section: 'certificate' },
  { key: 'constructionType', label: 'নির্মাণের ধরণ', section: 'certificate' },
  { key: 'constructionLocation', label: 'নির্মাণের স্থান', section: 'certificate' },
  { key: 'constructionPurpose', label: 'নির্মাণের উদ্দেশ্য', type: 'textarea', section: 'certificate' },
  { key: 'previousAddress', label: 'পূর্বের ঠিকানা', type: 'textarea', section: 'certificate' },
  { key: 'newAddress', label: 'নতুন ঠিকানা', type: 'textarea', section: 'certificate' },
  { key: 'sameNamePerson', label: 'একই নামের ব্যক্তির নাম', section: 'certificate' },
  { key: 'sameNameRelation', label: 'একই নামের ব্যক্তির সম্পর্ক', section: 'certificate' },
  { key: 'marriageDate', label: 'বিবাহের তারিখ', type: 'date', section: 'certificate' },
  { key: 'spouseName2', label: 'দ্বিতীয় স্বামী / স্ত্রীর নাম', section: 'certificate' },
  { key: 'orphanGuardian', label: 'এতিমের অভিভাবক', section: 'certificate' },
  { key: 'miscellaneousDetails', label: 'বিবিধ বিস্তারিত', type: 'textarea', section: 'certificate' },
  { key: 'organizationName', label: 'প্রতিষ্ঠানের নাম', section: 'certificate' },
  { key: 'nocPurpose', label: 'অনাপত্তির উদ্দেশ্য', type: 'textarea', section: 'certificate' },
  { key: 'insolvencyReason', label: 'আর্থিক অস্বচ্ছলতার কারণ', type: 'textarea', section: 'certificate' },
  { key: 'childlessYears', label: 'নিঃসন্তান হওয়ার সময়কাল', section: 'certificate' },
  { key: 'reasonNoBirthCert', label: 'জন্মসনদ না থাকার কারণ', type: 'textarea', section: 'certificate' },
  { key: 'rohingyaVerificationRef', label: 'রোহিঙ্গা যাচাই রেফারেন্স', section: 'certificate' },
  { key: 'generalPurpose', label: 'সাধারণ উদ্দেশ্য', type: 'textarea', section: 'certificate' },
  { key: 'certificateDetails', label: 'সনদের বিস্তারিত', type: 'textarea', section: 'certificate' },
  { key: 'attachmentUrls', label: 'সংযুক্ত ফাইলের URL (প্রতি লাইনে ১টি)', type: 'textarea', section: 'certificate' },
  { key: 'notes', label: 'অতিরিক্ত নোট', type: 'textarea', section: 'certificate' }
];

const CERTIFICATE_EDIT_KEYS: Record<string, string[]> = {
  income: ['annualIncome', 'incomeSource'],
  annual_income: ['annualIncome', 'incomeSource'],
  monthly_income: ['monthlyIncome', 'incomeSource'],
  trade_license: [
    'businessName', 'businessType', 'businessNature', 'businessAddress',
    'businessCapital', 'businessStartDate', 'showCapitalOnPrint',
    'ownerName', 'ownerFatherOrHusbandName', 'ownerMotherName',
    'ownerNidOrBirth', 'ownerPhotoUrl', 'tinNumber',
    'validityStart', 'validityEnd', 'licenseFee', 'vatAmount',
    'professionTax', 'tradeTax', 'totalAmount'
  ],
  inheritance: ['deceasedPersonName', 'deceasedDate', 'deceasedIdType', 'deceasedIdNumber', 'deceasedFatherOrHusbandType', 'deceasedFatherOrHusbandName', 'applicantRelation', 'deceasedPhotoUrl', 'previousHusbandName'],
  succession: ['deceasedPersonName', 'deceasedDate', 'deceasedIdType', 'deceasedIdNumber', 'deceasedFatherOrHusbandType', 'deceasedFatherOrHusbandName', 'applicantRelation', 'deceasedPhotoUrl', 'previousHusbandName'],
  family: [],
  non_remarriage: ['previousHusbandName'],
  widow: ['previousHusbandName'],
  death: ['deathPersonName', 'deathDate', 'deathPlace'],
  nationality: ['nationality', 'religion'],
  citizenship: ['nationality', 'religion'],
  community: ['communityName'],
  indigenous: ['communityName'],
  voter_area_transfer: ['voterAreaOld', 'voterAreaNew', 'voterTransferReason'],
  nid_correction: ['correctionField', 'correctionOldValue', 'correctionNewValue', 'correctionDetails'],
  guardian_permission: ['guardianName', 'guardianRelation', 'permissionPurpose'],
  landless: ['landDescription', 'landAmount'],
  agriculture: ['agricultureType', 'agricultureLand'],
  freedom_fighter: ['freedomFighterName', 'freedomFighterRelation', 'freedomFighterNumber'],
  disabled: ['disabilityType', 'disabilityDescription'],
  unemployed: ['unemploymentDuration'],
  infrastructure_permission: ['constructionType', 'constructionLocation', 'constructionPurpose'],
  same_name: ['sameNamePerson', 'sameNameRelation'],
  married: ['marriageDate', 'spouseName2'],
  orphan: ['orphanGuardian'],
  permanent_resident: ['generalPurpose', 'certificateDetails'],
  character: ['generalPurpose'],
  not_rohingya: ['generalPurpose', 'rohingyaVerificationRef'],
  no_birth_certificate: ['generalPurpose', 'reasonNoBirthCert'],
  financial_insolvency: ['generalPurpose', 'insolvencyReason', 'certificateDetails'],
  no_objection: ['organizationName', 'nocPurpose', 'generalPurpose'],
  childless: ['childlessYears', 'generalPurpose'],
  new_voter: ['previousAddress', 'generalPurpose'],
  new_voter_affidavit: ['previousAddress', 'generalPurpose'],
  general: ['generalPurpose', 'certificateDetails'],
  miscellaneous: ['miscellaneousDetails']
};

const COMMON_EDIT_KEYS = [
  'applicantNameBn',
  'applicantNameEn',
  'fatherName',
  'fatherNameEn',
  'motherName',
  'motherNameEn',
  'spouseName',
  'spouseNameEn',
  'nidOrBirthReg',
  'email',
  'dob',
  'occupation'
];

const PRESENT_EDIT_KEYS = [
  'presentVillage',
  'presentVillageEn',
  'presentWard',
  'presentPost',
  'presentPostEn',
  'presentUpazila',
  'presentUpazilaEn',
  'presentDistrict',
  'presentDistrictEn'
];

const PERMANENT_EDIT_KEYS = [
  'permanentVillage',
  'permanentVillageEn',
  'permanentWard',
  'permanentPost',
  'permanentPostEn',
  'permanentUpazila',
  'permanentUpazilaEn',
  'permanentDistrict',
  'permanentDistrictEn',
  'village',
  'villageEn',
  'wardNo',
  'postOffice',
  'postOfficeEn',
  'holdingNo'
];

function getRelevantEditFields(application: CertificateApplication): EditableField[] {
  const allowed = new Set<string>([
    ...COMMON_EDIT_KEYS,
    ...PRESENT_EDIT_KEYS,
    ...(application.certificateType === 'same_name'
      ? []
      : PERMANENT_EDIT_KEYS),
    ...(CERTIFICATE_EDIT_KEYS[application.certificateType] || [])
  ]);

  return EDITABLE_FIELDS.filter(field => {
    if (!allowed.has(field.key)) return false;
    const value = readValue(application, field.key);
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? '').trim() !== '';
  });
}

const readValue = (app: CertificateApplication, key: string) => {
  const value = (app as unknown as Record<string, unknown>)[key];
  if (key === 'attachmentUrls' && Array.isArray(value)) {
    return value.join('\n');
  }
  return value ?? '';
};

const isNumericField = (field: EditableField) => field.type === 'number';

export const EditCertificateModal: React.FC<EditCertificateModalProps> = ({
  application,
  onClose,
  onSaveSuccess,
  onViewCertificate
}) => {
  const { currentUser, userProfile, isStaff } = useAuth();

  if (!application) return null;

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const base: Record<string, any> = {};
    for (const field of getRelevantEditFields(application)) {
      base[field.key] = readValue(application, field.key);
    }
    return base;
  });

  const [heirsJson, setHeirsJson] = useState(
    JSON.stringify(application.heirs || [], null, 2)
  );
  const [familyMembersJson, setFamilyMembersJson] = useState(
    JSON.stringify(application.familyMembers || [], null, 2)
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sections = useMemo(() => {
    const relevant = getRelevantEditFields(application);
    return {
      personal: relevant.filter(f => f.section === 'personal'),
      present: relevant.filter(f => f.section === 'present'),
      permanent: relevant.filter(f => f.section === 'permanent'),
      certificate: relevant.filter(f => f.section === 'certificate')
    };
  }, [application]);

  const canEdit = Boolean(
    currentUser &&
    userProfile &&
    (isStaff || (application.userId === currentUser.uid && application.status === 'Pending'))
  );

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      setErrorMsg('এই আবেদনের তথ্য সম্পাদনের অনুমতি আপনার নেই।');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let heirs: unknown;
      let familyMembers: unknown;

      try {
        heirs = heirsJson.trim() ? JSON.parse(heirsJson) : [];
        familyMembers = familyMembersJson.trim() ? JSON.parse(familyMembersJson) : [];
      } catch {
        throw new Error('ওয়ারিশ / পারিবারিক সদস্যের JSON তথ্যের ফরম্যাট সঠিক নয়।');
      }

      const allowedKeys = new Set(getRelevantEditFields(application).map(field => field.key));
      const updatePayload: Record<string, any> = {
        ...Object.fromEntries(
          Object.entries(formData).filter(([key]) => allowedKeys.has(key))
        ),
        userName: String(formData.applicantNameBn || application.applicantNameBn || '').trim(),
        heirs,
        familyMembers,
        attachmentUrls:
          typeof formData.attachmentUrls === 'string'
            ? formData.attachmentUrls
                .split(/\r?\n/)
                .map((value: string) => value.trim())
                .filter(Boolean)
            : (formData.attachmentUrls || application.attachmentUrls || []),
        updatedAt: new Date().toISOString()
      };

      // Keep system-controlled fields immutable.
      delete updatePayload.id;
      delete updatePayload.trackingId;
      delete updatePayload.userId;
      delete updatePayload.userEmail;
      delete updatePayload.certificateType;
      delete updatePayload.certificateTitleBn;
      delete updatePayload.certificateTitleEn;
      delete updatePayload.language;
      delete updatePayload.fee;
      delete updatePayload.status;
      delete updatePayload.rejectionReason;
      delete updatePayload.issuingOfficer;
      delete updatePayload.createdAt;
      delete updatePayload.approvedAt;
      delete updatePayload.completedByUid;
      delete updatePayload.completedByEmail;
      delete updatePayload.completedAt;
      delete updatePayload.completionCharge;
      delete updatePayload.completionChargeType;
      delete updatePayload.billingMonthKey;
      delete updatePayload.printDate;
      delete updatePayload.latePrintFee;
      delete updatePayload.latePrintFeeChargedAt;

      const cleaned = cleanDataForFirestore(updatePayload);
      const appDocRef = doc(db, 'applications', application.id);
      await updateDoc(appDocRef, cleaned);

      const updatedFullApp: CertificateApplication = {
        ...application,
        ...cleaned
      } as CertificateApplication;

      setSuccessMsg('সনদের আবেদন-সংক্রান্ত সকল তথ্য সফলভাবে আপডেট হয়েছে।');
      onSaveSuccess(updatedFullApp);
    } catch (err: any) {
      console.error('Error updating certificate:', err);
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `applications/${application.id}`
      );
      setErrorMsg(err.message || 'আপডেট করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: EditableField) => {
    const value = formData[field.key] ?? '';

    return (
      <div key={field.key}>
        <label className="mb-1 block text-[11px] font-bold text-slate-700">
          {field.label}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={e => updateField(field.key, e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          />
        ) : field.type === 'select' ? (
          <select
            value={value}
            onChange={e => updateField(field.key, e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          >
            {(field.options || []).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={e => updateField(field.key, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            />
            <span>{field.label}</span>
          </label>
        ) : (
          <input
            type={field.type || (isNumericField(field) ? 'number' : 'text')}
            value={value}
            onChange={e => {
              const nextValue =
                field.type === 'number'
                  ? e.target.value === '' ? '' : Number(e.target.value)
                  : e.target.value;
              updateField(field.key, nextValue);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          />
        )}
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    fields: EditableField[],
    columns = 'grid-cols-1 sm:grid-cols-2'
  ) => (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
          {icon}
        </div>
        <h4 className="text-sm font-extrabold text-slate-900">{title}</h4>
      </div>
      <div className={`grid gap-3 ${columns}`}>
        {fields.map(renderField)}
      </div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm">
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Edit3 className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">আবেদন তথ্য সম্পাদনা</h3>
              <p className="text-[11px] text-emerald-100">
                {application.certificateTitleBn} • {application.trackingId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-amber-50 px-5 py-3 text-xs text-amber-900">
          আবেদন করার সময় দেওয়া ব্যক্তিগত, ঠিকানা ও সনদ-নির্দিষ্ট তথ্য পরিবর্তন করা যাবে। ট্র্যাকিং নম্বর, আবেদনকারী account, fee, status ও billing metadata নিরাপত্তার জন্য পরিবর্তন করা যাবে না।
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(94vh-145px)] overflow-y-auto p-4 sm:p-5">
          {!canEdit && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>এই আবেদনের তথ্য সম্পাদনের অনুমতি আপনার নেই।</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successMsg}</span>
              </div>
              {onViewCertificate && application.status === 'Approved' && isStaff && (
                <button
                  type="button"
                  onClick={() => onViewCertificate({ ...application, ...formData, heirs: application.heirs, familyMembers: application.familyMembers })}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  আপডেটেড সনদ দেখুন
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {renderSection('১. ব্যক্তিগত তথ্য', <User className="h-4 w-4" />, sections.personal)}
            {renderSection('২. বর্তমান ঠিকানা', <MapPin className="h-4 w-4" />, sections.present)}
            {renderSection('৩. স্থায়ী ও পুরোনো ঠিকানা', <Home className="h-4 w-4" />, sections.permanent)}
            {renderSection('৪. সনদ-নির্দিষ্ট সকল তথ্য', <FileText className="h-4 w-4" />, sections.certificate)}

            {(application.certificateType === 'inheritance' ||
              application.certificateType === 'succession' ||
              application.certificateType === 'family') && (
              <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">৫. তালিকাভুক্ত সদস্য / ওয়ারিশ তথ্য</h4>
                </div>

                <div className="space-y-3">
                  {application.certificateType !== 'family' && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        ওয়ারিশ তালিকা (JSON)
                      </label>
                      <textarea
                        value={heirsJson}
                        onChange={e => setHeirsJson(e.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-[11px] leading-5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                      />
                    </div>
                  )}

                  {application.certificateType === 'family' && (
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">
                        পরিবারের সদস্য তালিকা (JSON)
                      </label>
                      <textarea
                        value={familyMembersJson}
                        onChange={e => setFamilyMembersJson(e.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-[11px] leading-5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                      />
                    </div>
                  )}

                  <p className="text-[10px] leading-5 text-slate-500">
                    JSON তালিকার প্রতিটি item-এর field নাম অপরিবর্তিত রাখুন; শুধু value পরিবর্তন করুন। উদাহরণ: <code>{'name, relation, age, nidOrBirth, dob, remarks'}</code>
                  </p>
                </div>
              </section>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-extrabold text-slate-900">সিস্টেম তথ্য</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-400">Tracking ID</div>
                  <div className="mt-1 font-mono font-bold text-slate-800">{application.trackingId}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-400">Status</div>
                  <div className="mt-1 font-bold text-slate-800">{application.status}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-400">Fee</div>
                  <div className="mt-1 font-bold text-slate-800">৳ {application.fee}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-400">Certificate</div>
                  <div className="mt-1 font-bold text-slate-800">{getCertificateCategory(application.certificateType)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-3 border-t border-slate-200 bg-white pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving || !canEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সব পরিবর্তন সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
