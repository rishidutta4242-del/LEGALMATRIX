import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  HardDrive,
  Loader2,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { AiAnalysisStatus } from '../types/index';

export type LocalOcrEngineState = 'queued' | 'preprocessing' | 'running' | 'completed' | 'skipped' | 'error';
export type GeminiEngineState = 'waiting' | 'running' | 'completed' | 'fallback_local' | 'skipped' | 'error';

export interface DualEngineScanTelemetry {
  scanId?: string;
  productName?: string;
  currentStageIndex: number; // 0..5
  stageDetail?: string;
  ocrState: LocalOcrEngineState;
  ocrProgress: number; // 0..100
  ocrLanguage?: string;
  ocrPanelsCount?: number;
  ocrLinesCount?: number;
  ocrAvgConfidence?: number; // 0..1
  ocrDurationMs?: number;
  geminiState: GeminiEngineState;
  geminiModel?: string;
  aiStatus?: AiAnalysisStatus;
  advisoryMessage?: string | null;
  error?: string | null;
}

interface DualEngineScanMonitorProps {
  telemetry: DualEngineScanTelemetry;
  variant?: 'modal' | 'inline';
  onDismiss?: () => void;
}

const PIPELINE_STEPS = [
  {
    title: 'Image Upload & Digest',
    desc: 'Validating format, generating scan ID, and deduplicating SHA-256 digest',
  },
  {
    title: 'Optical Preprocessing',
    desc: 'Auto-resizing, BT.709 grayscale, contrast stretch, denoising & deskewing',
  },
  {
    title: 'Tesseract.js Local OCR',
    desc: 'Browser-side text extraction with word-level bounding coordinates',
  },
  {
    title: 'Declaration Parsing',
    desc: 'Structured regex extraction for MRP, net quantity, dates & manufacturer',
  },
  {
    title: 'LMPC Rules & Gemini Analysis',
    desc: 'Deterministic Schedule II rule evaluation & optional Gemini semantic enrichment',
  },
  {
    title: 'Report & Cache Persistence',
    desc: 'Saving compliance findings, evidence overlays, and IndexedDB offline cache',
  },
];

function getOcrStatusMeta(state: LocalOcrEngineState) {
  switch (state) {
    case 'completed':
      return {
        label: 'Completed',
        textClass: 'text-emerald-400',
        lightTextClass: 'text-emerald-700',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
      };
    case 'running':
    case 'preprocessing':
      return {
        label: state === 'preprocessing' ? 'Preprocessing' : 'Extracting',
        textClass: 'text-blue-400',
        lightTextClass: 'text-blue-700',
        icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />,
      };
    case 'error':
      return {
        label: 'Failed',
        textClass: 'text-red-400',
        lightTextClass: 'text-red-700',
        icon: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />,
      };
    case 'skipped':
      return {
        label: 'Preset Dataset',
        textClass: 'text-slate-300',
        lightTextClass: 'text-slate-600',
        icon: <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />,
      };
    default:
      return {
        label: 'Queued',
        textClass: 'text-slate-400',
        lightTextClass: 'text-slate-500',
        icon: <HardDrive className="h-4 w-4 text-slate-400 shrink-0" />,
      };
  }
}

function getGeminiStatusMeta(state: GeminiEngineState) {
  switch (state) {
    case 'completed':
      return {
        label: 'AI Enrichment Complete',
        textClass: 'text-emerald-400',
        lightTextClass: 'text-emerald-700',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
      };
    case 'running':
      return {
        label: 'Analyzing Semantics',
        textClass: 'text-indigo-300',
        lightTextClass: 'text-indigo-700',
        icon: <Loader2 className="h-4 w-4 text-indigo-400 animate-spin shrink-0" />,
      };
    case 'fallback_local':
      return {
        label: 'Fallback to Local OCR',
        textClass: 'text-amber-300',
        lightTextClass: 'text-amber-700',
        icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
      };
    case 'skipped':
      return {
        label: 'Local Mode Active',
        textClass: 'text-amber-300',
        lightTextClass: 'text-amber-700',
        icon: <WifiOff className="h-4 w-4 text-amber-500 shrink-0" />,
      };
    case 'error':
      return {
        label: 'Unavailable',
        textClass: 'text-amber-300',
        lightTextClass: 'text-amber-700',
        icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
      };
    default:
      return {
        label: 'Waiting for Local OCR',
        textClass: 'text-slate-400',
        lightTextClass: 'text-slate-500',
        icon: <Sparkles className="h-4 w-4 text-slate-400 shrink-0" />,
      };
  }
}

export const DualEngineScanMonitor: React.FC<DualEngineScanMonitorProps> = ({
  telemetry,
  variant = 'modal',
  onDismiss,
}) => {
  const isModal = variant === 'modal';
  const clampedStage = Math.max(0, Math.min(PIPELINE_STEPS.length - 1, telemetry.currentStageIndex));
  const clampedOcrPct = Math.max(0, Math.min(100, Math.round(telemetry.ocrProgress || 0)));

  const ocrMeta = getOcrStatusMeta(telemetry.ocrState);
  const geminiMeta = getGeminiStatusMeta(telemetry.geminiState);
  const isFallbackTransparent =
    telemetry.geminiState === 'fallback_local' ||
    telemetry.geminiState === 'skipped' ||
    telemetry.aiStatus === 'UNAVAILABLE' ||
    telemetry.aiStatus === 'CONFIG_ERROR' ||
    telemetry.aiStatus === 'SKIPPED';

  return (
    <div
      className={
        isModal
          ? 'space-y-4 text-white'
          : 'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xs overflow-hidden'
      }
    >
      {/* Inline Header (only shown when mounted inline on workspace views) */}
      {!isModal && (
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Cpu className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                Dual-Engine OCR &amp; AI Pipeline Monitor
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>{telemetry.productName || 'Packaged Commodity'}</span>
                {telemetry.scanId && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{telemetry.scanId}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Dual Engine Real-Time Track Split */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 border rounded-xl overflow-hidden ${
          isModal
            ? 'border-slate-700/90 bg-slate-950/60 divide-y sm:divide-y-0 sm:divide-x divide-slate-800'
            : 'border-slate-200 mx-4 mt-4 bg-slate-50/70 divide-y sm:divide-y-0 sm:divide-x divide-slate-200'
        }`}
      >
        {/* Track 1: Tesseract.js Local OCR */}
        <div className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {ocrMeta.icon}
              <span className={`text-xs font-semibold truncate ${isModal ? 'text-slate-100' : 'text-slate-900'}`}>
                Tesseract.js (Local OCR)
              </span>
            </div>
            <span
              className={`text-xs font-mono tabular-nums font-semibold whitespace-nowrap shrink-0 ${
                isModal ? ocrMeta.textClass : ocrMeta.lightTextClass
              }`}
            >
              {ocrMeta.label} · {clampedOcrPct}%
            </span>
          </div>

          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isModal ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className={`h-full transition-all duration-200 ${
                telemetry.ocrState === 'completed'
                  ? 'bg-emerald-500'
                  : telemetry.ocrState === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max(telemetry.ocrState === 'queued' ? 4 : clampedOcrPct, 4)}%` }}
            />
          </div>

          <div
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono tabular-nums ${
              isModal ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span>Lang: {telemetry.ocrLanguage || 'eng'}</span>
            {typeof telemetry.ocrPanelsCount === 'number' && telemetry.ocrPanelsCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{telemetry.ocrPanelsCount} panel(s)</span>
              </>
            )}
            {typeof telemetry.ocrLinesCount === 'number' && telemetry.ocrLinesCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{telemetry.ocrLinesCount} lines</span>
              </>
            )}
            {typeof telemetry.ocrAvgConfidence === 'number' && telemetry.ocrAvgConfidence > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>Conf: {Math.round(telemetry.ocrAvgConfidence * 100)}%</span>
              </>
            )}
            {typeof telemetry.ocrDurationMs === 'number' && telemetry.ocrDurationMs > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{telemetry.ocrDurationMs}ms</span>
              </>
            )}
          </div>
        </div>

        {/* Track 2: Gemini API Semantic AI Analysis */}
        <div className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {geminiMeta.icon}
              <span className={`text-xs font-semibold truncate ${isModal ? 'text-slate-100' : 'text-slate-900'}`}>
                Gemini API (AI Analysis)
              </span>
            </div>
            <span
              className={`text-xs font-mono font-semibold whitespace-nowrap shrink-0 ${
                isModal ? geminiMeta.textClass : geminiMeta.lightTextClass
              }`}
            >
              {geminiMeta.label}
            </span>
          </div>

          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isModal ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className={`h-full transition-all duration-200 ${
                telemetry.geminiState === 'completed'
                  ? 'bg-emerald-500 w-full'
                  : telemetry.geminiState === 'running'
                  ? 'bg-indigo-400 w-2/3'
                  : isFallbackTransparent
                  ? 'bg-amber-500 w-full'
                  : 'bg-slate-600 w-1/6'
              }`}
            />
          </div>

          <div
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono ${
              isModal ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span>Model: {telemetry.geminiModel || 'gemini-4-hydrogen'}</span>
            <span aria-hidden="true">·</span>
            <span>
              {telemetry.geminiState === 'completed'
                ? 'Hybrid OCR + AI merged'
                : isFallbackTransparent
                ? 'Local OCR + Rules preserved'
                : telemetry.geminiState === 'running'
                ? 'Evaluating declarations'
                : 'Runs after local OCR'}
            </span>
          </div>
        </div>
      </div>

      {/* Transparent Local Fallback Advisory Banner */}
      {isFallbackTransparent && !telemetry.error && (
        <div
          className={`rounded-xl border p-3 text-xs flex items-start gap-2.5 ${
            isModal
              ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
              : 'mx-4 bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <AlertTriangle
            className={`h-4 w-4 shrink-0 mt-0.5 ${isModal ? 'text-amber-400' : 'text-amber-600'}`}
          />
          <div className="space-y-0.5">
            <div className="font-semibold">
              {telemetry.geminiState === 'skipped'
                ? 'Offline / Local-Only Processing Active'
                : 'Automatic Fallback to Local Processing'}
            </div>
            <p className={isModal ? 'text-amber-200/90 leading-relaxed' : 'text-amber-800 leading-relaxed'}>
              {telemetry.advisoryMessage ||
                'AI-assisted analysis is temporarily unavailable. Local Tesseract.js OCR and deterministic Legal Metrology validation are continuing with all extracted fields and bounding boxes preserved.'}
            </p>
          </div>
        </div>
      )}

      {/* 6-Stage Execution Timeline */}
      {!telemetry.error && (
        <div className={isModal ? 'divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden' : 'divide-y divide-slate-200 border-t border-slate-200 mt-4'}>
          {PIPELINE_STEPS.map((step, idx) => {
            const isDone =
              clampedStage > idx ||
              (idx === PIPELINE_STEPS.length - 1 &&
                telemetry.ocrState === 'completed' &&
                (telemetry.geminiState === 'completed' || isFallbackTransparent) &&
                clampedStage === PIPELINE_STEPS.length - 1);
            const isCurrent = clampedStage === idx && !isDone;

            return (
              <div
                key={step.title}
                className={`flex items-start gap-3 px-3.5 py-2.5 transition-colors ${
                  isCurrent
                    ? isModal
                      ? 'bg-blue-950/40 text-blue-100'
                      : 'bg-blue-50/70 text-slate-900'
                    : isDone
                    ? isModal
                      ? 'bg-slate-900/40 text-slate-300'
                      : 'bg-white text-slate-700'
                    : isModal
                    ? 'bg-slate-950/20 text-slate-500'
                    : 'bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : (
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-mono tabular-nums ${
                        isModal ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">
                      {idx + 1}. {step.title}
                    </span>
                    {idx === 2 && (isCurrent || isDone) && (
                      <span
                        className={`text-[11px] font-mono tabular-nums font-semibold shrink-0 ${
                          isModal ? 'text-blue-300' : 'text-blue-700'
                        }`}
                      >
                        {isDone ? '100%' : `${clampedOcrPct}%`}
                      </span>
                    )}
                    {idx === 4 && isFallbackTransparent && (isCurrent || isDone) && (
                      <span
                        className={`text-[11px] font-mono font-semibold shrink-0 ${
                          isModal ? 'text-amber-300' : 'text-amber-700'
                        }`}
                      >
                        Local Fallback
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isModal ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isCurrent && telemetry.stageDetail ? telemetry.stageDetail : step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
