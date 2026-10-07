import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { CERTIFICATE_CATALOG } from '../types';
import type { CertificateApplication, BalanceRequest, Transaction } from '../types';
import { toBengaliNumber, formatCurrencyBn, formatBengaliDate } from '../utils/bengali';
import { 
  Wallet, 
  ArrowUpRight, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  Printer, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Edit3,
  Copy,
  Users,
  Home,
  Flag,
  HeartHandshake,
  UserPlus,
  Landmark,
  Heart,
  UserCheck,
  Sprout,
  Award,
  BadgeDollarSign,
  User,
  FileEdit,
  CheckCircle,
  MapPin,
  Accessibility,
  Briefcase,
  Building,
  FileWarning,
  FileSignature
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { EditCertificateModal } from './EditCertificateModal';

Chart.register(...registerables);

interface DashboardProps {
  onNavigate: (view: string, data?: any) => void;
  onViewCertificate: (app: CertificateApplication, options?: { isDuplicate?: boolean }) => void;
}

const CERTIFICATE_ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Home,
  ShieldCheck,
  FileText,
  Flag,
  HeartHandshake,
  UserPlus,
  Landmark,
  Heart,
  UserCheck,
  Sprout,
  Award,
  BadgeDollarSign,
  User,
  FileEdit,
  CheckCircle,
  MapPin,
  Accessibility,
  Copy,
  Briefcase,
  Building,
  FileWarning,
  FileSignature
};

const HOME_CERTIFICATES = Object.values(CERTIFICATE_CATALOG).filter((certificate, index, all) => {
  return all.findIndex(item => item.titleBn === certificate.titleBn) === index;
});

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onViewCertificate }) => {
  const { currentUser, userProfile, isAdmin, isStaff } = useAuth();

  const [applications, setApplications] = useState<CertificateApplication[]>([]);
  const [balanceRequests, setBalanceRequests] = useState<BalanceRequest[]>([]);
  const [lastTopup, setLastTopup] = useState<{ amount: number; date: string } | null>(null);
  const [editingApp, setEditingApp] = useState<CertificateApplication | null>(null);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch applications & top-ups
  useEffect(() => {
    if (!currentUser) return;

    // Applications query
    // Primary admin can view all applications; citizens and operators only see their own records.
    const appQuery = isAdmin
      ? collection(db, 'applications')
      : query(collection(db, 'applications'), where('userId', '==', currentUser.uid));

    const unsubApps = onSnapshot(appQuery, (snapshot) => {
      const list: CertificateApplication[] = [];
      snapshot.forEach(docSnap => list.push(docSnap.data() as CertificateApplication));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setApplications(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'applications');
    });

    let unsubTopups: (() => void) | null = null;

    if (!isStaff) {
      const topupQuery = query(
        collection(db, 'balance_requests'),
        where('userId', '==', currentUser.uid)
      );

      unsubTopups = onSnapshot(topupQuery, (snapshot) => {
        const list: BalanceRequest[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as BalanceRequest));
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setBalanceRequests(list);

        const approved = list.find(r => r.status === 'Approved');
        setLastTopup(
          approved
            ? { amount: approved.amount, date: approved.reviewedAt || approved.requestedAt }
            : null
        );
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'balance_requests');
      });
    } else {
      setBalanceRequests([]);
      setLastTopup(null);
    }

    return () => {
      unsubApps();
      if (unsubTopups) unsubTopups();
    };
  }, [currentUser, isStaff]);

  // Render Monthly Analytics Bar Chart using Chart.js
  useEffect(() => {
    if (!chartRef.current) return;

    // Cleanup previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    // Compute monthly frequency
    const currentYear = new Date().getFullYear();
    const appCounts = new Array(12).fill(0);
    const feeTotals = new Array(12).fill(0);

    // Real statistics based on actual applications
    applications.forEach(app => {
      const d = new Date(app.createdAt);
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth();
        appCounts[m] += 1;
        feeTotals[m] += (app.fee || 2);
      }
    });

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months.slice(0, 7), // Showing past & current months
        datasets: [
          {
            label: 'জমাকৃত আবেদন সংখ্যা (Applications)',
            data: appCounts.slice(0, 7),
            backgroundColor: '#0d5c3a',
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: 'পরিশোধিত সরকারি ফি (টাকায়)',
            data: feeTotals.slice(0, 7),
            backgroundColor: '#f59e0b',
            borderRadius: 6,
            barPercentage: 0.6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Tiro Bangla', serif",
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${toBengaliNumber(context.raw as number)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 2,
              callback: function(value) {
                return toBengaliNumber(value as number);
              }
            },
            grid: {
              color: '#f1f5f9'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [applications]);

  const totalBalance = userProfile?.balance ?? 0;
  const approvedCount = applications.filter(a => a.status === 'Approved').length;
  const pendingCount = applications.filter(a => a.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Home certificate service grid — mirrors the main certificate selection page */}
      <section className="rounded-2xl bg-transparent">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4 px-1">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              সকল সনদ সেবা
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              প্রয়োজনীয় সনদ নির্বাচন করে সরাসরি আবেদন শুরু করুন
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            {HOME_CERTIFICATES.length} ধরনের সেবা
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {HOME_CERTIFICATES.map((certificate) => {
            const Icon = CERTIFICATE_ICON_MAP[certificate.iconName] || FileText;

            return (
              <button
                key={certificate.type}
                type="button"
                onClick={() => onNavigate('apply_form', { certType: certificate.type })}
                className="group min-h-[132px] rounded-xl bg-[#173f68] hover:bg-[#123556] text-white px-4 py-5 shadow-[0_8px_18px_rgba(15,23,42,0.14)] border border-[#28527d] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 flex flex-col items-center justify-center text-center"
              >
                <span className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                </span>
                <span className="text-sm sm:text-[15px] font-bold leading-snug font-bangla">
                  {certificate.titleBn}
                </span>
                <span className="mt-1 text-[10px] text-blue-100/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  আবেদন করুন
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Required Stat Cards: Total Balance & Last Top-up + Application Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: Total Balance (Crucial Prompt Requirement) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
              মোট ওয়ালেট ব্যালেন্স (Total Balance)
            </span>
            <div className="text-2xl font-extrabold text-emerald-800">
              {formatCurrencyBn(totalBalance)}
            </div>
            <span className={`text-[11px] font-semibold mt-1 inline-block ${
              totalBalance >= 2 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {totalBalance >= 2 ? '● পর্যাপ্ত ব্যালেন্স আছে' : '⚠ পর্যাপ্ত ব্যালেন্স নেই'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Stat Card 2: Last Top-up (Crucial Prompt Requirement) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
              সর্বশেষ রিচার্জ (Last Top-up)
            </span>
            <div className="text-2xl font-extrabold text-slate-800">
              {lastTopup ? formatCurrencyBn(lastTopup.amount) : '৳ ০.০০'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {lastTopup ? formatBengaliDate(lastTopup.date) : 'কোনো রিচার্জ নেই'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Stat Card 3: Total Applied */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
              মোট জমাকৃত আবেদন
            </span>
            <div className="text-2xl font-extrabold text-blue-900">
              {toBengaliNumber(applications.length)} টি
            </div>
            <span className="text-[11px] text-blue-600 mt-1 block">
              MySonod পোর্টালের মাধ্যমে
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Stat Card 4: Approved Certificates */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
              অনুমোদিত সনদপত্র
            </span>
            <div className="text-2xl font-extrabold text-emerald-800">
              {toBengaliNumber(approvedCount)} টি
            </div>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              প্রিন্ট ও ডাউনলোডের জন্য প্রস্তুত
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Monthly Analytics Bar Chart (Chart.js - Prompt Requirement) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              <span>মাসিক আবেদন ও সরকারি ফি এনালিটিক্স (Monthly Analytics Bar Chart)</span>
            </h3>
            <p className="text-xs text-slate-500">
              মাসভিত্তিক প্রত্যয়ন পত্র আবেদন সংখ্যা ও পরিশোধিত ফি
            </p>
          </div>

          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
            বছর: {toBengaliNumber(new Date().getFullYear())}
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <canvas ref={chartRef} />
        </div>
      </div>



      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              সাম্প্রতিক প্রত্যয়ন আবেদনসমূহ
            </h3>
            <p className="text-xs text-slate-500">
              আপনার দাখিলকৃত সনদ আবেদনের সর্বশেষ অগ্রগতি ও প্রিন্ট অপশন
            </p>
          </div>

          <button
            onClick={() => onNavigate('certificates')}
            className="cursor-pointer text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>সবগুলো দেখুন ({toBengaliNumber(applications.length)})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">কোনো সনদ আবেদন পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">নাগরিকত্ব, চারিত্রিক, ওয়ারিশ বা আয়ের সনদের জন্য আবেদন করুন।</p>
            <button
              onClick={() => onNavigate('apply')}
              className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              প্রথম আবেদন শুরু করুন &rarr;
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ট্র্যাকিং আইডি</th>
                  <th className="py-2.5 px-3">সনদের নাম</th>
                  <th className="py-2.5 px-3">আবেদনকারী</th>
                  <th className="py-2.5 px-3">ফি</th>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">অবস্থা</th>
                  <th className="py-2.5 px-3 text-right">সনদ ডাউনলোড</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      {app.trackingId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {app.certificateTitleBn}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {app.applicantNameBn}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {formatCurrencyBn(app.fee)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatBengaliDate(app.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        app.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {app.status === 'Approved' ? 'অনুমোদিত' : app.status === 'Pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {((!isStaff && app.status === 'Pending') || (isStaff && (app.status === 'Pending' || app.status === 'Approved'))) && (
                          <>
                            <button
                              onClick={() => setEditingApp(app)}
                              className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-2 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1 shadow-2xs"
                              title="আবেদনের তথ্য সংশোধন করুন"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>তথ্য সম্পাদনা</span>
                            </button>
                            {isStaff && app.status === 'Approved' && (
                              <>
                            <button
                              onClick={() => onViewCertificate(app, { isDuplicate: true })}
                              className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Copy className="w-3.5 h-3.5 text-amber-700" />
                              <span>অনুলিপি</span>
                            </button>
                            <button
                              onClick={() => onViewCertificate(app)}
                              className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>প্রিন্ট</span>
                            </button>
                              </>
                            )}
                          </>
                        )}
                        {!isStaff && app.status === 'Pending' && (
                          <span className="text-[10px] text-amber-700 font-semibold">উদ্যোক্তার অনুমোদনের অপেক্ষায়</span>
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
