import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { verifyInspection } from '../services/api';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowLeft,
  CameraOff,
  PackageOpen,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Gavel
} from 'lucide-react';

export const EvidenceViewer: React.FC = () => {
  const {
    currentInspection,
    setCurrentInspection,
    selectedEvidenceField,
    setSelectedEvidenceField,
    officerName,
    officerRole,
    showToast,
    setActiveView
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [officerNote, setOfficerNote] = useState<string>('');

  // Overall Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideStatus, setOverrideStatus] = useState<'PASS' | 'FAIL' | 'REVIEW'>('PASS');
  const [overrideRemarks, setOverrideRemarks] = useState<string>('');

  if (!currentInspection || !currentInspection.images || currentInspection.images.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 space-y-4 shadow-xl">
        <CameraOff className="h-12 w-12 mx-auto text-amber-400" />
        <h2 className="text-lg font-bold text-white">Incomplete Evidence Capture</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No package label images are archived for this inspection record ({currentInspection?.id || 'New'}). Please capture or attach packaging panels before conducting optical evidence review.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={() => setActiveView('compliance_results')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            ← Return to Compliance Screen
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeImage = currentInspection.images[activeImageIndex] || currentInspection.images[0];
  const isNoPackageDetected =
    currentInspection.status === 'NO_PACKAGE_DETECTED' ||
    currentInspection.is_package_detected === false ||
    activeImage?.quality?.issues?.some((issue) => issue.toLowerCase().includes('no statutory package') || issue.toLowerCase().includes('no package'));

  // Filter declarations for this active image
  const declarationsOnImage = currentInspection.declarations.filter(
    (d) => d.image_id === activeImage.id || d.image_type === activeImage.type || !d.image_id
  );

  const selectedDeclaration = currentInspection.declarations.find(
    (d) => d.field === selectedEvidenceField
  ) || currentInspection.declarations[0];

  const selectedEvaluation = currentInspection.rule_evaluations.find(
    (r) => r.field === selectedDeclaration?.field
  );

  const handleVerifyDeclaration = async (status: 'PASS' | 'FAIL' | 'REVIEW') => {
    if (!selectedEvaluation) return;

    try {
      const res = await verifyInspection(currentInspection.id, {
        rule_id: selectedEvaluation.rule_id,
        status,
        reason: officerNote || `Officer verified as ${status}`,
        officer_name: officerName
      });
      setCurrentInspection(res.inspection);
      showToast(`Rule ${selectedEvaluation.rule_id} marked as ${status} (Score updated: ${res.inspection.screening_score}%).`, 'success');
      setOfficerNote('');
    } catch (err) {
      showToast('Failed to record verification.', 'error');
    }
  };

  const handleApplyOverallOverride = async () => {
    try {
      const res = await verifyInspection(currentInspection.id, {
        overall_status: overrideStatus,
        status: overrideStatus,
        reason: overrideRemarks || 'Enforcement Officer statutory determination from Visual Evidence chain',
        officer_name: officerName,
        officer_role: officerRole,
        general_remarks: overrideRemarks
      });
      setCurrentInspection(res.inspection);
      setShowOverrideModal(false);
      setOverrideRemarks('');
      showToast(`Overall inspection overridden to ${overrideStatus} (Score: ${res.inspection.screening_score}%).`, 'success');
    } catch (err) {
      showToast('Failed to record statutory override.', 'error');
    }
  };

  const passCount = currentInspection.rule_evaluations.filter((r) => r.status === 'PASS').length;
  const failCount = currentInspection.rule_evaluations.filter((r) => r.status === 'FAIL').length;
  const reviewCount = currentInspection.rule_evaluations.filter((r) => r.status === 'REVIEW').length;

  const zoomIn = () => setZoomLevel((z) => Math.min(4, Number((z + 0.5).toFixed(1))));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.5, Number((z - 0.5).toFixed(1))));
  const resetZoom = () => setZoomLevel(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveView('compliance_results')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Results</span>
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {currentInspection.id}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">• Visual Evidence Chain &amp; OCR Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentInspection.product_name}
          </h1>
        </div>

        {/* View Switcher Tabs (Front / Back / Side) */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {currentInspection.images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeImageIndex === idx
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{img.type} View</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Status & Unified Enforcement Override Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Live Status:</span>
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                currentInspection.status === 'PASS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentInspection.status === 'FAIL'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentInspection.status === 'PASS' ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : currentInspection.status === 'FAIL' ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              <span>{currentInspection.status}</span>
            </span>
          </div>

          {/* Compliance Score */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Score:</span>
            <span className="text-xs font-mono font-bold text-slate-900">{currentInspection.screening_score}%</span>
          </div>

          {/* Live Declaration / Rule Counters */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>{passCount} Passed</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
              <XCircle className="h-3 w-3" />
              <span>{failCount} Violations</span>
            </span>
            {reviewCount > 0 && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                <AlertTriangle className="h-3 w-3" />
                <span>{reviewCount} Review</span>
              </span>
            )}
          </div>
        </div>

        {/* Override Entire Inspection Button */}
        <button
          onClick={() => {
            setOverrideStatus(currentInspection.status === 'FAIL' ? 'PASS' : 'FAIL');
            setShowOverrideModal(true);
          }}
          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Gavel className="h-3.5 w-3.5 text-amber-400" />
          <span>Override Entire Inspection</span>
        </button>
      </div>

      {/* No Package Detected Warning Banner */}
      {isNoPackageDetected && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start space-x-3 text-red-900 shadow-xs">
          <PackageOpen className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-red-950">Statutory Pre-Packaged Commodity Not Detected</h3>
            <p className="leading-relaxed text-red-800">
              The optical surveillance pipeline did not detect any pre-packaged commodity or statutory labeling panel in the captured frame. OCR bounding box extraction is withheld to prevent false compliance scoring. Please position the product packaging squarely within the optical sensor frame.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Zoomable Image Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between relative min-h-[580px]">
          {/* Canvas Toolbar */}
          <div className="p-3 bg-slate-950/80 backdrop-blur-xs border-b border-slate-800 text-white flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">
                {activeImage.name} ({activeImage.quality?.resolution || 'HD'})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                disabled={isNoPackageDetected}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  isNoPackageDetected
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                    : showBoundingBoxes
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Bounding Boxes {showBoundingBoxes && !isNoPackageDetected ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={zoomOut}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={zoomIn}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Image Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[460px] relative">
            <div
              className="relative inline-block transition-transform duration-150 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={activeImage.url}
                alt={activeImage.name}
                className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl border border-slate-700 block"
              />

              {/* Bounding Boxes Overlay: Only render valid detected bounding boxes */}
              {showBoundingBoxes &&
                !isNoPackageDetected &&
                declarationsOnImage.map((decl, idx) => {
                  // If declaration was not found or has no bbox, do NOT draw a fake full-width box!
                  if (!decl.bbox || decl.status === 'NOT_FOUND' || decl.found === false) {
                    return null;
                  }

                  const evalItem = currentInspection.rule_evaluations.find((r) => r.field === decl.field);
                  const isSelected = selectedDeclaration?.field === decl.field;
                  const status = evalItem?.status || (decl.status === 'FOUND' ? 'PASS' : 'FAIL');

                  const bbox = decl.bbox;
                  const top = Math.max(0, Math.min(99, bbox.ymin));
                  const left = Math.max(0, Math.min(99, bbox.xmin));
                  const width = Math.max(2, Math.min(100 - left, bbox.xmax - bbox.xmin));
                  const height = Math.max(2, Math.min(100 - top, bbox.ymax - bbox.ymin));

                  const borderColor =
                    status === 'PASS'
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : status === 'FAIL'
                      ? 'border-red-400 bg-red-500/25'
                      : 'border-amber-400 bg-amber-500/25';

                  const badgeColor =
                    status === 'PASS' ? 'bg-emerald-600 text-white' : status === 'FAIL' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white';

                  return (
                    <div
                      key={decl.id || idx}
                      onClick={() => setSelectedEvidenceField(decl.field)}
                      className={`absolute cursor-pointer rounded border-2 transition-all group ${borderColor} ${
                        isSelected ? 'ring-4 ring-blue-400 z-20 scale-102' : 'hover:opacity-90'
                      }`}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                    >
                      <span
                        className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-md whitespace-nowrap ${badgeColor}`}
                      >
                        {decl.label}: {Math.round(decl.confidence * 100)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Canvas Bottom Legend */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Pass</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>Violation</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Review</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Click any mapped box or list item to inspect declaration</span>
          </div>
        </div>

        {/* Right: Field Inspection & Officer Verification Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Declarations selector pill list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Extracted Mandatory Declarations ({currentInspection.declarations.length})
              </h3>
            </div>

            {currentInspection.declarations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                <PackageOpen className="h-6 w-6 mx-auto text-slate-300" />
                <p>No mandatory declarations extracted from this scene.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {currentInspection.declarations.map((decl) => {
                  const evalItem = currentInspection.rule_evaluations.find((r) => r.field === decl.field);
                  const isSelected = selectedDeclaration?.field === decl.field;
                  const status = evalItem?.status || (decl.status === 'FOUND' ? 'PASS' : 'FAIL');
                  const hasOverlay = !!decl.bbox && decl.status !== 'NOT_FOUND' && decl.found !== false;

                  return (
                    <button
                      key={decl.field}
                      onClick={() => setSelectedEvidenceField(decl.field)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-300 text-blue-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            status === 'PASS' ? 'bg-emerald-500' : status === 'FAIL' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        ></span>
                        <span className="truncate">{decl.label}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {hasOverlay ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                            Overlay
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono">
                            No overlay
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500 font-normal">
                          {Math.round(decl.confidence * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Declaration Detail & Officer Audit Card */}
          {selectedDeclaration && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    {selectedEvaluation?.rule_id || 'STATUTORY REQUIREMENT'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{selectedDeclaration.label}</h3>
                </div>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded uppercase ${
                    selectedEvaluation?.status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedEvaluation?.status === 'FAIL'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedEvaluation?.status || 'FOUND'}
                </span>
              </div>

              {/* Text Values */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Raw Extracted OCR Text:</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 break-words mt-1">
                    {selectedDeclaration.original_text || <span className="italic text-slate-400">Declaration not found on label</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Normalized Statutory Value:</span>
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 font-semibold text-blue-900 mt-1">
                    {selectedDeclaration.normalized_value || '—'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Legal Metrology Citation &amp; Evaluation:</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    {selectedEvaluation?.reason || 'Evaluated against Legal Metrology (Packaged Commodities) Rules, 2011.'}
                  </p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    {selectedEvaluation?.normative_reference}
                  </p>
                </div>
              </div>

              {/* Officer Verification Override Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Enforcement Officer Action</span>
                </span>

                <input
                  type="text"
                  placeholder="Enter remarks for this declaration..."
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleVerifyDeclaration('PASS')}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition"
                  >
                    ✓ Pass
                  </button>
                  <button
                    onClick={() => handleVerifyDeclaration('FAIL')}
                    className="py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition"
                  >
                    ✕ Violation
                  </button>
                  <button
                    onClick={() => handleVerifyDeclaration('REVIEW')}
                    className="py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition"
                  >
                    ⚠ Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Officer Overall Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Gavel className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold">Officer Statutory Determination</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Record manual legal determination for this entire inspection. Overriding to <strong>PASS</strong> marks all mandatory declarations as verified and harmonizes the compliance score to 100%.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Determination Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
              >
                <option value="PASS">PASS (Compliant — Overrule All Violations)</option>
                <option value="FAIL">FAIL (Confirmed Statutory Violation / Issue Notice)</option>
                <option value="REVIEW">REVIEW (Lab Sample Testing / Advisory Hold)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Officer Legal Remarks &amp; Statutory Ground</label>
              <textarea
                rows={3}
                placeholder="State statutory rationale under Legal Metrology Act..."
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
                onClick={handleApplyOverallOverride}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Confirm Determination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

