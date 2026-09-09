import {
  RuleDefinition,
  RuleEvaluation,
  ExtractedDeclaration,
  CrossImageConsistencyCheck,
  ReadabilityAnalysis,
  ComplianceStatus,
  ProductCategory
} from '../src/types/index';

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
    source: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)',
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
    requirement: 'Must declare Month and Year (e.g., MM/YYYY or Month YYYY) on package.',
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
    description: 'Declaration of Unit Sale Price (e.g. ₹/g, ₹/ml, ₹/piece) for packages containing more than 1 unit/weight threshold.',
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
    requirement: 'Text must have sufficient optical contrast and estimated character height meeting minimum statutory limits.',
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
    packageLevel?: 'RETAIL_CONSUMER' | 'BULK_BOX' | 'WHOLESALE_CARTON'
  ): {
    evaluations: RuleEvaluation[];
    overallStatus: ComplianceStatus;
    screeningScore: number;
    crossImageChecks: CrossImageConsistencyCheck[];
    plainLanguageSummary: string;
  } {
    const activeRules = this.rules.filter(r => r.active);
    const evaluations: RuleEvaluation[] = [];

    // Helper map for declarations
    const declMap = new Map<string, ExtractedDeclaration>();
    declarations.forEach(d => {
      declMap.set(d.field, d);
    });

    // Detect stated manufacture / packing date for temporal rule version resolution
    const effectiveMfgDate = mfgDateStated || this.extractDateForTemporalCheck(declMap.get('mfg_date')?.normalized_value || declMap.get('mfg_date')?.original_text);

    for (const rule of activeRules) {
      const evaluation = this.evaluateSingleRule(rule, declMap, category, readability, effectiveMfgDate, packageLevel);
      evaluations.push(evaluation);
    }

    // Cross-Image consistency checks
    const crossImageChecks = this.performCrossImageChecks(declarations);

    // If any cross-image check fails, insert a cross-image evaluation or adjust
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
          evidence_images: images.map(i => i.id),
          evidence_text: `Front: "${check.front_value}" vs Back: "${check.back_value}"`,
          normative_reference: 'Legal Metrology Enforcement Standard — Label Consistency Verification',
          applicable_version: '2026.1'
        });
      }
    }

    // Compute Overall Status and Continuous Weighted Screening Score (0-100)
    // PS ID 26034 Mandate: Continuous weighted deductions based on statutory severity
    // (e.g., Missing MRP = -25%, Imperial Unit Used / Net Qty = -20%, Missing Address = -15%, Unit Sale Price missing = -10%)
    let score = 100;
    let failCount = 0;
    let reviewCount = 0;
    let passCount = 0;

    for (const evalItem of evaluations) {
      if (evalItem.status === 'FAIL') {
        failCount++;
        let deduction = 15;
        if (evalItem.field === 'mrp') {
          deduction = 25; // Missing or non-compliant MRP = -25%
        } else if (evalItem.field === 'net_quantity') {
          deduction = 20; // Missing Net Quantity or non-standard metric units = -20%
        } else if (evalItem.field === 'manufacturer_name') {
          deduction = 15; // Missing Manufacturer/Packer Name or Address = -15%
        } else if (evalItem.field === 'unit_sale_price') {
          deduction = 10; // Missing Unit Sale Price = -10%
        } else if (evalItem.field === 'consumer_care') {
          deduction = 10; // Incomplete Consumer Care Cell = -10%
        } else if (evalItem.field === 'mfg_date') {
          deduction = 10; // Missing Month/Year of Packing = -10%
        } else if (evalItem.field === 'country_of_origin') {
          deduction = 10; // Missing Country of Origin = -10%
        } else if (evalItem.field === 'readability') {
          deduction = 10; // Sub-standard character height = -10%
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
          deduction = 8;  // Non-standard abbreviation = -8%
        } else if (evalItem.field === 'manufacturer_name') {
          deduction = 6;  // Partial address = -6%
        } else if (evalItem.field === 'unit_sale_price') {
          deduction = 5;  // Ambiguous USP = -5%
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

    // Generate Plain-Language Statutory Summary (Requirement 13)
    const plainLanguageSummary = this.generatePlainLanguageSummary(overallStatus, failCount, reviewCount, evaluations);

    return {
      evaluations,
      overallStatus,
      screeningScore: score,
      crossImageChecks,
      plainLanguageSummary
    };
  }

  private extractDateForTemporalCheck(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    // Look for MM/YYYY, MM-YYYY, or YYYY-MM
    const match = dateStr.match(/(\d{4})[-\/](\d{1,2})/) || dateStr.match(/(\d{1,2})[-\/](\d{4})/);
    if (match) {
      if (match[1].length === 4) {
        return `${match[1]}-${match[2].padStart(2, '0')}`;
      } else {
        return `${match[2]}-${match[1].padStart(2, '0')}`;
      }
    }
    return undefined;
  }

  private evaluateSingleRule(
    rule: RuleDefinition,
    declMap: Map<string, ExtractedDeclaration>,
    category: ProductCategory,
    readability?: ReadabilityAnalysis,
    mfgDate?: string,
    packageLevel?: 'RETAIL_CONSUMER' | 'BULK_BOX' | 'WHOLESALE_CARTON'
  ): RuleEvaluation {
    // Special check for wholesale / bulk box rule (Chapter III)
    if (rule.field === 'bulk_box_declarations') {
      if (!packageLevel || packageLevel === 'RETAIL_CONSUMER') {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: 'Retail Consumer Packaging Scope: Chapter III Wholesale Master Carton mandates are exempt (covered under Chapter II Rule 6).',
          confidence: 0.99,
          severity: 'LOW',
          evidence_images: [],
          evidence_text: 'Retail Consumer Packaging Scope (Chapter II Exemption for wholesale outer rules)',
          normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Chapter III Rule 24',
          applicable_version: rule.version,
          version_in_force_note: 'Standard retail package.'
        };
      } else {
        // Bulk Box or Wholesale Shipper Carton evaluation
        const hasMfr = !!declMap.get('manufacturer_name_address')?.found;
        const hasCommodity = !!declMap.get('product_name')?.found;
        const hasQty = !!declMap.get('net_quantity')?.found;
        if (hasMfr && hasCommodity && hasQty) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'PASS',
            reason: 'Wholesale Master Shipper Carton statutory compliance verified: Manufacturer details, commodity identity, and total package net count/mass meet Chapter III Rules 24–26 mandates.',
            confidence: 0.95,
            severity: 'HIGH',
            evidence_images: declMap.get('net_quantity')?.image_id ? [declMap.get('net_quantity')!.image_id!] : [],
            evidence_text: `Master Carton Declaration: ${declMap.get('net_quantity')?.normalized_value || 'Compliant wholesale shipping container'}`,
            normative_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Chapter III Rule 24(1)',
            applicable_version: rule.version,
            version_in_force_note: 'In force.'
          };
        } else {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: 'Bulk Master Carton violation under Chapter III: Missing mandatory outer shipper declarations (requires Manufacturer, Commodity Name, and Total Net Quantity / Unit Count).',
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

    const decl = declMap.get(rule.field);

    // Rule Versioning check against stated manufacture date (Requirement 4)
    if (mfgDate && rule.effective_from) {
      // Compare YYYY-MM
      const mfgYm = mfgDate.slice(0, 7);
      const ruleYm = rule.effective_from.slice(0, 7);
      if (mfgYm < ruleYm) {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Exempt under Rule Versioning: Stated packing date (${mfgDate}) predates rule enactment date (${rule.effective_from} via ${rule.gazette_notification_no || 'Gazette Notification'}).`,
          confidence: 0.98,
          severity: 'LOW',
          evidence_images: [],
          evidence_text: `Manufacture Date: ${mfgDate} < Enactment: ${rule.effective_from}`,
          normative_reference: `${rule.source} (Effective from ${rule.effective_from})`,
          applicable_version: `Historical Exemption (${rule.version})`,
          version_in_force_note: `Rule not in force on stated manufacture date (${mfgDate}).`
        };
      }
    }

    // Readability special case (Requirement 1: Calibration requirement)
    if (rule.validation_type === 'READABILITY') {
      if (!readability) {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'REVIEW',
          reason: 'Physical font-size calibration unavailable from photo alone (indicative — not calibrated). No reference scale or declared dimension calibration applied.',
          confidence: 0.70,
          severity: rule.severity,
          evidence_images: [],
          evidence_text: 'Optical contrast screened (indicative — not calibrated).',
          normative_reference: rule.source,
          applicable_version: rule.version,
          version_in_force_note: 'In force on inspection date.'
        };
      }

      const isCalibrated = !!readability.is_calibrated;
      const calibrationNote = isCalibrated
        ? `[Certified Measurement: ${readability.scale_factor_px_per_mm || 'calibrated'} px/mm]`
        : '[indicative — not calibrated]';

      return {
        rule_id: rule.rule_id,
        field: rule.field,
        title: rule.title,
        status: readability.status,
        reason: `${readability.message} ${calibrationNote}`,
        confidence: isCalibrated ? 0.94 : 0.75,
        severity: rule.severity,
        evidence_images: [],
        evidence_text: `${calibrationNote} Estimated height: ${readability.characterHeightPxEstimated}px (${readability.estimatedCharHeightMm ? readability.estimatedCharHeightMm.toFixed(2) + 'mm' : 'uncalibrated'}), Contrast: ${readability.contrastRatio.toFixed(1)}:1`,
        normative_reference: rule.source,
        applicable_version: rule.version,
        version_in_force_note: 'Rule 7 & 8 (Schedule II character height standards).'
      };
    }

    // If declaration is missing entirely
    if (!decl || !decl.found || decl.status === 'NOT_FOUND') {
      // Check applicability for Unit Sale Price
      if (rule.field === 'unit_sale_price') {
        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'REVIEW',
          reason: 'Unit Sale Price not detected. Required if net quantity > 100g/ml or multi-unit under Rule 6(11).',
          confidence: 0.80,
          severity: rule.severity,
          evidence_images: [],
          evidence_text: 'No explicit USP statement located.',
          normative_reference: rule.source,
          applicable_version: rule.version
        };
      }

      return {
        rule_id: rule.rule_id,
        field: rule.field,
        title: rule.title,
        status: 'FAIL',
        reason: `Mandatory declaration "${rule.title}" was not detected on any submitted package label images.`,
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
    if (decl.status === 'UNCERTAIN' || decl.confidence < 0.70) {
      return {
        rule_id: rule.rule_id,
        field: rule.field,
        title: rule.title,
        status: 'REVIEW',
        reason: `Declaration found with ambiguous or low OCR confidence (${Math.round(decl.confidence * 100)}%). Manual inspection recommended.`,
        confidence: decl.confidence,
        severity: rule.severity,
        evidence_images: decl.image_id ? [decl.image_id] : [],
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
            reason: 'MRP declaration is missing numerical price value.',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: [decl.image_id],
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
            reason: 'MRP declared without clear "inclusive of all taxes" disclaimer or currency identifier.',
            confidence: decl.confidence,
            severity: 'MEDIUM',
            evidence_images: [decl.image_id],
            evidence_text: decl.original_text,
            normative_reference: rule.source
          };
        }

        return {
          rule_id: rule.rule_id,
          field: rule.field,
          title: rule.title,
          status: 'PASS',
          reason: `Valid MRP declaration (${decl.normalized_value}) with currency and tax declaration.`,
          confidence: decl.confidence,
          severity: rule.severity,
          evidence_images: [decl.image_id],
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
            reason: 'Net quantity unit formatting is non-standard or missing metric unit symbol.',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: [decl.image_id],
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
          evidence_images: [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
      }

      case 'CONSUMER_CARE': {
        const text = (decl.original_text || '').toLowerCase();
        const hasPhone = /\b(?:\+91|0)?\d{10}\b|\b1800\d{6,8}\b|\b\d{3,5}[-\s]\d{6,8}\b/.test(text) || !!declMap.get('consumer_care_phone')?.found;
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) || !!declMap.get('consumer_care_email')?.found;

        if (!hasPhone && !hasEmail) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: 'Consumer care declaration is incomplete; missing phone number and/or email address.',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: [decl.image_id],
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
            reason: 'Consumer care contact provides only single channel (recommend both telephone and email).',
            confidence: decl.confidence,
            severity: 'MEDIUM',
            evidence_images: [decl.image_id],
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
          evidence_images: [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
      }

      case 'DATE': {
        const text = (decl.original_text || '').toLowerCase();
        const hasMonthYear = /(\d{1,2}[\/\-]\d{2,4})|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text);
        if (!hasMonthYear) {
          return {
            rule_id: rule.rule_id,
            field: rule.field,
            title: rule.title,
            status: 'FAIL',
            reason: 'Manufacturing/Packing date is missing mandatory Month and Year format.',
            confidence: decl.confidence,
            severity: rule.severity,
            evidence_images: [decl.image_id],
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
          evidence_images: [decl.image_id],
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
          evidence_images: [decl.image_id],
          evidence_text: decl.original_text,
          normative_reference: rule.source
        };
    }
  }

  private performCrossImageChecks(declarations: ExtractedDeclaration[]): CrossImageConsistencyCheck[] {
    const checks: CrossImageConsistencyCheck[] = [];
    
    // Group declarations by field across different image types if available
    const frontQty = declarations.find(d => d.field === 'net_quantity' && d.image_type === 'Front');
    const backQty = declarations.find(d => d.field === 'net_quantity' && d.image_type === 'Back');

    if (frontQty && backQty && frontQty.found && backQty.found) {
      const isConsistent = frontQty.normalized_value.toLowerCase().replace(/\s+/g, '') === 
                           backQty.normalized_value.toLowerCase().replace(/\s+/g, '');
      
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

    const frontMRP = declarations.find(d => d.field === 'mrp' && d.image_type === 'Front');
    const backMRP = declarations.find(d => d.field === 'mrp' && d.image_type === 'Back');

    if (frontMRP && backMRP && frontMRP.found && backMRP.found) {
      const isConsistent = frontMRP.normalized_value.toLowerCase().replace(/\s+/g, '') === 
                           backMRP.normalized_value.toLowerCase().replace(/\s+/g, '');
      
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
      return 'The packaged commodity screening indicates prima facie compliance with mandatory declarations under Rule 6 and Rule 7 of the Legal Metrology (Packaged Commodities) Rules, 2011. All examined mandatory panels (Name, Net Qty, MRP, Manufacturer, Date, Consumer Care) are present and conform to statutory metric formats. Standard surveillance log created with no enforcement seizure required.';
    }

    const failedRules = evaluations.filter(e => e.status === 'FAIL').map(e => e.title);
    const reviewRules = evaluations.filter(e => e.status === 'REVIEW').map(e => e.title);

    if (overallStatus === 'FAIL') {
      const topViolations = failedRules.slice(0, 3).join(', ');
      return `Screening identified ${failCount} statutory violation(s) under the Legal Metrology (Packaged Commodities) Rules, 2011, notably in: ${topViolations}. Under Section 36 of the Legal Metrology Act, 2009, sale or distribution of non-conforming pre-packaged goods constitutes a compoundable offense. It is recommended that an inspection memo be issued to the packer/manufacturer giving 15 days to show cause or apply for compounding.`;
    }

    // REVIEW
    const ambig = reviewRules.slice(0, 2).join(' and ');
    return `The commodity requires manual verification by an Enforcement Officer due to ${reviewCount} ambiguous or unverified declaration(s) (${ambig || 'declaration clarity/units'}). Physical verification with a calibrated optical scale is advised to confirm character height and tax inclusivity statements before initiating formal notice proceedings.`;
  }

  public static getCrossRegimeNotices(category: ProductCategory): { regime: 'FSSAI' | 'CDSCO' | 'BEE_BIS' | 'E_WASTE'; title: string; description: string; statutory_body: string; exemption_disclaimer: string }[] {
    const notices: { regime: 'FSSAI' | 'CDSCO' | 'BEE_BIS' | 'E_WASTE'; title: string; description: string; statutory_body: string; exemption_disclaimer: string }[] = [];

    if (category === 'Food' || category === 'Beverages') {
      notices.push({
        regime: 'FSSAI',
        title: 'Food Safety & Standards (Packaging and Labelling) Regulations, 2020',
        description: 'Pre-packaged food commodities must prominently bear FSSAI 14-digit License/Registration logo and number, nutritional information, veg/non-veg emblem, and allergen warning.',
        statutory_body: 'Food Safety and Standards Authority of India (Ministry of Health & Family Welfare)',
        exemption_disclaimer: 'Informational note: Enforcement under FSSAI Act 2006 lies within the jurisdiction of Designated Food Safety Officers and does not alter Legal Metrology metric compliance.'
      });
    }

    if (category === 'Cosmetics' || category === 'Pharmaceuticals') {
      notices.push({
        regime: 'CDSCO',
        title: 'Drugs and Cosmetics Act, 1940 & Cosmetics Rules, 2020',
        description: 'Cosmetic and drug formulations require manufacturing license number (e.g., M-Lic No.), complete list of key ingredients, batch expiry dates, and cautionary warning declarations.',
        statutory_body: 'Central Drugs Standard Control Organisation (CDSCO)',
        exemption_disclaimer: 'Informational note: Mandated under Drugs & Cosmetics Rules. Metrology screening focuses exclusively on metric quantity, MRP, and packer identity.'
      });
    }

    if (category === 'Electrical') {
      notices.push({
        regime: 'BEE_BIS',
        title: 'Bureau of Energy Efficiency (BEE) Star Rating & BIS ISI Certification',
        description: 'Mandatory star-labelling appliance standards and ISI certification mark under Section 16 of the BIS Act 2016 for electrical equipment.',
        statutory_body: 'Bureau of Energy Efficiency (Ministry of Power) & Bureau of Indian Standards',
        exemption_disclaimer: 'Informational note: Energy star ratings and safety marks are non-blocking for Legal Metrology net count and MRP verification.'
      });
    }

    return notices;
  }
}
