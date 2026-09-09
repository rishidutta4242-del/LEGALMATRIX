import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DemoBanner } from './components/DemoBanner';
import { DashboardView } from './components/DashboardView';
import { NewInspectionView } from './components/NewInspectionView';
import { BulkIntakeView } from './components/BulkIntakeView';
import { ComplianceResultView } from './components/ComplianceResultView';
import { EvidenceViewer } from './components/EvidenceViewer';
import { InspectionHistoryView } from './components/InspectionHistoryView';
import { PDFReportViewer } from './components/PDFReportViewer';
import { RuleRepositoryView } from './components/RuleRepositoryView';
import { SettingsView } from './components/SettingsView';
import { CertificateRegistryView } from './components/CertificateRegistryView';
import { PublicVerificationView } from './components/PublicVerificationView';
import { LoginView } from './components/LoginView';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView, notification, isAuthenticated } = useApp();

  const [publicVerifyId, setPublicVerifyId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      const id = path.replace('/verify/', '').trim();
      return id || null;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify')) {
      return params.get('verify')!.trim();
    }
    if (window.location.hash.startsWith('#verify/')) {
      return window.location.hash.replace('#verify/', '').trim();
    }
    return null;
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/verify/')) {
        const id = path.replace('/verify/', '').trim();
        setPublicVerifyId(id || null);
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verify')) {
          setPublicVerifyId(params.get('verify')!.trim());
        }
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Public QR Code Verification View (No Authentication Required)
  if (publicVerifyId) {
    return (
      <PublicVerificationView
        certificateId={publicVerifyId}
        onExit={() => {
          setPublicVerifyId(null);
          if (window.location.pathname.startsWith('/verify/')) {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Header />
      <DemoBanner />

      <div className="flex-1 flex flex-row min-w-0">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-x-hidden min-h-[calc(100vh-8rem)]">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'new_inspection' && <NewInspectionView />}
          {activeView === 'bulk_intake' && <BulkIntakeView />}
          {activeView === 'certificates' && <CertificateRegistryView />}
          {activeView === 'compliance_results' && <ComplianceResultView />}
          {activeView === 'evidence_viewer' && <EvidenceViewer />}
          {activeView === 'inspections' && <InspectionHistoryView />}
          {activeView === 'reports' && <PDFReportViewer />}
          {activeView === 'rules' && <RuleRepositoryView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Toast Notification Container */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : notification.type === 'error'
                ? 'bg-red-900 text-red-100 border-red-700'
                : 'bg-blue-900 text-blue-100 border-blue-700'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
            {notification.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
