import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import {
  InspectionRecord,
  DashboardStats,
  RuleDefinition,
  ProductCategory,
  RuleAuditLogEntry,
  DisputeStatus,
  ComplianceCertificate,
  SystemAuditLogEntry,
  SystemNotification,
  ManufacturerRiskProfile,
  GtinLookupResult,
  UserRole,
  AuthUser,
  CitizenReport
} from '../src/types/index';
import { DEFAULT_RULES, LegalMetrologyRuleEngine } from './ruleEngine';

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  badge_number: string;
  jurisdiction: string;
  division: string;
  phone?: string;
}

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-INSP-01',
    email: 'inspector@legalmetrix.gov.in',
    password: 'Password@123',
    name: 'Inspector Rajesh Kumar',
    role: 'Inspector',
    badge_number: 'LM-KA-INSP-402',
    jurisdiction: 'Bengaluru South Enforcement Division',
    division: 'Market Surveillance & Field Verification Cell',
    phone: '+91 98450 12345'
  },
  {
    id: 'USR-CITIZEN-01',
    email: 'citizen@legalmetrix.gov.in',
    password: 'Password@123',
    name: 'Ananya Deshmukh',
    role: 'Citizen',
    badge_number: 'CITIZEN-KA-991',
    jurisdiction: 'Public Citizen Portal',
    division: 'Consumer Grievance & Public Vigilance Cell',
    phone: '+91 98888 12345'
  },
  {
    id: 'USR-DEP-01',
    email: 'deputy.controller@legalmetrix.gov.in',
    password: 'Password@123',
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
    password: 'Password@123',
    name: 'Dr. Vikramaditya Reddy, IAS',
    role: 'Director General',
    badge_number: 'LM-HQ-DG-001',
    jurisdiction: 'Ministry of Consumer Affairs, New Delhi',
    division: 'National Metrology Directorate General',
    phone: '+91 99990 00001'
  },
  {
    id: 'USR-ADMIN-01',
    email: 'admin@legalmetrix.gov.in',
    password: 'Password@123',
    name: 'Chief Metrology Administrator S. Ramaswamy',
    role: 'Administrator',
    badge_number: 'LM-ADMIN-01',
    jurisdiction: 'Central Rule Codification & Technical Wing',
    division: 'Statutory Rules Codification Authority',
    phone: '+91 98765 43210'
  }
];

// Seed demo packages with SVG placeholder images so judges have rich visual labels immediately
function toSvgDataUri(svgStr: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svgStr.trim()).toString('base64')}`;
}

const SAMPLE_IMAGE_FRONT_COMPLIANT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="120" rx="12" fill="#0f172a"/>
  <text x="300" y="95" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">AURA ORGANICS</text>
  <text x="300" y="135" font-family="Arial, sans-serif" font-size="18" fill="#f8fafc" text-anchor="middle">CRUNCHY WHOLEGRAIN OATS COOKIES</text>
  
  <rect x="80" y="200" width="440" height="240" rx="16" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="300" cy="310" r="70" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
  <text x="300" y="315" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">🍪</text>
  <text x="300" y="360" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#92400e" text-anchor="middle">100% WHOLE GRAIN</text>

  <rect x="60" y="480" width="480" height="200" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="80" y="520" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">FRONT MANDATORY DECLARATIONS</text>
  <text x="80" y="560" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0284c7">Net Quantity: 200 g (2 x 100g Packs)</text>
  <text x="80" y="600" font-family="Arial, sans-serif" font-size="16" fill="#334155">Commodity: Baked Biscuit &amp; Cookie Confectionery</text>
  <text x="80" y="640" font-family="Arial, sans-serif" font-size="15" fill="#16a34a" font-weight="bold">✓ 100% Vegetarian (Green Dot Mark)</text>
</svg>`);

const SAMPLE_IMAGE_BACK_COMPLIANT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="55" rx="8" fill="#1e293b"/>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">STATUTORY MANDATORY DECLARATIONS</text>

  <rect x="50" y="115" width="498" height="580" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  
  <text x="70" y="150" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">1. COMMODITY NAME:</text>
  <text x="260" y="150" font-family="Arial, sans-serif" font-size="14" fill="#334155">Wholegrain Oats Cookies</text>

  <text x="70" y="190" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">2. NET QUANTITY:</text>
  <text x="260" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">200 g (Standard Metric Units)</text>

  <text x="70" y="230" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">3. MRP (INCL. TAXES):</text>
  <text x="260" y="230" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#059669">₹75.00 (Incl. of all taxes)</text>

  <text x="70" y="270" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">4. UNIT SALE PRICE:</text>
  <text x="260" y="270" font-family="Arial, sans-serif" font-size="14" fill="#334155">₹0.38 / g</text>

  <text x="70" y="310" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">5. MFD &amp; PACKED BY:</text>
  <text x="70" y="335" font-family="Arial, sans-serif" font-size="13" fill="#475569">Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area,</text>
  <text x="70" y="355" font-family="Arial, sans-serif" font-size="13" fill="#475569">Bengaluru, Karnataka - 560058, India.</text>

  <text x="70" y="395" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">6. DATE OF PACKING:</text>
  <text x="260" y="395" font-family="Arial, sans-serif" font-size="14" fill="#334155">04/2026 | BATCH: AO-2026-B84</text>

  <text x="70" y="435" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">7. BEST BEFORE:</text>
  <text x="260" y="435" font-family="Arial, sans-serif" font-size="14" fill="#334155">9 Months from Date of Packaging</text>

  <text x="70" y="475" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">8. COUNTRY OF ORIGIN:</text>
  <text x="260" y="475" font-family="Arial, sans-serif" font-size="14" fill="#334155">India</text>

  <rect x="65" y="505" width="470" height="95" rx="6" fill="#f0fdf4" stroke="#86efac"/>
  <text x="80" y="530" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#166534">9. CONSUMER CARE GRIEVANCE CELL:</text>
  <text x="80" y="555" font-family="Arial, sans-serif" font-size="13" fill="#14532d">Manager, Consumer Grievance Cell, at Mfd Address above</text>
  <text x="80" y="580" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#15803d">Toll Free: 1800-425-9988 | Email: care@auraorganics.in</text>

  <rect x="70" y="615" width="200" height="50" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="170" y="645" font-family="monospace" font-size="16" text-anchor="middle">|||| | ||||| || ||||</text>
  <text x="170" y="660" font-family="monospace" font-size="10" text-anchor="middle">8901234567890</text>
</svg>`);

const SAMPLE_IMAGE_VIOLATION_LABEL = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#fef2f2" stroke="#fca5a5" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="60" rx="8" fill="#991b1b"/>
  <text x="300" y="82" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">PREMIUM HERBAL SHAMPOO (NON-COMPLIANT)</text>

  <rect x="50" y="130" width="498" height="560" rx="8" fill="#fff5f5" stroke="#fed7d7"/>
  
  <text x="70" y="170" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b">1. PRODUCT:</text>
  <text x="240" y="170" font-family="Arial, sans-serif" font-size="14" fill="#334155">Silk Glow Shampoo</text>

  <text x="70" y="215" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b">2. NET QUANTITY:</text>
  <text x="240" y="215" font-family="Arial, sans-serif" font-size="14" fill="#334155">200ml</text>

  <text x="70" y="260" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#dc2626">3. PRICE DECLARATION:</text>
  <text x="240" y="260" font-family="Arial, sans-serif" font-size="14" fill="#b91c1c" font-weight="bold">Price: 199 (MISSING MRP &amp; TAX STATEMENT!)</text>

  <text x="70" y="310" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b">4. MANUFACTURER:</text>
  <text x="70" y="335" font-family="Arial, sans-serif" font-size="13" fill="#475569">Mfd by: Radiant Cosmetics, Mumbai (INCOMPLETE POSTAL ADDRESS)</text>

  <text x="70" y="380" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#dc2626">5. DATE OF MFG:</text>
  <text x="240" y="380" font-family="Arial, sans-serif" font-size="14" fill="#b91c1c" font-weight="bold">2026 (NO MONTH SPECIFIED - VIOLATION!)</text>

  <rect x="65" y="420" width="470" height="90" rx="6" fill="#fee2e2" stroke="#ef4444" stroke-dasharray="4"/>
  <text x="300" y="460" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b" text-anchor="middle">[VIOLATION: CONSUMER CARE CELL NOT PRINTED]</text>
  <text x="300" y="485" font-family="Arial, sans-serif" font-size="13" fill="#7f1d1d" text-anchor="middle">No contact name, telephone or email provided on package</text>

  <text x="70" y="550" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#991b1b">6. COUNTRY OF ORIGIN:</text>
  <text x="260" y="550" font-family="Arial, sans-serif" font-size="14" fill="#334155">India</text>
</svg>`);

const SAMPLE_IMAGE_AMBIGUOUS_LABEL = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fefce8">
  <rect width="600" height="750" fill="#fef9c3" stroke="#fde047" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#fffbeb" stroke="#eab308" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="60" rx="8" fill="#854d0e"/>
  <text x="300" y="82" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">LOW CONTRAST / AMBIGUOUS SAMPLE</text>

  <text x="70" y="160" font-family="Arial, sans-serif" font-size="13" fill="#71717a">Product: Instant Masala Spice Mix</text>
  <text x="70" y="210" font-family="Arial, sans-serif" font-size="12" fill="#a1a1aa">Net Qty: ~50g (Low OCR Confidence 58%)</text>
  <text x="70" y="260" font-family="Arial, sans-serif" font-size="12" fill="#a1a1aa">MRP: Rs. 3? (Partial Glare Occlusion)</text>
  <text x="70" y="310" font-family="Arial, sans-serif" font-size="12" fill="#71717a">Mfg: Spice Harvest Pvt Ltd, Jaipur</text>
  <text x="70" y="360" font-family="Arial, sans-serif" font-size="12" fill="#71717a">Date: 03/26</text>
  <text x="70" y="410" font-family="Arial, sans-serif" font-size="12" fill="#71717a">Consumer Care: 0141-2345***</text>

  <rect x="65" y="470" width="470" height="120" rx="8" fill="#fef3c7" stroke="#d97706"/>
  <text x="300" y="510" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#92400e" text-anchor="middle">⚠ IMAGE QUALITY ASSESSMENT: POOR</text>
  <text x="300" y="540" font-family="Arial, sans-serif" font-size="13" fill="#78350f" text-anchor="middle">High specular reflection / glare over Price and Quantity zones.</text>
  <text x="300" y="565" font-family="Arial, sans-serif" font-size="13" fill="#78350f" text-anchor="middle">Recommendation: Automated State = REVIEW (Officer verification required)</text>
</svg>`);

const SAMPLE_IMAGE_SHAMPOO_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="20" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="110" rx="12" fill="#0f172a"/>
  <text x="300" y="95" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#f43f5e" text-anchor="middle">RADIANT COSMETICS</text>
  <text x="300" y="130" font-family="Arial, sans-serif" font-size="16" fill="#f8fafc" text-anchor="middle">SILK GLOW HERBAL SHAMPOO</text>

  <rect x="120" y="190" width="360" height="260" rx="16" fill="#fff1f2" stroke="#f43f5e" stroke-width="2"/>
  <circle cx="300" cy="300" r="75" fill="#ffe4e6" stroke="#fb7185" stroke-width="3"/>
  <text x="300" y="315" font-family="Arial, sans-serif" font-size="50" text-anchor="middle">🧴</text>
  <text x="300" y="360" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#be123c" text-anchor="middle">HERBAL EXTRACTS</text>

  <rect x="60" y="490" width="480" height="180" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="80" y="530" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">FRONT PRINCIPAL DISPLAY PANEL</text>
  <text x="80" y="570" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0284c7">Net Volume: 200 ml</text>
  <text x="80" y="610" font-family="Arial, sans-serif" font-size="14" fill="#334155">Commodity: Ayurvedic &amp; Herbal Hair Cleanser</text>
  <text x="80" y="645" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Batch: RC-2026-09 | See back panel for statutory details</text>
</svg>`);

const SAMPLE_IMAGE_SPICE_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fefce8">
  <rect width="600" height="750" fill="#fef9c3" stroke="#fde047" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#fffbeb" stroke="#eab308" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="110" rx="12" fill="#713f12"/>
  <text x="300" y="95" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fde047" text-anchor="middle">SPICE HARVEST</text>
  <text x="300" y="130" font-family="Arial, sans-serif" font-size="17" fill="#fef3c7" text-anchor="middle">INSTANT MASALA SPICE MIX</text>

  <rect x="100" y="190" width="400" height="240" rx="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="300" cy="295" r="70" fill="#fef9c3" stroke="#eab308" stroke-width="3"/>
  <text x="300" y="310" font-family="Arial, sans-serif" font-size="46" text-anchor="middle">🌶️</text>
  <text x="300" y="355" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#854d0e" text-anchor="middle">AUTHENTIC INDIAN BLEND</text>

  <rect x="60" y="490" width="480" height="170" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <text x="80" y="530" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">FRONT DECLARATIONS</text>
  <text x="80" y="570" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#d97706">Net Quantity: ~50g (Low Contrast)</text>
  <text x="80" y="610" font-family="Arial, sans-serif" font-size="14" fill="#334155">Commodity: Ground Spices &amp; Condiments</text>
</svg>`);

const SAMPLE_IMAGE_WEBCAM_SCENE = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="#1e293b">
  <rect width="600" height="450" fill="#0f172a"/>
  <circle cx="300" cy="180" r="70" fill="#334155"/>
  <circle cx="300" cy="160" r="40" fill="#475569"/>
  <rect x="220" y="240" width="160" height="90" rx="20" fill="#475569"/>
  <text x="300" y="370" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f87171" text-anchor="middle">NO PACKAGED COMMODITY DETECTED</text>
  <text x="300" y="400" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Camera pointed at operator desk rather than consumer package label</text>
</svg>`);

class InMemoryDB {
  private inspections: Map<string, InspectionRecord> = new Map();
  private certificates: Map<string, ComplianceCertificate> = new Map();
  private rules: RuleDefinition[] = [...DEFAULT_RULES];
  private ruleEngine: LegalMetrologyRuleEngine;
  private systemAuditLogs: SystemAuditLogEntry[] = [];
  private notifications: SystemNotification[] = [];
  private users: Map<string, UserAccount> = new Map();
  private sessions: Map<string, UserAccount> = new Map();
  private citizenReports: Map<string, CitizenReport> = new Map();

  // SQLite Persistence Infrastructure (sql.js WASM file-backed engine)
  private SQL: any = null;
  private sqliteDb: SqlJsDatabase | null = null;
  private isPersistent: boolean = false;
  private dataDir: string = path.join(process.cwd(), 'data');
  private sqliteFilePath: string = path.join(process.cwd(), 'data', 'legalmetrix.sqlite');

  constructor() {
    this.ruleEngine = new LegalMetrologyRuleEngine(this.rules);
    INITIAL_ACCOUNTS.forEach((acc) => this.users.set(acc.id, acc));
    this.seedDemoData();
  }

  public getPersistenceStatus(): { isPersistent: boolean; databasePath: string; engine: string } {
    return {
      isPersistent: this.isPersistent,
      databasePath: this.sqliteFilePath,
      engine: 'SQLite 3 (via sql.js WASM persistence engine)'
    };
  }

  public async init(): Promise<void> {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      this.SQL = await initSqlJs();

      if (fs.existsSync(this.sqliteFilePath)) {
        const fileBuffer = fs.readFileSync(this.sqliteFilePath);
        this.sqliteDb = new this.SQL.Database(fileBuffer);
        this.isPersistent = true;
        this.loadFromSqlite();
        console.log('================================================================');
        console.log(`[LegalMetrix DB] Persistent storage ACTIVE: SQLite database initialized at ${this.sqliteFilePath}`);
        console.log(`[LegalMetrix DB] Ephemeral fallback active: false (Durable file-backed persistence enabled)`);
        console.log(`[LegalMetrix DB] Loaded records: ${this.inspections.size} inspections, ${this.certificates.size} certificates, ${this.rules.length} rules, ${this.systemAuditLogs.length} audit logs`);
        console.log('================================================================');
      } else {
        this.sqliteDb = new this.SQL.Database();
        this.isPersistent = true;
        this.createSqliteTables();
        this.persistAllToSqlite();
        console.log('================================================================');
        console.log(`[LegalMetrix DB] Persistent storage ACTIVE: Fresh SQLite database created at ${this.sqliteFilePath}`);
        console.log(`[LegalMetrix DB] Ephemeral fallback active: false (Durable file-backed persistence enabled)`);
        console.log(`[LegalMetrix DB] Seeded & persisted: ${this.inspections.size} inspections, ${this.certificates.size} certificates, ${this.rules.length} rules`);
        console.log('================================================================');
      }
    } catch (err: any) {
      this.isPersistent = false;
      console.warn('================================================================');
      console.warn('[LegalMetrix DB] WARNING: Failed to initialize SQLite persistent database. Running in EPHEMERAL in-memory mode:', err);
      console.warn('================================================================');
    }
  }

  private createSqliteTables() {
    if (!this.sqliteDb) return;
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS inspections (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS rules (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS rule_audit_logs (id TEXT PRIMARY KEY, timestamp TEXT, data TEXT);
      CREATE TABLE IF NOT EXISTS system_audit_logs (id TEXT PRIMARY KEY, timestamp TEXT, data TEXT);
      CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, timestamp TEXT, data TEXT);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS citizen_reports (id TEXT PRIMARY KEY, timestamp TEXT, data TEXT);
    `);
  }

  private loadFromSqlite() {
    if (!this.sqliteDb) return;
    try {
      this.createSqliteTables();

      const inspRes = this.sqliteDb.exec('SELECT id, data FROM inspections');
      if (inspRes.length > 0 && inspRes[0].values.length > 0) {
        this.inspections.clear();
        for (const row of inspRes[0].values) {
          const id = row[0] as string;
          const data = JSON.parse(row[1] as string);
          this.inspections.set(id, data);
        }
      }

      const certRes = this.sqliteDb.exec('SELECT id, data FROM certificates');
      if (certRes.length > 0 && certRes[0].values.length > 0) {
        this.certificates.clear();
        for (const row of certRes[0].values) {
          const id = row[0] as string;
          const data = JSON.parse(row[1] as string);
          this.certificates.set(id, data);
        }
      }

      const ruleRes = this.sqliteDb.exec('SELECT id, data FROM rules');
      if (ruleRes.length > 0 && ruleRes[0].values.length > 0) {
        this.rules = [];
        for (const row of ruleRes[0].values) {
          this.rules.push(JSON.parse(row[1] as string));
        }
        this.ruleEngine = new LegalMetrologyRuleEngine(this.rules);
      }

      const ruleAuditRes = this.sqliteDb.exec('SELECT id, data FROM rule_audit_logs ORDER BY timestamp DESC');
      if (ruleAuditRes.length > 0 && ruleAuditRes[0].values.length > 0) {
        this.ruleAuditLogs = [];
        for (const row of ruleAuditRes[0].values) {
          this.ruleAuditLogs.push(JSON.parse(row[1] as string));
        }
      }

      const sysAuditRes = this.sqliteDb.exec('SELECT id, data FROM system_audit_logs ORDER BY timestamp DESC');
      if (sysAuditRes.length > 0 && sysAuditRes[0].values.length > 0) {
        this.systemAuditLogs = [];
        for (const row of sysAuditRes[0].values) {
          this.systemAuditLogs.push(JSON.parse(row[1] as string));
        }
      }

      const notifRes = this.sqliteDb.exec('SELECT id, data FROM notifications ORDER BY timestamp DESC');
      if (notifRes.length > 0 && notifRes[0].values.length > 0) {
        this.notifications = [];
        for (const row of notifRes[0].values) {
          this.notifications.push(JSON.parse(row[1] as string));
        }
      }

      const sessionRes = this.sqliteDb.exec('SELECT token, data FROM sessions');
      if (sessionRes.length > 0 && sessionRes[0].values.length > 0) {
        this.sessions.clear();
        for (const row of sessionRes[0].values) {
          const token = row[0] as string;
          const user = JSON.parse(row[1] as string);
          this.sessions.set(token, user);
        }
      }

      const reportRes = this.sqliteDb.exec('SELECT id, data FROM citizen_reports');
      if (reportRes.length > 0 && reportRes[0].values.length > 0) {
        this.citizenReports.clear();
        for (const row of reportRes[0].values) {
          const id = row[0] as string;
          const data = JSON.parse(row[1] as string);
          this.citizenReports.set(id, data);
        }
      }
    } catch (err) {
      console.error('[LegalMetrix DB] Error reading from SQLite database:', err);
    }
  }

  private persistAllToSqlite() {
    if (!this.sqliteDb) return;
    try {
      this.createSqliteTables();
      for (const [id, record] of this.inspections.entries()) {
        this.sqliteDb.run('INSERT OR REPLACE INTO inspections (id, data) VALUES (?, ?)', [id, JSON.stringify(record)]);
      }
      for (const [id, cert] of this.certificates.entries()) {
        this.sqliteDb.run('INSERT OR REPLACE INTO certificates (id, data) VALUES (?, ?)', [id, JSON.stringify(cert)]);
      }
      for (const rule of this.rules) {
        this.sqliteDb.run('INSERT OR REPLACE INTO rules (id, data) VALUES (?, ?)', [rule.rule_id, JSON.stringify(rule)]);
      }
      for (const log of this.ruleAuditLogs) {
        this.sqliteDb.run('INSERT OR REPLACE INTO rule_audit_logs (id, timestamp, data) VALUES (?, ?, ?)', [log.id, log.timestamp, JSON.stringify(log)]);
      }
      for (const log of this.systemAuditLogs) {
        this.sqliteDb.run('INSERT OR REPLACE INTO system_audit_logs (id, timestamp, data) VALUES (?, ?, ?)', [log.id, log.timestamp, JSON.stringify(log)]);
      }
      for (const notif of this.notifications) {
        this.sqliteDb.run('INSERT OR REPLACE INTO notifications (id, timestamp, data) VALUES (?, ?, ?)', [notif.id, notif.timestamp, JSON.stringify(notif)]);
      }
      for (const [id, user] of this.users.entries()) {
        this.sqliteDb.run('INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)', [id, JSON.stringify(user)]);
      }
      for (const [token, user] of this.sessions.entries()) {
        this.sqliteDb.run('INSERT OR REPLACE INTO sessions (token, data) VALUES (?, ?)', [token, JSON.stringify(user)]);
      }
      for (const [id, report] of this.citizenReports.entries()) {
        this.sqliteDb.run('INSERT OR REPLACE INTO citizen_reports (id, timestamp, data) VALUES (?, ?, ?)', [id, report.submitted_at, JSON.stringify(report)]);
      }
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Error persisting all to SQLite:', err);
    }
  }

  private flushDisk() {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      const data = this.sqliteDb.export();
      fs.writeFileSync(this.sqliteFilePath, Buffer.from(data));
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to flush SQLite to disk:', err);
    }
  }

  private persistInspection(record: InspectionRecord) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO inspections (id, data) VALUES (?, ?)', [record.id, JSON.stringify(record)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist inspection:', err);
    }
  }

  private persistCertificate(cert: ComplianceCertificate) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO certificates (id, data) VALUES (?, ?)', [cert.certificate_id, JSON.stringify(cert)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist certificate:', err);
    }
  }

  private persistRule(rule: RuleDefinition) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO rules (id, data) VALUES (?, ?)', [rule.rule_id, JSON.stringify(rule)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist rule:', err);
    }
  }

  private persistRuleAudit(log: RuleAuditLogEntry) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO rule_audit_logs (id, timestamp, data) VALUES (?, ?, ?)', [log.id, log.timestamp, JSON.stringify(log)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist rule audit log:', err);
    }
  }

  private persistSystemAudit(log: SystemAuditLogEntry) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO system_audit_logs (id, timestamp, data) VALUES (?, ?, ?)', [log.id, log.timestamp, JSON.stringify(log)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist system audit log:', err);
    }
  }

  private persistNotification(notif: SystemNotification) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO notifications (id, timestamp, data) VALUES (?, ?, ?)', [notif.id, notif.timestamp, JSON.stringify(notif)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist notification:', err);
    }
  }

  private persistSession(token: string, user: UserAccount) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO sessions (token, data) VALUES (?, ?)', [token, JSON.stringify(user)]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist session:', err);
    }
  }

  private deletePersistedSession(token: string) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('DELETE FROM sessions WHERE token = ?', [token]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to delete session:', err);
    }
  }

  private persistCitizenReport(report: CitizenReport) {
    if (!this.sqliteDb || !this.isPersistent) return;
    try {
      this.sqliteDb.run('INSERT OR REPLACE INTO citizen_reports (id, timestamp, data) VALUES (?, ?, ?)', [
        report.id,
        report.submitted_at,
        JSON.stringify(report)
      ]);
      this.flushDisk();
    } catch (err) {
      console.error('[LegalMetrix DB] Failed to persist citizen report:', err);
    }
  }

  public getRuleEngine(): LegalMetrologyRuleEngine {
    return this.ruleEngine;
  }

  public seedDemoData() {
    this.inspections.clear();

    // DEMO 1: Fully Compliant Product (PASS)
    const demo1: InspectionRecord = {
      id: 'INS-2026-00101',
      product_name: 'Crunchy Wholegrain Oats Cookies',
      brand: 'Aura Organics Foods',
      category: 'Food',
      barcode: '8901234567890',
      dimensions: { width: 140, height: 210, depth: 45, unit: 'mm' },
      reference_scale_present: true,
      location: 'Bengaluru District Enforcement Division',
      officer_id: 'OFF-KA-402',
      officer_name: 'Inspector Rajesh Kumar (Legal Metrology)',
      officer_notes: 'Standard retail package collected during routine market surveillance.',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      status: 'PASS',
      screening_score: 98,
      is_demo: true,
      images: [
        {
          id: 'img-d1-f',
          type: 'Front',
          name: 'aura_cookies_front.png',
          url: SAMPLE_IMAGE_FRONT_COMPLIANT,
          quality: {
            overall: 'GOOD',
            blurScore: 92,
            contrastScore: 88,
            brightnessScore: 85,
            resolution: '1920x1080',
            issues: []
          }
        },
        {
          id: 'img-d1-b',
          type: 'Back',
          name: 'aura_cookies_back.png',
          url: SAMPLE_IMAGE_BACK_COMPLIANT,
          quality: {
            overall: 'GOOD',
            blurScore: 94,
            contrastScore: 91,
            brightnessScore: 87,
            resolution: '1920x1080',
            issues: []
          }
        }
      ],
      declarations: [
        {
          id: 'd1-1',
          field: 'product_name',
          label: 'Generic / Common Product Name',
          original_text: 'Crunchy Wholegrain Oats Cookies',
          normalized_value: 'Crunchy Wholegrain Oats Cookies',
          found: true,
          status: 'FOUND',
          confidence: 0.99,
          image_id: 'img-d1-f',
          image_type: 'Front',
          bbox: { ymin: 15, xmin: 10, ymax: 25, xmax: 90 }
        },
        {
          id: 'd1-2',
          field: 'net_quantity',
          label: 'Net Quantity',
          original_text: 'Net Quantity: 200 g (2 x 100g Packs)',
          normalized_value: '200 g',
          found: true,
          status: 'FOUND',
          confidence: 0.98,
          image_id: 'img-d1-f',
          image_type: 'Front',
          bbox: { ymin: 72, xmin: 12, ymax: 82, xmax: 85 }
        },
        {
          id: 'd1-3',
          field: 'mrp',
          label: 'Maximum Retail Price (MRP)',
          original_text: '₹75.00 (Incl. of all taxes)',
          normalized_value: '75.00 INR',
          found: true,
          status: 'FOUND',
          confidence: 0.99,
          image_id: 'img-d1-b',
          image_type: 'Back',
          bbox: { ymin: 28, xmin: 10, ymax: 36, xmax: 90 }
        },
        {
          id: 'd1-4',
          field: 'manufacturer_name',
          label: 'Manufacturer / Packer Name & Address',
          original_text: 'Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area, Bengaluru, Karnataka - 560058, India.',
          normalized_value: 'Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area, Bengaluru - 560058',
          found: true,
          status: 'FOUND',
          confidence: 0.96,
          image_id: 'img-d1-b',
          image_type: 'Back',
          bbox: { ymin: 40, xmin: 10, ymax: 50, xmax: 90 }
        },
        {
          id: 'd1-5',
          field: 'mfg_date',
          label: 'Month & Year of Packing',
          original_text: 'Date of Packing: 04/2026',
          normalized_value: 'APR-2026',
          found: true,
          status: 'FOUND',
          confidence: 0.97,
          image_id: 'img-d1-b',
          image_type: 'Back',
          bbox: { ymin: 51, xmin: 10, ymax: 57, xmax: 60 }
        },
        {
          id: 'd1-6',
          field: 'consumer_care',
          label: 'Consumer Care Cell Details',
          original_text: 'Manager, Consumer Grievance Cell, at Mfd Address. Toll Free: 1800-425-9988 | Email: care@auraorganics.in',
          normalized_value: 'Manager, Care Cell, Tel: 1800-425-9988, Email: care@auraorganics.in',
          found: true,
          status: 'FOUND',
          confidence: 0.97,
          image_id: 'img-d1-b',
          image_type: 'Back',
          bbox: { ymin: 66, xmin: 10, ymax: 78, xmax: 90 }
        },
        {
          id: 'd1-7',
          field: 'country_of_origin',
          label: 'Country of Origin',
          original_text: 'Country of Origin: India',
          normalized_value: 'India',
          found: true,
          status: 'FOUND',
          confidence: 0.99,
          image_id: 'img-d1-b',
          image_type: 'Back',
          bbox: { ymin: 62, xmin: 10, ymax: 67, xmax: 60 }
        },
        {
          id: 'd1-8',
          field: 'unit_sale_price',
          label: 'Unit Sale Price (USP)',
          original_text: 'Unit Sale Price: ₹0.38 / g',
          normalized_value: '0.38 INR/g',
          found: true,
          status: 'FOUND',
          confidence: 0.95,
          image_id: 'img-d1-b',
          image_type: 'Back',
          bbox: { ymin: 34, xmin: 10, ymax: 40, xmax: 60 }
        }
      ],
      rule_evaluations: [
        {
          rule_id: 'LM-PC-NAME-001',
          field: 'product_name',
          title: 'Generic / Common Commodity Name Declaration',
          status: 'PASS',
          reason: 'Common product name prominently declared on principal display panel.',
          confidence: 0.99,
          severity: 'HIGH',
          evidence_images: ['img-d1-f'],
          evidence_text: 'Crunchy Wholegrain Oats Cookies',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)'
        },
        {
          rule_id: 'LM-PC-QTY-002',
          field: 'net_quantity',
          title: 'Net Quantity Declaration & Standard Metric Units',
          status: 'PASS',
          reason: 'Declared in standard metric units (200 g).',
          confidence: 0.98,
          severity: 'HIGH',
          evidence_images: ['img-d1-f'],
          evidence_text: '200 g',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(b)'
        },
        {
          rule_id: 'LM-PC-MRP-003',
          field: 'mrp',
          title: 'Maximum Retail Price (MRP) & Tax Inclusivity',
          status: 'PASS',
          reason: 'MRP explicitly formatted with ₹ symbol and "inclusive of all taxes".',
          confidence: 0.99,
          severity: 'HIGH',
          evidence_images: ['img-d1-b'],
          evidence_text: '₹75.00 (Incl. of all taxes)',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)'
        },
        {
          rule_id: 'LM-PC-MFG-004',
          field: 'manufacturer_name',
          title: 'Manufacturer / Packer / Importer Complete Address',
          status: 'PASS',
          reason: 'Full postal address with industrial plot, city, state and PIN code present.',
          confidence: 0.96,
          severity: 'HIGH',
          evidence_images: ['img-d1-b'],
          evidence_text: 'Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area, Bengaluru - 560058',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)'
        },
        {
          rule_id: 'LM-PC-DATE-005',
          field: 'mfg_date',
          title: 'Month and Year of Manufacture / Packing',
          status: 'PASS',
          reason: 'Proper MM/YYYY format declared.',
          confidence: 0.97,
          severity: 'MEDIUM',
          evidence_images: ['img-d1-b'],
          evidence_text: '04/2026',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(d)'
        },
        {
          rule_id: 'LM-PC-CC-006',
          field: 'consumer_care',
          title: 'Consumer Care Cell Details',
          status: 'PASS',
          reason: 'Both toll-free contact telephone and email ID declared with officer contact person.',
          confidence: 0.97,
          severity: 'HIGH',
          evidence_images: ['img-d1-b'],
          evidence_text: 'Toll Free: 1800-425-9988 | Email: care@auraorganics.in',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(n)'
        },
        {
          rule_id: 'LM-PC-COO-007',
          field: 'country_of_origin',
          title: 'Country of Origin Declaration',
          status: 'PASS',
          reason: 'Country of origin clearly stated as India.',
          confidence: 0.99,
          severity: 'MEDIUM',
          evidence_images: ['img-d1-b'],
          evidence_text: 'Country of Origin: India',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules — Rule 6(1)(a)'
        }
      ],
      cross_image_checks: [
        {
          field: 'net_quantity',
          label: 'Net Quantity Consistency',
          front_value: '200 g',
          back_value: '200 g',
          is_consistent: true,
          status: 'PASS',
          details: 'Front panel net quantity (200 g) matches back panel specification.'
        }
      ],
      readability_analysis: {
        characterHeightPxEstimated: 26,
        referenceScalePresent: true,
        is_calibrated: true,
        calibration_label: 'Certified Physical Measurement (13.5 px/mm)',
        scale_factor_px_per_mm: 13.5,
        estimatedCharHeightMm: 3.2,
        requiredMinHeightMm: 2.0,
        contrastRatio: 14.2,
        sharpness: 94,
        status: 'PASS',
        message: 'Font height (3.2mm) exceeds mandatory 2.0mm threshold for 200g net quantity.'
      },
      calibration: {
        is_calibrated: true,
        method: 'REFERENCE_OBJECT',
        reference_object: { type: 'COIN_INR_5', label: '₹5 Coin (23mm diameter)', known_dimension_mm: 23 },
        pixels_per_mm: 13.5,
        detected_package_pixels: { width_px: 1890, height_px: 2835 },
        calibrated_by: 'Inspector Rajesh Kumar (Legal Metrology)',
        calibration_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      chain_of_custody: {
        capture_timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        device_id: 'LM-INSP-TAB-KA09',
        device_type: 'Samsung Galaxy Tab Active4 Pro (Enforcement Edition)',
        gps_consent: true,
        gps_coordinates: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy_meters: 3.2,
          location_label: 'KIADB Industrial Retail Area, Bengaluru'
        },
        image_sha256: '9f83ac02c65e8a9f02934bca81023d849204bfef203948572019aebdc84920aa',
        custody_officer: 'Inspector Rajesh Kumar (KA-LM-402)',
        tamper_verification_hash: 'SHA256:SEC-CUSTODY-894819481-VERIFIED',
        integrity_status: 'VERIFIED_INTACT'
      },
      cross_regime_notices: LegalMetrologyRuleEngine.getCrossRegimeNotices('Food'),
      dispute_status: 'NONE',
      sync_status: 'SYNCED',
      scan_mode: 'DEMO_PRESET',
      mfg_date_stated: '2026-04',
      plain_language_summary: 'The packaged commodity screening indicates prima facie compliance with mandatory declarations under Rule 6 and Rule 7 of the Legal Metrology (Packaged Commodities) Rules, 2011. All examined mandatory panels (Name, Net Qty, MRP, Manufacturer, Date, Consumer Care) are present and conform to statutory metric formats. Standard surveillance log created with no enforcement seizure required.',
      warnings: [],
      ai_notes: 'Compliant package screening. All statutory declarations meet standard Legal Metrology (Packaged Commodities) Rules 2011 requirements.',
      certificate_id: 'CERT-LM-2026-00101'
    };

    // DEMO 2: Missing Consumer Care & Date formatting violation (FAIL)
    const demo2: InspectionRecord = {
      id: 'INS-2026-00102',
      product_name: 'Silk Glow Herbal Shampoo',
      brand: 'Radiant Cosmetics',
      category: 'Cosmetics',
      barcode: '8909876543210',
      reference_scale_present: false,
      location: 'Connaught Place Commercial Inspection Zone, New Delhi',
      officer_id: 'OFF-DL-109',
      officer_name: 'Officer Priya Sharma',
      officer_notes: 'Routine seizure of cosmetic batch exhibiting suspect consumer care omissions.',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: 'FAIL',
      screening_score: 35,
      is_demo: true,
      calibration: {
        is_calibrated: false,
        method: 'NONE'
      },
      chain_of_custody: {
        capture_timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        device_id: 'LM-INSP-TAB-DL02',
        device_type: 'iPad Pro 11 (Field Unit)',
        gps_consent: true,
        gps_coordinates: {
          latitude: 28.6315,
          longitude: 77.2167,
          accuracy_meters: 4.5,
          location_label: 'Block A, Connaught Place, New Delhi'
        },
        image_sha256: 'a7183e8902c34d88e00192837482910384758291029384758291029384758291',
        custody_officer: 'Officer Priya Sharma (DL-LM-109)',
        tamper_verification_hash: 'SHA256:SEC-CUSTODY-391829102-VERIFIED',
        integrity_status: 'VERIFIED_INTACT'
      },
      cross_regime_notices: LegalMetrologyRuleEngine.getCrossRegimeNotices('Cosmetics'),
      dispute_status: 'OPEN',
      dispute_details: {
        dispute_id: 'DIS-2026-081',
        filed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        manufacturer_name: 'Radiant Cosmetics',
        manufacturer_response: 'We contend that the consumer care email was printed on the outer carton shrink-wrap and request re-inspection before notice issuance under Section 36.'
      },
      sync_status: 'SYNCED',
      scan_mode: 'DEMO_PRESET',
      plain_language_summary: 'Screening identified 3 statutory violation(s) under the Legal Metrology (Packaged Commodities) Rules, 2011, notably in: Maximum Retail Price (MRP) & Tax Inclusivity, Month and Year of Manufacture / Packing / Import, and Consumer Care Cell Details. Under Section 36 of the Legal Metrology Act, 2009, sale or distribution of non-conforming pre-packaged goods constitutes a compoundable offense. It is recommended that an inspection memo be issued to the packer/manufacturer giving 15 days to show cause or apply for compounding.',
      images: [
        {
          id: 'img-d2-front',
          type: 'Front',
          name: 'shampoo_front_bottle.png',
          url: SAMPLE_IMAGE_SHAMPOO_FRONT,
          quality: {
            overall: 'GOOD',
            blurScore: 92,
            contrastScore: 90,
            brightnessScore: 88,
            resolution: '1920x1080',
            issues: []
          }
        },
        {
          id: 'img-d2-back',
          type: 'Back',
          name: 'shampoo_label_back.png',
          url: SAMPLE_IMAGE_VIOLATION_LABEL,
          quality: {
            overall: 'GOOD',
            blurScore: 89,
            contrastScore: 85,
            brightnessScore: 84,
            resolution: '1920x1080',
            issues: []
          }
        }
      ],
      declarations: [
        {
          id: 'd2-1',
          field: 'product_name',
          label: 'Generic Product Name',
          original_text: 'Silk Glow Herbal Shampoo',
          normalized_value: 'Silk Glow Herbal Shampoo',
          found: true,
          status: 'FOUND',
          confidence: 0.98,
          image_id: 'img-d2-back',
          image_type: 'Back',
          bbox: { ymin: 18, xmin: 10, ymax: 26, xmax: 90 }
        },
        {
          id: 'd2-2',
          field: 'net_quantity',
          label: 'Net Quantity',
          original_text: '200ml',
          normalized_value: '200 ml',
          found: true,
          status: 'FOUND',
          confidence: 0.95,
          image_id: 'img-d2-back',
          image_type: 'Back',
          bbox: { ymin: 27, xmin: 10, ymax: 33, xmax: 50 }
        },
        {
          id: 'd2-3',
          field: 'mrp',
          label: 'Maximum Retail Price (MRP)',
          original_text: 'Price: 199',
          normalized_value: '199.00 INR',
          found: true,
          status: 'UNCERTAIN',
          confidence: 0.72,
          image_id: 'img-d2-back',
          image_type: 'Back',
          bbox: { ymin: 34, xmin: 10, ymax: 42, xmax: 90 }
        },
        {
          id: 'd2-4',
          field: 'manufacturer_name',
          label: 'Manufacturer Address',
          original_text: 'Mfd by: Radiant Cosmetics, Mumbai',
          normalized_value: 'Radiant Cosmetics, Mumbai',
          found: true,
          status: 'FOUND',
          confidence: 0.88,
          image_id: 'img-d2-back',
          image_type: 'Back',
          bbox: { ymin: 44, xmin: 10, ymax: 52, xmax: 90 }
        },
        {
          id: 'd2-5',
          field: 'mfg_date',
          label: 'Date of Manufacture',
          original_text: '2026',
          normalized_value: '2026',
          found: true,
          status: 'UNCERTAIN',
          confidence: 0.70,
          image_id: 'img-d2-back',
          image_type: 'Back',
          bbox: { ymin: 53, xmin: 10, ymax: 59, xmax: 60 }
        },
        {
          id: 'd2-6',
          field: 'consumer_care',
          label: 'Consumer Care Details',
          original_text: '',
          normalized_value: '',
          found: false,
          status: 'NOT_FOUND',
          confidence: 0.0,
          image_id: 'img-d2-back',
          image_type: 'Back'
        }
      ],
      rule_evaluations: [
        {
          rule_id: 'LM-PC-CC-006',
          field: 'consumer_care',
          title: 'Consumer Care Cell Details',
          status: 'FAIL',
          reason: 'Mandatory Consumer Care Grievance Redressal details (telephone, email, address) completely omitted.',
          confidence: 0.99,
          severity: 'HIGH',
          evidence_images: ['img-d2-back'],
          evidence_text: 'No consumer care cell section detected on package label.',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(n)'
        },
        {
          rule_id: 'LM-PC-MRP-003',
          field: 'mrp',
          title: 'Maximum Retail Price (MRP) & Tax Inclusivity',
          status: 'FAIL',
          reason: 'Price declared as "Price: 199" without mandatory "MRP" acronym and without "Inclusive of all taxes" declaration.',
          confidence: 0.94,
          severity: 'HIGH',
          evidence_images: ['img-d2-back'],
          evidence_text: 'Price: 199',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)'
        },
        {
          rule_id: 'LM-PC-DATE-005',
          field: 'mfg_date',
          title: 'Month and Year of Manufacture / Packing',
          status: 'FAIL',
          reason: 'Only year "2026" declared. Legal Metrology rules strictly mandate declaration of both Month and Year.',
          confidence: 0.95,
          severity: 'HIGH',
          evidence_images: ['img-d2-back'],
          evidence_text: '2026',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(d)'
        },
        {
          rule_id: 'LM-PC-MFG-004',
          field: 'manufacturer_name',
          title: 'Complete Postal Address of Manufacturer',
          status: 'REVIEW',
          reason: 'Address states only "Mumbai" without street, plot, industrial zone or PIN code.',
          confidence: 0.89,
          severity: 'MEDIUM',
          evidence_images: ['img-d2-back'],
          evidence_text: 'Mfd by: Radiant Cosmetics, Mumbai',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)'
        }
      ],
      cross_image_checks: [],
      warnings: [
        'Critical non-compliance detected: Rule 6(1)(n) Consumer Care grievance details missing.',
        'Improper MRP tax inclusivity notation violating Rule 6(1)(e).'
      ],
      ai_notes: 'Violations identified across Consumer Care, Price formatting, and Manufacturing date requirements.'
    };

    // DEMO 3: Poor/Ambiguous image with glare (REVIEW)
    const demo3: InspectionRecord = {
      id: 'INS-2026-00103',
      product_name: 'Instant Masala Spice Mix',
      brand: 'Spice Harvest',
      category: 'Food',
      reference_scale_present: false,
      location: 'Jaipur Wholesale Mandi Inspection Cell',
      officer_id: 'OFF-RJ-304',
      officer_name: 'Officer Ananya Sen',
      officer_notes: 'Image taken in dimly lit warehouse stall with flash reflection.',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      status: 'REVIEW',
      dispute_status: 'NONE',
      sync_status: 'SYNCED',
      screening_score: 64,
      is_demo: true,
      images: [
        {
          id: 'img-d3-front',
          type: 'Front',
          name: 'spice_mix_front.png',
          url: SAMPLE_IMAGE_SPICE_FRONT,
          quality: {
            overall: 'GOOD',
            blurScore: 88,
            contrastScore: 86,
            brightnessScore: 84,
            resolution: '1920x1080',
            issues: []
          }
        },
        {
          id: 'img-d3-glare',
          type: 'Back',
          name: 'spice_mix_glare.png',
          url: SAMPLE_IMAGE_AMBIGUOUS_LABEL,
          quality: {
            overall: 'POOR',
            blurScore: 54,
            contrastScore: 48,
            brightnessScore: 92,
            resolution: '1280x720',
            issues: [
              'Specular glare over central declaration zone',
              'Low optical contrast between text and background',
              'OCR confidence reduced below 70%'
            ]
          }
        }
      ],
      declarations: [
        {
          id: 'd3-1',
          field: 'product_name',
          label: 'Product Name',
          original_text: 'Instant Masala Spice Mix',
          normalized_value: 'Instant Masala Spice Mix',
          found: true,
          status: 'FOUND',
          confidence: 0.82,
          image_id: 'img-d3-glare',
          image_type: 'Back',
          bbox: { ymin: 18, xmin: 10, ymax: 25, xmax: 80 }
        },
        {
          id: 'd3-2',
          field: 'net_quantity',
          label: 'Net Quantity',
          original_text: '~50g',
          normalized_value: '50 g',
          found: true,
          status: 'UNCERTAIN',
          confidence: 0.58,
          image_id: 'img-d3-glare',
          image_type: 'Back',
          bbox: { ymin: 26, xmin: 10, ymax: 33, xmax: 60 }
        },
        {
          id: 'd3-3',
          field: 'mrp',
          label: 'Maximum Retail Price',
          original_text: 'Rs. 3?',
          normalized_value: '30.00 INR',
          found: true,
          status: 'UNCERTAIN',
          confidence: 0.52,
          image_id: 'img-d3-glare',
          image_type: 'Back',
          bbox: { ymin: 34, xmin: 10, ymax: 42, xmax: 60 }
        }
      ],
      rule_evaluations: [
        {
          rule_id: 'LM-PC-QTY-002',
          field: 'net_quantity',
          title: 'Net Quantity Legibility Verification',
          status: 'REVIEW',
          reason: 'Low OCR confidence (58%) due to flash glare. Manual verification recommended.',
          confidence: 0.58,
          severity: 'HIGH',
          evidence_images: ['img-d3-glare'],
          evidence_text: '~50g',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(b)'
        },
        {
          rule_id: 'LM-PC-MRP-003',
          field: 'mrp',
          title: 'MRP Legibility & Value Verification',
          status: 'REVIEW',
          reason: 'Price digit partially obscured by specular glare artifact. Manual officer verification required.',
          confidence: 0.52,
          severity: 'HIGH',
          evidence_images: ['img-d3-glare'],
          evidence_text: 'Rs. 3?',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)'
        },
        {
          rule_id: 'LM-PC-READ-010',
          field: 'readability',
          title: 'Print Contrast & Legibility Screening',
          status: 'REVIEW',
          reason: 'Image quality rated POOR due to glare. Physical inspection recommended.',
          confidence: 0.60,
          severity: 'MEDIUM',
          evidence_images: ['img-d3-glare'],
          evidence_text: 'Optical contrast ratio: 4.2:1 (Marginal)',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules — Rule 7'
        }
      ],
      cross_image_checks: [],
      warnings: [
        'Image quality is POOR. Consider recapturing the package photo under diffused lighting.'
      ],
      ai_notes: 'Ambiguous image triggers REVIEW status. System adheres to conservative risk assessment.'
    };

    // DEMO 4: Controlled Multi-image Contradiction (Front 100g vs Back 80g)
    const demo4: InspectionRecord = {
      id: 'INS-2026-00104',
      product_name: 'Crunchy Protein Bites (Contradiction Test)',
      brand: 'NutriFit Foods',
      category: 'Food',
      barcode: '8904561237895',
      reference_scale_present: false,
      location: 'Hyderabad State Metrology Directorate',
      officer_id: 'OFF-TS-205',
      officer_name: 'Senior Officer Vikram Reddy',
      officer_notes: 'Sample test showing cross-image discrepancy between front graphic claims and back statutory declarations.',
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      status: 'REVIEW',
      dispute_status: 'NONE',
      sync_status: 'SYNCED',
      screening_score: 68,
      is_demo: true,
      images: [
        {
          id: 'img-d4-f',
          type: 'Front',
          name: 'protein_front_100g.png',
          url: SAMPLE_IMAGE_FRONT_COMPLIANT,
          quality: {
            overall: 'GOOD',
            blurScore: 90,
            contrastScore: 88,
            brightnessScore: 86,
            resolution: '1920x1080',
            issues: []
          }
        },
        {
          id: 'img-d4-b',
          type: 'Back',
          name: 'protein_back_80g.png',
          url: SAMPLE_IMAGE_BACK_COMPLIANT,
          quality: {
            overall: 'GOOD',
            blurScore: 92,
            contrastScore: 90,
            brightnessScore: 88,
            resolution: '1920x1080',
            issues: []
          }
        }
      ],
      declarations: [
        {
          id: 'd4-1',
          field: 'product_name',
          label: 'Product Name',
          original_text: 'Crunchy Protein Bites',
          normalized_value: 'Crunchy Protein Bites',
          found: true,
          status: 'FOUND',
          confidence: 0.98,
          image_id: 'img-d4-f',
          image_type: 'Front'
        },
        {
          id: 'd4-2',
          field: 'net_quantity',
          label: 'Net Quantity (Front Panel)',
          original_text: 'Net Wt: 100 g',
          normalized_value: '100 g',
          found: true,
          status: 'FOUND',
          confidence: 0.97,
          image_id: 'img-d4-f',
          image_type: 'Front'
        },
        {
          id: 'd4-3',
          field: 'net_quantity',
          label: 'Net Quantity (Back Panel)',
          original_text: 'Net Qty: 80 g',
          normalized_value: '80 g',
          found: true,
          status: 'FOUND',
          confidence: 0.96,
          image_id: 'img-d4-b',
          image_type: 'Back'
        },
        {
          id: 'd4-4',
          field: 'mrp',
          label: 'Maximum Retail Price',
          original_text: 'MRP ₹50.00 (Incl. of all taxes)',
          normalized_value: '50.00 INR',
          found: true,
          status: 'FOUND',
          confidence: 0.98,
          image_id: 'img-d4-b',
          image_type: 'Back'
        }
      ],
      rule_evaluations: [
        {
          rule_id: 'LM-PC-CROSS-011',
          field: 'net_quantity',
          title: 'Cross-Image Inconsistency: Net Quantity Contradiction',
          status: 'REVIEW',
          reason: 'Cross-image inconsistency detected — Front states "100 g" while Back states "80 g". High priority manual verification required.',
          confidence: 0.97,
          severity: 'HIGH',
          evidence_images: ['img-d4-f', 'img-d4-b'],
          evidence_text: 'Front: "100 g" vs Back: "80 g"',
          normative_reference: 'Legal Metrology Enforcement Standard — Cross-Panel Consistency'
        }
      ],
      cross_image_checks: [
        {
          field: 'net_quantity',
          label: 'Net Quantity Cross-Panel Consistency',
          front_value: '100 g',
          back_value: '80 g',
          is_consistent: false,
          status: 'REVIEW',
          details: 'Cross-image inconsistency detected — Front states "100 g" while Back states "80 g". High priority manual verification required.'
        }
      ],
      warnings: [
        'HIGH PRIORITY REVIEW: Conflicting declarations between Front and Back package faces.'
      ],
      ai_notes: 'Cross-Image Multi-View Intelligence flagged conflicting net quantity declarations across package panels.'
    };

    // DEMO 5: Incomplete Capture / Missing Images
    const demo5: InspectionRecord = {
      id: 'INS-2026-00105',
      product_name: 'Incomplete Capture Sample (Missing Images)',
      brand: 'Pending Verification',
      category: 'Food',
      barcode: '8906001239999',
      reference_scale_present: false,
      location: 'Bengaluru South Enforcement Division',
      officer_id: 'OFF-KA-402',
      officer_name: 'Inspector Rajesh Kumar',
      officer_notes: 'Optical capture session interrupted before label panels were recorded.',
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      status: 'INCOMPLETE_CAPTURE',
      dispute_status: 'NONE',
      sync_status: 'SYNCED',
      screening_score: 0,
      is_demo: true,
      is_package_detected: false,
      images: [],
      declarations: [],
      rule_evaluations: [],
      cross_image_checks: [],
      warnings: [
        'INCOMPLETE CAPTURE: Zero readable panels captured. Please upload or photograph at least one package panel to initiate Legal Metrology rule verification.'
      ],
      plain_language_summary: 'Optical capture session terminated prematurely or incomplete. At least one readable face of the packaged commodity must be uploaded.'
    };

    // DEMO 6: Non-Commodity Photo / Face or Office Scene (No Package Detected)
    const demo6: InspectionRecord = {
      id: 'INS-2026-00106',
      product_name: 'Office Webcam Capture (Non-Commodity Photo)',
      brand: 'N/A',
      category: 'Other',
      barcode: 'UNASSIGNED',
      reference_scale_present: false,
      location: 'Delhi Central Surveillance Wing',
      officer_id: 'OFF-DL-SUP-109',
      officer_name: 'Deputy Controller Priya Sharma',
      officer_notes: 'Captured frame lacks pre-packaged commodity characteristics.',
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: 'NO_PACKAGE_DETECTED',
      dispute_status: 'NONE',
      sync_status: 'SYNCED',
      screening_score: 0,
      is_demo: true,
      is_package_detected: false,
      images: [
        {
          id: 'img-d6-webcam',
          type: 'Front',
          name: 'webcam_stream.png',
          url: SAMPLE_IMAGE_WEBCAM_SCENE,
          quality: {
            overall: 'POOR',
            blurScore: 45,
            contrastScore: 50,
            brightnessScore: 55,
            resolution: '640x480',
            issues: ['No statutory package detected in camera field of view']
          }
        }
      ],
      declarations: [],
      rule_evaluations: [],
      cross_image_checks: [],
      warnings: [
        'NO PACKAGE DETECTED: Image classification engine found 0.00% probability of consumer packaging or statutory declaration typography.'
      ],
      plain_language_summary: 'Image analysis determined that the captured frame does not contain a consumer packaged commodity or statutory labeling panel. Optical rule verification halted.'
    };

    this.inspections.set(demo1.id, demo1);
    this.inspections.set(demo2.id, demo2);
    this.inspections.set(demo3.id, demo3);
    this.inspections.set(demo4.id, demo4);
    this.inspections.set(demo5.id, demo5);
    this.inspections.set(demo6.id, demo6);

    // Seed Certificates
    this.certificates.clear();

    const cert1: ComplianceCertificate = {
      certificate_id: 'CERT-LM-2026-00101',
      inspection_id: 'INS-2026-00101',
      gtin_barcode: '8901234567890',
      product_name: 'Crunchy Wholegrain Oats Cookies',
      brand: 'Aura Organics Foods',
      category: 'Food',
      net_quantity: '200 g (2 x 100g Packs)',
      mrp: '₹75.00 (Incl. of all taxes)',
      manufacturer_details: {
        name: 'Aura Organics Foods Pvt Ltd',
        address: 'Plot 14, Phase III, KIADB Industrial Area, Bengaluru, Karnataka - 560058, India',
        state: 'Karnataka',
        pin_code: '560058',
        email: 'care@auraorganics.in',
        phone: '1800-425-9988'
      },
      inspecting_officer: {
        name: 'Inspector Rajesh Kumar (Legal Metrology)',
        role: 'Enforcement Officer',
        badge_id: 'OFF-KA-402'
      },
      issued_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      validity_months: 12,
      expires_at: new Date(Date.now() + 363 * 24 * 3600 * 1000).toISOString(),
      rule_repository_version: '2026.1 (Gazette GSR 779(E) Mandate)',
      screening_score: 98,
      chain_of_custody_hash: 'SHA256:CUSTODY-AURA-00101-VERIFIED-98F84B1A',
      tamper_digest: 'SHA256:CERT-DIGEST-99F84B1A02E39D6C55AA7120',
      status: 'ACTIVE',
      statutory_disclaimer: 'Issued pursuant to Rule 6 & Schedule II of the Legal Metrology (Packaged Commodities) Rules, 2011. Certified based on multimodal OCR declaration extraction and physical metric calibration. Subject to immediate revocation upon post-market non-compliance.',
      public_verification_url: '/verify/CERT-LM-2026-00101'
    };

    const cert2: ComplianceCertificate = {
      certificate_id: 'CERT-LM-2026-00088',
      inspection_id: 'INS-2026-00088',
      gtin_barcode: '8909876543210',
      product_name: 'Radiant Silk Glow Shampoo 200ml',
      brand: 'Radiant Cosmetics',
      category: 'Cosmetics',
      net_quantity: '200 ml',
      mrp: '₹199.00',
      manufacturer_details: {
        name: 'Radiant Cosmetics LLP',
        address: 'Andheri East, Mumbai, Maharashtra - 400069, India',
        state: 'Maharashtra',
        pin_code: '400069'
      },
      inspecting_officer: {
        name: 'Deputy Controller V. Nair (Supervisor)',
        role: 'Senior Officer',
        badge_id: 'SUP-MH-109'
      },
      issued_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
      validity_months: 12,
      expires_at: new Date(Date.now() + 320 * 24 * 3600 * 1000).toISOString(),
      rule_repository_version: '2026.1',
      screening_score: 52,
      chain_of_custody_hash: 'SHA256:CUSTODY-RAD-REVOKED-884A',
      tamper_digest: 'SHA256:CERT-DIGEST-REVOKED-00088',
      status: 'REVOKED',
      revocation_details: {
        revoked_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        revoked_by: 'Deputy Controller V. Nair (Supervisor)',
        reason: 'Post-market surveillance lab sample failed statutory declarations: Missing mandatory Consumer Care Cell contact and non-standard date format. Seizure order issued under Section 36.',
        reference_inspection_id: 'INS-2026-00102'
      },
      statutory_disclaimer: 'REVOKED: This certificate has been invalidated by the Legal Metrology Enforcement Division. Distribution of this batch packaging is prohibited under Section 36 of the Legal Metrology Act, 2009.',
      public_verification_url: '/verify/CERT-LM-2026-00088'
    };

    this.certificates.set(cert1.certificate_id, cert1);
    this.certificates.set(cert2.certificate_id, cert2);

    // Seed System Audit Logs
    this.systemAuditLogs = [
      {
        id: 'AUD-2026-001',
        timestamp: '2026-08-15T09:30:00.000Z',
        category: 'RULE_CHANGE',
        actor_name: 'Joint Controller R. Swaminathan',
        actor_role: 'Senior Officer',
        action: 'RULE_UPDATE',
        target: 'LM-PC-USP-008 (Unit Sale Price Declaration)',
        changes: [
          { field: 'requirement', before: 'Mandatory for packages > 200g', after: 'Mandatory for packages > 100g/ml or multi-unit' },
          { field: 'severity', before: 'LOW', after: 'MEDIUM' }
        ],
        rationale: 'Harmonization with Department of Consumer Affairs Gazette GSR 779(E) advisory enforcement mandate.'
      },
      {
        id: 'AUD-2026-002',
        timestamp: '2026-08-20T14:15:00.000Z',
        category: 'RULE_CHANGE',
        actor_name: 'Director (Legal Metrology) New Delhi',
        actor_role: 'Administrator',
        action: 'RULE_UPDATE',
        target: 'LM-PC-READ-010 (Schedule II Font-Size Standards)',
        changes: [
          { field: 'effective_date', before: '2011-04-01', after: '2022-12-01' },
          { field: 'description', before: 'Visual legibility check', after: 'Schedule II statutory minimum character height standards with certified optical calibration' }
        ],
        rationale: 'Formalized optical calibration protocol requirement for physical millimeter verification.'
      },
      {
        id: 'AUD-2026-003',
        timestamp: '2026-08-25T16:00:00.000Z',
        category: 'CONFIG_CHANGE',
        actor_name: 'Director General (Legal Metrology)',
        actor_role: 'Administrator',
        action: 'AI_THRESHOLD_UPDATE',
        target: 'AI Extraction Confidence Threshold',
        changes: [
          { field: 'min_confidence_threshold', before: 0.70, after: 0.75 }
        ],
        rationale: 'Elevated minimum confidence threshold to prevent false-positive extraction on high-glare surfaces.'
      },
      {
        id: 'AUD-2026-004',
        timestamp: '2026-08-28T11:00:00.000Z',
        category: 'ROLE_ASSIGNMENT',
        actor_name: 'Director General (Legal Metrology)',
        actor_role: 'Administrator',
        action: 'ROLE_PROMOTION',
        target: 'Officer V. Nair (ID: SUP-MH-109)',
        changes: [
          { field: 'role', before: 'Enforcement Officer', after: 'Senior Officer / Deputy Controller' }
        ],
        rationale: 'Authorized appellate and certificate revocation powers for Western Zone surveillance.'
      },
      {
        id: 'AUD-2026-005',
        timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        category: 'CERTIFICATE_ACTION',
        actor_name: 'Deputy Controller V. Nair (Supervisor)',
        actor_role: 'Senior Officer',
        action: 'CERTIFICATE_REVOCATION',
        target: 'CERT-LM-2026-00088 (Radiant Cosmetics)',
        changes: [
          { field: 'status', before: 'ACTIVE', after: 'REVOKED' }
        ],
        rationale: 'Laboratory failure and missing consumer care redressal cell on market commodity sample.'
      }
    ];

    // Seed System Notifications
    this.notifications = [
      {
        id: 'NOTIF-001',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        title: 'Manufacturer Appeal Submitted',
        message: 'Radiant Cosmetics filed representation contesting Seizure Order on INS-2026-00102.',
        type: 'DISPUTE',
        severity: 'ALERT',
        read: false,
        linkView: 'history',
        inspectionId: 'INS-2026-00102'
      },
      {
        id: 'NOTIF-002',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        title: 'Compliance Certificate Issued',
        message: 'Certificate CERT-LM-2026-00101 automatically issued for Aura Organics (Clean Pass: 98/100).',
        type: 'CERTIFICATE',
        severity: 'INFO',
        read: false,
        linkView: 'certificates',
        certificateId: 'CERT-LM-2026-00101'
      },
      {
        id: 'NOTIF-003',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        title: 'Statutory Rule Harmonization',
        message: 'Rule LM-PC-USP-008 synchronized with Department of Consumer Affairs Gazette GSR 779(E).',
        type: 'RULE_CHANGE',
        severity: 'INFO',
        read: true,
        linkView: 'rule_repo'
      }
    ];

    // Seed Citizen Grievance & Violation Reports
    this.citizenReports.clear();

    const rep1: CitizenReport = {
      id: 'REP-CIT-2026-001',
      citizen_name: 'Ananya Deshmukh',
      citizen_phone: '+91 98888 12345',
      product_name: 'Heritage Salted Cashews 100g',
      brand: 'Heritage Royal Dry Fruits',
      store_name: 'QuickBazaar Supermarket',
      store_location: 'Indiranagar 100ft Road, Bengaluru, Karnataka',
      violation_category: 'OVERCHARGING_ABOVE_MRP',
      description: 'The product packaging clearly displays an MRP of ₹120.00, but the checkout cash register billed ₹150.00 citing refrigeration overheads. Receipt attached.',
      image_urls: [SAMPLE_IMAGE_FRONT_COMPLIANT],
      status: 'UNDER_INVESTIGATION',
      submitted_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      investigating_officer: 'Inspector Rajesh Kumar (LM-KA-INSP-402)',
      action_remarks: 'Enforcement inspection notice served to retailer under Section 36 for charging above declared Maximum Retail Price.',
      case_reference_id: 'CASE-KA-2026-8821'
    };

    const rep2: CitizenReport = {
      id: 'REP-CIT-2026-002',
      citizen_name: 'Ananya Deshmukh',
      citizen_phone: '+91 98888 12345',
      product_name: 'Silk Glow Herbal Shampoo 200ml',
      brand: 'Radiant Cosmetics',
      store_name: 'Apollo Pharmacy & Wellness',
      store_location: 'MG Road Metro Station, Bengaluru',
      violation_category: 'MISSING_CONSUMER_CARE',
      description: 'The shampoo bottle lacks telephone number and email ID for the statutory consumer grievance cell. In case of allergic reaction there is no contact information provided on bottle.',
      image_urls: [SAMPLE_IMAGE_SHAMPOO_FRONT],
      status: 'VERIFIED_VIOLATION',
      submitted_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      investigating_officer: 'Officer Priya Sharma (LM-DL-SUP-109)',
      action_remarks: 'Field audit confirmed omission of consumer care telephone line on batch #RAD-2026-04. Show cause notice issued.',
      case_reference_id: 'CASE-KA-2026-8790'
    };

    const rep3: CitizenReport = {
      id: 'REP-CIT-2026-003',
      citizen_name: 'Vikram Mehta',
      citizen_phone: '+91 97777 65432',
      product_name: 'Gold Harvest Refined Sunflower Oil 1L',
      brand: 'Harvest Agrotech',
      store_name: 'Modern Provision Stores',
      store_location: 'Jayanagar 4th Block, Bengaluru',
      violation_category: 'MISSING_MFG_DATE',
      description: 'The edible oil pouch has blurred, illegible date markings and no month or year of packing can be deciphered.',
      image_urls: [SAMPLE_IMAGE_VIOLATION_LABEL],
      status: 'SUBMITTED',
      submitted_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    };

    this.citizenReports.set(rep1.id, rep1);
    this.citizenReports.set(rep2.id, rep2);
    this.citizenReports.set(rep3.id, rep3);
  }

  public getCitizenReports(citizenName?: string): CitizenReport[] {
    const all = Array.from(this.citizenReports.values()).sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
    if (!citizenName) return all;
    return all.filter(r => r.citizen_name.toLowerCase().includes(citizenName.toLowerCase()));
  }

  public getCitizenReport(id: string): CitizenReport | undefined {
    return this.citizenReports.get(id);
  }

  public saveCitizenReport(report: CitizenReport): CitizenReport {
    this.citizenReports.set(report.id, report);
    this.persistCitizenReport(report);
    return report;
  }

  public updateCitizenReportStatus(
    id: string,
    status: CitizenReport['status'],
    remarks?: string,
    officerName?: string
  ): CitizenReport | null {
    const report = this.citizenReports.get(id);
    if (!report) return null;
    report.status = status;
    if (remarks) report.action_remarks = remarks;
    if (officerName) report.investigating_officer = officerName;
    this.citizenReports.set(id, report);
    this.persistCitizenReport(report);
    return report;
  }

  public enrichInspectionWithCertificate(rec: InspectionRecord): InspectionRecord {
    if (!rec) return rec;
    const cert = this.getCertificateByInspection(rec.id);
    if (cert) {
      rec.certificate_id = cert.certificate_id;
      rec.certificate = cert;
    } else if (rec.status === 'PASS') {
      try {
        const certNum = rec.id.replace(/[^0-9]/g, '').slice(-5) || '00101';
        const certId = `CERT-LM-2026-${certNum}`;
        const autoCert: ComplianceCertificate = {
          certificate_id: certId,
          inspection_id: rec.id,
          gtin_barcode: rec.barcode || '8901234567890',
          product_name: rec.product_name,
          brand: rec.brand,
          category: rec.category,
          net_quantity: rec.declarations?.find(d => d.field === 'net_quantity' || d.field === 'NET_QUANTITY')?.normalized_value || 'Standard Pack',
          mrp: rec.declarations?.find(d => d.field === 'mrp' || d.field === 'MRP')?.normalized_value || '₹100.00',
          manufacturer_details: {
            name: rec.brand ? `${rec.brand} Consumer Goods Ltd` : 'Authorized Packager India',
            address: 'Industrial Area, Phase II, India',
            state: 'National Jurisdiction'
          },
          inspecting_officer: {
            name: rec.officer_name || 'Inspector Rajesh Kumar (Legal Metrology)',
            role: 'Enforcement Officer',
            badge_id: rec.officer_id || 'OFF-KA-402'
          },
          issued_at: rec.created_at || new Date().toISOString(),
          validity_months: 12,
          expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
          rule_repository_version: '2026.1 (Gazette GSR 779(E) Mandate)',
          screening_score: rec.screening_score || 95,
          chain_of_custody_hash: `SHA256:CUSTODY-${rec.id}`,
          tamper_digest: `SHA256:CERT-DIGEST-${rec.id}`,
          status: 'ACTIVE',
          statutory_disclaimer: 'Issued pursuant to Rule 6 & Schedule II of the Legal Metrology (Packaged Commodities) Rules, 2011. Certified based on multimodal OCR declaration extraction and physical metric calibration.',
          public_verification_url: `/verify/${certId}`
        };
        this.certificates.set(certId, autoCert);
        this.persistCertificate(autoCert);
        rec.certificate_id = certId;
        rec.certificate = autoCert;
      } catch (e) {
        console.warn('Auto certificate enrichment error:', e);
      }
    }
    return rec;
  }

  public getAllInspections(): InspectionRecord[] {
    return Array.from(this.inspections.values())
      .map(r => this.enrichInspectionWithCertificate(r))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getInspection(id: string): InspectionRecord | undefined {
    const rec = this.inspections.get(id);
    return rec ? this.enrichInspectionWithCertificate(rec) : undefined;
  }

  public saveInspection(record: InspectionRecord): InspectionRecord {
    this.enrichInspectionWithCertificate(record);
    this.inspections.set(record.id, record);
    this.persistInspection(record);
    return record;
  }

  public updateInspection(id: string, updates: Partial<InspectionRecord>): InspectionRecord | undefined {
    const existing = this.inspections.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.enrichInspectionWithCertificate(updated);
    this.inspections.set(id, updated);
    this.persistInspection(updated);
    return updated;
  }

  public getRules(): RuleDefinition[] {
    return this.rules;
  }

  public saveRule(rule: RuleDefinition): RuleDefinition {
    const idx = this.rules.findIndex(r => r.rule_id === rule.rule_id);
    if (idx >= 0) {
      this.rules[idx] = rule;
    } else {
      this.rules.push(rule);
    }
    this.ruleEngine = new LegalMetrologyRuleEngine(this.rules);
    this.persistRule(rule);
    return rule;
  }

  private ruleAuditLogs: RuleAuditLogEntry[] = [
    {
      id: 'AUD-2026-001',
      timestamp: '2026-08-15T09:30:00.000Z',
      actor_name: 'Joint Controller R. Swaminathan',
      actor_role: 'Supervisor',
      action: 'UPDATE',
      rule_id: 'LM-PC-USP-008',
      rule_title: 'Unit Sale Price (USP) Declaration',
      changes: [
        { field: 'requirement', before: 'Mandatory for packages > 200g', after: 'Mandatory for packages > 100g/ml or multi-unit' },
        { field: 'severity', before: 'LOW', after: 'MEDIUM' }
      ],
      rationale: 'Harmonization with Department of Consumer Affairs Gazette GSR 779(E) advisory enforcement mandate.'
    },
    {
      id: 'AUD-2026-002',
      timestamp: '2026-08-20T14:15:00.000Z',
      actor_name: 'Director (Legal Metrology) New Delhi',
      actor_role: 'Administrator',
      action: 'UPDATE',
      rule_id: 'LM-PC-READ-010',
      rule_title: 'Readability, Print Contrast & Legibility Screening',
      changes: [
        { field: 'effective_date', before: '2011-04-01', after: '2022-12-01' },
        { field: 'description', before: 'Visual legibility check', after: 'Schedule II statutory minimum character height standards with certified optical calibration' }
      ],
      rationale: 'Formalized optical calibration protocol requirement for physical millimeter verification.'
    },
    {
      id: 'AUD-2026-003',
      timestamp: '2026-08-28T11:00:00.000Z',
      actor_name: 'Inspector Rajesh Kumar (Legal Metrology)',
      actor_role: 'Officer',
      action: 'ACTIVATE',
      rule_id: 'LM-PC-COO-007',
      rule_title: 'Country of Origin Declaration',
      changes: [
        { field: 'active', before: false, after: true }
      ],
      rationale: 'Activated country of origin mandatory check across domestic packaged products.'
    }
  ];

  public getRuleAuditLogs(): RuleAuditLogEntry[] {
    return [...this.ruleAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logRuleChange(entry: Omit<RuleAuditLogEntry, 'id' | 'timestamp'>): RuleAuditLogEntry {
    const fullEntry: RuleAuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.ruleAuditLogs.unshift(fullEntry);
    this.persistRuleAudit(fullEntry);
    return fullEntry;
  }

  public updateDisputeStatus(
    inspectionId: string,
    status: DisputeStatus,
    manufacturerResponse?: string,
    decision?: string,
    officerName?: string
  ): InspectionRecord | undefined {
    const inspection = this.inspections.get(inspectionId);
    if (!inspection) return undefined;

    const existingDetails = inspection.dispute_details;
    inspection.dispute_status = status;
    inspection.dispute_details = {
      dispute_id: existingDetails?.dispute_id || `DIS-${Date.now()}`,
      filed_at: existingDetails?.filed_at || new Date().toISOString(),
      manufacturer_name: existingDetails?.manufacturer_name || inspection.brand,
      manufacturer_response: manufacturerResponse || existingDetails?.manufacturer_response || '',
      officer_decision: decision || existingDetails?.officer_decision,
      resolving_officer: officerName || existingDetails?.resolving_officer,
      resolved_at: (status === 'RESOLVED_UPHELD' || status === 'RESOLVED_DISMISSED' || status === 'COMPOUNDED')
        ? new Date().toISOString()
        : existingDetails?.resolved_at
    };
    inspection.updated_at = new Date().toISOString();
    this.inspections.set(inspectionId, inspection);
    this.persistInspection(inspection);
    return inspection;
  }

  public getDashboardStats(): DashboardStats {
    const all = this.getAllInspections();
    const total = all.length;
    const passCount = all.filter(i => i.status === 'PASS').length;
    const failCount = all.filter(i => i.status === 'FAIL').length;
    const reviewCount = all.filter(i => i.status === 'REVIEW').length;
    
    const avgScore = total > 0 ? Math.round(all.reduce((sum, i) => sum + i.screening_score, 0) / total) : 0;

    // Violations by declaration count
    const violationMap = new Map<string, number>();
    all.forEach(i => {
      i.rule_evaluations.forEach(r => {
        if (r.status === 'FAIL') {
          violationMap.set(r.title, (violationMap.get(r.title) || 0) + 1);
        }
      });
    });

    const violationsByDecl = Array.from(violationMap.entries())
      .map(([declaration, count]) => ({ declaration, count }))
      .sort((a, b) => b.count - a.count);

    if (violationsByDecl.length === 0) {
      violationsByDecl.push(
        { declaration: 'Consumer Care Details (Rule 6(1)(n))', count: 3 },
        { declaration: 'Price & Tax Statement (Rule 6(1)(e))', count: 2 },
        { declaration: 'Month & Year of Mfg (Rule 6(1)(d))', count: 2 },
        { declaration: 'Net Quantity Units (Rule 6(1)(b))', count: 1 }
      );
    }

    // Category distribution
    const catMap = new Map<ProductCategory, number>();
    all.forEach(i => {
      catMap.set(i.category, (catMap.get(i.category) || 0) + 1);
    });

    const categoryDistribution = Array.from(catMap.entries()).map(([category, count]) => ({
      category,
      count
    }));

    // Dispute statistics
    const openDisputes = all.filter(i => i.dispute_status === 'OPEN').length;
    const reviewDisputes = all.filter(i => i.dispute_status === 'UNDER_MANUFACTURER_REVIEW').length;
    const resolvedDisputes = all.filter(i => i.dispute_status === 'RESOLVED_UPHELD' || i.dispute_status === 'RESOLVED_DISMISSED' || i.dispute_status === 'COMPOUNDED').length;

    // Calibration statistics
    const calibratedCount = all.filter(i => i.calibration?.is_calibrated || i.reference_scale_present).length;
    const uncalibratedCount = total - calibratedCount;

    // Timeline mockup for stats
    const inspectionsOverTime = [
      { date: 'Aug 27', count: 4, pass: 3, fail: 1, review: 0 },
      { date: 'Aug 28', count: 6, pass: 4, fail: 1, review: 1 },
      { date: 'Aug 29', count: 8, pass: 5, fail: 2, review: 1 },
      { date: 'Aug 30', count: 7, pass: 5, fail: 1, review: 1 },
      { date: 'Aug 31', count: 9, pass: 6, fail: 2, review: 1 },
      { date: 'Sep 01', count: 11, pass: 7, fail: 2, review: 2 },
      { date: 'Sep 02', count: total, pass: passCount, fail: failCount, review: reviewCount }
    ];

    return {
      total_inspections: total,
      compliant_count: passCount,
      non_compliant_count: failCount,
      review_count: reviewCount,
      average_screening_score: avgScore,
      status_distribution: [
        { status: 'PASS', count: passCount, percentage: total ? Math.round((passCount / total) * 100) : 0 },
        { status: 'FAIL', count: failCount, percentage: total ? Math.round((failCount / total) * 100) : 0 },
        { status: 'REVIEW', count: reviewCount, percentage: total ? Math.round((reviewCount / total) * 100) : 0 }
      ],
      violations_by_declaration: violationsByDecl,
      inspections_over_time: inspectionsOverTime,
      category_distribution: categoryDistribution,
      dispute_stats: {
        open_count: openDisputes,
        under_review_count: reviewDisputes,
        resolved_count: resolvedDisputes
      },
      calibration_stats: {
        calibrated_count: calibratedCount,
        uncalibrated_count: uncalibratedCount
      },
      recent_inspections: all.slice(0, 8)
    };
  }

  // Certificate Management
  public getAllCertificates(status?: string, query?: string): ComplianceCertificate[] {
    let list = Array.from(this.certificates.values()).sort(
      (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    );

    if (status && status !== 'ALL') {
      list = list.filter(c => c.status === status);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(c =>
        c.certificate_id.toLowerCase().includes(q) ||
        c.product_name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        (c.gtin_barcode && c.gtin_barcode.toLowerCase().includes(q)) ||
        c.inspection_id.toLowerCase().includes(q) ||
        c.manufacturer_details.name.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public getCertificate(id: string): ComplianceCertificate | undefined {
    return this.certificates.get(id);
  }

  public getCertificateByInspection(inspectionId: string): ComplianceCertificate | undefined {
    return Array.from(this.certificates.values()).find(c => c.inspection_id === inspectionId);
  }

  public createCertificate(cert: ComplianceCertificate): ComplianceCertificate {
    this.certificates.set(cert.certificate_id, cert);
    this.persistCertificate(cert);

    // Automatically record in Unified System Audit Log
    this.logSystemAudit({
      category: 'CERTIFICATE_ACTION',
      actor_name: cert.inspecting_officer.name,
      actor_role: cert.inspecting_officer.role,
      action: 'CERTIFICATE_ISSUED',
      target: `${cert.certificate_id} (${cert.product_name} - ${cert.brand})`,
      changes: [
        { field: 'status', before: undefined, after: 'ACTIVE' },
        { field: 'validity_months', before: undefined, after: cert.validity_months }
      ],
      rationale: `Automated certificate issuance upon 100% clean statutory pass (Score: ${cert.screening_score}/100).`
    });

    // Add notification
    const notif: SystemNotification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Compliance Certificate Issued',
      message: `Certificate ${cert.certificate_id} granted to ${cert.brand} for "${cert.product_name}".`,
      type: 'CERTIFICATE',
      severity: 'INFO',
      read: false,
      linkView: 'certificates',
      certificateId: cert.certificate_id
    };
    this.notifications.unshift(notif);
    this.persistNotification(notif);

    return cert;
  }

  public saveCertificate(cert: ComplianceCertificate): ComplianceCertificate {
    return this.createCertificate(cert);
  }

  public revokeCertificate(
    id: string,
    revokedBy: string,
    reason: string,
    refInspectionId?: string
  ): ComplianceCertificate | undefined {
    const cert = this.certificates.get(id);
    if (!cert) return undefined;

    cert.status = 'REVOKED';
    cert.revocation_details = {
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      reason,
      reference_inspection_id: refInspectionId
    };
    cert.statutory_disclaimer = `REVOKED: This compliance certificate has been invalidated by the Legal Metrology Division (${revokedBy}). Distribution of this packaging batch is subject to seizure under Section 36 of the Legal Metrology Act, 2009.`;

    this.certificates.set(id, cert);
    this.persistCertificate(cert);

    // Audit log
    this.logSystemAudit({
      category: 'CERTIFICATE_ACTION',
      actor_name: revokedBy,
      actor_role: 'Senior Officer / Administrator',
      action: 'CERTIFICATE_REVOKED',
      target: `${cert.certificate_id} (${cert.brand})`,
      changes: [
        { field: 'status', before: 'ACTIVE', after: 'REVOKED' }
      ],
      rationale: reason
    });

    // Alert notification
    const alertNotif: SystemNotification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Certificate Revoked by Authority',
      message: `Certificate ${cert.certificate_id} for "${cert.product_name}" (${cert.brand}) was REVOKED: ${reason.slice(0, 80)}...`,
      type: 'CERTIFICATE',
      severity: 'ALERT',
      read: false,
      linkView: 'certificates',
      certificateId: cert.certificate_id
    };
    this.notifications.unshift(alertNotif);
    this.persistNotification(alertNotif);

    return cert;
  }

  // Unified System Audit Trail
  public getSystemAuditLogs(category?: string): SystemAuditLogEntry[] {
    let logs = [...this.systemAuditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (category && category !== 'ALL') {
      logs = logs.filter(l => l.category === category);
    }
    return logs;
  }

  public logSystemAudit(entry: Omit<SystemAuditLogEntry, 'id' | 'timestamp'>): SystemAuditLogEntry {
    const log: SystemAuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.systemAuditLogs.unshift(log);
    this.persistSystemAudit(log);
    return log;
  }

  // System Notifications
  public getNotifications(): SystemNotification[] {
    return [...this.notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public markNotificationRead(id: string): boolean {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persistNotification(notif);
      return true;
    }
    return false;
  }

  // Repeat Offender / Manufacturer Risk Matrix
  public getManufacturerRiskProfiles(days: number = 90): ManufacturerRiskProfile[] {
    const all = this.getAllInspections();
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).getTime();
    const recent = all.filter(i => new Date(i.created_at).getTime() >= cutoff);

    // Group by Brand / Manufacturer
    const groups = new Map<string, InspectionRecord[]>();
    recent.forEach(ins => {
      const key = ins.brand || 'Unbranded / Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(ins);
    });

    const profiles: ManufacturerRiskProfile[] = [];

    groups.forEach((records, brand) => {
      const total = records.length;
      const passed = records.filter(r => r.status === 'PASS').length;
      const failed = records.filter(r => r.status === 'FAIL').length;
      const disputed = records.filter(r => r.dispute_status !== 'NONE').length;

      // Count violated rules
      const violatedRuleCounts = new Map<string, number>();
      records.forEach(r => {
        r.rule_evaluations.forEach(ev => {
          if (ev.status === 'FAIL') {
            violatedRuleCounts.set(ev.title, (violatedRuleCounts.get(ev.title) || 0) + 1);
          }
        });
      });

      const topViolations = Array.from(violatedRuleCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([title]) => title);

      // Weighted score calculation:
      // Failure rate 60%, dispute frequency 20%, repeat violations 20%
      const failRate = total > 0 ? (failed / total) : 0;
      const disputeRate = total > 0 ? (disputed / total) : 0;
      const avgScore = total > 0 ? Math.round(records.reduce((s, r) => s + r.screening_score, 0) / total) : 0;

      let riskScore = Math.round(failRate * 60 + disputeRate * 25 + Math.max(0, 100 - avgScore) * 0.15);
      riskScore = Math.min(100, Math.max(0, riskScore));

      let riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' = 'LOW';
      let recommendedAction = 'Routine random market sampling';

      if (riskScore >= 70 || failed >= 2) {
        riskLevel = 'CRITICAL';
        recommendedAction = 'Mandate comprehensive warehouse audit and initiate Section 36 compounding / prosecution';
      } else if (riskScore >= 45) {
        riskLevel = 'ELEVATED';
        recommendedAction = 'Issue statutory Show-Cause notice and flag for weekly e-commerce screening';
      } else if (riskScore >= 20) {
        riskLevel = 'MODERATE';
        recommendedAction = 'Increase field surveillance frequency and verify packaging redesign';
      }

      const lastInspected = records[0].created_at;

      profiles.push({
        brand_or_mfr: brand,
        total_inspections: total,
        passed_count: passed,
        violations_count: failed,
        disputes_count: disputed,
        risk_score: riskScore,
        risk_level: riskLevel,
        top_violated_rules: topViolations.length > 0 ? topViolations : ['No active statutory non-compliances'],
        recommended_action: recommendedAction,
        last_inspected: lastInspected
      });
    });

    return profiles.sort((a, b) => b.risk_score - a.risk_score);
  }

  // Cross-Registry GTIN / Barcode Search
  public searchByGtin(gtin: string): GtinLookupResult {
    const cleaned = gtin.trim();
    const allInspections = this.getAllInspections();
    const matchedInspections = allInspections.filter(i =>
      i.barcode === cleaned ||
      i.declarations.some(d => d.field === 'barcode' && d.normalized_value === cleaned)
    );

    const matchedCerts = Array.from(this.certificates.values()).filter(c =>
      c.gtin_barcode === cleaned
    );

    const found = matchedInspections.length > 0 || matchedCerts.length > 0;
    const latestIns = matchedInspections[0];
    const latestCert = matchedCerts[0];

    const productName = latestCert?.product_name || latestIns?.product_name || (found ? 'Commodity' : undefined);
    const brand = latestCert?.brand || latestIns?.brand || (found ? 'Manufacturer' : undefined);
    const category = latestCert?.category || latestIns?.category;
    const latestStatus = latestIns?.status || (latestCert?.status === 'ACTIVE' ? 'PASS' : 'FAIL');

    // Risk assessment
    const failCount = matchedInspections.filter(i => i.status === 'FAIL').length;
    let riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' = 'LOW';
    if (failCount >= 2 || matchedCerts.some(c => c.status === 'REVOKED')) {
      riskLevel = 'CRITICAL';
    } else if (failCount === 1) {
      riskLevel = 'ELEVATED';
    }

    return {
      barcode: cleaned,
      found,
      product_name: productName,
      brand,
      category,
      inspections: matchedInspections,
      certificates: matchedCerts,
      latest_status: latestStatus,
      risk_level: riskLevel
    };
  }

  // --- AUTHENTICATION & SESSION MANAGEMENT ---
  public getUserByEmail(email: string): UserAccount | undefined {
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
  }

  public getUserById(id: string): UserAccount | undefined {
    return this.users.get(id);
  }

  public authenticate(email: string, pass: string): { token: string; user: AuthUser } | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    // Password check (allow account password or demo master password)
    if (user.password !== pass && pass !== 'Password@123') {
      return null;
    }

    const token = `lm_sec_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.sessions.set(token, user);
    this.persistSession(token, user);

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badge_number: user.badge_number,
      jurisdiction: user.jurisdiction,
      division: user.division,
      phone: user.phone
    };

    this.logSystemAudit({
      category: 'SECURITY',
      actor_name: user.name,
      actor_role: user.role,
      action: 'USER_LOGIN',
      target: user.email,
      changes: [],
      rationale: `Authenticated session initiated for ${user.role} (${user.badge_number}).`
    });

    return { token, user: safeUser };
  }

  public getUserByToken(token: string): AuthUser | undefined {
    const user = this.sessions.get(token);
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badge_number: user.badge_number,
      jurisdiction: user.jurisdiction,
      division: user.division,
      phone: user.phone
    };
  }

  public deleteSession(token: string): boolean {
    const user = this.sessions.get(token);
    if (user) {
      this.logSystemAudit({
        category: 'SECURITY',
        actor_name: user.name,
        actor_role: user.role,
        action: 'USER_LOGOUT',
        target: user.email,
        changes: [],
        rationale: `Session terminated securely.`
      });
    }
    this.deletePersistedSession(token);
    return this.sessions.delete(token);
  }

  public getDemoAccounts(): AuthUser[] {
    return Array.from(this.users.values()).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      badge_number: u.badge_number,
      jurisdiction: u.jurisdiction,
      division: u.division,
      phone: u.phone
    }));
  }
}

export const db = new InMemoryDB();
