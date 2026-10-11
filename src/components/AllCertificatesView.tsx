import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  runTransaction,
  setDoc
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copyingId, setCopyingId] = useState<string | null>(null);

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

  const handleCreateDuplicate = async (app: CertificateApplication) => {
    if (!isStaff || !currentUser || app.status !== 'Approved') return;
    const confirmed = window.confirm(
      'এই অনুমোদিত সনদের একটি অনুলিপি তালিকায় যোগ হবে। মূল সনদ অপরিবর্তিত থাকবে। চালিয়ে যাবেন?'
    );
    if (!confirmed) return;

    setCopyingId(app.id);
    try {
      const nowIso = new Date().toISOString();
      const duplicateRef = doc(collection(db, 'applications'));
      await setDoc(duplicateRef, cleanDataForFirestore({
        ...app,
        id: duplicateRef.id,
        trackingId: app.trackingId + '-COPY-' + Date.now().toString().slice(-6),
        certificateNumber: '',
        userId: currentUser.uid,
        userName: userProfile?.name || app.userName || '',
        userEmail: currentUser.email || userProfile?.email || '',
        status: 'Approved',
        isDuplicateCopy: true,
        createdAt: nowIso,
        approvedAt: nowIso,
        completedAt: nowIso,
        completedByUid: currentUser.uid,
        completedByEmail: currentUser.email || '',
        duplicateOfTrackingId: app.trackingId
      }));
      // Firestore snapshot listener adds the new record to this list automatically.
      setSelectedIds(prev => [...prev, duplicateRef.id]);
      alert('সনদের অনুলিপি তালিকায় যোগ হয়েছে।');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'applications');
      alert('অনুলিপি তৈরি করা যায়নি: ' + (err?.message || 'অজানা সমস্যা'));
    } finally {
      setCopyingId(null);
    }
  };

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredApps = applications.filter((app) => {
    const searchable = [
      app.trackingId, app.applicantNameBn, app.applicantNameEn, app.fatherName,
      app.fatherNameEn, app.spouseName, app.motherName, app.nidOrBirthReg,
      app.certificateTitleBn, app.certificateTitleEn, app.certificateNumber,
      app.mobile, app.village, app.wardNo
    ].filter(Boolean).join(' ').toLocaleLowerCase();
    const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
    const matchesType = typeFilter === 'all' || app.certificateType === typeFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  const allVisibleSelected = filteredApps.length > 0 && filteredApps.every(app => selectedIds.includes(app.id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => allVisibleSelected
      ? prev.filter(id => !filteredApps.some(app => app.id === id))
      : [...new Set([...prev, ...filteredApps.map(app => app.id)])]);
  };
  const toggleSelected = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
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
          <div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
              <option value="all">স্ট্যাটাস: সকল</option>
              <option value="Pending">অপেক্ষমাণ</option>
              <option value="Approved">অনুমোদিত</option>
              <option value="Rejected">বাতিল</option>
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
              <thead className="bg-slate-800 text-white font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3"><input aria-label="সব দৃশ্যমান আবেদন নির্বাচন" type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="accent-emerald-600" /></th>
                  <th className="py-3 px-3">সনদ নং / ট্র্যাকিং</th>
                  <th className="py-3 px-3">নাম, পিতা/স্বামী</th>
                  <th className="py-3 px-3">NID / জন্ম নিবন্ধন</th>
                  <th className="py-3 px-3">ধরন</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-emerald-50/60 transition-colors">
                    <td className="py-3 px-3"><input aria-label={app.trackingId + ' নির্বাচন'} type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelected(app.id)} className="accent-emerald-600" /></td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {app.certificateNumber || app.trackingId}
                      <span className="block text-[10px] font-normal text-slate-400">{app.trackingId}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 min-w-[150px]">
                      <span className="font-semibold block">{app.applicantNameBn || '—'}</span>
                      <span className="block text-[10px] text-slate-500">{app.fatherName ? 'পিতা: ' + app.fatherName : app.spouseName ? 'স্বামী: ' + app.spouseName : '—'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{app.nidOrBirthReg?.trim() || '—'}</td>
                    <td className="py-3 px-3 text-slate-700 min-w-[120px]">
                      <span className="block font-semibold">{app.certificateTitleBn || CERTIFICATE_CATALOG[app.certificateType]?.titleBn || 'সনদ'}</span>
                      <span className="text-[10px] text-slate-400">ফি: {formatCurrencyBn(app.fee)}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatBengaliDate(app.approvedAt || app.createdAt)}</td>
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

                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
                        {(isAdmin || isOperator) && (
                          <button
                            onClick={() => setEditingApp(app)}
                            disabled={processingId === app.id}
                            className="cursor-pointer bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-md transition inline-flex items-center justify-center disabled:opacity-50"
                            title="আবেদনের তথ্য সংশোধন করুন" aria-label="আবেদন এডিট"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {app.status === 'Approved' && isStaff && (
                          <button
                            onClick={() => onViewCertificate(app)}
                            className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-md transition inline-flex items-center justify-center"
                            title="অনুমোদিত সনদ প্রিন্ট / PDF করুন" aria-label="সনদ প্রিন্ট"
                          >
                            <Printer className="w-3.5 h-3.5" />
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
                            onClick={() => handleCreateDuplicate(app)}
                            disabled={copyingId === app.id}
                            className="cursor-pointer bg-violet-500 hover:bg-violet-600 text-white p-2 rounded-md transition inline-flex items-center justify-center disabled:opacity-50"
                            title="সনদের অনুলিপি তালিকায় যোগ করুন" aria-label="সনদের অনুলিপি"
                          >
                            <Copy className="w-3.5 h-3.5" />
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
