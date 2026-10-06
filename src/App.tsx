import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UnionSettingsProvider } from './context/UnionSettingsContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CertificateApplyView } from './components/CertificateApplyView';
import { AllCertificatesView } from './components/AllCertificatesView';
import { AddBalanceView } from './components/AddBalanceView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { AdminPanel } from './components/AdminPanel';
import { CertificateVerificationView } from './components/CertificateVerificationView';
import { SettingsView } from './components/SettingsView';
import { PrintCertificateModal } from './components/PrintCertificateModal';
import { AuthModal } from './components/AuthModal';
import { testConnection } from './firebase';
import type { CertificateApplication, CertificateType } from './types';
import { setCurrentApplicationData } from './utils/currentApplication';
import { Building2 } from 'lucide-react';

function AppContent() {
  const { currentUser, loading, isAdmin, isStaff } = useAuth();
  const isPublicVerifyRoute =
    typeof window !== 'undefined' &&
    window.location.hash.startsWith('#verify');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedCertType, setSelectedCertType] = useState<CertificateType>('citizenship');
  const [selectedCertificateForPrint, setSelectedCertificateForPrint] = useState<CertificateApplication | null>(null);
  const [isPrintDuplicate, setIsPrintDuplicate] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Test connection on boot per Firebase skill guidelines
  useEffect(() => {
    testConnection();
  }, []);

  const handleNavigate = (view: string, data?: any) => {
    if (view === 'apply_form') {
      if (data?.certType) {
        setSelectedCertType(data.certType);
      }
      setCurrentView('apply');
    } else {
      setCurrentView(view);
    }
  };

  const handleViewCertificate = (app: CertificateApplication, options?: { isDuplicate?: boolean }) => {
    if (!isStaff) {
      alert('সনদ প্রিন্ট করার অনুমতি শুধু ইউনিয়ন উদ্যোক্তা বা প্রশাসকের জন্য।');
      return;
    }
    if (app.status !== 'Approved') {
      alert('আবেদনটি এখনো অনুমোদিত হয়নি। উদ্যোক্তা অনুমোদন করার পর সনদ প্রিন্ট করা যাবে।');
      return;
    }
    const unified = setCurrentApplicationData(app);
    setIsPrintDuplicate(options?.isDuplicate ?? false);
    setSelectedCertificateForPrint(unified);
  };

  // QR verification is a public route. It must bypass the login modal
  // so anyone scanning a certificate QR can verify it without signing in.
  if (isPublicVerifyRoute) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <CertificateVerificationView onViewCertificate={() => undefined} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0d5c3a] text-white flex items-center justify-center shadow-xl mb-4 border border-emerald-500 animate-pulse">
          <Building2 className="w-9 h-9 text-emerald-200" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">ই-প্রত্যয়ন পোর্টাল লোড হচ্ছে...</h2>
        <p className="text-xs text-slate-500 mt-1">১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ ডিজিটাল সেন্টার</p>
      </div>
    );
  }

  return (
    <div id="app-shell" className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-200">
      {/* Auth Modal if unauthenticated */}
      <AuthModal isOpen={!currentUser} />

      {currentUser && (
        <>
          {/* Main Top Header */}
          <Header
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar
              currentView={currentView}
              selectedCertificateType={selectedCertType}
              onNavigate={handleNavigate}
              isOpenMobile={isMobileMenuOpen}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {currentView === 'dashboard' && (
                <Dashboard 
                  onNavigate={handleNavigate} 
                  onViewCertificate={handleViewCertificate} 
                />
              )}

              {currentView === 'apply' && (
                <CertificateApplyView
                  initialType={selectedCertType}
                  onNavigate={handleNavigate}
                  onViewCertificate={handleViewCertificate}
                />
              )}

              {currentView === 'certificates' && (
                <AllCertificatesView
                  onNavigate={handleNavigate}
                  onViewCertificate={handleViewCertificate}
                />
              )}

              {currentView === 'add_balance' && (
                <AddBalanceView onNavigate={handleNavigate} />
              )}

              {currentView === 'transactions' && (
                <TransactionHistoryView onNavigate={handleNavigate} />
              )}

              {currentView === 'admin_office' && (
                isStaff ? (
                  <AdminPanel 
                    onViewCertificate={handleViewCertificate}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <Dashboard 
                    onNavigate={handleNavigate} 
                    onViewCertificate={handleViewCertificate} 
                  />
                )
              )}

              {currentView === 'verify' && (
                <CertificateVerificationView
                  onViewCertificate={handleViewCertificate}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView />
              )}
            </main>
          </div>

          {/* Printable Official Certificate Modal */}
          {selectedCertificateForPrint && (
            <PrintCertificateModal
              application={selectedCertificateForPrint}
              isDuplicate={isPrintDuplicate}
              onClose={() => {
                setSelectedCertificateForPrint(null);
                setIsPrintDuplicate(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UnionSettingsProvider>
        <AppContent />
      </UnionSettingsProvider>
    </AuthProvider>
  );
}
