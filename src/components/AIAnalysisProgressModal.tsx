import React, { useState, useEffect } from 'react';
import { Loader2, Cpu, Check, AlertCircle, RefreshCw, Sparkles, X } from 'lucide-react';

interface AIAnalysisProgressModalProps {
  isOpen: boolean;
  onComplete?: () => void;
  productName: string;
  error?: string | null;
  onRetry?: () => void;
  onFallbackSample?: () => void;
  onCancel?: () => void;
}

export const AIAnalysisProgressModal: React.FC<AIAnalysisProgressModalProps> = ({
  isOpen,
  productName,
  error,
  onRetry,
  onFallbackSample,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    { title: 'Optical Pre-processing & Quality Filter', desc: 'Evaluating resolution, lighting contrast, perspective tilt, and edge sharpness' },
    { title: 'Gemini Multimodal Entity Extraction', desc: 'Extracting 20 mandatory statutory Legal Metrology declaration regions' },
    { title: 'Normalization & Metric Standardization', desc: 'Standardizing MRP price inclusivity, metric units (g/kg/ml), and packing date' },
    { title: 'Deterministic LMPC Rule Engine', desc: 'Evaluating declarations against Schedule II font height & Rule 6 requirements' },
    { title: 'Cross-Panel Consistency & Evidence Assembly', desc: 'Verifying Front vs Back label agreement and mapping visual bounding markers' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    if (error) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen, error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
              error
                ? 'bg-red-950/60 border-red-500/40 text-red-400'
                : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
            }`}>
              {error ? <AlertCircle className="h-6 w-6 text-red-400" /> : <Cpu className="h-6 w-6 animate-pulse" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {error ? 'Screening Pipeline Alert' : 'AI Multimodal Screening in Progress'}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs">
                {productName || 'Packaged Commodity'}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close / Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Error Notification Card */}
        {error ? (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-xs space-y-3">
            <div className="text-red-200 leading-relaxed font-mono">
              {error}
            </div>
            <p className="text-slate-300 text-[11px]">
              The multimodal inference model did not respond within the maximum threshold. You can retry with increased timeout, or instantly load pre-screened sample compliance results.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Analysis</span>
                </button>
              )}
              {onFallbackSample && (
                <button
                  onClick={onFallbackSample}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Load Sample Verification</span>
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Stepper list */
          <div className="space-y-3 py-1">
            {steps.map((step, idx) => {
              const isDone = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-start space-x-3 p-2.5 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-blue-950/50 border border-blue-500/40 text-blue-100'
                      : isDone
                      ? 'bg-slate-800/40 text-slate-300'
                      : 'opacity-40 text-slate-500'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold">{step.title}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>AI Engine: Gemini 2.5 Flash / Flash Lite</span>
          <span className="font-mono text-blue-400">Rule Engine v2026.1 (LMPC 2011)</span>
        </div>
      </div>
    </div>
  );
};

