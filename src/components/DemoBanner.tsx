import React from 'react';
import { useApp } from '../context/AppContext';
import { fetchInspectionById } from '../services/api';
import { Sparkles, CheckCircle2, XCircle, AlertTriangle, Layers, RefreshCw } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { viewInspection, showToast } = useApp();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const loadDemo = async (id: string, name: string) => {
    try {
      setLoadingId(id);
      const inspection = await fetchInspectionById(id);
      viewInspection(inspection, 'compliance_results');
      showToast(`Loaded ${name} dataset into screening view.`, 'info');
    } catch (err) {
      showToast(`Failed to load ${name}. Make sure backend is running.`, 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-white px-3 sm:px-6 py-2 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300 shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider font-mono shrink-0">
            <Sparkles className="h-3 w-3 mr-1 text-blue-400 shrink-0" />
            SIH 2026 Test Suite
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">
            Quick-load calibrated test packages:
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 flex-nowrap md:flex-wrap">
          {/* Demo 1: Compliant */}
          <button
            id="btn-demo-compliant"
            disabled={!!loadingId}
            onClick={() => loadDemo('INS-2026-00101', 'Demo 1 (Compliant)')}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 transition disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Demo 1: Compliant (PASS)</span>
          </button>

          {/* Demo 2: Missing CC */}
          <button
            id="btn-demo-violation"
            disabled={!!loadingId}
            onClick={() => loadDemo('INS-2026-00102', 'Demo 2 (Violation)')}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span>Demo 2: Violation (FAIL)</span>
          </button>

          {/* Demo 3: Low OCR / Ambiguous */}
          <button
            id="btn-demo-review"
            disabled={!!loadingId}
            onClick={() => loadDemo('INS-2026-00103', 'Demo 3 (Ambiguous)')}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded text-xs font-semibold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 transition disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Demo 3: Ambiguous (REVIEW)</span>
          </button>

          {/* Demo 4: Contradiction */}
          <button
            id="btn-demo-contradiction"
            disabled={!!loadingId}
            onClick={() => loadDemo('INS-2026-00104', 'Demo 4 (Contradiction)')}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded text-xs font-semibold bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/80 transition disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <Layers className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span>Demo 4: Contradiction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
