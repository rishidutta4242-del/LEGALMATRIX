import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchCertificates, revokeCertificate, fetchInspectionById } from '../services/api';
import { ComplianceCertificate, CertificateStatus } from '../types/index';
import { Permissions } from '../utils/permissions';
import { CertificateModal } from './CertificateModal';
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Calendar,
  Building,
  QrCode,
  Tag,
  ArrowRight,
  ArrowLeft,
  FileText,
  Home,
  Filter
} from 'lucide-react';

export const CertificateRegistryView: React.FC = () => {
  const { officerName, officerRole, showToast, viewInspection, setActiveView, currentInspection } = useApp();
  const [certificates, setCertificates] = useState<ComplianceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CertificateStatus>('ALL');
  const [selectedCert, setSelectedCert] = useState<ComplianceCertificate | null>(null);

  const canRevoke = Permissions.canRevokeCertificate(officerRole);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await fetchCertificates();
      setCertificates(data);
    } catch (err: any) {
      showToast('Failed to load certificates registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (certificateId: string, reason: string) => {
    try {
      const res = await revokeCertificate(certificateId, {
        revoked_by: officerName,
        reason
      });
      showToast(`Certificate ${certificateId} has been revoked.`, 'info');
      // Update local state
      setCertificates((prev) =>
        prev.map((c) => (c.certificate_id === certificateId ? res.certificate : c))
      );
      if (selectedCert?.certificate_id === certificateId) {
        setSelectedCert(res.certificate);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke certificate', 'error');
    }
  };

  const handleViewInspection = async (inspectionId: string) => {
    try {
      const record = await fetchInspectionById(inspectionId);
      viewInspection(record, 'compliance_results');
    } catch (err) {
      showToast('Could not find linked inspection record', 'error');
    }
  };

  const filtered = certificates.filter((cert) => {
    const matchesStatus = statusFilter === 'ALL' || cert.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesQuery =
      !q ||
      cert.certificate_id.toLowerCase().includes(q) ||
      cert.product_name.toLowerCase().includes(q) ||
      cert.brand.toLowerCase().includes(q) ||
      cert.inspection_id.toLowerCase().includes(q) ||
      (cert.gtin_barcode && cert.gtin_barcode.includes(q));
    return matchesStatus && matchesQuery;
  });

  const totalCount = certificates.length;
  const activeCount = certificates.filter((c) => c.status === 'ACTIVE').length;
  const revokedCount = certificates.filter((c) => c.status === 'REVOKED').length;
  const expiredCount = certificates.filter((c) => c.status === 'EXPIRED').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Persistent Navigation Bar / Unambiguous Exit Path */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 cursor-pointer"
          >
            <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">← Return to Dashboard</span>
            <span className="sm:hidden font-bold">Dashboard</span>
          </button>
          {currentInspection && (
            <button
              onClick={() => setActiveView('compliance_results')}
              className="min-h-[44px] px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600 active:scale-95 text-blue-200 hover:text-white border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline">← Back to Compliance Screen</span>
              <span className="sm:hidden font-bold">Compliance</span>
            </button>
          )}
        </div>
        <div className="text-xs text-slate-400 font-mono hidden md:block">
          Official Statutory Certificate Registry
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center space-x-1">
              <Award className="h-3.5 w-3.5 text-amber-700 mr-1" />
              <span>National Metrology Compliance Registry</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Certificates of Statutory Compliance
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Publicly verifiable certificates issued to 100% compliant pre-packaged commodities under Rule 6 and Schedule II.
          </p>
        </div>

        <button
          onClick={loadCertificates}
          className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition flex items-center space-x-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Registry</span>
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold uppercase text-slate-500 tracking-wider">Total Certificates</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">{totalCount}</div>
          <span className="text-[10px] sm:text-[11px] text-slate-500">Issued across all batches</span>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-3.5 sm:p-4 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] sm:text-xs font-bold uppercase text-emerald-700 tracking-wider">Active &amp; Certified</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">{activeCount}</div>
          <span className="text-[10px] sm:text-[11px] text-emerald-600">Full statutory immunity</span>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 p-3.5 sm:p-4 shadow-xs bg-red-50/20">
          <span className="text-[11px] sm:text-xs font-bold uppercase text-red-700 tracking-wider">Revoked / Suspended</span>
          <div className="text-xl sm:text-2xl font-black text-red-700 mt-0.5 sm:mt-1">{revokedCount}</div>
          <span className="text-[10px] sm:text-[11px] text-red-600">Marked for market seizure</span>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 p-3.5 sm:p-4 shadow-xs bg-amber-50/20">
          <span className="text-[11px] sm:text-xs font-bold uppercase text-amber-700 tracking-wider">Expired / Pending Audit</span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5 sm:mt-1">{expiredCount}</div>
          <span className="text-[10px] sm:text-[11px] text-amber-600">Renewal sweep required</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search certificate ID, product, brand, GTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Records' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Certificate Records Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="h-6 w-6 mx-auto animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading statutory certificates registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Award className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">No compliance certificates matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((cert) => {
              const isRevoked = cert.status === 'REVOKED';
              const isExpired = cert.status === 'EXPIRED';

              return (
                <div
                  key={cert.certificate_id}
                  className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cert.certificate_id}
                      </span>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isRevoked
                            ? 'bg-red-100 text-red-800'
                            : isExpired
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isRevoked ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        <span>{cert.status}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Score: {cert.screening_score}/100
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {cert.product_name}
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Brand: <strong className="text-slate-700">{cert.brand}</strong></span>
                      <span>Category: <strong className="text-slate-700">{cert.category}</strong></span>
                      <span>Issued: <strong className="text-slate-700">{new Date(cert.issued_at).toLocaleDateString()}</strong></span>
                      <span>Certifying Officer: <strong className="text-slate-700">{cert.inspecting_officer.name}</strong></span>
                    </div>

                    {isRevoked && cert.revocation_details && (
                      <div className="text-[11px] text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 inline-block mt-1">
                        <strong>Revoked:</strong> {cert.revocation_details.reason} (by {cert.revocation_details.revoked_by})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-stretch sm:self-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleViewInspection(cert.inspection_id)}
                      className="min-h-[42px] px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer"
                      title="Inspect field evidence & OCR bounding boxes"
                    >
                      Evidence
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCert(cert)}
                      className="min-h-[42px] px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Award className="h-4 w-4" />
                      <span>View Certificate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          isOpen={true}
          onClose={() => setSelectedCert(null)}
          onRevoke={handleRevoke}
          canRevoke={canRevoke}
        />
      )}
    </div>
  );
};
