import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchRules, saveRule, updateRule, fetchRuleAuditLogs } from '../services/api';
import { RuleDefinition, RuleAuditLogEntry } from '../types/index';
import { Permissions } from '../utils/permissions';
import { ScheduleIITable } from './ScheduleIITable';
import {
  BookOpen,
  Plus,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  FileCheck,
  Edit3,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Scale,
  Lock,
  X
} from 'lucide-react';

export const RuleRepositoryView: React.FC = () => {
  const { showToast, officerName, officerRole } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'audit_log' | 'schedule_ii' | 'penalties'>('rules');
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<RuleAuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<RuleDefinition | null>(null);
  const [editRationale, setEditRationale] = useState<string>('');
  const [editSeverity, setEditSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editMinFont, setEditMinFont] = useState<number>(1.5);

  const canEditRules = Permissions.canEditRules(officerRole);

  // New Rule Form
  const [newRule, setNewRule] = useState<Partial<RuleDefinition>>({
    rule_id: 'LM-PC-CUSTOM-001',
    field: 'custom_field',
    title: 'Custom State Statutory Directive',
    description: 'Enforces state-level packaging notification guidelines',
    severity: 'MEDIUM',
    requirement: 'Mandatory state declaration on principal display panel',
    applicability: 'ALL',
    source: 'State Legal Metrology Department',
    version: '2026.1',
    effective_from: '2026-01-01',
    effective_date: '2026-01-01',
    active: true,
    validation_type: 'CUSTOM'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, logsData] = await Promise.all([
        fetchRules(),
        fetchRuleAuditLogs().catch(() => [])
      ]);
      setRules(rulesData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomRule = async () => {
    try {
      if (!newRule.rule_id || !newRule.title) {
        showToast('Rule ID and Title are required.', 'error');
        return;
      }
      await saveRule(newRule as RuleDefinition);
      showToast('New Legal Metrology rule added to repository.', 'success');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast('Failed to save rule', 'error');
    }
  };

  const handleOpenEdit = (rule: RuleDefinition) => {
    setEditingRule(rule);
    setEditSeverity(rule.severity || 'MEDIUM');
    setEditActive(rule.active !== false);
    setEditMinFont(rule.min_font_height_mm || 1.5);
    setEditRationale('');
  };

  const handleSaveEdit = async () => {
    if (!editingRule) return;
    if (!editRationale.trim()) {
      showToast('Statutory rationale is required for audit trail compliance.', 'error');
      return;
    }

    try {
      await updateRule(editingRule.rule_id, {
        severity: editSeverity,
        active: editActive,
        min_font_height_mm: editMinFont,
        actor_name: officerName,
        actor_role: officerRole,
        rationale: editRationale
      });

      showToast(`Rule ${editingRule.rule_id} updated and logged to audit trail.`, 'success');
      setEditingRule(null);
      loadData();
    } catch (err) {
      showToast('Failed to update rule.', 'error');
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.rule_id.toLowerCase().includes(search.toLowerCase()) ||
      (r.source && r.source.toLowerCase().includes(search.toLowerCase())) ||
      (r.field && r.field.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Legal Metrology Rule Repository & Versioning
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Codified statutory rules from the Legal Metrology (Packaged Commodities) Rules, 2011 with Gazette amendments and an immutable audit log.
          </p>
        </div>

        {canEditRules ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition min-h-[44px] cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Codified Rule</span>
          </button>
        ) : (
          <div className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium border border-slate-200 min-h-[40px]" title="Rule modification restricted to Administrator role">
            <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Rule Modifications Restricted (Admin Only)</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs (Horizontal scrolling on mobile) */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar flex-nowrap pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
        <button
          onClick={() => setActiveTab('rules')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Statutory Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit_log'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4 shrink-0" />
          <span>Rule-Edit Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule_ii')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'schedule_ii'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span>Schedule II Font Size Table</span>
        </button>

        <button
          onClick={() => setActiveTab('penalties')}
          className={`min-h-[44px] pb-2.5 pt-2 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'penalties'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="h-4 w-4 shrink-0" />
          <span>Statutory Penalties (Sec 36-49)</span>
        </button>
      </div>

      {/* TAB 1: RULES CATALOGUE */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Rule ID, statutory section, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium shadow-xs"
            />
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => (
              <div
                key={rule.rule_id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rule.rule_id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        v{rule.version || '2026.1'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          rule.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : rule.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rule.severity}
                      </span>
                      {canEditRules ? (
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                          title="Amend rule / Adjust threshold"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="p-1 text-slate-300" title="Statutory rule amendment requires Administrator authority">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <div>
                      <strong className="text-slate-800">Statutory Requirement:</strong> {rule.requirement}
                    </div>
                    {rule.gazette_notification_no && (
                      <div className="text-slate-500 font-mono text-[10px]">
                        <strong>Gazette Ref:</strong> {rule.gazette_notification_no}
                      </div>
                    )}
                    {rule.effective_from && (
                      <div className="text-slate-500 text-[10px] flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Effective From: {rule.effective_from}</span>
                        {rule.effective_to && <span> to {rule.effective_to}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">{rule.source}</span>
                  <span
                    className={`inline-flex items-center font-bold ${
                      rule.active !== false ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {rule.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Codified Rule Modification Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every rule update, severity alteration, and gazette version adjustment is timestamped with the officer's rationale.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                {auditLogs.length} Logged Actions
              </span>
              <span className="text-[10px] text-slate-500 font-mono sm:hidden">
                Swipe table →
              </span>
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0 border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Officer / Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Rule Affected</th>
                  <th className="py-2.5 px-3">Changes (Before → After)</th>
                  <th className="py-2.5 px-3">Statutory Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{log.actor_name}</div>
                      <div className="text-[10px] text-slate-500">{log.actor_role}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          log.action === 'CREATE'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'UPDATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-800">{log.rule_id}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{log.rule_title}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {log.changes.map((c, i) => (
                          <div key={i} className="text-[10px] font-mono text-slate-700">
                            <span className="font-bold text-slate-900">{c.field}:</span>{' '}
                            {c.before !== undefined && c.before !== null ? (
                              <span className="line-through text-slate-400 mr-1">{String(c.before)}</span>
                            ) : null}
                            <span className="text-blue-600 font-bold">{String(c.after)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs leading-relaxed">
                      {log.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE II FONT SIZE MATRIX */}
      {activeTab === 'schedule_ii' && (
        <div className="space-y-4">
          <ScheduleIITable showRegulatoryNote={true} />
        </div>
      )}

      {/* TAB 4: STATUTORY PENALTIES SCHEDULE */}
      {activeTab === 'penalties' && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl text-white space-y-2">
            <div className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-blue-400" />
              <h2 className="text-base font-bold tracking-wide">Statutory Penalty Schedule &amp; Compounding Framework</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              Codified punitive provisions and compounding guidelines under Chapter V of the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011. Enforcement officers must adhere to statutory fine brackets and compounding jurisdictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 36(1) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Section 36(1)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                    Non-Standard Packages &amp; Missing Rule 6 Declarations
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Compoundable</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies to selling, distributing, delivering, or packing pre-packaged commodities lacking mandatory statutory declarations (MRP, Net Qty, Mfg Date, Packer Address, Customer Care).
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">1st Offence</span>
                  <span className="font-bold text-slate-900">Up to ₹25,000</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">2nd Offence</span>
                  <span className="font-bold text-slate-900">Up to ₹50,000</span>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <span className="text-[10px] font-bold text-red-600 block">Subsequent</span>
                  <span className="font-bold text-red-700">₹1,00,000 / 1 Yr Jail</span>
                </div>
              </div>
            </div>

            {/* Section 36(2) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Section 36(2)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                    Manufacture of Non-Standard Pre-Packaged Goods
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Compoundable</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies directly to manufacturers or packaging plant occupiers manufacturing non-standard net quantity lots or unapproved package sizes.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">Statutory Fine Bracket</span>
                  <span className="font-bold text-slate-900">₹25,000 to ₹50,000</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">Subsequent Contravention</span>
                  <span className="font-bold text-red-700">Up to ₹1,00,000 or Jail</span>
                </div>
              </div>
            </div>

            {/* Rule 18(2) r/w Section 36(1) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Rule 18(2) &amp; Sec 36(1)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                    Sale Exceeding MRP &amp; Prohibited Dual Stickering
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Compoundable</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Retail sale of any pre-packaged commodity at a price higher than the original declared MRP. Affixing higher price stickers over the original manufacturer print is strictly illegal.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">Fine (1st Offence)</span>
                  <span className="font-bold text-slate-900">Up to ₹25,000 per SKU</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">Fine (2nd Offence)</span>
                  <span className="font-bold text-slate-900">Up to ₹50,000</span>
                </div>
              </div>
            </div>

            {/* Rule 27 r/w Section 39 */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Rule 27 &amp; Sec 39
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                    Non-Registration of Manufacturer / Packer / Importer
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">Compoundable</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Failure to file registration with the Controller or Director of Legal Metrology within 90 days from the commencement of pre-packaging operations.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">Statutory Fine</span>
                  <span className="font-bold text-slate-900">Fine up to ₹5,000</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 block">Enforcement Action</span>
                  <span className="font-bold text-slate-700">Notice to Register</span>
                </div>
              </div>
            </div>
          </div>

          {/* Procedural Compounding and Corporate Liability Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <Scale className="h-4 w-4 text-blue-600" />
                <span>Section 48 — Compounding of Offences</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Any offence punishable under Section 25, 27 to 39, etc., may, either before or after the institution of the prosecution, be compounded by a Director or Controller or authorized Legal Metrology Officer.
              </p>
              <ul className="list-disc pl-4 text-slate-600 space-y-1">
                <li>Upon payment of the compounding sum, no further proceedings shall be taken against the offender.</li>
                <li>Compounding is not permissible if a similar offence was committed within the preceding 3 years.</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <Scale className="h-4 w-4 text-purple-600" />
                <span>Section 49 — Corporate Liability &amp; Nominated Directors</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Where an offence is committed by a company, every person who at the time was in charge of and responsible to the company for the conduct of business, as well as the company, is deemed guilty.
              </p>
              <ul className="list-disc pl-4 text-slate-600 space-y-1">
                <li>Companies may formally nominate a Director under Section 49(2) to assume legal compliance responsibility.</li>
                <li>In absence of nomination, all registered Directors are jointly and severally liable.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-3 sm:p-4 flex items-start sm:items-center justify-center">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Amend Rule Parameters</h3>
                <p className="text-xs text-slate-500 font-mono">{editingRule.rule_id} — {editingRule.title}</p>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Enforcement Severity</label>
                <select
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                >
                  <option value="HIGH">HIGH (Critical statutory non-compliance)</option>
                  <option value="MEDIUM">MEDIUM (Standard non-compliance)</option>
                  <option value="LOW">LOW (Advisory / formatting non-compliance)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Character Height Threshold (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editMinFont}
                  onChange={(e) => setEditMinFont(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="active-checkbox" className="font-bold text-slate-700">
                  Rule Active in Deterministic Evaluation Pipeline
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Statutory Rationale / Gazette Amendment Note *
                </label>
                <textarea
                  rows={3}
                  value={editRationale}
                  onChange={(e) => setEditRationale(e.target.value)}
                  placeholder="e.g. Pursuant to Gazette Notification G.S.R. 779(E) adjusting character height compliance tolerance..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Required. This rationale will be permanently recorded in the Immutable Rule-Edit Audit Trail.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingRule(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Save & Log Amendment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-3 sm:p-4 flex items-start sm:items-center justify-center">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto sm:my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Statutory Rule Definition</h3>
                <p className="text-xs text-slate-500">
                  Extend the Legal Metrology rule engine with state-specific or amended commodity guidelines.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rule ID Identifier *</label>
                <input
                  type="text"
                  value={newRule.rule_id}
                  onChange={(e) => setNewRule({ ...newRule, rule_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rule Title *</label>
                <input
                  type="text"
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Declaration Field</label>
                <input
                  type="text"
                  value={newRule.field}
                  onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Legal Metrology Citation Reference</label>
                <input
                  type="text"
                  value={newRule.source}
                  onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rule Description</label>
                <textarea
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomRule}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Save Rule to Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
