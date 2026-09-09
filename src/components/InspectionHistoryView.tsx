import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchInspections } from '../services/api';
import { InspectionRecord, ProductCategory, ComplianceStatus } from '../types/index';
import {
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Download,
  Scale,
  Award,
  FileCheck
} from 'lucide-react';

export const InspectionHistoryView: React.FC = () => {
  const { viewInspection, setActiveView, showToast } = useApp();

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchInspections({
        status: statusFilter,
        category: categoryFilter,
        query,
      });
      setInspections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExportCSV = () => {
    if (inspections.length === 0) {
      showToast('No records available to export', 'info');
      return;
    }
    const headers = [
      'Inspection ID',
      'Product Name',
      'Brand',
      'Category',
      'Officer',
      'Screening Score',
      'Status',
      'Dispute Status',
      'Sync Status',
      'Calibration',
      'Created At'
    ];
    const rows = inspections.map((ins) => [
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
    link.setAttribute('download', `legalmetrix_registry_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Registry dataset exported as CSV', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inspections Surveillance Registry
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete historical audit trail of packaged commodity market inspections and AI compliance evaluations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setActiveView('new_inspection')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name, Brand, Inspection ID, or Officer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PASS">PASS (Compliant)</option>
            <option value="FAIL">FAIL (Non-Compliant)</option>
            <option value="REVIEW">REVIEW (Ambiguous)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Food">Food</option>
            <option value="Cosmetics">Cosmetics</option>
            <option value="Household">Household</option>
            <option value="Electrical">Electrical</option>
            <option value="Beverages">Beverages</option>
            <option value="Pharmaceuticals">Pharmaceuticals</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Inspection ID</th>
                <th className="py-3.5 px-4">Commodity / Brand</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date of Surveillance</th>
                <th className="py-3.5 px-4">Enforcement Officer</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Certificate</th>
                <th className="py-3.5 px-4">Dispute State</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No inspection records found matching criteria.
                  </td>
                </tr>
              ) : (
                inspections.map((ins) => (
                  <tr
                    key={ins.id}
                    onClick={() => viewInspection(ins, 'compliance_results')}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      <div>{ins.id}</div>
                      {ins.readability_analysis?.is_calibrated && (
                        <span className="inline-flex items-center text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 mt-0.5 font-sans font-semibold">
                          <Scale className="h-2.5 w-2.5 mr-0.5" />
                          Calibrated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ins.product_name}</div>
                      <div className="text-[11px] text-slate-500">{ins.brand}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                        {ins.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(ins.created_at).toLocaleDateString()}{' '}
                      {new Date(ins.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{ins.officer_name.split('(')[0]}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {ins.screening_score}/100
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono uppercase ${
                          ins.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ins.status === 'FAIL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {ins.certificate_id || (ins.certificate && ins.certificate.certificate_id) ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Award className="h-3 w-3 text-emerald-600 mr-0.5 shrink-0" />
                            <span>{ins.certificate_id || ins.certificate?.certificate_id}</span>
                          </span>
                          <span className="text-[9px] text-emerald-700 font-semibold flex items-center">
                            <FileCheck className="h-2.5 w-2.5 mr-0.5 inline" /> Active Statutory Cert
                          </span>
                        </div>
                      ) : ins.status === 'PASS' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="h-2.5 w-2.5 text-blue-600 mr-0.5" />
                          <span>Eligible for Issuance</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">
                          Non-compliant (No cert)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewInspection(ins, 'compliance_results');
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>Screening</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
