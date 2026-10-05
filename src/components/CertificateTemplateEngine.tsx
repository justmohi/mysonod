import React from 'react';
import type { CertificateApplication, CertificateType } from '../types';
import { CERTIFICATE_CATALOG } from '../types';
import { 
  toBengaliNumber, 
  formatCurrencyBn, 
  formatBengaliDate, 
  numberToWordsBn, 
  numberToWordsEn 
} from '../utils/bengali';
import { 
  Briefcase, 
  Users, 
  Home, 
  FileText, 
  ShieldCheck, 
  Award, 
  Sprout, 
  Heart, 
  BadgeDollarSign, 
  Copy, 
  MapPin, 
  FileCheck,
  UserCheck,
  HeartHandshake,
  Landmark,
  Building,
  FileSignature,
  FileWarning,
  AlertCircle
} from 'lucide-react';

export interface TemplateEngineProps {
  application: CertificateApplication;
  lang?: 'bn' | 'en';
  settings: any;
}

/**
 * Categorize the 38 certificate types into functional layout archetypes
 */
export const getCertificateCategory = (type: CertificateType): string => {
  switch (type) {
    case 'inheritance':
    case 'succession':
      return 'inheritance';
    case 'trade_license':
      return 'trade_license';
    case 'family':
      return 'family';
    case 'death':
      return 'death';
    case 'income':
    case 'annual_income':
    case 'monthly_income':
      return 'income';
    case 'same_name':
      return 'same_name';
    case 'voter_area_transfer':
    case 'new_voter':
    case 'new_voter_affidavit':
      return 'voter';
    case 'nid_correction':
      return 'nid_correction';
    case 'agriculture':
      return 'agriculture';
    case 'freedom_fighter':
      return 'freedom_fighter';
    case 'non_remarriage':
    case 'widow':
      return 'non_remarriage';
    case 'unmarried':
    case 'married':
      return 'marriage';
    case 'landless':
      return 'landless';
    case 'disabled':
      return 'disabled';
    case 'unemployed':
      return 'unemployed';
    case 'financial_insolvency':
      return 'financial_insolvency';
    case 'infrastructure_permission':
      return 'infrastructure';
    case 'no_objection':
      return 'no_objection';
    case 'childless':
      return 'childless';
    case 'community':
    case 'indigenous':
      return 'community';
    case 'not_rohingya':
      return 'not_rohingya';
    case 'no_birth_certificate':
      return 'no_birth_certificate';
    case 'orphan':
      return 'orphan';
    case 'guardian_permission':
      return 'guardian_permission';
    case 'citizenship':
    case 'nationality':
      return 'citizenship';
    case 'character':
      return 'character';
    case 'permanent_resident':
      return 'permanent_resident';
    case 'general':
    case 'miscellaneous':
    default:
      return 'general';
  }
};

/**
 * -------------------------------------------------------------------------
 * SECTION 1: DYNAMIC APPLICATION FORM COPY (আবেদনপত্র) SECTION 3
 * Tailored Section 3 layout for ALL 38 CERTIFICATE TYPES
 * -------------------------------------------------------------------------
 */
export const DynamicApplicationFormDetails: React.FC<TemplateEngineProps> = ({
  application,
  lang = 'bn',
  settings
}) => {
  const isEn = lang === 'en';
  const type = application.certificateType;

  // 1. Trade License
  if (type === 'trade_license') {
    const fee = application.licenseFee || 500;
    const vat = application.vatAmount || 75;
    const pTax = application.professionTax || 200;
    const tTax = application.tradeTax || 0;
    const total = application.totalAmount || (fee + vat + pTax + tTax);

    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isEn ? '3. Business Particulars & Fee Assessment' : '৩. ব্যবসা প্রতিষ্ঠান ও লাইসেন্স ফি সংক্রান্ত তথ্য:'}</span>
          </span>
          <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
            {isEn ? 'Fiscal Year: ' : 'অর্থবছর: '} {application.fiscalYear || '2026-2027'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 text-[11.5px] bg-slate-50/40">
          <div>
            <span className="text-slate-600 block">{isEn ? 'Business Name:' : 'প্রতিষ্ঠানের নাম:'}</span>
            <b className="text-slate-900 font-bold">{application.businessName || '—'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">{isEn ? 'Type of Business:' : 'ব্যবসায়ের ধরণ:'}</span>
            <b className="text-slate-900">{application.businessType || '—'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">{isEn ? 'Nature of Business:' : 'ব্যবসায় প্রকৃতি:'}</span>
            <b className="text-slate-900">{application.businessNature || 'একক মালিকানা'}</b>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-600 block">{isEn ? 'Business Address:' : 'ব্যবসার ঠিকানা:'}</span>
            <b className="text-slate-900">{application.businessAddress || '—'}</b>
          </div>
          {application.showCapitalOnPrint !== false && (
            <div>
              <span className="text-slate-600 block">{isEn ? 'Capital:' : 'মূলধন:'}</span>
              <b className="text-slate-900 font-bold">{formatCurrencyBn(application.businessCapital || 0)}</b>
            </div>
          )}
          {application.tinNumber && (
            <div>
              <span className="text-slate-600 block">{isEn ? 'e-TIN No:' : 'ই-টিন নম্বর:'}</span>
              <b className="font-mono text-slate-900">{application.tinNumber}</b>
            </div>
          )}
          <div>
            <span className="text-slate-600 block">{isEn ? 'Validity Period:' : 'মেয়াদকাল:'}</span>
            <b>{application.validityStart || '০১-০৭-২০২৬'} হতে {application.validityEnd || '৩০-০৬-২০২৭'}</b>
          </div>
        </div>

        {/* Fee Assessment Sub-Table */}
        <div className="border-t border-slate-300 p-2.5 bg-white">
          <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
            {isEn ? 'Assessed Fee Breakdown:' : 'সরকারি ফি ও ভ্যাটের বিস্তারিত বিবরণী:'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[10px]">{isEn ? 'License Fee' : 'লাইসেন্স ফি'}</span>
              <strong className="text-slate-900">{formatCurrencyBn(fee)}</strong>
            </div>
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[10px]">{isEn ? 'VAT (15%)' : 'ভ্যাট (১৫%)'}</span>
              <strong className="text-slate-900">{formatCurrencyBn(vat)}</strong>
            </div>
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[10px]">{isEn ? 'Profession/Other Tax' : 'পেশা ও অন্যান্য কর'}</span>
              <strong className="text-slate-900">{formatCurrencyBn(pTax + tTax)}</strong>
            </div>
            <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded">
              <span className="text-emerald-800 font-bold block text-[10px]">{isEn ? 'Total Fee' : 'সর্বমোট সরকারি ফি'}</span>
              <strong className="text-emerald-950 font-bold">{formatCurrencyBn(total)}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Warish / Inheritance / Succession
  if (type === 'inheritance' || type === 'succession') {
    const heirs = application.heirs || [];
    const heirsCount = heirs.length;
    const appTableModeClass = heirsCount <= 5 ? 'table-normal' : (heirsCount <= 12 ? 'table-compact' : 'table-ultra-compact');
    const appCellPadding = heirsCount <= 5 ? '4px 6px' : (heirsCount <= 12 ? '2.5px 5px' : '1.5px 4px');
    const appFontSize = heirsCount <= 5 ? '11px' : (heirsCount <= 12 ? '10px' : '9.5px');
    const appLineHeight = heirsCount <= 5 ? 1.25 : (heirsCount <= 12 ? 1.15 : 1.05);

    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isEn ? '3. Lawful Warish / Heirs List & Particulars' : '৩. আইনগত ওয়ারিশগণের তালিকা ও বিবরণ:'}</span>
          </span>
          <span className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded-full font-bold">
            {isEn ? `Total Heirs: ${heirs.length}` : `মোট ওয়ারিশ: ${toBengaliNumber(heirs.length)} জন`}
          </span>
        </div>
        <table className={`w-full text-center border-collapse ${appTableModeClass}`}>
          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
            <tr>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 w-12 text-center">{isEn ? 'SL' : 'ক্রমিক নং'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2">{isEn ? 'Heir Name' : 'ওয়ারিশের নাম'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 w-24 text-center">{isEn ? 'Relation' : 'সম্পর্ক'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2">{isEn ? 'NID / Birth Certificate' : 'ভোটার আইডি / জন্ম সনদ'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 w-32 text-center">{isEn ? 'Date of Birth / Age' : 'জন্ম তারিখ / বয়স'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="text-center w-20">{isEn ? 'Remarks' : 'মন্তব্য'}</th>
            </tr>
          </thead>
          <tbody>
            {heirs.length > 0 ? (
              heirs.map((h, i) => (
                <tr key={i} className="border-b border-slate-200 hover:bg-slate-50/50">
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 font-semibold">{toBengaliNumber(i + 1)}</td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2 font-bold text-slate-900">{h.name || '—'}</td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300">{h.relation || '—'}</td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2 font-mono">
                    {h.nidOrBirth && h.nidOrBirth !== '-' ? toBengaliNumber(h.nidOrBirth) : '—'}
                  </td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300">
                    {h.dob ? `${formatBengaliDate(h.dob)} ${h.age ? `(${toBengaliNumber(h.age)} বছর)` : ''}` : (h.age ? `${toBengaliNumber(h.age)} বছর` : '—')}
                  </td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="text-center text-slate-700">{h.remarks || 'ওয়ারিশ'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-2 text-center text-slate-500">কোনো ওয়ারিশ তালিকা পাওয়া যায়নি</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. Family Certificate
  if (type === 'family') {
    const members = application.familyMembers || [];
    const membersCount = members.length;
    const appTableModeClass = membersCount <= 5 ? 'table-normal' : (membersCount <= 12 ? 'table-compact' : 'table-ultra-compact');
    const appCellPadding = membersCount <= 5 ? '4px 6px' : (membersCount <= 12 ? '2.5px 5px' : '1.5px 4px');
    const appFontSize = membersCount <= 5 ? '11px' : (membersCount <= 12 ? '10px' : '9.5px');
    const appLineHeight = membersCount <= 5 ? 1.25 : (membersCount <= 12 ? 1.15 : 1.05);

    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-purple-100/90 px-3 py-1 font-bold text-purple-950 border-b border-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-purple-700" />
            <span>{isEn ? '3. Family Members List' : '৩. পরিবারের সদস্যবৃন্দের তালিকা:'}</span>
          </span>
          <span className="text-[10px] bg-purple-800 text-white px-2 py-0.5 rounded-full font-bold">
            {isEn ? `Members: ${members.length}` : `মোট সদস্য: ${toBengaliNumber(members.length)} জন`}
          </span>
        </div>
        <table className={`w-full text-center border-collapse ${appTableModeClass}`}>
          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
            <tr>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 w-12 text-center">{isEn ? 'SL' : 'ক্রমিক'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2">{isEn ? 'Member Name' : 'সদস্যের নাম'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 w-24 text-center">{isEn ? 'Relation' : 'সম্পর্ক'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2">{isEn ? 'NID / Birth Certificate' : 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন'}</th>
              <th style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="text-center w-24">{isEn ? 'Age' : 'বয়স'}</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((m, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 font-bold">{toBengaliNumber(i + 1)}</td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2 font-semibold text-slate-900">{m.name}</td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300">{m.relation}</td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="border-r border-slate-300 text-left pl-2 font-mono">
                    {toBengaliNumber((m as any).nidOrBirth || '—')}
                  </td>
                  <td style={{ padding: appCellPadding, fontSize: appFontSize, lineHeight: appLineHeight }} className="text-center">{toBengaliNumber(m.age)} বছর</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-2 text-center text-slate-500">কোনো সদস্য তালিকা পাওয়া যায়নি</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // 4. Income / Annual / Monthly Income
  if (type === 'income' || type === 'annual_income' || type === 'monthly_income') {
    const isMonthly = type === 'monthly_income';
    const amount = isMonthly ? (application.monthlyIncome || 0) : (application.annualIncome || 0);
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Income Particulars & Financial Declaration' : '৩. আয়ের উৎস ও আর্থিক বিবরণী:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">{isEn ? 'Primary Source of Income:' : 'আয়ের প্রধান উৎস:'}</span>
            <b className="text-slate-900 font-bold">{application.incomeSource || 'ব্যবসা ও কৃষি'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">{isMonthly ? (isEn ? 'Monthly Income:' : 'সর্বমোট মাসিক আয়:') : (isEn ? 'Annual Income:' : 'সর্বমোট বাৎসরিক আয়:')}</span>
            <b className="text-emerald-950 font-bold text-sm">{formatCurrencyBn(amount)} টাকা</b>
            <span className="text-[10px] text-slate-500 block">
              কথায়: {numberToWordsBn(amount)} টাকা মাত্র
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Same Name
  if (type === 'same_name') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-blue-100/90 px-3 py-1.5 font-bold text-blue-950 border-b border-slate-300 flex items-center gap-1.5">
          <Copy className="w-3.5 h-3.5 text-blue-700" />
          <span>{isEn ? '3. Same Name Particulars & Alias Proof' : '৩. একই নামের বিবরণ ও নথিপত্র তথ্য:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">{isEn ? 'Original/Primary Name:' : 'নথিতে মূল নাম:'}</span>
            <strong className="text-slate-950 font-bold">{application.applicantNameBn}</strong>
          </div>
          <div>
            <span className="text-slate-600 block">{isEn ? 'Alias / Alternate Name:' : 'অন্যান্য নথিতে অপর নাম (ওরফে):'}</span>
            <strong className="text-blue-900 font-bold">{application.sameNamePerson || (application as any).sameNameRelation || '—'}</strong>
          </div>
          <div className="sm:col-span-2 text-slate-700">
            <span className="text-slate-600 block mb-0.5">{isEn ? 'Affirmation:' : 'স্বীকৃতি:'}</span>
            <span>উভয় নাম একই ব্যক্তিকে নির্দেশ করে বলিয়া আবেদনকারী হলফপূর্বক ঘোষণা করিয়াছেন।</span>
          </div>
        </div>
      </div>
    );
  }

  // 6. Voter Area Transfer
  if (type === 'voter_area_transfer') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Voter Area Transfer Particulars' : '৩. ভোটার এলাকা স্থানান্তর সংক্রান্ত বিবরণ:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">{isEn ? 'Previous Voter Area:' : 'পূর্ববর্তী ভোটার এলাকা:'}</span>
            <b>{application.voterAreaOld || application.previousAddress || 'পূর্ববর্তী এলাকা'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">{isEn ? 'Proposed New Area (Ward):' : 'বর্তমান প্রস্তাবিত এলাকা (ওয়ার্ড):'}</span>
            <b className="text-emerald-950">ওয়ার্ড নং: {toBengaliNumber(application.presentWard || application.wardNo || '০১')}</b>
          </div>
          <div>
            <span className="text-slate-600 block">{isEn ? 'Reason for Transfer:' : 'স্থানান্তরের কারণ:'}</span>
            <b>{application.voterTransferReason || 'স্থায়ীভাবে বসবাস'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 7. New Voter & New Voter Affidavit
  if (type === 'new_voter' || type === 'new_voter_affidavit') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <FileSignature className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. New Voter Inclusion Particulars & Oath' : '৩. নতুন ভোটার অন্তর্ভুক্তি ও অঙ্গীকার বিবরণ:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">জন্ম তারিখ / বয়স:</span>
            <b>{application.dob ? formatBengaliDate(application.dob) : '১৮ বছর বা তদূর্ধ্ব'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">পূর্ববর্তী ভোটার স্থিতি:</span>
            <b className="text-emerald-900">অন্য কোথাও ভোটার হন নাই</b>
          </div>
          <div>
            <span className="text-slate-600 block">নাগরিকত্ব প্রমাণ:</span>
            <b>জন্মসূত্রে বাংলাদেশী নাগরিক</b>
          </div>
        </div>
      </div>
    );
  }

  // 8. NID Correction
  if (type === 'nid_correction') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-amber-100/90 px-3 py-1.5 font-bold text-amber-950 border-b border-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-800" />
          <span>{isEn ? '3. NID Information Correction Particulars' : '৩. জাতীয় পরিচয়পত্র তথ্য সংশোধনের বিবরণী:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">যে তথ্য সংশোধন প্রয়োজন:</span>
            <b>{application.correctionField || 'নাম / বয়স'}</b>
          </div>
          <div>
            <span className="text-slate-600 block text-red-600">বর্তমান ভুল তথ্য:</span>
            <b className="text-red-700">{application.correctionOldValue || '—'}</b>
          </div>
          <div>
            <span className="text-slate-600 block text-emerald-700">প্রস্তাবিত সঠিক তথ্য:</span>
            <b className="text-emerald-800 font-bold">{application.correctionNewValue || '—'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 9. Agriculture
  if (type === 'agriculture') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Agriculture & Farmland Particulars' : '৩. কৃষি সংক্রান্ত তথ্যাবলী ও জমির পরিমাণ:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">কৃষির ধরণ / প্রধান ফসল:</span>
            <b>{application.agricultureType || 'ধান, গম, পাট ও রবিশস্য'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">চাষযোগ্য জমির পরিমাণ:</span>
            <b className="text-emerald-950 font-bold">{application.agricultureLand || '১ একর ৫০ শতাংশ'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 10. Freedom Fighter Heir
  if (type === 'freedom_fighter') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-red-100/90 px-3 py-1.5 font-bold text-red-950 border-b border-slate-300 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-red-800" />
          <span>{isEn ? '3. Freedom Fighter Particulars & Gazette Record' : '৩. বীর মুক্তিযোদ্ধা সংক্রান্ত বিবরণ ও গেজেট রেকর্ড:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">বীর মুক্তিযোদ্ধার নাম:</span>
            <strong className="text-slate-900 font-bold">{application.freedomFighterName || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-600 block">গেজেট / লাল মুক্তিবার্তা নং:</span>
            <b className="font-mono text-emerald-950">{toBengaliNumber(application.freedomFighterNumber || 'যাচাইকৃত')}</b>
          </div>
          <div>
            <span className="text-slate-600 block">আবেদনকারীর সাথে সম্পর্ক:</span>
            <b>{application.freedomFighterRelation || 'সন্তান'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 11. Non Remarriage & Widow
  if (type === 'non_remarriage' || type === 'widow') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-rose-100/90 px-3 py-1.5 font-bold text-rose-950 border-b border-slate-300 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-800" />
          <span>{isEn ? '3. Marital Standing & Non-Remarriage Oath' : '৩. বৈবাহিক স্থিতি ও পুনর্বিবাহ না হওয়ার অঙ্গীকার:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">প্রয়াত স্বামীর নাম:</span>
            <strong className="text-slate-900 font-bold">{application.previousHusbandName || application.spouseName || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-600 block">হলফনামা ও বর্তমান স্থিতি:</span>
            <span className="text-rose-900 font-semibold">স্বামীর মৃত্যুর পর দ্বিতীয় কোনো বিবাহ বন্ধনে আবদ্ধ হন নাই।</span>
          </div>
        </div>
      </div>
    );
  }

  // 12. Death
  if (type === 'death') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-slate-200/90 px-3 py-1.5 font-bold text-slate-950 border-b border-slate-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-slate-700" />
          <span>{isEn ? '3. Deceased Particulars & Demise Record' : '৩. মৃত ব্যক্তির তথ্য ও মৃত্যু বিবরণী:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">মৃত ব্যক্তির নাম:</span>
            <strong className="text-slate-950 font-bold">{application.deathPersonName || application.deceasedPersonName || application.applicantNameBn}</strong>
          </div>
          <div>
            <span className="text-slate-600 block">মৃত্যুর তারিখ:</span>
            <b>{application.deathDate ? formatBengaliDate(application.deathDate) : (application.deceasedDate ? formatBengaliDate(application.deceasedDate) : '—')}</b>
          </div>
          <div>
            <span className="text-slate-600 block">মৃত্যুর স্থান ও কারণ:</span>
            <b>{application.deathPlace || 'নিজ বাসভবন / বার্ধক্যজনিত'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 13. Disability
  if (type === 'disabled') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-amber-100/90 px-3 py-1.5 font-bold text-amber-950 border-b border-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
          <span>{isEn ? '3. Disability Particulars & Welfare Records' : '৩. প্রতিবন্ধিতার বিবরণ ও সমাজসেবা তথ্য:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">প্রতিবন্ধিতার ধরণ:</span>
            <b>{application.disabilityType || 'শারীরিক প্রতিবন্ধী'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">বিবরণ ও সুপারিশ:</span>
            <span>{application.disabilityDescription || 'সমাজসেবা অধিদপ্তর কর্তৃক নিবন্ধিত ও স্থানীয়ভাবে যাচাইকৃত'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 14. Unemployment
  if (type === 'unemployed') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-blue-100/90 px-3 py-1.5 font-bold text-blue-950 border-b border-slate-300 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-blue-700" />
          <span>{isEn ? '3. Unemployment Declaration' : '৩. বেকারত্ব সংক্রান্ত ঘোষণা ও বিবরণী:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">বেকারত্বের মেয়াদকাল:</span>
            <b>{application.unemploymentDuration || '১ বছর যাবত'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">পেশাগত বর্তমান অবস্থা:</span>
            <span className="text-slate-800 font-semibold">কোনো সরকারি, আধা-সরকারি বা লাভজনক স্থায়ী চাকুরিতে নিয়োজিত নহেন।</span>
          </div>
        </div>
      </div>
    );
  }

  // 15. Infrastructure Permission
  if (type === 'infrastructure_permission') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Infrastructure & Construction Details' : '৩. অবকাঠামো ও নির্মাণ সংক্রান্ত তথ্যাবলী:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">নির্মাণের ধরণ:</span>
            <b>{application.constructionType || 'একতলা পাকা বসতবাড়ি'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">নির্মাণের স্থান:</span>
            <b>{application.constructionLocation || 'গ্রাম: আমবাড়ীয়া'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">নির্মাণের উদ্দেশ্য:</span>
            <b>{application.constructionPurpose || 'পারিবারিক বাসস্থান'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 16. Landless
  if (type === 'landless') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Landless Status & Asset Declaration' : '৩. ভূমিহীনতার বিবরণ ও সম্পত্তির তথ্য:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">জমির বিবরণ:</span>
            <b>{application.landDescription || 'কোনো আবাদি বা বসতভিটা জমি নাই'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">জমির পরিমাণ:</span>
            <b className="text-emerald-950 font-bold">{application.landAmount || '০.০০ শতাংশ (সম্পূর্ণ ভূমিহীন)'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 17. Married
  if (type === 'married') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-rose-100/90 px-3 py-1.5 font-bold text-rose-950 border-b border-slate-300 flex items-center gap-1.5">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-800" />
          <span>{isEn ? '3. Marriage Information' : '৩. বিবাহ সংক্রান্ত তথ্যাবলী:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">স্বামী / স্ত্রীর নাম:</span>
            <strong className="text-slate-900 font-bold">{application.spouseName2 || application.spouseName || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-600 block">বিবাহের তারিখ:</span>
            <b>{application.marriageDate ? formatBengaliDate(application.marriageDate) : 'পারিবারিকভাবে সম্পাদিত'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 18. Unmarried
  if (type === 'unmarried') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Unmarried Status Affirmation' : '৩. অবিবাহিত থাকার অঙ্গীকার বিবরণী:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800">
          <p>আবেদনকারী অদ্যবধি কোনো বিবাহ বন্ধনে আবদ্ধ হন নাই এবং বর্তমানে তিনি আইনসম্মতভাবে একজন অবিবাহিত নাগরিক।</p>
        </div>
      </div>
    );
  }

  // 19. Guardian Permission
  if (type === 'guardian_permission') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-indigo-100/90 px-3 py-1.5 font-bold text-indigo-950 border-b border-slate-300 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-indigo-700" />
          <span>{isEn ? '3. Guardian Particulars & Permission Purpose' : '৩. অভিভাবকের বিবরণ ও অনুমতির উদ্দেশ্য:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">অভিভাবকের নাম:</span>
            <b className="text-slate-900">{application.guardianName || application.fatherName || '—'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">সম্পর্ক:</span>
            <b>{application.guardianRelation || 'পিতা/মাতা'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">অনুমতির উদ্দেশ্য:</span>
            <b>{application.permissionPurpose || 'শিক্ষা ও ভ্রমণের উদ্দেশ্যে'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 20. Community & Indigenous
  if (type === 'community' || type === 'indigenous') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-amber-100/90 px-3 py-1.5 font-bold text-amber-950 border-b border-slate-300 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-amber-800" />
          <span>{isEn ? '3. Ethnic Group / Community Particulars' : '৩. সম্প্রদায় / ক্ষুদ্র নৃ-গোষ্ঠীর বিবরণ:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50">
          <span className="text-slate-600 block">সম্প্রদায় / নৃ-গোষ্ঠীর নাম:</span>
          <b className="text-amber-950 text-sm font-bold">{application.communityName || 'ঐতিহ্যবাহী সম্প্রদায়'}</b>
        </div>
      </div>
    );
  }

  // 21. Orphan
  if (type === 'orphan') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-blue-100/90 px-3 py-1.5 font-bold text-blue-950 border-b border-slate-300 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-blue-700" />
          <span>{isEn ? '3. Orphan Particulars & Guardian Info' : '৩. এতিম সংক্রান্ত তথ্য ও বর্তমান অভিভাবক:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">বর্তমান অভিভাবকের নাম:</span>
            <b className="text-slate-900">{application.orphanGuardian || 'নিকটাত্মীয়'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">স্থিতি:</span>
            <span className="text-blue-900 font-semibold">পিতা অপ্রাপ্তবয়স্ক অবস্থায় মৃত্যুবরণ করায় এতিম।</span>
          </div>
        </div>
      </div>
    );
  }

  // 22. Not Rohingya
  if (type === 'not_rohingya') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Citizen Lineage & Verification Reference' : '৩. জন্মসূত্রে নাগরিকত্ব ও রোহিঙ্গা নয় প্রত্যয়ন তথ্য:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800 space-y-1">
          <p>আবেদনকারী জন্মসূত্রে ও বংশানুক্রমে বাংলাদেশের স্থায়ী অধিবাসী। তিনি কোনোক্রমেই মায়ানমার হতে আগত বলপ্রয়োগে বাস্তুচ্যুত রোহিঙ্গা নাগরিক নহেন।</p>
          {application.rohingyaVerificationRef && (
            <p className="text-[10px] text-slate-600">যাচাই রেফারেন্স: <span className="font-mono">{application.rohingyaVerificationRef}</span></p>
          )}
        </div>
      </div>
    );
  }

  // 23. No Birth Certificate
  if (type === 'no_birth_certificate') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-amber-100/90 px-3 py-1.5 font-bold text-amber-950 border-b border-slate-300 flex items-center gap-1.5">
          <FileWarning className="w-3.5 h-3.5 text-amber-800" />
          <span>{isEn ? '3. Lack of Birth Certificate Reason' : '৩. জন্মসনদ না থাকার কারণ ও হলফনামা বিবরণ:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800">
          <span>{application.reasonNoBirthCert || 'পূর্ববর্তী রেজিস্টারে অনিচ্ছাকৃত নাম বাদ পরায় ডিজিটাল জন্মসনদ না থাকার প্রত্যয়ন প্রদান করা হইল।'}</span>
        </div>
      </div>
    );
  }

  // 24. No Objection (NOC)
  if (type === 'no_objection') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. No Objection (NOC) Purpose' : '৩. অনাপত্তি সনদ (NOC)-এর উদ্দেশ্য ও বিবরণ:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">প্রতিষ্ঠান / গন্তব্য:</span>
            <b>{application.organizationName || 'পাসপোর্ট / দূতাবাস / সংশ্লিষ্ট কর্তৃপক্ষ'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">এনওসির উদ্দেশ্য:</span>
            <b>{application.nocPurpose || application.generalPurpose || 'পাসপোর্ট ও ভিসা প্রক্রিয়াকরণ'}</b>
          </div>
        </div>
      </div>
    );
  }

  // 25. Financial Insolvency
  if (type === 'financial_insolvency') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-rose-100/90 px-3 py-1.5 font-bold text-rose-950 border-b border-slate-300 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-800" />
          <span>{isEn ? '3. Financial Distress Particulars' : '৩. আর্থিক অস্বচ্ছলতার কারণ ও বিবরণ:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800">
          <span>{application.insolvencyReason || 'পরিবারে কোনো স্থায়ী আয়ের উৎস না থাকায় এবং চিকিৎসার কারণে বর্তমানে চরম আর্থিক দুরবস্থায় পতিত।'}</span>
        </div>
      </div>
    );
  }

  // 26. Childless
  if (type === 'childless') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-purple-100/90 px-3 py-1.5 font-bold text-purple-950 border-b border-slate-300 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-purple-700" />
          <span>{isEn ? '3. Childless Status Declaration' : '৩. নিঃসন্তান সংক্রান্ত বিবরণ ও ঘোষণা:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800">
          <p>দাম্পত্য জীবনে কোনো জীবিত বা মৃত সন্তান-সন্ততি নাই। তিনি সম্পূর্ণ নিঃসন্তান নাগরিক।</p>
        </div>
      </div>
    );
  }

  // 27. Citizenship & Nationality
  if (type === 'citizenship' || type === 'nationality') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Citizenship Particulars' : '৩. নাগরিকত্ব সংক্রান্ত বিবরণ:'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
          <div>
            <span className="text-slate-600 block">জাতীয়তা:</span>
            <b>{application.nationality || 'বাংলাদেশী'}</b>
          </div>
          <div>
            <span className="text-slate-600 block">নাগরিকত্ব ধরণ:</span>
            <b>জন্মসূত্রে বাংলাদেশী</b>
          </div>
        </div>
      </div>
    );
  }

  // 28. Character
  if (type === 'character') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Moral Character & Civic Conduct' : '৩. চারিত্রিক সনদ ও আচরণ বিবরণ:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800">
          <p>তিনি একজন সদালাপী, সৎ ও উত্তম চরিত্রের অধিকারী। সমাজ বা রাষ্ট্র বিরোধী কোনো অপরাধের সাথে তাহার সম্পৃক্ততা নাই।</p>
        </div>
      </div>
    );
  }

  // 29. Permanent Resident
  if (type === 'permanent_resident') {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
        <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? '3. Permanent Residency Particulars' : '৩. স্থায়ী বাসিন্দা বিবরণ ও পৈতৃক বাসাবাড়ি:'}</span>
        </div>
        <div className="p-3 text-[11.5px] bg-slate-50/50 text-slate-800">
          <p>তিনি অত্র ইউনিয়নের স্থায়ী ও বংশানুক্রমিক আদি বাসিন্দা। তাহার পরিবার পৈতৃক ভিটায় স্থায়ীভাবে বসবাস করিয়া আসিতেছে।</p>
        </div>
      </div>
    );
  }

  // 30. Remaining Types (General Narrative View)
  const meta = CERTIFICATE_CATALOG[type];
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
      <div className="bg-emerald-100/90 px-3 py-1.5 font-bold text-[#0d5c3a] border-b border-slate-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>{isEn ? `3. ${meta?.titleEn || 'Certificate Specific Details'}` : `৩. ${meta?.titleBn || 'সনদ সংক্রান্ত তথ্যাবলী'}:`}</span>
        </span>
        <span className="text-[10px] text-emerald-800 font-semibold">
          {meta?.descriptionBn || 'স্থানীয় অনুসন্ধানে যাচাইকৃত'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 text-[11.5px] bg-slate-50/50">
        <div>
          <span className="text-slate-600 block">{isEn ? 'Application Purpose:' : 'আবেদনের উদ্দেশ্য:'}</span>
          <b>{application.generalPurpose || application.permissionPurpose || 'অফিসিয়াল ও নাগরিক কাজের প্রয়োজনে'}</b>
        </div>
        <div>
          <span className="text-slate-600 block">{isEn ? 'Civic Status & Standing:' : 'নাগরিক অবস্থান ও সত্যতা:'}</span>
          <span className="text-slate-800 font-semibold">অত্র ইউনিয়নের স্থায়ী বাসিন্দা ও রাষ্ট্রবিরোধী অপরাধমুক্ত।</span>
        </div>
        {(application.certificateDetails || application.miscellaneousDetails) && (
          <div className="sm:col-span-2 pt-1 border-t border-slate-200">
            <span className="text-slate-600 block mb-0.5">{isEn ? 'Detailed Particulars:' : 'বিস্তারিত বিবরণ:'}</span>
            <p className="text-slate-800 leading-relaxed bg-white p-2 rounded border border-slate-200">
              {application.certificateDetails || application.miscellaneousDetails}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * -------------------------------------------------------------------------
 * SECTION 2: DYNAMIC MAIN CERTIFICATE BODY (মূল সনদপত্র)
 * Renders the legally accurate certificate body text and tables for ALL 38 TYPES.
 * Fully supports Bengali (Official Sadhu/Cholit UP legal formats) and English.
 * -------------------------------------------------------------------------
 */
export const DynamicCertificateBody: React.FC<TemplateEngineProps> = ({
  application,
  lang = 'bn',
  settings
}) => {
  const isEn = lang === 'en';
  const type = application.certificateType;

  // Shared Address & Legal Variables
  const presentVillage = application.presentVillage || application.village || 'আমবাড়ীয়া';
  const presentWard = application.presentWard || application.wardNo || '০১';
  const presentPost = application.presentPost || application.postOffice || settings.postOffice || 'হালসা-৭০৩১';
  const presentUpazila = application.presentUpazila || settings.upazila || 'মিরপুর';
  const presentDistrict = application.presentDistrict || settings.district || 'কুষ্টিয়া';

  const nameBn = application.applicantNameBn && application.applicantNameBn !== '-' 
    ? application.applicantNameBn 
    : (application.userName && application.userName !== '-' ? application.userName : '—');
  const nidBn = toBengaliNumber((application as any).nidNumber || (application.nidOrBirthReg && application.nidOrBirthReg !== '-' ? application.nidOrBirthReg : '—'));
  const fatherNameBn = (application as any).fatherNameBn || (application.fatherName && application.fatherName !== '-' ? application.fatherName : '');
  const motherNameBn = (application as any).motherNameBn || (application.motherName && application.motherName !== '-' ? application.motherName : '—');
  const guardianUsesHusband = !fatherNameBn && !!application.spouseName;
  const guardianNameBn = fatherNameBn || application.spouseName || '—';
  const guardianLabelBn = guardianUsesHusband ? 'স্বামী' : 'পিতা';
  const villageBn = presentVillage;
  const wardNoBn = toBengaliNumber(presentWard);
  const postOfficeBn = presentPost;
  const unionNameBn = settings.unionName || '১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ';
  const upazilaBn = presentUpazila;
  const districtBn = presentDistrict;

  const deceasedNameBn = application.deceasedPersonName && application.deceasedPersonName !== '-'
    ? application.deceasedPersonName
    : (application.deathPersonName || nameBn);
  const deceasedGuardianTypeBn = application.deceasedFatherOrHusbandType === 'husband' ? 'স্বামী' : 'পিতা';
  const deceasedGuardianNameBn = application.deceasedFatherOrHusbandName && application.deceasedFatherOrHusbandName !== '-'
    ? application.deceasedFatherOrHusbandName
    : (application.fatherName && application.fatherName !== '-' ? application.fatherName : '—');
  const deceasedMotherNameBn = application.motherName && application.motherName !== '-' ? application.motherName : '—';
  const deceasedIdTypeBn = application.deceasedIdType && application.deceasedIdType !== '-' ? application.deceasedIdType : 'পরিচয়পত্র';
  const deceasedIdNumberBn = application.deceasedIdNumber && application.deceasedIdNumber !== '-'
    ? toBengaliNumber(application.deceasedIdNumber)
    : (application.nidOrBirthReg && application.nidOrBirthReg !== '-' && application.nidOrBirthReg !== application.trackingId ? toBengaliNumber(application.nidOrBirthReg) : '—');
  const deathDateBn = application.deceasedDate && application.deceasedDate !== '-' 
    ? formatBengaliDate(application.deceasedDate) 
    : (application.deathDate ? formatBengaliDate(application.deathDate) : '');
  const deathReasonBn = application.deathPlace || (application as any).deathReason || 'স্বাভাবিক/বার্ধক্য';

  const incomeTypeBn = type === 'monthly_income' ? 'মাসিক' : 'বাৎসরিক';
  const incomeAmount = type === 'monthly_income' ? (application.monthlyIncome || 0) : (application.annualIncome || 0);
  const incomeAmountBn = formatCurrencyBn(incomeAmount);
  const aliasNameBn = application.sameNamePerson || (application as any).sameNameRelation || '—';
  const prevDistrictBn = (application as any).prevDistrict || application.permanentDistrict || 'কুষ্টিয়া';
  const prevUpazilaBn = (application as any).prevUpazila || application.permanentUpazila || 'মিরপুর';
  const prevVillageBn = application.voterAreaOld || (application as any).prevVillage || 'পূর্ববর্তী এলাকা';

  // Standard legal paragraph class with enhanced line-height and balanced font size for A4 canvas
  const pClass = "leading-[2.2] text-justify text-slate-900 text-[16px] sm:text-[17.5px]";

  // Dynamic table row compression & scaling detection
  const isTableCertificate = type === 'inheritance' || type === 'succession' || type === 'family';
  const tableRowsCount = (type === 'inheritance' || type === 'succession')
    ? (application.heirs?.length || 0)
    : (type === 'family' ? (application.familyMembers?.length || 0) : 0);

  // Dynamic row styles based on exact user specification:
  // <= 5: padding: 6px 8px; font-size: 14px;
  // > 5 and <= 12: padding: 3px 6px; font-size: 12px; line-height: 1.2;
  // > 12: padding: 2px 4px; font-size: 11px; line-height: 1.1;
  const dynamicCellTdStyle: React.CSSProperties = {
    padding: tableRowsCount <= 5 ? '6px 8px' : (tableRowsCount <= 12 ? '3px 6px' : '2px 4px'),
    fontSize: tableRowsCount <= 5 ? '14px' : (tableRowsCount <= 12 ? '12px' : '11px'),
    lineHeight: tableRowsCount <= 5 ? 1.3 : (tableRowsCount <= 12 ? 1.2 : 1.1)
  };

  const dynamicHeaderThStyle: React.CSSProperties = {
    padding: tableRowsCount <= 5 ? '6px 8px' : (tableRowsCount <= 12 ? '3px 6px' : '2px 4px'),
    fontSize: tableRowsCount <= 5 ? '13px' : (tableRowsCount <= 12 ? '11.5px' : '10.5px'),
    lineHeight: tableRowsCount <= 5 ? 1.3 : (tableRowsCount <= 12 ? 1.2 : 1.1)
  };

  const tableModeClass = tableRowsCount <= 5 
    ? 'table-normal' 
    : (tableRowsCount <= 12 ? 'table-compact' : 'table-ultra-compact');

  const tablePClass = tableRowsCount <= 5
    ? "leading-[1.65] text-justify text-slate-900 text-[13.5px] sm:text-[14px] my-1"
    : (tableRowsCount <= 12 
        ? "leading-[1.35] text-justify text-slate-900 text-[12px] sm:text-[12.5px] my-0.5" 
        : "leading-[1.2] text-justify text-slate-900 text-[11px] sm:text-[11.5px] my-0");

  const tableSpacingClass = tableRowsCount > 12 ? 'my-0.5' : (tableRowsCount > 5 ? 'my-1' : 'my-2');
  const tableContainerSpacing = tableRowsCount > 12 ? 'space-y-0.5' : (tableRowsCount > 5 ? 'space-y-1' : 'space-y-2');

  // ---------------------------------------------------------
  // ENGLISH RENDERING
  // ---------------------------------------------------------
  if (isEn) {
    return (
      <div className={isTableCertificate ? tableContainerSpacing : 'space-y-4'}>
        {/* Inheritance & Succession */}
        {(type === 'inheritance' || type === 'succession') ? (
          <div className={tableContainerSpacing}>
            <p className={tablePClass}>
              This is to officially certify that late <strong>{application.deceasedPersonName || application.applicantNameEn || application.applicantNameBn}</strong>, 
              Holder of {application.deceasedIdType || 'National ID'} No: <strong>{application.deceasedIdNumber || application.nidOrBirthReg}</strong>, 
              Father/Husband: <strong>{application.deceasedFatherOrHusbandName || application.fatherName}</strong>, 
              Mother: <strong>{application.motherName || '—'}</strong>, 
              of Village: <strong>{presentVillage}</strong>, Ward No: <strong>{presentWard}</strong>, 
              Post Office: <strong>{presentPost}</strong>, Upazila: <strong>{presentUpazila}</strong>, 
              District: <strong>{presentDistrict}</strong>, was a permanent resident of this Union Parishad. 
              {deathDateBn ? ` He/She passed away on ${deathDateBn}, leaving behind the following lawful legal heirs:` : ' He/She passed away leaving behind the following lawful legal heirs:'}
            </p>
            <div className={`overflow-x-auto ${tableSpacingClass}`}>
              <table className={`w-full border border-slate-400 bg-white/95 ${tableModeClass}`}>
                <thead className="bg-emerald-100 text-slate-900 font-bold">
                  <tr>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-12 text-center">SL</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">Heir Name</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">Relation</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">NID / Birth Reg No</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-32 text-center">Date of Birth / Age</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-20 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {application.heirs && application.heirs.length > 0 ? (
                    application.heirs.map((h, i) => (
                      <tr key={i} className="text-center">
                        <td style={dynamicCellTdStyle} className="border border-slate-400 font-semibold">{i + 1}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400 font-bold text-left pl-2 text-slate-900">{h.name}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400">{h.relation}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400 text-left pl-2 font-mono">{h.nidOrBirth || '—'}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400">{h.dob || `${h.age || '—'} Years`}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400 text-slate-700">{h.remarks || 'Lawful Heir'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={dynamicCellTdStyle} className="border border-slate-400 text-center text-slate-500">No heir records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className={tablePClass}>
              I pray for the eternal salvation and peace of his/her departed soul, and wish prosperity to all living heirs.
            </p>
          </div>
        ) : type === 'family' ? (
          <div className={tableContainerSpacing}>
            <p className={tablePClass}>
              This is to certify that <strong>{application.applicantNameEn || application.applicantNameBn}</strong>, 
              NID / Birth Reg No: <strong>{application.nidOrBirthReg}</strong>, 
              Father/Spouse: <strong>{application.fatherName || '—'}</strong>, 
              Mother: <strong>{application.motherName || '—'}</strong>, 
              residing at Village: <strong>{presentVillage}</strong>, Ward No: <strong>{presentWard}</strong>, 
              Post Office: <strong>{presentPost}</strong>, Upazila: <strong>{presentUpazila}</strong>, 
              District: <strong>{presentDistrict}</strong>, is a permanent resident of this Union Parishad. As per official inquiry and local testimonies, the following persons are the recognized living lawful members of his/her family:
            </p>
            <div className={`overflow-x-auto ${tableSpacingClass}`}>
              <table className={`w-full border border-slate-400 bg-white/95 ${tableModeClass}`}>
                <thead className="bg-emerald-100 text-slate-900 font-bold">
                  <tr>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-12 text-center">SL</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">Member Name</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">Relation</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">NID / Birth Reg No</th>
                    <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {application.familyMembers && application.familyMembers.length > 0 ? (
                    application.familyMembers.map((m, i) => (
                      <tr key={i} className="text-center">
                        <td style={dynamicCellTdStyle} className="border border-slate-400 font-semibold">{i + 1}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400 font-bold text-left pl-2 text-slate-900">{m.name}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400">{m.relation}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400 text-left pl-2 font-mono">{(m as any).nidOrBirth || '—'}</td>
                        <td style={dynamicCellTdStyle} className="border border-slate-400">{m.age} Years</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={dynamicCellTdStyle} className="border border-slate-400 text-center text-slate-500">No family member records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className={tablePClass}>
              I wish good health, happiness, and peace to all the members of the family.
            </p>
          </div>
        ) : (
          <>
            <p className={pClass}>
              This is to certify that <strong>{application.applicantNameEn || application.applicantNameBn}</strong>, 
              Son/Daughter/Spouse of <strong>{application.fatherName || '—'}</strong>, 
              Mother: <strong>{application.motherName || '—'}</strong>, 
              Holder of NID / Birth Reg No: <strong>{application.nidOrBirthReg}</strong>, 
              residing at Village: <strong>{presentVillage}</strong>, Ward No: <strong>{presentWard}</strong>, 
              Post Office: <strong>{presentPost}</strong>, Upazila: <strong>{presentUpazila}</strong>, 
              District: <strong>{presentDistrict}</strong>, is a permanent resident and bona fide citizen of Bangladesh under the jurisdiction of this Union Parishad.
            </p>
            <p className={pClass}>
              Upon official enquiry and verification of local civil records, all statements and credentials furnished in respect of <strong>{application.certificateTitleEn || 'this Certificate'}</strong> have been found authentic, lawful, and accurate. To the best of my knowledge, he/she bears good moral character and has not engaged in any unlawful or subversive activity.
            </p>
            <p className="pt-2 text-slate-900 font-medium">
              I wish him/her every happiness, peace, and prosperity in all future endeavours.
            </p>
          </>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------
  // BENGALI RENDERING (Authentic Union Parishad Sadhu/Cholit Legal Formats)
  // ---------------------------------------------------------
  return (
    <div className={isTableCertificate ? tableContainerSpacing : 'space-y-3.5'}>
      {/* 1. Inheritance / Succession (ওয়ারিশ / উত্তরাধিকার সনদ) */}
      {(type === 'inheritance' || type === 'succession') && (
        <div className={tableContainerSpacing}>
          <p className={tablePClass}>
            এই মর্মে ওয়ারিশান সনদপত্র প্রদান করা যাইতেছে যে, <strong>{deceasedNameBn}</strong>, {deceasedIdTypeBn} নং: <strong>{deceasedIdNumberBn}</strong>, {deceasedGuardianTypeBn}: <strong>{deceasedGuardianNameBn}</strong>, মাতা: <strong>{deceasedMotherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা ছিলেন। {deathDateBn ? <>তথ্য দাতার তথ্য মতে তিনি বিগত <strong>{deathDateBn}</strong> ইং তারিখে </> : <>তথ্য দাতার তথ্য মতে তিনি </>}নিম্নে বর্ণিত আইনগত ওয়ারিশ রেখে মৃত্যু বরণ করেন।
          </p>
          <div className={`overflow-x-auto ${tableSpacingClass}`}>
            <table className={`w-full border border-slate-400 bg-white/95 ${tableModeClass}`}>
              <thead className="bg-emerald-100 text-slate-900 font-bold">
                <tr>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-12 text-center">ক্রমিক নং</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">ওয়ারিশের নাম</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">সম্পর্ক</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">ভোটার আইডি / জন্ম সনদ</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-32 text-center">জন্ম তারিখ / বয়স</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-20 text-center">মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                {application.heirs && application.heirs.length > 0 ? (
                  application.heirs.map((h, i) => (
                    <tr key={i} className="text-center">
                      <td style={dynamicCellTdStyle} className="border border-slate-400 font-semibold">{toBengaliNumber(i + 1)}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400 font-bold text-left pl-2 text-slate-900">{h.name || '—'}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400">{h.relation || '—'}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400 text-left pl-2 font-mono">{h.nidOrBirth && h.nidOrBirth !== '-' ? toBengaliNumber(h.nidOrBirth) : '—'}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400">{h.dob ? `${formatBengaliDate(h.dob)} ${h.age ? `(${toBengaliNumber(h.age)} বছর)` : ''}` : (h.age ? `${toBengaliNumber(h.age)} বছর` : '—')}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400 text-slate-700">{h.remarks || 'ওয়ারিশ'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={dynamicCellTdStyle} className="border border-slate-400 text-center text-slate-500">কোনো ওয়ারিশ তালিকা পাওয়া যায়নি</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className={tablePClass}>
            আমি তার বিদেহী আত্মার মাগফিরাত/শান্তি ও জীবিতদের সার্বিক উন্নতি ও মঙ্গল কামনা করছি।
          </p>
        </div>
      )}

      {/* 2. Family Certificate (পারিবারিক সনদ) */}
      {type === 'family' && (
        <div className={tableContainerSpacing}>
          <p className={tablePClass}>
            এই মর্মে পারিবারিক সনদপত্র প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। স্থানীয় তদন্ত ও তথ্য দাতার তথ্য মতে নিম্নে লিখিত ব্যক্তিবর্গ তাহার পরিবারের নিয়মিত আইনসম্মত সদস্য:
          </p>
          <div className={`overflow-x-auto ${tableSpacingClass}`}>
            <table className={`w-full border border-slate-400 bg-white/95 ${tableModeClass}`}>
              <thead className="bg-emerald-100 text-slate-900 font-bold">
                <tr>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-12 text-center">ক্রমিক</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 text-left pl-2">নাম</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">সম্পর্ক</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 text-center">জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">বয়স</th>
                  <th style={dynamicHeaderThStyle} className="border border-slate-400 w-24 text-center">মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                {application.familyMembers && application.familyMembers.length > 0 ? (
                  application.familyMembers.map((m, i) => (
                    <tr key={i} className="text-center">
                      <td style={dynamicCellTdStyle} className="border border-slate-400 font-semibold">{toBengaliNumber(i + 1)}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400 font-bold text-left pl-2 text-slate-900">{m.name}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400">{m.relation}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400 font-mono">{toBengaliNumber((m as any).nidOrBirth || '—')}</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400">{toBengaliNumber(m.age)} বছর</td>
                      <td style={dynamicCellTdStyle} className="border border-slate-400 text-slate-600 font-normal">সদস্য</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={dynamicCellTdStyle} className="border border-slate-400 text-center text-slate-500">কোনো সদস্য তালিকা পাওয়া যায়নি</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className={tablePClass}>
            আমি তাহাদের পরিবারের সকলের সুস্বাস্থ্য ও জীবনের সার্বিক উন্নতি ও মঙ্গল কামনা করি।
          </p>
        </div>
      )}

      {/* 3. Same Name Certificate (একই নামের প্রত্যয়ন) */}
      {type === 'same_name' && (
        <p className={pClass}>
          এই মর্মে নাম প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। আমি তাহাকে ব্যক্তিগত ভাবে চিনি ও অবগত রহিয়াছি। সে সমাজ বা রাষ্ট্রের বিরোধী কোন প্রকার কাজের সহিত জড়িত নাই। আমার জানামতে তাহার নাম: <strong>{nameBn}</strong> ওরফে <strong>{aliasNameBn}</strong> তিনি একই ব্যক্তি এবং উভয় নাম দ্বারা একই ব্যক্তিকে বুঝানো হইয়া থাকে। আমি তাহার জীবনের সার্বিক উন্নতি ও মঙ্গল কামনা করি।
        </p>
      )}

      {/* 4. Voter Area Transfer & New Voter (ভোটার এলাকা স্থানান্তর ও নতুন ভোটার) */}
      {(type === 'voter_area_transfer' || type === 'new_voter' || type === 'new_voter_affidavit') && (
        <p className={pClass}>
          এই মর্মে {type === 'voter_area_transfer' ? 'ভোটার এলাকা স্থানান্তর প্রত্যয়ন' : 'নতুন ভোটার প্রত্যয়ন'} প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। আমি তাহাকে ব্যক্তিগত ভাবে চিনি ও অবগত রহিয়াছি। সে সমাজ বা রাষ্ট্রের বিরোধী কোন প্রকার কাজের সহিত জড়িত নাই। {type === 'voter_area_transfer' ? <>আমার জানামতে সে <strong>{prevDistrictBn}</strong> জেলার <strong>{prevUpazilaBn}</strong> উপজেলার <strong>{prevVillageBn}</strong> গ্রামে উল্লিখিত ঠিকানায় ভোটার তালিকায় অন্তর্ভুক্ত ছিল। বর্তমানে তিনি গ্রাম: <strong>{villageBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong> ঠিকানায় পরিবারসহ দীর্ঘদিন ধরে বসবাস করিয়া আসিতেছেন বিধায় বর্তমান ঠিকানায় ভোটার এলাকা স্থানান্তরযোগ্য।</> : <>তিনি অত্র ইউনিয়নের স্থায়ী ও জন্মসূত্রে নাগরিক। তিনি কোনো বিদেশি নাগরিক বা রোহিঙ্গা নহেন এবং ভোটার তালিকা হালনাগাদ আইনে ভোটার হওয়ার উপযুক্ত।</>} আমি তাহার জীবনের সার্বিক মঙ্গল কামনা করি।
        </p>
      )}

      {/* 5. Death Certificate (মৃত্যু সনদ) */}
      {type === 'death' && (
        <p className={pClass}>
          এই মর্মে মৃত্যু সনদপত্র প্রদান করিতেছি যে, <strong>{deceasedNameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা ছিলেন। আমার জ্ঞাতসারে ও স্থানীয় তথ্য দাতার সাক্ষ্য মোতাবেক তিনি বিগত <strong>{deathDateBn || '—'}</strong> ইং তারিখে <strong>{deathReasonBn}</strong> জনিত কারণে মৃত্যুবরণ করিয়াছেন। আমি তাহার বিদেহী আত্মার মাগফিরাত ও শান্তি কামনা করি।
        </p>
      )}

      {/* 6. Income Certificate (বাৎসরিক / মাসিক আয়ের সনদপত্র) */}
      {(type === 'income' || type === 'annual_income' || type === 'monthly_income') && (
        <p className={pClass}>
          এই মর্মে <strong>{incomeTypeBn}</strong> আয়ের সনদপত্র প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। আমি তাহাকে ব্যক্তিগত ভাবে চিনি ও অবগত রহিয়াছি। তিনি সমাজ বা রাষ্ট্র বিরোধী কোনো অপরাধের সহিত জড়িত নহেন। স্থানীয় অনুসন্ধান ও নথিপত্র অনুসারে তাহার নিজ/পিতার/পরিবারের <strong>{incomeTypeBn}</strong> সর্বমোট আয় <strong>{incomeAmountBn}</strong> (কথায়: {numberToWordsBn(incomeAmount)}) টাকা। আমি তাহার জীবনের সার্বিক উন্নতি ও সাফল্য কামনা করি।
        </p>
      )}

      {/* 7. Character & Unemployment Certificate (চারিত্রিক ও বেকারত্ব সনদ) */}
      {(type === 'character' || type === 'unemployed') && (
        <p className={pClass}>
          এই মর্মে <strong>{type === 'unemployed' ? 'বেকারত্ব সনদপত্র' : 'চারিত্রিক সনদপত্র'}</strong> প্রদান করিতেছি যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। আমি তাহাকে চিনি ও অবগত রহিয়াছি। তিনি সমাজ ও রাষ্ট্রের প্রতি অনুগত এবং সদালাপী, সৎ ও উত্তম চরিত্রের অধিকারী। {type === 'unemployed' ? 'আমার জানামতে তিনি বর্তমানে কোনো সরকারি, আধা-সরকারি বা স্থায়ী লাভজনক চাকুরিতে নিয়োজিত নহেন। তিনি একজন প্রকৃত বেকার যুবক/নাগরিক।' : 'তাহার বিরুদ্ধে অত্র এলাকায় রাষ্ট্রবিরোধী বা কোনো প্রকার ফৌজদারি অপরাধের রেকর্ড নাই।'} আমি তাহার জীবনের সার্বিক উন্নতি ও মঙ্গল কামনা করি।
        </p>
      )}

      {/* 8. Citizenship & Nationality Certificate (নাগরিকত্ব ও জাতীয়তা সনদ) */}
      {(type === 'citizenship' || type === 'nationality') && (
        <p className={pClass}>
          এই মর্মে <strong>{type === 'citizenship' ? 'নাগরিক সনদপত্র' : 'জাতীয়তা সনদপত্র'}</strong> প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। তিনি জন্মসূত্রে বাংলাদেশের একজন স্থায়ী নাগরিক ও অধিবাসী। তিনি সমাজ ও রাষ্ট্রের প্রতি অনুগত এবং তাহার আচরণ সন্তোষজনক। আমি তাহার জীবনের সার্বিক মঙ্গল কামনা করি।
        </p>
      )}

      {/* 9. Unmarried & Married Certificate (অবিবাহিত ও বিবাহিত প্রত্যয়ন) */}
      {(type === 'unmarried' || type === 'married') && (
        <p className={pClass}>
          এই মর্মে <strong>{type === 'unmarried' ? 'অবিবাহিত প্রত্যয়ন' : 'বিবাহিত প্রত্যয়ন'}</strong> প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। {type === 'unmarried' ? 'স্থানীয় তদন্ত ও ঘোষণা মোতাবেক তিনি অদ্যবধি কোনো বিবাহ বন্ধনে আবদ্ধ হন নাই। তিনি সম্পূর্ণ আইনসম্মত একজন অবিবাহিত নাগরিক।' : `তিনি পারিবারিকভাবে বিবাহিত এবং বর্তমানে তাহার দাম্পত্য জীবন শান্তিময় ও অটুট রহিয়াছে।`} আমি তাহার জীবনের সার্বিক উন্নতি ও সুখ-শান্তি কামনা করি।
        </p>
      )}

      {/* 10. Non Remarriage & Widow Certificate (পুনঃবিবাহ না হওয়া ও বিধবা প্রত্যয়ন) */}
      {(type === 'non_remarriage' || type === 'widow') && (
        <p className={pClass}>
          এই মর্মে <strong>{type === 'non_remarriage' ? 'পুনঃবিবাহ না হওয়া প্রত্যয়ন' : 'বিধবা প্রত্যয়ন'}</strong> প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। তিনি প্রয়াত <strong>{application.previousHusbandName || 'স্বামীর'}</strong>-এর আইনসম্মত বিধবা পত্নী। তাহার স্বামীর মৃত্যুর পর অদ্যবধি তিনি দ্বিতীয় কোনো বিবাহবন্ধনে আবদ্ধ হন নাই বলিয়া স্থানীয় তদন্তে নিশ্চিত হওয়া গিয়াছে। আমি তাহার ভবিষ্যৎ জীবনের শান্তি ও কল্যাণ কামনা করি।
        </p>
      )}

      {/* 11. Agriculture Certificate (কৃষি প্রত্যয়ন) */}
      {type === 'agriculture' && (
        <p className={pClass}>
          এই মর্মে কৃষি প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। তিনি একজন প্রকৃত প্রান্তিক/ক্ষুদ্র কৃষক এবং কৃষি কাজের মাধ্যমে জীবিকা নির্বাহ করিয়া থাকেন। তাহার দখলে থাকা আনুমানিক <strong>{application.agricultureLand || '১ একর ৫০ শতাংশ'}</strong> জমিতে তিনি ফসল উৎপাদন করিয়া থাকেন। আমি তাহার কৃষিকাজের সাফল্য ও সার্বিক সমৃদ্ধি কামনা করি।
        </p>
      )}

      {/* 12. Freedom Fighter Heir Certificate (বীর মুক্তিযোদ্ধা উত্তরাধিকার সনদ) */}
      {type === 'freedom_fighter' && (
        <p className={pClass}>
          এই মর্মে বীর মুক্তিযোদ্ধা উত্তরাধিকার প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। তিনি জাতির শ্রেষ্ঠ সন্তান বীর মুক্তিযোদ্ধা <strong>{application.freedomFighterName || ''}</strong> (গেজেট/সনদ নং: <strong>{toBengaliNumber(application.freedomFighterNumber || 'যাচাইকৃত')}</strong>)-এর আইনসম্মত <strong>{application.freedomFighterRelation || 'উত্তরাধিকারী/সন্তান'}</strong>। আমি তাহার ও তাহার পরিবারের সার্বিক মঙ্গল কামনা করি।
        </p>
      )}

      {/* 13. Landless Certificate (ভূমিহীন প্রত্যয়ন) */}
      {type === 'landless' && (
        <p className={pClass}>
          এই মর্মে ভূমিহীন প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। স্থানীয় সরেজমিন তদন্তে নিশ্চিত হওয়া গিয়াছে যে তাহার বা তাহার যৌথ পরিবারের নামে কোনো আবাদি বা ভিটা জমি নাই। তিনি একজন প্রকৃত ভূমিহীন ও দরিদ্র নাগরিক। আমি তাহার সার্বিক কল্যাণ কামনা করি।
        </p>
      )}

      {/* 14. Disability Certificate (প্রতিবন্ধী সনদ) */}
      {type === 'disabled' && (
        <p className={pClass}>
          এই মর্মে প্রতিবন্ধী প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। তিনি একজন <strong>{application.disabilityType || 'শারীরিক'}</strong> প্রতিবন্ধী নাগরিক এবং সরকারি সহায়তাপ্রাপ্তির সম্পূর্ণ যোগ্য। আমি তাহার দীর্ঘায়ু ও সুস্থতা কামনা করি।
        </p>
      )}

      {/* 15. Financial Insolvency (আর্থিক অস্বচ্ছলতার সনদ) */}
      {type === 'financial_insolvency' && (
        <p className={pClass}>
          এই মর্মে আর্থিক অস্বচ্ছলতার সনদপত্র প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। তাহার পরিবারের নিয়মিত কোনো স্থায়ী আয়ের উৎস নাই এবং তিনি আর্থিকভাবে অসচ্ছল ও অতিদরিদ্র। সরকারি/বেসরকারি বৃত্তি, চিকিৎসা অনুদান বা আর্থিক সহায়তা প্রাপ্তির জন্য তিনি উপযুক্ত বিবেচনাযোগ্য। আমি তাহার সার্বিক উন্নতি কামনা করি।
        </p>
      )}

      {/* 16. Permanent Resident Certificate (স্থায়ী বাসিন্দা সনদ) */}
      {type === 'permanent_resident' && (
        <p className={pClass}>
          এই মর্মে স্থায়ী বাসিন্দা প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী, নিয়মিত ও পৈতৃক আদি নিবাসী। অত্র ইউনিয়নে তাহার পরিবারের বসতভিটা বিদ্যমান রহিয়াছে। আমি তাহার জীবনের সার্বিক উন্নতি ও দীর্ঘায়ু কামনা করি।
        </p>
      )}

      {/* 17. Not Rohingya Certificate (রোহিঙ্গা নয় প্রত্যয়ন) */}
      {type === 'not_rohingya' && (
        <p className={pClass}>
          এই মর্মে চূড়ান্তভাবে প্রত্যয়ন করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি জন্মসূত্রে ও বংশানুক্রমে বাংলাদেশের একজন বৈধ স্থায়ী নাগরিক ও অধিবাসী। স্থানীয় সরেজমিন অনুসন্ধান ও জাতীয় পরিচয় নথিপত্র পুঙ্খানুপুঙ্খ যাচাইক্রমে নিশ্চিত হওয়া গিয়াছে যে, তিনি কোনোক্রমেই মায়ানমার হইতে আগত বলপ্রয়োগে বাস্তুচ্যুত রোহিঙ্গা নাগরিক নহেন। আমি তাহার ভবিষ্যৎ সাফল্য কামনা করি।
        </p>
      )}

      {/* 18. No Birth Certificate (জন্মসনদ না থাকা সংক্রান্ত প্রত্যয়ন) */}
      {type === 'no_birth_certificate' && (
        <p className={pClass}>
          এই মর্মে প্রত্যয়ন করা যাইতেছে যে, <strong>{nameBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের একজন স্থায়ী বাসিন্দা। স্থানীয় নিবন্ধন বহি পর্যালোচনা ও অনুসন্ধানে দেখা যায় যে, তাহার কোনো পূর্ববর্তী ডিজিটাল জন্মসনদ প্রদান করা হয় নাই। তাহার জন্মতারিখ সংক্রান্ত দাখিলকৃত হলফনামা ও সাক্ষ্যপ্রমাণ সঠিক পাওয়া গিয়াছে। আমি তাহার জীবনের সার্বিক উন্নতি কামনা করি।
        </p>
      )}

      {/* 19. NID Correction Certificate (জাতীয় পরিচয় তথ্য সংশোধন প্রত্যয়ন) */}
      {type === 'nid_correction' && (
        <p className={pClass}>
          এই মর্মে জাতীয় পরিচয়পত্র তথ্য সংশোধনের প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের একজন স্থায়ী বাসিন্দা। নির্বাচন কমিশনের তালিকায় তাহার <strong>{application.correctionField || 'নাম/বয়স'}</strong> সংক্রান্ত তথ্যে অনিচ্ছাকৃত ভুল পরিলক্ষিত হইয়াছে। অত্র ইউনিয়ন পরিষদের সংরক্ষিত রেকর্ড ও শিক্ষাগত সনদ অনুযায়ী বর্তমান ভুল তথ্যের স্থলে সঠিক তথ্য: <strong>{application.correctionNewValue || 'প্রস্তাবিত তথ্য'}</strong> প্রতিস্থাপন করার জন্য অত্র প্রত্যয়নপত্র সুপারিশপূর্বক প্রদান করা হইল।
        </p>
      )}

      {/* 20. Infrastructure Permission (অবকাঠামো নির্মাণের অনুমতিপত্র) */}
      {type === 'infrastructure_permission' && (
        <p className={pClass}>
          এই মর্মে অবকাঠামো নির্মাণের অনুমতি প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের অনুমোদিত সীমানায় তাহার স্বত্বদখলীয় জমিতে <strong>{application.constructionType || 'একতলা পাকা ভবন'}</strong> নির্মাণের আবেদন করিয়াছেন। স্থানীয় সরেজমিন পরিদর্শন ও সরকারি নকশা মানদণ্ড যাচাই সাপেক্ষে বিধি মোতাবেক অত্র অনুমতিপত্র মঞ্জুর করা হইল।
        </p>
      )}

      {/* 21. No Objection Certificate (অনাপত্তি সনদ / NOC) */}
      {type === 'no_objection' && (
        <p className={pClass}>
          এই মর্মে অনাপত্তি সনদ (NOC) প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের একজন স্থায়ী বাসিন্দা। তাহার <strong>{application.nocPurpose || application.generalPurpose || 'পাসপোর্ট / চাকুরি / প্রাতিষ্ঠানিক'}</strong> কাজের আবেদন প্রক্রিয়াকরণে অত্র ইউনিয়ন পরিষদের কোনো প্রকার আপত্তি বা অভিযোগ নাই।
        </p>
      )}

      {/* 22. Childless Certificate (নিঃসন্তান প্রত্যয়ন) */}
      {type === 'childless' && (
        <p className={pClass}>
          এই মর্মে নিঃসন্তান প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের একজন স্থায়ী বাসিন্দা। স্থানীয় বয়োজ্যেষ্ঠ ও জনপ্রতিনিধিদের সাক্ষ্য মোতাবেক তিনি ও তাহার দাম্পত্য জীবনে কোনো প্রকার জীবিত বা মৃত সন্তান-সন্ততি নাই। তিনি একজন নিঃসন্তান নাগরিক। আমি তাহার সার্বিক শান্তি ও কল্যাণ কামনা করি।
        </p>
      )}

      {/* 23. Indigenous / Community Certificate (উপজাতি / সম্প্রদায় সনদ) */}
      {(type === 'community' || type === 'indigenous') && (
        <p className={pClass}>
          এই মর্মে {type === 'indigenous' ? 'উপজাতি সনদ' : 'সম্প্রদায় সনদ'} প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি অত্র ইউনিয়নের একজন স্থায়ী বাসিন্দা এবং ঐতিহ্যবাহী <strong>{application.communityName || 'ক্ষুদ্র নৃ-গোষ্ঠী'}</strong> সম্প্রদায়ের অন্তর্ভুক্ত একজন সম্মানিত সদস্য। আমি তাহার জীবনের সার্বিক সমৃদ্ধি কামনা করি।
        </p>
      )}

      {/* 24. Orphan Certificate (এতিম সনদ) */}
      {type === 'orphan' && (
        <p className={pClass}>
          এই মর্মে এতিম প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong> (মরহুম), মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তাহার পিতা অপ্রাপ্তবয়স্ক অবস্থায় মৃত্যুবরণ করায় তিনি একজন অসহায় এতিম সন্তান। তিনি অত্র ইউনিয়নের সংরক্ষিত এতিম কল্যাণ সুবিধা ও অনুদান প্রাপ্তির উপযুক্ত। আমি তাহার উজ্জ্বল ভবিষ্যৎ কামনা করি।
        </p>
      )}

      {/* 25. Guardian Permission Certificate (অভিভাবকের অনুমতিপত্র) */}
      {type === 'guardian_permission' && (
        <p className={pClass}>
          এই মর্মে অভিভাবকের অনুমতিপত্র সত্যায়ন করা যাইতেছে যে, <strong>{application.guardianName || guardianNameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি তাহার পোষ্য <strong>{nameBn}</strong>-এর আইনসম্মত অভিভাবক হিসেবে <strong>{application.permissionPurpose || 'শিক্ষা ও ভ্রমণের উদ্দেশ্যে'}</strong> অনুমতি প্রদান করিয়াছেন, যাহা অত্র পরিষদ কর্তৃক যথাযথভাবে লিপিবদ্ধ ও সত্যায়িত করা হইল।
        </p>
      )}

      {/* 26. General / Miscellaneous & Other Certificates (সাধারণ ও অন্যান্য প্রত্যয়ন) */}
      {![
        'inheritance', 'succession', 'family', 'same_name', 'voter_area_transfer', 
        'new_voter', 'new_voter_affidavit', 'death', 'income', 'annual_income', 
        'monthly_income', 'character', 'unemployed', 'citizenship', 'nationality', 
        'unmarried', 'married', 'non_remarriage', 'widow', 'agriculture', 
        'freedom_fighter', 'landless', 'disabled', 'financial_insolvency', 
        'permanent_resident', 'not_rohingya', 'no_birth_certificate', 'nid_correction', 
        'infrastructure_permission', 'no_objection', 'childless', 'community', 
        'indigenous', 'orphan', 'guardian_permission', 'trade_license'
      ].includes(type) && (
        <p className={pClass}>
          এই মর্মে <strong>{application.certificateTitleBn || 'প্রত্যয়ন পত্র'}</strong> প্রদান করা যাইতেছে যে, <strong>{nameBn}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{nidBn}</strong>, {guardianLabelBn}: <strong>{guardianNameBn}</strong>, মাতা: <strong>{motherNameBn}</strong>, গ্রাম: <strong>{villageBn}</strong>, ওয়ার্ড: <strong>{wardNoBn}</strong>, ডাকঘর: <strong>{postOfficeBn}</strong>, ইউনিয়ন: <strong>{unionNameBn}</strong>, উপজেলা: <strong>{upazilaBn}</strong>, জেলা: <strong>{districtBn}</strong>। তিনি আমার ইউনিয়নের <strong>{wardNoBn}</strong> নং ওয়ার্ডের একজন স্থায়ী বাসিন্দা। অত্র ইউনিয়ন পরিষদ কর্তৃক প্রয়োজনীয় তদন্ত ও স্থানীয় অনুসন্ধানের ভিত্তিতে উপরোক্ত বিবরণী ও তথ্যাবলী সত্য ও সঠিক পাওয়া গিয়াছে। তাহার আবেদনের প্রেক্ষিতে অত্র ইউনিয়ন পরিষদ হইতে এই প্রত্যয়ন যথাযথভাবে প্রদান করা হইল। আমি তাহার ভবিষ্যৎ জীবনের সর্বাঙ্গীন মঙ্গল, দীর্ঘায়ু ও সাফল্য কামনা করিতেছি।
        </p>
      )}
    </div>
  );
};
