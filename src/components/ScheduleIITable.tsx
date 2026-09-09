import React from 'react';
import { SCHEDULE_II_STANDARDS } from '../data/scheduleII';
import { Scale, Info, CheckCircle2 } from 'lucide-react';

interface ScheduleIITableProps {
  highlightCurrentStandard?: boolean;
  showStatutoryNotes?: boolean;
}

export const ScheduleIITable: React.FC<ScheduleIITableProps> = ({
  highlightCurrentStandard = true,
  showStatutoryNotes = true,
}) => {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1 sm:mx-0 border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse min-w-[640px]">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-center w-12">No.</th>
              <th className="p-3">Net Quantity Range</th>
              <th className="p-3">Principal Display Area (PDA)</th>
              <th className="p-3 font-semibold text-blue-900 bg-blue-50/50">
                Min. Height (Normal)
              </th>
              <th className="p-3 font-semibold text-slate-800">
                Min. Height (Blown / Moulded / Perforated)
              </th>
              {showStatutoryNotes && <th className="p-3">Statutory Applicability</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {SCHEDULE_II_STANDARDS.map((row) => {
              const isDefaultStandard = highlightCurrentStandard && row.serialNo === 2;
              return (
                <tr
                  key={row.serialNo}
                  className={`hover:bg-slate-50 transition ${
                    isDefaultStandard ? 'bg-blue-50/40 font-medium' : ''
                  }`}
                >
                  <td className="p-3 font-mono text-center font-bold text-slate-500">
                    {row.serialNo}
                  </td>
                  <td className="p-3 font-medium text-slate-900">
                    <div className="flex items-center space-x-1.5">
                      <span>{row.netQuantityRange}</span>
                      {isDefaultStandard && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold uppercase tracking-wider">
                          Primary FMCG Range
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {row.pdaRange}
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-700 bg-blue-50/30">
                    {row.minHeightNormalMm.toFixed(1)} mm
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {row.minHeightBlownMm.toFixed(1)} mm
                  </td>
                  {showStatutoryNotes && (
                    <td className="p-3 text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      {row.statutoryNotes}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-lg text-[11px] text-blue-900 flex items-start space-x-2">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Rule 7(1) Statutory Reference:</strong> The minimum height of any numeral and letter in the declaration shall not be less than the values specified in Schedule II. When physical calibration is active (via INR 5 reference standard or package dimensions), pixel heights are converted to millimeters and audited against these exact statutory thresholds.
        </p>
      </div>
    </div>
  );
};
