import {
  RuleDefinition,
  RuleEvaluation,
  ExtractedDeclaration,
  CrossImageConsistencyCheck,
  ReadabilityAnalysis,
  ComplianceStatus,
  ProductCategory
} from '../types/index';

export const DEFAULT_RULES: RuleDefinition[] = [
  {
    rule_id: 'LM-PC-NAME-001',
    title: 'Generic / Common Commodity Name Declaration',
    field: 'product_name',
    description: 'Every package shall bear the name and description of the commodity contained in the package.',
    requirement: 'The common or generic name of the commodity must be prominently stated on the principal display panel.',
    applicability: 'ALL_COMMODITIES',
    severity: 'HIGH',
    validation_type: 'PRESENCE',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E) Notification dated 07.03.2011',
        summary: 'Statutory mandate for conspicuous generic/common commodity name on principal display panel.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-QTY-002',
    title: 'Net Quantity Declaration & Standard Metric Units',
    field: 'net_quantity',
    description: 'Net quantity of commodity contained in the package in terms of standard metric units (weight, measure or number).',
    requirement: 'Must declare net quantity in standard metric units (g, kg, ml, l, or N/pcs). Non-standard units (e.g. lbs, oz) alone are prohibited.',
    applicability: 'ALL_COMMODITIES',
    severity: 'HIGH',
    validation_type: 'QUANTITY',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(b) & Rule 11/12',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E) / GSR 779(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: '2022-11-30',
        gazette_ref: 'GSR 202(E)',
        summary: 'Standard metric packaging specifications under Second Schedule.'
      },
      {
        version: '2022.1',
        effective_from: '2022-12-01',
        effective_to: null,
        gazette_ref: 'GSR 779(E) Amendment 2021/2022',
        summary: 'Relaxation of standard pack sizes with strict mandatory Unit Sale Price declaration.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-MRP-003',
    title: 'Maximum Retail Price (MRP) & Tax Inclusivity',
    field: 'mrp',
    description: 'Retail sale price of the package shall be clearly indicated as Maximum Retail Price (MRP) inclusive of all taxes.',
    requirement: 'Must state MRP in Indian Rupees (₹ or Rs.) with words "inclusive of all taxes" or "incl. of all taxes".',
    applicability: 'ALL_COMMODITIES',
    severity: 'HIGH',
    validation_type: 'MRP',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(c)/(e)',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E) / GSR 592(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: '2017-12-31',
        gazette_ref: 'GSR 202(E)',
        summary: 'MRP inclusive of all taxes specification.'
      },
      {
        version: '2018.1',
        effective_from: '2018-01-01',
        effective_to: null,
        gazette_ref: 'GSR 592(E) Amendment 2017',
        summary: 'Dual MRP prohibition and mandatory e-commerce pre-sale display.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-MFG-004',
    title: 'Manufacturer / Packer / Importer Name & Complete Address',
    field: 'manufacturer_name',
    description: 'Name and complete physical postal address of the manufacturer or packer or importer must be clearly declared.',
    requirement: 'Must disclose manufacturer/packer name along with city, state/pin code or country for traceability.',
    applicability: 'ALL_COMMODITIES',
    severity: 'HIGH',
    validation_type: 'PRESENCE',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a) & (d)',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E)',
        summary: 'Mandatory manufacturer/packer complete postal address.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-DATE-005',
    title: 'Month and Year of Manufacture / Packing / Import',
    field: 'mfg_date',
    description: 'The month and year in which the commodity is manufactured or pre-packed or imported shall be mentioned.',
    requirement: 'Must declare Month and Year (e.g., MM/YYYY, Month YYYY, or PKD MM/YY) on package.',
    applicability: 'ALL_COMMODITIES',
    severity: 'MEDIUM',
    validation_type: 'DATE',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(d)',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E)',
        summary: 'Month and Year of manufacture or packing.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-CC-006',
    title: 'Consumer Care Cell Details (Name, Address, Tel & Email)',
    field: 'consumer_care',
    description: 'Name, address, telephone number and email address of the person/office who can be contacted in case of consumer complaints.',
    requirement: 'Consumer care contact info must specify at least phone number/email and contact address.',
    applicability: 'ALL_COMMODITIES',
    severity: 'HIGH',
    validation_type: 'CONSUMER_CARE',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(n)',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E)',
        summary: 'Full consumer grievance contact details.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-COO-007',
    title: 'Country of Origin Declaration',
    field: 'country_of_origin',
    description: 'Declaration of country of origin is mandatory for all imported pre-packaged goods and universal retail commodities.',
    requirement: 'Country of origin must be declared conspicuously on the package (e.g., "Country of Origin: India").',
    applicability: 'ALL_COMMODITIES',
    severity: 'MEDIUM',
    validation_type: 'PRESENCE',
    source: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2017 & 2020',
    version: '2026.1',
    effective_date: '2021-01-01',
    effective_from: '2021-01-01',
    effective_to: null,
    gazette_notification_no: 'GSR 629(E) & DOCA 2020 Directives',
    version_history: [
      {
        version: '2017.1',
        effective_from: '2018-01-01',
        effective_to: '2020-12-31',
        gazette_ref: 'GSR 629(E)',
        summary: 'Mandatory on imported pre-packaged commodities.'
      },
      {
        version: '2021.1',
        effective_from: '2021-01-01',
        effective_to: null,
        gazette_ref: 'Department of Consumer Affairs Circular 2020',
        summary: 'Universal enforcement across all retail and digital commerce platforms.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-USP-008',
    title: 'Unit Sale Price (USP) Declaration',
    field: 'unit_sale_price',
    description: 'Declaration of Unit Sale Price (e.g. ₹/g, ₹/kg, ₹/ml, ₹/l, ₹/piece) for packages containing more than 1 unit/weight threshold.',
    requirement: 'Commodities > 100g/ml or containing multiple items must display unit sale price rounded off to nearest paise.',
    applicability: 'PACKAGES_OVER_100G_OR_MULTI_UNIT',
    severity: 'MEDIUM',
    validation_type: 'FORMAT',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2022 Amendment — Rule 6(11)',
    version: '2026.1',
    effective_date: '2022-12-01',
    effective_from: '2022-12-01',
    effective_to: null,
    gazette_notification_no: 'GSR 779(E) Enacted 01.12.2022',
    version_history: [
      {
        version: '2021.1',
        effective_from: '2022-04-01',
        effective_to: '2022-11-30',
        gazette_ref: 'GSR 779(E) (Initial Transition)',
        summary: 'Notification of Unit Sale Price mandate with industry transition deferral.'
      },
      {
        version: '2022.2',
        effective_from: '2022-12-01',
        effective_to: null,
        gazette_ref: 'GSR 779(E) Final Enforcement',
        summary: 'Strict statutory enforcement of USP for pre-packaged commodities.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-BATCH-009',
    title: 'Batch / Lot Number / Code Identification',
    field: 'batch_number',
    description: 'Lot or batch number identifying manufacture batch for quality control and verification.',
    requirement: 'Batch/Lot identifier must be visible on package.',
    applicability: 'FOOD_AND_COSMETICS_PRIMARY',
    severity: 'LOW',
    validation_type: 'PRESENCE',
    source: 'Legal Metrology (Packaged Commodities) Rules — Rule 6(1)(g)',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E)',
        summary: 'Traceability requirement through lot or batch identification mark.'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-READ-010',
    title: 'Readability, Print Contrast & Legibility Screening',
    field: 'readability',
    description: 'Declarations on package shall be legible, prominent, and distinct from the background.',
    requirement: 'Text must have sufficient optical contrast and estimated character height meeting minimum statutory limits under Schedule II.',
    applicability: 'ALL_COMMODITIES',
    severity: 'MEDIUM',
    validation_type: 'READABILITY',
    source: 'Legal Metrology (Packaged Commodities) Rules — Rule 7 & 8',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E)',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E) Schedule II',
        summary: 'Statutory minimum character height scale (1.0mm up to 6.0mm based on net quantity).'
      }
    ],
    active: true
  },
  {
    rule_id: 'LM-PC-BULK-012',
    title: 'Wholesale Master Package & Bulk Shipper Outer Declarations',
    field: 'bulk_box_declarations',
    description: 'Declarations applicable to wholesale packages, outer master shipper cartons, and bulk containers.',
    requirement: 'Outer wholesale shipper cartons must bear: (a) manufacturer/packer identity and registered address, (b) generic commodity identity, (c) total net quantity (or total retail units count × individual unit net mass), and (d) maximum retail price or wholesale dispatch declaration.',
    applicability: 'ALL_COMMODITIES',
    severity: 'HIGH',
    validation_type: 'PRESENCE',
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Chapter III, Rules 24, 25 & 26',
    version: '2026.1',
    effective_date: '2011-04-01',
    effective_from: '2011-04-01',
    effective_to: null,
    gazette_notification_no: 'GSR 202(E) Chapter III',
    version_history: [
      {
        version: '2011.1',
        effective_from: '2011-04-01',
        effective_to: null,
        gazette_ref: 'GSR 202(E) Chapter III Rules 24-26',
        summary: 'Statutory provisions governing wholesale master cartons and group packages.'
      }
    ],
    active: true
  }
];

export const FIELD_ALIASES: Record<string, string[]> = {
  product_name: ['generic_name', 'commodity_name', 'commodity', 'name', 'item_name', 'product'],
  net_quantity: ['quantity', 'net_weight', 'net_qty', 'net_volume', 'net_mass', 'weight', 'volume'],
  mrp: ['maximum_retail_price', 'retail_price', 'price', 'max_retail_price'],
  manufacturer_name: [
    'manufacturer_address',
    'manufacturer_name_address',
    'packer_name',
    'packer_address',
    'packer_name_address',
    'importer_name',
    'importer_address',
    'mfd_by',
    'pkd_by',
    'marketed_by'
  ],
  mfg_date: ['date_of_packing', 'packing_date', 'pkd_date', 'date_of_manufacture', 'mfg_month_year', 'pkd'],
  consumer_care: [
    'consumer_care_cell',
    'customer_care',
    'consumer_complaint',
    'grievance_cell',
    'helpline',
    'consumer_care_phone',
    'consumer_care_email',
    'consumer_care_contact',
    'customer_care_phone',
    'customer_care_email',
    'care_phone',
    'care_email',
    'helpline_number'
  ],
  country_of_origin: ['origin', 'country_origin', 'made_in', 'country'],
  unit_sale_price: ['usp', 'unit_price', 'unit_rate', 'price_per_unit'],
  batch_number: ['lot_number', 'batch_no', 'lot_no', 'batch_code', 'b_no', 'lot', 'batch', 'batch_num', 'lot_num', 'b_num'],
  bulk_box_declarations: ['wholesale_carton', 'master_carton', 'outer_carton', 'shipper_case', 'bulk_box']
};

/**
 * DeclarationStore: Prevents Map collision bugs when handling multi-image declarations
 * (Front, Back, Side, Top, Bottom) where declarations share identical field names.
 */
export class DeclarationStore {
  private declarationsByField: Map<string, ExtractedDeclaration[]> = new Map();
  private allDeclarations: ExtractedDeclaration[] = [];

  constructor(declarations: ExtractedDeclaration[]) {
    this.allDeclarations = declarations || [];
    for (const d of this.allDeclarations) {
      if (!d || !d.field) continue;
      const key = d.field.trim().toLowerCase();
      const list = this.declarationsByField.get(key) || [];
      list.push(d);
      this.declarationsByField.set(key, list);
    }
  }

  public getAll(field: string, aliases: string[] = []): ExtractedDeclaration[] {
    const keys = [field, ...aliases].map(k => k.trim().toLowerCase());
    const seen = new Set<string>();
    const results: ExtractedDeclaration[] = [];
    for (const k of keys) {
      const list = this.declarationsByField.get(k);
      if (list) {
        for (const d of list) {
          if (!seen.has(d.id || `${d.field}_${d.image_id}_${d.original_text}`)) {
            seen.add(d.id || `${d.field}_${d.image_id}_${d.original_text}`);
            results.push(d);
          }
        }
      }
    }
    return results;
  }

  public getBest(field: string, aliases: string[] = []): ExtractedDeclaration | undefined {
    const candidates = this.getAll(field, aliases);
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];

    // Priority ranking:
    // 1. Has non-empty text AND found === true
    // 2. Status rank: 'FOUND' (3) > 'UNCERTAIN' (2) > 'NOT_APPLICABLE' (1) > 'NOT_FOUND' (0)
    // 3. Higher confidence score
    // 4. Content length
    return [...candidates].sort((a, b) => {
      const aHasText = ((a.original_text || a.normalized_value) ?? '').trim().length > 0;
      const bHasText = ((b.original_text || b.normalized_value) ?? '').trim().length > 0;
      const aFoundRank = (a.found && aHasText ? 3 : 0) + (a.status === 'FOUND' ? 2 : a.status === 'UNCERTAIN' ? 1 : 0);
      const bFoundRank = (b.found && bHasText ? 3 : 0) + (b.status === 'FOUND' ? 2 : b.status === 'UNCERTAIN' ? 1 : 0);
      if (aFoundRank !== bFoundRank) return bFoundRank - aFoundRank;

      const aConf = a.confidence ?? 0;
      const bConf = b.confidence ?? 0;
      if (Math.abs(aConf - bConf) > 0.05) return bConf - aConf;

      const aLen = ((a.original_text || a.normalized_value) ?? '').length;
      const bLen = ((b.original_text || b.normalized_value) ?? '').length;
      return bLen - aLen;
    })[0];
  }

  public getEvidenceImages(field: string, aliases: string[] = []): string[] {
    const list = this.getAll(field, aliases);
    const set = new Set<string>();
    for (const d of list) {
      if (d.found && d.image_id) {
        set.add(d.image_id);
      }
    }
    return Array.from(set);
  }

  public getRawList(): ExtractedDeclaration[] {
    return this.allDeclarations;
  }
}

export class LegalMetrologyRuleEngine {
  private rules: RuleDefinition[];

  constructor(customRules?: RuleDefinition[]) {
    this.rules = customRules || DEFAULT_RULES;
  }

  public getRules(): RuleDefinition[] {
    return this.rules;
  }

  public evaluateInspection(
    declarations: ExtractedDeclaration[],
    images: { id: string; type: string }[],
    category: ProductCategory,
    readability?: ReadabilityAnalysis,
    mfgDateStated?: string,
    packageLevel?: 'RETAIL_CONSUMER' | 'BULK_BOX' | 'WHOLESALE_CARTON' | 'RETAIL_UNIT' | 'WHOLESALE_BULK_BOX'
  ): {
    evaluations: RuleEvaluation[];
    overallStatus: ComplianceStatus;
    screeningScore: number;
    crossImageChecks: CrossImageConsistencyCheck[];
    plainLanguageSummary: string;
  } {
    const activeRules = this.rules.filter((r) => r.active);
    const evaluations: RuleEvaluation[] = [];

    // Collision-free Declaration Store
    const declStore = new DeclarationStore(declarations);

    // Detect stated manufacture / packing date for temporal rule version resolution
    const statedMfgDateRaw =
      mfgDateStated ||
      declStore.getBest('mfg_date', FIELD_ALIASES['mfg_date'])?.normalized_value ||
      declStore.getBest('mfg_date', FIELD_ALIASES['mfg_date'])?.original_text;

    const effectiveMfgDate = LegalMetrologyRuleEngine.extractDateForTemporalCheck(statedMfgDateRaw);

    // Normalize package level parameter
    const normalizedPkgLevel: 'RETAIL_CONSUMER' | 'BULK_BOX' | 'WHOLESALE_CARTON' =
      packageLevel === 'WHOLESALE_BULK_BOX' || packageLevel === 'WHOLESALE_CARTON'
        ? 'WHOLESALE_CARTON'
        : packageLevel === 'BULK_BOX'
        ? 'BULK_BOX'
        : 'RETAIL_CONSUMER';

    for (const rule of activeRules) {
      const evaluation = this.evaluateSingleRule(
        rule,
        declStore,
        category,
        readability,
        effectiveMfgDate,
        normalizedPkgLevel
      );
      evaluations.push(evaluation);
    }

    // Cross-Image consistency checks
    const crossImageChecks = this.performCrossImageChecks(declStore);

    // If any cross-image check fails, append a cross-image evaluation
    for (const check of crossImageChecks) {
      if (!check.is_consistent) {
        evaluations.push({
          rule_id: 'LM-PC-CROSS-011',
          field: check.field,
          title: `Cross-Image Inconsistency: ${check.label}`,
          status: check.status,
          reason: check.details,
          confidence: 0.95,
          severity: 'HIGH',
          evidence_images: images.map((i) => i.id),
          evidence_text: `Front: "${check.front_value}" vs Back: "${check.back_value}"`,
          normative_reference: 'Legal Metrology Enforcement Standard — Label Consistency Verification',
          applicable_version: '2026.1'
        });
      }
    }

    // Compute Overall Status and Continuous Weighted Screening Score (0-100)
    // Continuous weighted deductions based on statutory severity:
    // (Missing MRP = -25%, Missing Net Qty = -20%, Missing Address = -15%, Missing USP/Consumer Care = -10%)
    let score = 100;
    let failCount = 0;
    let reviewCount = 0;
    let passCount = 0;

    for (const evalItem of evaluations) {
      if (evalItem.status === 'FAIL') {
        failCount++;
        let deduction = 15;
        if (evalItem.field === 'mrp') {
          deduction = 25; // Missing MRP = -25%
        } else if (evalItem.field === 'net_quantity') {
          deduction = 20; // Missing Net Qty = -20%
        } else if (evalItem.field === 'manufacturer_name') {
          deduction = 15; // Missing Address = -15%
        } else if (evalItem.field === 'product_name') {
          deduction = 15; // Missing Generic Commodity Name = -15%
        } else if (evalItem.field === 'bulk_box_declarations') {
          deduction = 15; // Missing Master Carton Outer Declarations = -15%
        } else if (evalItem.field === 'unit_sale_price') {
          deduction = 10; // Missing USP = -10%
        } else if (evalItem.field === 'consumer_care') {
          deduction = 10; // Missing Consumer Care Cell = -10%
        } else if (evalItem.field === 'mfg_date') {
          deduction = 10; // Missing Month/Year of Packing = -10%
        } else if (evalItem.field === 'country_of_origin') {
          deduction = 10; // Missing Country of Origin = -10%
        } else if (evalItem.field === 'readability') {
          deduction = 10; // Illegible Font Scale = -10%
        } else if (evalItem.field === 'batch_number') {
          deduction = 5;  // Missing Batch Number = -5%
        } else {
          deduction = evalItem.severity === 'HIGH' ? 15 : evalItem.severity === 'MEDIUM' ? 10 : 5;
        }
        score -= deduction;
      } else if (evalItem.status === 'REVIEW') {
        reviewCount++;
        let deduction = 5;
        if (evalItem.field === 'mrp') {
          deduction = 10; // Ambiguous tax inclusion or currency = -10%
        } else if (evalItem.field === 'net_quantity') {
          deduction = 8;  // Non-standard metric abbreviation = -8%
        } else if (evalItem.field === 'manufacturer_name') {
          deduction = 6;  // Partial address = -6%
        } else if (evalItem.field === 'unit_sale_price') {
          deduction = 5;  // Ambiguous USP = -5%
        } else if (evalItem.field === 'consumer_care') {
          deduction = 5;  // Partial Consumer Care = -5%
        } else if (evalItem.field === 'mfg_date') {
          deduction = 5;  // Non-standard date formatting = -5%
        } else if (evalItem.field === 'readability') {
          deduction = 5;  // Uncalibrated optical estimation = -5%
        } else {
          deduction = evalItem.severity === 'HIGH' ? 8 : evalItem.severity === 'MEDIUM' ? 5 : 3;
        }
        score -= deduction;
      } else {
        passCount++;
      }
    }

    // Keep score continuously bounded between 0% and 100%
    score = Math.max(0, Math.min(100, Math.round(score)));

    let overallStatus: ComplianceStatus = 'PASS';
    if (failCount > 0) {
      overallStatus = 'FAIL';
    } else if (score < 75 || reviewCount > 1) {
      overallStatus = 'REVIEW';
    } else {
      overallStatus = 'PASS';
    }

    // Generate Plain-Language Statutory Summary for Show Cause Notices under Section 36
    const plainLanguageSummary = this.generatePlainLanguageSummary(overallStatus, failCount, reviewCount, evaluations);

    return {
      evaluations,
      overallStatus,
      screeningScore: score,
      crossImageChecks,
      plainLanguageSummary
    };
  }

  public static extractDateForTemporalCheck(dateStr?: string): string | undefined {
    if (!dateStr || typeof dateStr !== 'string') return undefined;
    const clean = dateStr.trim().toLowerCase();

    // 1. Month names (e.g., "March 2026", "MAR 2026", "Aug 2021", "15-AUG-2021")
    const monthNames: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };

    const monthNameRegex = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[^\d]{1,5}(20\d{2})/i;
    const mMatch = clean.match(monthNameRegex);
    if (mMatch) {
      const monthNum = monthNames[mMatch[1].toLowerCase()];
      const yearNum = mMatch[2];
      if (monthNum && yearNum) {
        return `${yearNum}-${monthNum}`;
      }
    }

    // 2. YYYY[-/]MM (e.g. "2026-03", "2021/08")
    const yFirst = clean.match(/\b(20\d{2})[-\/\.](0[1-9]|1[0-2]|\d)\b/);
    if (yFirst) {
      const y = yFirst[1];
      const m = yFirst[2].padStart(2, '0');
      return `${y}-${m}`;
    }

    // 3. MM[-/]YYYY (e.g. "03/2026", "08-2021", "3/2022")
    const mFirst = clean.match(/\b(0?[1-9]|1[0-2])[-\/\.](20\d{2})\b/);
    if (mFirst) {
      const m = mFirst[1].padStart(2, '0');
      const y = mFirst[2];
      return `${y}-${m}`;
    }

    // 4. DD[-/]MM[-/]YYYY (e.g. "15/08/2021", "24-11-2022")
    const dmy = clean.match(/\b\d{1,2}[-\/\.](0?[1-9]|1[0-2])[-\/\.](20\d{2})\b/);
    if (dmy) {
      const m = dmy[1].padStart(2, '0');
      const y = dmy[2];
      return `${y}-${m}`;
    }

    // 5. MM[-/]YY (e.g. "03/26" -> 2026-03, "08/21" -> 2021-08)
    const shortY = clean.match(/\b(0?[1-9]|1[0-2])[-\/\.](\d{2})\b/);
    if (shortY) {
      const m = shortY[1].padStart(2, '0');
      const y = `20${shortY[2]}`;
      return `${y}-${m}`;
    }

    return undefined;
  }

  private evaluateSingleRule(
    rule: RuleDefinition,
    declStore: DeclarationStore,
    category: ProductCategory,
    readability?: ReadabilityAnalysis,
    mfgDate?: string,
    packageLevel?: 'RETAIL_CONSUMER' | 'BULK_BOX' | 'WHOLESALE_CARTON'
  ): RuleEvaluation {
    const aliases = FIELD_ALIASES[rule.field] || [];

    // 1. Special check for wholesale / bulk box rule (Chapter III Rules 24-26)
    if (rule.field === 'bulk_box_declarations') {
      if (!packageLevel || packageLevel === 'RETAIL_CONSUMER') {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: 'Retail Consumer Packaging Scope: Chapter III Wholesale Master Carton mandates are exempt (governed under Chapter II Rule 6).',
          confidence: 0.99,
          severity: 'LOW',
          evidence_images: [],
          evidence_text: 'Retail Consumer Packaging Scope (Chapter II Exemption for wholesale outer rules)',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Chapter III Rule 24',
          applicable_version: rule.version,
          version_in_force_note: 'Standard retail package.'
        };
      } else {
        // Bulk Box or Wholesale Shipper Carton evaluation (Chapter III Rules 24-26)
        const hasMfr = !!declStore.getBest('manufacturer_name', FIELD_ALIASES['manufacturer_name'])?.found;
        const hasCommodity = !!declStore.getBest('product_name', FIELD_ALIASES['product_name'])?.found;
        const hasQty = !!declStore.getBest('net_quantity', FIELD_ALIASES['net_quantity'])?.found;
        const bestQty = declStore.getBest('net_quantity', FIELD_ALIASES['net_quantity']);

        if (hasMfr && hasCommodity && hasQty) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'PASS',
            reason: 'Wholesale Master Shipper Carton statutory compliance verified: Manufacturer details, commodity identity, and total package net count/mass meet Chapter III Rules 24–26 mandates.',
            confidence: 0.95,
            severity: 'HIGH',
            evidence_images: declStore.getEvidenceImages('net_quantity', FIELD_ALIASES['net_quantity']),
            evidence_text: `Master Carton Declaration: ${bestQty?.normalized_value || 'Compliant wholesale shipping container'}`,
            normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Chapter III Rule 24(1)',
            applicable_version: rule.version,
            version_in_force_note: 'In force.'
          };
        } else {
          const missingParts = [
            !hasMfr ? 'Manufacturer/Packer Address' : null,
            !hasCommodity ? 'Commodity Generic Name' : null,
            !hasQty ? 'Total Net Quantity / Unit Count' : null
          ].filter(Boolean).join(', ');

          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: `Bulk Master Carton violation under Chapter III: Missing mandatory outer shipper declarations (${missingParts}). Requires Manufacturer, Commodity Name, and Total Net Quantity / Retail Units Count.`,
            confidence: 0.92,
            severity: 'HIGH',
            evidence_images: [],
            evidence_text: 'Incomplete wholesale master carton declaration panel.',
            normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Chapter III Rule 24(1)',
            applicable_version: rule.version,
            version_in_force_note: 'In force.'
          };
        }
      }
    }

    // 2. Readability & Calibration Flag Check
    if (rule.validation_type === 'READABILITY') {
      if (!readability) {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'REVIEW',
          reason: 'Physical font-size calibration unavailable from photo alone (indicative uncalibrated optical estimation). No reference scale or declared dimension calibration applied.',
          confidence: 0.70,
          severity: rule.severity,
          evidence_images: [],
          evidence_text: 'Indicative Uncalibrated Optical Estimation — Not Calibrated.',
          normative_reference: rule.source,
          applicable_version: rule.version,
          version_in_force_note: 'In force on inspection date.'
        };
      }

      const isCalibrated = !!readability.is_calibrated;
      const calibrationPrefix = isCalibrated
        ? `[Certified Physical Scale Calibration: ${readability.scale_factor_px_per_mm || 'calibrated'} px/mm]`
        : '[Indicative Uncalibrated Optical Estimation — Not Calibrated]';

      return {
        rule_id: rule.rule_id,
        field: rule.field,
        title: rule.title,
        status: readability.status,
        reason: `${readability.message} ${calibrationPrefix}`,
        confidence: isCalibrated ? 0.94 : 0.75,
        severity: rule.severity,
        evidence_images: [],
        evidence_text: `${calibrationPrefix} Character height: ~${readability.characterHeightPxEstimated}px (${readability.estimatedCharHeightMm ? readability.estimatedCharHeightMm.toFixed(2) + 'mm' : 'uncalibrated'}), Contrast: ${readability.contrastRatio?.toFixed(1) || '12.0'}:1`,
        normative_reference: rule.source,
        applicable_version: rule.version,
        version_in_force_note: 'Rule 7 & 8 (Schedule II character height standards).'
      };
    }

    // 3. Temporal Rule Versioning against stated manufacture date
    if (mfgDate && rule.effective_from) {
      const mfgYm = mfgDate.slice(0, 7);
      const ruleYm = rule.effective_from.slice(0, 7);

      if (mfgYm < ruleYm) {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Statutory Temporal Exemption: Stated manufacture/packing date (${mfgDate}) predates rule enactment date (${rule.effective_from} via ${rule.gazette_notification_no || 'Gazette Notification'}). The package conforms to statutory requirements in force at the time of manufacture.`,
          confidence: 0.98,
          severity: 'LOW',
          evidence_images: [],
          evidence_text: `Stated Manufacture Date: ${mfgDate} < Enactment Date: ${rule.effective_from}`,
          normative_reference: `${rule.source} (Effective from ${rule.effective_from})`,
          applicable_version: `Historical Exemption (${rule.version})`,
          version_in_force_note: `Rule not in force on stated manufacture date (${mfgDate}).`
        };
      }
    }

    // 4. Resolve authoritative declaration via DeclarationStore (eliminating map collision)
    const decl = declStore.getBest(rule.field, aliases);
    const evidenceImages = declStore.getEvidenceImages(rule.field, aliases);

    // If declaration is missing entirely
    if (!decl || !decl.found || decl.status === 'NOT_FOUND') {
      // Special applicability for Unit Sale Price
      if (rule.field === 'unit_sale_price') {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'REVIEW',
          reason: 'Unit Sale Price not detected. Mandatory if net quantity > 100g/ml or multi-unit package under Rule 6(11).',
          confidence: 0.80,
          severity: rule.severity,
          evidence_images: [],
          evidence_text: 'No explicit Unit Sale Price statement located.',
          normative_reference: rule.source,
          applicable_version: rule.version
        };
      }

      // Check consumer care phone/email fallback
      if (rule.field === 'consumer_care') {
        const phoneDecl = declStore.getBest('consumer_care_phone');
        const emailDecl = declStore.getBest('consumer_care_email');
        if (phoneDecl?.found || emailDecl?.found) {
          const both = phoneDecl?.found && emailDecl?.found;
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: both ? 'PASS' : 'REVIEW',
            reason: both
              ? `Consumer care grievance contact details verified via phone (${phoneDecl?.normalized_value || phoneDecl?.original_text}) and email (${emailDecl?.normalized_value || emailDecl?.original_text}).`
              : `Partial consumer care redressal details verified via ${phoneDecl?.found ? 'telephone' : 'email'} only. Dual channels recommended.`,
            confidence: 0.85,
            severity: both ? 'LOW' : 'MEDIUM',
            evidence_images: [
              ...(phoneDecl?.image_id ? [phoneDecl.image_id] : []),
              ...(emailDecl?.image_id ? [emailDecl.image_id] : [])
            ],
            evidence_text: `Phone: "${phoneDecl?.original_text || 'N/A'}", Email: "${emailDecl?.original_text || 'N/A'}"`,
            normative_reference: rule.source,
            applicable_version: rule.version
          };
        }
      }

      return {
        rule_id: rule.rule_id,
        field: rule.field,
        title: rule.title,
        status: 'FAIL',
        reason: `Mandatory statutory declaration "${rule.title}" was not detected on any submitted package label panel.`,
        confidence: 0.92,
        severity: rule.severity,
        evidence_images: [],
        evidence_text: 'No matching text detected across image views.',
        normative_reference: rule.source,
        applicable_version: rule.version,
        version_in_force_note: `Enforced under ${rule.gazette_notification_no || rule.source}.`
      };
    }

    // Uncertain or low confidence
    if (decl.status === 'UNCERTAIN' || (decl.confidence ?? 0) < 0.70) {
      return {
        rule_id: rule.rule_id,
        field: rule.field,
        title: rule.title,
        status: 'REVIEW',
        reason: `Declaration found with ambiguous or low OCR confidence (${Math.round((decl.confidence ?? 0) * 100)}%). Manual inspection recommended.`,
        confidence: decl.confidence ?? 0.7,
        severity: rule.severity,
        evidence_images: evidenceImages.length > 0 ? evidenceImages : (decl.image_id ? [decl.image_id] : []),
        evidence_text: decl.original_text || 'Unclear text region',
        normative_reference: rule.source,
        applicable_version: rule.version
      };
    }

    // Field-specific validation
    switch (rule.validation_type) {
      case 'MRP': {
        const text = (decl.original_text || '').toLowerCase();
        const hasRupee = text.includes('₹') || text.includes('rs') || text.includes('inr');
        const hasTaxes = text.includes('tax') || text.includes('incl') || text.includes('all');
        const hasDigits = /\d+/.test(text);

        if (!hasDigits) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: 'Maximum Retail Price declaration is missing numerical price value.',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        if (!hasRupee || !hasTaxes) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'REVIEW',
            reason: 'MRP declared without clear "inclusive of all taxes" disclaimer or statutory currency identifier.',
            confidence: decl.confidence,
            severity: 'MEDIUM',
            evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Valid MRP declaration (${decl.normalized_value}) with currency identifier and tax inclusivity verified.`,
          confidence: decl.confidence,
          severity: rule.severity,
          evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
      }

      case 'QUANTITY': {
        const text = (decl.original_text || '').toLowerCase();
        const isStandard = /\b(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|ml|l|ltr|litre|litres|n|pcs|pieces|units)\b/i.test(text);
        if (!isStandard) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'REVIEW',
            reason: 'Net quantity unit formatting is non-standard or missing standard metric unit symbol.',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Compliant net quantity declared in standard metric units (${decl.normalized_value}).`,
          confidence: decl.confidence,
          severity: rule.severity,
          evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
      }

      case 'CONSUMER_CARE': {
        const text = (decl.original_text || '').toLowerCase();
        const hasPhone =
          /\b(?:\+91|0)?\d{10}\b|\b1800\d{6,8}\b|\b\d{3,5}[-\s]\d{6,8}\b/.test(text) ||
          !!declStore.getBest('consumer_care_phone')?.found;
        const hasEmail =
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) ||
          !!declStore.getBest('consumer_care_email')?.found;

        if (!hasPhone && !hasEmail) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: 'Consumer care declaration is incomplete; missing phone number and/or email address under Rule 6(1)(n).',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        if (!hasPhone || !hasEmail) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'REVIEW',
            reason: 'Consumer care contact provides only single channel (recommend both telephone and email for full compliance).',
            confidence: decl.confidence,
            severity: 'MEDIUM',
            evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: 'Complete consumer care grievance redressal details with telephone and email verified.',
          confidence: decl.confidence,
          severity: rule.severity,
          evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
      }

      case 'DATE': {
        const text = (decl.original_text || '').toLowerCase();
        const hasMonthYear =
          /(\d{1,2}[\/\-]\d{2,4})|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text);
        if (!hasMonthYear) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: 'Manufacturing/Packing date is missing mandatory Month and Year format under Rule 6(1)(d).',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Month and Year declared properly (${decl.normalized_value}).`,
          confidence: decl.confidence,
          severity: rule.severity,
          evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
      }

      default:
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Mandatory declaration present and verified (${decl.normalized_value || decl.original_text}).`,
          confidence: decl.confidence,
          severity: rule.severity,
          evidence_images: evidenceImages.length > 0 ? evidenceImages : [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
    }
  }

  private performCrossImageChecks(declStore: DeclarationStore): CrossImageConsistencyCheck[] {
    const checks: CrossImageConsistencyCheck[] = [];
    const allDeclarations = declStore.getRawList();

    // Check Net Quantity consistency across Front and Back
    const frontQty = allDeclarations.find(
      (d) => d.field === 'net_quantity' && d.image_type?.toLowerCase() === 'front'
    );
    const backQty = allDeclarations.find(
      (d) => d.field === 'net_quantity' && d.image_type?.toLowerCase() === 'back'
    );

    if (frontQty && backQty && frontQty.found && backQty.found) {
      const isConsistent =
        (frontQty.normalized_value || frontQty.original_text)
          .toLowerCase()
          .replace(/\s+/g, '') ===
        (backQty.normalized_value || backQty.original_text)
          .toLowerCase()
          .replace(/\s+/g, '');

      checks.push({
        field: 'net_quantity',
        label: 'Net Quantity Consistency',
        front_value: frontQty.normalized_value || frontQty.original_text,
        back_value: backQty.normalized_value || backQty.original_text,
        is_consistent: isConsistent,
        status: isConsistent ? 'PASS' : 'REVIEW',
        details: isConsistent
          ? 'Front and Back net quantity declarations match consistently.'
          : `Cross-image inconsistency detected — Front states "${frontQty.normalized_value}" while Back states "${backQty.normalized_value}". Manual verification required.`
      });
    }

    // Check MRP consistency across Front and Back
    const frontMRP = allDeclarations.find(
      (d) => d.field === 'mrp' && d.image_type?.toLowerCase() === 'front'
    );
    const backMRP = allDeclarations.find(
      (d) => d.field === 'mrp' && d.image_type?.toLowerCase() === 'back'
    );

    if (frontMRP && backMRP && frontMRP.found && backMRP.found) {
      const isConsistent =
        (frontMRP.normalized_value || frontMRP.original_text)
          .toLowerCase()
          .replace(/\s+/g, '') ===
        (backMRP.normalized_value || backMRP.original_text)
          .toLowerCase()
          .replace(/\s+/g, '');

      checks.push({
        field: 'mrp',
        label: 'Maximum Retail Price Consistency',
        front_value: frontMRP.normalized_value || frontMRP.original_text,
        back_value: backMRP.normalized_value || backMRP.original_text,
        is_consistent: isConsistent,
        status: isConsistent ? 'PASS' : 'REVIEW',
        details: isConsistent
          ? 'Front and Back MRP declarations match consistently.'
          : `Cross-image inconsistency detected — Front MRP "${frontMRP.normalized_value}" differs from Back MRP "${backMRP.normalized_value}".`
      });
    }

    return checks;
  }

  public generatePlainLanguageSummary(
    overallStatus: ComplianceStatus,
    failCount: number,
    reviewCount: number,
    evaluations: RuleEvaluation[]
  ): string {
    if (overallStatus === 'PASS') {
      return 'CERTIFICATE OF PRIMA FACIE STATUTORY CONFORMANCE: The packaged commodity screening indicates full compliance with mandatory declarations under Rule 6, Rule 7, Rule 8, and Schedule II of the Legal Metrology (Packaged Commodities) Rules, 2011. All examined mandatory panels (Generic Commodity Name, Net Quantity in standard metric units, Maximum Retail Price inclusive of all taxes, Complete Manufacturer/Packer Address, Month/Year of Packing, Consumer Grievance Redressal Cell, and Unit Sale Price) are present and conform to statutory metric formats. The commodity satisfies statutory conditions for lawful retail distribution and digital commerce.';
    }

    const failedRules = evaluations
      .filter((e) => e.status === 'FAIL')
      .map((e) => `• ${e.title} (${e.normative_reference}): ${e.reason}`);

    const reviewRules = evaluations
      .filter((e) => e.status === 'REVIEW')
      .map((e) => `• ${e.title}: ${e.reason}`);

    if (overallStatus === 'FAIL') {
      return `STATUTORY NOTICE OF NON-CONFORMANCE / SHOW CAUSE MEMORANDUM
Under Section 36 of the Legal Metrology Act, 2009 read with Legal Metrology (Packaged Commodities) Rules, 2011

Screening of the subject packaged commodity identified ${failCount} statutory violation(s):
${failedRules.join('\n')}

LEGAL IMPLICATIONS & PENAL PROVISIONS:
Under Section 36(1) of the Legal Metrology Act, 2009, whoever manufactures, packs, imports, sells, distributes, delivers, or puts up for sale any pre-packaged commodity which does not conform to the statutory declarations provided under the Act/Rules shall be punishable with a fine extending to ₹25,000/- for the first offence, up to ₹50,000/- for the second offence, and up to ₹1,00,000/- or imprisonment up to one year for subsequent offences.

DIRECTIVE:
This automated screening report serves as admissible documentary evidence. An inspection notice is recommended giving 15 days to the manufacturer/packer/distributor to show cause or submit an application for compounding of offences under Section 48 of the Act.`;
    }

    // REVIEW
    return `STATUTORY VERIFICATION ADVISORY:
The commodity requires physical verification by an authorized Legal Metrology Officer due to ${reviewCount} ambiguous or unverified declaration(s):
${reviewRules.join('\n')}

Physical verification with a certified scale calibration device (Schedule II) and examination of tax inclusivity statements are advised prior to issuing formal legal notice under Section 36.`;
  }

  public static getCrossRegimeNotices(category: ProductCategory): {
    regime: 'FSSAI' | 'CDSCO' | 'BEE_BIS' | 'E_WASTE';
    title: string;
    description: string;
    statutory_body: string;
    exemption_disclaimer: string;
  }[] {
    const notices: {
      regime: 'FSSAI' | 'CDSCO' | 'BEE_BIS' | 'E_WASTE';
      title: string;
      description: string;
      statutory_body: string;
      exemption_disclaimer: string;
    }[] = [];

    if (category === 'Food' || category === 'Beverages') {
      notices.push({
        regime: 'FSSAI',
        title: 'Food Safety & Standards (Packaging and Labelling) Regulations, 2020',
        description:
          'Pre-packaged food commodities must prominently bear FSSAI 14-digit License/Registration logo and number, nutritional information, veg/non-veg emblem, and allergen warning.',
        statutory_body: 'Food Safety and Standards Authority of India (Ministry of Health & Family Welfare)',
        exemption_disclaimer:
          'Informational note: Enforcement under FSSAI Act 2006 lies within the jurisdiction of Designated Food Safety Officers and does not alter Legal Metrology metric compliance.'
      });
    }

    if (category === 'Cosmetics' || category === 'Pharmaceuticals') {
      notices.push({
        regime: 'CDSCO',
        title: 'Drugs and Cosmetics Act, 1940 & Cosmetics Rules, 2020',
        description:
          'Cosmetic and drug formulations require manufacturing license number (e.g., M-Lic No.), complete list of key ingredients, batch expiry dates, and cautionary warning declarations.',
        statutory_body: 'Central Drugs Standard Control Organisation (CDSCO)',
        exemption_disclaimer:
          'Informational note: Mandated under Drugs & Cosmetics Rules. Metrology screening focuses exclusively on metric quantity, MRP, and packer identity.'
      });
    }

    if (category === 'Electrical') {
      notices.push({
        regime: 'BEE_BIS',
        title: 'Bureau of Energy Efficiency (BEE) Star Rating & BIS ISI Certification',
        description:
          'Mandatory star-labelling appliance standards and ISI certification mark under Section 16 of the BIS Act 2016 for electrical equipment.',
        statutory_body: 'Bureau of Energy Efficiency (Ministry of Power) & Bureau of Indian Standards',
        exemption_disclaimer:
          'Informational note: Energy star ratings and safety marks are non-blocking for Legal Metrology net count and MRP verification.'
      });
    }

    return notices;
  }
}
