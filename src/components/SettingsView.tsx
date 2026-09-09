import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { resetDemoData, fetchSystemAuditLogs, logSystemAuditEntry } from '../services/api';
import { Permissions, getRoleBadgeMeta } from '../utils/permissions';
import { ScheduleIITable } from './ScheduleIITable';
import { SystemAuditLogEntry, UserRole } from '../types/index';
import {
  Settings as SettingsIcon,
  UserCheck,
  Cpu,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Scale,
  Sliders,
  CheckCircle,
  Database,
  Lock,
  History,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    logout,
    officerRole,
    setOfficerRole,
    officerName,
    setOfficerName,
    confidenceThreshold,
    setConfidenceThreshold,
    systemStatus,
    refreshSystemStatus,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'config' | 'audit_trail' | 'schedule_ii'>('config');
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const canChangeConfig = Permissions.canChangeSystemConfig(officerRole);
  const canManageDemo = Permissions.canManageDemoEnvironment(officerRole);
  const roleBadge = getRoleBadgeMeta(officerRole);

  useEffect(() => {
    if (activeTab === 'audit_trail') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await fetchSystemAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleConfidenceChange = async (newVal: number) => {
    if (!canChangeConfig) {
      showToast('Restricted: Only Administrator role may modify AI confidence thresholds.', 'error');
      return;
    }
    const oldVal = confidenceThreshold;
    setConfidenceThreshold(newVal);
    try {
      await logSystemAuditEntry({
        category: 'CONFIG_CHANGE',
        actor_name: officerName,
        actor_role: officerRole,
        action: 'UPDATE_CONFIDENCE_THRESHOLD',
        target: 'AI_DETECTION_ENGINE',
        changes: [{ field: 'confidence_threshold', before: oldVal, after: newVal }],
        rationale: `Updated AI multimodal confidence threshold from ${Math.round(oldVal * 100)}% to ${Math.round(newVal * 100)}%`
      });
      showToast(`Confidence threshold updated to ${Math.round(newVal * 100)}% and logged in system audit trail.`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemo = async () => {
    if (!canManageDemo) {
      showToast('Restricted: Demo database reset requires Administrator privileges.', 'error');
      return;
    }
    setResetting(true);
    try {
      await resetDemoData();
      await logSystemAuditEntry({
        category: 'CONFIG_CHANGE',
        actor_name: officerName,
        actor_role: officerRole,
        action: 'RESET_DEMO_DATASET',
        target: 'INSPECTION_DATABASE',
        changes: [{ field: 'dataset', before: 'MODIFIED', after: 'DEFAULT' }],
        rationale: 'Restored initial calibrated test packages and clean demo state.'
      });
      setResetConfirmOpen(false);
      showToast('Inspection database reset to initial calibrated demo state.', 'success');
    } catch (err) {
      showToast('Failed to reset demo dataset.', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Configuration &amp; Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Role permissions matrix, AI multimodal thresholds, Schedule II metrics, and unified audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar flex-nowrap pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
        <button
          onClick={() => setActiveTab('config')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'config'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4 shrink-0" />
          <span>Configuration &amp; Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit_trail'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4 shrink-0" />
          <span>Unified System Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule_ii')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'schedule_ii'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="h-4 w-4 shrink-0" />
          <span>Schedule II Standards</span>
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Officer Profile & Role Assignment */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Authenticated Officer Identity</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadge.color}`}>
                  {roleBadge.shortLabel}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{officerName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {currentUser?.email || 'officer@legalmetrix.gov.in'}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-bold">
                      {currentUser?.badge_number || 'LM-ID-2026'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-600 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-700">Jurisdiction:</span>{' '}
                      {currentUser?.jurisdiction || 'National Metrology Directorate'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Division:</span>{' '}
                      {currentUser?.division || 'Statutory Enforcement Division'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                  <strong className="text-blue-950">Statutory Clearance:</strong> {roleBadge.description}
                  <div className="text-[10px] text-blue-700/80 mt-1">
                    * Roles are cryptographically bound to authenticated user sessions and cannot be self-selected at runtime.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    showToast('Logged out of session. Please re-authenticate.', 'info');
                  }}
                  className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl transition border border-slate-300 text-xs cursor-pointer flex items-center justify-center"
                >
                  Sign Out / Switch Official Profile
                </button>
              </div>
            </div>

            {/* AI Multimodal Parameters with Permission Guard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">AI Confidence &amp; Screening Policy</h3>
                </div>
                {!canChangeConfig && (
                  <span className="inline-flex items-center space-x-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
                    <Lock className="h-3 w-3" />
                    <span>Locked (Admin Only)</span>
                  </span>
                )}
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Minimum AI Confidence Threshold</label>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {Math.round(confidenceThreshold * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    disabled={!canChangeConfig}
                    value={confidenceThreshold}
                    onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none ${
                      canChangeConfig ? 'bg-slate-200 cursor-pointer accent-blue-600' : 'bg-slate-100 cursor-not-allowed opacity-60'
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Declarations extracted below this confidence automatically route to human officer REVIEW state.
                  </p>
                </div>

                {!canChangeConfig && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start space-x-2">
                    <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>Threshold policy changes require Director General / Administrator role. Switch role profile to amend.</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">System Multimodal Engine</span>
                    <span className="text-[11px] text-slate-500 font-mono">{systemStatus.geminiModel}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ISOLATED DEMO MODE & SANDBOX PANEL */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center space-x-2.5">
                <Database className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Demo Mode &amp; Calibrated Test Sandbox</span>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded uppercase font-bold">
                      Sandbox Simulation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Isolated staging environment for Hackathon evaluation, live calibration testing, and training.
                  </p>
                </div>
              </div>

              {canManageDemo ? (
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={resetting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center space-x-2 shrink-0 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
                  <span>Reset Demo Datasets</span>
                </button>
              ) : (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-mono border border-slate-700">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Admin Role Required</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Scenario 1 (Clean Pass)</div>
                <div className="font-semibold text-white mt-1">Compliant Oats Cookies</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Full declarations, certified font height, active compliance certificate.</div>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-mono text-red-400 font-bold uppercase">Scenario 2 (Mandatory Defect)</div>
                <div className="font-semibold text-white mt-1">Missing Consumer Care</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Rule 6(1)(e) violation, red-flag penalty notice, repeat offender profile.</div>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">Scenario 3 (Disputed Case)</div>
                <div className="font-semibold text-white mt-1">Over-Sticker Contradiction</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Conflicting MRP, manufacturer appeal filed, ready for adjudication.</div>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="text-[10px] font-mono text-blue-400 font-bold uppercase">Scenario 4 (Optical Review)</div>
                <div className="font-semibold text-white mt-1">Glare Ambiguity</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Partial glare, confidence routing to human review, re-capture guide.</div>
              </div>
            </div>

            {/* Reset Confirmation Modal */}
            {resetConfirmOpen && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <h4 className="font-bold text-base text-slate-900">Confirm Demo Data Reset</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This will re-initialize the in-memory database with the 4 calibrated LegalMetrix demonstration commodities, seed verified compliance certificates, and reset dispute statuses. All temporary uncommitted field inspections will be restored to their baseline state.
                  </p>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      disabled={resetting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition"
                    >
                      {resetting ? 'Resetting...' : 'Confirm Reset'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UNIFIED SYSTEM AUDIT TRAIL TAB */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Unified Enforcement &amp; System Audit Trail</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory audit log capturing rule amendments, AI threshold adjustments, role switches, and certificate issuances.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Refresh audit logs"
            >
              <RefreshCw className={`h-4 w-4 ${loadingAudit ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No audit records found.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        log.category === 'RULE_CHANGE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.category === 'CONFIG_UPDATE'
                          ? 'bg-purple-100 text-purple-800'
                          : log.category === 'CERTIFICATE_ACTION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {log.category}
                      </span>
                      <span className="font-bold text-slate-900">{log.action}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                    <div className="text-[10px] text-slate-400">
                      Officer: <span className="font-semibold text-slate-600">{log.actor_name}</span> ({log.actor_role})
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 self-start sm:self-auto">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SCHEDULE II STANDARDS TAB */}
      {activeTab === 'schedule_ii' && (
        <div className="space-y-4">
          <ScheduleIITable showRegulatoryNote={true} />
        </div>
      )}
    </div>
  );
};
