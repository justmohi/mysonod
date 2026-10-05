export type CertificateType =
  | 'inheritance'
  | 'family'
  | 'succession'
  | 'citizenship'
  | 'death'
  | 'nationality'
  | 'non_remarriage'
  | 'new_voter'
  | 'landless'
  | 'widow'
  | 'guardian_permission'
  | 'community'
  | 'agriculture'
  | 'freedom_fighter'
  | 'annual_income'
  | 'income'
  | 'orphan'
  | 'married'
  | 'monthly_income'
  | 'character'
  | 'indigenous'
  | 'nid_correction'
  | 'childless'
  | 'financial_insolvency'
  | 'no_objection'
  | 'voter_area_transfer'
  | 'disabled'
  | 'same_name'
  | 'unemployed'
  | 'trade_license'
  | 'permanent_resident'
  | 'unmarried'
  | 'miscellaneous'
  | 'infrastructure_permission'
  | 'not_rohingya'
  | 'general'
  | 'new_voter_affidavit'
  | 'no_birth_certificate';

export type CertificateCategory = 'deceased' | 'living_citizen' | 'business' | 'family';

export function getCertificateCategory(type: CertificateType | string): CertificateCategory {
  if (type === 'inheritance' || type === 'succession' || type === 'death') {
    return 'deceased';
  }
  if (type === 'trade_license') {
    return 'business';
  }
  if (type === 'family') {
    return 'family';
  }
  return 'living_citizen';
}

export interface CertificateMeta {
  type: CertificateType;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  govtFee: number;
  deliveryDays: string;
  iconName: string;
}

export const CERTIFICATE_CATALOG: Record<CertificateType, CertificateMeta> = {

  inheritance: {
    type: 'inheritance',
    titleBn: 'ওয়ারিশ সনদ',
    titleEn: 'Heir Certificate',
    descriptionBn: 'মৃত ব্যক্তির আইনগত ওয়ারিশগণের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Users'
  },

  family: {
    type: 'family',
    titleBn: 'পারিবারিক সনদ',
    titleEn: 'Family Certificate',
    descriptionBn: 'পরিবারের সদস্যদের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Home'
  },

  succession: {
    type: 'succession',
    titleBn: 'উত্তরাধিকার সনদ',
    titleEn: 'Succession Certificate',
    descriptionBn: 'উত্তরাধিকার সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Users'
  },

  citizenship: {
    type: 'citizenship',
    titleBn: 'নাগরিকত্ব সনদ',
    titleEn: 'Citizenship Certificate',
    descriptionBn: 'বাংলাদেশী নাগরিকত্বের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'ShieldCheck'
  },

  death: {
    type: 'death',
    titleBn: 'মৃত্যু সনদ',
    titleEn: 'Death Certificate',
    descriptionBn: 'মৃত্যু সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'FileText'
  },

  nationality: {
    type: 'nationality',
    titleBn: 'জাতীয়তা সনদ',
    titleEn: 'Nationality Certificate',
    descriptionBn: 'জাতীয়তা সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Flag'
  },

  non_remarriage: {
    type: 'non_remarriage',
    titleBn: 'পুনঃবিবাহ না হওয়া সনদ',
    titleEn: 'Non Remarriage Certificate',
    descriptionBn: 'পুনঃবিবাহ না হওয়ার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'HeartHandshake'
  },

  new_voter: {
    type: 'new_voter',
    titleBn: 'নতুন ভোটার প্রত্যয়ন',
    titleEn: 'New Voter Certificate',
    descriptionBn: 'নতুন ভোটার সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'UserPlus'
  },

  landless: {
    type: 'landless',
    titleBn: 'ভূমিহীন সনদ',
    titleEn: 'Landless Certificate',
    descriptionBn: 'ভূমিহীনতার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Landmark'
  },

  widow: {
    type: 'widow',
    titleBn: 'বিধবা প্রত্যয়ন সনদ',
    titleEn: 'Widow Certificate',
    descriptionBn: 'বিধবা সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Heart'
  },

  guardian_permission: {
    type: 'guardian_permission',
    titleBn: 'অভিভাবকের অনুমতিপত্র সনদ',
    titleEn: 'Guardian Permission Certificate',
    descriptionBn: 'অভিভাবকের অনুমতি সংক্রান্ত সনদ',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'UserCheck'
  },

  community: {
    type: 'community',
    titleBn: 'সম্প্রদায় সনদ',
    titleEn: 'Community Certificate',
    descriptionBn: 'সম্প্রদায় সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Users'
  },

  agriculture: {
    type: 'agriculture',
    titleBn: 'কৃষি প্রত্যয়ন সনদ',
    titleEn: 'Agriculture Certificate',
    descriptionBn: 'কৃষি সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Sprout'
  },

  freedom_fighter: {
    type: 'freedom_fighter',
    titleBn: 'মুক্তিযোদ্ধা প্রত্যয়ন সনদ',
    titleEn: 'Freedom Fighter Certificate',
    descriptionBn: 'মুক্তিযোদ্ধা সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Award'
  },

  annual_income: {
    type: 'annual_income',
    titleBn: 'বাৎসরিক আয়ের সনদপত্র',
    titleEn: 'Annual Income Certificate',
    descriptionBn: 'বাৎসরিক আয় সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'BadgeDollarSign'
  },

  income: {
    type: 'income',
    titleBn: 'বাৎসরিক আয়ের সনদপত্র',
    titleEn: 'Annual Income Certificate',
    descriptionBn: 'বাৎসরিক আয় সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'BadgeDollarSign'
  },

  orphan: {
    type: 'orphan',
    titleBn: 'এতিম সনদ',
    titleEn: 'Orphan Certificate',
    descriptionBn: 'এতিম হওয়ার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Heart'
  },

  married: {
    type: 'married',
    titleBn: 'বিবাহিত সনদ',
    titleEn: 'Married Certificate',
    descriptionBn: 'বিবাহিত হওয়ার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'HeartHandshake'
  },

  monthly_income: {
    type: 'monthly_income',
    titleBn: 'মাসিক আয়ের সনদ',
    titleEn: 'Monthly Income Certificate',
    descriptionBn: 'মাসিক আয় সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'BadgeDollarSign'
  },

  character: {
    type: 'character',
    titleBn: 'চারিত্রিক সনদ',
    titleEn: 'Character Certificate',
    descriptionBn: 'চারিত্রিক প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Award'
  },

  indigenous: {
    type: 'indigenous',
    titleBn: 'উপজাতি সনদ',
    titleEn: 'Indigenous Certificate',
    descriptionBn: 'উপজাতি সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Users'
  },

  nid_correction: {
    type: 'nid_correction',
    titleBn: 'জাতীয় পরিচয় তথ্য সংশোধন',
    titleEn: 'NID Information Correction',
    descriptionBn: 'জাতীয় পরিচয় তথ্য সংশোধনের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'FileEdit'
  },

  childless: {
    type: 'childless',
    titleBn: 'নিঃসন্তান প্রত্যয়ন সনদ',
    titleEn: 'Childless Certificate',
    descriptionBn: 'নিঃসন্তান সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'User'
  },

  financial_insolvency: {
    type: 'financial_insolvency',
    titleBn: 'আর্থিক অস্বচ্ছলতার সনদ',
    titleEn: 'Financial Insolvency Certificate',
    descriptionBn: 'আর্থিক অস্বচ্ছলতার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'BadgeDollarSign'
  },

  no_objection: {
    type: 'no_objection',
    titleBn: 'অনাপত্তি সনদ',
    titleEn: 'No Objection Certificate',
    descriptionBn: 'অনাপত্তি সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'CheckCircle'
  },

  voter_area_transfer: {
    type: 'voter_area_transfer',
    titleBn: 'ভোটার এলাকা স্থানান্তর প্রত্যয়ন',
    titleEn: 'Voter Area Transfer Certificate',
    descriptionBn: 'ভোটার এলাকা পরিবর্তনের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'MapPin'
  },

  disabled: {
    type: 'disabled',
    titleBn: 'প্রতিবন্ধী সনদ',
    titleEn: 'Disability Certificate',
    descriptionBn: 'প্রতিবন্ধিতা সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Accessibility'
  },

  same_name: {
    type: 'same_name',
    titleBn: 'একই নামের প্রত্যয়ন',
    titleEn: 'Same Name Certificate',
    descriptionBn: 'একই নাম সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Copy'
  },

  unemployed: {
    type: 'unemployed',
    titleBn: 'বেকারত্ব সনদ',
    titleEn: 'Unemployment Certificate',
    descriptionBn: 'বেকারত্ব সংক্রান্ত প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Briefcase'
  },

  trade_license: {
    type: 'trade_license',
    titleBn: 'ট্রেড লাইসেন্স',
    titleEn: 'Trade License',
    descriptionBn: 'ব্যবসা পরিচালনার অনুমোদন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Briefcase'
  },

  permanent_resident: {
    type: 'permanent_resident',
    titleBn: 'স্থায়ী বাসিন্দা সনদ',
    titleEn: 'Permanent Resident Certificate',
    descriptionBn: 'স্থায়ী বাসিন্দার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Home'
  },

  unmarried: {
    type: 'unmarried',
    titleBn: 'অবিবাহিত সনদ',
    titleEn: 'Unmarried Certificate',
    descriptionBn: 'অবিবাহিত থাকার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'User'
  },

  miscellaneous: {
    type: 'miscellaneous',
    titleBn: 'বিবিধ সনদ',
    titleEn: 'Miscellaneous Certificate',
    descriptionBn: 'বিবিধ প্রয়োজনের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'FileText'
  },

  infrastructure_permission: {
    type: 'infrastructure_permission',
    titleBn: 'অবকাঠামো নির্মাণের অনুমতি সনদ',
    titleEn: 'Infrastructure Construction Permission',
    descriptionBn: 'অবকাঠামো নির্মাণের অনুমতি',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'Building'
  },

  not_rohingya: {
    type: 'not_rohingya',
    titleBn: 'রোহিঙ্গা নয় প্রত্যয়ন',
    titleEn: 'Not Rohingya Certificate',
    descriptionBn: 'রোহিঙ্গা নন মর্মে প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'ShieldCheck'
  },

  general: {
    type: 'general',
    titleBn: 'সাধারণ প্রত্যয়ন',
    titleEn: 'General Certificate',
    descriptionBn: 'সাধারণ প্রয়োজনের প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'FileText'
  },

  new_voter_affidavit: {
    type: 'new_voter_affidavit',
    titleBn: 'নতুন ভোটার অঙ্গিকারনামা',
    titleEn: 'New Voter Affidavit',
    descriptionBn: 'নতুন ভোটার হওয়ার অঙ্গিকারনামা',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'FileSignature'
  },

  no_birth_certificate: {
    type: 'no_birth_certificate',
    titleBn: 'জন্মসনদ না থাকা সংক্রান্ত প্রত্যয়ন',
    titleEn: 'No Birth Certificate Certificate',
    descriptionBn: 'জন্মসনদ না থাকার প্রত্যয়ন',
    govtFee: 2,
    deliveryDays: 'তাৎক্ষণিক / ১ কার্যদিবস',
    iconName: 'FileWarning'
  }
};

export interface HeirItem {
  name: string;
  relation: string;
  age: string;
  nidOrBirth: string;
  dob?: string;
  remarks?: string;
}

export interface FamilyMemberItem {
  name: string;
  relation: string;
  age: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  role: 'user' | 'operator' | 'admin';
  createdAt: string;
  updatedAt?: string;
  // Operator billing fields
  billingStartAt?: string;
  billingMonthKey?: string;
  billingMonthCompletedCount?: number;
  billingTotalCompleted?: number;
}

export interface CertificateApplication {
  id: string;
  trackingId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  certificateType: CertificateType;
  certificateTitleBn: string;
  certificateTitleEn?: string;
  language?: 'bn' | 'en';
  isDuplicateCopy?: boolean;
  // Core personal info
  applicantNameBn: string;
  applicantNameEn: string;
  fatherName: string;
  fatherNameEn?: string;
  motherName: string;
  motherNameEn?: string;
  spouseName?: string;
  spouseNameEn?: string;
  gender: 'male' | 'female' | 'other';
  maritalStatus?: string;
  nidOrBirthReg: string;
  mobile: string;
  email?: string;
  dob?: string;
  occupation?: string;
  // Address Fields (Present & Permanent)
  presentVillage?: string;
  presentVillageEn?: string;
  presentWard?: string;
  presentPost?: string;
  presentPostEn?: string;
  presentUpazila?: string;
  presentUpazilaEn?: string;
  presentDistrict?: string;
  presentDistrictEn?: string;

  permanentVillage?: string;
  permanentVillageEn?: string;
  permanentWard?: string;
  permanentPost?: string;
  permanentPostEn?: string;
  permanentUpazila?: string;
  permanentUpazilaEn?: string;
  permanentDistrict?: string;
  permanentDistrictEn?: string;

  // Legacy address fields for backwards compatibility
  village: string;
  villageEn?: string;
  wardNo: string;
  postOffice: string;
  postOfficeEn?: string;
  holdingNo?: string;
  // Specific data
  annualIncome?: number;
  incomeSource?: string;
  businessName?: string;
  businessType?: string;
  businessNature?: string;
  businessAddress?: string;
  businessCapital?: number;
  businessStartDate?: string;
  showCapitalOnPrint?: boolean;
  fiscalYear?: string;
  ownerName?: string;
  ownerFatherOrHusbandName?: string;
  ownerMotherName?: string;
  ownerNidOrBirth?: string;
  tinNumber?: string;
  ownerPhotoUrl?: string;
  validityStart?: string;
  validityEnd?: string;
  licenseFee?: number;
  vatAmount?: number;
  professionTax?: number;
  tradeTax?: number;
  totalAmount?: number;
  heirs?: HeirItem[];
  familyMembers?: FamilyMemberItem[];
  deceasedPersonName?: string;
  deceasedDate?: string;
  deceasedIdType?: string;
  deceasedIdNumber?: string;
  deceasedFatherOrHusbandType?: 'father' | 'husband';
  deceasedFatherOrHusbandName?: string;
  applicantRelation?: string;
  deceasedPhotoUrl?: string;
  attachmentUrls?: string[];
  previousHusbandName?: string;
  notes?: string;
    // Additional certificate-specific data
  deathPersonName?: string;
  deathDate?: string;
  deathPlace?: string;

  nationality?: string;
  communityName?: string;
  religion?: string;

  voterAreaOld?: string;
  voterAreaNew?: string;
  voterTransferReason?: string;

  correctionField?: string;
  correctionOldValue?: string;
  correctionNewValue?: string;

  guardianName?: string;
  guardianRelation?: string;
  permissionPurpose?: string;

  landDescription?: string;
  landAmount?: string;

  agricultureType?: string;
  agricultureLand?: string;

  freedomFighterName?: string;
  freedomFighterRelation?: string;
  freedomFighterNumber?: string;

  monthlyIncome?: number;

  disabilityType?: string;
  disabilityDescription?: string;

  unemploymentDuration?: string;

  constructionType?: string;
  constructionLocation?: string;
  constructionPurpose?: string;

  previousAddress?: string;
  newAddress?: string;

  sameNamePerson?: string;
  sameNameRelation?: string;
  familyGuardianType?: 'father' | 'husband';
  guardianType?: 'father' | 'husband';

  correctionDetails?: string;

  generalPurpose?: string;
  certificateDetails?: string;

  marriageDate?: string;
  spouseName2?: string;

  orphanGuardian?: string;

  miscellaneousDetails?: string;
  organizationName?: string;
  nocPurpose?: string;
  insolvencyReason?: string;
  childlessYears?: string;
  reasonNoBirthCert?: string;
  rohingyaVerificationRef?: string;
  // Status & processing
  fee: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  issuingOfficer?: string;
  createdAt: string;
  approvedAt?: string;
  completedByUid?: string;
  completedByEmail?: string;
  completedAt?: string;
  completionCharge?: number;
  completionChargeType?: 'free' | 'month1_overage' | 'monthly';
  printDate?: string;
  latePrintFeeChargedAt?: string;
  latePrintFee?: number;
}

export interface BalanceRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'Rocket';
  senderNumber: string;
  trxId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'fee_deduction' | 'balance_topup' | 'welcome_bonus' | 'certificate_usage_fee' | 'late_print_fee';
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface UnionSettings {
  // a. Union & Regional Information
  unionName: string;
  unionNameEn?: string;
  postOffice: string;
  postOfficeEn?: string;
  upazila: string;
  upazilaEn?: string;
  district: string;
  districtEn?: string;

  // b. Authority & Contact Information
  chairmanName: string;
  chairmanNameEn?: string;
  mobileNumber: string;
  officialEmail: string;

  // c. Logo & Watermark URLs
  govtLogoUrl?: string;
  unionLogoUrl?: string;
  watermarkLogoUrl?: string;

  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_UNION_SETTINGS: UnionSettings = {
  unionName: '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ',
  unionNameEn: '12 NO. AMBARIYA UNION PARISHAD',
  postOffice: 'হালসা-৭০৩১',
  postOfficeEn: 'Halsa-7031',
  upazila: 'মিরপুর',
  upazilaEn: 'Mirpur',
  district: 'কুষ্টিয়া',
  districtEn: 'Kushtia',
  chairmanName: 'মোঃ সাইফুদ্দিন মন্ডল',
  chairmanNameEn: 'Md. Saifuddin Mondal',
  mobileNumber: '০১৭৪১-১৮৫৭৬৫',
  officialEmail: 'udc.ambaria@gmail.com',
  govtLogoUrl: '',
  unionLogoUrl: '',
  watermarkLogoUrl: ''
};
