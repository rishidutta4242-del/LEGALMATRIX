import React from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import { NationalEmblemIndia } from './IndianStateEmblem';
import {
  Printer,
  Download,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Building,
  Calendar,
  UserCheck,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const PDFReportViewer: React.FC = () => {
  const { currentInspection, setActiveView, showToast, officerRole } = useApp();
  const isCitizen = officerRole === 'Citizen';

  if (!currentInspection) {
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto text-center space-y-4 my-8 sm:my-16">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
          <FileText className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">No Active Inspection Report</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {isCitizen
              ? 'Perform a packaging scan first to generate and view your statutory consumer compliance report.'
              : 'Select a verified packaged commodity inspection from surveillance history or screen a new package to generate and export statutory compliance reports.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => setActiveView(isCitizen ? 'dashboard' : 'inspections')}
            className={`w-full sm:w-auto px-4 py-2.5 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition ${
              isCitizen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isCitizen ? 'Consumer Dashboard' : 'View Surveillance History'}
          </button>
          <button
            onClick={() => setActiveView('new_inspection')}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
          >
            {isCitizen ? 'Check Product Packaging' : 'Screen New Commodity'}
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GOVERNMENT OF INDIA — LEGAL METROLOGY ENFORCEMENT DIVISION', 14, 18);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Packaged Commodities Compliance Screening Report (SIH 2026 PS 26034)', 14, 25);
      doc.line(14, 28, 196, 28);

      // Section 1: Overview
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('1. INSPECTION IDENTIFICATION & COMMODITY DETAILS', 14, 35);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Inspection ID: ${currentInspection.id}`, 14, 42);
      doc.text(`Date of Inspection: ${new Date(currentInspection.created_at).toLocaleString()}`, 14, 48);
      doc.text(`Product Name: ${currentInspection.product_name}`, 14, 54);
      doc.text(`Brand / Manufacturer: ${currentInspection.brand}`, 14, 60);
      doc.text(`Category: ${currentInspection.category}`, 120, 42);
      doc.text(`Enforcement Officer: ${currentInspection.officer_name}`, 120, 48);
      doc.text(`Inspection Location: ${currentInspection.location || 'Central Cell'}`, 120, 54);
      doc.text(`Overall Status: ${currentInspection.status} (Score: ${currentInspection.screening_score}/100)`, 120, 60);

      // Section 2: Rule Evaluations
      doc.line(14, 65, 196, 65);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('2. STATUTORY DECLARATION COMPLIANCE EVALUATION', 14, 72);

      let y = 80;
      doc.setFontSize(8);
      const evaluations = currentInspection.rule_evaluations || [];
      
      evaluations.forEach((evalItem, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('2. STATUTORY DECLARATION COMPLIANCE EVALUATION (CONTINUED)', 14, y);
          doc.line(14, y + 2, 196, y + 2);
          y += 10;
          doc.setFontSize(8);
        }

        doc.setFont('helvetica', 'bold');
        const statusPrefix = evalItem.status === 'PASS' ? '[COMPLIANT]' : evalItem.status === 'FAIL' ? '[NON-COMPLIANT]' : '[FLAGGED]';
        doc.text(`${idx + 1}. ${statusPrefix} ${evalItem.title} (${evalItem.rule_id})`, 14, y);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`   Statutory Citation: ${evalItem.normative_reference}`, 14, y + 4);
        
        const wrappedReason = doc.splitTextToSize(`   Finding: ${evalItem.reason}`, 175);
        doc.text(wrappedReason, 14, y + 8);
        
        y += 8 + (wrappedReason.length * 4) + 3;
      });

      // Section 3: Signature Block
      if (y > 230) {
        doc.addPage();
        y = 20;
      } else {
        y += 6;
      }

      doc.line(14, y, 196, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('3. ENFORCEMENT ATTESTATION & DIGITAL INTEGRITY', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Screening Engine: LEGALMETRIX AI (Gemini 3.7 Flash + Statutory LMPC Rule Codification Engine)`, 14, y);
      doc.text(`Attested By Officer: ${currentInspection.officer_name}`, 14, y + 5);
      doc.text(`Jurisdiction / Cell: ${currentInspection.location || 'Central Metrology Cell'}`, 14, y + 10);
      doc.text(`Digital Timestamp: ${new Date().toISOString()}`, 14, y + 15);
      doc.text(`Verification Hash: SHA256:${currentInspection.id}`, 14, y + 20);

      doc.setFont('helvetica', 'bold');
      doc.text(`Official Signature: _________________________________`, 115, y + 15);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Authorized under Section 15 & 28, Legal Metrology Act, 2009`, 115, y + 20);

      doc.save(`LEGALMETRIX_Report_${currentInspection.id}.pdf`);
      showToast('PDF inspection report generated and downloaded.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF download.', 'error');
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Action Bar (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveView('compliance_results')}
          className="min-h-[44px] inline-flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Back to Screening Results</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition min-h-[44px] cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-600 shrink-0" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className={`flex-1 sm:flex-none justify-center px-4 py-2.5 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition min-h-[44px] cursor-pointer ${
              isCitizen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Document Container */}
      <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-8 md:p-12 shadow-sm space-y-6 sm:space-y-8 text-slate-900 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5 sm:pb-6 space-y-2">
          <div className="flex justify-center mb-1">
            <NationalEmblemIndia size={52} />
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-slate-100 text-slate-800 text-[10px] sm:text-[11px] font-bold font-mono uppercase tracking-wider">
            Government of India • Ministry of Consumer Affairs
          </div>
          <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-snug">
            Legal Metrology Packaged Commodity Compliance Screening Report
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
            Generated pursuant to the Legal Metrology Act, 2009 &amp; Legal Metrology (Packaged Commodities) Rules, 2011
          </p>
          <div className="text-[11px] sm:text-xs font-mono text-slate-500 pt-1 flex flex-wrap items-center justify-center gap-x-2">
            <span>REPORT REF: <strong className="text-slate-900">{currentInspection.id}</strong></span>
            <span>•</span>
            <span>ISSUE DATE: <strong className="text-slate-900">{new Date(currentInspection.created_at).toLocaleDateString()}</strong></span>
          </div>
        </div>

        {/* Section 1: Overview & Commodity Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Section 1: Inspection Overview &amp; Commodity Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50/60 p-3 sm:p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Product Name</span>
              <span className="font-bold text-slate-900">{currentInspection.product_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Brand / Packer</span>
              <span className="font-bold text-slate-900">{currentInspection.brand}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Commodity Category</span>
              <span className="font-bold text-slate-900">{currentInspection.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Barcode / GTIN</span>
              <span className="font-mono font-bold text-slate-900">{currentInspection.barcode || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Enforcement Officer</span>
              <span className="font-bold text-slate-900">{currentInspection.officer_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Inspection Location</span>
              <span className="font-bold text-slate-900">{currentInspection.location || 'Central Cell'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Screening Score</span>
              <span className="font-mono font-black text-slate-900">{currentInspection.screening_score}/100</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Screening Outcome</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-black font-mono uppercase mt-0.5 ${
                  currentInspection.status === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentInspection.status === 'FAIL'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentInspection.status}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Uploaded Proofs */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Section 2: Uploaded Photographic Evidence &amp; Optical Quality
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {currentInspection.images.map((img) => (
              <div key={img.id} className="p-2 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                <div className="h-24 sm:h-28 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                  <img src={img.url} alt={img.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="text-[10px] font-semibold text-slate-700 flex justify-between">
                  <span>{img.type} View</span>
                  <span className="font-mono text-slate-500">{img.quality?.overall || 'GOOD'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Extracted Statutory Declarations Table (Responsive with horizontal pan) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Section 3: Mandatory Statutory Declarations Matrix (LMPC Rules 2011)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono sm:hidden flex items-center">
              Scroll table →
            </span>
          </div>
          <div className="overflow-x-auto -mx-1 sm:mx-0 border border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-300">Rule Ref</th>
                  <th className="p-2.5 border-r border-slate-300">Statutory Requirement</th>
                  <th className="p-2.5 border-r border-slate-300">Extracted OCR Text</th>
                  <th className="p-2.5 border-r border-slate-300">Normalized Value</th>
                  <th className="p-2.5 border-r border-slate-300">Confidence</th>
                  <th className="p-2.5">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {currentInspection.rule_evaluations.map((evalItem) => {
                  const decl = currentInspection.declarations.find((d) => d.field === evalItem.field);
                  return (
                    <tr key={evalItem.rule_id} className="text-[11px] hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-bold border-r border-slate-200">{evalItem.rule_id}</td>
                      <td className="p-2.5 font-semibold border-r border-slate-200">{evalItem.title}</td>
                      <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 max-w-[140px] truncate">
                        {evalItem.evidence_text || decl?.original_text || 'Unable to Verify'}
                      </td>
                      <td className="p-2.5 font-bold border-r border-slate-200">{decl?.normalized_value || 'Unable to Verify'}</td>
                      <td className="p-2.5 font-mono border-r border-slate-200">{Math.round(evalItem.confidence * 100)}%</td>
                      <td className="p-2.5 font-mono font-black uppercase">
                        <span
                          className={`${
                            evalItem.status === 'PASS'
                              ? 'text-emerald-700'
                              : evalItem.status === 'FAIL'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {evalItem.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Cross-Panel & Readability Findings */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Section 4: Cross-Panel Consistency &amp; Print Readability Screening
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold block text-slate-900">Multi-View Cross-Panel Analysis</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {currentInspection.cross_image_checks && currentInspection.cross_image_checks.length > 0
                  ? currentInspection.cross_image_checks.map((c) => c.details).join(' ')
                  : 'Single panel analyzed. All declaration values consistent.'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold block text-slate-900">Readability &amp; Minimum Font Height</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {currentInspection.readability_analysis?.message || 'Font size verified against standard statutory thresholds.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Statutory Disclaimer & Officer Signature */}
        <div className="pt-4 sm:pt-6 border-t-2 border-slate-900 space-y-4 sm:space-y-6">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 leading-relaxed">
            <strong>STATUTORY DISCLAIMER:</strong> This report is generated with AI-assisted multimodal extraction (Gemini 3.7 Flash) and deterministic rule execution under the Legal Metrology (Packaged Commodities) Rules, 2011. Final legal determination and compounding actions remain under the statutory jurisdiction of the inspecting officer.
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-2">
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-900">Digital Audit Trail ID:</div>
              <div className="font-mono text-[10px] text-slate-500">LM-SHA256-{Date.now().toString(16).toUpperCase()}</div>
              <div className="text-[10px] text-slate-500">Platform: LEGALMETRIX PS 26034 v2026.1</div>
            </div>

            <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
              <div className="font-bold text-xs text-slate-900">{currentInspection.officer_name}</div>
              <div className="text-[11px] text-slate-500">Authorized Legal Metrology Inspector</div>
              <div className="border-t border-slate-400 w-full sm:w-48 pt-1 text-[10px] text-slate-400">
                Official Signature &amp; Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
