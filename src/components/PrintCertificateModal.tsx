import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CertificateApplication } from '../types';
import { CERTIFICATE_CATALOG, getCertificateCategory } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate, numberToWordsBn, numberToWordsEn } from '../utils/bengali';
import { 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  Loader2, 
  Globe, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  FileCheck,
  MapPin,
  Home 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { getActiveWatermarkSrc } from './OfficialLogos';
import { useUnionSettings } from '../context/UnionSettingsContext';
import { useAuth } from '../context/AuthContext';
import { chargeLatePrintFee } from '../utils/operatorBilling';
import { useCurrentApplication, getCurrentApplicationData } from '../utils/currentApplication';
import { ensurePublicVerification } from '../utils/publicVerification';
import { DynamicApplicationFormDetails, DynamicCertificateBody } from './CertificateTemplateEngine';

interface PrintCertificateModalProps {
  application: CertificateApplication | null;
  onClose: () => void;
  isDuplicate?: boolean;
  initialLanguage?: 'bn' | 'en';
}

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  application: initialPropApp,
  onClose,
  isDuplicate = false,
  initialLanguage
}) => {
  const { currentApp } = useCurrentApplication(initialPropApp);
  const application = currentApp || initialPropApp;
  const { settings } = useUnionSettings();
  const { currentUser, userProfile } = useAuth();
  const isOperator = userProfile?.role === 'operator';
  const [printDateOverride, setPrintDateOverride] = useState<string | null>(null);
  const watermarkSrc = getActiveWatermarkSrc(settings.watermarkLogoUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGeneratingTarget, setPdfGeneratingTarget] = useState<'application' | 'certificate' | null>(null);
  const [activeTab, setActiveTab] = useState<'stacked' | 'application' | 'certificate'>('stacked');
  const [lang, setLang] = useState<'bn' | 'en'>(
    initialLanguage || application?.language || 'bn'
  );
  const [isDuplicateCopy, setIsDuplicateCopy] = useState<boolean>(
    isDuplicate || application?.isDuplicateCopy || false
  );

  const verifyUrl = application ? `${window.location.origin}/#verify?id=${application.trackingId}` : '';

  useEffect(() => {
    if (application) {
      QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0d5c3a',
          light: '#fdfbf2'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
    }
  }, [application, verifyUrl]);

  // Make the public verification snapshot available as soon as an approved
  // certificate is opened, including certificates created before this feature.
  useEffect(() => {
    if (application?.status === 'Approved') {
      ensurePublicVerification(application, settings).catch((error) => {
        console.error('Public verification snapshot could not be created:', error);
      });
    }
  }, [application?.trackingId, application?.status, settings.updatedAt, settings.unionName]);

  if (!application) return null;

  const certMeta = CERTIFICATE_CATALOG[application.certificateType];
  const titleBn = application.certificateTitleBn || certMeta?.titleBn || 'প্রত্যয়ন পত্র';
  const unionNameFallbackBn = isOperator ? '' : '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ';
  const unionNameFallbackEn = isOperator ? '' : '12 NO. AMBARIYA UNION PARISHAD';
  const postOfficeFallbackBn = isOperator ? '' : 'হালসা-৭০৩১';
  const postOfficeFallbackEn = isOperator ? '' : 'Halsa-7031';
  const upazilaFallbackBn = isOperator ? '' : 'মিরপুর';
  const upazilaFallbackEn = isOperator ? '' : 'Mirpur';
  const districtFallbackBn = isOperator ? '' : 'কুষ্টিয়া';
  const districtFallbackEn = isOperator ? '' : 'Kushtia';
  const chairmanFallbackBn = isOperator ? '' : 'মোঃ সাইফুদ্দিন মুকুল';
  const chairmanFallbackEn = isOperator ? '' : 'Md. Saifuddin Mukul';
  const officialEmailFallback = isOperator ? '' : 'udc.ambaria@gmail.com';
  const mobileFallbackBn = isOperator ? '' : '০১৭৪১-১৮৫৭৬৫';
  const mobileFallbackEn = isOperator ? '' : '01741-185765';
  const titleEn = application.certificateTitleEn || certMeta?.titleEn || 'Official Certificate';


  const isTableCertificate = application.certificateType === 'inheritance' || 
                             application.certificateType === 'succession' || 
                             application.certificateType === 'family';

  const tableRowsCount = isTableCertificate
    ? (application.certificateType === 'family' 
        ? (application.familyMembers?.length || 0) 
        : (application.heirs?.length || 0))
    : 0;

  const isHighRowTable = isTableCertificate && tableRowsCount > 5;
  const isUltraCompactTable = isTableCertificate && tableRowsCount > 12;

  const handlePrint = async (target: 'application' | 'certificate' | 'both' = 'certificate') => {
    try {
      // Create/update the public verification record before any certificate
      // print so the QR code works without login.
      if ((target === 'certificate' || target === 'both') && application.status === 'Approved') {
        // Public QR snapshot must never block the actual certificate print.
        // If its Firestore write is denied, printing should still continue.
        ensurePublicVerification(application, settings).catch((error) => {
          console.error('Public verification snapshot could not be saved:', error);
        });
      }

      // A certificate printed 3+ calendar months after completion incurs
      // a one-time 2 BDT operator reprint fee. The actual print date then
      // becomes the certificate issue date.
      if (
        (target === 'certificate' || target === 'both') &&
        currentUser &&
        userProfile?.role === 'operator'
      ) {
        const billing = await chargeLatePrintFee(
          currentUser.uid,
          application,
          new Date()
        );

        if (billing.printDate) {
          setPrintDateOverride(billing.printDate);
        }
        if (billing.charged) {
          window.setTimeout(() => {
            alert('৩ মাস পর পুনঃপ্রিন্টের জন্য ২ টাকা কাটা হয়েছে এবং আজকের তারিখ সনদের ইস্যু তারিখ হিসেবে সেট করা হয়েছে।');
          }, 0);
        }
      }

      // Set print target attribute on body to isolate target in @media print
      document.body.setAttribute('data-print-target', target);
      window.print();

      window.setTimeout(() => {
        document.body.removeAttribute('data-print-target');
      }, 1000);
    } catch (err: any) {
      console.error('Print billing error:', err);
      alert(err?.message || 'প্রিন্টের আগে billing সম্পন্ন করা যায়নি।');
    }
  };

  // High-Quality PDF generation using jsPDF & html2canvas matching the printed view
  const handleDownloadPDF = async (target: 'certificate' | 'application' = 'certificate') => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    setPdfGeneratingTarget(target);

    try {
      // Create/update the public verification record before generating a
      // certificate PDF so its QR is immediately usable without login.
      if (target === 'certificate' && application.status === 'Approved') {
        // Do not block PDF generation on the optional public QR snapshot write.
        ensurePublicVerification(application, settings).catch((error) => {
          console.error('Public verification snapshot could not be saved:', error);
        });
      }

      if (
        target === 'certificate' &&
        currentUser &&
        userProfile?.role === 'operator'
      ) {
        const billing = await chargeLatePrintFee(
          currentUser.uid,
          application,
          new Date()
        );
        if (billing.printDate) {
          setPrintDateOverride(billing.printDate);
        }
        if (billing.charged) {
          alert('৩ মাস পর পুনঃপ্রিন্টের জন্য ২ টাকা কাটা হয়েছে এবং আজকের তারিখ সনদের ইস্যু তারিখ হিসেবে সেট করা হয়েছে।');
        }
      }

      const elementId = target === 'application' ? 'application-print-area' : 'certificate-print-area';
      const element = document.getElementById(elementId);
      if (!element) {
        handlePrint(target);
        return;
      }

      // Wait for fonts to fully load
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Render high-DPI canvas (scale: 2.5 for crisp typography and vector emblems)
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#FCFBF7',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.margin = '0';
            clonedElement.style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Create jsPDF document in A4 Portrait mode (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 6;
      const availableWidth = pdfWidth - (margin * 2);
      const calculatedHeight = (canvas.height * availableWidth) / canvas.width;

      if (calculatedHeight <= pdfHeight - (margin * 2)) {
        pdf.addImage(imgData, 'JPEG', margin, margin, availableWidth, calculatedHeight, undefined, 'FAST');
      } else {
        const ratio = (pdfHeight - (margin * 2)) / calculatedHeight;
        const finalWidth = availableWidth * ratio;
        const finalHeight = calculatedHeight * ratio;
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, margin, finalWidth, finalHeight, undefined, 'FAST');
      }

      const prefix = lang === 'en' ? titleEn : titleBn;
      const targetSuffix = target === 'application' ? (lang === 'en' ? '_Application_Form' : '_আবেদনপত্র') : (lang === 'en' ? '_Certificate' : '_মূল_সনদ');
      const copySuffix = isDuplicateCopy ? (lang === 'en' ? '_DUPLICATE' : '_অনুলিপি') : '';
      const filename = `${prefix.replace(/[^\u0980-\u09FFa-zA-Z0-9_-]/g, '_')}${targetSuffix}${copySuffix}_${application.trackingId}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('jsPDF generation failed, falling back to browser print:', err);
      handlePrint(target);
    } finally {
      setIsGeneratingPDF(false);
      setPdfGeneratingTarget(null);
    }
  };

  const issueDateIso = printDateOverride || application.printDate || application.approvedAt || application.createdAt;
  const formattedDateEn = new Date(issueDateIso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Address Resolution for Present and Permanent Addresses
  const presentVillage = application.presentVillage || application.village || '';
  const presentWard = application.presentWard || application.wardNo || '০১';
  const presentPost = application.presentPost || application.postOffice || settings.postOffice || postOfficeFallbackBn;
  const presentPostOffice = presentPost;
  const presentUpazila = application.presentUpazila || settings.upazila || upazilaFallbackBn;
  const presentDistrict = application.presentDistrict || settings.district || districtFallbackBn;

  const permanentVillage = application.permanentVillage || application.village || '';
  const permanentWard = application.permanentWard || application.wardNo || '০১';
  const permanentPost = application.permanentPost || application.postOffice || settings.postOffice || postOfficeFallbackBn;
  const permanentPostOffice = permanentPost;
  const permanentUpazila = application.permanentUpazila || settings.upazila || upazilaFallbackBn;
  const permanentDistrict = application.permanentDistrict || settings.district || districtFallbackBn;

  const presentVillageEn = application.presentVillageEn || application.presentVillage || application.villageEn || application.village || '';
  const presentWardEn = application.presentWard || application.wardNo || '01';
  const presentPostEn = application.presentPostEn || application.presentPost || application.postOfficeEn || settings.postOfficeEn || settings.postOffice || postOfficeFallbackEn;
  const presentUpazilaEn = application.presentUpazilaEn || settings.upazilaEn || settings.upazila || upazilaFallbackEn;
  const presentDistrictEn = application.presentDistrictEn || settings.districtEn || settings.district || districtFallbackEn;

  const permanentVillageEn = application.permanentVillageEn || application.permanentVillage || application.villageEn || application.village || '';
  const permanentWardEn = application.permanentWard || application.wardNo || '01';
  const permanentPostEn = application.permanentPostEn || application.permanentPost || application.postOfficeEn || settings.postOfficeEn || settings.postOffice || 'Halsa-7031';
  const permanentUpazilaEn = application.permanentUpazilaEn || settings.upazilaEn || settings.upazila || upazilaFallbackEn;
  const permanentDistrictEn = application.permanentDistrictEn || settings.districtEn || settings.district || districtFallbackEn;

  // Dynamic fields for Bangladeshi legal / Sadhu Bhasha format
  const nameBn = application.applicantNameBn;
  const nidBn = application.nidOrBirthReg
    ? toBengaliNumber((application as any).nidNumber || application.nidOrBirthReg)
    : '';
  const fatherNameBn = (application as any).fatherNameBn || application.fatherName || '—';
  const motherNameBn = (application as any).motherNameBn || application.motherName || '—';
  const guardianNameBn = application.spouseName || (application as any).fatherNameBn || application.fatherName || '—';
  const villageBn = presentVillage || application.village || '—';
  const wardNoBn = toBengaliNumber(presentWard || application.wardNo || '০১');
  const postOfficeBn = presentPostOffice || settings.postOffice || postOfficeFallbackBn;
  const unionNameBn = settings.unionName || unionNameFallbackBn;
  const upazilaBn = presentUpazila || settings.upazila || upazilaFallbackBn;
  const districtBn = presentDistrict || settings.district || districtFallbackBn;

  const deceasedNameBn = application.deceasedPersonName || application.deathPersonName || (application.applicantNameBn && application.applicantNameBn !== '-' ? application.applicantNameBn : '—');
  const deceasedGuardianTypeBn = application.deceasedFatherOrHusbandType === 'husband' ? 'স্বামী' : 'পিতা';
  const deceasedGuardianNameBn = application.deceasedFatherOrHusbandName && application.deceasedFatherOrHusbandName !== '-'
    ? application.deceasedFatherOrHusbandName
    : (application.fatherName && application.fatherName !== '-' ? application.fatherName : '—');
  const deceasedMotherNameBn = application.motherName && application.motherName !== '-' ? application.motherName : '—';
  const deceasedIdTypeBn = application.deceasedIdType && application.deceasedIdType !== '-' ? application.deceasedIdType : 'পরিচয়পত্র';
  const deceasedIdNumberBn = application.deceasedIdNumber && application.deceasedIdNumber !== '-'
    ? toBengaliNumber(application.deceasedIdNumber)
    : (application.nidOrBirthReg && application.nidOrBirthReg !== '-' && application.nidOrBirthReg !== application.trackingId ? toBengaliNumber(application.nidOrBirthReg) : '');
  const deathDateBn = application.deceasedDate && application.deceasedDate !== '-' 
    ? formatBengaliDate(application.deceasedDate) 
    : (application.deathDate ? formatBengaliDate(application.deathDate) : '');
  const deathReasonBn = application.deathPlace || (application as any).deathReason || 'স্বাভাবিক/বার্ধক্য';

  const prevDistrictBn = (application as any).prevDistrict || application.permanentDistrict || 'কুষ্টিয়া';
  const prevUpazilaBn = (application as any).prevUpazila || application.permanentUpazila || 'মিরপুর';
  const prevVillageBn = application.voterAreaOld || (application as any).prevVillage || application.permanentVillage || 'পূর্ববর্তী এলাকা';

  const aliasNameBn = application.sameNamePerson || (application as any).sameNameRelation || (application as any).correctionOldValue || application.applicantNameBn;
  const incomeTypeBn = application.certificateType === 'monthly_income' ? 'মাসিক' : 'বাৎসরিক';
  const incomeAmountBn = formatCurrencyBn(application.monthlyIncome || application.annualIncome || 0);

  return (
    <div id="print-modal-root" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex justify-center p-2 sm:p-4">
      <div id="print-modal-shell" className="relative w-full max-w-4xl bg-[#FCFBF7] rounded-2xl shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 text-white border-b border-slate-800">
          {/* Row 1: Header info, Language, Duplicate Toggle, and Close */}
          <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Digital Certificate & Application Viewer' : 'অফিসিয়াল MySonod ও আবেদনপত্র ভিউয়ার'}</span>
              </span>
              <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {application.trackingId}
              </span>
              {isDuplicateCopy && (
                <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  DUPLICATE COPY
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Language Selector Toggle */}
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`cursor-pointer px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                    lang === 'bn' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="বাংলায় পরিবর্তন করুন"
                >
                  <span>বাংলা</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`cursor-pointer px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                    lang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Switch to English"
                >
                  <span>English</span>
                </button>
              </div>

              {/* Duplicate Copy Toggle */}
              <button
                type="button"
                onClick={() => setIsDuplicateCopy(!isDuplicateCopy)}
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                  isDuplicateCopy
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="ডুপ্লিকেট কপি মোড চালু/বন্ধ"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isDuplicateCopy ? (lang === 'en' ? 'Duplicate Copy' : 'অনুলিপি') : (lang === 'en' ? 'Original Copy' : 'মূল কপি')}</span>
              </button>

              <button
                onClick={onClose}
                className="cursor-pointer p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: View Switcher Tabs and Printing / PDF Actions */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
            {/* Left: View Tabs */}
            <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('stacked')}
                className={`cursor-pointer px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'stacked'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'en' ? 'Dual Stacked View' : 'উভয় কপি (Stacked)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('application')}
                className={`cursor-pointer px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'application'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-300" />
                <span>{lang === 'en' ? 'Application Form' : 'আবেদনপত্র'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className={`cursor-pointer px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'certificate'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-yellow-300" />
                <span>{lang === 'en' ? 'Main Certificate' : 'মূল সনদপত্র'}</span>
              </button>
            </div>

            {/* Right: Targeted Print and Download Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Print Application Button */}
              <button
                type="button"
                onClick={() => handlePrint('application')}
                disabled={isGeneratingPDF}
                className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                title="শুধুমাত্র আবেদনপত্র প্রিন্ট করুন"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'en' ? 'Print Application' : 'প্রিন্ট আবেদনপত্র'}</span>
              </button>

              {/* Print Certificate Button */}
              <button
                type="button"
                onClick={() => handlePrint('certificate')}
                disabled={isGeneratingPDF}
                className="cursor-pointer bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                title="শুধুমাত্র মূল সনদ প্রিন্ট করুন"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>{lang === 'en' ? 'Print Certificate' : 'প্রিন্ট মূল সনদ'}</span>
              </button>

              {/* Print Both Button */}
              <button
                type="button"
                onClick={() => handlePrint('both')}
                disabled={isGeneratingPDF}
                className="cursor-pointer bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                title="উভয় কপি (আবেদনপত্র ও মূল সনদ) পৃথক পৃথক A4 পৃষ্ঠায় প্রিন্ট করুন"
              >
                <Layers className="w-3.5 h-3.5 text-slate-950" />
                <span>{lang === 'en' ? 'Print Both (2 Pages)' : 'উভয় কপি প্রিন্ট'}</span>
              </button>

              {/* PDF Downloads */}
              <div className="relative group">
                <button
                  type="button"
                  disabled={isGeneratingPDF}
                  className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-50 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{lang === 'en' ? 'PDF Options' : 'পিডিএফ ডাউনলোড'}</span>
                </button>
                <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-30">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('application')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'en' ? 'Application Form PDF' : 'আবেদনপত্র PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('certificate')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'en' ? 'Main Certificate PDF' : 'মূল সনদপত্র PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Printable Container with id="dual-print-container" */}
        <div id="dual-print-container" className="p-2 sm:p-4 space-y-6">

          {/* Section 1: "আবেদনপত্র" (Application Form View) */}
          {(activeTab === 'stacked' || activeTab === 'application') && (
            <div className="relative">
              {/* Visual Banner Header for Screen View */}
              <div className="no-print mb-2 flex items-center justify-between p-2.5 bg-emerald-800 text-white rounded-xl shadow-xs border border-emerald-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <span className="font-bold text-xs sm:text-sm">
                    {lang === 'en' ? 'Section 1: Citizen Application Form' : '১ম অংশ: নাগরিক আবেদনপত্র (Application Copy)'}
                  </span>
                  <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-600/50">
                    {lang === 'en' ? 'A4 Ready' : 'A4 প্রিন্ট ফরম্যাট'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePrint('application')}
                    className="cursor-pointer bg-white text-emerald-900 hover:bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  >
                    <Printer className="w-3 h-3 text-emerald-700" />
                    <span>{lang === 'en' ? 'Print Application' : 'আবেদনপত্র প্রিন্ট'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('application')}
                    disabled={isGeneratingPDF && pdfGeneratingTarget === 'application'}
                    className="cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  >
                    {isGeneratingPDF && pdfGeneratingTarget === 'application' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>{lang === 'en' ? 'PDF' : 'পিডিএফ'}</span>
                  </button>
                </div>
              </div>

              {/* Printable Application Form Container with id="application-print-area" */}
              <div 
                id="application-print-area" 
                className="print-container certificate-page application-page relative selection:bg-emerald-200 border border-slate-300 rounded-xl shadow-xl"
                style={{ backgroundColor: '#FCFBF7' }}
              >
                {/* Outer Double Border Frame */}
                <div className="certificate-border border-[3px] border-[#0d5c3a] p-1.5 rounded-xl relative overflow-hidden bg-[#FCFBF7]">
                  <div className={`certificate-border-inner border-2 border-[#d97706] ${isUltraCompactTable ? 'p-2 sm:p-2.5' : (isHighRowTable ? 'p-2.5 sm:p-3.5' : (isTableCertificate ? 'p-3 sm:p-4' : 'p-4 sm:p-5'))} rounded-lg relative bg-[#FCFBF7] h-full flex flex-col justify-between flex-1`}>
                    
                    {/* Center Watermark Logo Overlay across all 38 certificate print templates */}
                      {watermarkSrc ? (
                        <div className="watermark-container">
                          <img
                            src={watermarkSrc}
                            alt="Watermark Logo"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      ) : null}

                    {/* Form Content Layer */}
                    <div className="certificate-content relative z-10 h-full flex flex-col justify-between flex-1">
                      {/* Central Content Section Wrapped in Flexible Auto-Spreading Container */}
                      <div className="main-content-wrapper">
                        {/* Header: Union Info & Logos */}
                        <div className="flex items-start justify-between gap-3 pb-2.5 border-b-2 border-[#0d5c3a]">
                        {/* Left: Govt Logo */}
                        <div className="shrink-0 pt-0.5">
                          {settings.govtLogoUrl ? (
                            <img 
                              src={settings.govtLogoUrl} 
                              alt="Govt Logo" 
                              className={`${isUltraCompactTable ? 'w-12 h-12' : (isTableCertificate ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20')} object-contain drop-shadow-xs`} 
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : null}
                        </div>

                        {/* Center: Title & Address */}
                        <div className="flex-1 text-center px-1">
                          <h4 className="text-xs sm:text-sm font-bold text-red-700 tracking-wide uppercase">
                            {lang === 'en' ? "GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH" : 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'}
                          </h4>
                          <h2 className="text-lg sm:text-2xl font-extrabold text-[#0d5c3a] tracking-tight mt-0.5">
                            {lang === 'en' 
                              ? (settings.unionNameEn || settings.unionName || unionNameFallbackEn)
                              : (settings.unionName || unionNameFallbackBn)}
                          </h2>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-800 mt-0.5">
                            {lang === 'en'
                              ? `Post Office: ${settings.postOfficeEn || settings.postOffice || 'Halsa-7031'}, Upazila: ${settings.upazilaEn || settings.upazila || 'Mirpur'}, District: ${settings.districtEn || settings.district || 'Kushtia'}.`
                              : `ডাকঘর: ${settings.postOffice || 'হালসা-৭০৩১'}, উপজেলা: ${settings.upazila || 'মিরপুর'}, জেলা: ${settings.district || 'কুষ্টিয়া'}।`}
                          </p>

                           {/* Title Badge: "[সনদের নাম] এর আবেদন ফরম" */}
                           <div className="inline-block mt-1.5 px-3 py-1 rounded-md bg-[#0d5c3a] text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs">
                             {lang === 'en' 
                               ? `Application Form for ${titleEn}`
                               : (application.certificateType === 'citizenship'
                                   ? 'নাগরিক সনদ এর আবেদন ফরম'
                                   : `${titleBn} এর আবেদন ফরম`)}
                           </div>
                          

                        </div>

                        {/* Right: Union Logo */}
                        <div className="shrink-0 pt-0.5">
                          {settings.unionLogoUrl ? (
                            <img 
                              src={settings.unionLogoUrl} 
                              alt="Union Logo" 
                              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xs" 
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : null}
                        </div>
                      </div>


                      {/* Metadata Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-lg bg-emerald-50/80 border border-emerald-300 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {lang === 'en' ? 'Application Type:' : 'আবেদনের ধরন:'}
                          </span>
                          <strong className="text-emerald-950 font-bold">{lang === 'en' ? titleEn : titleBn}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {lang === 'en' ? 'Application / Tracking No:' : 'আবেদন / ট্র্যাকিং নং:'}
                          </span>
                          <strong className="font-mono text-emerald-900 font-bold">{application.trackingId}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {lang === 'en' ? 'Application Date:' : 'আবেদনের তারিখ:'}
                          </span>
                          <strong className="text-slate-800">{lang === 'en' ? new Date(application.createdAt).toLocaleDateString('en-GB') : formatBengaliDate(application.createdAt)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {lang === 'en' ? 'Status:' : 'আবেদনের অবস্থা:'}
                          </span>
                          <span className={`inline-block px-1.5 py-0.2 rounded font-bold text-[10.5px] ${
                            application.status === 'Approved' ? 'bg-emerald-200 text-emerald-900' : application.status === 'Rejected' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                          }`}>
                            {application.status === 'Approved' ? (lang === 'en' ? 'Approved' : 'অনুমোদিত') : application.status === 'Rejected' ? (lang === 'en' ? 'Rejected' : 'বাতিল') : (lang === 'en' ? 'Pending' : 'পর্যালোচনাধীন')}
                          </span>
                        </div>
                      </div>

                      {/* Category-Based Application Form Sections (Deceased vs Living Citizen vs Business vs Family) */}
                      {(() => {
                        const certCategory = getCertificateCategory(application.certificateType);

                        if (certCategory === 'deceased') {
                          return (
                            <>
                              {/* 1. Deceased Information Section */}
                              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                                <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300">
                                  {lang === 'en' ? '1. Deceased Subject Information' : '১. মৃত ব্যক্তির বিবরণ:'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-2 text-slate-800 text-[11.5px]">
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Deceased Person Name: ' : 'মৃত ব্যক্তির নাম: '}</span>
                                    <strong className="text-slate-950 font-bold">{deceasedNameBn}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Date of Death: ' : 'মৃত্যুর তারিখ: '}</span>
                                    <strong className="text-slate-900">{deathDateBn || '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? "Father's / Husband's Name: " : (deceasedGuardianTypeBn === 'স্বামী' ? 'স্বামীর নাম: ' : 'পিতার নাম: ')}</span>
                                    <strong className="text-slate-900">{deceasedGuardianNameBn}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? "Mother's Name: " : 'মাতার নাম: '}</span>
                                    <strong className="text-slate-900">{deceasedMotherNameBn}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'ID Type & Number: ' : `${deceasedIdTypeBn} নং: `}</span>
                                    <strong className="text-slate-900 font-mono">{deceasedIdNumberBn}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Ward & Post: ' : 'ওয়ার্ড ও ডাকঘর: '}</span>
                                    <strong className="text-slate-900">ওয়ার্ড: {toBengaliNumber(presentWard || '০১')}, ডাকঘর: {presentPostOffice}</strong>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Address: ' : 'ঠিকানা: '}</span>
                                    <span className="text-slate-900 font-medium">গ্রাম/মহল্লা: <b>{presentVillage || '—'}</b>, উপজেলা: <b>{presentUpazila || settings.upazila}</b>, জেলা: <b>{presentDistrict || settings.district}</b></span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Applicant Information Section */}
                              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                                <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center justify-between">
                                  <span>{lang === 'en' ? '2. Applicant Particulars & Contact' : '২. আবেদনকারীর ব্যক্তিগত তথ্যাবলী ও যোগাযোগ:'}</span>
                                  <span className="text-[10px] text-slate-600 font-normal">
                                    {lang === 'en' ? 'Verified Contact Information' : 'যোগাযোগ ও আবেদনকারী বিবরণ'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 p-2.5 text-slate-800 text-[11.5px]">
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Applicant Name (Bangla): ' : 'আবেদনকারীর নাম (বাংলা): '}</span>
                                    <strong className="text-slate-950 font-bold">{application.applicantNameBn && application.applicantNameBn !== '-' ? application.applicantNameBn : '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Relation with Deceased: ' : 'মৃত ব্যক্তির সাথে সম্পর্ক: '}</span>
                                    <strong className="text-slate-900">{application.applicantRelation && application.applicantRelation !== '-' ? application.applicantRelation : 'আইনগত ওয়ারিশ'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Application Tracking No: ' : 'আবেদন ট্র্যাকিং আইডি: '}</span>
                                    <strong className="font-mono text-emerald-950 font-bold">{application.trackingId}</strong>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Present Address: ' : 'বর্তমান ঠিকানা: '}</span>
                                    <span className="text-slate-950">
                                      গ্রাম/মহল্লা: <b>{presentVillage || '—'}</b>, ওয়ার্ড নং: <b>{toBengaliNumber(presentWard || '০১')}</b>, ডাকঘর: <b>{presentPostOffice}</b>, উপজেলা: <b>{presentUpazila}</b>, জেলা: <b>{presentDistrict}</b>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }

                        if (certCategory === 'business') {
                          return (
                            <>
                              {/* 1. Business Particulars */}
                              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                                <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300">
                                  {lang === 'en' ? '1. Business / Enterprise Particulars' : '১. ব্যবসা প্রতিষ্ঠানের তথ্যাবলী:'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 p-2.5 text-slate-800 text-[11.5px]">
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Business Name: ' : 'প্রতিষ্ঠানের নাম: '}</span>
                                    <strong className="text-slate-950 font-bold">{application.businessName || application.applicantNameBn || '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Business Type / Nature: ' : 'ব্যবসার প্রকৃতি ও ধরণ: '}</span>
                                    <strong className="text-slate-900">{application.businessType || application.businessNature || 'মুদি ও জেনারেল স্টোর'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Initial Capital: ' : 'প্রারম্ভিক মূলধন: '}</span>
                                    <strong className="text-slate-900">{application.businessCapital ? `${formatCurrencyBn(application.businessCapital)} টাকা` : '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Fiscal Year: ' : 'চলতি অর্থবছর: '}</span>
                                    <strong className="text-slate-900">{application.fiscalYear || '২০২৪-২০২৫'}</strong>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Business Address: ' : 'প্রতিষ্ঠানের ঠিকানা: '}</span>
                                    <span className="text-slate-900 font-medium">{application.businessAddress || `${presentVillage}, ওয়ার্ড: ${toBengaliNumber(presentWard)}, ${presentUpazila}, ${presentDistrict}`}</span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Proprietor Information */}
                              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                                <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300">
                                  {lang === 'en' ? '2. Owner / Proprietor Particulars' : '২. স্বত্বাধিকারী / মালিকের বিবরণ:'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 p-2.5 text-slate-800 text-[11.5px]">
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Owner Name: ' : 'মালিকের নাম: '}</span>
                                    <strong className="text-slate-950 font-bold">{application.ownerName || application.applicantNameBn || '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? "Father's / Husband's Name: " : 'পিতা/স্বামীর নাম: '}</span>
                                    <strong className="text-slate-900">{application.ownerFatherOrHusbandName || application.fatherName || application.spouseName || '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'NID / Birth Reg: ' : 'এনআইডি / জন্মনিবন্ধন: '}</span>
                                    <strong className="font-mono text-slate-900">{toBengaliNumber(application.ownerNidOrBirth || application.nidOrBirthReg || '')}</strong>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Residential Address: ' : 'স্থায়ী ঠিকানা: '}</span>
                                    <span className="text-slate-900">গ্রাম: <b>{permanentVillage || presentVillage || '—'}</b>, ওয়ার্ড: <b>{toBengaliNumber(permanentWard || presentWard || '০১')}</b>, উপজেলা: <b>{presentUpazila}</b>, জেলা: <b>{presentDistrict}</b></span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }

                        if (certCategory === 'family') {
                          return (
                            <>
                              {/* 1. Family Head Particulars */}
                              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                                <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300">
                                  {lang === 'en' ? '1. Family Head / Applicant Particulars' : '১. পরিবারের প্রধান / আবেদনকারীর বিবরণ:'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 p-2.5 text-slate-800 text-[11.5px]">
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Head of Family Name: ' : 'পরিবার প্রধানের নাম: '}</span>
                                    <strong className="text-slate-950 font-bold">{application.applicantNameBn || '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? "Father's Name: " : 'পিতার নাম: '}</span>
                                    <strong className="text-slate-900">{application.fatherName || '—'}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'NID / Birth Reg: ' : 'জাতীয় পরিচয়পত্র: '}</span>
                                    <strong className="font-mono text-slate-900">{toBengaliNumber(application.nidOrBirthReg || '')}</strong>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Address: ' : 'ঠিকানা: '}</span>
                                    <span className="text-slate-900">গ্রাম: <b>{presentVillage || '—'}</b>, ওয়ার্ড: <b>{toBengaliNumber(presentWard || '০১')}</b>, ডাকঘর: <b>{presentPostOffice}</b>, উপজেলা: <b>{presentUpazila}</b>, জেলা: <b>{presentDistrict}</b></span>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }

                        // Default: Group B - Living Citizen Certificates (নাগরিক সনদ, চারিত্রিক, আয়ের সনদ, কৃষি, ইত্যাদি)
                        return (
                          <>
                            {/* Section 1: আবেদনকারীর/নাগরিকের বিবরণ */}
                            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                              <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center justify-between">
                                <span>{lang === 'en' ? '1. Applicant / Citizen Particulars' : '১. আবেদনকারীর / নাগরিকের বিবরণ:'}</span>
                                <span className="text-[10px] text-slate-600 font-normal">
                                  {lang === 'en' ? 'Personal Details & Identity' : 'ব্যক্তিগত তথ্য ও পরিচিতি'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 p-2.5 text-slate-800 text-[11.5px]">
                                <div>
                                  <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Name (Bangla): ' : 'আবেদনকারীর নাম (বাংলা): '}</span>
                                  <strong className="text-slate-950 font-bold">{application.applicantNameBn || '—'}</strong>
                                </div>
                                {lang === 'en' && (
                                  <div>
                                    <span className="text-slate-600 font-semibold">Name (English): </span>
                                    <strong className="text-slate-900 font-medium">{application.applicantNameEn || '—'}</strong>
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-600 font-semibold">{application.fatherName ? (lang === 'en' ? "Father's Name: " : 'পিতার নাম: ') : application.spouseName ? (lang === 'en' ? "Husband's Name: " : 'স্বামীর নাম: ') : (lang === 'en' ? "Father / Husband Name: " : 'পিতা / স্বামীর নাম: ')}</span>
                                  <strong className="text-slate-900">{application.fatherName || application.spouseName || '—'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-semibold">{lang === 'en' ? "Mother's Name: " : 'মাতার নাম: '}</span>
                                  <strong className="text-slate-900">{application.motherName || '—'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-semibold">{lang === 'en' ? "Spouse's Name: " : 'স্বামী / স্ত্রীর নাম: '}</span>
                                  <strong className="text-slate-900">{application.spouseName || 'প্রযোজ্য নয়'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-semibold">{lang === 'en' ? 'NID / Birth Reg No: ' : 'জাতীয় পরিচয়পত্র / জন্মনিবন্ধন: '}</span>
                                  <strong className="font-mono text-slate-950 font-bold">{toBengaliNumber(application.nidOrBirthReg || '')}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Date of Birth: ' : 'জন্ম তারিখ: '}</span>
                                  <strong className="text-slate-900">{application.dob ? formatBengaliDate(application.dob) : '—'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-600 font-semibold">{lang === 'en' ? 'Tracking ID: ' : 'আবেদন ট্র্যাকিং নং: '}</span>
                                  <strong className="font-mono text-emerald-950 font-bold">{application.trackingId}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Section 2: বর্তমান ও স্থায়ী ঠিকানা */}
                            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white/70 text-xs">
                              <div className="bg-emerald-100/80 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center justify-between">
                                <span>{lang === 'en' ? '2. Present & Permanent Address' : '২. বর্তমান ও স্থায়ী ঠিকানা:'}</span>
                                <span className="text-[10px] text-slate-600 font-normal">
                                  {lang === 'en' ? 'Residential Jurisdiction' : 'আবাসিক এলাকা ও ওয়ার্ড'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 text-slate-800 text-[11.5px]">
                                <div className="p-2 bg-slate-50/80 rounded border border-slate-200">
                                  <span className="text-emerald-900 font-bold block mb-1">
                                    {lang === 'en' ? 'Present Address:' : 'বর্তমান ঠিকানা:'}
                                  </span>
                                  <div>
                                    গ্রাম/মহল্লা: <b>{presentVillage || '—'}</b>, ওয়ার্ড নং: <b>{toBengaliNumber(presentWard || '০১')}</b>, ডাকঘর: <b>{presentPostOffice}</b>
                                  </div>
                                  <div>
                                    উপজেলা: <b>{presentUpazila}</b>, জেলা: <b>{presentDistrict}</b>
                                    {application.holdingNo && <span className="ml-2 font-mono">(হোল্ডিং: {application.holdingNo})</span>}
                                  </div>
                                </div>
                                <div className="p-2 bg-slate-50/80 rounded border border-slate-200">
                                  <span className="text-emerald-900 font-bold block mb-1">
                                    {lang === 'en' ? 'Permanent Address:' : 'স্থায়ী ঠিকানা:'}
                                  </span>
                                  <div>
                                    গ্রাম/মহল্লা: <b>{permanentVillage || presentVillage || '—'}</b>, ওয়ার্ড নং: <b>{toBengaliNumber(permanentWard || presentWard || '০১')}</b>, ডাকঘর: <b>{permanentPostOffice || presentPostOffice}</b>
                                  </div>
                                  <div>
                                    উপজেলা: <b>{permanentUpazila || presentUpazila}</b>, জেলা: <b>{permanentDistrict || presentDistrict}</b>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* 3. Dynamic Section 3: Tailored Application Details for All 38 Certificate Types */}
                      <DynamicApplicationFormDetails
                        application={application}
                        lang={lang}
                        settings={settings}
                      />

                      {/* Declaration Text Box */}
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[10.5px] leading-snug text-slate-800">
                        <strong className="text-red-700 font-bold block mb-0.5">
                          {lang === 'en' ? 'Applicant Declaration:' : 'আবেদনকারীর অঙ্গীকারনামা:'}
                        </strong>
                        {lang === 'en'
                          ? 'I hereby solemnly affirm that all the particulars and information furnished above are true and authentic. Any false statement or withholding of facts will render this application liable to legal proceedings and instant cancellation.'
                          : 'আমি এই মর্মে অঙ্গীকার করছি যে, উপরে বর্ণিত তথ্যাবলী সম্পূর্ণ সত্য ও সঠিক। কোনো অসত্য বা ভুল তথ্য প্রদান করিলে কর্তৃপক্ষ যে কোনো আইনানুগ ব্যবস্থা গ্রহণ করিতে পারিবে এবং আমার আবেদন/সনদপত্র বাতিল বলিয়া গণ্য হইবে।'}
                      </div>
                    </div>

                    {/* Verification & Signatures Block — Application Copy keeps only Applicant + Verifier */}
                    <div className="seal-signature-container signature-grid shrink-0 pt-3 border-t border-slate-300 grid grid-cols-2 gap-3 text-center text-[10px]">
                      {/* 1. Applicant */}
                      <div className="flex flex-col items-center justify-between min-h-[60px] p-1 bg-white/60 rounded border border-slate-200">
                        <div className="h-6"></div>
                        <div className="w-full border-t border-slate-400 pt-0.5 font-bold text-slate-900">
                          {lang === 'en' ? 'Applicant Signature' : 'আবেদনকারীর স্বাক্ষর'}
                        </div>
                        <span className="text-[8.5px] text-slate-500">
                          {lang === 'en' ? `Date: ${formattedDateEn}` : `তারিখ: ${formatBengaliDate(application.createdAt)}`}
                        </span>
                      </div>

                      {/* 2. Verifying Officer */}
                      <div className="flex flex-col items-center justify-between min-h-[60px] p-1 bg-white/60 rounded border border-slate-200">
                        <div className="h-6"></div>
                        <div className="w-full border-t border-slate-400 pt-0.5 font-bold text-slate-900">
                          {lang === 'en' ? 'Verifying Officer Seal & Sign' : 'যাচাইকারীর স্বাক্ষর ও সীল'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Bar: QR Code & Portal Tag Locked at Bottom */}
                    <div className="certificate-footer shrink-0 pt-2 border-t border-slate-300 flex items-center justify-between text-[9.5px] text-slate-600">
                      <div className="flex items-center gap-2">
                        {qrDataUrl && (
                          <img src={qrDataUrl} alt="QR" className="w-10 h-10 border border-slate-300 rounded p-0.5 bg-white shrink-0" />
                        )}
                        <div>
                          <strong className="block text-slate-900 font-bold">MySonod পোর্টাল ট্র্যাকিং</strong>
                          <span className="font-mono text-emerald-900 font-bold">{application.trackingId}</span>
                        </div>
                      </div>

                    </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divider Banner for Stacked View (Screen Only) */}
          {activeTab === 'stacked' && (
            <div className="no-print my-4 flex items-center justify-between p-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl shadow-xs border border-emerald-700">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs sm:text-sm">
                  {lang === 'en' ? 'Section 2: Main Official Certificate' : '২য় অংশ: মূল সনদপত্র (Main Official Certificate)'}
                </span>
                <span className="text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-600/50">
                  {lang === 'en' ? 'A4 Print Ready' : 'A4 প্রিন্ট প্রস্তুত'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePrint('certificate')}
                  className="cursor-pointer bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Printer className="w-3 h-3" />
                  <span>{lang === 'en' ? 'Print Certificate' : 'মূল সনদ প্রিন্ট'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPDF('certificate')}
                  disabled={isGeneratingPDF && pdfGeneratingTarget === 'certificate'}
                  className="cursor-pointer bg-white text-emerald-900 hover:bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  {isGeneratingPDF && pdfGeneratingTarget === 'certificate' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span>{lang === 'en' ? 'PDF' : 'পিডিএফ'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Main Official Certificate with id="certificate-print-area" */}
          {(activeTab === 'stacked' || activeTab === 'certificate') && (
            <div 
              id="certificate-print-area" 
              className="print-container certificate-page relative selection:bg-emerald-200 border border-slate-300 rounded-xl shadow-xl"
              style={{ backgroundColor: '#FCFBF7' }}
            >
              {/* Official Double Border: Dark green outer line, light gold inner line */}
              <div className="certificate-border border-[4px] border-[#0d5c3a] p-1.5 rounded-xl relative overflow-hidden bg-[#FCFBF7]">
                <div className={`certificate-border-inner border-2 border-[#d97706] ${isUltraCompactTable ? 'p-2 sm:p-2.5' : (isHighRowTable ? 'p-2.5 sm:p-3.5' : (isTableCertificate ? 'p-3 sm:p-4.5' : 'p-4 sm:p-6'))} rounded-lg relative bg-[#FCFBF7] h-full flex flex-col justify-between flex-1`}>

                  {/* Center Watermark Logo Overlay across all 38 certificate print templates */}
                      {watermarkSrc ? (
                        <div className="watermark-container">
                          <img
                            src={watermarkSrc}
                            alt="Watermark Logo"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      ) : null}

                  {/* Duplicate Watermark / Badge if enabled */}
                  {isDuplicateCopy && (
                    <div className="absolute top-2 right-2 pointer-events-none z-20">
                      <div className="bg-amber-100 text-amber-900 border-2 border-amber-600 px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest shadow-xs">
                        {lang === 'en' ? 'DUPLICATE COPY • OFFICIAL RECORD' : 'অনুলিপি • ডুপ্লিকেট কপি'}
                      </div>
                    </div>
                  )}

                  {/* Certificate Content - Positioned Above Watermark with clean flow */}
                  <div className={`certificate-content relative z-10 h-full flex flex-col justify-between flex-1 ${!isTableCertificate ? 'main-certificate-content' : ''}`}>
                    {/* Central Content Section Wrapped in Flexible Auto-Spreading Container */}
                    <div className={`main-content-wrapper ${!isTableCertificate ? 'main-certificate-flow' : ''}`}>

                {/* Header Layout:
                    - Top-Left: Government Emblem (Dynamic or Logo 1)
                    - Top-Right: Union Parishad Logo (Dynamic or Logo 2)
                    - Top-Center Text Stack: Bound dynamically to settings
                */}
                <div className={`flex items-start justify-between gap-2 sm:gap-4 ${isUltraCompactTable ? 'pb-1' : (isTableCertificate ? 'pb-1.5' : 'pb-3')} border-b-2 border-[#0d5c3a]`}>
                  {/* Left Side: Government Emblem (Logo 1 or Dynamic URL) */}
                  <div className={`shrink-0 flex flex-col items-center justify-center ${isTableCertificate ? 'pt-0' : 'pt-1'}`}>
                    {settings.govtLogoUrl ? (
                      <img 
                        src={settings.govtLogoUrl} 
                        alt="BD Government Seal" 
                        className={`${isUltraCompactTable ? 'w-12 h-12' : (isTableCertificate ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-20 h-20 sm:w-24 sm:h-24')} object-contain drop-shadow-xs`} 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Center Aligned Government Header */}
                  <div className="flex-1 text-center px-1 sm:px-2">
                    {lang === 'en' ? (
                      <>
                        <h3 className={`${isUltraCompactTable ? 'text-[9.5px]' : (isTableCertificate ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm')} font-bold text-red-700 tracking-wider uppercase`}>
                          GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH
                        </h3>
                        <h1 className={`${isUltraCompactTable ? 'text-base sm:text-lg mt-0 leading-tight' : (isTableCertificate ? 'text-lg sm:text-xl md:text-2xl mt-0' : 'text-xl sm:text-2xl md:text-3xl mt-0.5')} font-extrabold text-[#0d5c3a] tracking-tight leading-tight`}>
                          {settings.unionNameEn || settings.unionName || unionNameFallbackEn}
                        </h1>
                        <p className={`${isUltraCompactTable ? 'text-[9.5px] mt-0 leading-tight' : (isTableCertificate ? 'text-[10.5px] sm:text-xs mt-0.5' : 'text-xs sm:text-sm mt-1')} font-semibold text-slate-800`}>
                          Post Office: {settings.postOfficeEn || settings.postOffice || postOfficeFallbackEn}, Upazila: {settings.upazilaEn || settings.upazila || upazilaFallbackEn}, District: {settings.districtEn || settings.district || districtFallbackEn}.
                        </p>
                        <div className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 ${isUltraCompactTable ? 'mt-0 text-[9px]' : (isTableCertificate ? 'mt-0.5 text-[10px]' : 'mt-1 text-[11px]')} font-medium text-slate-700`}>
                          <span>Chairman: <strong className="text-emerald-950 font-bold">{settings.chairmanNameEn || settings.chairmanName || chairmanFallbackEn}</strong></span>
                          <span>•</span>
                          <span>Email: <strong className="font-mono text-slate-800">{settings.officialEmail || officialEmailFallback}</strong></span>
                          <span>•</span>
                          <span>Mobile: <strong className="font-mono text-slate-900">{settings.mobileNumber || mobileFallbackEn}</strong></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className={`${isUltraCompactTable ? 'text-[9.5px]' : (isTableCertificate ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm')} font-bold text-red-700 tracking-wide uppercase`}>
                          গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                        </h3>
                        <h1 className={`${isUltraCompactTable ? 'text-base sm:text-lg mt-0 leading-tight' : (isTableCertificate ? 'text-lg sm:text-xl md:text-2xl mt-0' : 'text-xl sm:text-2xl md:text-3xl mt-0.5')} font-extrabold text-[#0d5c3a] tracking-tight leading-tight`}>
                          {settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ'}
                        </h1>
                        <p className={`${isUltraCompactTable ? 'text-[9.5px] mt-0 leading-tight' : (isTableCertificate ? 'text-[10.5px] sm:text-xs mt-0.5' : 'text-xs sm:text-sm mt-1')} font-semibold text-slate-800`}>
                          ডাকঘর: {settings.postOffice || postOfficeFallbackBn}, উপজেলা: {settings.upazila || upazilaFallbackBn}, জেলা: {settings.district || districtFallbackBn}।
                        </p>
                        <div className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 ${isUltraCompactTable ? 'mt-0 text-[9px]' : (isTableCertificate ? 'mt-0.5 text-[10px]' : 'mt-1 text-[11px]')} font-medium text-slate-700`}>
                          <span>চেয়ারম্যান: <strong className="text-emerald-950 font-bold">{settings.chairmanName || chairmanFallbackBn}</strong></span>
                          <span>•</span>
                          <span>ইমেইল: <strong className="font-mono text-slate-800">{settings.officialEmail || 'udc.ambaria@gmail.com'}</strong></span>
                          <span>•</span>
                          <span>মোবাইল: <strong className="font-mono text-slate-900">{settings.mobileNumber || mobileFallbackBn}</strong></span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Side: Union Council Logo (Logo 2 or Dynamic URL) */}
                  <div className={`shrink-0 flex flex-col items-center justify-center ${isTableCertificate ? 'pt-0' : 'pt-1'}`}>
                    {settings.unionLogoUrl ? (
                      <img 
                        src={settings.unionLogoUrl} 
                        alt="Union Council Seal" 
                        className={`${isUltraCompactTable ? 'w-12 h-12' : (isTableCertificate ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-20 h-20 sm:w-24 sm:h-24')} object-contain drop-shadow-xs`} 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                {/* Metadata Bar (Justified Grid Below Header) */}
                <div className={`flex flex-wrap items-center justify-between gap-3 ${isUltraCompactTable ? 'mt-1 pb-0.5 text-[10px]' : (isTableCertificate ? 'mt-1.5 pb-1 text-[11px]' : 'mt-2.5 pb-2 text-xs')} font-semibold text-slate-800 border-b border-emerald-700/30`}>
                  <div className="space-y-0.5">
                    <div>
                      {lang === 'en' ? 'Memo / Tracking No: ' : 'স্মারক নং: '}
                      <span className="font-mono font-bold text-emerald-900 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
                        {application.trackingId}
                      </span>
                    </div>
                    <div>
                      {lang === 'en' ? 'NID / Birth Reg No: ' : 'এনআইডি / জন্ম নিবন্ধন: '}
                      <span className="font-mono font-bold text-slate-900">
                        {lang === 'en'
                          ? ((application as any).nidNumber || application.nidOrBirthReg)
                          : toBengaliNumber((application as any).nidNumber || application.nidOrBirthReg)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div>
                      {lang === 'en' ? 'Issue Date: ' : 'ইস্যুর তারিখ: '}
                      <span className="font-bold text-slate-900">
                        {lang === 'en' ? formattedDateEn : formatBengaliDate(application.approvedAt || application.createdAt)}
                      </span>
                    </div>
                    <div>
                      {lang === 'en' ? (
                        <>Ward No: <span className="font-bold text-slate-900">{application.wardNo || '09'}</span> | Holding No: <span className="font-bold">{application.holdingNo || '144'}</span></>
                      ) : (
                        <>ওয়ার্ড নং: <span className="font-bold text-slate-900">{toBengaliNumber(application.wardNo || '09')}</span> | হোল্ডিং নং: <span className="font-bold">{application.holdingNo ? toBengaliNumber(application.holdingNo) : '১৪৪'}</span></>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specialized Trade License Document Layout vs Standard Certificate Layout */}
                {(() => {
                  const tlLicenseFee = application.licenseFee || 500;
                  const tlVat = application.vatAmount !== undefined ? application.vatAmount : Math.round(tlLicenseFee * 0.15);
                  const tlProfessionTax = application.professionTax || 200;
                  const tlTradeTax = application.tradeTax || 0;
                  const tlTotal = application.totalAmount || (tlLicenseFee + tlVat + tlProfessionTax + tlTradeTax);
                  const tlTotalInWords = lang === 'en' ? numberToWordsEn(tlTotal) : numberToWordsBn(tlTotal);

                  if (application.certificateType === 'trade_license') {
                    return (
                      <div className="space-y-3.5 my-2.5 font-bangla text-slate-900">
                        {/* Header: License No box (Top Left), Date (Top Right), Centered Pill/Badge Title "TRADE LICENSE" */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-700/40 pb-2.5">
                          <div className="bg-emerald-50/90 border border-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-950 shadow-2xs">
                            <span className="text-[10px] text-emerald-700 block font-bold uppercase tracking-wider">
                              {lang === 'en' ? 'License No:' : 'লাইসেন্স নং:'}
                            </span>
                            <span className="font-mono text-sm text-emerald-900">{application.trackingId}</span>
                          </div>

                          <div className="inline-block bg-[#006A4E] text-white px-7 py-2 rounded-full shadow-sm border-2 border-[#d97706] text-center">
                            <h2 className="text-base sm:text-xl font-extrabold tracking-wider uppercase">
                              TRADE LICENSE • ট্রেড লাইসেন্স
                            </h2>
                          </div>

                          <div className="bg-emerald-50/90 border border-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-950 text-right shadow-2xs">
                            <span className="text-[10px] text-emerald-700 block font-bold uppercase tracking-wider">
                              {lang === 'en' ? 'Issue Date:' : 'ইস্যুর তারিখ:'}
                            </span>
                            <span className="text-xs sm:text-sm">
                              {lang === 'en' ? formattedDateEn : formatBengaliDate(application.approvedAt || application.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Legal Preamble Text */}
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-300 text-center text-xs sm:text-[13px] leading-relaxed text-slate-800 italic shadow-2xs">
                          {lang === 'en' ? (
                            <p>
                              "Under the conditions prescribed by the Government under section 66 of the Local Government (Union Councils) Act, 2009 (Act No. 61 of 2009), this Trade License is hereby granted to the undermentioned person/enterprise for conducting lawful commercial operations within the jurisdiction of this Union Parishad."
                            </p>
                          ) : (
                            <p>
                              "স্থানীয় সরকার (ইউনিয়ন পরিষদ) আইন, ২০০৯ (২০০৯ সনের ৬১ নং আইন) এর ধারা ৬৬-এ প্রদত্ত ক্ষমতাবলে সরকার কর্তৃক প্রণীত আদর্শ কর তফসিল অনুযায়ী নিম্নে বর্ণিত ব্যবসা পরিচালনার নিমিত্তে এই ট্রেড লাইসেন্স প্রদান করা হইল।"
                            </p>
                          )}
                        </div>

                        {/* Key-Value Alignment Section */}
                        <div className="border border-emerald-400 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <div className="bg-[#006A4E] text-white px-3.5 py-1.5 text-xs font-bold flex justify-between items-center">
                            <span>১. ব্যবসা ও লাইসেন্সধারীর পরিচিতি (Business & Licensee Particulars)</span>
                            <span className="font-mono text-xs bg-emerald-900 px-2.5 py-0.5 rounded border border-emerald-500 font-bold">
                              {lang === 'en' ? 'Fiscal Year: ' : 'অর্থবছর: '}
                              {application.fiscalYear || '2026-2027'}
                            </span>
                          </div>

                          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-[13px]">
                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Business Name:" : "ব্যবসা প্রতিষ্ঠানের নাম:"}
                              </span>
                              <strong className="text-emerald-950 font-bold flex-1">{application.businessName || '—'}</strong>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Owner's Name:" : "মালিকের নাম:"}
                              </span>
                              <strong className="text-slate-900 font-bold flex-1">
                                {application.ownerName || application.userName || application.applicantNameBn || '—'}
                              </strong>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Father / Husband Name:" : "পিতা / স্বামীর নাম:"}
                              </span>
                              <span className="text-slate-900 font-semibold flex-1">
                                {application.ownerFatherOrHusbandName || application.fatherName || '—'}
                              </span>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Mother's Name:" : "মাতার নাম:"}
                              </span>
                              <span className="text-slate-900 font-semibold flex-1">
                                {application.ownerMotherName || application.motherName || '—'}
                              </span>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Nature of Business:" : "ব্যবসায়ের প্রকৃতি:"}
                              </span>
                              <strong className="text-slate-900 font-bold flex-1">{application.businessNature || 'একক মালিকানা'}</strong>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "NID / Birth Reg No:" : "এনআইডি / জন্ম নিবন্ধন নং:"}
                              </span>
                              <span className="font-mono font-bold text-slate-900 flex-1">
                                {lang === 'en' 
                                  ? (application.ownerNidOrBirth || application.nidOrBirthReg) 
                                  : toBengaliNumber(application.ownerNidOrBirth || application.nidOrBirthReg)}
                              </span>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Category / Type of Trade:" : "ব্যবসায়ের ধরন:"}
                              </span>
                              <strong className="text-slate-900 font-bold flex-1">{application.businessType || 'সাধারণ ব্যবসা'}</strong>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "License Validity:" : "লাইসেন্সের মেয়াদকাল:"}
                              </span>
                              <strong className="text-emerald-900 font-bold flex-1">
                                {lang === 'en' 
                                  ? `${application.validityStart || '01-07-2026'} to ${application.validityEnd || '30-06-2027'}`
                                  : `${application.validityStart || '০১-০৭-২০২৬'} হতে ${application.validityEnd || '৩০-০৬-২০২৭'}`}
                              </strong>
                            </div>

                            <div className="flex border-b border-slate-100 pb-1 sm:col-span-2">
                              <span className="w-44 text-slate-600 shrink-0 font-medium">
                                {lang === 'en' ? "Business Address:" : "ব্যবসা প্রতিষ্ঠানের ঠিকানা:"}
                              </span>
                              <span className="text-slate-900 font-semibold flex-1">{application.businessAddress || '—'}</span>
                            </div>

                            {application.showCapitalOnPrint !== false && (
                              <div className="flex border-b border-slate-100 pb-1">
                                <span className="w-44 text-slate-600 shrink-0 font-medium">
                                  {lang === 'en' ? "Invested Capital:" : "ব্যবসার মূলধন:"}
                                </span>
                                <strong className="text-emerald-900 font-bold flex-1">
                                  {formatCurrencyBn(application.businessCapital)}
                                </strong>
                              </div>
                            )}

                            {application.tinNumber && (
                              <div className="flex border-b border-slate-100 pb-1">
                                <span className="w-44 text-slate-600 shrink-0 font-medium">
                                  {lang === 'en' ? "e-TIN Number:" : "ই-টিন নম্বর:"}
                                </span>
                                <span className="font-mono font-bold text-slate-900 flex-1">{application.tinNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dual Column Address Section: Left (Present) and Right (Permanent) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/40 shadow-2xs">
                            <h4 className="font-bold text-[#006A4E] border-b border-emerald-200 pb-1 mb-1.5 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{lang === 'en' ? 'Present Address:' : 'মালিকের বর্তমান ঠিকানা:'}</span>
                            </h4>
                            <div className="space-y-0.5 text-slate-800 leading-relaxed">
                              <div>গ্রাম/সড়ক: <b>{application.presentVillage || application.village}</b></div>
                              <div>ওয়ার্ড নং: <b>{toBengaliNumber(application.presentWard || application.wardNo)}</b> | ডাকঘর: <b>{application.presentPost || application.postOffice}</b></div>
                              <div>উপজেলা: <b>{application.presentUpazila || settings.upazila || upazilaFallbackBn}</b> | জেলা: <b>{application.presentDistrict || settings.district || districtFallbackBn}</b></div>
                            </div>
                          </div>

                          <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/40 shadow-2xs">
                            <h4 className="font-bold text-[#006A4E] border-b border-emerald-200 pb-1 mb-1.5 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{lang === 'en' ? 'Permanent Address:' : 'মালিকের স্থায়ী ঠিকানা:'}</span>
                            </h4>
                            <div className="space-y-0.5 text-slate-800 leading-relaxed">
                              <div>গ্রাম/সড়ক: <b>{application.permanentVillage || application.village}</b></div>
                              <div>ওয়ার্ড নং: <b>{toBengaliNumber(application.permanentWard || application.wardNo)}</b> | ডাকঘর: <b>{application.permanentPost || application.postOffice}</b></div>
                              <div>উপজেলা: <b>{application.permanentUpazila || settings.upazila || upazilaFallbackBn}</b> | জেলা: <b>{application.permanentDistrict || settings.district || upazilaFallbackBn}</b></div>
                            </div>
                          </div>
                        </div>

                        {/* Financial Fee Table (Green Header Box) */}
                        <div className="border border-[#006A4E] rounded-xl overflow-hidden bg-white shadow-2xs">
                          <table className="w-full text-xs text-center border-collapse">
                            <thead>
                              <tr className="bg-[#006A4E] text-white font-bold">
                                <th className="py-2.5 px-2 border-r border-emerald-600">
                                  {lang === 'en' ? 'Trade License Fee' : 'ট্রেড লাইসেন্স ফি'}
                                </th>
                                <th className="py-2.5 px-2 border-r border-emerald-600">
                                  {lang === 'en' ? 'VAT (15%)' : 'ভ্যাট (১৫%)'}
                                </th>
                                <th className="py-2.5 px-2 border-r border-emerald-600">
                                  {lang === 'en' ? 'Profession Tax' : 'পেশা কর'}
                                </th>
                                <th className="py-2.5 px-2 border-r border-emerald-600">
                                  {lang === 'en' ? 'Trade Tax' : 'বাণিজ্যিক কর'}
                                </th>
                                <th className="py-2.5 px-2 bg-[#005C36]">
                                  {lang === 'en' ? 'Total Amount' : 'মোট টাকা'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="divide-x divide-slate-200 text-slate-900 font-semibold bg-white text-xs sm:text-[13px]">
                                <td className="py-2.5 px-2">{formatCurrencyBn(tlLicenseFee)}</td>
                                <td className="py-2.5 px-2">{formatCurrencyBn(tlVat)}</td>
                                <td className="py-2.5 px-2">{formatCurrencyBn(tlProfessionTax)}</td>
                                <td className="py-2.5 px-2">{formatCurrencyBn(tlTradeTax)}</td>
                                <td className="py-2.5 px-2 font-bold text-emerald-950 bg-emerald-50">
                                  {formatCurrencyBn(tlTotal)}
                                </td>
                              </tr>
                              <tr className="bg-emerald-50/90 border-t border-emerald-300">
                                <td colSpan={5} className="py-2 px-3 text-left font-bold text-emerald-950 text-xs sm:text-[13px]">
                                  <span className="text-slate-600 mr-2">
                                    {lang === 'en' ? 'Total (In Words):' : 'মোট টাকা (কথায়):'}
                                  </span>
                                  <span>{tlTotalInWords}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Certificate Title Box */}
                      <div className={`${isUltraCompactTable ? 'my-0.5' : (isTableCertificate ? (isHighRowTable ? 'my-1' : 'my-1.5 sm:my-2') : 'my-3 sm:my-3.5')} text-center`}>
                        <div className={`inline-block bg-[#0d5c3a] text-white ${isUltraCompactTable ? 'px-4 py-0.5' : (isTableCertificate ? 'px-5 py-1' : 'px-8 py-1.5')} rounded-lg shadow-sm border-2 border-[#d97706]`}>
                          <h2 className={`${isUltraCompactTable ? 'text-sm sm:text-base' : (isTableCertificate ? 'text-base sm:text-lg md:text-xl' : 'text-lg sm:text-xl md:text-2xl')} font-extrabold tracking-wide uppercase`}>
                            {lang === 'en' ? titleEn : (titleBn || 'নাগরিকত্ব সনদ')}
                          </h2>
                        </div>
                      </div>

                      {/* Body Text Formatting:
                          Supports English or Bangla typography with official dynamic variables from DynamicCertificateBody
                          Line-height: 2.0 for standard certificates; auto-compacted for table certificates
                      */}
                      <div 
                        className={`certificate-body-content text-slate-900 text-justify font-normal ${
                          isTableCertificate 
                            ? `${isUltraCompactTable ? 'space-y-0.5 my-0' : (isHighRowTable ? 'space-y-1 my-0.5' : 'space-y-1.5 my-1')} flex-1 flex flex-col justify-start` 
                            : 'text-[16px] sm:text-[17.5px] space-y-4 mt-1 flex-1 flex flex-col justify-start'
                        }`}
                        style={{ 
                          fontFamily: "'Tiro Bangla', serif", 
                          lineHeight: isTableCertificate 
                            ? (isUltraCompactTable ? 1.2 : (isHighRowTable ? 1.35 : 1.6)) 
                            : 2.0 
                        }}
                      >
                        <DynamicCertificateBody
                          application={application}
                          lang={lang}
                          settings={settings}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Seal & Signatures Block Locked Right Above Footer */}
              {application.certificateType === 'trade_license' ? (
                <div className="seal-signature-container signature-grid shrink-0 pt-4 pb-1 flex items-end justify-between gap-4">
                  {/* Verifier's Signature (Left) */}
                  <div className="text-center min-w-[170px]">
                    <div className="h-10"></div>
                    <div className="border-t-2 border-slate-900 pt-1 font-bold text-slate-950 text-xs">
                      {lang === 'en' ? "Verifier's Signature" : "যাচাইকারী / প্রস্তুতকারীর স্বাক্ষর"}
                    </div>
                    <div className="text-[10px] text-slate-600">ইউপি সচিব / প্রশাসনিক কর্মকর্তা</div>
                  </div>

                  {/* Official Seal (Center) */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-800/80 flex flex-col items-center justify-center p-1.5 text-center bg-transparent">
                      <span className="text-[9.5px] font-bold text-emerald-900 uppercase tracking-tight">
                        OFFICIAL SEAL
                      </span>
                      <span className="text-[8px] text-slate-600 mt-0.5 font-semibold">
                        (কার্যালয়ের সীল)
                      </span>
                    </div>
                  </div>

                  {/* Authorized Signature (Right) */}
                  <div className="text-center min-w-[190px]">
                    <div className="h-10"></div>
                    <div className="border-t-2 border-slate-900 pt-1 font-bold text-slate-950 text-xs">
                      {lang === 'en' ? "Authorized Signature" : "অনুমোদনকারীর স্বাক্ষর ও সীল"}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {lang === 'en' ? "Chairman / Approving Authority" : "চেয়ারম্যান, ইউনিয়ন পরিষদ"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`seal-signature-container signature-grid shrink-0 ${isUltraCompactTable ? 'mt-0.5 pt-0.5' : (isTableCertificate ? (isHighRowTable ? 'mt-1 pt-0.5' : 'mt-2 pt-1') : 'mt-5 sm:mt-6 pt-2')} flex flex-wrap items-end justify-between gap-4`}>
                  {/* Left Side: Circular dotted line placeholder for Official Seal */}
                  <div className="flex flex-col items-center">
                    <div className={`${isUltraCompactTable ? 'w-14 h-14 p-0.5' : (isHighRowTable ? 'w-16 h-16 p-1' : (isTableCertificate ? 'w-20 h-20 p-1.5' : 'w-24 h-24 p-2'))} rounded-full border-2 border-dashed border-emerald-800/80 flex flex-col items-center justify-center text-center bg-transparent`}>
                      <span className={`${isUltraCompactTable ? 'text-[7.5px]' : (isHighRowTable ? 'text-[8.5px]' : 'text-[10px]')} font-bold text-emerald-900 uppercase tracking-tight`}>
                        {lang === 'en' ? 'OFFICIAL SEAL' : 'কার্যালয়ের সীল'}
                      </span>
                      <span className={`${isUltraCompactTable ? 'text-[6.5px]' : (isHighRowTable ? 'text-[7.5px]' : 'text-[8.5px]')} text-slate-600 mt-0.5 font-semibold`}>
                        {lang === 'en' ? '(Official Stamp)' : '(অফিসিয়াল সীল)'}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Clean line for Chairman Signature */}
                  <div className="text-center min-w-[200px]">
                    <div className={isUltraCompactTable ? 'h-4' : (isHighRowTable ? 'h-6' : (isTableCertificate ? 'h-8' : 'h-10 sm:h-12'))}></div>
                    <div className="border-t-2 border-slate-900 pt-1 font-bold text-slate-950 text-xs">
                      {lang === 'en' ? 'Signature & Seal of Approving Authority' : 'অনুমোদনকারীর সীল ও স্বাক্ষর'}
                    </div>
                    <div
                      className={isUltraCompactTable ? 'mx-auto mt-1 h-8 w-14' : (isHighRowTable ? 'mx-auto mt-1 h-10 w-16' : (isTableCertificate ? 'mx-auto mt-1.5 h-12 w-20' : 'mx-auto mt-1.5 h-16 w-24'))}
                      title={lang === 'en' ? 'Space for official approval seal' : 'অনুমোদনকারীর অফিসিয়াল সীলের জন্য স্থান'}
                    >
                      <div className="h-full w-full rounded-md border border-dashed border-slate-300 bg-slate-50/40"></div>
                    </div>
                  </div>
                </div>
              )}

                {/* Bottom Bar:
                    - Left Box: QR Code + Digital Verification URL block
                    - Center Notice (Red Text Box): "বিঃদ্রঃ তথ্য গোপন বা ভুল দিলে আবেদনকারী দায়ী থাকিবেন এবং এই সনদপত্রটি আইনগতভাবে বাতিল বলিয়া গণ্য হইবে।"
                    - Right Footer: "MySonod পোর্টাল | স্মারক: MS-2026-AMB-27643"
                */}
                <div className={`certificate-footer shrink-0 ${isUltraCompactTable ? 'mt-1 pt-1' : (isTableCertificate ? 'mt-1.5 pt-1.5' : 'mt-3.5 pt-2.5')} border-t border-emerald-900/30 flex flex-wrap items-center justify-between gap-3`}>
                  {/* Left Box: QR Code + Digital Verification URL block */}
                  <div className="flex items-center gap-2.5 max-w-[250px]">
                    {qrDataUrl && (
                      <img 
                        src={qrDataUrl} 
                        alt="Verification QR Code" 
                        className={`${isUltraCompactTable ? 'w-10 h-10' : (isHighRowTable ? 'w-12 h-12' : 'w-16 h-16')} border border-emerald-700 rounded-md p-0.5 bg-white shadow-2xs shrink-0`}
                      />
                    )}
                    <div className="text-[10px] text-slate-700 leading-tight">
                      <strong className="block text-emerald-950 font-bold mb-0.5">
                        {lang === 'en' ? 'Digital Verification:' : 'ডিজিটাল ভেরিফিকেশন:'}
                      </strong>
                      <span>
                        {lang === 'en' ? 'Scan QR to verify certificate online.' : 'স্মার্টফোনে স্ক্যান করে সনদ যাচাই করুন।'}
                      </span>
                      <div className="text-[8.5px] text-slate-500 font-mono mt-0.5 break-all">
                        {verifyUrl}
                      </div>
                    </div>
                  </div>

                  {/* Center Notice (Red Text Box) */}
                  <div className="flex-1 min-w-[220px] max-w-[340px] text-center">
                    <p className="text-[9.5px] font-semibold text-red-700 bg-red-50/90 px-2.5 py-1.5 rounded border border-red-200 shadow-2xs leading-snug text-left">
                      <strong>{lang === 'en' ? 'Note: ' : 'বিঃদ্রঃ '}</strong>
                      {lang === 'en' 
                        ? 'Any false or withheld information will render this certificate legally null and void.' 
                        : 'তথ্য গোপন বা ভুল দিলে আবেদনকারী দায়ী থাকিবেন এবং এই সনদপত্রটি আইনগতভাবে বাতিল বলিয়া গণ্য হইবে।'}
                    </p>
                  </div>

                  {/* Right Footer */}
                  <div className="text-right text-[10px] text-slate-700 space-y-0.5 shrink-0">
                    <div>
                      {lang === 'en' ? 'MySonod Portal | Memo: ' : 'MySonod পোর্টাল | স্মারক: '}
                    </div>
                    <div className="font-mono font-bold text-emerald-900 text-[10.5px]">
                      {application.trackingId}
                    </div>
                    {isDuplicateCopy && (
                      <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                        {lang === 'en' ? '[DUPLICATE COPY]' : '[অনুলিপি কপি]'}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        )}

        </div>
      </div>
    </div>
  );
};
