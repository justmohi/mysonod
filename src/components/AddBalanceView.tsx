import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  orderBy 
} from 'firebase/firestore';
import type { BalanceRequest } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate } from '../utils/bengali';
import { cleanDataForFirestore } from '../utils/firestore';
import { 
  Wallet, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface AddBalanceViewProps {
  onNavigate: (view: string) => void;
}

export const AddBalanceView: React.FC<AddBalanceViewProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, isAdmin } = useAuth();

  const [amount, setAmount] = useState<number>(50);
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<BalanceRequest[]>([]);

  // Union Digital Center Official Payment Numbers
  const PAYMENT_GATEWAYS = {
    bKash: {
      name: 'bKash (বিকাশ)',
      type: 'Personal / Merchant (Send Money)',
      number: '01931-379497',
      badgeColor: 'bg-pink-600 text-white',
      cardBorder: 'border-pink-200 hover:border-pink-500',
      instruction: 'বিকাশ অ্যাপ থেকে "Send Money" অপশনে গিয়ে নিচের নম্বরে টাকা পাঠান এবং প্রাপ্ত TrxID নিচে লিখুন।'
    },
    Nagad: {
      name: 'Nagad (নগদ)',
      type: 'Merchant / Personal (Send Money)',
      number: '01931-379497',
      badgeColor: 'bg-orange-600 text-white',
      cardBorder: 'border-orange-200 hover:border-orange-500',
      instruction: 'নগদ অ্যাপ অথবা *167# ডায়াল করে "Send Money" করুন এবং ফিরতি মেসেজের ট্রানজেকশন আইডি দিন।'
    },
    Rocket: {
      name: 'Rocket (রকেট)',
      type: 'Personal (Send Money)',
      number: '01931-379497',
      badgeColor: 'bg-purple-600 text-white',
      cardBorder: 'border-purple-200 hover:border-purple-500',
      instruction: 'রকেট একাউন্ট থেকে "Send Money" করুন এবং ট্রানজেকশন আইডি ও মোবাইল নম্বর প্রদান করুন।'
    }
  };

  // Listen to user's balance requests in Firestore
  useEffect(() => {
    if (!currentUser) return;
    const reqsRef = collection(db, 'balance_requests');
    const q = query(
      reqsRef, 
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: BalanceRequest[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as BalanceRequest);
      });
      // Sort in-memory to prevent complex composite index requirements
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setMyRequests(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'balance_requests');
    });

    return () => unsubscribe();
  }, [currentUser]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/[^0-9]/g, ''));
    setCopiedNumber(text);
    setTimeout(() => setCopiedNumber(null), 2000);
  };


  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    if (!amount || amount < 2) {
      setErrorMsg('সর্বনিম্ন রিচার্জ পরিমাণ ২/- টাকা।');
      return;
    }
    if (!senderNumber.trim()) {
      setErrorMsg('প্রেরক মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('পেমেন্ট ট্রানজেকশন আইডি (TrxID) প্রদান করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newReq: BalanceRequest = {
        id: requestId,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile.name,
        amount: Number(amount),
        method,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
        status: 'Pending',
        requestedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'balance_requests', requestId), cleanDataForFirestore(newReq));
      setSuccessMsg('আপনার ব্যালেন্স রিচার্জের আবেদন সফলভাবে জমা হয়েছে! ইউনিয়ন পরিষদ এডমিন যাচাই করে দ্রুত অনুমোদন করবেন।');
      setSenderNumber('');
      setTrxId('');
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'balance_requests');
      setErrorMsg('অনুরোধ সাবমিট করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              ডিজিটাল সেন্টার ওয়ালেট সার্ভিস
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              এড ব্যালেন্স (ম্যানুয়াল পেমেন্ট রিচার্জ)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              বিকাশ, নগদ বা রকেটের মাধ্যমে টাকা পাঠিয়ে আপনার ওয়ালেট ব্যালেন্স রিচার্জ করুন
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ৳
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                বর্তমান ব্যালেন্স
              </span>
              <span className="text-xl font-extrabold text-emerald-800">
                {formatCurrencyBn(userProfile?.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Notice for Admin / User Toggle */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>এডমিন অনুমোদন ডেমো:</strong> রিকোয়েস্ট সাবমিট করার পর উপরে মোড পরিবর্তন করে <strong>"ইউপি প্রশাসক (Admin)"</strong> বাটনে ক্লিক করে <strong>অফিস ফরওয়ার্ডিং</strong> পেজে গিয়ে ১-ক্লিকে অনুমোদন (Approve) করতে পারেন!
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin_office')}
              className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0"
            >
              এডমিন প্যানেলে যান &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Payment Gateway Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['bKash', 'Nagad', 'Rocket'] as const).map((gKey) => {
          const gw = PAYMENT_GATEWAYS[gKey];
          const isSelected = method === gKey;
          return (
            <div
              key={gKey}
              onClick={() => setMethod(gKey)}
              className={`cursor-pointer bg-white rounded-2xl p-5 border-2 transition relative ${
                isSelected 
                  ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20' 
                  : `${gw.cardBorder} hover:shadow-xs`
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${gw.badgeColor}`}>
                  {gw.name}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
              </div>

              <div className="text-xs text-slate-500 mb-1">{gw.type}</div>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-mono font-bold text-sm text-slate-800 tracking-wider">
                  {gw.number}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(gw.number);
                  }}
                  className="cursor-pointer p-1 text-slate-500 hover:text-emerald-700 rounded"
                  title="নম্বর কপি করুন"
                >
                  {copiedNumber === gw.number ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                {gw.instruction}
              </p>
            </div>
          );
        })}
      </div>

      {/* Top-up Form */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          পেমেন্টের তথ্য সাবমিট করুন ({PAYMENT_GATEWAYS[method].name})
        </h3>

        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-0.5">আবেদন সফল!</p>
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-0.5">ত্রুটি!</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              রিচার্জের পরিমাণ (টাকা) *
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {[10, 20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`cursor-pointer py-1.5 rounded-lg text-xs font-bold transition border ${
                    amount === val 
                      ? 'bg-emerald-700 text-white border-emerald-700' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ৳{toBengaliNumber(val)}
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              min={2}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="টাকার পরিমাণ লিখুন"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রেরক মোবাইল নম্বর (Sender Mobile Number) *
              </label>
              <input
                type="tel"
                required
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="যেমন: 01712345678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ট্রানজেকশন আইডি (TrxID) *
              </label>
              <input
                type="text"
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="যেমন: 9K3L4M5N6P"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full py-3 bg-[#0d5c3a] hover:bg-[#073622] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>ব্যালেন্স রিচার্জের আবেদন জমা দিন</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* User's Previous Top-Up Requests Status Table */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" />
          <span>আপনার পূর্ববর্তী রিচার্জ আবেদনের তালিকা</span>
        </h3>

        {myRequests.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            এখনও কোনো রিচার্জের আবেদন করা হয়নি।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">মাধ্যম</th>
                  <th className="py-2.5 px-3">টাকার পরিমাণ</th>
                  <th className="py-2.5 px-3">প্রেরক নম্বর</th>
                  <th className="py-2.5 px-3">TrxID</th>
                  <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {formatBengaliDate(req.requestedAt)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {req.method}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800">
                      {formatCurrencyBn(req.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {req.senderNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 uppercase">
                      {req.trxId}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {req.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>অনুমোদিত</span>
                        </span>
                      ) : req.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                          <Clock className="w-3 h-3" />
                          <span>অপেক্ষমাণ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>বাতিল</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
