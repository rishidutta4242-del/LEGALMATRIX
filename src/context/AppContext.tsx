import React, { createContext, useContext, useState, useEffect } from 'react';
import { InspectionRecord, UserRole, AuthUser } from '../types/index';
import { fetchHealth, loginUser, logoutUser } from '../services/api';

export type { UserRole };

export type ViewType =
  | 'dashboard'
  | 'new_inspection'
  | 'bulk_intake'
  | 'compliance_results'
  | 'evidence_viewer'
  | 'inspections'
  | 'inspection_detail'
  | 'reports'
  | 'rules'
  | 'settings'
  | 'certificates';

const DEFAULT_OFFICER: AuthUser = {
  id: 'USR-INSP-01',
  email: 'inspector@legalmetrix.gov.in',
  name: 'Inspector Rajesh Kumar',
  role: 'Inspector',
  badge_number: 'LM-KA-INSP-402',
  jurisdiction: 'Bengaluru South Enforcement Division',
  division: 'Market Surveillance & Field Verification Cell',
  phone: '+91 98450 12345'
};

interface AppContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  currentInspection: InspectionRecord | null;
  setCurrentInspection: (inspection: InspectionRecord | null) => void;
  selectedEvidenceField: string | null;
  setSelectedEvidenceField: (field: string | null) => void;
  selectedCertificateId: string | null;
  setSelectedCertificateId: (id: string | null) => void;
  viewCertificate: (certId: string) => void;
  
  // Mobile / Tablet Responsive Navigation
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  
  // Auth & RBAC
  currentUser: AuthUser | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsAccount: (user: AuthUser, token?: string) => void;
  logout: () => void;

  officerRole: UserRole;
  setOfficerRole: (role: UserRole) => void;
  officerName: string;
  setOfficerName: (name: string) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (threshold: number) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  offlineQueueCount: number;
  setOfflineQueueCount: React.Dispatch<React.SetStateAction<number>>;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  systemStatus: {
    connected: boolean;
    geminiConnected: boolean;
    geminiModel: string;
    ruleVersion: string;
  };
  refreshSystemStatus: () => Promise<void>;
  viewInspection: (inspection: InspectionRecord, view?: ViewType) => void;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<ViewType>('dashboard');
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord | null>(null);
  const [selectedEvidenceField, setSelectedEvidenceField] = useState<string | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const setActiveView = (view: ViewType) => {
    setActiveViewState(view);
    setIsMobileSidebarOpen(false);
  };

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('lm_auth_user');
      if (stored) return JSON.parse(stored);
      // Strict PS 26034 mandate: initial route starts strictly at the Login Page
      return null;
    } catch {
      return null;
    }
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('lm_auth_token') || null;
  });

  const isAuthenticated = currentUser !== null;

  const [officerRole, setOfficerRoleState] = useState<UserRole>(currentUser?.role || 'Inspector');
  const [officerName, setOfficerNameState] = useState<string>(currentUser?.name || DEFAULT_OFFICER.name);

  // Keep officerRole & officerName strictly synced with authenticated currentUser
  const setOfficerRole = (role: UserRole) => {
    setOfficerRoleState(role);
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      try {
        localStorage.setItem('lm_auth_user', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const setOfficerName = (name: string) => {
    setOfficerNameState(name);
    if (currentUser) {
      const updated = { ...currentUser, name };
      setCurrentUser(updated);
      try {
        localStorage.setItem('lm_auth_user', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const loginAsAccount = (user: AuthUser, token: string = `token_${user.id}`) => {
    setCurrentUser(user);
    setSessionToken(token);
    setOfficerRoleState(user.role);
    setOfficerNameState(user.name);
    try {
      localStorage.setItem('lm_auth_user', JSON.stringify(user));
      localStorage.setItem('lm_auth_token', token);
    } catch (e) {}
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const result = await loginUser(email, pass);
      loginAsAccount(result.user, result.token);
      return true;
    } catch (err) {
      // Check demo password fallback
      if (pass === 'Password@123') {
        const found = [
          DEFAULT_OFFICER,
          {
            id: 'USR-DEP-01',
            email: 'deputy.controller@legalmetrix.gov.in',
            name: 'Deputy Controller Priya Sharma',
            role: 'Deputy Controller' as UserRole,
            badge_number: 'LM-DL-SUP-109',
            jurisdiction: 'Delhi NCR Metrology Directorate',
            division: 'Appeals Adjudication & Supervisory Wing'
          },
          {
            id: 'USR-DG-01',
            email: 'dg@legalmetrix.gov.in',
            name: 'Dr. Vikramaditya Reddy, IAS',
            role: 'Director General' as UserRole,
            badge_number: 'LM-HQ-DG-001',
            jurisdiction: 'Ministry of Consumer Affairs, New Delhi',
            division: 'National Metrology Directorate General'
          },
          {
            id: 'USR-ADMIN-01',
            email: 'admin@legalmetrix.gov.in',
            name: 'Chief Administrator S. Ramaswamy',
            role: 'Administrator' as UserRole,
            badge_number: 'LM-ADMIN-01',
            jurisdiction: 'Central Rule Codification & Technical Wing',
            division: 'Statutory Rules Codification Authority'
          },
          {
            id: 'USR-CIT-01',
            email: 'citizen@legalmetrix.gov.in',
            name: 'Pooja Deshmukh (General Consumer)',
            role: 'Citizen' as UserRole,
            badge_number: 'CITIZEN-VIGILANCE',
            jurisdiction: 'National Consumer Vigilance',
            division: 'Public Citizen Consumer Affairs'
          }
        ].find(u => u.email.toLowerCase() === email.toLowerCase());

        if (found) {
          loginAsAccount(found, `token_${found.id}`);
          return true;
        }
      }
      return false;
    }
  };

  const logout = () => {
    if (sessionToken) {
      logoutUser(sessionToken).catch(() => {});
    }
    setCurrentUser(null);
    setSessionToken(null);
    try {
      localStorage.removeItem('lm_auth_user');
      localStorage.removeItem('lm_auth_token');
    } catch (e) {}
  };

  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.75);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(2);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [systemStatus, setSystemStatus] = useState({
    connected: true,
    geminiConnected: false,
    geminiModel: 'gemini-3.7-flash',
    ruleVersion: '2026.1 (LMPC Rules 2011)',
  });

  const refreshSystemStatus = async () => {
    try {
      const data = await fetchHealth();
      setSystemStatus({
        connected: true,
        geminiConnected: !!data.gemini_connected,
        geminiModel: data.gemini_model || 'gemini-3.7-flash',
        ruleVersion: data.rule_engine_version || '2026.1 (LMPC Rules 2011)',
      });
    } catch (err) {
      console.warn('Backend status check pending:', err);
    }
  };

  useEffect(() => {
    refreshSystemStatus();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const viewInspection = (inspection: InspectionRecord, view: ViewType = 'compliance_results') => {
    setCurrentInspection(inspection);
    if (inspection.declarations && inspection.declarations.length > 0) {
      setSelectedEvidenceField(inspection.declarations[0].field);
    }
    setActiveView(view);
  };

  const viewCertificate = (certId: string) => {
    setSelectedCertificateId(certId);
    setActiveView('certificates');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        currentInspection,
        setCurrentInspection,
        selectedEvidenceField,
        setSelectedEvidenceField,
        selectedCertificateId,
        setSelectedCertificateId,
        viewCertificate,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        currentUser,
        sessionToken,
        isAuthenticated,
        login,
        loginAsAccount,
        logout,
        officerRole,
        setOfficerRole,
        officerName,
        setOfficerName,
        confidenceThreshold,
        setConfidenceThreshold,
        isOnline,
        setIsOnline,
        offlineQueueCount,
        setOfflineQueueCount,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        systemStatus,
        refreshSystemStatus,
        viewInspection,
        notification,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

