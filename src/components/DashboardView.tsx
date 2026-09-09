import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchDashboardStats } from '../services/api';
import { DashboardStats } from '../types/index';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  PlusCircle,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  Search,
  Building2,
  Calendar,
  Sparkles,
  Info,
  Layers,
  Cpu,
  Download,
  Scale,
  RefreshCw,
  MessageSquare,
  Award,
  FileCheck
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { setActiveView, viewInspection, isOnline, offlineQueueCount, showToast, officerRole } = useApp();
  const isCitizen = officerRole === 'Citizen';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats?.recent_inspections || stats.recent_inspections.length === 0) {
      showToast('No inspection records available to export', 'info');
      return;
    }
    const headers = [
      'Inspection ID',
      'Product Name',
      'Brand',
      'Category',
      'Officer',
      'Screening Score',
      'Compliance Status',
      'Dispute Status',
      'Sync Status',
      'Calibration',
      'Created At'
    ];
    const rows = stats.recent_inspections.map((ins) => [
      `"${ins.id}"`,
      `"${(ins.product_name || '').replace(/"/g, '""')}"`,
      `"${(ins.brand || '').replace(/"/g, '""')}"`,
      `"${ins.category || ''}"`,
      `"${(ins.officer_name || '').replace(/"/g, '""')}"`,
      ins.screening_score,
      ins.status,
      `"${ins.dispute_status || 'NONE'}"`,
      `"${ins.sync_status || 'SYNCED'}"`,
      `"${ins.readability_analysis?.is_calibrated ? 'CALIBRATED' : 'UNCALIBRATED'}"`,
      `"${new Date(ins.created_at).toISOString()}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `legalmetrix_surveillance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Surveillance dataset exported as CSV', 'success');
  };

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200 rounded lg:col-span-2"></div>
          <div className="h-72 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const filteredInspections = stats.recent_inspections.filter(
    (ins) =>
      ins.product_name.toLowerCase().includes(filterText.toLowerCase()) ||
      ins.id.toLowerCase().includes(filterText.toLowerCase()) ||
      ins.brand.toLowerCase().includes(filterText.toLowerCase()) ||
      ins.officer_name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase">
            {isCitizen ? 'Citizen Consumer Vigilance Overview' : 'Legal Metrology Compliance Overview'}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 uppercase tracking-widest font-medium mt-1">
            {isCitizen
              ? 'Consumer Awareness • Statutory Packaging Verification • Rights Under Consumer Protection Act'
              : 'Multimodal AI Extraction • Rule Verification Engine • Statutory Evidence Chain'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {!isCitizen && (
            <button
              id="btn-export-surveillance-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            id="btn-start-new-inspection"
            onClick={() => setActiveView('new_inspection')}
            className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer ${
              isCitizen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isCitizen ? 'Inspect My Product' : 'New Commodity Inspection'}</span>
          </button>
        </div>
      </div>

      {/* Citizen / Consumer Vigilance Notice */}
      {isCitizen && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-2xl border border-emerald-700/40 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Public Citizen Portal Mode</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Consumer Packaging Vigilance &amp; Verification Hub
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Verify pre-packaged retail commodities against mandatory statutory declarations (MRP, Net Quantity, Best Before, Packer address) under the Legal Metrology Act, 2009. Official enforcement overrides and rule configuration are restricted to departmental authorities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setActiveView('new_inspection')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Inspect Packaging Image</span>
            </button>
            <a
              href="https://consumerhelpline.gov.in"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <span>National Helpline (1915)</span>
            </a>
          </div>
        </div>
      )}

      {/* KPI Cards — Geometric Balance Signature Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-5 border-l-4 border-slate-900 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Total Inspections
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {stats.total_inspections}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Market Surveillance</span>
            <span className="font-mono font-bold text-slate-700">{stats.average_screening_score}/100 Avg</span>
          </div>
        </div>

        {/* Card 2: Compliant */}
        <div className="bg-white p-5 border-l-4 border-emerald-500 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Compliant (PASS)
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {stats.compliant_count}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">All Declarations Valid</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
              {stats.total_inspections ? Math.round((stats.compliant_count / stats.total_inspections) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Non-Compliant */}
        <div className="bg-white p-5 border-l-4 border-rose-500 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Non-Compliant (FAIL)
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {stats.non_compliant_count}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">Statutory Violation</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-mono">
              {stats.total_inspections ? Math.round((stats.non_compliant_count / stats.total_inspections) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Needs Review */}
        <div className="bg-white p-5 border-l-4 border-amber-500 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Manual Review
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {stats.review_count}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-medium">Ambiguity / OCR</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
              {stats.review_count} items
            </span>
          </div>
        </div>
      </div>

      {/* Main Visual Layout: Left 2 Cols (Inspections Table) + Right 1 Col (Dark Analytics Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent Inspections Table */}
        <div className="bg-white border border-slate-200 shadow-xs flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">Recent Inspections</h2>
              <p className="text-[11px] text-slate-400 font-medium">Market surveillance batch compliance records</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by product, ID, officer..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-100 tracking-wider">
                  <th className="p-3 pl-4">Inspection ID</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Officer</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Certificate</th>
                  <th className="p-3">Dispute State</th>
                  <th className="p-3">Sync</th>
                  <th className="p-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInspections.map((ins) => (
                  <tr
                    key={ins.id}
                    id={`inspection-row-${ins.id}`}
                    onClick={() => viewInspection(ins, 'compliance_results')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3 pl-4 font-mono font-bold text-blue-600">
                      <div>{ins.id}</div>
                      {ins.readability_analysis?.is_calibrated && (
                        <span className="inline-flex items-center text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 mt-0.5 font-sans font-semibold">
                          <Scale className="h-2.5 w-2.5 mr-0.5" />
                          Calibrated
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{ins.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{ins.brand}</div>
                    </td>
                    <td className="p-3 text-slate-600">{ins.category}</td>
                    <td className="p-3 text-slate-600">{ins.officer_name.split('(')[0]}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{ins.screening_score}/100</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                          ins.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ins.status === 'FAIL'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {ins.certificate_id || (ins.certificate && ins.certificate.certificate_id) ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Award className="h-3 w-3 text-emerald-600 mr-0.5 shrink-0" />
                            <span>{ins.certificate_id || ins.certificate?.certificate_id}</span>
                          </span>
                          <span className="text-[9px] text-emerald-700 font-medium flex items-center">
                            <FileCheck className="h-2.5 w-2.5 mr-0.5 inline" /> Valid Cert
                          </span>
                        </div>
                      ) : ins.status === 'PASS' ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="h-2.5 w-2.5 text-blue-600 mr-0.5" />
                          <span>Eligible</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">
                          None
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded font-mono ${
                          ins.dispute_status === 'RESOLVED_UPHELD'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ins.dispute_status === 'RESOLVED_DISMISSED'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : ins.dispute_status === 'UNDER_MANUFACTURER_REVIEW' || ins.dispute_status === 'OPEN'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {ins.dispute_status || 'NONE'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded font-mono ${
                          ins.sync_status === 'PENDING_SYNC'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {ins.sync_status === 'PENDING_SYNC' ? 'Pending' : 'Synced'}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewInspection(ins, 'compliance_results');
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Dark Analytics & Compliance Health Card */}
        <div className="bg-slate-900 p-6 shadow-xl flex flex-col text-white rounded-xl border border-slate-800 space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Compliance Analytics</div>
            <p className="text-xs text-slate-400 mt-1">Rule Engine validation metrics by commodity category</p>
          </div>

          {/* Category Progress Bars */}
          <div className="space-y-4">
            {stats.category_distribution.map((cat, idx) => {
              const maxCount = Math.max(...stats.category_distribution.map((c) => c.count), 1);
              const percent = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{cat.category}</span>
                    <span className="font-mono text-slate-400">{cat.count} samples ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Multimodal Accuracy Box */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Multimodal OCR Accuracy</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">98.4%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Confidence threshold tuned to 0.85 for Legal Metrology Packaged Commodities statutory declarations.
            </p>
          </div>

          {/* Quick Action */}
          <button
            onClick={() => setActiveView('reports')}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center"
          >
            Generate Statutory Summary
          </button>
        </div>
      </div>

      {/* Frequent Violations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations breakdown */}
        <div className="bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                Frequent Rule Infringements
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">LMPC Rules 2011</span>
          </div>

          <div className="space-y-3 pt-4">
            {stats.violations_by_declaration.map((item, index) => {
              const maxCount = Math.max(...stats.violations_by_declaration.map((v) => v.count), 1);
              const percentage = Math.round((item.count / maxCount) * 100);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.declaration}</span>
                    <span className="font-bold text-slate-900 font-mono">{item.count} detections</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        index === 0
                          ? 'bg-rose-500'
                          : index === 1
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Trend */}
        <div className="bg-white p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                Weekly Inspection Volume
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Past 7 Days</span>
          </div>

          <div className="pt-4">
            <div className="h-36 flex items-end justify-between gap-2 px-2">
              {stats.inspections_over_time.map((item, idx) => {
                const heightPercent = Math.min(100, Math.max(15, (item.count / 12) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] font-mono text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition">
                      {item.count}
                    </span>
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t overflow-hidden flex flex-col justify-end h-24">
                      <div
                        className="bg-slate-900 group-hover:bg-blue-600 transition rounded-t w-full"
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Information Footer Banner */}
      <div className="bg-blue-900/5 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 rounded bg-blue-100 text-blue-700 shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Official Legal Metrology Decision Support
            </h4>
            <p className="text-[11px] text-slate-600">
              AI screening scores and OCR extractions serve as statutory assistive evidence. Final enforcement determinations are authenticated by the designated inspection officer.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 shrink-0 text-[10px] text-slate-500 font-mono font-bold uppercase">
          <span className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block mr-1"></span>
            LMPC Rule Engine v2026.1
          </span>
          <span className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block mr-1"></span>
            Gemini Multimodal Vision
          </span>
        </div>
      </div>
    </div>
  );
};
