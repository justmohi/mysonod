import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import type { Transaction } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate } from '../utils/bengali';
import { 
  ReceiptText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  Wallet, 
  Search, 
  Download,
  Filter
} from 'lucide-react';

interface TransactionHistoryViewProps {
  onNavigate: (view: string) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fee_deduction' | 'balance_topup' | 'welcome_bonus'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const txQuery = isAdmin
      ? collection(db, 'transactions')
      : query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(txQuery, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach(docSnap => list.push(docSnap.data() as Transaction));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(list);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  const filteredTx = transactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalDeducted = transactions
    .filter(t => t.type === 'fee_deduction')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalTopup = transactions
    .filter(t => t.type === 'balance_topup' || t.type === 'welcome_bonus')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              ডিজিটাল ওয়ালেট খতিয়ান
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              লেনদেন হিস্ট্রি (Transaction History)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              আবেদন ফি কর্তন ও ব্যালেন্স রিচার্জের নিখুঁত রিয়েল-টাইম হিস্ট্রি
            </p>
          </div>

          <button
            onClick={() => onNavigate('add_balance')}
            className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Wallet className="w-4 h-4" />
            <span>ব্যালেন্স এড করুন</span>
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">
              বর্তমান ব্যালেন্স
            </span>
            <span className="text-xl font-extrabold text-emerald-900">
              {formatCurrencyBn(userProfile?.balance)}
            </span>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 uppercase block">
              সর্বমোট রিচার্জ ও বোনাস
            </span>
            <span className="text-xl font-extrabold text-blue-900">
              {formatCurrencyBn(totalTopup)}
            </span>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100">
            <span className="text-[11px] font-bold text-rose-800 uppercase block">
              মোট সরকারি ফি প্রদান
            </span>
            <span className="text-xl font-extrabold text-rose-900">
              {formatCurrencyBn(totalDeducted)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিবরণ বা রেফারেন্স দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-none bg-white"
            >
              <option value="all">সকল লেনদেন</option>
              <option value="fee_deduction">ফি কর্তন (Debit)</option>
              <option value="balance_topup">রিচার্জ (Credit)</option>
              <option value="welcome_bonus">স্বাগতম বোনাস</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">লেনদেন লোড হচ্ছে...</span>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-14 text-slate-400 text-xs">
            কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">তারিখ ও সময়</th>
                  <th className="py-3 px-3">লেনদেনের ধরণ</th>
                  <th className="py-3 px-3">বিবরণ</th>
                  <th className="py-3 px-3">রেফারেন্স ট্র্যাকিং</th>
                  <th className="py-3 px-3">টাকার পরিমাণ</th>
                  <th className="py-3 px-3 text-right">অবশিষ্ট ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.map((tx) => {
                  const isDebit = tx.type === 'fee_deduction';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                        {formatBengaliDate(tx.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        {tx.type === 'fee_deduction' && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>ফি কর্তন</span>
                          </span>
                        )}
                        {tx.type === 'balance_topup' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>ব্যালেন্স রিচার্জ</span>
                          </span>
                        )}
                        {tx.type === 'welcome_bonus' && (
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <Gift className="w-3 h-3" />
                            <span>স্বাগতম বোনাস</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-600">
                        {tx.referenceId}
                      </td>
                      <td className={`py-3 px-3 font-bold text-sm ${
                        isDebit ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {isDebit ? '-' : '+'} {formatCurrencyBn(tx.amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-800">
                        {formatCurrencyBn(tx.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
