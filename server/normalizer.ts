/**
 * Normalization utility for Legal Metrology package declarations
 */

export function normalizeMRP(text: string): { normalized: string; numericValue: number | null; currency: string } {
  if (!text) return { normalized: '', numericValue: null, currency: 'INR' };
  
  // Clean string
  const clean = text.replace(/mrp\s*[:.-]?/i, '').replace(/incl\.?.*taxes/i, '').trim();
  
  // Find numeric digits with optional decimal
  const match = clean.match(/(\d+(?:\.\d{1,2})?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return {
      normalized: `${val.toFixed(2)} INR`,
      numericValue: val,
      currency: 'INR'
    };
  }
  
  return { normalized: clean, numericValue: null, currency: 'INR' };
}

export function normalizeNetQuantity(text: string): { normalized: string; value: number | null; unit: string } {
  if (!text) return { normalized: '', value: null, unit: '' };
  
  const clean = text.replace(/net\s*(?:qty|quantity|wt|weight|vol|volume)?\s*[:.-]?/i, '').trim();
  
  // Match number + unit (g, gm, gms, kg, ml, l, ltr, litres, N, pcs, pieces)
  const match = clean.match(/(\d+(?:\.\d+)?)\s*(kg|kilogram|g|gm|gms|gram|grams|ml|millilitre|l|ltr|litre|litres|n|pcs|pieces|units|u)\b/i);
  
  if (match) {
    const val = parseFloat(match[1]);
    const rawUnit = match[2].toLowerCase();
    
    let standardUnit = rawUnit;
    let standardVal = val;
    
    if (['g', 'gm', 'gms', 'gram', 'grams'].includes(rawUnit)) {
      standardUnit = 'g';
    } else if (['kg', 'kilogram'].includes(rawUnit)) {
      standardUnit = 'kg';
    } else if (['ml', 'millilitre'].includes(rawUnit)) {
      standardUnit = 'ml';
    } else if (['l', 'ltr', 'litre', 'litres'].includes(rawUnit)) {
      standardUnit = 'L';
    } else if (['n', 'pcs', 'pieces', 'units', 'u'].includes(rawUnit)) {
      standardUnit = 'N';
    }
    
    return {
      normalized: `${standardVal} ${standardUnit}`,
      value: standardVal,
      unit: standardUnit
    };
  }
  
  return { normalized: clean, value: null, unit: '' };
}

export function normalizeDate(text: string): { normalized: string; month?: string; year?: string } {
  if (!text) return { normalized: '' };
  
  const clean = text.replace(/(?:mfg|pkd|mfd|packed|manufactured|imported|use\s*by|best\s*before)\s*[:.-]?/i, '').trim();
  
  // Format MM/YYYY or MM-YYYY or MMM YYYY
  const matchMonthYear = clean.match(/(\d{1,2})[\/\-](\d{2,4})/);
  if (matchMonthYear) {
    let month = parseInt(matchMonthYear[1], 10);
    let year = matchMonthYear[2];
    if (year.length === 2) year = `20${year}`;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthName = (month >= 1 && month <= 12) ? months[month - 1] : `M${month}`;
    return {
      normalized: `${monthName}-${year}`,
      month: monthName,
      year
    };
  }
  
  // Format like 'May 2026' or '05/26'
  const matchTextMonth = clean.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\/\-](\d{2,4})/i);
  if (matchTextMonth) {
    const monthName = matchTextMonth[1].toUpperCase();
    let year = matchTextMonth[2];
    if (year.length === 2) year = `20${year}`;
    return {
      normalized: `${monthName}-${year}`,
      month: monthName,
      year
    };
  }
  
  return { normalized: clean };
}

export function normalizePhone(text: string): string {
  if (!text) return '';
  const digits = text.replace(/[^\d+]/g, '');
  return digits;
}

export function normalizeEmail(text: string): string {
  if (!text) return '';
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : text.trim();
}
