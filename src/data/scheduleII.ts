/**
 * Statutory Minimum Character Height Standards
 * Pursuant to Rule 7(1) & Schedule II of the Legal Metrology (Packaged Commodities) Rules, 2011.
 * 
 * Single Canonical Source of Truth across LegalMetrix suite.
 */

export interface ScheduleIITableRow {
  serialNo: number;
  netQuantityRange: string;
  pdaRange: string;
  minHeightNormalMm: number;
  minHeightBlownMm: number;
  statutoryNotes: string;
}

export const SCHEDULE_II_STANDARDS: ScheduleIITableRow[] = [
  {
    serialNo: 1,
    netQuantityRange: 'Up to 50 g / 50 ml / 50 cm / 50 cm²',
    pdaRange: '≤ 50 cm²',
    minHeightNormalMm: 1.0,
    minHeightBlownMm: 2.0,
    statutoryNotes: 'Applicable to small-format confectionery, sample units, and cosmetic sachets.'
  },
  {
    serialNo: 2,
    netQuantityRange: 'Above 50 g / 50 ml up to 200 g / 200 ml',
    pdaRange: '50 cm² to 100 cm²',
    minHeightNormalMm: 2.0,
    minHeightBlownMm: 4.0,
    statutoryNotes: 'Standard FMCG packaged commodity size (Biscuits, Personal Care, Condiments).'
  },
  {
    serialNo: 3,
    netQuantityRange: 'Above 200 g / 200 ml up to 1 kg / 1 L',
    pdaRange: '100 cm² to 500 cm²',
    minHeightNormalMm: 4.0,
    minHeightBlownMm: 6.0,
    statutoryNotes: 'Medium retail cartons, pouches, cereal boxes, and edible oil bottles.'
  },
  {
    serialNo: 4,
    netQuantityRange: 'Above 1 kg / 1 L',
    pdaRange: '> 500 cm²',
    minHeightNormalMm: 6.0,
    minHeightBlownMm: 8.0,
    statutoryNotes: 'Bulk packaging, family packs, 5L cans, and industrial packaged goods.'
  }
];

/**
 * Returns required statutory minimum character height in millimeters for a given net quantity string or gram/ml value.
 */
export function getStatutoryMinHeight(netQuantityStr: string, isBlownMoulded: boolean = false): number {
  if (!netQuantityStr) return isBlownMoulded ? 4.0 : 2.0;

  const lower = netQuantityStr.toLowerCase();
  // Extract numerical value and unit
  const match = lower.match(/([\d.]+)\s*(kg|g|gm|l|ltr|liter|litre|ml|m|cm)/i);
  if (!match) return isBlownMoulded ? 4.0 : 2.0;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  let gramsEquivalent = value;
  if (unit === 'kg' || unit === 'l' || unit === 'ltr' || unit === 'liter' || unit === 'litre') {
    gramsEquivalent = value * 1000;
  }

  if (gramsEquivalent <= 50) {
    return isBlownMoulded ? 2.0 : 1.0;
  } else if (gramsEquivalent <= 200) {
    return isBlownMoulded ? 4.0 : 2.0;
  } else if (gramsEquivalent <= 1000) {
    return isBlownMoulded ? 6.0 : 4.0;
  } else {
    return isBlownMoulded ? 8.0 : 6.0;
  }
}
