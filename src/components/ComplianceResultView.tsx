import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { verifyInspection, updateDisputeStatus, generateCertificate, fetchCertificates, revokeCertificate } from '../services/api';
import { ComplianceCertificate } from '../types/index';
import { CertificateModal } from './CertificateModal';
import { PenaltyReferenceModal } from './PenaltyReferenceModal';
import { Permissions } from '../utils/permissions';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Building,
  Tag,
  Scale,
  Sparkles,
  ExternalLink,
  Lock,
  MessageSquare,
  MapPin,
  Languages,
  Award
} from 'lucide-react';

export const ComplianceResultView: React.FC = () => {
  const { currentInspection, setCurrentInspection, setActiveView, setSelectedEvidenceField, officerName, officerRole, showToast } = useApp();
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideRemarks, setOverrideRemarks] = useState<string>('');
  const [overrideStatus, setOverrideStatus] = useState<'PASS' | 'FAIL' | 'REVIEW'>('PASS');

  // Certificate State
  const [existingCert, setExistingCert] = useState<ComplianceCertificate | null>(null);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [isIssuingCert, setIsIssuingCert] = useState<boolean>(false);

  // Statutory Penalty Reference State
  const [showPenaltyModal, setShowPenaltyModal] = useState<boolean>(false);

  // Dispute / Appeal Management State
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputeNewStatus, setDisputeNewStatus] = useState<string>('UNDER_MANUFACTURER_REVIEW');
  const [mfrResponseText, setMfrResponseText] = useState<string>('');
  const [officerDecisionText, setOfficerDecisionText] = useState<string>('');

  useEffect(() => {
    if (currentInspection && currentInspection.status === 'PASS') {
      fetchCertificates({ inspection_id: currentInspection.id })
        .then((certs) => {
          if (certs && certs.length > 0) {
            setExistingCert(certs[0]);
          } else {
            setExistingCert(null);
          }
        })
        .catch(() => setExistingCert(null));
    } else {
      setExistingCert(null);
    }
  }, [currentInspection?.id, currentInspection?.status]);

  const handleIssueCertificate = async () => {
    if (!currentInspection) return;
    if (!Permissions.canIssueCertificate(officerRole)) {
      showToast('Restricted: Only authorized enforcement officers can issue certificates.', 'error');
      return;
    }
    setIsIssuingCert(true);
    try {
      const res = await generateCertificate({
        inspection_id: currentInspection.id,
        inspecting_officer: {
          name: officerName,
          role: officerRole,
          badge_id: 'IND-LM-' + officerName.replace(/\s+/g, '').slice(0, 4).toUpperCase() + '-2026'
        }
      });
      setExistingCert(res.certificate);
      setShowCertModal(true);
      showToast(res.already_issued ? 'Compliance certificate loaded.' : 'Statutory Compliance Certificate successfully issued!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to issue compliance certificate', 'error');
    } finally {
      setIsIssuingCert(false);
    }
  };

  const handleRevokeCert = async (certId: string, reason: string) => {
    try {
      const res = await revokeCertificate(certId, {
        revoked_by: officerName,
        reason
      });
      setExistingCert(res.certificate);
      showToast(`Certificate ${certId} revoked successfully.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke certificate', 'error');
    }
  };

  if (!currentInspection) {
    return (
      <div className="p-8 text-center text-slate-500">
        No inspection currently loaded. Please select an inspection from the Dashboard or create a new one.
      </div>
    );
  }

  const handleOpenEvidence = (field?: string) => {
    if (field) {
      setSelectedEvidenceField(field);
    }
    setActiveView('evidence_viewer');
  };

  const handleApplyOverride = async () => {
    try {
      const res = await verifyInspection(currentInspection.id, {
        overall_status: overrideStatus,
        status: overrideStatus,
        reason: overrideRemarks || 'Enforcement Officer determination',
        officer_name: officerName,
        officer_role: officerRole,
        general_remarks: overrideRemarks
      });
      setCurrentInspection(res.inspection);
      setShowOverrideModal(false);
      showToast('Officer determination and remarks recorded.', 'success');
    } catch (err: any) {
      showToast('Failed to record officer override', 'error');
    }
  };

  const handleSaveDispute = async () => {
    try {
      const res = await updateDisputeStatus(currentInspection.id, {
        status: disputeNewStatus,
        manufacturer_response: mfrResponseText || undefined,
        officer_decision: officerDecisionText || undefined,
        officer_name: officerName
      });
      setCurrentInspection(res.inspection);
      setShowDisputeModal(false);
      showToast(`Dispute / Appeal status updated to ${disputeNewStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update dispute status', 'error');
    }
  };

  const getStatusColor = (status: 'PASS' | 'FAIL' | 'REVIEW' | 'NO_PACKAGE_DETECTED' | string) => {
    if (status === 'PASS') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-600 text-white', icon: ShieldCheck };
    if (status === 'FAIL') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-600 text-white', icon: ShieldAlert };
    if (status === 'NO_PACKAGE_DETECTED') return { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-900', badge: 'bg-rose-700 text-white', icon: AlertTriangle };
    return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-500 text-white', icon: AlertTriangle };
  };

  const statusTheme = getStatusColor(currentInspection.status);
  const StatusIcon = statusTheme.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Banner & Header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {currentInspection.id}
            </span>
            <span className="text-xs text-slate-500">• Category: {currentInspection.category}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {currentInspection.product_name}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Brand / Mfr: <span className="text-slate-800 font-semibold">{currentInspection.brand}</span> • Officer: {currentInspection.officer_name}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(currentInspection.status === 'PASS' || existingCert || currentInspection.certificate_id || !currentInspection.rule_evaluations?.some(e => e.status === 'FAIL')) && (
            <button
              id="btn-compliance-certificate"
              type="button"
              onClick={() => {
                if (existingCert) {
                  setShowCertModal(true);
                } else {
                  handleIssueCertificate();
                }
              }}
              disabled={isIssuingCert}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Award className="h-4 w-4" />
              <span>
                {isIssuingCert
                  ? 'Issuing...'
                  : existingCert
                  ? `Certificate (${existingCert.certificate_id})`
                  : 'Issue Compliance Certificate'}
              </span>
            </button>
          )}

          {currentInspection.status === 'FAIL' && (
            <button
              id="btn-penalty-reference"
              type="button"
              onClick={() => setShowPenaltyModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Scale className="h-4 w-4" />
              <span>Statutory Penalties (Sec 36)</span>
            </button>
          )}

          <button
            id="btn-open-evidence-chain"
            onClick={() => handleOpenEvidence()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Eye className="h-4 w-4" />
            <span>Open Evidence Viewer</span>
          </button>

          <button
            id="btn-view-pdf-report"
            onClick={() => setActiveView('reports')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Official PDF</span>
          </button>

          <button
            id="btn-officer-override"
            onClick={() => setShowOverrideModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-xs transition"
          >
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Officer Override</span>
          </button>

          <button
            id="btn-dispute-mgmt"
            onClick={() => {
              setDisputeNewStatus(currentInspection.dispute_status || 'UNDER_MANUFACTURER_REVIEW');
              setMfrResponseText(currentInspection.dispute_details?.manufacturer_response || '');
              setOfficerDecisionText(currentInspection.dispute_details?.officer_decision || '');
              setShowDisputeModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold border border-indigo-200 shadow-xs transition"
          >
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            <span>Dispute / Appeal ({currentInspection.dispute_status || 'NONE'})</span>
          </button>
        </div>
      </div>

      {/* Main Overall Screening Status Banner */}
      <div className={`rounded-2xl p-6 border ${statusTheme.border} ${statusTheme.bg} shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-2xl ${statusTheme.badge} shadow-md`}>
            <StatusIcon className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Automated Legal Metrology Compliance Screening
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono uppercase ${statusTheme.badge}`}>
                {currentInspection.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {currentInspection.status === 'PASS' && 'All Mandatory Statutory Declarations Compliant'}
              {currentInspection.status === 'FAIL' && 'Statutory Non-Compliance / Mandatory Rule Violations Detected'}
              {currentInspection.status === 'REVIEW' && 'Ambiguity / Low Confidence / Manual Verification Advised'}
              {currentInspection.status === 'NO_PACKAGE_DETECTED' && 'No Retail Packaged Commodity Detected in Image'}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              {currentInspection.status === 'NO_PACKAGE_DETECTED'
                ? 'Real-time object detection scanned the captured frame(s) and determined that no physical packaged commodity or readable Legal Metrology packaging label is visible. Please capture a clear photo focusing directly on the product packaging label.'
                : currentInspection.ai_notes || 'Rule engine evaluated declarations against the Legal Metrology (Packaged Commodities) Rules, 2011.'}
            </p>
            {currentInspection.status === 'NO_PACKAGE_DETECTED' && (
              <div className="pt-3 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setOverrideStatus('REVIEW');
                    setOverrideRemarks('Officer manually verified package is present in photo despite low lighting/contrast.');
                    setShowOverrideModal(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Manual Override: Confirm Package Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('new_inspection')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Retake / Upload New Photo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Screening Score Meter */}
        <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center shrink-0 min-w-[140px] text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Compliance Score</span>
          <span className="text-3xl font-black text-slate-900 font-mono mt-0.5">
            {currentInspection.screening_score}<span className="text-base font-normal text-slate-400">/100</span>
          </span>
          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full ${
                currentInspection.screening_score >= 80 ? 'bg-emerald-500' : currentInspection.screening_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${currentInspection.screening_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Officer Determination Banner if overridden or verified */}
      {(currentInspection.officer_determination || currentInspection.verified_by) && (
        <div className="rounded-xl p-4 bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white mt-0.5 shadow-2xs">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  Enforcement Officer Statutory Determination
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900">
                  {currentInspection.officer_determination?.officer_role || 'Field Officer'}
                </span>
                {currentInspection.original_ai_verdict && (
                  <span className="text-[11px] text-slate-500">
                    (Automated AI Screening was: <span className="font-bold font-mono text-slate-700">{currentInspection.original_ai_verdict}</span>)
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-950 mt-1">
                <strong>Determining Officer:</strong> {currentInspection.officer_determination?.officer_name || currentInspection.verified_by} •{' '}
                <span className="text-slate-600">
                  {currentInspection.officer_determination?.timestamp || currentInspection.verification_timestamp
                    ? new Date(currentInspection.officer_determination?.timestamp || currentInspection.verification_timestamp!).toLocaleString()
                    : 'Recorded'}
                </span>
              </p>
              {(currentInspection.officer_determination?.remarks || currentInspection.verification_remarks) && (
                <p className="text-xs text-slate-700 italic mt-1 bg-white/80 px-2.5 py-1 rounded border border-blue-100">
                  "{currentInspection.officer_determination?.remarks || currentInspection.verification_remarks}"
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowOverrideModal(true)}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline whitespace-nowrap"
          >
            Amend Determination
          </button>
        </div>
      )}

      {/* Clean Pass Statutory Certificate Callout Card */}
      {currentInspection.status === 'PASS' && (
        <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <Award className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Certificate of Statutory Compliance Available</h3>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">Rule 6 &amp; Schedule II</span>
              </div>
              <p className="text-xs text-slate-600">
                This pre-packaged commodity satisfies all mandatory declarations with verified character heights. An official digitally signed compliance certificate can be generated with a tamper-evident QR verification seal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (existingCert) {
                setShowCertModal(true);
              } else {
                handleIssueCertificate();
              }
            }}
            disabled={isIssuingCert}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 shrink-0 self-start sm:self-auto"
          >
            <Award className="h-4 w-4 text-amber-400" />
            <span>
              {isIssuingCert
                ? 'Generating Seal...'
                : existingCert
                ? `View Certificate (${existingCert.certificate_id})`
                : 'Issue Compliance Certificate'}
            </span>
          </button>
        </div>
      )}

      {/* Statutory Disclaimer Box */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center space-x-3 text-xs text-blue-900">
        <Info className="h-4 w-4 text-blue-600 shrink-0" />
        <span>
          <strong>Statutory Disclaimer:</strong> LEGALMETRIX provides AI-assisted compliance screening and decision support. Final legal determination under the Legal Metrology Act, 2009 remains with the authorized enforcement officer.
        </span>
      </div>

      {/* Field-Level Results Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Mandatory Declarations Matrix (LMPC Rules 2011)</h3>
            <p className="text-xs text-slate-500">Verification of extracted declarations against statutory rule conditions.</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 font-mono">
            {currentInspection.rule_evaluations.length} Rules Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Statutory Declaration</th>
                <th className="py-3 px-4">Rule Ref</th>
                <th className="py-3 px-4">Extracted Text</th>
                <th className="py-3 px-4">Normalized Value</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentInspection.rule_evaluations.map((evalItem) => {
                const decl = currentInspection.declarations.find((d) => d.field === evalItem.field);
                return (
                  <tr key={evalItem.rule_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{evalItem.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{evalItem.reason}</div>
                      {evalItem.officer_override && (
                        <div className="mt-1 inline-flex items-center text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Officer Override by {evalItem.officer_override.officer_name}: {evalItem.officer_override.reason}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      {evalItem.rule_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200 max-w-xs truncate">
                        {evalItem.evidence_text || decl?.original_text || <span className="text-slate-400 italic font-sans font-normal">Unable to Verify</span>}
                      </div>
                      {decl?.script && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="inline-flex items-center text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                            <Languages className="h-2.5 w-2.5 mr-1 text-indigo-500" />
                            {decl.script}
                          </span>
                          {decl.original_script_text && (
                            <span className="text-[10px] text-slate-700 font-semibold bg-slate-100 px-1 rounded">
                              {decl.original_script_text}
                            </span>
                          )}
                          {decl.transliterated_en && (
                            <span className="text-[9px] text-slate-500 italic">
                              ({decl.transliterated_en})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {decl?.normalized_value || evalItem.evidence_text || <span className="text-slate-400 italic font-sans font-normal text-xs">Unable to Verify</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          evalItem.confidence >= 0.9
                            ? 'bg-emerald-50 text-emerald-700'
                            : evalItem.confidence >= 0.7
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {Math.round(evalItem.confidence * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono uppercase ${
                          evalItem.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : evalItem.status === 'FAIL'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {evalItem.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEvidence(evalItem.field)}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Image Consistency & Readability Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cross-Image Consistency */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Multi-View Cross-Image Consistency</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Front vs Back Panel</span>
          </div>

          {currentInspection.cross_image_checks && currentInspection.cross_image_checks.length > 0 ? (
            <div className="space-y-2">
              {currentInspection.cross_image_checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    check.is_consistent
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{check.label}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        check.is_consistent ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1">{check.details}</p>
                  <div className="mt-2 text-[11px] grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50">
                    <div>Front: <span className="font-mono font-semibold">{check.front_value}</span></div>
                    <div>Back: <span className="font-mono font-semibold">{check.back_value}</span></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">
              Single image analyzed. For multi-panel contradiction checks, upload both Front and Back label views.
            </p>
          )}
        </div>

        {/* Readability & Print Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Scale className="h-4 w-4 text-blue-600" />
              <span>Readability &amp; Print Size Screening</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Rule 7 / Font Standards</span>
          </div>

          {currentInspection.readability_analysis ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Physical Font Scale</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {currentInspection.readability_analysis.is_calibrated ? (
                      <span className="text-emerald-700">Calibrated ({currentInspection.readability_analysis.estimatedCharHeightMm?.toFixed(1) || '3.2'} mm)</span>
                    ) : (
                      <span className="text-slate-600">Uncalibrated (No Scale)</span>
                    )}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Contrast Ratio</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">
                    {currentInspection.readability_analysis.contrastRatio}:1 (WCAG AA)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <p>{currentInspection.readability_analysis.message}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">Readability screening data available upon analysis.</p>
          )}
        </div>
      </div>

      {/* Evidentiary Chain of Custody & Dispute Resolution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chain of Custody Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>Evidentiary Chain of Custody &amp; Integrity</span>
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {currentInspection.chain_of_custody?.integrity_status || 'VERIFIED_INTACT'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Image SHA-256 Digest</div>
              <div className="font-mono text-[11px] text-slate-800 break-all select-all">
                {currentInspection.chain_of_custody?.image_sha256 || 'a4f932e18b0c95d24f0c976a213e8b15...'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-[10px] text-slate-500 block font-bold">Capture Terminal</span>
                <span className="font-mono text-slate-800">{currentInspection.chain_of_custody?.device_id || 'LM-DEVICE-STD-01'}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-[10px] text-slate-500 block font-bold">Custody Officer</span>
                <span className="font-semibold text-slate-800 truncate block">{currentInspection.chain_of_custody?.custody_officer || currentInspection.officer_name}</span>
              </div>
            </div>

            {currentInspection.chain_of_custody?.gps_coordinates && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center space-x-2 text-[11px] text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="font-mono">
                  {currentInspection.chain_of_custody.gps_coordinates.latitude.toFixed(4)}° N, {currentInspection.chain_of_custody.gps_coordinates.longitude.toFixed(4)}° E (±{currentInspection.chain_of_custody.gps_coordinates.accuracy_meters}m)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Manufacturer Dispute / Appeal Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span>Manufacturer Appeal / Dispute Status</span>
            </h3>
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                currentInspection.dispute_status === 'RESOLVED_UPHELD'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentInspection.dispute_status === 'RESOLVED_DISMISSED'
                  ? 'bg-red-100 text-red-800'
                  : currentInspection.dispute_status === 'UNDER_MANUFACTURER_REVIEW' || currentInspection.dispute_status === 'OPEN'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentInspection.dispute_status || 'NONE'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {currentInspection.dispute_details?.manufacturer_response ? (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950 space-y-1">
                <span className="font-bold block text-[10px] uppercase text-amber-800">Manufacturer Response / Representation:</span>
                <p className="italic text-[11px]">"{currentInspection.dispute_details.manufacturer_response}"</p>
                {currentInspection.dispute_details.officer_decision && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80">
                    <span className="font-bold block text-[10px] uppercase text-slate-800">Officer Adjudication:</span>
                    <p className="text-[11px] text-slate-700">{currentInspection.dispute_details.officer_decision}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-1">
                No active dispute lodged by {currentInspection.brand || 'manufacturer'}. Statutory show-cause notices allow 15 days for manufacturer representation under the Legal Metrology Rules.
              </p>
            )}

            <button
              onClick={() => {
                setDisputeNewStatus(currentInspection.dispute_status || 'UNDER_MANUFACTURER_REVIEW');
                setMfrResponseText(currentInspection.dispute_details?.manufacturer_response || '');
                setOfficerDecisionText(currentInspection.dispute_details?.officer_decision || '');
                setShowDisputeModal(true);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
            >
              Manage / Adjudicate Dispute Appeal
            </button>
          </div>
        </div>
      </div>

      {/* Dispute Management Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Adjudicate Manufacturer Dispute / Appeal</h3>
            <p className="text-xs text-slate-500">
              Update legal metrology dispute lifecycle pursuant to Rule 32 appeal provisions.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Appeal / Dispute State</label>
              <select
                value={disputeNewStatus}
                onChange={(e) => setDisputeNewStatus(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
              >
                <option value="NONE">NONE (No dispute)</option>
                <option value="OPEN">OPEN (Show-Cause Notice Issued)</option>
                <option value="UNDER_MANUFACTURER_REVIEW">UNDER_MANUFACTURER_REVIEW (Response Pending)</option>
                <option value="RESOLVED_UPHELD">RESOLVED_UPHELD (Violation Upheld / Seizure Sustained)</option>
                <option value="RESOLVED_DISMISSED">RESOLVED_DISMISSED (Notice Revoked / Label Approved)</option>
                <option value="COMPOUNDED">COMPOUNDED (Compounded under Section 48)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Manufacturer Representation / Submission</label>
              <textarea
                rows={2}
                placeholder="Enter manufacturer's explanation or exemption claim..."
                value={mfrResponseText}
                onChange={(e) => setMfrResponseText(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 resize-none"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Officer Adjudication Order / Ruling</label>
              <textarea
                rows={2}
                placeholder="Enter formal officer finding and legal reference..."
                value={officerDecisionText}
                onChange={(e) => setOfficerDecisionText(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDispute}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Record Adjudication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Enforcement Officer Determination</h3>
            <p className="text-xs text-slate-500">
              Record manual legal determination, override automated AI screening status, and log statutory remarks.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Determination Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
              >
                <option value="PASS">PASS (Compliant)</option>
                <option value="FAIL">FAIL (Issue Seizure / Notice)</option>
                <option value="REVIEW">REVIEW (Lab Testing Required)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Officer Legal Remarks &amp; Ground</label>
              <textarea
                rows={3}
                placeholder="State statutory rationale for override..."
                value={overrideRemarks}
                onChange={(e) => setOverrideRemarks(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyOverride}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Confirm Determination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Certificate View Modal */}
      {showCertModal && existingCert && (
        <CertificateModal
          certificate={existingCert}
          isOpen={true}
          onClose={() => setShowCertModal(false)}
          onRevoke={handleRevokeCert}
          canRevoke={Permissions.canRevokeCertificate(officerRole)}
        />
      )}

      {/* Statutory Penalty Reference Modal */}
      {showPenaltyModal && (
        <PenaltyReferenceModal
          isOpen={true}
          onClose={() => setShowPenaltyModal(false)}
          defaultOffence={
            currentInspection.rule_evaluations.some((r) => r.rule_id.includes('18'))
              ? 'RULE_18_MRP'
              : 'SEC_36_1'
          }
          linkedInspectionId={currentInspection.id}
          productName={currentInspection.product_name}
          manufacturerName={currentInspection.brand}
        />
      )}
    </div>
  );
};
