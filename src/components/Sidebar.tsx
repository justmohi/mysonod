import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart3,
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Files, 
  WalletCards, 
  ReceiptText, 
  Building, 
  CheckCircle2, 
  Settings, 
  X,
  ShieldCheck,
  Award,
  Users,
  Home,
  HeartHandshake,
  BadgeDollarSign,
  Briefcase,
  HelpCircle,
  Search
} from 'lucide-react';
import { CERTIFICATE_CATALOG, type CertificateType } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  selectedCertificateType?: CertificateType | null;
  onNavigate: (view: string, data?: any) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedCertificateType,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { isStaff, isOperator } = useAuth();
  const [isApplyMenuOpen, setIsApplyMenuOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const handleCertificateClick = (type: CertificateType) => {
    onNavigate('apply_form', { certType: type });
    onCloseMobile();
  };

  const certificateIconMap: Partial<Record<CertificateType, React.ReactNode>> = {
    citizenship: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    character: <Award className="w-4 h-4 text-amber-400" />,
    inheritance: <Users className="w-4 h-4 text-blue-400" />,
    family: <Home className="w-4 h-4 text-purple-400" />,
    non_remarriage: <HeartHandshake className="w-4 h-4 text-rose-400" />,
    income: <BadgeDollarSign className="w-4 h-4 text-lime-400" />,
    annual_income: <BadgeDollarSign className="w-4 h-4 text-lime-400" />,
    trade_license: <Briefcase className="w-4 h-4 text-cyan-400" />
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-[276px] bg-gradient-to-b from-[#073b2b] via-[#09432f] to-[#062d22] text-slate-100 flex flex-col shadow-2xl shadow-emerald-950/20 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-20
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Control */}
        <button
          onClick={onCloseMobile}
          className="md:hidden absolute top-3 right-3 z-10 p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-lg transition"
          aria-label="সাইডবার বন্ধ করুন"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-white p-1 shadow-md shadow-black/10">
              <img src="/mysonod-logo.webp" alt="MySonod" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold tracking-wide text-white">MySonod</div>
              <div className="text-[10px] font-medium tracking-wider text-emerald-200/75">DIGITAL SERVICE PORTAL</div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto pt-4 pb-4 px-3 space-y-1.5 text-sm md:pt-4">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/60">মূল মেনু</div>
          {/* Certificate application statistics — separate page above Dashboard */}
          <button
            onClick={() => { onNavigate('certificate_stats'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
              currentView === 'certificate_stats'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>সনদ আবেদন পরিসংখ্যান</span>
          </button>

          {/* Dashboard */}
          <button
            onClick={() => { onNavigate('dashboard'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${ 
              currentView === 'dashboard'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-300" />
            <span>ড্যাশবোর্ড (Dashboard)</span>
          </button>

          {/* Certificate Application: citizens only.
              Staff (Admin/Operator) manage applications from Dashboard / Office Panel. */}
          {!isStaff && (
            <div>
              {/* Certificate Application Dropdown */}
              <button
                onClick={() => setIsApplyMenuOpen(!isApplyMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 font-medium cursor-pointer ${
                  currentView === 'apply' || currentView === 'apply_form'
                    ? 'bg-emerald-800/70 text-white'
                    : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <span>প্রত্যয়ন আবেদন (Apply)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                    {new Set(Object.values(CERTIFICATE_CATALOG).map(cert => cert.titleBn)).size}টি
                  </span>
                  {isApplyMenuOpen ? (
                    <ChevronDown className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-emerald-400/60" />
                  )}
                </div>
              </button>

              {/* Dropdown Menu for all certificate types */}
              {isApplyMenuOpen && (
                <div className="mt-2 ml-2 pl-2 border-l border-emerald-500/30 space-y-1">
                  {/* Quick Search */}
                  <div className="relative my-1 px-1">
                    <Search className="w-3 h-3 text-emerald-400/70 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      placeholder="সনদ খুঁজুন..."
                      className="w-full pl-7 pr-2 py-1 text-[11px] bg-emerald-950/60 border border-emerald-800 rounded-md text-emerald-100 placeholder:text-emerald-400/50 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto pr-1 space-y-0.5">
                    {(Object.keys(CERTIFICATE_CATALOG) as CertificateType[])
                      .filter((type) => {
                        if (!sidebarSearch.trim()) return true;
                        const c = CERTIFICATE_CATALOG[type];
                        return c.titleBn.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
                               c.titleEn.toLowerCase().includes(sidebarSearch.toLowerCase());
                      })
                      .filter((type, index, list) => {
                        const c = CERTIFICATE_CATALOG[type];
                        return list.findIndex((candidate) => {
                          const candidateCert = CERTIFICATE_CATALOG[candidate];
                          return candidateCert.titleBn === c.titleBn &&
                                 candidateCert.titleEn === c.titleEn;
                        }) === index;
                      })
                      .map((type) => {
                        const cert = CERTIFICATE_CATALOG[type];
                        const isSelected = currentView === 'apply' && selectedCertificateType === type;
                        return (
                          <button
                            key={type}
                            onClick={() => handleCertificateClick(type)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                                : 'text-emerald-100/80 hover:bg-emerald-800/70 hover:text-white'
                            }`}
                          >
                            <span className="shrink-0">{certificateIconMap[type] || <FileText className="w-3.5 h-3.5 text-emerald-300" />}</span>
                            <span className="truncate">{cert.titleBn}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/60">সেবা ও হিসাব</div>
          {/* All Certificates */}
          <button
            onClick={() => { onNavigate('certificates'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
              currentView === 'certificates'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Files className="w-4 h-4 text-emerald-300" />
            <span>{isStaff ? 'প্রত্যয়ন আবেদন ও অনুমোদন' : 'সকল প্রত্যয়ন পত্র (All Certificates)'}</span>
          </button>

          {/* Add Balance */}
          <button
            onClick={() => { onNavigate('add_balance'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
              currentView === 'add_balance'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <WalletCards className="w-4 h-4 text-emerald-300" />
            <span>এড ব্যালেন্স (Add Balance)</span>
          </button>

          {/* Transaction History */}
          <button
            onClick={() => { onNavigate('transactions'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
              currentView === 'transactions'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <ReceiptText className="w-4 h-4 text-emerald-300" />
            <span>লেনদেন হিস্ট্রি (Transactions)</span>
          </button>

          {/* My Union Information */}
          {isOperator && (
            <button
              onClick={() => { onNavigate('settings'); onCloseMobile(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                  : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4 text-amber-300" />
              <span>আমার ইউনিয়নের তথ্যসমূহ</span>
            </button>
          )}

          {/* Office administration is for admin-only balance/settings/operator tasks.
              Certificate approvals are handled directly from the certificate queue. */}
          {isStaff && !isOperator && (
            <button
              onClick={() => { onNavigate('admin_office'); onCloseMobile(); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
                currentView === 'admin_office'
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/40'
                  : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-amber-400" />
                <span>অফিস ও ব্যালেন্স প্রশাসন</span>
              </div>
              <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded">
                Admin
              </span>
            </button>
          )}

          <div className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/60">অন্যান্য</div>
          {/* Certificate Public Verification */}
          <button
            onClick={() => { onNavigate('verify'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
              currentView === 'verify'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>সনদ যাচাই (Verify)</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => { onNavigate('settings'); onCloseMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition font-medium cursor-pointer ${
              currentView === 'settings'
                ? 'bg-white text-[#07563a] font-bold shadow-lg shadow-black/10 border-l-[3px] border-emerald-300'
                : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-300" />
            <span>সেটিংস ও প্রোফাইল (Settings)</span>
          </button>
        </div>

        {/* Footer Support Box */}
        <div className="p-3 m-3 bg-white/[0.06] rounded-2xl border border-white/10 text-xs shadow-inner">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>MySonod সহায়তা</span>
          </div>
          <p className="text-emerald-200/90 text-[11px] leading-relaxed">
            Portal-এর যেকোনো সমস্যার জন্য কল করুন: <span className="font-bold text-white">+8801931-379497</span>
          </p>
        </div>
      </aside>
    </>
  );
};
