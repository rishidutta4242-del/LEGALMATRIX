import React from 'react';
import { useApp, ViewType } from '../context/AppContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileCheck2,
  FileText,
  BookOpen,
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Layers,
  Scale,
  Boxes,
  Award,
  X
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentInspection,
    systemStatus,
    officerRole,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useApp();

  const getNavItems = (): NavItem[] => {
    if (officerRole === 'Citizen') {
      return [
        { id: 'dashboard', label: 'Consumer Vigilance', icon: LayoutDashboard },
        { id: 'new_inspection', label: 'Quick Packaging Check', icon: PlusCircle, badge: 'AI Scan' },
        { id: 'reports', label: 'Statutory Reports', icon: FileText },
        { id: 'certificates', label: 'Verify Certificate', icon: Award, badge: 'Public' },
      ];
    }
    if (officerRole === 'Inspector') {
      return [
        { id: 'dashboard', label: 'Field Dashboard', icon: LayoutDashboard },
        { id: 'new_inspection', label: 'New Commodity Inspection', icon: PlusCircle, badge: 'Live' },
        { id: 'bulk_intake', label: 'Bulk / E-Commerce', icon: Boxes, badge: 'Batch' },
        { id: 'certificates', label: 'Compliance Certificates', icon: Award, badge: 'Registry' },
        { id: 'inspections', label: 'Surveillance History', icon: Layers },
        { id: 'reports', label: 'Inspection Reports', icon: FileText },
        { id: 'rules', label: 'Rule Repository', icon: BookOpen },
      ];
    }
    // Administrator / Director General / Supervisory Roles
    return [
      { id: 'dashboard', label: 'Enforcement Dashboard', icon: LayoutDashboard },
      { id: 'new_inspection', label: 'New Commodity Inspection', icon: PlusCircle },
      { id: 'bulk_intake', label: 'Bulk / E-Commerce', icon: Boxes, badge: 'Batch' },
      { id: 'certificates', label: 'Compliance Certificates', icon: Award, badge: 'Registry' },
      { id: 'inspections', label: 'Surveillance History', icon: Layers },
      { id: 'reports', label: 'Reports & Audits', icon: FileText },
      { id: 'rules', label: 'Rule Repository Codification', icon: BookOpen, badge: 'GSR 779' },
      { id: 'settings', label: 'System Configuration', icon: SettingsIcon, badge: 'Admin' },
    ];
  };

  const navItems = getNavItems();

  const handleNavClick = (id: ViewType) => {
    setActiveView(id);
    setIsMobileSidebarOpen(false);
  };

  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full min-h-full">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
        <div
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => handleNavClick('dashboard')}
        >
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight uppercase leading-none">LegalMetrix</h1>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest mt-1 font-mono">Enforcement Suite v2026.1</p>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close navigation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 sm:py-6 px-3 sm:px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <div
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              {isActive ? (
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span className="text-xs uppercase tracking-wider flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}

        {/* Current Active Inspection Section (if loaded) */}
        {currentInspection && (
          <div className="pt-4 mt-3 border-t border-slate-800">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1">
                  <FileCheck2 className="h-3 w-3 text-blue-400 mr-1" />
                  <span>Inspection</span>
                </span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono ${
                    currentInspection.status === 'PASS'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : currentInspection.status === 'FAIL'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {currentInspection.status}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white truncate">{currentInspection.product_name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{currentInspection.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('compliance_results')}
                  className={`text-[11px] py-1 px-1.5 rounded uppercase tracking-wider font-bold text-center transition ${
                    activeView === 'compliance_results'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  Screening
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('evidence_viewer')}
                  className={`text-[11px] py-1 px-1.5 rounded uppercase tracking-wider font-bold text-center transition ${
                    activeView === 'evidence_viewer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  Evidence
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Footer Info Block */}
      <div className="p-4 sm:p-5 border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center space-x-1.5 text-slate-400">
            <Cpu className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] uppercase tracking-wider">AI Vision</span>
          </span>
          <span className="text-emerald-400 font-mono text-[10px] font-bold">ONLINE</span>
        </div>
        <div className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
          Smart India Hackathon 2026<br />Problem Statement 26034
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (md and above) */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col border-r border-slate-800 text-slate-300 shrink-0 min-h-[calc(100vh-5rem)] select-none">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer (below md) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-out drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 flex flex-col border-r border-slate-800 text-slate-300 shadow-2xl z-50 select-none">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
