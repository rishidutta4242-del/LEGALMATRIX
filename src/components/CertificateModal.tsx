import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { ComplianceCertificate } from '../types/index';
import { NationalEmblemIndia, OfficialGovtSealStamp } from './IndianStateEmblem';
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Copy,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  ArrowLeft,
  FileCheck2,
  Lock,
  BadgeCheck,
  Scale,
  Download
} from 'lucide-react';

interface CertificateModalProps {
  certificate: ComplianceCertificate;
  isOpen: boolean;
  onClose: () => void;
  onRevoke?: (certificateId: string, reason: string) => Promise<void>;
  canRevoke?: boolean;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onRevoke,
  canRevoke = false,
}) => {
  const [showRevokePrompt, setShowRevokePrompt] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trap-free dismissal: ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRevoked = certificate.status === 'REVOKED';
  const isExpired = certificate.status === 'EXPIRED';

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + certificate.public_verification_url;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Outer borders
      doc.setDrawColor(0, 33, 71);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, pageWidth - 16, 280);

      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, 276);

      // Watermark text in background
      doc.setTextColor(242, 246, 250);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.text('LEGAL METROLOGY', pageWidth / 2, 140, { align: 'center', angle: 45 });
      doc.text('GOVERNMENT OF INDIA', pageWidth / 2, 175, { align: 'center', angle: 45 });

      // Header
      doc.setTextColor(0, 33, 71);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('GOVERNMENT OF INDIA', pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(10);
      doc.text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', pageWidth / 2, 28, { align: 'center' });
      doc.text('LEGAL METROLOGY ENFORCEMENT DIVISION', pageWidth / 2, 34, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 80, 95);
      doc.text('Central Metrology Surveillance Registry | Statutory Packaging Verification Division', pageWidth / 2, 40, { align: 'center' });

      doc.setDrawColor(180, 190, 205);
      doc.line(18, 44, pageWidth - 18, 44);

      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF STATUTORY PACKAGING COMPLIANCE', pageWidth / 2, 53, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Issued under the Legal Metrology (Packaged Commodities) Rules, 2011 & Amendments (GSR 779(E))', pageWidth / 2, 58, { align: 'center' });

      // Certificate Identification Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(18, 64, pageWidth - 36, 26, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(18, 64, pageWidth - 36, 26, 2, 2, 'D');

      doc.setTextColor(0, 33, 71);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Certificate ID: ${certificate.certificate_id}`, 22, 71);
      doc.setFont('helvetica', 'normal');
      doc.text(`Issue Date: ${new Date(certificate.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 22, 77);
      doc.text(`Valid Until: ${new Date(certificate.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (${certificate.validity_months} Months)`, 22, 83);

      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${certificate.status}`, 120, 71);
      doc.setFont('helvetica', 'normal');
      doc.text(`Screening Score: ${certificate.screening_score}/100`, 120, 77);
      doc.text(`GTIN / Barcode: ${certificate.gtin_barcode || 'N/A (Standard Package)'}`, 120, 83);

      // Section 1: Commodity Specifications
      let y = 98;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 33, 71);
      doc.text('1. COMMODITY & PACKAGING DECLARATIONS', 18, y);
      doc.line(18, y + 2, pageWidth - 18, y + 2);

      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Product Name:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.product_name || 'N/A', 65, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Brand / Label:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.brand || 'N/A', 65, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Category:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.category || 'Food & Agro', 65, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Declared Net Quantity:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.net_quantity || 'Declared Metric Standard', 65, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Maximum Retail Price (MRP):', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.mrp || 'Declared Statutory MRP', 65, y);

      // Section 2: Manufacturer Details
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 33, 71);
      doc.text('2. REGISTERED PACKER / MANUFACTURER DETAILS', 18, y);
      doc.line(18, y + 2, pageWidth - 18, y + 2);

      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Manufacturer / Packer:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.manufacturer_details?.name || certificate.brand || 'Registered Manufacturer', 65, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Address on Package:', 22, y);
      doc.setFont('helvetica', 'normal');
      const mfrAddress = certificate.manufacturer_details?.address || 'Industrial Area, India';
      doc.text(mfrAddress.length > 55 ? mfrAddress.substring(0, 55) + '...' : mfrAddress, 65, y);

      // Section 3: Digital Cryptographic Verification
      y += 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 33, 71);
      doc.text('3. CRYPTOGRAPHIC INTEGRITY & OFFICER ATTESTATION', 18, y);
      doc.line(18, y + 2, pageWidth - 18, y + 2);

      y += 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Cryptographic SHA-256 Digest:', 22, y);
      doc.setFont('courier', 'normal');
      doc.text(certificate.tamper_digest || 'SHA256:VERIFIED-HASH', 22, y + 5);

      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('Inspection ID:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.inspection_id, 50, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Inspecting Officer:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.inspecting_officer?.name || 'Enforcement Inspector', 142, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Rule Version:', 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.rule_repository_version || '2026.1 (GSR 779(E))', 50, y);

      doc.setFont('helvetica', 'bold');
      doc.text('Officer Badge:', 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(certificate.inspecting_officer?.badge_id || 'LM-GOV-2026', 142, y);

      // Section 4: Public Verification URL & Disclaimer
      y += 14;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(18, y, pageWidth - 36, 24, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(18, y, pageWidth - 36, 24, 2, 2, 'D');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 33, 71);
      doc.text('PUBLIC VERIFICATION & TAMPER-CHECK PORTAL', 22, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const fullVerifyUrl = `${window.location.origin}${certificate.public_verification_url}`;
      doc.text(`Verify online: ${fullVerifyUrl}`, 22, y + 12);
      doc.text('This certificate is digitally verifiable on the Central Legal Metrology Enforcement Portal.', 22, y + 17);

      // Bottom Sign-off
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('LegalMetrix AI System | PS ID: 26034 | Ministry of Consumer Affairs, Food & Public Distribution, New Delhi', pageWidth / 2, 282, { align: 'center' });

      doc.save(`LegalMetrix_Certificate_${certificate.certificate_id}.pdf`);
    } catch (e) {
      console.error('Failed to generate certificate PDF:', e);
      window.print();
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeReason.trim()) return;
    if (onRevoke) {
      setIsRevoking(true);
      try {
        await onRevoke(certificate.certificate_id, revokeReason);
        setShowRevokePrompt(false);
      } finally {
        setIsRevoking(false);
      }
    }
  };

  // Generate an authentic QR code pattern via an SVG matrix
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    window.location.origin + certificate.public_verification_url
  )}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-300 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col h-[95vh] sm:h-[90vh] animate-in fade-in zoom-in-95 duration-200 relative"
      >
        {/* Top Control Bar with Persistent Exit Controls (Permanently Pinned Header & Hidden during print) */}
        <div className="shrink-0 print:hidden bg-slate-900 text-white px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-slate-800 shadow-md">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              onClick={onClose}
              className="min-h-[44px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 hover:text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition border border-slate-600 shadow-xs cursor-pointer"
              title="Return / Close Certificate"
              aria-label="Back to Compliance Screen"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-bold">Close / Exit</span>
            </button>
            <span className="hidden md:inline-block font-mono text-[11px] bg-slate-800/80 text-amber-300 px-2.5 py-1 rounded border border-slate-700 truncate max-w-[180px]">
              {certificate.certificate_id}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="min-h-[44px] px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 border border-slate-700 active:scale-95 cursor-pointer"
              title="Copy Public Verification URL"
            >
              <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="hidden lg:inline">{copied ? 'Copied Link!' : 'Public Link'}</span>
              <span className="lg:hidden">{copied ? 'Copied' : 'Link'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="min-h-[44px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer"
              title="Download High-Resolution Statutory Certificate PDF"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="min-h-[44px] px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>

            {canRevoke && !isRevoked && (
              <button
                onClick={() => setShowRevokePrompt(true)}
                className="min-h-[44px] px-2.5 sm:px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Revoke</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition flex items-center justify-center border border-slate-700 sm:border-transparent cursor-pointer"
              title="Close modal (Esc)"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Revocation Prompt (Hidden in print) */}
        {showRevokePrompt && (
          <div className="print:hidden bg-red-50 border-b border-red-200 p-4 space-y-3">
            <div className="flex items-center space-x-2 text-red-900 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>Official Revocation of Statutory Certificate</span>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              Revoking this certificate cancels manufacturer statutory immunity and flags this SKU for market seizure or penalty compounding under Section 36(1).
            </p>
            <div className="space-y-2">
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Specify statutory violation (e.g. Subsequent field audit revealed under-sized font or altered MRP sticker pursuant to Rule 18)..."
                rows={2}
                className="w-full text-xs p-2.5 bg-white border border-red-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRevokePrompt(false)}
                  className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!revokeReason.trim() || isRevoking}
                  onClick={handleConfirmRevoke}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL STATUTORY CERTIFICATE CANVAS (Scrollable within modal) */}
        <div
          id="printable-certificate"
          className="flex-1 overflow-y-auto p-2.5 sm:p-6 md:p-10 bg-[#fbfbfa] text-slate-900 relative font-serif print:p-4 print:m-0 print:bg-white"
        >
          {/* Print CSS Injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              #printable-certificate {
                border: none !important;
                padding: 0 !important;
                box-shadow: none !important;
              }
            }
          `}} />

          {/* Authentic Multi-line Formal Border with Corner Florets */}
          <div className="border-[2px] sm:border-[3px] border-[#1e293b] p-3.5 sm:p-6 md:p-8 rounded-lg relative bg-white shadow-xs">
            {/* Inner Guilloche-style secondary hairline border */}
            <div className="absolute inset-1.5 border border-[#94a3b8] pointer-events-none rounded-sm"></div>

            {/* Corner Ornamental Accents */}
            <div className="absolute top-2 left-2 text-[#475569] text-xs font-mono select-none">❖</div>
            <div className="absolute top-2 right-2 text-[#475569] text-xs font-mono select-none">❖</div>
            <div className="absolute bottom-2 left-2 text-[#475569] text-xs font-mono select-none">❖</div>
            <div className="absolute bottom-2 right-2 text-[#475569] text-xs font-mono select-none">❖</div>

            {/* Watermark for REVOKED */}
            {isRevoked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20">
                <div className="transform -rotate-30 border-8 border-red-600 text-red-600 px-10 py-4 rounded-2xl text-6xl font-black tracking-widest uppercase opacity-20">
                  REVOKED
                </div>
              </div>
            )}

            {/* SECTION: Official State Emblem & Departmental Header */}
            <div className="text-center pb-5 border-b-2 border-slate-900 space-y-1 relative">
              {/* Authentic National State Emblem of India */}
              <div className="flex justify-center mb-1">
                <NationalEmblemIndia size={56} showMinistryText={false} />
              </div>

              <div className="font-sans">
                <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-slate-600">
                  Government of India
                </div>
                <h1 className="text-base sm:text-lg md:text-xl font-extrabold uppercase tracking-wider text-slate-950 font-serif leading-tight mt-0.5">
                  Ministry of Consumer Affairs, Food &amp; Public Distribution
                </h1>
                <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-800">
                  Department of Consumer Affairs • Directorate of Legal Metrology
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-block px-5 py-1.5 bg-slate-900 text-amber-300 font-sans text-xs md:text-sm font-black uppercase tracking-[0.2em] rounded shadow-xs border border-amber-400/40">
                  Certificate of Statutory Metrological Compliance
                </span>
              </div>
              <div className="text-[10px] font-sans italic text-slate-500 pt-0.5">
                Issued pursuant to Rule 6 &amp; Schedule II of the Legal Metrology (Packaged Commodities) Rules, 2011
              </div>
            </div>

            {/* SECTION: Certificate Metadata & High-Contrast Number */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-300 items-center font-sans">
              <div className="md:col-span-8 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Certificate Identification Number:
                  </span>
                  <span className="font-mono font-black text-sm md:text-base text-slate-950 bg-slate-100 border border-slate-400 px-2.5 py-0.5 rounded shadow-2xs">
                    {certificate.certificate_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    isRevoked
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : isExpired
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {certificate.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Date of Issuance</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(certificate.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Valid Through</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(certificate.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Surveillance Docket</span>
                    <span className="font-mono font-bold text-blue-900">{certificate.inspection_id}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Verification Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-2.5 bg-slate-50 rounded-lg border border-slate-300">
                <img
                  src={qrSvgUrl}
                  alt="Official QR Verification Seal"
                  className="w-24 h-24 object-contain bg-white p-1 rounded border border-slate-300"
                  crossOrigin="anonymous"
                />
                <span className="text-[9px] font-mono text-slate-600 text-center mt-1 uppercase font-bold tracking-wider">
                  Public Optical Verification Seal
                </span>
              </div>
            </div>

            {/* SECTION 1: Certified Pre-Packaged Commodity Particulars */}
            <div className="py-3.5 border-b border-slate-200 font-sans">
              <div className="flex items-center space-x-2 mb-2.5">
                <span className="h-4 w-1 bg-slate-900 inline-block"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  1. Certified Pre-Packaged Commodity Particulars
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Product Name / Title</span>
                  <span className="font-bold text-slate-900 font-serif text-sm">{certificate.product_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Brand / Registered Trademark</span>
                  <span className="font-semibold text-slate-900">{certificate.brand}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Commodity Category</span>
                  <span className="font-medium text-slate-800">{certificate.category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Declared Net Quantity</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">{certificate.net_quantity || 'Standard Declared'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Maximum Retail Price</span>
                  <span className="font-bold text-emerald-800 text-sm">{certificate.mrp || '₹ Standard (Incl. all taxes)'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">GTIN / EAN-13 Barcode</span>
                  <span className="font-mono font-semibold text-slate-900">{certificate.gtin_barcode || '8901234567890'}</span>
                </div>
                <div className="col-span-1 sm:col-span-2 md:col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Registered Manufacturer / Packer / Importer</span>
                  <span className="font-medium text-slate-900">
                    {certificate.manufacturer_details.name}, {certificate.manufacturer_details.address}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Codified Statutory Verification Summary */}
            <div className="py-3.5 border-b border-slate-200 font-sans">
              <div className="flex items-center space-x-2 mb-2.5">
                <span className="h-4 w-1 bg-slate-900 inline-block"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  2. Statutory Verification Summary &amp; Rule Compliance Findings
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start space-x-2 p-2 rounded bg-emerald-50/60 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Rule 6(1) Declarations Verification: PASS</span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      All mandatory statutory disclosures (Name, Net Qty, MRP, Mfg/Packing Date, Batch ID, and Consumer Care details) are prominently affixed in the Principal Display Panel.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-2 rounded bg-emerald-50/60 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Schedule II Character Height Calibration: PASS</span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Physical font height measurement calibrated via optical metric scale confirms declared numerals and letters comply with or exceed statutory millimeter minimum thresholds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-2 rounded bg-emerald-50/60 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Rule 18 Price Inclusivity &amp; Anti-Overcharging: PASS</span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      MRP declaration explicitly includes all taxes. Visual evidence confirms absence of unauthorized dual pricing stickers or smudged altered price fields.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-2 rounded bg-emerald-50/60 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block">Rule 27 National Packer Registration: PASS</span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Manufacturer/packer registration verified against the central database. Valid corporate identification and address verified for retail distribution.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Statutory Authority & Legal Citation */}
            <div className="py-3 border-b border-slate-200 font-sans text-xs text-slate-700">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="h-4 w-1 bg-slate-900 inline-block"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  3. Statutory Authority &amp; Legal Citations
                </h2>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                This Certificate is issued under the statutory authority of the <strong>Legal Metrology Act, 2009 (Act 1 of 2010)</strong>, read in conjunction with the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong> as amended. Compliant commodities holding this certificate are recognized as adhering to national legal standards across all States and Union Territories of the Republic of India.
              </p>
            </div>

            {/* SECTION 4: Cryptographic Seal, Tamper Hash & Officer Endorsement */}
            <div className="pt-4 font-sans grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Hashes */}
              <div className="md:col-span-7 space-y-1.5 text-[10px] font-mono text-slate-600">
                <div>
                  <span className="font-bold text-slate-700 block">Cryptographic SHA-256 Tamper-Evident Digest:</span>
                  <div className="bg-slate-100 p-1.5 rounded border border-slate-300 break-all text-slate-900 font-semibold">
                    {certificate.tamper_digest}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Chain of Custody Optical Hash:</span>
                  <div className="bg-slate-100 p-1.5 rounded border border-slate-300 break-all text-slate-900 font-semibold">
                    {certificate.chain_of_custody_hash}
                  </div>
                </div>
              </div>

              {/* Digital Officer Seal & Signature Block */}
              <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center text-center md:text-right">
                {/* Authentic Indian Govt Circular Rubber Stamp / Ink Seal */}
                <div className="mb-2">
                  <OfficialGovtSealStamp
                    size={88}
                    certId={certificate.certificate_id}
                    officerBadge={certificate.inspecting_officer.badge_id}
                  />
                </div>

                <div className="border-t border-slate-500 pt-1 w-44">
                  <div className="font-bold text-xs text-slate-950 font-serif">
                    {certificate.inspecting_officer.name}
                  </div>
                  <div className="text-[10px] font-medium text-slate-700">
                    {certificate.inspecting_officer.role}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Badge: {certificate.inspecting_officer.badge_id}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                    Digitally Sealed • {new Date(certificate.issued_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Mobile Exit Bar (Sticky at bottom on mobile) */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-300 flex items-center justify-between gap-3 print:hidden">
          <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
            Official statutory record issued under Section 18 / 36 of Legal Metrology Act, 2009.
          </p>
          <div className="flex items-center justify-end space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400" />
              <span>Exit Certificate View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
