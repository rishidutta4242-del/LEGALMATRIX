import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuthUser, UserRole } from '../types/index';
import { NationalEmblemIndia } from './IndianStateEmblem';
import {
  ShieldCheck,
  Scale,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Building,
  UserCheck,
  Award,
  AlertCircle,
  Users,
  Smartphone,
  Eye,
  FileText,
  UploadCloud,
  HelpCircle,
  Sparkles,
  Camera
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, loginAsAccount, showToast } = useApp();

  // Primary Portal: 'CITIZEN' or 'OFFICER'
  const [portalMode, setPortalMode] = useState<'CITIZEN' | 'OFFICER'>('OFFICER');

  // Officer auth sub-mode
  const [officerAuthMode, setOfficerAuthMode] = useState<'SSO' | 'CREDENTIALS'>('SSO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Citizen input
  const [citizenName, setCitizenName] = useState('Pooja Deshmukh');
  const [citizenMobile, setCitizenMobile] = useState('+91 98765 43210');

  const citizenUser: AuthUser = {
    id: 'USR-CIT-01',
    email: 'citizen@legalmetrix.gov.in',
    name: citizenName || 'General Consumer',
    role: 'Citizen' as UserRole,
    badge_number: 'CITIZEN-VIGILANCE',
    jurisdiction: 'National Consumer Vigilance',
    division: 'Public Citizen Consumer Affairs',
    phone: citizenMobile || '+91 98765 43210'
  };

  const demoOfficers: AuthUser[] = [
    {
      id: 'USR-INSP-01',
      email: 'inspector@legalmetrix.gov.in',
      name: 'Inspector Rajesh Kumar',
      role: 'Inspector',
      badge_number: 'LM-KA-INSP-402',
      jurisdiction: 'Bengaluru South Enforcement Division',
      division: 'Market Surveillance & Field Verification Cell',
      phone: '+91 98450 12345'
    },
    {
      id: 'USR-ADMIN-01',
      email: 'admin@legalmetrix.gov.in',
      name: 'Chief Administrator S. Ramaswamy',
      role: 'Administrator',
      badge_number: 'LM-ADMIN-01',
      jurisdiction: 'Central Rule Codification & Technical Wing',
      division: 'Statutory Rules Codification Authority',
      phone: '+91 98765 43210'
    },
    {
      id: 'USR-DEP-01',
      email: 'deputy.controller@legalmetrix.gov.in',
      name: 'Deputy Controller Priya Sharma',
      role: 'Deputy Controller',
      badge_number: 'LM-DL-SUP-109',
      jurisdiction: 'Delhi NCR Metrology Directorate',
      division: 'Appeals Adjudication & Supervisory Wing',
      phone: '+91 98110 54321'
    },
    {
      id: 'USR-DG-01',
      email: 'dg@legalmetrix.gov.in',
      name: 'Dr. Vikramaditya Reddy, IAS',
      role: 'Director General',
      badge_number: 'LM-HQ-DG-001',
      jurisdiction: 'Ministry of Consumer Affairs, New Delhi',
      division: 'National Metrology Directorate General',
      phone: '+91 99990 00001'
    }
  ];

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both departmental email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const success = await login(email, password);
      if (!success) {
        setErrorMsg('Invalid departmental credentials. Use Password@123 for prototype access.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastLogin = (officer: AuthUser) => {
    loginAsAccount(officer, `lm_sec_${officer.id}_demo_token`);
    showToast(`Authenticated as ${officer.name} (${officer.role})`, 'success');
  };

  const handleCitizenLogin = () => {
    const userToLogin = {
      ...citizenUser,
      name: citizenName.trim() || 'General Consumer'
    };
    loginAsAccount(userToLogin, 'lm_sec_citizen_session_token');
    showToast(`Welcome to Citizen Consumer Portal, ${userToLogin.name}!`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#070d1d] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Tiranga (National Tricolour) Ribbon Bar */}
      <div className="w-full h-2 flex shrink-0 shadow-md relative z-30">
        <div className="flex-1 bg-[#FF9933]" /> {/* Kesaria / Saffron */}
        <div className="flex-1 bg-white relative flex items-center justify-center">
          {/* Micro Ashoka Chakra in Center of Ribbon */}
          <div className="w-2.5 h-2.5 rounded-full border border-blue-900 bg-blue-900/20" />
        </div>
        <div className="flex-1 bg-[#138808]" /> {/* Hara / India Green */}
      </div>

      {/* INDIAN THEME BACKGROUND: Traditional Jali Lattice Pattern & Sovereign Ambient Radiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle Indian Geometric Jali Lattice Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #f59e0b 1px, transparent 1px), radial-gradient(circle at 0% 100%, #10b981 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Traditional Sovereign Kesaria (Saffron) Warm Light Field - Top Corner */}
        <div className="absolute -top-40 -left-20 w-[550px] h-[550px] bg-gradient-to-br from-[#FF9933]/25 via-[#f59e0b]/15 to-transparent rounded-full blur-[100px]" />

        {/* Navy Blue Sovereign Center Depth Field */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#1d4ed8]/12 via-[#0f172a]/20 to-transparent rounded-full blur-[120px]" />

        {/* Traditional Hara (Green) Prosperity Light Field - Bottom Right */}
        <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-gradient-to-tl from-[#138808]/25 via-[#10b981]/15 to-transparent rounded-full blur-[110px]" />

        {/* Grand Ashoka Chakra Watermark in Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.035] pointer-events-none select-none">
          <svg width="720" height="720" viewBox="0 0 100 100" fill="none" className="text-white">
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.4" />
            {[...Array(24)].map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={50 + 44 * Math.cos((i * 15 * Math.PI) / 180)}
                y2={50 + 44 * Math.sin((i * 15 * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="1.2"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-4xl w-full space-y-6">
          
          {/* Government of India Official Bilingual Masthead */}
          <div className="text-center space-y-3">
            {/* Real National Emblem & Department Title */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center justify-center space-x-3.5 bg-slate-900/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-amber-500/20 shadow-lg">
                <div className="bg-white/90 p-1.5 rounded-xl shadow-xs">
                  <NationalEmblemIndia size={42} />
                </div>

                <div className="text-left">
                  <div className="text-xs sm:text-sm font-black tracking-widest text-amber-300 uppercase font-serif">
                    भारत सरकार • GOVERNMENT OF INDIA
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-200 font-semibold">
                    उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Ministry of Consumer Affairs, Food &amp; Public Distribution
                  </div>
                </div>
              </div>

              {/* Satyameva Jayate Motto Bar */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/40 text-[11px] font-semibold text-amber-200 shadow-xs">
                <span className="font-serif font-bold">सत्यमेव जयते</span>
                <span className="text-amber-500">•</span>
                <span className="text-slate-300">विधिक मापविज्ञान प्रभाग (Legal Metrology Division)</span>
              </div>
            </div>

            {/* Portal Main Branding */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                <span>LEGALMETRIX</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
                  INDIA
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-blue-900/80 text-blue-300 border border-blue-600">
                  .GOV.IN
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-1">
                National Statutory Packaged Commodity Surveillance &amp; Enforcement Portal
                <br />
                <span className="text-[11px] text-amber-300/80 font-medium">
                  Legal Metrology Act, 2009 &amp; Legal Metrology (Packaged Commodities) Rules, 2011
                </span>
              </p>
            </div>
          </div>

          {/* Dual Portal Switcher: Officer vs Citizen */}
          <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-xl mx-auto flex items-center shadow-xl backdrop-blur-sm">
            <button
              type="button"
              id="tab-select-officer"
              onClick={() => {
                setPortalMode('OFFICER');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                portalMode === 'OFFICER'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md border border-blue-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              <span>🏛️ Enforcement Authority</span>
            </button>

            <button
              type="button"
              id="tab-select-citizen"
              onClick={() => {
                setPortalMode('CITIZEN');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                portalMode === 'CITIZEN'
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 text-emerald-300" />
              <span>👥 Citizen / Consumer Portal</span>
            </button>
          </div>

          {/* Main Auth Card */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            
            {/* ================= CITIZEN PORTAL ================= */}
            {portalMode === 'CITIZEN' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                      <Sparkles className="h-3 w-3" />
                      <span>PUBLIC CONSUMER VIGILANCE • उपभोक्ता सतर्कता</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Citizen Packaging Scrutiny &amp; Verification</h2>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Verify statutory declarations on grocery, medicine, cosmetics, and packaged items before you purchase. Check MRP, Net Weight, Manufacturer details, and expiry date.
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-xl text-right shrink-0 shadow-sm">
                    <div className="text-[10px] text-amber-400 font-bold uppercase">National Consumer Helpline</div>
                    <div className="text-base font-extrabold text-white flex items-center justify-end space-x-1">
                      <span>Toll Free:</span>
                      <span className="text-amber-400 font-mono">1915</span>
                    </div>
                    <div className="text-[9px] text-slate-400">consumerhelpline.gov.in</div>
                  </div>
                </div>

                {/* Citizen Permitted Features Scope */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Camera className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Click &amp; Scan Photo</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Snap front or back of any packaged commodity to evaluate statutory rules.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Eye className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Rule 6 Verification</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Instant check for MRP, Unit Sale Price (USP), Net Quantity, and Best Before date.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Building className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Consumer Dashboard</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Access history of your inspected items, statutory rights, and penalty awareness.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Lodge Evidence</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Generate evidentiary inspection summary for submission to National Consumer Court.
                    </p>
                  </div>
                </div>

                {/* Citizen Login Form / 1-Click Access */}
                <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-lg mx-auto">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Citizen Consumer Name
                      </label>
                      <input
                        type="text"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        placeholder="e.g. Pooja Deshmukh / Ramesh Sharma"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Mobile Number (Citizen e-Verification)
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          value={citizenMobile}
                          onChange={(e) => setCitizenMobile(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCitizenLogin}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>Enter Citizen Consumer Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    National Consumer Service under Section 2(7) of the Consumer Protection Act, 2019.
                  </p>
                </div>
              </div>
            )}

            {/* ================= OFFICER PORTAL ================= */}
            {portalMode === 'OFFICER' && (
              <div>
                {/* Officer Auth Sub-Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950">
                  <button
                    type="button"
                    id="tab-sso-login"
                    onClick={() => {
                      setOfficerAuthMode('SSO');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      officerAuthMode === 'SSO'
                        ? 'bg-slate-900 text-amber-300 border-b-2 border-amber-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    <span>मेरी पहचान / MeriPehchaan (Statutory Authority Profiles)</span>
                  </button>
                  <button
                    type="button"
                    id="tab-credentials-login"
                    onClick={() => {
                      setOfficerAuthMode('CREDENTIALS');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      officerAuthMode === 'CREDENTIALS'
                        ? 'bg-slate-900 text-amber-300 border-b-2 border-amber-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>Government NIC Credentials Login</span>
                  </button>
                </div>

                <div className="p-6 sm:p-8">
                  {errorMsg && (
                    <div className="mb-6 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center space-x-2.5">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Sub-tab 1: Indian Authority Role Profiles */}
                  {officerAuthMode === 'SSO' && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center space-x-2">
                            <UserCheck className="h-4 w-4 text-amber-400" />
                            <span>Select Designated Legal Metrology Officer Profile</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            One-click session authentication with full Role-Based Access Control (RBAC):
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          GOI NIC-SSO SIMULATOR
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {demoOfficers.map((officer) => {
                          const isInspector = officer.role === 'Inspector';
                          const isDeputy = officer.role === 'Deputy Controller';
                          const isDG = officer.role === 'Director General';
                          const isAdmin = officer.role === 'Administrator';

                          const roleBadgeColor = isInspector
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                            : isDeputy
                            ? 'bg-blue-950/80 border-blue-600 text-blue-300'
                            : isDG
                            ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                            : 'bg-purple-950/80 border-purple-600 text-purple-300';

                          const clearanceSummary = isInspector
                            ? 'Field surveillance, packaging image capture, statutory certificate issuance, and penalty notices.'
                            : isAdmin
                            ? 'National Rule Codification, Schedule II threshold editing, full system audit logs, and master jurisdiction config.'
                            : isDeputy
                            ? 'Appeals adjudication, manufacturer dispute resolution, and supervisory case review.'
                            : 'National policy directives, executive appeals adjudication & certificate revocation.';

                          return (
                            <div
                              key={officer.id}
                              onClick={() => handleFastLogin(officer)}
                              className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${roleBadgeColor}`}>
                                    {officer.role}
                                  </span>
                                  <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50">
                                    {officer.badge_number}
                                  </span>
                                </div>

                                <div>
                                  <div className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                                    {officer.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                    <Building className="h-3 w-3 shrink-0 text-slate-500" />
                                    <span className="truncate">{officer.jurisdiction}</span>
                                  </div>
                                </div>

                                <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 leading-relaxed">
                                  <strong className="text-slate-300">Statutory Clearance:</strong> {clearanceSummary}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                                <span>Authenticate Official Session</span>
                                <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Departmental Credentials Form */}
                  {officerAuthMode === 'CREDENTIALS' && (
                    <form onSubmit={handleCredentialsSubmit} className="space-y-5 max-w-md mx-auto">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                            Government NIC Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="e.g. inspector@legalmetrix.gov.in"
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                            Official NIC Access Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                              required
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Demo Master Password: <code className="text-amber-400 font-mono">Password@123</code>
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-700/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        <Lock className="h-4 w-4" />
                        <span>{isLoading ? 'Verifying Statutory Credentials...' : 'Sign In with Statutory Clearance'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Card Footer Statutory Notice */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-center sm:text-left flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">सत्यमेव जयते</span>
                <span>• Authorized under Section 15 &amp; 28, Legal Metrology Act, 2009.</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px] flex items-center gap-1">
                <span>🔒 NIC e-Gov 256-bit Encrypted</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tricolour Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-3 px-4 text-center text-[11px] text-slate-400 relative z-10 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            डिजिटल भारत (Digital India) • Directorate of Legal Metrology, Krishi Bhawan, New Delhi - 110001
          </span>
          <span className="text-slate-400">
            For consumer grievances, dial <strong className="text-amber-400">1915</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};
