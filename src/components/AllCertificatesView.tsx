import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  runTransaction
} from 'firebase/firestore';
import type { CertificateApplication, CertificateType } from '../types';
import { CERTIFICATE_CATALOG } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate } from '../utils/bengali';
import { cleanDataForFirestore } from '../utils/firestore';
import { applyOperatorCompletionChargeInTransaction } from '../utils/operatorBilling';
import { 
  Search, 
  Filter, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  Eye,
  ShieldCheck,
  Building2,
  Edit3,
  CheckCheck,
  Copy
} from 'lucide-react';
import { EditCertificateModal } from './EditCertificateModal';

interface AllCertificatesViewProps {
  onNavigate: (view: string, data?: any) => void;
  onViewCertificate: (app: CertificateApplication, options?: { isDuplicate?: boolean }) => void;
}

export const AllCertificatesView: React.FC<AllCertificatesViewProps> = ({
  onNavigate,
  onViewCertificate
}) => {
  const { currentUser, userProfile, isAdmin, isOperator, isStaff } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<CertificateApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState<CertificateApplication | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Staff (Admin + all Union Operators) can view the shared certificate queue.
    // Citizens only see their own applications.
    const appQuery = isStaff
      ? collection(db, 'applications')
      : query(collection(db, 'applications'), where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(appQuery, (snapshot) => {
      const list: CertificateApplication[] = [];
      snapshot.forEach(docSnap => list.push(docSnap.data() as CertificateApplication));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setApplications(list);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'applications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isStaff]);

  const handleApproveApplication = async (app: CertificateApplication) => {
    if (!isOperator || !currentUser) return;

    const confirmed = window.confirm(
      `সনদ অনুমোদন করলে আপনার উদ্যোক্তা billing নিয়ম অনুযায়ী প্রযোজ্য চার্জ কাটা হবে।\\n\\nসনদ: ${app.certificateTitleBn}\\nট্র্যাকিং: ${app.trackingId}\\n\\nআপনি কি সনদটি অনুমোদন করতে চান?`
    );
    if (!confirmed) return;

    setProcessingId(app.id);

    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const appRef = doc(db, 'applications', app.id);

      await runTransaction(db, async (transaction) => {
        const appSnap = await transaction.get(appRef);
        if (!appSnap.exists()) {
          throw new Error('আবেদনটি পাওয়া যায়নি।');
        }

        const liveApp = appSnap.data() as CertificateApplication;
        if (liveApp.status !== 'Pending') {
          throw new Error('এই আবেদনটি ইতোমধ্যে প্রসেস করা হয়েছে।');
        }

        const billing = await applyOperatorCompletionChargeInTransaction(
          transaction,
          currentUser.uid,
          app.id,
          app.certificateTitleBn,
          now
        );

        transaction.update(appRef, cleanDataForFirestore({
          status: 'Approved',
          approvedAt: nowIso,
          completedAt: nowIso,
          completedByUid: currentUser.uid,
          completedByEmail: currentUser.email || '',
          issuingOfficer: userProfile?.name || 'ইউনিয়ন উদ্যোক্তা',
          completionCharge: billing.charge,
          completionChargeType: billing.chargeType
        }));
      });

      alert('সনদ সফলভাবে অনুমোদিত হয়েছে এবং প্রযোজ্য billing charge কাটা হয়েছে।');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${app.id}`);
      alert(`অনুমোদন ব্যর্থ হয়েছে: ${err.message || 'অজানা সমস্যা'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      app.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.nidOrBirthReg.includes(searchQuery);
    const matchesType = typeFilter === 'all' || app.certificateType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              ডিজিটাল রেকর্ড রুম
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              সকল প্রত্যয়ন পত্র ও লাইসেন্স
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              আপনার দাখিলকৃত ও অনুমোদিত সকল সনদের বিস্তারিত তালিকা ও প্রিন্ট কপি
            </p>
          </div>

          <button
            onClick={() => onNavigate('apply')}
            className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন আবেদন করুন</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আবেদনকারীর নাম, এনআইডি অথবা ট্র্যাকিং আইডি দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">সনদের ধরণ: সকল</option>
              {(Object.keys(CERTIFICATE_CATALOG) as CertificateType[]).map(t => (
                <option key={t} value={t}>{CERTIFICATE_CATALOG[t].titleBn}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Grid / Table */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">ডাটা লোড হচ্ছে...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">কোনো সনদপত্র পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">আপনার অনুসন্ধানের সাথে কোনো রেকর্ড মিলছে না অথবা কোনো আবেদন জমা দেওয়া হয়নি।</p>
            <button
              onClick={() => onNavigate('apply')}
              className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              নতুন আবেদন করুন &rarr;
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">ট্র্যাকিং আইডি</th>
                  <th className="py-3 px-3">সনদের নাম</th>
                  <th className="py-3 px-3">আবেদনকারীর নাম</th>
                  <th className="py-3 px-3">এনআইডি/জন্মনিবন্ধন</th>
                  <th className="py-3 px-3">গ্রাম ও ওয়ার্ড</th>
                  <th className="py-3 px-3">ইস্যুর তারিখ</th>
                  <th className="py-3 px-3">অবস্থা</th>
                  <th className="py-3 px-3 text-right">সনদ ডাউনলোড</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      {app.trackingId}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block">{app.certificateTitleBn}</span>
                      <span className="text-[10px] text-slate-400">ফি: {formatCurrencyBn(app.fee)}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {app.applicantNameBn}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {app.nidOrBirthReg}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {app.village}, ওয়ার্ড: {toBengaliNumber(app.wardNo)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatBengaliDate(app.approvedAt || app.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 ${
                        app.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {app.status === 'Approved'
                          ? 'অনুমোদিত'
                          : app.status === 'Pending'
                            ? 'অপেক্ষমাণ'
                            : 'বাতিল'}
                      </span>

                        {(isAdmin || isOperator) && (
                          <button
                            onClick={() => setEditingApp(app)}
                            disabled={processingId === app.id}
                            className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-2 py-1 rounded-lg text-[10px] transition inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            title="আবেদনের তথ্য সংশোধন করুন"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-700" />
                            <span>এডিট</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {app.status === 'Approved' && isStaff && (
                          <button
                            onClick={() => onViewCertificate(app)}
                            className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-1.5 rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                            title="অনুমোদিত সনদ প্রিন্ট / PDF করুন"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>প্রিন্ট</span>
                          </button>
                        )}

                        {app.status === 'Pending' && isOperator && (
                          <button
                            onClick={() => handleApproveApplication(app)}
                            disabled={processingId === app.id}
                            className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-1.5 rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            title="সনদ অনুমোদন করলে উদ্যোক্তার billing নিয়ম অনুযায়ী প্রযোজ্য চার্জ কাটা হবে"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>{processingId === app.id ? 'প্রসেসিং...' : 'Approve + Charge'}</span>
                          </button>
                        )}

                        {app.status === 'Approved' && isStaff && (
                          <button
                            onClick={() => onViewCertificate(app, { isDuplicate: true })}
                            className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-1.5 rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                            title="সনদের অনুলিপি প্রস্তুত করুন"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-700" />
                            <span>অনুলিপি</span>
                          </button>
                        )}

                        {!isAdmin && !isOperator && app.status === 'Pending' && (
                          <span className="text-[10px] text-amber-700 font-semibold">
                            উদ্যোক্তার অনুমোদনের অপেক্ষায়
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Certificate Modal */}
      {editingApp && (
        <EditCertificateModal
          application={editingApp}
          onClose={() => setEditingApp(null)}
          onSaveSuccess={(updated) => {
            setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
            setEditingApp(null);
          }}
          onViewCertificate={(updated) => {
            setEditingApp(null);
            onViewCertificate(updated);
          }}
        />
      )}
    </div>
  );
};
