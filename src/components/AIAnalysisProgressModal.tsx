import React, { useState, useEffect } from 'react';
import { Cpu, AlertCircle, RefreshCw, Sparkles, X } from 'lucide-react';
import {
  DualEngineScanMonitor,
  DualEngineScanTelemetry,
} from './DualEngineScanMonitor';

interface AIAnalysisProgressModalProps {
  isOpen: boolean;
  onComplete?: () => void;
  productName: string;
  currentStageIndex?: number;
  ocrProgress?: number;
  stageDetail?: string;
  advisoryMessage?: string | null;
  telemetry?: DualEngineScanTelemetry;
  error?: string | null;
  onRetry?: () => void;
  onFallbackSample?: () => void;
  onCancel?: () => void;
}

export const AIAnalysisProgressModal: React.FC<AIAnalysisProgressModalProps> = ({
  isOpen,
  productName,
  currentStageIndex,
  ocrProgress = 0,
  stageDetail,
  advisoryMessage,
  telemetry,
  error,
  onRetry,
  onFallbackSample,
  onCancel,
}) => {
  const [fallbackStep, setFallbackStep] = useState<number>(0);

  const isControlled = typeof currentStageIndex === 'number';
  const activeStep = isControlled
    ? Math.max(0, Math.min(5, currentStageIndex))
    : fallbackStep;

  useEffect(() => {
    if (!isOpen) {
      setFallbackStep(0);
      return;
    }
    if (isControlled || telemetry || error) return;

    const interval = setInterval(() => {
      setFallbackStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 900);

    return () => clearInterval(interval);
  }, [isOpen, isControlled, telemetry, error]);

  if (!isOpen) return null;

  const resolvedTelemetry: DualEngineScanTelemetry = telemetry || {
    productName,
    currentStageIndex: activeStep,
    stageDetail,
    ocrState:
      error
        ? 'error'
        : activeStep >= 3
        ? 'completed'
        : activeStep === 2
        ? 'running'
        : activeStep === 1
        ? 'preprocessing'
        : 'queued',
    ocrProgress: activeStep >= 3 ? 100 : ocrProgress,
    geminiState:
      advisoryMessage
        ? 'fallback_local'
        : activeStep >= 5
        ? 'completed'
        : activeStep === 4
        ? 'running'
        : 'waiting',
    advisoryMessage,
    error,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                error
                  ? 'bg-red-950/60 border-red-500/40 text-red-400'
                  : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
              }`}
            >
              {error ? <AlertCircle className="h-6 w-6 text-red-400" /> : <Cpu className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">
                {error ? 'Screening Pipeline Alert' : 'Dual-Engine OCR & Compliance Scan'}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                {productName || 'Packaged Commodity'}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              title="Close / Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Error Notification Card */}
        {error ? (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-xs space-y-3">
            <div className="text-red-200 leading-relaxed font-mono">{error}</div>
            <p className="text-slate-300 text-[11px]">
              Local OCR extraction and deterministic validation can still run independently. You can retry the scan or inspect a calibrated sample commodity.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Analysis</span>
                </button>
              )}
              {onFallbackSample && (
                <button
                  onClick={onFallbackSample}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Load Sample Verification</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <DualEngineScanMonitor telemetry={resolvedTelemetry} variant="modal" />
        )}

        {/* Footer Note */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <span>Primary OCR: Tesseract.js (Local Browser)</span>
          <span className="font-mono text-blue-400">Rule Engine v2026.1 (LMPC 2011)</span>
        </div>
      </div>
    </div>
  );
};
