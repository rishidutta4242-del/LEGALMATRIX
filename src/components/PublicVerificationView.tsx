import React, { useState, useEffect } from 'react';
import { ComplianceCertificate } from '../types/index';
import { fetchCertificateById } from '../services/api';
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Copy,
  ArrowLeft,
  Building,
  Calendar,
  Lock,
  Scale,
  RefreshCw,
  QrCode,
  Tag
} from 'lucide-react';

interface PublicVerificationViewProps {
  certificateId: string;
  onExit?: () => void;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({
  certificateId,
  onExit
}) => {
  const [certificate, setCertificate] = useState<ComplianceCertificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!certificateId) {
      setError('No certificate identifier provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchCertificateById(certificateId)
      .then((cert) => {
        setCertificate(cert);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || `Certificate "${certificateId}" was not found in the national registry.`);
        setLoading(false);
      });
  }, [certificateId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="h-10 w-10 text-amber-400 animate-spin" />
        <h2 className="text-lg font-bold">Verifying Statutory Metrology Certificate...</h2>
        <p className="text-xs text-slate-400 font-mono">{certificateId}</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-6 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-950/80 border border-red-500/50 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Certificate Verification Failed</h2>
            <p className="text-xs text-red-300 font-mono">{certificateId}</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {error || 'This certificate record could not be found in the Directorate of Legal Metrology registry. It may be invalid, fraudulent, or the QR code may have been altered.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Portal</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Retry Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRevoked = certificate.status === 'REVOKED';
  const isExpired = certificate.status === 'EXPIRED';
  const isActive = certificate.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar with Exit and Actions */}
      <header className="print:hidden bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="min-h-[44px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Officer Portal</span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-amber-300">
              LEGALMETRIX Public Verification
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="min-h-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
            <span>{copied ? 'Copied URL!' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Verification Status Banner */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
            isActive
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : isRevoked
              ? 'bg-red-950/70 border-red-500/50 text-red-200'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isActive ? 'bg-emerald-600 text-white' : isRevoked ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {isActive ? <ShieldCheck className="h-7 w-7" /> : isRevoked ? <ShieldAlert className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">Statutory Verification Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black uppercase ${
                    isActive ? 'bg-emerald-500 text-slate-950' : isRevoked ? 'bg-red-500 text-white' : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {certificate.status}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {isActive && 'Certified Compliant under Legal Metrology Rules, 2011'}
                {isRevoked && 'Certificate Revoked — Mandatory Non-Compliance'}
                {isExpired && 'Statutory Certificate Expired'}
              </h1>
              {isRevoked && certificate.revocation_reason && (
                <p className="text-xs text-red-300 mt-1 italic bg-red-900/40 p-1.5 rounded border border-red-700/50">
                  Revocation Notice: {certificate.revocation_reason}
                </p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0 sm:self-center font-mono text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/60">
            <div>Score: <strong className="text-white text-sm">{certificate.screening_score}/100</strong></div>
            <div className="text-[10px] text-slate-400">Rule GSR 779(E)</div>
          </div>
        </div>

        {/* Authentic Formal Certificate Layout */}
        <div className="bg-white text-slate-900 rounded-2xl border-[3px] border-slate-800 p-5 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Watermark for REVOKED */}
          {isRevoked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <div className="transform -rotate-30 border-8 border-red-600 text-red-600 px-8 py-3 rounded-2xl text-5xl font-black tracking-widest uppercase opacity-20">
                REVOKED
              </div>
            </div>
          )}

          {/* Official Emblem & Department Header */}
          <div className="text-center pb-5 border-b-2 border-slate-900 space-y-1">
            <div className="flex justify-center mb-1">
              <div className="flex flex-col items-center">
                <svg width="44" height="48" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-900">
                  <circle cx="50" cy="55" r="45" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeDasharray="3 2" />
                  <path d="M50 15 L53 28 L66 28 L55 36 L59 49 L50 41 L41 49 L45 36 L34 28 L47 28 Z" fill="#0f172a" />
                  <circle cx="50" cy="62" r="14" stroke="#0f172a" strokeWidth="2" fill="#f8fafc" />
                  <line x1="50" y1="48" x2="50" y2="76" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="36" y1="62" x2="64" y2="62" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="40" y1="52" x2="60" y2="72" stroke="#0f172a" strokeWidth="1" />
                  <line x1="40" y1="72" x2="60" y2="52" stroke="#0f172a" strokeWidth="1" />
                  <rect x="25" y="85" width="50" height="7" rx="2" fill="#0f172a" />
                  <path d="M32 94 L68 94 L63 99 L37 99 Z" fill="#334155" />
                </svg>
                <span className="text-[9px] font-bold tracking-widest text-slate-800 uppercase mt-0.5">
                  सत्यमेव जयते
                </span>
              </div>
            </div>

            <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-slate-600">
              Government of India
            </div>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-slate-950 font-serif leading-tight">
              Ministry of Consumer Affairs, Food &amp; Public Distribution
            </h2>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-800">
              Department of Consumer Affairs • Directorate of Legal Metrology
            </div>

            <div className="pt-2">
              <span className="inline-block px-4 py-1 bg-slate-900 text-amber-300 text-xs font-black uppercase tracking-[0.2em] rounded shadow-xs">
                Certificate of Statutory Metrological Compliance
              </span>
            </div>
            <div className="text-[10px] italic text-slate-500 pt-0.5">
              Issued pursuant to Rule 6 &amp; Schedule II of the Legal Metrology (Packaged Commodities) Rules, 2011
            </div>
          </div>

          {/* Certificate Identification & Validity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Certificate Identification Number</span>
              <span className="font-mono font-black text-sm text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                {certificate.certificate_id}
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Surveillance Inspection Record</span>
              <span className="font-mono font-bold text-slate-800">{certificate.inspection_id}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Issue Date</span>
              <span className="font-semibold text-slate-800">{new Date(certificate.issued_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Valid Until</span>
              <span className="font-semibold text-slate-800">{new Date(certificate.expires_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Certified Commodity Details Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Certified Commodity Declarations (Rule 6 Verified)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Common / Generic Commodity Name</span>
                <span className="font-bold text-slate-950 text-sm">{certificate.product_name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Brand / Trade Name</span>
                <span className="font-semibold text-slate-900">{certificate.brand}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Net Quantity (Standard Metric)</span>
                <span className="font-bold text-blue-700 font-mono">{certificate.net_quantity || 'Unable to Verify'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Maximum Retail Price (MRP)</span>
                <span className="font-bold text-emerald-700 font-mono">{certificate.mrp || 'Unable to Verify'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Manufacturer / Packer Details</span>
                <span className="text-slate-800 font-medium">
                  {certificate.manufacturer_details.name} — {certificate.manufacturer_details.address}
                </span>
              </div>
              {certificate.gtin_barcode && (
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">GTIN / Barcode</span>
                  <span className="font-mono font-bold text-slate-800">{certificate.gtin_barcode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cryptographic Signing & Tamper Verification */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-[11px] font-mono text-slate-700 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
              <Lock className="h-3.5 w-3.5 text-slate-700 shrink-0" />
              <span>Tamper-Evident SHA-256 Digest:</span>
            </div>
            <div className="break-all bg-white px-2 py-1 rounded border border-slate-300 text-slate-800">
              {certificate.tamper_digest}
            </div>
            <div className="text-[10px] text-slate-500 pt-1">
              Verifying Officer: <strong>{certificate.inspecting_officer.name}</strong> ({certificate.inspecting_officer.role} • {certificate.inspecting_officer.badge_id})
            </div>
          </div>

          {/* Official Disclaimer */}
          <p className="text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-200 pt-3">
            {certificate.statutory_disclaimer}
          </p>
        </div>
      </main>
    </div>
  );
};
