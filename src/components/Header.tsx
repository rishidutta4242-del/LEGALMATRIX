import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Search,
  Award,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  Users,
  Building
} from 'lucide-react';
import { fetchNotifications, markNotificationRead, searchGtinRegistry } from '../services/api';
import { SystemNotification, GtinLookupResult, AuthUser } from '../types/index';
import { NationalEmblemIndia } from './IndianStateEmblem';

const OFFICIAL_ROLES: AuthUser[] = [
  {
    id: 'USR-INSP-01',
    email: 'inspector@legalmetrix.gov.in',
    name: 'Inspector Rajesh Kumar',
    role: 'Inspector',
    badge_number: 'LM-KA-INSP-402',
    jurisdiction: 'Bengaluru South Enforcement Division',
    division: 'Market Surveillance & Field Verification Cell',
    phone: '+91 98450 12345'
  },
  {
    id: 'USR-DEP-01',
    email: 'deputy.controller@legalmetrix.gov.in',
    name: 'Deputy Controller Priya Sharma',
    role: 'Deputy Controller',
    badge_number: 'LM-DL-SUP-109',
    jurisdiction: 'Delhi NCR Metrology Directorate',
    division: 'Appeals Adjudication & Supervisory Wing',
    phone: '+91 98110 54321'
  },
  {
    id: 'USR-DG-01',
    email: 'dg@legalmetrix.gov.in',
    name: 'Dr. Vikramaditya Reddy, IAS',
    role: 'Director General',
    badge_number: 'LM-HQ-DG-001',
    jurisdiction: 'Ministry of Consumer Affairs, New Delhi',
    division: 'National Metrology Directorate General',
    phone: '+91 99990 00001'
  },
  {
    id: 'USR-ADMIN-01',
    email: 'admin@legalmetrix.gov.in',
    name: 'Chief Metrology Administrator S. Ramaswamy',
    role: 'Administrator',
    badge_number: 'LM-ADMIN-01',
    jurisdiction: 'Central Rule Codification & Technical Wing',
    division: 'Statutory Rules Codification Authority',
    phone: '+91 98765 43210'
  },
  {
    id: 'USR-CITIZEN-01',
    email: 'citizen@legalmetrix.gov.in',
    name: 'Ananya Deshmukh',
    role: 'Citizen',
    badge_number: 'CITIZEN-KA-991',
    jurisdiction: 'Public Citizen Consumer Vigilance',
    division: 'Consumer Grievance & Public Vigilance Cell',
    phone: '+91 98888 12345'
  }
];

export const Header: React.FC = () => {
  const {
    currentUser,
    loginAsAccount,
    logout,
    officerRole,
    officerName,
    systemStatus,
    activeView,
    setActiveView,
    viewInspection,
    viewCertificate,
    isOnline,
    setIsOnline,
    offlineQueueCount,
    setOfflineQueueCount,
    unreadNotificationsCount,
    setUnreadNotificationsCount,
    toggleMobileSidebar,
    showToast
  } = useApp();

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showGtinModal, setShowGtinModal] = useState(false);
  const [gtinQuery, setGtinQuery] = useState('');
  const [gtinLoading, setGtinLoading] = useState(false);
  const [gtinResult, setGtinResult] = useState<GtinLookupResult | null>(null);
  const [gtinError, setGtinError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const roleSwitcherRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadNotificationsCount(unread);
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGtinSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gtinQuery.trim()) return;
    setGtinLoading(true);
    setGtinError(null);
    setGtinResult(null);
    try {
      const result = await searchGtinRegistry(gtinQuery.trim());
      setGtinResult(result);
    } catch (err: any) {
      setGtinError(err.message || 'GTIN lookup failed');
    } finally {
      setGtinLoading(false);
    }
  };

  // Generate initials for the officer badge
  const getInitials = (name: string) => {
    const parts = name.replace(/^(Insp\.|Officer|Inspector|Mr\.|Ms\.)\s*/i, '').trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'LM';
  };

  const handleManualSync = () => {
    if (!isOnline) {
      showToast('Cannot synchronize while offline. Connect to network first.', 'error');
      return;
    }
    if (offlineQueueCount === 0) {
      showToast('All surveillance records are currently synchronized with central server.', 'info');
      return;
    }
    setOfflineQueueCount(0);
    showToast(`Successfully synchronized ${offlineQueueCount} buffered inspection records.`, 'success');
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return { title: 'System Overview', subtitle: 'Central Enforcement Monitoring & Surveillance' };
      case 'new_inspection':
        return { title: 'New Commodity Inspection', subtitle: 'Multimodal AI Extraction & Rule Verification' };
      case 'bulk_intake':
        return { title: 'Bulk / E-Commerce Intake', subtitle: 'Batch Marketplace Catalog Surveillance' };
      case 'certificates':
        return { title: 'Compliance Certificate Registry', subtitle: 'Digital Certificates & Public QR Verification' };
      case 'compliance_results':
        return { title: 'Compliance Screening Evaluation', subtitle: 'Statutory Declaration Matrix & Rule Engine' };
      case 'evidence_viewer':
        return { title: 'Visual Evidence Chain', subtitle: 'OCR Bounding Coordinates & Optical Inspection' };
      case 'inspections':
        return { title: 'Surveillance Registry', subtitle: 'Historical Market Inspection Audit Records' };
      case 'reports':
        return { title: 'Legal Metrology Report', subtitle: 'Printable Statutory Compliance Document' };
      case 'rules':
        return { title: 'Rule Repository', subtitle: 'Codified Legal Metrology (PC) Rules 2011' };
      case 'settings':
        return { title: 'System Configuration', subtitle: 'Officer Credentials & Screening Thresholds' };
      default:
        return { title: 'LegalMetrix', subtitle: 'Enforcement Suite v2026.1' };
    }
  };

  const currentMeta = getViewTitle();

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* View Title & Breadcrumb + Mobile Menu Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-2">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0"
          aria-label="Open navigation drawer"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* State Emblem of India (Ashoka Lion Capital with Satyameva Jayate) & Department Branding */}
        <div className="hidden lg:flex items-center space-x-3 pr-4 border-r border-slate-200 shrink-0 select-none">
          <NationalEmblemIndia size={34} variant="standard" />
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-tight text-slate-900 leading-none">भारत सरकार</span>
            <span className="text-[10px] font-bold text-slate-600 leading-tight">Government of India</span>
            <span className="text-[9px] font-semibold text-blue-900 leading-tight">उपभोक्ता मामले विभाग (DoCA)</span>
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
            {currentMeta.title}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-medium truncate hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right-side Controls: GTIN Search + Notifications + Network + AI Status + Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick GTIN Search Button */}
        <button
          onClick={() => setShowGtinModal(true)}
          className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          title="Search barcode / GTIN across nationwide registry"
        >
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <span>GTIN Lookup</span>
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition cursor-pointer border border-transparent hover:border-slate-200"
            title="System Enforcement Notifications"
          >
            <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-4 w-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Enforcement Alerts</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {unreadNotificationsCount} Unread
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No active alerts at this time.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkRead(n.id);
                        if (n.target_type === 'CERTIFICATE' && n.target_id) {
                          viewCertificate(n.target_id);
                          setShowNotifications(false);
                        } else if (n.target_type === 'INSPECTION') {
                          setActiveView('inspections');
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 ${
                        !n.read ? 'bg-blue-50/50 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          {n.severity === 'CRITICAL' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          ) : n.severity === 'WARNING' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Offline / Online Sync Indicator */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              showToast(`Toggled network mode: ${!isOnline ? 'Online' : 'Offline Simulated'}`, 'info');
            }}
            title="Click to toggle simulated online/offline mode for field testing"
            className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border transition ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {isOnline ? <Wifi className="h-3 w-3 text-emerald-600 shrink-0" /> : <WifiOff className="h-3 w-3 text-amber-600 shrink-0" />}
            <span className="hidden xs:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {offlineQueueCount > 0 && (
            <button
              onClick={handleManualSync}
              className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-full text-[10px] sm:text-[11px] font-bold transition animate-pulse"
              title="Click to flush offline queue"
            >
              <RefreshCw className="h-3 w-3 shrink-0" />
              <span>{offlineQueueCount}<span className="hidden sm:inline"> Sync Pending</span></span>
            </button>
          )}
        </div>

        {/* Multimodal AI Extraction Status Badge */}
        <div className="flex items-center">
          {systemStatus.geminiConnected ? (
            <div
              id="badge-ai-mode"
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"
              title={`Active multimodal AI visual extraction via ${systemStatus.geminiModel}`}
            >
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0" />
              <span>Live AI Extraction</span>
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            </div>
          ) : (
            <div
              id="badge-ai-mode"
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs"
              title="Operating in calibrated Fallback / Demo Mode"
            >
              <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 shrink-0" />
              <span>Fallback / Demo Mode</span>
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 shrink-0"></span>
            </div>
          )}
        </div>

        {/* Multimodal Engine Model Detail */}
        <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Model:</span>
          <span className="font-mono text-slate-900 font-bold">{systemStatus.geminiModel}</span>
        </div>

        {/* Authenticated Officer Identity with Quick Role Switcher Dropdown */}
        <div className="relative" ref={roleSwitcherRef}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              id="btn-header-role-switcher"
              onClick={() => setShowRoleSwitcher((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition border border-transparent hover:border-slate-200 cursor-pointer text-left group"
              title="Click to switch authority roles (Inspector, Deputy Controller, DG, Admin, Citizen)"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[170px] flex items-center justify-end gap-1">
                  <span>{officerName}</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 group-hover:text-slate-700 transition ${showRoleSwitcher ? 'rotate-180' : ''}`} />
                </div>
                <div className="flex items-center justify-end space-x-1 mt-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      officerRole === 'Administrator'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : officerRole === 'Director General'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : officerRole === 'Deputy Controller'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : officerRole === 'Citizen'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    }`}
                  >
                    {officerRole}
                  </span>
                  {currentUser?.badge_number && (
                    <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
                      {currentUser.badge_number}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border shadow-2xs font-mono font-bold text-xs shrink-0 ${
                  officerRole === 'Administrator'
                    ? 'bg-purple-50 border-purple-300 text-purple-800'
                    : officerRole === 'Director General'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : officerRole === 'Deputy Controller'
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : officerRole === 'Citizen'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-800'
                }`}
              >
                {getInitials(officerName)}
              </div>
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              id="btn-header-signout"
              onClick={() => {
                logout();
                showToast('Logged out of statutory session. Please authenticate.', 'info');
              }}
              title="Sign Out / Switch Officer Profile"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200 shrink-0 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Authority Role Switcher Dropdown */}
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Switch Active Authority</span>
                <p className="text-xs text-slate-600">Quickly toggle user roles for SIH verification &amp; demos</p>
              </div>

              <div className="space-y-1">
                {OFFICIAL_ROLES.map((acc) => {
                  const isCurrent = currentUser?.id === acc.id || currentUser?.role === acc.role;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      id={`btn-switch-role-${acc.role.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => {
                        loginAsAccount(acc, `lm_token_${acc.id}`);
                        setShowRoleSwitcher(false);
                        showToast(`Switched active profile to ${acc.name} (${acc.role})`, 'success');
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50/80 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{acc.name}</span>
                          {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{acc.division}</div>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                          acc.role === 'Administrator'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : acc.role === 'Director General'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : acc.role === 'Deputy Controller'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : acc.role === 'Citizen'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        }`}
                      >
                        {acc.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2 text-[11px]">
                <span className="text-slate-500">SIH Finals PS 26034</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowRoleSwitcher(false);
                  }}
                  className="text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GTIN Barcode Cross-Registry Modal */}
      {showGtinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto sm:my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-blue-400 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">GTIN / Barcode Cross-Registry Intelligence</h3>
              </div>
              <button
                onClick={() => setShowGtinModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <form onSubmit={handleGtinSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={gtinQuery}
                    onChange={(e) => setGtinQuery(e.target.value)}
                    placeholder="Enter 8, 12, or 13-digit GTIN / EAN barcode..."
                    className="w-full pl-3 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={gtinLoading || !gtinQuery.trim()}
                  className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{gtinLoading ? 'Searching...' : 'Search'}</span>
                </button>
              </form>

              {/* Sample barcode chips */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                <span className="font-semibold text-[11px] sm:text-xs">Quick samples:</span>
                <button
                  type="button"
                  onClick={() => { setGtinQuery('8901030383848'); handleGtinSearch(); }}
                  className="text-blue-600 hover:underline font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]"
                >
                  8901030383848 (Clean Pass)
                </button>
                <button
                  type="button"
                  onClick={() => { setGtinQuery('8901234567890'); handleGtinSearch(); }}
                  className="text-blue-600 hover:underline font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]"
                >
                  8901234567890 (Disputed)
                </button>
              </div>

              {/* Results */}
              {gtinError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {gtinError}
                </div>
              )}

              {gtinResult && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Historical Inspections</div>
                      <div className="text-xl font-bold font-mono text-slate-900">{gtinResult.total_inspections}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Repeat Violations</div>
                      <div className="text-xl font-bold font-mono text-red-600">{gtinResult.repeat_offender_violations}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Compliance Certificates</div>
                      <div className="text-xl font-bold font-mono text-emerald-600">{gtinResult.certificates.length}</div>
                    </div>
                  </div>

                  {/* Manufacturer Risk Profile */}
                  {gtinResult.manufacturer_risk_profile && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{gtinResult.manufacturer_risk_profile.manufacturer_name}</span>
                        <p className="text-slate-600 text-[11px]">
                          Risk Score: <span className="font-bold">{gtinResult.manufacturer_risk_profile.risk_score}/100</span> — {gtinResult.manufacturer_risk_profile.risk_tier} RISK
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        gtinResult.manufacturer_risk_profile.risk_tier === 'HIGH'
                          ? 'bg-red-200 text-red-900'
                          : gtinResult.manufacturer_risk_profile.risk_tier === 'MEDIUM'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}>
                        {gtinResult.manufacturer_risk_profile.risk_tier}
                      </span>
                    </div>
                  )}

                  {/* Active Certificates */}
                  {gtinResult.certificates.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Issued Certificates:</div>
                      {gtinResult.certificates.map(c => (
                        <div key={c.certificate_id} className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-emerald-600" />
                            <div>
                              <span className="font-mono font-bold text-emerald-900">{c.certificate_id}</span>
                              <span className="text-slate-600 ml-2">Score: {c.screening_score}/100</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              viewCertificate(c.certificate_id);
                              setShowGtinModal(false);
                            }}
                            className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center space-x-1"
                          >
                            <span>View Cert</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inspection Records */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Surveillance Records:</div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {gtinResult.inspections.map(ins => (
                        <div
                          key={ins.id}
                          onClick={() => {
                            viewInspection(ins);
                            setShowGtinModal(false);
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{ins.product_name} ({ins.brand})</div>
                            <div className="text-slate-500 font-mono text-[10px]">{ins.id} • {new Date(ins.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            ins.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ins.status === 'FAIL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ins.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
