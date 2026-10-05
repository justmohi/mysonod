import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { CertificateApplication } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate } from '../utils/bengali';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  ShieldCheck, 
  Building2, 
  QrCode,
  ArrowRight
} from 'lucide-react';

interface CertificateVerificationViewProps {
  onViewCertificate: (app: CertificateApplication) => void;
}

export const CertificateVerificationView: React.FC<CertificateVerificationViewProps> = ({
  onViewCertificate
}) => {
  const [trackingInput, setTrackingInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundApp, setFoundApp] = useState<CertificateApplication | null>(null);
  const [loading, setLoading] = useState(false);

  // Check URL hash if opened via QR scan (#verify?id=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('id=')) {
      const idFromHash = hash.split('id=')[1];
      if (idFromHash) {
        setTrackingInput(decodeURIComponent(idFromHash));
        verifyCertificate(decodeURIComponent(idFromHash));
      }
    }
  }, []);

  const verifyCertificate = async (trackingId: string) => {
    if (!trackingId.trim()) return;
    setLoading(true);
    setSearched(true);
    setFoundApp(null);

    try {
      const q = query(
        collection(db, 'applications'),
        where('trackingId', '==', trackingId.trim())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setFoundApp(snapshot.docs[0].data() as CertificateApplication);
      } else {
        setFoundApp(null);
      }
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.GET, 'applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(trackingInput);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <QrCode className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          অনলাইন পাবলিক ভেরিফিকেশন পোর্টাল
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">
          ই-প্রত্যয়ন সনদ সত্যতা যাচাই
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
          ১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ ডিজিটাল সেন্টার কর্তৃক ইস্যুকৃত সকল নাগরিক ও ব্যবসায়িক প্রত্যয়ন পত্রের সত্যতা অনলাইন ডেটাবেস থেকে তাৎক্ষণিক যাচাই করুন।
        </p>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-wrap gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="ট্র্যাকিং আইডি লিখুন (যেমন: EP-2026-AMB-10492)"
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>যাচাই করুন</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Section */}
      {searched && !loading && (
        <>
          {foundApp ? (
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-emerald-500 animate-in fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      বৈধ ও পরীক্ষিত সনদ (Verified & Authentic)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {foundApp.certificateTitleBn}
                  </h3>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs text-slate-700">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">ট্র্যাকিং নম্বর:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{foundApp.trackingId}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">ইস্যুর তারিখ:</span>
                  <span className="font-bold text-slate-800 text-sm">{formatBengaliDate(foundApp.approvedAt || foundApp.createdAt)}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">আবেদনকারীর নাম:</span>
                  <span className="font-bold text-slate-800 text-sm">{foundApp.applicantNameBn}</span>
                  {foundApp.applicantNameEn && <span className="text-slate-500 block">({foundApp.applicantNameEn})</span>}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">পিতা ও মাতার নাম:</span>
                  <span className="font-semibold text-slate-800">{foundApp.fatherName} ও {foundApp.motherName}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">এনআইডি/জন্মনিবন্ধন:</span>
                  <span className="font-mono font-bold text-slate-800">{foundApp.nidOrBirthReg}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">ঠিকানা:</span>
                  <span className="font-semibold text-slate-800">{foundApp.village}, ওয়ার্ড: {toBengaliNumber(foundApp.wardNo)}, ডাকঘর: {foundApp.postOffice}</span>
                </div>
              </div>

              {/* View full printable certificate button */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => onViewCertificate(foundApp)}
                  className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>সম্পূর্ণ মূল সনদপত্র দেখুন ও প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-xs border-2 border-red-200 animate-in fade-in">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                সনদপত্রটি খুঁজে পাওয়া যায়নি!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ইনপুটকৃত ট্র্যাকিং আইডি ({trackingInput}) দিয়ে ১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ ডেটাবেসে কোনো বৈধ সনদপত্র মেলেনি। দয়া করে ট্র্যাকিং আইডি পুনরায় পরীক্ষা করুন।
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
