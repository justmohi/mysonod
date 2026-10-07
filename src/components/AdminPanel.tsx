import React, { useState, useEffect } from 'react';
import { useAuth, PRIMARY_ADMIN_EMAIL } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, createOperatorAuthAccount } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  setDoc, 
  runTransaction,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import type { BalanceRequest, CertificateApplication, Transaction } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate } from '../utils/bengali';
import { cleanDataForFirestore } from '../utils/firestore';
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Wallet, 
  UserCheck, 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  CheckCheck,
  Edit3,
  Building2
} from 'lucide-react';
import { EditCertificateModal } from './EditCertificateModal';
import { UnionSettingsManager } from './UnionSettingsManager';
import { applyOperatorCompletionChargeInTransaction } from '../utils/operatorBilling';
import { buildCitizenProfile, createCitizenProfileId } from '../utils/citizenProfile';

interface AdminPanelProps {
  onViewCertificate: (app: CertificateApplication) => void;
  onNavigate: (view: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onViewCertificate, onNavigate }) => {
  const { currentUser, userProfile, isAdmin, isOperator, isStaff, isPrimaryAdmin, toggleAdminMode } = useAuth();

  const [activeTab, setActiveTab] = useState<'balance' | 'certificates' | 'settings' | 'operators'>(isAdmin ? 'balance' : 'certificates');
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [applications, setApplications] = useState<CertificateApplication[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [editingApp, setEditingApp] = useState<CertificateApplication | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [operatorEmail, setOperatorEmail] = useState('');
  const [operatorPassword, setOperatorPassword] = useState('');
  const [creatingOperator, setCreatingOperator] = useState(false);
  const [syncingCitizenProfiles, setSyncingCitizenProfiles] = useState(false);
  const [citizenProfileSyncMessage, setCitizenProfileSyncMessage] = useState('');

  // Listen to all balance requests (Admin view)
  useEffect(() => {
    let unsubReqs: (() => void) | null = null;

    if (isAdmin) {
      unsubReqs = onSnapshot(collection(db, 'balance_requests'), (snapshot) => {
      const list: BalanceRequest[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as BalanceRequest);
      });
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setBalanceRequests(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'balance_requests');
      });
    }

    // Primary admin and union operators can manage the shared citizen application queue.
    // Operators must be able to review applications submitted from any citizen account.
    const applicationsQuery = collection(db, 'applications');
    
    const unsubApps = onSnapshot(applicationsQuery, (snapshot) => {
      const list: CertificateApplication[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as CertificateApplication);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setApplications(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'applications');
    });

    return () => {
      if (unsubReqs) unsubReqs();
      unsubApps();
    };
  }, [isAdmin, isOperator, currentUser]);

  // One-time backfill for older applications created before shared citizen profiles.
  // Only sanitized identity/address fields are copied; operator/certificate metadata
  // never enters citizen_profiles.
  const handleSyncCitizenProfiles = async () => {
    if (!isAdmin || syncingCitizenProfiles) return;

    setSyncingCitizenProfiles(true);
    setCitizenProfileSyncMessage('');

    try {
      const snapshot = await getDocs(collection(db, 'applications'));
      const latestByProfileId = new Map<string, { app: CertificateApplication; profileId: string }>();

      await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const app = docSnap.data() as CertificateApplication;
          const profileId = await createCitizenProfileId(app.nidOrBirthReg);
          if (!profileId) return;

          const previous = latestByProfileId.get(profileId);
          if (!previous || new Date(app.createdAt || 0).getTime() >= new Date(previous.app.createdAt || 0).getTime()) {
            latestByProfileId.set(profileId, { app, profileId });
          }
        })
      );

      const entries = Array.from(latestByProfileId.values());
      for (let i = 0; i < entries.length; i += 400) {
        const batch = writeBatch(db);
        entries.slice(i, i + 400).forEach(({ app, profileId }) => {
          const profileRef = doc(db, 'citizen_profiles', profileId);
          batch.set(
            profileRef,
            cleanDataForFirestore(
              buildCitizenProfile(app, profileId, new Date().toISOString())
            ),
            { merge: true }
          );
        });
        await batch.commit();
      }

      setCitizenProfileSyncMessage(
        'পুরনো ' + toBengaliNumber(entries.length) + ' জন নাগরিকের shared profile প্রস্তুত হয়েছে। এখন একই NID অন্য উদ্যোক্তার account থেকেও নিরাপদভাবে auto-fill হবে.'
      );
    } catch (err: any) {
      console.error('Citizen profile migration error:', err);
      handleFirestoreError(err, OperationType.WRITE, 'citizen_profiles');
      setCitizenProfileSyncMessage(err.message || 'পুরনো নাগরিক profile sync করা যায়নি।');
    } finally {
      setSyncingCitizenProfiles(false);
    }
  };
  // Admin approves balance request -> Adds requested amount directly to user's wallet
  const handleApproveBalance = async (request: BalanceRequest) => {
    if (processingId) return;
    setProcessingId(request.id);

    try {
      const userDocRef = doc(db, 'users', request.userId);
      const reqDocRef = doc(db, 'balance_requests', request.id);
      const txId = `tx_topup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const txDocRef = doc(db, 'transactions', txId);
      const nowIso = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userDocRef);
        const currentBal = userSnap.exists() ? (Number(userSnap.data().balance) || 0) : 0;
        const newBalance = Number((currentBal + request.amount).toFixed(2));

        // 1. Update user balance
        transaction.update(userDocRef, {
          balance: newBalance,
          updatedAt: nowIso
        });

        // 2. Mark request as Approved
        transaction.update(reqDocRef, {
          status: 'Approved',
          reviewedAt: nowIso,
          reviewedBy: userProfile?.name || 'ইউনিয়ন পরিষদ এডমিন'
        });

        // 3. Record transaction log
        const topupTx: Transaction = {
          id: txId,
          userId: request.userId,
          type: 'balance_topup',
          amount: request.amount,
          balanceAfter: newBalance,
          description: `ব্যালেন্স অনুমোদন (${request.method} - TrxID: ${request.trxId})`,
          referenceId: request.trxId,
          createdAt: nowIso
        };
        transaction.set(txDocRef, cleanDataForFirestore(topupTx));
      });

      alert(`সাফল্য: ৳${toBengaliNumber(request.amount)} টাকা সফলভাবে ব্যবহারকারীর ওয়ালেটে যুক্ত করা হয়েছে!`);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `balance_requests/${request.id}`);
      alert(`অনুমোদন ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject balance request
  const handleRejectBalance = async (request: BalanceRequest) => {
    const reason = prompt('বাতিলের কারণ লিখুন (ঐচ্ছিক):', 'ভুল ট্রানজেকশন আইডি বা অপর্যাপ্ত তথ্য');
    if (reason === null) return;

    setProcessingId(request.id);
    try {
      await updateDoc(doc(db, 'balance_requests', request.id), cleanDataForFirestore({
        status: 'Rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: userProfile?.name || 'ইউনিয়ন পরিষদ এডমিন',
        rejectionReason: reason || 'বাতিল করা হয়েছে'
      }));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `balance_requests/${request.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Admin/operator approves any citizen certificate application.
  // For operators, approval applies the configured certificate billing rule atomically.
  const handleApproveApplication = async (app: CertificateApplication) => {
    if (!isAdmin && !isOperator) return;

    if (isOperator) {
      const confirmed = window.confirm(
        `সনদ অনুমোদন করলে আপনার উদ্যোক্তা billing নিয়ম অনুযায়ী প্রযোজ্য চার্জ কাটা হবে।\n\nসনদ: ${app.certificateTitleBn}\nট্র্যাকিং: ${app.trackingId}\n\nআপনি কি সনদটি অনুমোদন করতে চান?`
      );
      if (!confirmed) return;
    }

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

        let billing:
          | Awaited<ReturnType<typeof applyOperatorCompletionChargeInTransaction>>
          | null = null;

        if (isOperator && currentUser) {
          billing = await applyOperatorCompletionChargeInTransaction(
            transaction,
            currentUser.uid,
            app.id,
            app.certificateTitleBn,
            now
          );
        }

        transaction.update(appRef, cleanDataForFirestore({
          status: 'Approved',
          approvedAt: nowIso,
          completedAt: nowIso,
          completedByUid: isOperator ? currentUser?.uid : undefined,
          completedByEmail: isOperator ? (currentUser?.email || '') : undefined,
          issuingOfficer: userProfile?.name || (isOperator ? 'ইউনিয়ন উদ্যোক্তা' : 'প্রশাসক'),
          completionCharge: billing?.charge,
          completionChargeType: billing?.chargeType
        }));
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${app.id}`);
      alert(`অনুমোদন ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApplication = async (app: CertificateApplication) => {
    if (!isAdmin && !isOperator) return;
    const reason = prompt('বাতিলের কারণ লিখুন:', 'তথ্য যাচাই প্রয়োজন / অসম্পূর্ণ আবেদন');
    if (reason === null) return;
    setProcessingId(app.id);
    try {
      await updateDoc(doc(db, 'applications', app.id), cleanDataForFirestore({
        status: 'Rejected',
        rejectionReason: reason || 'আবেদন বাতিল করা হয়েছে',
        completedByUid: isOperator ? currentUser?.uid : undefined,
        completedByEmail: isOperator ? (currentUser?.email || '') : undefined,
        completedAt: new Date().toISOString(),
        issuingOfficer: userProfile?.name || (isOperator ? 'ইউনিয়ন উদ্যোক্তা' : 'প্রশাসক')
      }));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${app.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrimaryAdmin) return;
    if (!operatorName.trim() || !operatorEmail.trim() || operatorPassword.length < 6) {
      alert('উদ্যোক্তার নাম, ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।');
      return;
    }

    setCreatingOperator(true);
    try {
      const authUser = await createOperatorAuthAccount(operatorEmail, operatorPassword);
      const nowIso = new Date().toISOString();
      const profile = {
        id: authUser.uid,
        name: operatorName.trim(),
        email: operatorEmail.trim().toLowerCase(),
        phone: '',
        balance: 0,
        role: 'operator' as const,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: currentUser?.email || 'mohistudio95@gmail.com'
      };

      await setDoc(doc(db, 'users', authUser.uid), cleanDataForFirestore(profile));
      alert(`উদ্যোক্তা অ্যাকাউন্ট তৈরি হয়েছে।\\n\\nইমেইল: ${profile.email}\\nপ্রাথমিক পাসওয়ার্ড: ${operatorPassword}`);
      setOperatorName('');
      setOperatorEmail('');
      setOperatorPassword('');
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে।'
        : err?.message || 'উদ্যোক্তা অ্যাকাউন্ট তৈরি করা যায়নি।';
      alert(msg);
    } finally {
      setCreatingOperator(false);
    }
  };

  useEffect(() => {
    // Keep the removed certificate tab inaccessible in admin mode.
    if (isAdmin && activeTab === 'certificates') {
      setActiveTab('balance');
    } else if (!isAdmin && activeTab === 'balance') {
      setActiveTab('certificates');
    }
  }, [isAdmin, activeTab]);
  const pendingRequests = balanceRequests.filter(r => r.status === 'Pending');
  const filteredApps = applications.filter(a => {
    const matchesSearch = a.applicantNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.trackingId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Role Toggle Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300 flex items-center justify-center">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  অফিস ফরওয়ার্ডিং ও প্রশাসন
                </h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  ইউপি কন্ট্রোল প্যানেল
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ব্যালেন্স রিচার্জ অনুমোদন ও প্রত্যয়ন পত্র ব্যবস্থাপনা
              </p>
            </div>
          </div>

          {/* Primary-admin preview toggle; operators only see their role. */}
          <div className="flex items-center gap-2">
            {isPrimaryAdmin ? (
              <button
                onClick={toggleAdminMode}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shadow-xs bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-600"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isAdmin ? 'এডমিন মোড সক্রিয়' : 'এডমিন মোড চালু করুন'}</span>
              </button>
            ) : (
              <span className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {isOperator ? 'ইউনিয়ন উদ্যোক্তা' : 'স্টাফ'}
              </span>
            )}
          </div>
        </div>

        {isOperator && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
              <div className="text-[10px] font-semibold text-amber-700">এই মাসে সম্পন্ন</div>
              <div className="mt-1 text-lg font-black text-amber-900">
                {toBengaliNumber(userProfile?.billingMonthKey ? (userProfile.billingMonthCompletedCount || 0) : 0)} টি
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
              <div className="text-[10px] font-semibold text-emerald-700">প্রথম মাসের নিয়ম</div>
              <div className="mt-1 text-[11px] font-bold text-emerald-900">
                ১–১০০ ফ্রি • ১০১+ = ৳১
              </div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-3">
              <div className="text-[10px] font-semibold text-violet-700">পরবর্তী মাস</div>
              <div className="mt-1 text-[11px] font-bold text-violet-900">
                প্রতি নতুন সনদ = ৳২
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-6 border-b border-slate-200">
          {isAdmin && (
          <button
            onClick={() => setActiveTab('balance')}
            className={`cursor-pointer pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'balance'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>ব্যালেন্স অনুমোদন রিকোয়েস্ট</span>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {toBengaliNumber(pendingRequests.length)}
              </span>
            )}
          </button>
          )}

          {!isAdmin && (
          <button
            onClick={() => setActiveTab('certificates')}
            className={`cursor-pointer pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'certificates'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>প্রত্যয়ন আবেদন ও অনুমোদন ({toBengaliNumber(applications.length)})</span>
          </button>
          )}

          {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`cursor-pointer pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isOperator ? 'আমার ইউনিয়ন তথ্য ও সেটিংস' : 'ইউনিয়ন ও পোর্টাল সেটিংস'}</span>
          </button>
          )}

          {isPrimaryAdmin && (
            <button
              onClick={() => setActiveTab('operators')}
              className={`cursor-pointer pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'operators'
                  ? 'border-amber-600 text-amber-800 bg-amber-50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>উদ্যোক্তা অ্যাকাউন্ট</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Balance Approval Queue */}
      {isAdmin && activeTab === 'balance' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ম্যানুয়াল ব্যালেন্স রিচার্জের অপেক্ষমাণ তালিকা
              </h3>
              <p className="text-xs text-slate-500">
                নাগরিকদের প্রেরিত bKash/Nagad/Rocket TrxID যাচাই করে অনুমোদন (Approve) বাটনে চাপুন। অনুমোদন করার সাথে সাথে ইউজারের ওয়ালেটে ব্যালেন্স জমা হবে।
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
              মোট আবেদন: {toBengaliNumber(balanceRequests.length)}
            </span>
          </div>

          {balanceRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              কোনো ব্যালেন্স রিচার্জের রিকোয়েস্ট পাওয়া যায়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">তারিখ ও সময়</th>
                    <th className="py-3 px-3">নাগরিকের তথ্য</th>
                    <th className="py-3 px-3">মাধ্যম</th>
                    <th className="py-3 px-3">প্রেরক নম্বর</th>
                    <th className="py-3 px-3">টাকার পরিমাণ</th>
                    <th className="py-3 px-3">TrxID</th>
                    <th className="py-3 px-3">বর্তমান অবস্থা</th>
                    <th className="py-3 px-3 text-right">কার্যক্রম (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balanceRequests.map((req) => {
                    const isPending = req.status === 'Pending';
                    const isProcessing = processingId === req.id;
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                          {formatBengaliDate(req.requestedAt)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{req.userName}</span>
                          <span className="text-[10px] text-slate-500">{req.userEmail}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {req.method}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {req.senderNumber}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-sm text-emerald-800">
                          {formatCurrencyBn(req.amount)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 uppercase tracking-wide bg-slate-50 rounded">
                          {req.trxId}
                        </td>
                        <td className="py-3 px-3">
                          {req.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              <CheckCircle className="w-3 h-3" />
                              <span>অনুমোদিত</span>
                            </span>
                          ) : req.status === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              <Clock className="w-3 h-3" />
                              <span>অপেক্ষমাণ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              <XCircle className="w-3 h-3" />
                              <span>বাতিল</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveBalance(req)}
                                disabled={isProcessing}
                                className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                                title="ব্যবহারকারীর ওয়ালেটে ব্যালেন্স জমা করুন"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{isProcessing ? 'যোগ হচ্ছে...' : 'অনুমোদন (Approve)'}</span>
                              </button>
                              <button
                                onClick={() => handleRejectBalance(req)}
                                disabled={isProcessing}
                                className="cursor-pointer bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition"
                                title="বাতিল করুন"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {req.reviewedBy ? `যাচাইকারী: ${req.reviewedBy}` : 'সম্পন্ন'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Certificate Applications Management - operator workspace only */}
      {!isAdmin && activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম বা ট্র্যাকিং নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="all">সকল অবস্থা</option>
                <option value="Pending">অপেক্ষমাণ</option>
                <option value="Approved">অনুমোদিত</option>
                <option value="Rejected">বাতিল</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ট্র্যাকিং আইডি</th>
                  <th className="py-2.5 px-3">সনদের ধরণ</th>
                  <th className="py-2.5 px-3">আবেদনকারী</th>
                  <th className="py-2.5 px-3">গ্রাম ও ওয়ার্ড</th>
                  <th className="py-2.5 px-3">সরকারি ফি</th>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                      {app.trackingId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {app.certificateTitleBn}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800 block">{app.applicantNameBn}</span>
                      <span className="text-[10px] text-slate-500">{app.mobile}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {app.village}, ওয়ার্ড: {app.wardNo}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      {formatCurrencyBn(app.fee)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {formatBengaliDate(app.createdAt)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        app.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {app.status === 'Approved' ? 'অনুমোদিত' : app.status === 'Pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => setEditingApp(app)}
                              className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-2.5 py-1 rounded-lg text-[11px] transition inline-flex items-center gap-1"
                              title="আবেদনের সকল তথ্য সম্পাদনা করুন"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-700" />
                              <span>তথ্য সম্পাদনা</span>
                            </button>
                            <button
                              onClick={() => handleApproveApplication(app)}
                              disabled={processingId === app.id}
                              title={isOperator ? 'অনুমোদন করলে billing নিয়ম অনুযায়ী প্রযোজ্য উদ্যোক্তা চার্জ কাটা হবে' : 'সনদ অনুমোদন করুন'}
                              className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition disabled:opacity-50"
                            >
                              {processingId === app.id ? '...' : isOperator ? 'অনুমোদন • চার্জ' : 'অনুমোদন'}
                            </button>
                            <button
                              onClick={() => handleRejectApplication(app)}
                              disabled={processingId === app.id}
                              className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition disabled:opacity-50"
                            >
                              বাতিল
                            </button>
                          </>
                        )}
                        {app.status === 'Approved' && (
                          <button
                            onClick={() => setEditingApp(app)}
                            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-2 py-1 rounded-lg text-xs transition inline-flex items-center gap-1 shadow-2xs"
                            title="সনদের তথ্য সম্পাদন করুন"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-700" />
                            <span>সম্পাদন</span>
                          </button>
                        )}
                        {app.status === 'Approved' && (
                          <button
                            onClick={() => onViewCertificate(app)}
                            className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-xs transition inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>প্রিন্ট</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Union & Header Settings Management */}
      {isAdmin && activeTab === 'settings' && (
        <UnionSettingsManager />
      )}

      {/* Primary-admin-only operator account management */}
      {isPrimaryAdmin && activeTab === 'operators' && (
        <div className="max-w-2xl bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            নতুন ইউনিয়ন উদ্যোক্তা অ্যাকাউন্ট
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            শুধু {PRIMARY_ADMIN_EMAIL} অ্যাকাউন্ট থেকেই উদ্যোক্তার লগইন তৈরি করা যাবে।
          </p>

          <form onSubmit={handleCreateOperator} className="mt-5 space-y-4">
            <input
              required
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              placeholder="উদ্যোক্তার পূর্ণ নাম"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              required
              type="email"
              value={operatorEmail}
              onChange={e => setOperatorEmail(e.target.value)}
              placeholder="উদ্যোক্তার ইমেইল"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              required
              minLength={6}
              type="password"
              value={operatorPassword}
              onChange={e => setOperatorPassword(e.target.value)}
              placeholder="প্রাথমিক পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={creatingOperator}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {creatingOperator ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'উদ্যোক্তা অ্যাকাউন্ট তৈরি করুন'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-bold text-blue-900">পুরনো সনদ থেকে NID Profile Sync</div>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              এই একবার চালালে আগের আবেদনের শুধু নাগরিকের ব্যক্তিগত/ঠিকানার তথ্য আলাদা shared profile-এ সংরক্ষিত হবে।
              কোনো উদ্যোক্তার account, tracking, billing বা union তথ্য অন্য উদ্যোক্তার কাছে যাবে না।
            </p>
            <button
              type="button"
              onClick={handleSyncCitizenProfiles}
              disabled={syncingCitizenProfiles}
              className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncingCitizenProfiles ? 'Profile Sync হচ্ছে...' : 'পুরনো NID Profile Sync করুন'}
            </button>
            {citizenProfileSyncMessage && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-blue-900">
                {citizenProfileSyncMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Certificate Modal for Admin */}
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
