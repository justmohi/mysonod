import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  CERTIFICATE_CATALOG, 
  getCertificateCategory,
  type CertificateType, 
  type CertificateApplication,
  type Transaction,
  type HeirItem,
  type FamilyMemberItem,
  type SameNameEntry,
  type CitizenProfile
} from '../types';
import { toBengaliNumber, formatCurrencyBn, generateTrackingId, formatBengaliDate, cleanNidNumber } from '../utils/bengali';
import { cleanDataForFirestore } from '../utils/firestore';
import { clearCurrentApplicationData, setCurrentApplicationData } from '../utils/currentApplication';
import { buildCitizenProfile, createCitizenProfileId } from '../utils/citizenProfile';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet, 
  PlusCircle, 
  Printer, 
  ArrowRight, 
  Info, 
  Plus, 
  Trash2,
  Sparkles,
  Search,
  AlertCircle,
  ShieldCheck,
  Globe,
  Copy,
  Edit3,
  Home,
  MapPin
} from 'lucide-react';
import { EditCertificateModal } from './EditCertificateModal';
import { WarishApplicationForm } from './WarishApplicationForm';
import { TradeLicenseApplicationForm } from './TradeLicenseApplicationForm';

interface CertificateApplyViewProps {
  initialType?: CertificateType;
  onNavigate: (view: string, data?: any) => void;
  onViewCertificate: (app: CertificateApplication, options?: { isDuplicate?: boolean }) => void;
}

export const CertificateApplyView: React.FC<CertificateApplyViewProps> = ({
  initialType = 'citizenship',
  onNavigate,
  onViewCertificate
}) => {
  const { currentUser, userProfile, isOperator, isAdmin, isStaff } = useAuth();
  const [selectedType, setSelectedType] = useState<CertificateType>(initialType);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [editingExistingApp, setEditingExistingApp] = useState<CertificateApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [insufficientBalanceAlert, setInsufficientBalanceAlert] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<CertificateApplication | null>(null);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Sync selected certificate type when navigated directly from sidebar
  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  // Common Form Fields
  const [applicantNameBn, setApplicantNameBn] = useState('');
  const [applicantNameEn, setApplicantNameEn] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [maritalStatus, setMaritalStatus] = useState('বিবাহিত');
  const [nidOrBirthReg, setNidOrBirthReg] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('');

  // Present Address Fields
  const [presentVillage, setPresentVillage] = useState('');
  const [presentWard, setPresentWard] = useState('০১');
  const [presentPost, setPresentPost] = useState('হালসা-৭০৩১');
  const [presentUpazila, setPresentUpazila] = useState('মিরপুর');
  const [presentDistrict, setPresentDistrict] = useState('কুষ্টিয়া');

  // Permanent Address Fields & Same-As-Present Toggle
  const [sameAsPresent, setSameAsPresent] = useState(true);
  const [permanentVillage, setPermanentVillage] = useState('');
  const [permanentWard, setPermanentWard] = useState('০১');
  const [permanentPost, setPermanentPost] = useState('হালসা-৭০৩১');
  const [permanentUpazila, setPermanentUpazila] = useState('মিরপুর');
  const [permanentDistrict, setPermanentDistrict] = useState('কুষ্টিয়া');

  // Legacy address fields & Holding No
  const [village, setVillage] = useState('');
  const [wardNo, setWardNo] = useState('০১');
  const [postOffice, setPostOffice] = useState('হালসা-৭০৩১');
  const [holdingNo, setHoldingNo] = useState('');

  const handleToggleSameAddress = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      setPermanentVillage(presentVillage);
      setPermanentWard(presentWard);
      setPermanentPost(presentPost);
      setPermanentUpazila(presentUpazila);
      setPermanentDistrict(presentDistrict);
    }
  };

  const handlePresentVillageChange = (val: string) => {
    setPresentVillage(val);
    setVillage(val);
    if (sameAsPresent) setPermanentVillage(val);
  };

  const handlePresentWardChange = (val: string) => {
    setPresentWard(val);
    setWardNo(val);
    if (sameAsPresent) setPermanentWard(val);
  };

  const handlePresentPostChange = (val: string) => {
    setPresentPost(val);
    setPostOffice(val);
    if (sameAsPresent) setPermanentPost(val);
  };

  const handlePresentUpazilaChange = (val: string) => {
    setPresentUpazila(val);
    if (sameAsPresent) setPermanentUpazila(val);
  };

  const handlePresentDistrictChange = (val: string) => {
    setPresentDistrict(val);
    if (sameAsPresent) setPermanentDistrict(val);
  };

  // Certificate Specific Fields
  const [annualIncome, setAnnualIncome] = useState<number>(180000);
  const [incomeSource, setIncomeSource] = useState('ব্যবসা ও কৃষি');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('মুদি ও স্টেশনারি');
  const [businessAddress, setBusinessAddress] = useState('আমবাড়ীয়া বাজার');
  const [businessCapital, setBusinessCapital] = useState<number>(500000);
  const [deceasedPersonName, setDeceasedPersonName] = useState('');
  const [deceasedDate, setDeceasedDate] = useState('');
  const [previousHusbandName, setPreviousHusbandName] = useState('');
    // Additional certificate fields
  const [deathPersonName, setDeathPersonName] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathCause, setDeathCause] = useState('');
  const [deathBookNumber, setDeathBookNumber] = useState('');
  const [deathRegistrationNumber, setDeathRegistrationNumber] = useState('');

  const [nationality, setNationality] = useState('বাংলাদেশী');
  const [communityName, setCommunityName] = useState('');
  const [religion, setReligion] = useState('');

  const [voterAreaOld, setVoterAreaOld] = useState('');
  const [voterAreaNew, setVoterAreaNew] = useState('');
  const [voterTransferReason, setVoterTransferReason] = useState('');

  const [correctionField, setCorrectionField] = useState('');
  const [correctionOldValue, setCorrectionOldValue] = useState('');
  const [correctionNewValue, setCorrectionNewValue] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [permissionPurpose, setPermissionPurpose] = useState('');

  const [landDescription, setLandDescription] = useState('');
  const [landAmount, setLandAmount] = useState('');

  const [agricultureType, setAgricultureType] = useState('');
  const [agricultureLand, setAgricultureLand] = useState('');

  const [freedomFighterName, setFreedomFighterName] = useState('');
  const [freedomFighterRelation, setFreedomFighterRelation] = useState('');
  const [freedomFighterNumber, setFreedomFighterNumber] = useState('');

  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);

  const [disabilityType, setDisabilityType] = useState('');
  const [disabilityDescription, setDisabilityDescription] = useState('');

  const [unemploymentDuration, setUnemploymentDuration] = useState('');

  const [constructionType, setConstructionType] = useState('');
  const [constructionLocation, setConstructionLocation] = useState('');
  const [constructionPurpose, setConstructionPurpose] = useState('');

  const [previousAddress, setPreviousAddress] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [sameNamePerson, setSameNamePerson] = useState('');
  const [sameNameRelation, setSameNameRelation] = useState('');
  const [sameNameField, setSameNameField] = useState('');
  const [sameNameEntries, setSameNameEntries] = useState<SameNameEntry[]>([]);
  const [sameNameGuardianType, setSameNameGuardianType] = useState<'father' | 'husband'>('father');
  const [sameNameDeceased, setSameNameDeceased] = useState(false);

  const handleSameNameAdd = () => {
    const name = sameNamePerson.trim();
    const field = sameNameField as SameNameEntry['field'];
    if (!name || !field) return;

    setSameNameEntries((prev) => [...prev, { field, name }]);
    setSameNamePerson('');
  };

  const handleSameNameRemove = (index: number) => {
    setSameNameEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSameNameClearAll = () => {
    setSameNameEntries([]);
    setSameNamePerson('');
  };

  const [correctionDetails, setCorrectionDetails] = useState('');

  const [generalPurpose, setGeneralPurpose] = useState('');
  const [certificateDetails, setCertificateDetails] = useState('');

  const [marriageDate, setMarriageDate] = useState('');
  const [spouseName2, setSpouseName2] = useState('');

  const [orphanGuardian, setOrphanGuardian] = useState('');

  const [miscellaneousDetails, setMiscellaneousDetails] = useState('');

  // Dynamic Heir List for Inheritance Certificate
  const [heirs, setHeirs] = useState<HeirItem[]>([
    { name: '', relation: 'স্ত্রী', age: '', nidOrBirth: '' }
  ]);

  // Dynamic Family Member List
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([
    { name: '', relation: 'স্ত্রী', age: '' }
  ]);

  // Family certificate guardian selector: Father or Husband.
  const [familyGuardianType, setFamilyGuardianType] = useState<'father' | 'husband'>('father');
  const [guardianType, setGuardianType] = useState<'father' | 'husband'>('father');

  // NID Lookup & Duplicate Detection State (Crucial Firebase Logic)
  const [existingRecordFound, setExistingRecordFound] = useState<CertificateApplication | null>(null);
  const [sharedProfileFound, setSharedProfileFound] = useState<CitizenProfile | null>(null);
  const [checkingNid, setCheckingNid] = useState(false);
  const [nidCheckedStatus, setNidCheckedStatus] = useState<'idle' | 'found' | 'not_found'>('idle');

  // English applications must only auto-fill from the dedicated English fields.
  // Never copy Bengali identity/address values into English inputs, even for legacy
  // records where an *_En field was accidentally stored in Bengali text.
  const englishAutofillValue = (value?: string | null): string => {
    const normalized = value?.trim() || '';
    return /[\u0980-\u09FF]/.test(normalized) ? '' : normalized;
  };

  // Automatically populate applicant details in the current application form
  const applyApplicantData = (
    data: CertificateApplication,
    targetLanguage: 'bn' | 'en' = language
  ) => {
    const isEnglishApplication = targetLanguage === 'en';

    // Core identity and contact
    setApplicantNameBn(data.applicantNameBn || '');
    setApplicantNameEn(englishAutofillValue(data.applicantNameEn));
    setFatherName(isEnglishApplication ? englishAutofillValue(data.fatherNameEn) : (data.fatherName || ''));
    setMotherName(isEnglishApplication ? englishAutofillValue(data.motherNameEn) : (data.motherName || ''));
    setSpouseName(isEnglishApplication ? englishAutofillValue(data.spouseNameEn) : (data.spouseName || ''));
    setGender(data.gender || 'male');
    setMaritalStatus(data.maritalStatus || 'বিবাহিত');
    setMobile(data.mobile || '');
    setDob(data.dob || '');
    if (data.occupation) setOccupation(data.occupation);

    if (data.guardianType === 'father' || data.guardianType === 'husband') {
      setGuardianType(data.guardianType);
    } else if (
      (isEnglishApplication ? englishAutofillValue(data.spouseNameEn) : data.spouseName) &&
      !(isEnglishApplication ? englishAutofillValue(data.fatherNameEn) : data.fatherName)
    ) {
      setGuardianType('husband');
    } else {
      setGuardianType('father');
    }

    if (data.familyGuardianType === 'father' || data.familyGuardianType === 'husband') {
      setFamilyGuardianType(data.familyGuardianType);
    } else if (
      (isEnglishApplication ? englishAutofillValue(data.spouseNameEn) : data.spouseName) &&
      !(isEnglishApplication ? englishAutofillValue(data.fatherNameEn) : data.fatherName)
    ) {
      setFamilyGuardianType('husband');
    } else {
      setFamilyGuardianType('father');
    }

    // Present + permanent address. English mode uses *_En only.
    const pVill = isEnglishApplication
      ? englishAutofillValue(data.presentVillageEn || data.villageEn)
      : (data.presentVillage || data.village || '');
    const pWard = data.presentWard || data.wardNo || '০১';
    const pPost = isEnglishApplication
      ? englishAutofillValue(data.presentPostEn || data.postOfficeEn)
      : (data.presentPost || data.postOffice || '');
    const pUpazila = isEnglishApplication
      ? englishAutofillValue(data.presentUpazilaEn)
      : (data.presentUpazila || '');
    const pDist = isEnglishApplication
      ? englishAutofillValue(data.presentDistrictEn)
      : (data.presentDistrict || '');

    const permVill = isEnglishApplication
      ? englishAutofillValue(data.permanentVillageEn || data.villageEn)
      : (data.permanentVillage || data.village || '');
    const permWard = data.permanentWard || data.wardNo || '০১';
    const permPost = isEnglishApplication
      ? englishAutofillValue(data.permanentPostEn || data.postOfficeEn)
      : (data.permanentPost || data.postOffice || '');
    const permUpazila = isEnglishApplication
      ? englishAutofillValue(data.permanentUpazilaEn)
      : (data.permanentUpazila || '');
    const permDist = isEnglishApplication
      ? englishAutofillValue(data.permanentDistrictEn)
      : (data.permanentDistrict || '');

    setPresentVillage(pVill);
    setPresentWard(pWard);
    setPresentPost(pPost);
    setPresentUpazila(pUpazila);
    setPresentDistrict(pDist);

    setPermanentVillage(permVill);
    setPermanentWard(permWard);
    setPermanentPost(permPost);
    setPermanentUpazila(permUpazila);
    setPermanentDistrict(permDist);

    setVillage(permVill || pVill);
    setWardNo(permWard || pWard);
    setPostOffice(permPost || pPost);
    setHoldingNo(data.holdingNo || '');

    const isSame =
      !data.permanentVillage &&
      !data.permanentVillageEn ||
      (
        isEnglishApplication
          ? data.presentVillageEn === data.permanentVillageEn &&
            data.presentWard === data.permanentWard
          : data.presentVillage === data.permanentVillage &&
            data.presentWard === data.permanentWard
      );
    setSameAsPresent(isSame);

    // Common certificate/profile data
    setAnnualIncome(data.annualIncome ?? 0);
    setIncomeSource(data.incomeSource || '');
    setBusinessName(data.businessName || '');
    setBusinessType(data.businessType || '');
    setBusinessAddress(data.businessAddress || '');
    setBusinessCapital(data.businessCapital ?? 0);
    setDeceasedPersonName(data.deceasedPersonName || '');
    setDeceasedDate(data.deceasedDate || '');
    setPreviousHusbandName(data.previousHusbandName || '');

    setDeathPersonName(data.deathPersonName || '');
    setDeathDate(data.deathDate || '');
    setDeathPlace(data.deathPlace || '');
    setDeathCause(data.deathCause || '');
    setDeathBookNumber(data.deathBookNumber || '');
    setDeathRegistrationNumber(data.deathRegistrationNumber || '');

    setNationality(data.nationality || '');
    setCommunityName(data.communityName || '');
    setReligion(data.religion || '');

    setVoterAreaOld(data.voterAreaOld || '');
    setVoterAreaNew(data.voterAreaNew || '');
    setVoterTransferReason(data.voterTransferReason || '');

    setCorrectionField(data.correctionField || '');
    setCorrectionOldValue(data.correctionOldValue || '');
    setCorrectionNewValue(data.correctionNewValue || '');

    setGuardianName(data.guardianName || '');
    setGuardianRelation(data.guardianRelation || '');
    setPermissionPurpose(data.permissionPurpose || '');

    setLandDescription(data.landDescription || '');
    setLandAmount(data.landAmount || '');

    setAgricultureType(data.agricultureType || '');
    setAgricultureLand(data.agricultureLand || '');

    setFreedomFighterName(data.freedomFighterName || '');
    setFreedomFighterRelation(data.freedomFighterRelation || '');
    setFreedomFighterNumber(data.freedomFighterNumber || '');

    setMonthlyIncome(data.monthlyIncome ?? 0);
    setDisabilityType(data.disabilityType || '');
    setDisabilityDescription(data.disabilityDescription || '');
    setUnemploymentDuration(data.unemploymentDuration || '');

    setConstructionType(data.constructionType || '');
    setConstructionLocation(data.constructionLocation || '');
    setConstructionPurpose(data.constructionPurpose || '');

    setPreviousAddress(data.previousAddress || '');
    setNewAddress(data.newAddress || '');

    const storedSameNameEntries = Array.isArray(data.sameNameEntries)
      ? data.sameNameEntries.filter(
          (entry): entry is SameNameEntry =>
            !!entry &&
            typeof entry.name === 'string' &&
            !!entry.name.trim() &&
            ['নিজের নাম', 'পিতার নাম', 'স্বামীর নাম', 'মাতার নাম'].includes(entry.field)
        )
      : [];

    if (storedSameNameEntries.length > 0) {
      setSameNameEntries(storedSameNameEntries);
    } else if (data.sameNamePerson?.trim()) {
      setSameNameEntries([{
        field: (data.sameNameRelation || 'নিজের নাম') as SameNameEntry['field'],
        name: data.sameNamePerson.trim()
      }]);
    } else {
      setSameNameEntries([]);
    }
    // The new entry input must always start blank; it is not the applicant's name.
    setSameNamePerson('');
    setSameNameRelation('');
    setSameNameField('');

    setCorrectionDetails(data.correctionDetails || '');
    setGeneralPurpose(data.generalPurpose || '');
    setCertificateDetails(data.certificateDetails || '');

    setMarriageDate(data.marriageDate || '');
    setSpouseName2(data.spouseName2 || '');
    setOrphanGuardian(data.orphanGuardian || '');
    setMiscellaneousDetails(data.miscellaneousDetails || '');

    if (Array.isArray(data.heirs) && data.heirs.length > 0) setHeirs(data.heirs);
    if (Array.isArray(data.familyMembers) && data.familyMembers.length > 0) setFamilyMembers(data.familyMembers);
  };

  // Find the latest application matching the entered NID.
  // Operators use their own application history for duplicate actions, while
  // reusable citizen identity/address data is stored separately in a sanitized
  // shared profile. This prevents one operator from seeing another operator's
  // tracking, billing, account or union metadata.
  const findLatestApplicationByNid = async (rawVal: string): Promise<CertificateApplication | null> => {
    const cleanNid = cleanNidNumber(rawVal);
    if (!currentUser || cleanNid.length < 10) return null;

    const candidateKeys = Array.from(new Set([
      cleanNid,
      toBengaliNumber(cleanNid),
      rawVal.trim()
    ])).filter(k => k.length >= 10);

    let matchedDocs: CertificateApplication[] = [];

    if (isAdmin) {
      const q = query(
        collection(db, 'applications'),
        where('nidOrBirthReg', 'in', candidateKeys)
      );
      const querySnap = await getDocs(q);
      matchedDocs = querySnap.docs.map(d => d.data() as CertificateApplication);
    } else {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', currentUser.uid)
      );
      const querySnap = await getDocs(q);

      matchedDocs = querySnap.docs
        .map(d => d.data() as CertificateApplication)
        .filter(app => cleanNidNumber(app.nidOrBirthReg) === cleanNid);
    }

    if (matchedDocs.length === 0) return null;

    matchedDocs.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return matchedDocs[0];
  };

  const findSharedCitizenProfileByNid = async (rawVal: string): Promise<CitizenProfile | null> => {
    const profileId = await createCitizenProfileId(rawVal);
    if (!profileId) return null;

    const snapshot = await getDoc(doc(db, 'citizen_profiles', profileId));
    return snapshot.exists() ? (snapshot.data() as CitizenProfile) : null;
  };

  const applySharedCitizenProfile = (profile: CitizenProfile) => {
    applyApplicantData(profile);
    setSharedProfileFound(profile);
  };

  // Listen to NID input changes and trigger a Firestore query to fetch and auto-fill existing applicant data
  useEffect(() => {
    const rawVal = nidOrBirthReg.trim();
    const cleanNid = cleanNidNumber(rawVal);

    // Bangladesh national IDs are 10, 13, or 17 digits; birth registration numbers are 17 digits
    if (cleanNid.length < 10) {
      if (nidCheckedStatus !== 'idle') setNidCheckedStatus('idle');
      if (existingRecordFound) setExistingRecordFound(null);
      if (sharedProfileFound) setSharedProfileFound(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingNid(true);
      try {
        const latestRecord = await findLatestApplicationByNid(rawVal);

        if (latestRecord) {
          applyApplicantData(latestRecord);
          setExistingRecordFound(latestRecord);
          setSharedProfileFound(null);
          setNidCheckedStatus('found');
        } else {
          const sharedProfile = isStaff
            ? await findSharedCitizenProfileByNid(rawVal)
            : null;

          if (sharedProfile) {
            applySharedCitizenProfile(sharedProfile);
            setExistingRecordFound(null);
            setNidCheckedStatus('found');
          } else {
            setExistingRecordFound(null);
            setSharedProfileFound(null);
            setNidCheckedStatus('not_found');
          }
        }
      } catch (err) {
        console.error('NID auto-fetch query error:', err);
        setExistingRecordFound(null);
        setNidCheckedStatus('not_found');
      } finally {
        setCheckingNid(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nidOrBirthReg, currentUser?.uid, isAdmin, isStaff, language]);

  // Query Firebase Firestore applications manually (e.g. on blur or search click)
  const checkNidInDatabase = async (nidToSearch?: string) => {
    const rawVal = (nidToSearch || nidOrBirthReg).trim();
    const cleanNid = cleanNidNumber(rawVal);
    if (!cleanNid || cleanNid.length < 10) return;

    setCheckingNid(true);
    setNidCheckedStatus('idle');
    try {
      const existingData = await findLatestApplicationByNid(rawVal);

      if (existingData) {
        applyApplicantData(existingData);
        setExistingRecordFound(existingData);
        setSharedProfileFound(null);
        setNidCheckedStatus('found');
      } else {
        const sharedProfile = isStaff
          ? await findSharedCitizenProfileByNid(rawVal)
          : null;

        if (sharedProfile) {
          applySharedCitizenProfile(sharedProfile);
          setExistingRecordFound(null);
          setNidCheckedStatus('found');
        } else {
          setExistingRecordFound(null);
          setSharedProfileFound(null);
          setNidCheckedStatus('not_found');
        }
      }
    } catch (err) {
      console.error('NID check error:', err);
      setExistingRecordFound(null);
      setNidCheckedStatus('not_found');
    } finally {
      setCheckingNid(false);
    }
  };

  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  const certMeta = CERTIFICATE_CATALOG[selectedType];
  // Every certificate in this general application form uses an explicit Father/Husband selector.
  // The family certificate has its own dedicated selector, so avoid rendering two selectors there.
  const needsGuardianSelector = selectedType !== 'family';
  const currentBalance = userProfile?.balance ?? 0;
  const isBalanceSufficient = currentBalance >= 2.0;

  const addHeirRow = () => {
    setHeirs([...heirs, { name: '', relation: 'পুত্র', age: '', nidOrBirth: '' }]);
  };

  const removeHeirRow = (idx: number) => {
    setHeirs(heirs.filter((_, i) => i !== idx));
  };

  const updateHeirRow = (idx: number, field: keyof HeirItem, val: string) => {
    const updated = [...heirs];
    updated[idx][field] = val;
    setHeirs(updated);
  };

  const addFamilyRow = () => {
    setFamilyMembers([...familyMembers, { name: '', relation: 'পুত্র', age: '' }]);
  };

  const removeFamilyRow = (idx: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== idx));
  };

  const updateFamilyRow = (idx: number, field: keyof FamilyMemberItem, val: string) => {
    const updated = [...familyMembers];
    updated[idx][field] = val;
    setFamilyMembers(updated);
  };

  // Automated Fee Deduction & Submission Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !userProfile) {
      alert('আবেদন দাখিলের জন্য অনুগ্রহ করে লগইন করুন।');
      return;
    }

    if (!declarationAgreed) {
      alert('অনুগ্রহ করে অঙ্গীকারনামায় টিক চিহ্ন দিয়ে সম্মতি প্রদান করুন।');
      return;
    }

    // CRUCIAL CHECK: Balance must be >= 2 BDT
    if (currentBalance < 2.0) {
      setInsufficientBalanceAlert(true);
      return;
    }

    setLoading(true);

    try {
      const trackingId = generateTrackingId('AMB');
      const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const userDocRef = doc(db, 'users', currentUser.uid);
      const appDocRef = doc(db, 'applications', appId);
      const txDocRef = doc(db, 'transactions', txId);
      const citizenProfileId = await createCitizenProfileId(nidOrBirthReg);
      const citizenProfileRef = citizenProfileId
        ? doc(db, 'citizen_profiles', citizenProfileId)
        : null;

      // Run transactional update to guarantee balance deduction atomicity
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User profile does not exist in Firestore!');
        }

        const currentBal = Number(userDoc.data().balance) || 0;
        let newBalance = currentBal;

        if (!isOperator) {
          if (currentBal < 2.0) {
            throw new Error('পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে এড ব্যালেন্স করুন।');
          }

          newBalance = Number((currentBal - 2.0).toFixed(2));

          // Citizens pay the standard 2 BDT certificate application fee.
          transaction.update(userDocRef, {
            balance: newBalance,
            updatedAt: nowIso
          });
        }

        // Applications created by both citizens and operators remain Pending until reviewed.
        // The operator usage charge is applied only when the operator approves the application.
        const appPayload: Record<string, any> = {
          id: appId,
          trackingId,
          userId: currentUser.uid,
          userName: applicantNameBn || userProfile.name,
          userEmail: currentUser.email || '',
          certificateType: selectedType,
          certificateTitleBn: certMeta.titleBn,
          certificateTitleEn: certMeta.titleEn,
          language: language,
          applicantNameBn,
          applicantNameEn: language === 'en' ? applicantNameEn.trim() : '',
          fatherName,
          fatherNameEn: language === 'en' ? fatherName.trim() : '',
          motherName,
          motherNameEn: language === 'en' ? motherName.trim() : '',
          spouseName,
          spouseNameEn: language === 'en' ? spouseName.trim() : '',
          // Present Address
          presentVillage: presentVillage.trim(),
          presentVillageEn: language === 'en' ? presentVillage.trim() : '',
          presentWard: presentWard.trim(),
          presentPost: presentPost.trim(),
          presentPostEn: language === 'en' ? presentPost.trim() : '',
          presentUpazila: presentUpazila.trim() || 'মিরপুর',
          presentUpazilaEn: language === 'en' ? (presentUpazila.trim() || 'Mirpur') : '',
          presentDistrict: presentDistrict.trim() || 'কুষ্টিয়া',
          presentDistrictEn: language === 'en' ? (presentDistrict.trim() || 'Kushtia') : '',
          // Permanent Address
          permanentVillage: (sameAsPresent ? presentVillage : permanentVillage).trim(),
          permanentVillageEn: language === 'en' ? (sameAsPresent ? presentVillage : permanentVillage).trim() : '',
          permanentWard: (sameAsPresent ? presentWard : permanentWard).trim(),
          permanentPost: (sameAsPresent ? presentPost : permanentPost).trim(),
          permanentPostEn: language === 'en' ? (sameAsPresent ? presentPost : permanentPost).trim() : '',
          permanentUpazila: (sameAsPresent ? presentUpazila : permanentUpazila).trim() || 'মিরপুর',
          permanentUpazilaEn: language === 'en' ? ((sameAsPresent ? presentUpazila : permanentUpazila).trim() || 'Mirpur') : '',
          permanentDistrict: (sameAsPresent ? presentDistrict : permanentDistrict).trim() || 'কুষ্টিয়া',
          permanentDistrictEn: language === 'en' ? ((sameAsPresent ? presentDistrict : permanentDistrict).trim() || 'Kushtia') : '',
          // Legacy fields for backwards compatibility
          village: (sameAsPresent ? presentVillage : permanentVillage).trim(),
          villageEn: language === 'en' ? (sameAsPresent ? presentVillage : permanentVillage).trim() : '',
          wardNo: (sameAsPresent ? presentWard : permanentWard).trim(),
          postOffice: (sameAsPresent ? presentPost : permanentPost).trim(),
          postOfficeEn: (sameAsPresent ? presentPost : permanentPost).trim(),
          gender,
          maritalStatus: maritalStatus || 'বিবাহিত',
          nidOrBirthReg,
          mobile: mobile.trim(),
          occupation: occupation || undefined,
          fee: 2.0,
          status: 'Pending',
          createdAt: nowIso
        };

        if (spouseName) appPayload.spouseName = spouseName;
        if (dob) appPayload.dob = dob;
        if (holdingNo) appPayload.holdingNo = holdingNo;
        if (needsGuardianSelector) appPayload.guardianType = guardianType;

        if (selectedType === 'income' || selectedType === 'annual_income') {
          appPayload.annualIncome = Number(annualIncome) || 0;
          appPayload.incomeSource = incomeSource || 'ব্যবসা ও কৃষি';
        } else if (selectedType === 'monthly_income') {
          appPayload.monthlyIncome = Number(monthlyIncome) || 0;
          appPayload.incomeSource = incomeSource || 'চাকুরি / ব্যবসা';
        } else if (selectedType === 'trade_license') {
          if (businessName) appPayload.businessName = businessName;
          if (businessType) appPayload.businessType = businessType;
          if (businessAddress) appPayload.businessAddress = businessAddress;
          if (businessCapital) appPayload.businessCapital = Number(businessCapital) || 0;
        } else if (selectedType === 'inheritance' || selectedType === 'succession') {
          if (deceasedPersonName) {
            appPayload.deceasedPersonName = deceasedPersonName;
          }
          if (deceasedDate) {
            appPayload.deceasedDate = deceasedDate;
          }
          if (heirs.length > 0) {
            appPayload.heirs = heirs;
          }
        } else if (selectedType === 'family') {
          if (familyMembers.length > 0) {
            appPayload.familyMembers = familyMembers;
          }
        } else if (selectedType === 'non_remarriage' || selectedType === 'widow') {
          if (previousHusbandName) {
            appPayload.previousHusbandName = previousHusbandName;
          }
        } else if (selectedType === 'death') {
          appPayload.deathPersonName = deathPersonName;
          appPayload.deathDate = deathDate;
          appPayload.deathPlace = deathPlace;
          appPayload.deathCause = deathCause;
          appPayload.deathBookNumber = deathBookNumber;
          appPayload.deathRegistrationNumber = deathRegistrationNumber;
        } else if (selectedType === 'nationality' || selectedType === 'citizenship') {
          appPayload.nationality = nationality || 'বাংলাদেশী';
          if (religion) appPayload.religion = religion;
        } else if (selectedType === 'community' || selectedType === 'indigenous') {
          appPayload.communityName = communityName;
        } else if (selectedType === 'voter_area_transfer') {
          appPayload.voterAreaOld = voterAreaOld;
          appPayload.voterAreaNew = voterAreaNew;
          appPayload.voterTransferReason = voterTransferReason;
        } else if (selectedType === 'new_voter' || selectedType === 'new_voter_affidavit') {
          appPayload.previousAddress = previousAddress;
          appPayload.generalPurpose = generalPurpose;
        } else if (selectedType === 'nid_correction') {
          appPayload.correctionField = correctionField;
          appPayload.correctionOldValue = correctionOldValue;
          appPayload.correctionNewValue = correctionNewValue;
          appPayload.correctionDetails = correctionDetails;
        } else if (selectedType === 'guardian_permission') {
          appPayload.guardianName = guardianName;
          appPayload.guardianRelation = guardianRelation;
          appPayload.permissionPurpose = permissionPurpose;
        } else if (selectedType === 'landless') {
          appPayload.landDescription = landDescription;
          appPayload.landAmount = landAmount;
        } else if (selectedType === 'agriculture') {
          appPayload.agricultureType = agricultureType;
          appPayload.agricultureLand = agricultureLand;
        } else if (selectedType === 'freedom_fighter') {
          appPayload.freedomFighterName = freedomFighterName;
          appPayload.freedomFighterRelation = freedomFighterRelation;
          appPayload.freedomFighterNumber = freedomFighterNumber;
        } else if (selectedType === 'disabled') {
          appPayload.disabilityType = disabilityType;
          appPayload.disabilityDescription = disabilityDescription;
        } else if (selectedType === 'unemployed') {
          appPayload.unemploymentDuration = unemploymentDuration;
        } else if (selectedType === 'infrastructure_permission') {
          appPayload.constructionType = constructionType;
          appPayload.constructionLocation = constructionLocation;
          appPayload.constructionPurpose = constructionPurpose;
        } else if (selectedType === 'same_name') {
          const finalSameNameEntries = [...sameNameEntries];
          const pendingSameName = sameNamePerson.trim();
          if (pendingSameName && sameNameField) {
            finalSameNameEntries.push({
              field: sameNameField as SameNameEntry['field'],
              name: pendingSameName
            });
          }
          appPayload.fatherName = sameNameGuardianType === 'father' ? fatherName.trim() : '';
          appPayload.spouseName = sameNameGuardianType === 'husband' ? spouseName.trim() : '';
          appPayload.sameNameEntries = finalSameNameEntries;
          appPayload.sameNamePerson = finalSameNameEntries[0]?.name || '';
          appPayload.sameNameRelation = finalSameNameEntries[0]?.field || '';
        } else if (selectedType === 'family') {
          appPayload.familyGuardianType = familyGuardianType;
        } else if (selectedType === 'married') {
          appPayload.marriageDate = marriageDate;
          appPayload.spouseName2 = spouseName2;
        } else if (selectedType === 'orphan') {
          appPayload.orphanGuardian = orphanGuardian;
        } else if (selectedType === 'permanent_resident') {
          appPayload.generalPurpose = generalPurpose;
          appPayload.certificateDetails = certificateDetails;
        } else if (selectedType === 'character') {
          appPayload.generalPurpose = generalPurpose;
        } else if (selectedType === 'not_rohingya') {
          appPayload.generalPurpose = generalPurpose;
          appPayload.rohingyaVerificationRef = generalPurpose;
        } else if (selectedType === 'no_birth_certificate') {
          appPayload.generalPurpose = generalPurpose;
          appPayload.reasonNoBirthCert = generalPurpose;
        } else if (selectedType === 'financial_insolvency') {
          appPayload.generalPurpose = generalPurpose;
          appPayload.insolvencyReason = generalPurpose;
          appPayload.certificateDetails = certificateDetails;
        } else if (selectedType === 'no_objection') {
          appPayload.organizationName = generalPurpose;
          appPayload.nocPurpose = certificateDetails || generalPurpose;
          appPayload.generalPurpose = generalPurpose;
        } else if (selectedType === 'childless') {
          appPayload.childlessYears = generalPurpose;
          appPayload.generalPurpose = generalPurpose;
        } else if (selectedType === 'general') {
          appPayload.generalPurpose = generalPurpose;
          appPayload.certificateDetails = certificateDetails;
        } else if (selectedType === 'miscellaneous') {
          appPayload.miscellaneousDetails = miscellaneousDetails;
          appPayload.generalPurpose = generalPurpose;
        }

        const cleanedApplication = cleanDataForFirestore(appPayload) as CertificateApplication;
        transaction.set(appDocRef, cleanedApplication);

        // Shared profile contains only reusable citizen identity/address data.
        // Operator account, certificate, tracking, billing and union metadata
        // are intentionally excluded.
        if (citizenProfileRef && citizenProfileId) {
          const citizenProfile = buildCitizenProfile(
            appPayload as Partial<CertificateApplication>,
            citizenProfileId,
            nowIso
          );
          transaction.set(
            citizenProfileRef,
            cleanDataForFirestore(citizenProfile),
            { merge: true }
          );
        }

        // Citizens are charged the standard 2 BDT application fee.
        if (!isOperator) {
          const feeTransaction: Transaction = {
            id: txId,
            userId: currentUser.uid,
            type: 'fee_deduction',
            amount: 2.0,
            balanceAfter: newBalance,
            description: `সনদ আবেদন ফি: ${certMeta.titleBn} (ট্র্যাকিং: ${trackingId})`,
            referenceId: trackingId,
            createdAt: nowIso
          };
          transaction.set(txDocRef, cleanDataForFirestore(feeTransaction));
        }

        return cleanedApplication;
      }).then((newApp) => {
        clearCurrentApplicationData();
        const unified = setCurrentApplicationData(newApp as CertificateApplication);
        setSubmittedApp(unified);
      });

    } catch (err: any) {
      console.error('Submission error:', err);
      if (err.message?.includes('পর্যাপ্ত ব্যালেন্স নেই')) {
        setInsufficientBalanceAlert(true);
      } else {
        handleFirestoreError(err, OperationType.WRITE, 'applications');
        alert(`ত্রুটি: ${err.message || 'আবেদন প্রক্রিয়াকরণে সমস্যা হয়েছে।'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {editingExistingApp && (
        <EditCertificateModal
          application={editingExistingApp}
          onClose={() => setEditingExistingApp(null)}
          onSaveSuccess={(updated) => {
            setEditingExistingApp(null);
            setSubmittedApp(updated);
          }}
          onViewCertificate={(updated) => {
            setEditingExistingApp(null);
            setSubmittedApp(updated);
            if (updated.status === 'Approved') {
              onViewCertificate(updated);
            }
          }}
        />
      )}
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Insufficient Balance Alert Modal */}
      {insufficientBalanceAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-red-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              পর্যাপ্ত ব্যালেন্স নেই!
            </h3>
            <p className="text-red-700 font-semibold bg-red-50 py-2.5 px-4 rounded-xl text-sm mb-4 border border-red-200">
              পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে এড ব্যালেন্স করুন।
            </p>
            <p className="text-slate-600 text-xs mb-6">
              প্রতিটি প্রত্যয়ন পত্রের সরকারি ফি <span className="font-bold text-emerald-800">২.০০ টাকা</span>। আপনার বর্তমান ব্যালেন্স: <span className="font-bold text-red-600">{formatCurrencyBn(currentBalance)}</span>।
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setInsufficientBalanceAlert(false)}
                className="cursor-pointer py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsufficientBalanceAlert(false);
                  onNavigate('add_balance');
                }}
                className="cursor-pointer py-2.5 px-5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>এখনই এড ব্যালেন্স করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Printable Certificate Trigger */}
      {submittedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl border border-emerald-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {submittedApp.status === 'Approved' ? 'সনদ প্রস্তুত!' : 'আবেদন সফলভাবে জমা হয়েছে!'}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {isOperator
                ? `উদ্যোক্তা billing rule অনুযায়ী usage charge ৳${submittedApp.completionCharge ?? 0} কাটা হয়েছে।`
                : 'সরকারি ফি হিসেবে ওয়ালেট থেকে ২.০০ টাকা কর্তন হয়েছে। এখন আবেদনটি ইউনিয়ন উদ্যোক্তার অনুমোদনের অপেক্ষায় আছে।'}
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">সনদের নাম:</span>
                <span className="font-bold text-emerald-900">{submittedApp.certificateTitleBn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">ট্র্যাকিং নম্বর:</span>
                <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {submittedApp.trackingId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">আবেদনকারী:</span>
                <span className="font-semibold text-slate-800">{submittedApp.applicantNameBn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">অবস্থা:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  submittedApp.status === 'Approved'
                    ? 'text-emerald-700 bg-emerald-200/70'
                    : 'text-amber-800 bg-amber-100'
                }`}>
                  {submittedApp.status === 'Approved' ? 'অনুমোদিত (Approved)' : 'অনুমোদনের অপেক্ষায় (Pending)'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              {submittedApp.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingExistingApp(submittedApp);
                    setSubmittedApp(null);
                  }}
                  className="cursor-pointer py-3 px-5 text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>তথ্য ভুল? এখনই সম্পাদনা করুন</span>
                </button>
              )}
              {submittedApp.status === 'Approved' && (
                <button
                  type="button"
                  onClick={() => {
                    const app = submittedApp;
                    setSubmittedApp(null);
                    onViewCertificate(app);
                  }}
                  className="cursor-pointer py-3 px-6 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-lg flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  <span>সনদ দেখুন ও প্রিন্ট করুন</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmittedApp(null);
                  onNavigate('certificates');
                }}
                className="cursor-pointer py-3 px-4 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                সকল সনদের তালিকা
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact reference-style application title bar */}
      <div className="application-titlebar">
        <div className="application-titlebar__title">
          <span>আবেদন &gt; {language === 'en' ? certMeta.titleEn : certMeta.titleBn}</span>
        </div>
        <label className="application-titlebar__english">
          <input
            type="checkbox"
            checked={language === 'en'}
            onChange={(e) => setLanguage(e.target.checked ? 'en' : 'bn')}
          />
          <span>ইংরেজিতেও আবেদন করুন</span>
        </label>
      </div>

      {/* Main Application Form */}
      {selectedType === 'inheritance' || selectedType === 'succession' ? (
        <WarishApplicationForm
          onSuccess={(app) => {
            onViewCertificate(app);
          }}
        />
      ) : selectedType === 'trade_license' ? (
        <TradeLicenseApplicationForm
          onSuccess={(app) => {
            onViewCertificate(app);
          }}
        />
      ) : (
        <form onSubmit={handleSubmit} className="application-form space-y-5">
        {/* Clean Duplicate Copy / Previous Record Notice */}
        {sharedProfileFound && !existingRecordFound && (
          <div className="bg-blue-50/95 border border-blue-300 px-4 py-3.5 rounded-xl shadow-2xs animate-in fade-in flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-200/80 text-blue-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs text-blue-950">
                <span>
                  এনআইডি <strong>••••{cleanNidNumber(nidOrBirthReg).slice(-4)}</strong>-এর পূর্বের সনদ থেকে
                  আবেদনকারীর ব্যক্তিগত ও ঠিকানার তথ্য স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে।
                  অন্য উদ্যোক্তার সনদ, হিসাব, ট্র্যাকিং বা ইউনিয়ন-সংক্রান্ত তথ্য এখানে দেখানো হয়নি।
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSharedProfileFound(null)}
              className="cursor-pointer text-slate-400 hover:text-slate-700 p-1 text-xs"
              title="বিজ্ঞপ্তি বন্ধ করুন"
            >
              ✕
            </button>
          </div>
        )}

        {existingRecordFound && (
          <div className="bg-emerald-50/95 border border-emerald-300 px-4 py-3.5 rounded-xl shadow-2xs animate-in fade-in flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-950">
                <span>এনআইডি <strong>{existingRecordFound.nidOrBirthReg}</strong>-এর পূর্ববর্তী রেকর্ড থেকে আবেদনকারীর তথ্য স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে (পূর্বে ইস্যুকৃত: <strong>{existingRecordFound.certificateTitleBn}</strong>, স্মারক: <span className="font-mono font-semibold">{existingRecordFound.trackingId}</span>)।</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onViewCertificate(existingRecordFound, { isDuplicate: true })}
                className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1.5"
                title="পূর্বে ইস্যুকৃত সনদের হুবহু অনুলিপি কপি প্রিন্ট করুন"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>ডুপ্লিকেট কপি (Duplicate Copy)</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingExistingApp(existingRecordFound)}
                className="cursor-pointer bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1.5"
                title="ভুল বানান বা তথ্য সংশোধন করুন (বিনা ফিতে)"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>তথ্য সম্পাদন (Edit)</span>
              </button>
              <button
                type="button"
                onClick={() => onViewCertificate(existingRecordFound)}
                className="cursor-pointer bg-[#006a4e] hover:bg-[#084d34] text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-200" />
                <span>পূর্বের সনদ দেখুন</span>
              </button>
              <button
                type="button"
                onClick={() => setExistingRecordFound(null)}
                className="cursor-pointer text-slate-400 hover:text-slate-700 p-1 text-xs"
                title="বিজ্ঞপ্তি বন্ধ করুন"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Applicant Basic Info */}
        <div className={selectedType === 'same_name' ? 'same-name-reference-fields' : ''}>
          <h3 className="application-section-heading text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? '1. Applicant Personal Information' : '১. আবেদনকারীর ব্যক্তিগত তথ্যাবলী'}</span>
          </h3>

          {selectedType === 'same_name' ? (
            <>
              <div className="same-name-reference-grid">
                <div>
                  <label className="same-name-field-label">
                    নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantNameBn}
                    onChange={(e) => setApplicantNameBn(e.target.value)}
                    placeholder="নাম *"
                    className="same-name-input"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    জাতীয় পরিচয়পত্র
                  </label>
                  <input
                    type="text"
                    value={nidOrBirthReg}
                    onChange={(e) => setNidOrBirthReg(e.target.value)}
                    placeholder=""
                    className="same-name-input"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    পিতা / স্বামী বেছে নিন
                  </label>
                  <select
                    value={sameNameGuardianType}
                    onChange={(e) => setSameNameGuardianType(e.target.value as 'father' | 'husband')}
                    className="same-name-input same-name-select"
                  >
                    <option value="father">পিতা</option>
                    <option value="husband">স্বামী</option>
                  </select>
                  <input
                    type="text"
                    value={sameNameGuardianType === 'father' ? fatherName : spouseName}
                    onChange={(e) => {
                      if (sameNameGuardianType === 'father') {
                        setFatherName(e.target.value);
                      } else {
                        setSpouseName(e.target.value);
                      }
                    }}
                    placeholder={sameNameGuardianType === 'father' ? 'পিতার নাম' : 'স্বামীর নাম'}
                    className="same-name-input mt-1.5"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    মাতা
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="মাতার নাম *"
                    className="same-name-input"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    গ্রাম/মহল্লা
                  </label>
                  <input
                    type="text"
                    required
                    value={presentVillage}
                    onChange={(e) => handlePresentVillageChange(e.target.value)}
                    placeholder="গ্রাম/মহল্লা *"
                    className="same-name-input"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    ওয়ার্ড
                  </label>
                  <select
                    value={presentWard}
                    onChange={(e) => handlePresentWardChange(e.target.value)}
                    className="same-name-input same-name-select"
                  >
                    {['০১','০২','০৩','০৪','০৫','০৬','০৭','০৮','০৯'].map((ward) => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="same-name-field-label">
                    ডাকঘর
                  </label>
                  <input
                    type="text"
                    required
                    value={presentPost}
                    onChange={(e) => handlePresentPostChange(e.target.value)}
                    placeholder="ডাকঘর *"
                    className="same-name-input"
                  />
                </div>
 
                <div>
                  <label className="same-name-field-label">
                    উপজেলা
                  </label>
                  <input
                    type="text"
                    required
                    value={presentUpazila}
                    onChange={(e) => handlePresentUpazilaChange(e.target.value)}
                    placeholder="উপজেলা *"
                    className="same-name-input"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    জেলা
                  </label>
                  <input
                    type="text"
                    required
                    value={presentDistrict}
                    onChange={(e) => handlePresentDistrictChange(e.target.value)}
                    placeholder="জেলা *"
                    className="same-name-input"
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    ছবি (সম্প্রতি তোলা = 30-100 KB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="same-name-file-input"
                    onChange={() => undefined}
                  />
                </div>

                <div>
                  <label className="same-name-field-label">
                    সংযুক্তি (সর্বোচ্চ ৫টি, প্রতিটি ২০-৮০ কেবি)
                  </label>
                  <input
                    type="file"
                    multiple
                    className="same-name-file-input"
                    onChange={() => undefined}
                  />
                </div>
              </div>

              <div className="same-name-extra-fields">
                <div className="same-name-extra-stack">
                  <label className="same-name-field-label">ক্ষেত্র নির্বাচন করুন</label>
                  <select
                    value={sameNameField}
                    onChange={(e) => setSameNameField(e.target.value)}
                    className="same-name-input same-name-select"
                  >
                    <option value="">একটি ক্ষেত্র বেছে নিন</option>
                    <option value="নিজের নাম">নিজের নাম</option>
                    <option value="পিতার নাম">পিতার নাম</option>
                    <option value="স্বামীর নাম">স্বামীর নাম</option>
                    <option value="মাতার নাম">মাতার নাম</option>
                  </select>
                  <input
                    type="text"
                    value={sameNamePerson}
                    onChange={(e) => setSameNamePerson(e.target.value)}
                    placeholder="নাম লিখুন"
                    className="same-name-input"
                  />
                  <button
                    type="button"
                    onClick={handleSameNameAdd}
                    disabled={!sameNameField || !sameNamePerson.trim()}
                    className="same-name-add-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>যোগ করুন</span>
                  </button>
                </div>

                {sameNameEntries.length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700">যোগ করা তথ্য</span>
                      <button
                        type="button"
                        onClick={handleSameNameClearAll}
                        className="text-xs font-semibold text-red-500 hover:text-red-700"
                      >
                        সব মুছুন
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {sameNameEntries.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="min-w-0 text-sm text-slate-800">
                            <span className="font-semibold text-slate-500">{entry.field}:</span>{' '}
                            <span className="font-medium break-words">{entry.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSameNameRemove(index)}
                            className="shrink-0 rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                            title="তথ্য মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <label className="same-name-deceased-toggle">
                <input
                  type="checkbox"
                  checked={sameNameDeceased}
                  onChange={(e) => setSameNameDeceased(e.target.checked)}
                />
                <span>মৃত ব্যক্তি</span>
              </label>
            </>
          ) : (
            <div className="application-basic-grid grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Applicant Name (Bengali)' : 'আবেদনকারীর নাম (বাংলায়) *'}
                </label>
                <input
                  type="text"
                  required={language === 'bn'}
                  value={applicantNameBn}
                  onChange={(e) => setApplicantNameBn(e.target.value)}
                  placeholder={language === 'en' ? 'Applicant Name in Bengali' : 'আবেদনকারীর নাম (বাংলা)'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {language === 'en' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applicant Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantNameEn}
                    onChange={(e) => setApplicantNameEn(e.target.value)}
                    placeholder="Applicant Name (English)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {selectedType === 'family' ? (
                <div className="flex items-end gap-3 min-w-0">
                  <div className="w-[110px] shrink-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'en' ? 'Guardian *' : 'অভিভাবক *'}
                    </label>
                    <select
                      value={familyGuardianType}
                      onChange={(e) => setFamilyGuardianType(e.target.value as 'father' | 'husband')}
                      className="w-full h-[38px] px-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="father">{language === 'en' ? 'Father' : 'পিতা'}</option>
                      <option value="husband">{language === 'en' ? 'Husband' : 'স্বামী'}</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {familyGuardianType === 'father' ? 'পিতার নাম (বাংলায়) *' : 'স্বামীর নাম (বাংলায়) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={familyGuardianType === 'father' ? fatherName : spouseName}
                      onChange={(e) => familyGuardianType === 'father' ? setFatherName(e.target.value) : setSpouseName(e.target.value)}
                      placeholder={familyGuardianType === 'father' ? 'পিতার নাম লিখুন' : 'স্বামীর নাম লিখুন'}
                      className="w-full h-[38px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {needsGuardianSelector && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'en' ? 'Guardian Type' : 'অভিভাবক হিসেবে পিতা / স্বামী *'}
                      </label>
                      <select
                        value={guardianType}
                        onChange={(e) => setGuardianType(e.target.value as 'father' | 'husband')}
                        className="guardian-type-select w-full max-w-[110px] px-2 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                      >
                        <option value="father">{language === 'en' ? 'Father' : 'পিতা'}</option>
                        <option value="husband">{language === 'en' ? 'Husband' : 'স্বামী'}</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'en'
                        ? (needsGuardianSelector ? (guardianType === 'father' ? "Father's Name *" : "Husband's Name *") : "Father's Name *")
                        : (needsGuardianSelector ? (guardianType === 'father' ? 'পিতার নাম (বাংলায়) *' : 'স্বামীর নাম (বাংলায়) *') : 'পিতার নাম (বাংলায়)')}
                    </label>
                    {needsGuardianSelector ? (
                      <input
                        type="text"
                        required
                        value={guardianType === 'father' ? fatherName : spouseName}
                        onChange={(e) => guardianType === 'father' ? setFatherName(e.target.value) : setSpouseName(e.target.value)}
                        placeholder={guardianType === 'father' ? 'পিতার নাম লিখুন' : 'স্বামীর নাম লিখুন'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder={language === 'en' ? "Father's Name" : 'পিতার নাম (বাংলা)'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? "Mother's Name *" : 'মাতার নাম (বাংলায়)'}
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder={language === 'en' ? "Mother's Name" : 'মাতার নাম (বাংলা)'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {!needsGuardianSelector && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'en' ? "Spouse's Name (if any)" : 'স্বামী / স্ত্রীর নাম (যদি থাকে)'}
                  </label>
                  <input
                    type="text"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    placeholder={language === 'en' ? "Spouse's Name" : 'স্বামী / স্ত্রীর নাম (বাংলা)'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Date of Birth (DOB)' : 'জন্ম তারিখ'}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>


              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {language === 'en' ? 'National ID / Birth Registration No' : 'এনআইডি / জন্ম নিবন্ধন নম্বর'}
                  </label>
                  {checkingNid && (
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 animate-pulse">
                      <span className="inline-block w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'en' ? 'Verifying NID in database...' : 'ডাটাবেজে তথ্য খোঁজা হচ্ছে...'}</span>
                    </span>
                  )}
                  {nidCheckedStatus === 'found' && !checkingNid && (
                    <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'en' ? 'Auto-filled from records' : 'তথ্য স্বয়ংক্রিয় পূরণ হয়েছে'}</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={nidOrBirthReg}
                  onChange={(e) => setNidOrBirthReg(e.target.value)}
                  placeholder={language === 'en' ? 'Enter NID / Birth Reg No (10, 13 or 17 digits)' : 'জাতীয় পরিচয়পত্র নম্বর লিখুন (১০, ১৩ বা ১৭ ডিজিট)'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                />
                {nidCheckedStatus === 'not_found' && !existingRecordFound && !checkingNid && (
                  <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'en' ? 'New NID: No previous certificate found. Please complete the form.' : 'নতুন এনআইডি - পূর্বে কোনো সনদ পাওয়া যায়নি (নিচের তথ্যগুলো পূরণ করুন)'}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedType !== 'same_name' && (
          <>
        {/* Section 2: Address Info (Present & Permanent Addresses) */}
        <div className="space-y-5">
          <div className="pb-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>{language === 'en' ? '2. Present & Permanent Address' : '২. বর্তমান ও স্থায়ী ঠিকানা'}</span>
            </h3>

            {/* Same as Present Address Checkbox */}
            <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-300 transition text-xs font-semibold text-emerald-900 select-none shadow-2xs">
              <input
                type="checkbox"
                checked={sameAsPresent}
                onChange={(e) => handleToggleSameAddress(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>{language === 'en' ? 'Permanent Address same as Present Address' : 'বর্তমান ঠিকানাই স্থায়ী ঠিকানা (একই)'}</span>
            </label>
          </div>

          {/* 2.1 Present Address Block */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'Present Address (বর্তমান ঠিকানা) *' : 'বর্তমান ঠিকানা *'}</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Village / Para *' : 'গ্রাম / মহল্লা *'}
                </label>
                <input
                  type="text"
                  required
                  value={presentVillage}
                  onChange={(e) => handlePresentVillageChange(e.target.value)}
                  placeholder={language === 'en' ? 'Village name' : 'গ্রাম বা মহল্লার নাম'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Ward No *' : 'ওয়ার্ড নং *'}
                </label>
                <select
                  value={presentWard}
                  onChange={(e) => handlePresentWardChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs bg-white"
                >
                  {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map((w, idx) => (
                    <option key={w} value={w}>
                      {language === 'en' ? `Ward No 0${idx + 1}` : `ওয়ার্ড নং ${w}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Post Office *' : 'ডাকঘর *'}
                </label>
                <input
                  type="text"
                  required
                  value={presentPost}
                  onChange={(e) => handlePresentPostChange(e.target.value)}
                  placeholder={language === 'en' ? 'Post Office' : 'ডাকঘরের নাম'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Upazila *' : 'উপজেলা *'}
                </label>
                <input
                  type="text"
                  required
                  value={presentUpazila}
                  onChange={(e) => handlePresentUpazilaChange(e.target.value)}
                  placeholder={language === 'en' ? 'Upazila' : 'উপজেলা'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'District *' : 'জেলা *'}
                </label>
                <input
                  type="text"
                  required
                  value={presentDistrict}
                  onChange={(e) => handlePresentDistrictChange(e.target.value)}
                  placeholder={language === 'en' ? 'District' : 'জেলা'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* 2.2 Permanent Address Block */}
          {!sameAsPresent && (
          <div className="p-4 rounded-xl border bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? 'Permanent Address (স্থায়ী ঠিকানা) *' : 'স্থায়ী ঠিকানা *'}</span>
                {sameAsPresent && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full ml-1">
                    {language === 'en' ? 'Synced with Present' : 'বর্তমান ঠিকানার অনুরূপ'}
                  </span>
                )}
              </h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Village / Para *' : 'গ্রাম / মহল্লা *'}
                </label>
                <input
                  type="text"
                  required
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentVillage : permanentVillage}
                  onChange={(e) => setPermanentVillage(e.target.value)}
                  placeholder={language === 'en' ? 'Village name' : 'গ্রাম বা মহল্লার নাম'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Ward No *' : 'ওয়ার্ড নং *'}
                </label>
                <select
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentWard : permanentWard}
                  onChange={(e) => setPermanentWard(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                >
                  {['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯'].map((w, idx) => (
                    <option key={w} value={w}>
                      {language === 'en' ? `Ward No 0${idx + 1}` : `ওয়ার্ড নং ${w}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Post Office *' : 'ডাকঘর *'}
                </label>
                <input
                  type="text"
                  required
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentPost : permanentPost}
                  onChange={(e) => setPermanentPost(e.target.value)}
                  placeholder={language === 'en' ? 'Post Office' : 'ডাকঘরের নাম'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Upazila *' : 'উপজেলা *'}
                </label>
                <input
                  type="text"
                  required
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentUpazila : permanentUpazila}
                  onChange={(e) => setPermanentUpazila(e.target.value)}
                  placeholder={language === 'en' ? 'Upazila' : 'উপজেলা'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'District *' : 'জেলা *'}
                </label>
                <input
                  type="text"
                  required
                  disabled={sameAsPresent}
                  value={sameAsPresent ? presentDistrict : permanentDistrict}
                  onChange={(e) => setPermanentDistrict(e.target.value)}
                  placeholder={language === 'en' ? 'District' : 'জেলা'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs ${
                    sameAsPresent ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Optional Holding No */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Holding No (Optional)' : 'হোল্ডিং নং (যদি থাকে)'}
              </label>
              <input
                type="text"
                value={holdingNo}
                onChange={(e) => setHoldingNo(e.target.value)}
                placeholder={language === 'en' ? 'Holding number' : 'হোল্ডিং নম্বর লিখুন'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs bg-white"
              />
            </div>
          </div>
          )}
        </div>

          </>
        )}
        {/* Section 3: Certificate Type Specific Fields */}
        {(selectedType === 'income' || selectedType === 'annual_income') && (
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-3">
              ৩. বার্ষিক আয়ের বিবরণী
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সর্বমোট বার্ষিক আয় (টাকায়) *
                </label>
                <input
                  type="number"
                  required
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  placeholder="যেমন: ১৮০০০০"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  আয়ের প্রধান উৎস *
                </label>
                <input
                  type="text"
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  placeholder="যেমন: কৃষি, দোকান ব্যবসা, বেতন"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {selectedType === 'monthly_income' && (
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-3">
              ৩. মাসিক আয়ের বিবরণী
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সর্বমোট মাসিক আয় (টাকায়) *
                </label>
                <input
                  type="number"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  placeholder="যেমন: ১৫০০০"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  আয়ের প্রধান উৎস *
                </label>
                <input
                  type="text"
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  placeholder="যেমন: বেসরকারি চাকরি, ব্যবসা, দিনমজুর"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}



        {selectedType === 'family' && (
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
                ৩. পারিবারিক সনদের তথ্য
              </h3>
              <button
                type="button"
                onClick={addFamilyRow}
                className="cursor-pointer text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>সদস্য যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2">
              {familyMembers.map((member, idx) => (
                <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-lg border border-purple-200">
                  <span className="text-xs font-bold text-slate-500 w-5">{toBengaliNumber(idx + 1)}.</span>
                  <input
                    type="text"
                    placeholder="সদস্যের নাম"
                    value={member.name}
                    onChange={(e) => updateFamilyRow(idx, 'name', e.target.value)}
                    className="flex-1 min-w-[140px] px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="সম্পর্ক"
                    value={member.relation}
                    onChange={(e) => updateFamilyRow(idx, 'relation', e.target.value)}
                    className="w-28 px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="বয়স"
                    value={member.age}
                    onChange={(e) => updateFamilyRow(idx, 'age', e.target.value)}
                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                  {familyMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFamilyRow(idx)}
                      className="cursor-pointer text-red-500 hover:text-red-700 p-1"
                      aria-label="সদস্য মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(selectedType === 'non_remarriage' || selectedType === 'widow') && (
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wider mb-3">
              ৩. {selectedType === 'widow' ? 'বিধবা প্রত্যয়ন ও অঙ্গীকার বিবরণী' : 'পুনর্বিবাহ না হওয়ার অঙ্গীকার বিবরণী'}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রয়াত স্বামীর নাম *
              </label>
              <input
                type="text"
                required
                value={previousHusbandName}
                onChange={(e) => setPreviousHusbandName(e.target.value)}
                placeholder="মরহুম..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-rose-800 mt-2 bg-rose-100/70 p-2.5 rounded-lg">
              ঘোষণা: আমি এই মর্মে হলফপূর্বক স্বীকার করিতেছি যে, আমার স্বামীর মৃত্যুর পর অদ্যবধি আমি দ্বিতীয় কোনো বিবাহ বন্ধনে আবদ্ধ হই নাই।
            </p>
          </div>
        )}

        {/* Death Certificate */}
        {selectedType === 'death' && (
          <div className="border-t pt-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">
              মৃত্যু সংক্রান্ত তথ্য
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3 text-sm">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">মৃত্যুর তারিখ *</label>
                <input
                  type="date"
                  className="w-full h-[38px] px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  required
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">মৃত্যুর স্থান</label>
                <input
                  type="text"
                  className="w-full h-[38px] px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="মৃত্যুর স্থান"
                  value={deathPlace}
                  onChange={(e) => setDeathPlace(e.target.value)}
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">মৃত্যুর কারণ *</label>
                <input
                  type="text"
                  className="w-full h-[38px] px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="মৃত্যুর কারণ"
                  value={deathCause}
                  onChange={(e) => setDeathCause(e.target.value)}
                  required
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">বই নম্বর</label>
                <input
                  type="text"
                  className="w-full h-[38px] px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="বই নম্বর"
                  value={deathBookNumber}
                  onChange={(e) => setDeathBookNumber(e.target.value)}
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  className="w-full h-[38px] px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="রেজিস্ট্রেশন নম্বর"
                  value={deathRegistrationNumber}
                  onChange={(e) => setDeathRegistrationNumber(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Nationality & Citizenship */}
        {(selectedType === 'nationality' || selectedType === 'citizenship') && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2">
                জাতীয়তা
              </label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="বাংলাদেশী"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">
                ধর্ম (ঐচ্ছিক)
              </label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                placeholder="ইসলাম / সনাতন / অন্যান্য"
              />
            </div>
          </div>
        )}

        {/* Community / Indigenous */}
        {(selectedType === 'community' || selectedType === 'indigenous') && (
          <div className="border-t pt-6">
            <label className="block text-xs font-semibold mb-2">
              সম্প্রদায় / জনগোষ্ঠীর নাম
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
            />
          </div>
        )}

        {/* Voter Area Transfer */}
        {selectedType === 'voter_area_transfer' && (
          <div className="border-t pt-6 grid md:grid-cols-3 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="পূর্বের ভোটার এলাকা"
              value={voterAreaOld}
              onChange={(e) => setVoterAreaOld(e.target.value)}
              required
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="নতুন ভোটার এলাকা"
              value={voterAreaNew}
              onChange={(e) => setVoterAreaNew(e.target.value)}
              required
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="স্থানান্তরের কারণ"
              value={voterTransferReason}
              onChange={(e) => setVoterTransferReason(e.target.value)}
            />
          </div>
        )}

        {/* NID Correction */}
        {selectedType === 'nid_correction' && (
          <div className="border-t pt-6 grid md:grid-cols-3 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="যে তথ্য সংশোধন হবে"
              value={correctionField}
              onChange={(e) => setCorrectionField(e.target.value)}
              required
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="বর্তমান তথ্য"
              value={correctionOldValue}
              onChange={(e) => setCorrectionOldValue(e.target.value)}
              required
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="সঠিক তথ্য"
              value={correctionNewValue}
              onChange={(e) => setCorrectionNewValue(e.target.value)}
              required
            />
          </div>
        )}

        {/* Guardian Permission */}
        {selectedType === 'guardian_permission' && (
          <div className="border-t pt-6 grid md:grid-cols-3 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="অভিভাবকের নাম"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              required
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="সম্পর্ক"
              value={guardianRelation}
              onChange={(e) => setGuardianRelation(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="অনুমতির উদ্দেশ্য"
              value={permissionPurpose}
              onChange={(e) => setPermissionPurpose(e.target.value)}
              required
            />
          </div>
        )}

        {/* Landless */}
        {selectedType === 'landless' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="জমি/সম্পত্তির বিবরণ"
              value={landDescription}
              onChange={(e) => setLandDescription(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="জমির পরিমাণ"
              value={landAmount}
              onChange={(e) => setLandAmount(e.target.value)}
            />
          </div>
        )}

        {/* Agriculture */}
        {selectedType === 'agriculture' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="কৃষির ধরন"
              value={agricultureType}
              onChange={(e) => setAgricultureType(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="কৃষি জমির পরিমাণ"
              value={agricultureLand}
              onChange={(e) => setAgricultureLand(e.target.value)}
            />
          </div>
        )}

        {/* Freedom Fighter */}
        {selectedType === 'freedom_fighter' && (
          <div className="border-t pt-6 grid md:grid-cols-3 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="মুক্তিযোদ্ধার নাম"
              value={freedomFighterName}
              onChange={(e) => setFreedomFighterName(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="আবেদনকারীর সম্পর্ক"
              value={freedomFighterRelation}
              onChange={(e) => setFreedomFighterRelation(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="মুক্তিযোদ্ধা নম্বর"
              value={freedomFighterNumber}
              onChange={(e) => setFreedomFighterNumber(e.target.value)}
            />
          </div>
        )}

        {/* Monthly Income */}
        {selectedType === 'monthly_income' && (
          <div className="border-t pt-6">
            <label className="block text-xs font-semibold mb-2">
              মাসিক আয়
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-lg"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              required
            />
          </div>
        )}

        {/* Disability */}
        {selectedType === 'disabled' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="প্রতিবন্ধিতার ধরন"
              value={disabilityType}
              onChange={(e) => setDisabilityType(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="বিস্তারিত বিবরণ"
              value={disabilityDescription}
              onChange={(e) => setDisabilityDescription(e.target.value)}
            />
          </div>
        )}

        {/* Unemployed */}
        {selectedType === 'unemployed' && (
          <div className="border-t pt-6">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="কতদিন ধরে বেকার"
              value={unemploymentDuration}
              onChange={(e) => setUnemploymentDuration(e.target.value)}
            />
          </div>
        )}

        {/* Infrastructure */}
        {selectedType === 'infrastructure_permission' && (
          <div className="border-t pt-6 grid md:grid-cols-3 gap-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="নির্মাণের ধরন"
              value={constructionType}
              onChange={(e) => setConstructionType(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="নির্মাণের স্থান"
              value={constructionLocation}
              onChange={(e) => setConstructionLocation(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="নির্মাণের উদ্দেশ্য"
              value={constructionPurpose}
              onChange={(e) => setConstructionPurpose(e.target.value)}
            />
          </div>
        )}

        {/* General / Miscellaneous */}
        {(selectedType === 'general' || selectedType === 'miscellaneous') && (
          <div className="border-t pt-6 space-y-4">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="সনদ প্রদানের উদ্দেশ্য"
              value={generalPurpose}
              onChange={(e) => setGeneralPurpose(e.target.value)}
            />

            <textarea
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              placeholder="বিস্তারিত তথ্য"
              value={
                selectedType === 'general'
                  ? certificateDetails
                  : miscellaneousDetails
              }
              onChange={(e) => {
                if (selectedType === 'general') {
                  setCertificateDetails(e.target.value);
                } else {
                  setMiscellaneousDetails(e.target.value);
                }
              }}
            />
          </div>
        )}

        {/* Married */}
        {selectedType === 'married' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg"
              value={marriageDate}
              onChange={(e) => setMarriageDate(e.target.value)}
            />

            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="স্বামী / স্ত্রীর নাম"
              value={spouseName2}
              onChange={(e) => setSpouseName2(e.target.value)}
            />
          </div>
        )}

        {/* Orphan */}
        {selectedType === 'orphan' && (
          <div className="border-t pt-6">
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="অভিভাবকের নাম"
              value={orphanGuardian}
              onChange={(e) => setOrphanGuardian(e.target.value)}
            />
          </div>
        )}

        {/* New Voter & New Voter Affidavit */}
        {(selectedType === 'new_voter' || selectedType === 'new_voter_affidavit') && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2">পূর্ববর্তী ঠিকানা / আদি নিবাস</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="পূর্ববর্তী বা আদি নিবাসের বিবরণ"
                value={previousAddress}
                onChange={(e) => setPreviousAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">ভোটার হওয়ার উপযুক্ততা ও অঙ্গীকার</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="১৮ বছর পূর্ণ হয়েছে ও অন্য কোথাও ভোটার হই নাই"
                value={generalPurpose}
                onChange={(e) => setGeneralPurpose(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Character */}
        {selectedType === 'character' && (
          <div className="border-t pt-6">
            <label className="block text-xs font-semibold mb-2">চারিত্রিক সনদের প্রয়োজনীয়তা ও রেফারেন্স</label>
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="চাকুরি / ভর্তি / পাসপোর্ট / সাধারণ নাগরিক পরিচয়"
              value={generalPurpose}
              onChange={(e) => setGeneralPurpose(e.target.value)}
            />
          </div>
        )}

        {/* Permanent Resident */}
        {selectedType === 'permanent_resident' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2">স্থায়ীভাবে বসবাসের মেয়াদকাল</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="জন্মসূত্রে / বংশানুক্রমে ২০+ বছর"
                value={generalPurpose}
                onChange={(e) => setGeneralPurpose(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">পৈতৃক বসতভিটা / হোল্ডিং তথ্য</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="পৈতৃক বসতভিটা ও জমিজমা অত্র ইউনিয়নে বিদ্যমান"
                value={certificateDetails}
                onChange={(e) => setCertificateDetails(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Unmarried */}
        {selectedType === 'unmarried' && (
          <div className="border-t pt-6 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-950 mb-2">অবিবাহিত প্রত্যয়ন অঙ্গীকার</h3>
            <p className="text-xs text-slate-700">আমি এই মর্মে অঙ্গীকার করিতেছি যে, অদ্যবধি আমি কোনো বিবাহ বন্ধনে আবদ্ধ হই নাই এবং বর্তমানে সম্পূর্ণ অবিবাহিত রহিয়াছি।</p>
          </div>
        )}

        {/* Not Rohingya */}
        {selectedType === 'not_rohingya' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2">বংশগত নাগরিকত্ব প্রমাণ / রেফারেন্স নং</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="পিতার এনআইডি / ভোটার সিরিয়াল / রেফারেন্স"
                value={generalPurpose}
                onChange={(e) => setGeneralPurpose(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">অঙ্গীকার</label>
              <input
                className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-700 cursor-not-allowed"
                value="জন্মসূত্রে বাংলাদেশী এবং মায়ানমার হতে আগত রোহিঙ্গা নহেন"
                readOnly
              />
            </div>
          </div>
        )}

        {/* No Birth Certificate */}
        {selectedType === 'no_birth_certificate' && (
          <div className="border-t pt-6">
            <label className="block text-xs font-semibold mb-2">ডিজিটাল জন্মসনদ না থাকার কারণ</label>
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="পূর্বে জন্ম নিবন্ধন রেজিস্টারে অন্তর্ভুক্ত না হওয়া / বয়স সংক্রান্ত হলফনামা"
              value={generalPurpose}
              onChange={(e) => setGeneralPurpose(e.target.value)}
            />
          </div>
        )}

        {/* Financial Insolvency */}
        {selectedType === 'financial_insolvency' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2">আর্থিক অস্বচ্ছলতার কারণ</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="অভাব-অনটন / দীর্ঘমেয়াদি চিকিৎসা / কোনো স্থায়ী আয় না থাকা"
                value={generalPurpose}
                onChange={(e) => setGeneralPurpose(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">পরিবারের সদস্য সংখ্যা ও অবস্থা</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="যেমন: ৫ জন সদস্য সম্পূর্ণ আবেদনকারীর উপর নির্ভরশীল"
                value={certificateDetails}
                onChange={(e) => setCertificateDetails(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* No Objection (NOC) */}
        {selectedType === 'no_objection' && (
          <div className="border-t pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2">সংশ্লিষ্ট প্রতিষ্ঠান / অধিদপ্তর</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="পাসপোর্ট অধিদপ্তর / দূতাবাস / বিভাগীয় কর্তৃপক্ষ"
                value={generalPurpose}
                onChange={(e) => setGeneralPurpose(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">এনওসি (NOC)-এর উদ্দেশ্য</label>
              <input
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ই-পাসপোর্ট ইস্যু / বিদেশ গমন / নতুন চাকুরি"
                value={certificateDetails}
                onChange={(e) => setCertificateDetails(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Childless */}
        {selectedType === 'childless' && (
          <div className="border-t pt-6">
            <label className="block text-xs font-semibold mb-2">বিবাহিত দাম্পত্য জীবনের মেয়াদকাল</label>
            <input
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="যেমন: ১০ বছর যাবত কোনো সন্তান-সন্ততি নাই"
              value={generalPurpose}
              onChange={(e) => setGeneralPurpose(e.target.value)}
            />
          </div>
        )}
        
        {/* Reference-style declaration / consent */}
        <div className="application-declaration">
          <label className="application-declaration__label">
            <input
              type="checkbox"
              checked={declarationAgreed}
              onChange={(e) => setDeclarationAgreed(e.target.checked)}
            />
            <span>
              আমি এই মর্মে অঙ্গীকার করছি যে, উপরে বর্ণিত তথ্যাবলী সম্পূর্ণ সত্য। যেকোন সময় আমার প্রদত্ত তথ্য অসত্য প্রমাণিত হলে
              সনদ/প্রত্যয়ন বাতিল বলে গণ্য হবে এবং আইনানুগ ব্যবস্থা গ্রহণ করা হবে।
            </span>
          </label>
        </div>

        {/* Automated Fee Deduction Summary Bar (Rule Enforced) */}
        <div className="application-fee-row bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isBalanceSufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">
                আপনার বর্তমান ওয়ালেট ব্যালেন্স: <strong className={isBalanceSufficient ? 'text-emerald-700' : 'text-red-600'}>
                  {formatCurrencyBn(currentBalance)}
                </strong>
              </div>
              <div className="text-xs font-bold text-slate-800">
                আবেদন ফি: ২.০০ টাকা (সাবমিট করলে স্বয়ংক্রিয়ভাবে কর্তন হইবে)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isBalanceSufficient && (
              <button
                type="button"
                onClick={() => onNavigate('add_balance')}
                className="cursor-pointer text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                + ব্যালেন্স যোগ করুন
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 ${
                isBalanceSufficient
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>আবেদন দাখিল করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      )}
      </div>
    </>
  );
};
