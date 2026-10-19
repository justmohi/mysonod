import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CERTIFICATE_CATALOG } from '../types';
import type { CertificateApplication } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { CalendarDays, FileText } from 'lucide-react';

export const CertificateApplicationStats: React.FC = () => {
  const { currentUser, isStaff } = useAuth();
  const [applications, setApplications] = useState<CertificateApplication[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const appQuery = isStaff
      ? collection(db, 'applications')
      : query(collection(db, 'applications'), where('userId', '==', currentUser.uid));
    return onSnapshot(appQuery, snapshot => {
      const list: CertificateApplication[] = [];
      snapshot.forEach(item => list.push(item.data() as CertificateApplication));
      setApplications(list);
    }, error => handleFirestoreError(error, OperationType.GET, 'applications'));
  }, [currentUser, isStaff]);

  const now = new Date();
  const inToday = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  };
  const inThisMonth = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth();
  };
  const todayApps = applications.filter(app => inToday(app.createdAt));
  const monthApps = applications.filter(app => inThisMonth(app.createdAt));
  const summarize = (items: CertificateApplication[]) => {
    const counts = new Map<string, number>();
    items.forEach(app => {
      const title = app.certificateTitleBn || CERTIFICATE_CATALOG[app.certificateType]?.titleBn || 'অন্যান্য সনদ';
      counts.set(title, (counts.get(title) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const renderBreakdown = (items: CertificateApplication[], tone: 'emerald' | 'blue') => {
    const counts = summarize(items);
    return <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
      {counts.length ? counts.map(([title, count]) => (
        <div key={title} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-700">{title}</span>
          <span className={`min-w-8 rounded-md px-2 py-1 text-center font-bold ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>{toBengaliNumber(count)}</span>
        </div>
      )) : <p className="text-xs text-slate-400">এখনো কোনো আবেদন জমা হয়নি।</p>}
    </div>;
  };

  return <div className="space-y-5">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">সনদ আবেদন পরিসংখ্যান</h1>
        <p className="mt-1 text-sm text-slate-500">আজ ও চলতি মাসে কোন সনদের কতটি আবেদন জমা হয়েছে</p>
        <p className="mt-1 text-xs text-emerald-700">{now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="bg-white rounded-2xl border border-emerald-100 shadow-xs p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-slate-800">আজকের আবেদন</h2><p className="text-xs text-slate-500">সর্বমোট আবেদন</p></div>
          <span className="ml-auto text-3xl font-extrabold text-emerald-700">{toBengaliNumber(todayApps.length)}</span>
        </div>
        {renderBreakdown(todayApps, 'emerald')}
      </section>
      <section className="bg-white rounded-2xl border border-blue-100 shadow-xs p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-slate-800">এই মাসের আবেদন</h2><p className="text-xs text-slate-500">সর্বমোট আবেদন</p></div>
          <span className="ml-auto text-3xl font-extrabold text-blue-700">{toBengaliNumber(monthApps.length)}</span>
        </div>
        {renderBreakdown(monthApps, 'blue')}
      </section>
    </div>
  </div>;
};
