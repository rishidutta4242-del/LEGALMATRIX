import {
  DeclarationStatus,
  ExtractedDeclaration,
  ImageBoundingBox,
  ImageType,
  LocalOcrLine,
  LocalOcrPanelResult,
} from '../types/index';

export interface ParsedDeclarationsOutput {
  declarations: ExtractedDeclaration[];
  inferredProduct: {
    name?: string;
    brand?: string;
  };
  avgConfidence: number;
  lowConfidenceDetected: boolean;
  warnings: string[];
}

function repairNumericOcr(raw: string): string {
  return (raw || '')
    .replace(/[OQDo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/B/g, '8')
    .replace(/Z/g, '2');
}

function normalizeEmailOcr(raw: string): string {
  return (raw || '')
    .trim()
    .replace(/\s*@\s*/g, '@')
    .replace(/,([a-z]{2,4})\b/gi, '.$1')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function normalizeMrpLocal(text: string): string {
  const clean = (text || '')
    .replace(/(?:m\.?\s*r\.?\s*p\.?|max\.?\s*retail\s*price|price)\s*(?:\bis\b)?\s*[:.\-=]?/i, '')
    .replace(/(?:rs\.?|inr)\s*/gi, '')
    .replace(/^\s*[₹$€£¥XFTRZE?*%=&§]+\s*/i, '')
    .replace(/\(?\s*incl\.?.*$/i, '')
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .trim();
  const match = clean.match(/((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]+(?:[.,][0-9OIlSBZ]{1,2})?)/);
  if (!match) return clean;
  const fixedNum = repairNumericOcr(match[1]).replace(',', '.');
  const val = parseFloat(fixedNum);
  return Number.isFinite(val) ? `${val.toFixed(2)} INR` : clean;
}

function normalizeUspLocal(text: string): string {
  const clean = (text || '')
    .replace(/(?:unit\s*sale\s*price|usp)\s*[:.\-=]?/i, '')
    .replace(/(?:rs\.?|inr)\s*/gi, '')
    .replace(/^\s*[₹$€£¥XFTRZE?*%=&§]+\s*/i, '')
    .replace(/\bper\s*/i, '/ ')
    .replace(/\s+/g, ' ')
    .trim();
  const numFixed = clean.replace(/((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]+(?:[.,][0-9OIlSBZ]{1,2})?)/, (m) =>
    repairNumericOcr(m).replace(',', '.')
  );
  return numFixed.startsWith('₹') ? numFixed : `₹ ${numFixed}`;
}

function normalizeNetQtyLocal(text: string): string {
  const clean = (text || '')
    .replace(/(?:net\s*(?:qty|quantity|wt|weight|vol|volume)|total\s*net\s*mass|contains)\s*[:.\-]?\s*/i, '')
    .trim();
  const match = clean.match(
    /((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]+(?:\.[0-9OIlSBZ]+)?)\s*(kilograms?|kg|grams?|gms?|gm|g|millilitres?|milliliters?|ml|litres?|liters?|ltr|l|n|pcs|pieces|units|u)\b/i
  );
  if (!match) return clean;
  const val = parseFloat(repairNumericOcr(match[1]));
  if (!Number.isFinite(val)) return clean;
  const raw = (match[2] || '').toLowerCase();
  let unit = raw;
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(raw)) unit = 'g';
  else if (['kg', 'kilogram', 'kilograms'].includes(raw)) unit = 'kg';
  else if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'].includes(raw)) unit = 'ml';
  else if (['l', 'ltr', 'litre', 'litres', 'liter', 'liters'].includes(raw)) unit = 'L';
  else if (['n', 'pcs', 'pieces', 'units', 'u'].includes(raw)) unit = 'N';
  return `${val} ${unit}`;
}

function normalizeDateLocal(text: string): string {
  const clean = (text || '')
    .replace(/(?:mfg|pkd|mfd|packed|manufactured|imported|use\s*by|best\s*before|exp|expiry|dom)\s*(?:date|on|by)?\s*[:.-]?/i, '')
    .split('|')[0]
    .trim();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const iso = clean.match(/((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{4})[\/.\-]((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{1,2})/);
  if (iso) {
    const y = repairNumericOcr(iso[1]);
    const m = parseInt(repairNumericOcr(iso[2]), 10);
    return `${m >= 1 && m <= 12 ? months[m - 1] : `M${m}`}-${y}`;
  }
  const dmy = clean.match(/\b((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{1,2})[\/.\-]((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{1,2})[\/.\-]((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{2,4})\b/);
  if (dmy) {
    const m = parseInt(repairNumericOcr(dmy[2]), 10);
    const yRaw = repairNumericOcr(dmy[3]);
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${m >= 1 && m <= 12 ? months[m - 1] : `M${m}`}-${y}`;
  }
  const my = clean.match(/((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{1,2})[\/.\-]((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{2,4})/);
  if (my) {
    const m = parseInt(repairNumericOcr(my[1]), 10);
    const yRaw = repairNumericOcr(my[2]);
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${m >= 1 && m <= 12 ? months[m - 1] : `M${m}`}-${y}`;
  }
  const txt = clean.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\/.\-]+((?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{2,4})/i);
  if (txt) {
    const yRaw = repairNumericOcr(txt[2]);
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${txt[1].toUpperCase()}-${y}`;
  }
  return clean;
}

interface LineCandidate {
  panel: LocalOcrPanelResult;
  line: LocalOcrLine;
  lineIndex: number;
}

interface SpanCandidate {
  line: LocalOcrLine;
  spanText?: string;
}

function normalizeTokenForMatch(token?: string): string {
  return (token || '').toLowerCase().replace(/[^a-z0-9₹@.]/g, '');
}

function padAndClampBox(raw: ImageBoundingBox): {
  bbox: ImageBoundingBox;
  box_2d: [number, number, number, number];
} {
  // Micro-padding (0.35%) keeps CAD box cleanly framing glyphs without crowding ink
  const ymin = Math.max(0.2, Math.min(98.5, Math.round((raw.ymin - 0.35) * 10) / 10));
  const xmin = Math.max(0.2, Math.min(98.5, Math.round((raw.xmin - 0.35) * 10) / 10));
  const ymax = Math.max(ymin + 1.0, Math.min(99.8, Math.round((raw.ymax + 0.35) * 10) / 10));
  const xmax = Math.max(xmin + 1.2, Math.min(99.8, Math.round((raw.xmax + 0.35) * 10) / 10));
  return {
    bbox: { ymin, xmin, ymax, xmax },
    box_2d: [
      Math.round(ymin * 10),
      Math.round(xmin * 10),
      Math.round(ymax * 10),
      Math.round(xmax * 10),
    ],
  };
}

/**
 * Computes the tightest possible bounding box for a matched substring inside a LocalOcrLine,
 * using exact word boxes when available and proportional character-range slicing as fallback.
 */
function extractExactSpanBbox(line: LocalOcrLine, spanText?: string): ImageBoundingBox | undefined {
  if (!line?.bbox) return undefined;
  const full = (line.text || '').trim();
  const target = (spanText || '').trim();
  if (!target || !full || target.length >= full.length * 0.94) {
    return line.bbox;
  }

  // 1. Exact sequential word-token alignment against line.words
  if (line.words && line.words.length > 0) {
    const targetTokens = target
      .split(/\s+/)
      .map(normalizeTokenForMatch)
      .filter((t) => t.length > 0);

    if (targetTokens.length > 0) {
      const wordNorms = line.words.map((w) => normalizeTokenForMatch(w.text));
      let bestStart = -1;
      let bestEnd = -1;
      let bestScore = 0;
      let bestSpanLen = Infinity;

      for (let i = 0; i < wordNorms.length; i++) {
        const firstWn = wordNorms[i];
        const firstTn = targetTokens[0];
        const firstMatches =
          firstWn &&
          (firstWn === firstTn ||
            (firstWn.length >= 3 && firstTn.length >= 3 && (firstWn.includes(firstTn) || firstTn.includes(firstWn))));
        if (!firstMatches) {
          continue;
        }

        let ti = 0;
        let wi = i;
        let matchedScore = 0;
        let matchedCount = 0;
        let lastMatchedWord = i;
        let missedWords = 0;

        while (wi < wordNorms.length && ti < targetTokens.length) {
          const wn = wordNorms[wi];
          const tn = targetTokens[ti];
          if (!wn) {
            wi++;
            continue;
          }
          if (wn === tn) {
            matchedScore += 2;
            matchedCount++;
            lastMatchedWord = wi;
            ti++;
            wi++;
          } else if (wn.length >= 3 && tn.length >= 3 && (wn.includes(tn) || tn.includes(wn))) {
            matchedScore += 1;
            matchedCount++;
            lastMatchedWord = wi;
            ti++;
            wi++;
          } else if (missedWords < 1) {
            missedWords++;
            wi++;
          } else {
            break;
          }
        }

        const ratio = matchedScore / (targetTokens.length * 2);
        const spanLen = lastMatchedWord - i + 1;
        if (matchedCount > 0 && (ratio > bestScore || (ratio === bestScore && spanLen < bestSpanLen))) {
          bestScore = ratio;
          bestSpanLen = spanLen;
          bestStart = i;
          bestEnd = lastMatchedWord;
        }
      }

      if (bestStart !== -1 && bestEnd >= bestStart && bestScore >= 0.45) {
        const slice = line.words.slice(bestStart, bestEnd + 1).filter((w) => w?.bbox);
        if (slice.length > 0) {
          return {
            ymin: Math.min(...slice.map((w) => w.bbox.ymin)),
            xmin: Math.min(...slice.map((w) => w.bbox.xmin)),
            ymax: Math.max(...slice.map((w) => w.bbox.ymax)),
            xmax: Math.max(...slice.map((w) => w.bbox.xmax)),
          };
        }
      }
    }
  }

  // 2. Proportional horizontal character-offset interpolation across line.bbox
  const idx = (full || '').toLowerCase().indexOf((target || '').toLowerCase());
  if (idx !== -1 && full.length > 0) {
    const startRatio = Math.max(0, Math.min(0.95, idx / full.length));
    const endRatio = Math.max(startRatio + 0.04, Math.min(1, (idx + target.length) / full.length));
    const lineW = Math.max(1, line.bbox.xmax - line.bbox.xmin);
    return {
      ymin: line.bbox.ymin,
      xmin: line.bbox.xmin + startRatio * lineW,
      ymax: line.bbox.ymax,
      xmax: line.bbox.xmin + endRatio * lineW,
    };
  }

  return line.bbox;
}

function unionBbox(
  linesOrSpans: Array<LocalOcrLine | SpanCandidate>
): {
  bbox?: ImageBoundingBox;
  box_2d?: [number, number, number, number];
} {
  const boxes = linesOrSpans
    .map((item) => {
      if (!item) return undefined;
      if ('line' in item) {
        return extractExactSpanBbox(item.line, item.spanText);
      }
      return item.bbox;
    })
    .filter((b): b is ImageBoundingBox => Boolean(b));

  if (boxes.length === 0) return {};

  const raw: ImageBoundingBox = {
    ymin: Math.min(...boxes.map((b) => b.ymin)),
    xmin: Math.min(...boxes.map((b) => b.xmin)),
    ymax: Math.max(...boxes.map((b) => b.ymax)),
    xmax: Math.max(...boxes.map((b) => b.xmax)),
  };

  return padAndClampBox(raw);
}

function cleanSnippet(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Deterministic regex & structured Legal Metrology parser operating on local OCR results.
 * Never depends on Gemini API availability; preserves bounding boxes and flags low-confidence
 * or ambiguous values as UNCERTAIN for human review.
 */
export function extractDeclarationsFromOcrPanels(
  panels: LocalOcrPanelResult[],
  options: {
    minConfidence?: number;
    productHint?: string;
    brandHint?: string;
    barcodeHint?: string;
  } = {}
): ParsedDeclarationsOutput {
  const minConf = options.minConfidence ?? 0.7;
  const warnings: string[] = [];

  // Flatten lines across all panels while retaining image attribution
  const allLines: LineCandidate[] = [];
  for (const panel of panels) {
    if (panel.lines && panel.lines.length > 0) {
      panel.lines.forEach((line, idx) => {
        if (line.text.trim()) {
          allLines.push({ panel, line, lineIndex: idx });
        }
      });
    } else if (panel.text && panel.text.trim()) {
      // Fallback if only raw text lines exist (e.g., server-side text rescue)
      const splitLines = panel.text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
      splitLines.forEach((t, idx) => {
        const yStep = 90 / Math.max(1, splitLines.length);
        const ymin = Number((5 + idx * yStep).toFixed(1));
        const ymax = Number(Math.min(98, ymin + yStep * 0.85).toFixed(1));
        allLines.push({
          panel,
          lineIndex: idx,
          line: {
            text: t,
            confidence: panel.confidence || 0.75,
            bbox: { ymin, xmin: 5, ymax, xmax: 95 },
            box_2d: [Math.round(ymin * 10), 50, Math.round(ymax * 10), 950],
            words: [],
          },
        });
      });
    }
  }

  const declarations: ExtractedDeclaration[] = [];
  const usedFields = new Set<string>();
  let declCounter = 1;

  const pushDeclaration = (params: {
    field: string;
    label: string;
    original_text: string;
    normalized_value: string;
    confidence: number;
    panel: LocalOcrPanelResult;
    matchedLines: Array<LocalOcrLine | SpanCandidate>;
    forceUncertain?: boolean;
    notes?: string;
  }) => {
    const conf = Math.max(0, Math.min(1, Number(params.confidence.toFixed(3))));
    const isPoorQuality = params.panel.quality?.overall === 'POOR';
    const uncertain = Boolean(params.forceUncertain) || conf < minConf || isPoorQuality;
    const status: DeclarationStatus = uncertain ? 'UNCERTAIN' : 'FOUND';
    const coords = unionBbox(params.matchedLines);

    declarations.push({
      id: `ocr-decl-${declCounter++}`,
      field: params.field,
      label: params.label,
      original_text: cleanSnippet(params.original_text),
      normalized_value: cleanSnippet(params.normalized_value),
      found: true,
      status,
      confidence: conf,
      image_id: params.panel.image_id,
      image_type: params.panel.image_type as ImageType,
      bbox: coords.bbox,
      box_2d: coords.box_2d,
      notes:
        params.notes ||
        (uncertain
          ? `Local OCR confidence (${Math.round(conf * 100)}%) or readability requires manual verification.`
          : 'Extracted locally via Tesseract.js OCR + deterministic Legal Metrology parser.'),
    });
    usedFields.add(params.field);
  };

  const findBestMatch = (
    patterns: RegExp[],
    preferredPanels?: ImageType[],
    lineFilter?: (line: LocalOcrLine) => boolean
  ): { candidate: LineCandidate; match: RegExpMatchArray; nextLine?: LineCandidate } | null => {
    const ordered = preferredPanels
      ? [
          ...allLines.filter((c) => preferredPanels.includes(c.panel.image_type)),
          ...allLines.filter((c) => !preferredPanels.includes(c.panel.image_type)),
        ]
      : allLines;

    for (const pat of patterns) {
      for (let i = 0; i < ordered.length; i++) {
        const item = ordered[i];
        if (lineFilter && !lineFilter(item.line)) continue;
        const m = item.line.text.match(pat);
        if (m) {
          const nextInSamePanel = allLines.find(
            (c) => c.panel.image_id === item.panel.image_id && c.lineIndex === item.lineIndex + 1
          );
          return { candidate: item, match: m, nextLine: nextInSamePanel };
        }
      }
    }
    return null;
  };

  const findHeaderValueNeighbor = (
    headerPattern: RegExp,
    valuePattern: RegExp,
    preferredPanels?: ImageType[]
  ): { header: LineCandidate; headerMatch: RegExpMatchArray; value: LineCandidate; valueMatch: RegExpMatchArray } | null => {
    const ordered = preferredPanels
      ? [
          ...allLines.filter((c) => preferredPanels.includes(c.panel.image_type)),
          ...allLines.filter((c) => !preferredPanels.includes(c.panel.image_type)),
        ]
      : allLines;

    for (const h of ordered) {
      const headerMatch = h.line.text.match(headerPattern);
      if (!headerMatch) continue;
      const samePanelLines = allLines.filter((c) => c.panel.image_id === h.panel.image_id && c.lineIndex !== h.lineIndex);
      const hb = h.line.bbox;
      // 1. Check horizontally right-adjacent line on same row OR vertically next line below within 7.5% height
      const neighbors = samePanelLines
        .filter((n) => {
          const nb = n.line.bbox;
          if (!hb || !nb) return n.lineIndex === h.lineIndex + 1;
          const sameRow = Math.abs((hb.ymin + hb.ymax) / 2 - (nb.ymin + nb.ymax) / 2) < 3.5 && nb.xmin >= hb.xmax - 2;
          const belowLine =
            nb.ymin >= hb.ymin - 0.5 &&
            nb.ymin - hb.ymax < 7.5 &&
            Math.abs(nb.xmin - hb.xmin) < 22;
          return sameRow || belowLine;
        })
        .sort((a, b) => a.line.bbox.ymin - b.line.bbox.ymin || a.line.bbox.xmin - b.line.bbox.xmin);

      for (const n of neighbors) {
        const vm = n.line.text.match(valuePattern);
        if (vm) {
          return { header: h, headerMatch, value: n, valueMatch: vm };
        }
      }
    }
    return null;
  };

  // Safe numeric capture fragment requiring at least one real ASCII digit so words like "is"/"oil"/"list" never match
  const OCR_NUM = '(?=[0-9OIlSBZ]*\\d)[0-9OIlSBZ]+';
  const OCR_DEC = `${OCR_NUM}(?:[.,][0-9OIlSBZ]{1,2})?`;

  // 1. MRP (Maximum Retail Price — single-line, split-line, or OCR symbol misread)
  const mrpHit = findBestMatch(
    [
      new RegExp(
        `\\b(?:m\\.?\\s*r\\.?\\s*p\\.?|max\\.?\\s*retail\\s*price)\\s*(?:is\\b)?\\s*[:.\\-=]?\\s*(?:rs\\.?|inr|[₹$€£¥XFTRZE?*%=&§])?\\s*${OCR_NUM}(?:,[0-9OIlSBZ]{3})*(?:[.,][0-9OIlSBZ]{1,2})?(?:\\s*\\/-)?(?:\\s*\\(?\\s*incl\\.?[^|\\n]{0,35}tax(?:es|e)?\\s*\\)?)?`,
        'i'
      ),
      new RegExp(
        `(?:₹|\\brs\\.?|\\binr)\\s*${OCR_NUM}(?:,[0-9OIlSBZ]{3})*(?:[.,][0-9OIlSBZ]{1,2})?\\s*(?:\\/-)?\\s*(?:\\(?\\s*incl\\.?\\s*(?:of\\s*)?all\\s*tax(?:es|e)?\\)?|per\\s*pack)`,
        'i'
      ),
      new RegExp(
        `\\bprice\\b\\s*(?:is\\b\\s*|[:.\\-]\\s*|(?:rs\\.?|inr|₹)\\s*)(?:rs\\.?|inr|[₹$€£¥XFTRZE?*%=&§])?\\s*${OCR_DEC}`,
        'i'
      ),
    ],
    ['Back', 'Side', 'Front']
  );
  if (mrpHit) {
    const raw = mrpHit.match[0];
    const fixedDigits = repairNumericOcr(raw.replace(/[^\dOIlSBZ]/g, ''));
    const isPartial = !/\d+/.test(fixedDigits) || raw.includes('?') || raw.includes('*');
    pushDeclaration({
      field: 'mrp',
      label: 'Maximum Retail Price (MRP)',
      original_text: raw,
      normalized_value: normalizeMrpLocal(raw),
      confidence: isPartial ? Math.min(0.55, mrpHit.candidate.line.confidence) : mrpHit.candidate.line.confidence,
      panel: mrpHit.candidate.panel,
      matchedLines: [{ line: mrpHit.candidate.line, spanText: raw }],
      forceUncertain: isPartial,
    });
  } else {
    const mrpNeighbor = findHeaderValueNeighbor(
      /\b(?:m\.?\s*r\.?\s*p\.?|max\.?\s*retail\s*price)\b/i,
      /(?:rs\.?|inr|[₹$€£¥XFTRZE?*%=&§])?\s*\d+(?:[.,]\d{1,2})?(?:\s*\/-)?(?:\s*\(?\s*incl\.?[^|\n]{0,35}tax(?:es|e)?\s*\)?)?/i,
      ['Back', 'Side', 'Front']
    );
    if (mrpNeighbor && /\d+/.test(mrpNeighbor.valueMatch[0])) {
      const combinedMrp = `${mrpNeighbor.headerMatch[0].trim()} ${mrpNeighbor.valueMatch[0].trim()}`;
      pushDeclaration({
        field: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        original_text: combinedMrp,
        normalized_value: normalizeMrpLocal(mrpNeighbor.valueMatch[0]),
        confidence: (mrpNeighbor.header.line.confidence + mrpNeighbor.value.line.confidence) / 2,
        panel: mrpNeighbor.value.panel,
        matchedLines: [
          { line: mrpNeighbor.header.line, spanText: mrpNeighbor.headerMatch[0] },
          { line: mrpNeighbor.value.line, spanText: mrpNeighbor.valueMatch[0] },
        ],
      });
    }
  }

  // 2. Unit Sale Price (USP)
  const uspHit = findBestMatch(
    [
      new RegExp(
        `\\b(?:unit\\s*sale\\s*price|usp)\\s*[:.\\-=]?\\s*(?:rs\\.?|inr|[₹$€£¥XFTRZE?*%=&§])?\\s*${OCR_DEC}\\s*(?:\\/|per\\s*)\\s*(?:100\\s*g|100\\s*ml|kg|gm|g|ml|l|unit|pc)\\b`,
        'i'
      ),
      new RegExp(
        `(?:₹|\\brs\\.?|\\binr)\\s*${OCR_DEC}\\s*(?:\\/|per\\s*)\\s*(?:100\\s*g|100\\s*ml|g|gm|kg|ml|l)\\b`,
        'i'
      ),
    ],
    ['Back', 'Side', 'Front']
  );
  if (uspHit) {
    pushDeclaration({
      field: 'unit_sale_price',
      label: 'Unit Sale Price (USP)',
      original_text: uspHit.match[0],
      normalized_value: normalizeUspLocal(uspHit.match[0]),
      confidence: uspHit.candidate.line.confidence,
      panel: uspHit.candidate.panel,
      matchedLines: [{ line: uspHit.candidate.line, spanText: uspHit.match[0] }],
    });
  }

  // 3. Net Quantity (extract on Front and/or Back without spilling into Nutrition Facts or USP)
  const isNutritionOrUspLine = (txt: string) =>
    /\b(?:usp|unit\s*sale\s*price|per\s*100\s*[gm]|per\s*serve|serving\s*size|protein|carbohydrate|sugar|total\s*fat|saturated|trans\s*fat|cholesterol|sodium|dietary\s*fi[bp]re|energy|kcal|calories|vitamin|calcium|iron|potassium|rda)\b/i.test(
      txt
    ) || /\/\s*(?:g|gm|kg|ml|l)\b/i.test(txt);

  const qtyPatterns = [
    new RegExp(
      `\\b(?:net\\s*(?:qty|quantity|wt|weight|vol|volume)|total\\s*net\\s*mass|contains)\\s*[:.\\-]?\\s*~?\\s*((?=[0-9OIlSBZ]*\\d)[0-9OIlSBZ]+(?:\\.[0-9OIlSBZ]+)?)\\s*(?:kilograms?|kg|grams?|gms?|gm|g|millilitres?|milliliters?|ml|litres?|liters?|ltr|l|n|pcs|pieces|units|u)\\b(?:\\s*\\(\\s*when\\s*packed\\s*\\))?`,
      'i'
    ),
    /\b(\d+(?:\.\d+)?)\s*(?:kilograms?|kg|grams?|gms?|gm|g|millilitres?|milliliters?|ml|litres?|liters?|ltr|l)\b/i,
  ];
  const seenQtyPanels = new Set<string>();
  for (let pIdx = 0; pIdx < qtyPatterns.length; pIdx++) {
    const pat = qtyPatterns[pIdx];
    for (const item of allLines) {
      if (seenQtyPanels.has(item.panel.image_id)) continue;
      if (isNutritionOrUspLine(item.line.text)) continue;
      if (pIdx === 1) {
        if (item.line.confidence < 0.62) continue;
        if (/\b(?:best\s*before|shelf\s*life|pack\s*of|free|serving|serve|energy|kcal|approx|per\s*\d)\b/i.test(item.line.text)) {
          continue;
        }
      }
      const m = item.line.text.match(pat);
      if (m) {
        if (pIdx === 1 && m[1] && m[1].length === 1 && item.line.confidence < 0.78) {
          continue;
        }
        seenQtyPanels.add(item.panel.image_id);
        const approx = m[0].includes('~') || item.line.text.includes('~');
        pushDeclaration({
          field: 'net_quantity',
          label: 'Net Quantity',
          original_text: m[0],
          normalized_value: normalizeNetQtyLocal(m[0]),
          confidence: approx ? Math.min(0.58, item.line.confidence) : item.line.confidence,
          panel: item.panel,
          matchedLines: [{ line: item.line, spanText: m[0] }],
          forceUncertain: approx,
        });
      }
    }
  }
  if (seenQtyPanels.size === 0) {
    const qtyNeighbor = findHeaderValueNeighbor(
      /\b(?:net\s*(?:qty|quantity|wt|weight|vol|volume)|total\s*net\s*mass)\b/i,
      /\b\d+(?:\.\d+)?\s*(?:kilograms?|kg|grams?|gms?|gm|g|millilitres?|milliliters?|ml|litres?|liters?|ltr|l|n|pcs|pieces|units|u)\b/i,
      ['Front', 'Back', 'Side']
    );
    if (qtyNeighbor) {
      const combinedQty = `${qtyNeighbor.headerMatch[0].trim()} ${qtyNeighbor.valueMatch[0].trim()}`;
      pushDeclaration({
        field: 'net_quantity',
        label: 'Net Quantity',
        original_text: combinedQty,
        normalized_value: normalizeNetQtyLocal(qtyNeighbor.valueMatch[0]),
        confidence: (qtyNeighbor.header.line.confidence + qtyNeighbor.value.line.confidence) / 2,
        panel: qtyNeighbor.value.panel,
        matchedLines: [
          { line: qtyNeighbor.header.line, spanText: qtyNeighbor.headerMatch[0] },
          { line: qtyNeighbor.value.line, spanText: qtyNeighbor.valueMatch[0] },
        ],
      });
    }
  }

  // 4. Month & Year of Manufacture / Packing
  const mfgHit = findBestMatch(
    [
      new RegExp(
        `\\b(?:mfg\\.?|mfd\\.?|pkd\\.?|packed|date\\s*of\\s*(?:mfg|manufacture|packing|packaging)|pkg\\.?\\s*date|manufactured|dom)\\s*(?:date|on|by)?\\s*[:.\\-]?\\s*(?:(?:${OCR_NUM}[\\/.\\-])?${OCR_NUM}[\\/.\\-]${OCR_NUM}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\\s\\/.\\-]+${OCR_NUM}|${OCR_NUM}[\\/.\\-]${OCR_NUM})`,
        'i'
      ),
      new RegExp(`\\b(?:mfg\\.?|mfd\\.?|pkd\\.?|date\\s*of\\s*mfg)\\s*[:.\\-]?\\s*${OCR_NUM}\\b`, 'i'),
    ],
    ['Back', 'Side', 'Front']
  );
  if (mfgHit) {
    pushDeclaration({
      field: 'mfg_date',
      label: 'Month & Year of Manufacture / Packing',
      original_text: mfgHit.match[0],
      normalized_value: normalizeDateLocal(mfgHit.match[0]),
      confidence: mfgHit.candidate.line.confidence,
      panel: mfgHit.candidate.panel,
      matchedLines: [{ line: mfgHit.candidate.line, spanText: mfgHit.match[0] }],
    });
  } else {
    const mfgNeighbor = findHeaderValueNeighbor(
      /\b(?:mfg\.?|mfd\.?|pkd\.?|packed\s*(?:on|date)|date\s*of\s*(?:mfg|manufacture|packing|packaging)|dom)\b/i,
      /(?:(?:\d{1,2}[\/.\-])?\d{1,2}[\/.\-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\/.\-]+\d{2,4}|\d{4}[\/.\-]\d{1,2})/i,
      ['Back', 'Side', 'Front']
    );
    if (mfgNeighbor) {
      const combinedMfg = `${mfgNeighbor.headerMatch[0].trim()} ${mfgNeighbor.valueMatch[0].trim()}`;
      pushDeclaration({
        field: 'mfg_date',
        label: 'Month & Year of Manufacture / Packing',
        original_text: combinedMfg,
        normalized_value: normalizeDateLocal(mfgNeighbor.valueMatch[0]),
        confidence: (mfgNeighbor.header.line.confidence + mfgNeighbor.value.line.confidence) / 2,
        panel: mfgNeighbor.value.panel,
        matchedLines: [
          { line: mfgNeighbor.header.line, spanText: mfgNeighbor.headerMatch[0] },
          { line: mfgNeighbor.value.line, spanText: mfgNeighbor.valueMatch[0] },
        ],
      });
    }
  }

  // 5. Best Before / Use By / Expiry Date (strict word boundary so "Export" never matches "exp")
  const bestBeforeHit = findBestMatch(
    [
      /\b(?:best\s*before|shelf\s*life)\b\s*[:.\-]?\s*(?:within\s+)?(?:\d+|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|twelve|six|nine|three)[^|\n]*/i,
      /\b(?:use\s*by|exp\.?|expiry)\b\s*(?:date)?\s*(?:[:.\-]\s*[^|\n]+|\s+(?:\d+|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[^|\n]*)/i,
    ],
    ['Back', 'Side', 'Front']
  );
  if (bestBeforeHit) {
    const isUseBy = /\b(?:use\s*by|exp\.?|expiry)\b/i.test(bestBeforeHit.match[0]);
    pushDeclaration({
      field: isUseBy ? 'use_by' : 'best_before',
      label: isUseBy ? 'Use By / Expiry Date' : 'Best Before',
      original_text: bestBeforeHit.match[0],
      normalized_value: normalizeDateLocal(bestBeforeHit.match[0]),
      confidence: bestBeforeHit.candidate.line.confidence,
      panel: bestBeforeHit.candidate.panel,
      matchedLines: [{ line: bestBeforeHit.candidate.line, spanText: bestBeforeHit.match[0] }],
    });
  } else {
    const bbNeighbor = findHeaderValueNeighbor(
      /\b(?:best\s*before|use\s*by|exp\.?|expiry)\b/i,
      /(?:\d+\s*(?:months?|days?|years?)[^|\n]*|(?:\d{1,2}[\/.\-])?\d{1,2}[\/.\-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\/.\-]+\d{2,4})/i,
      ['Back', 'Side', 'Front']
    );
    if (bbNeighbor) {
      const combinedBb = `${bbNeighbor.headerMatch[0].trim()} ${bbNeighbor.valueMatch[0].trim()}`;
      const isUseBy = /\b(?:use\s*by|exp\.?|expiry)\b/i.test(bbNeighbor.headerMatch[0]);
      pushDeclaration({
        field: isUseBy ? 'use_by' : 'best_before',
        label: isUseBy ? 'Use By / Expiry Date' : 'Best Before',
        original_text: combinedBb,
        normalized_value: normalizeDateLocal(combinedBb),
        confidence: (bbNeighbor.header.line.confidence + bbNeighbor.value.line.confidence) / 2,
        panel: bbNeighbor.value.panel,
        matchedLines: [
          { line: bbNeighbor.header.line, spanText: bbNeighbor.headerMatch[0] },
          { line: bbNeighbor.value.line, spanText: bbNeighbor.valueMatch[0] },
        ],
      });
    }
  }

  // 6. Manufacturer / Packer / Importer + Address (spatial column alignment prevents cross-column giant boxes)
  const mfrHit = findBestMatch(
    [
      /\b(?:manufactured|mfd\.?|packed|pkd\.?|marketed|mktd\.?|imported)\s*(?:&|and)?\s*(?:packed\s*|pkd\.?\s*|marketed\s*|mktd\.?\s*)?by\s*[:.\-]?\s*.+/i,
      /\b(?:manufacturer|packer|importer)\b\s*[:.\-]\s*.+/i,
      /\b.+(?:pvt\.?\s*ltd\.?|private\s*limited|llp|industries|foods|limited)\b.*\b(?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{6}\b/i,
    ],
    ['Back', 'Side']
  );
  if (mfrHit) {
    const anchorLine = mfrHit.candidate.line;
    const matchedLines: SpanCandidate[] = [{ line: anchorLine, spanText: mfrHit.match[0] }];
    let combined = anchorLine.text.trim();
    // Append up to 3 spatially aligned same-column continuation lines if PIN code isn't on the first line
    if (!/\b\d{6}\b/.test(combined)) {
      const anchorB = anchorLine.bbox;
      const samePanelOthers = allLines
        .filter((c) => c.panel.image_id === mfrHit.candidate.panel.image_id && c.lineIndex !== mfrHit.candidate.lineIndex)
        .filter((c) => {
          const cb = c.line.bbox;
          if (!anchorB || !cb) return c.lineIndex > mfrHit.candidate.lineIndex;
          if (cb.ymin < anchorB.ymin - 1.0) return false;
          const anchorW = Math.max(1, anchorB.xmax - anchorB.xmin);
          const candW = Math.max(1, cb.xmax - cb.xmin);
          const overlapX = Math.min(anchorB.xmax, cb.xmax) - Math.max(anchorB.xmin, cb.xmin);
          const sameColumn = Math.abs(cb.xmin - anchorB.xmin) <= 18 || overlapX > Math.min(anchorW, candW) * 0.3;
          return sameColumn;
        })
        .sort((a, b) => (a.line.bbox?.ymin ?? a.lineIndex) - (b.line.bbox?.ymin ?? b.lineIndex));

      let prevBottom = anchorB?.ymax ?? 0;
      for (const cand of samePanelOthers) {
        if (matchedLines.length >= 4) break;
        const nextLineText = cand.line.text.trim();
        const nextAlnum = nextLineText.replace(/[^a-zA-Z0-9]/g, '');
        if (nextAlnum.length < 3 || cand.line.confidence < 0.42) continue;
        if (cand.line.bbox && anchorB && cand.line.bbox.ymin - prevBottom > 5.5) break;
        if (
          /^(?:date|mfg|mfd|pkd|mrp|usp|best\s*before|use\s*by|exp|country|consumer|customer|toll|helpline|email|batch|lot|net|fssai|ingredients|nutritional|nutrition|barcode|allergen|storage|energy|protein|carbohydrate|sugar|total\s*fat)/i.test(
            nextLineText
          )
        ) {
          break;
        }
        combined = `${combined.replace(/,\s*$/, '')}, ${nextLineText}`;
        matchedLines.push({ line: cand.line });
        if (cand.line.bbox) prevBottom = cand.line.bbox.ymax;
        if (/\b\d{6}\b/.test(nextLineText)) break;
      }
    }
    const cleanCombined = combined.replace(/,\s*,+/g, ', ').replace(/\s+,/g, ',');
    const avgLineConf = matchedLines.reduce((s, item) => s + item.line.confidence, 0) / matchedLines.length;
    const isImporter = /^importer|imported\s*by/i.test(cleanCombined);
    const isPacker = /^packer|packed\s*by/i.test(cleanCombined) && !/mfd|manufactured/i.test(cleanCombined);
    pushDeclaration({
      field: isImporter ? 'importer_name' : isPacker ? 'packer_name' : 'manufacturer_name',
      label: isImporter
        ? 'Importer Name & Address'
        : isPacker
        ? 'Packer Name & Address'
        : 'Manufacturer Name & Address',
      original_text: cleanCombined,
      normalized_value: cleanCombined.replace(
        /^(?:manufactured|mfd\.?|packed|pkd\.?|marketed|mktd\.?|imported)\s*(?:&|and)?\s*(?:packed\s*|pkd\.?\s*|marketed\s*|mktd\.?\s*)?by\s*[:.\-]?\s*/i,
        ''
      ),
      confidence: avgLineConf,
      panel: mfrHit.candidate.panel,
      matchedLines,
    });
  }

  // 7. Consumer Care Phone, Email & Grievance Block
  const phoneHit = findBestMatch(
    [
      /\b(?:toll\s*free|helpline|tel|phone|ph|customer\s*care|consumer\s*care|call)\s*[:.\-]?\s*(?:\+91[\s\-]?)?(?:(?:1800|1860)[\s\-]?(?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{2,4}[\s\-]?(?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{3,5}(?:[\s\-]?(?=[0-9OIlSBZ]*\d)[0-9OIlSBZ]{3,4})?|\d{3,5}[\s\-]?\d{6,8}|\d{10})/i,
      /\b(?:\+91[\s\-]?)?(?:(?:1800|1860)[\s\-]?\d{2,4}[\s\-]?\d{3,5}(?:[\s\-]?\d{3,4})?)\b/i,
    ],
    ['Back', 'Side']
  );
  if (phoneHit) {
    const rawPhone = phoneHit.match[0];
    const masked = rawPhone.includes('*');
    const normalizedPhone = repairNumericOcr(
      rawPhone.replace(/^(?:toll\s*free|helpline|tel|phone|ph|customer\s*care|consumer\s*care|call)\s*[:.\-]?\s*/i, '')
    ).replace(/[^\d+\-]/g, '');
    pushDeclaration({
      field: 'consumer_care_phone',
      label: 'Consumer Care Telephone',
      original_text: rawPhone,
      normalized_value: normalizedPhone,
      confidence: masked ? 0.45 : phoneHit.candidate.line.confidence,
      panel: phoneHit.candidate.panel,
      matchedLines: [{ line: phoneHit.candidate.line, spanText: rawPhone }],
      forceUncertain: masked,
    });
  }

  const emailHit = findBestMatch(
    [/[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+[.,][a-zA-Z]{2,}/i],
    ['Back', 'Side']
  );
  if (emailHit) {
    pushDeclaration({
      field: 'consumer_care_email',
      label: 'Consumer Care Email',
      original_text: emailHit.match[0],
      normalized_value: normalizeEmailOcr(emailHit.match[0]),
      confidence: emailHit.candidate.line.confidence,
      panel: emailHit.candidate.panel,
      matchedLines: [{ line: emailHit.candidate.line, spanText: emailHit.match[0] }],
    });
  }

  const ccHit = findBestMatch(
    [/\b(?:consumer\s*(?:care|grievance)|customer\s*(?:care|support)|in\s*case\s*of\s*complaints?)\s*(?:cell|officer|details)?\s*[:.\-]?\s*.*/i],
    ['Back', 'Side']
  );
  if (ccHit || phoneHit || emailHit) {
    const anchor = ccHit || phoneHit || emailHit!;
    const ccSpans: SpanCandidate[] = [{ line: anchor.candidate.line, spanText: anchor.match[0] }];
    let combinedCc = anchor.candidate.line.text;
    const isSpatiallyNear = (a: LocalOcrLine, b: LocalOcrLine) => {
      if (!a.bbox || !b.bbox) return true;
      const ay = (a.bbox.ymin + a.bbox.ymax) / 2;
      const by = (b.bbox.ymin + b.bbox.ymax) / 2;
      const overlapX = Math.min(a.bbox.xmax, b.bbox.xmax) - Math.max(a.bbox.xmin, b.bbox.xmin);
      return Math.abs(ay - by) <= 18 && (overlapX > -8 || Math.abs(a.bbox.xmin - b.bbox.xmin) <= 28);
    };

    if (phoneHit && phoneHit.candidate.line.text !== anchor.candidate.line.text) {
      combinedCc += ` | ${phoneHit.candidate.line.text}`;
      if (
        phoneHit.candidate.panel.image_id === anchor.candidate.panel.image_id &&
        isSpatiallyNear(anchor.candidate.line, phoneHit.candidate.line)
      ) {
        ccSpans.push({ line: phoneHit.candidate.line, spanText: phoneHit.match[0] });
      }
    }
    if (emailHit && emailHit.candidate.line.text !== anchor.candidate.line.text && !combinedCc.includes(emailHit.match[0])) {
      combinedCc += ` | ${emailHit.match[0]}`;
      if (
        emailHit.candidate.panel.image_id === anchor.candidate.panel.image_id &&
        isSpatiallyNear(anchor.candidate.line, emailHit.candidate.line)
      ) {
        ccSpans.push({ line: emailHit.candidate.line, spanText: emailHit.match[0] });
      }
    }
    const masked = combinedCc.includes('*');
    pushDeclaration({
      field: 'consumer_care',
      label: 'Consumer Care Details',
      original_text: combinedCc,
      normalized_value: combinedCc,
      confidence: masked ? 0.48 : anchor.candidate.line.confidence,
      panel: anchor.candidate.panel,
      matchedLines: ccSpans,
      forceUncertain: masked,
    });
  }

  // 8. Country of Origin (strict boundary so "Original" never matches "origin")
  const cooHit = findBestMatch(
    [
      /\b(?:country\s*of\s*origin|made\s*in|product\s*of|produce\s*of)\b\s*[:.\-]?\s*([A-Za-z][A-Za-z\s]{1,24})/i,
      /\borigin\b\s*[:.\-]\s*([A-Za-z][A-Za-z\s]{1,24})/i,
    ],
    ['Back', 'Side', 'Front'],
    (line) => !/\bmade\s+in\s+(?:small|india'?s\s+finest|our)\b/i.test(line.text)
  );
  if (cooHit) {
    const rawCountry = (cooHit.match[1] || cooHit.match[0])
      .split(/[|.,;()]/)[0]
      .replace(/[^A-Za-z\s]/g, '')
      .trim();
    if (rawCountry.length >= 3 && !/^(?:batches|original|quality)$/i.test(rawCountry)) {
      pushDeclaration({
        field: 'country_of_origin',
        label: 'Country of Origin',
        original_text: cooHit.match[0],
        normalized_value: rawCountry,
        confidence: cooHit.candidate.line.confidence,
        panel: cooHit.candidate.panel,
        matchedLines: [{ line: cooHit.candidate.line, spanText: cooHit.match[0] }],
      });
    }
  }

  // 9. Batch / Lot Number (prevent matching prose like "lots of fibre")
  const batchHit = findBestMatch(
    [
      /\b(?:batch|lot|b\.?\s*no\.?|l\.?\s*no\.?)\b\s*(?:code|no\.?|number|#)?\s*[:.\-]\s*([A-Z0-9][A-Z0-9\-\/]{1,20})/i,
      /\b(?:batch|lot|b\.?\s*no\.?|l\.?\s*no\.?)\b\s*(?:code|no\.?|number|#)\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/]{1,20})/i,
      /\b(?:batch|lot)\b\s+(?!of\b)([A-Z0-9]*\d[A-Z0-9\-\/]{1,18})/i,
    ],
    ['Back', 'Side', 'Front']
  );
  if (batchHit) {
    const code = (batchHit.match[1] || '').toUpperCase();
    if (code && code !== 'OF') {
      pushDeclaration({
        field: 'batch_number',
        label: 'Batch / Lot Number',
        original_text: batchHit.match[0],
        normalized_value: code,
        confidence: batchHit.candidate.line.confidence,
        panel: batchHit.candidate.panel,
        matchedLines: [{ line: batchHit.candidate.line, spanText: batchHit.match[0] }],
      });
    }
  } else {
    const batchNeighbor = findHeaderValueNeighbor(
      /\b(?:batch\s*(?:no|code)|lot\s*(?:no|code)|b\.?\s*no\.?|l\.?\s*no\.?)\b/i,
      /\b([A-Z0-9]*\d[A-Z0-9\-\/]{1,18})\b/i,
      ['Back', 'Side', 'Front']
    );
    if (batchNeighbor) {
      pushDeclaration({
        field: 'batch_number',
        label: 'Batch / Lot Number',
        original_text: `${batchNeighbor.headerMatch[0].trim()} ${batchNeighbor.valueMatch[1]}`,
        normalized_value: batchNeighbor.valueMatch[1].toUpperCase(),
        confidence: (batchNeighbor.header.line.confidence + batchNeighbor.value.line.confidence) / 2,
        panel: batchNeighbor.value.panel,
        matchedLines: [
          { line: batchNeighbor.header.line, spanText: batchNeighbor.headerMatch[0] },
          { line: batchNeighbor.value.line, spanText: batchNeighbor.valueMatch[1] },
        ],
      });
    }
  }

  // 10. Barcode / GTIN (explicit label or Indian GS1 890-prefix first; exclude FSSAI/helpline lines)
  const isNonBarcodeLine = (line: LocalOcrLine) =>
    !/\b(?:fssai|lic\.?|license|helpline|toll|phone|tel|gst|cin)\b/i.test(line.text);

  const barcodeHit =
    findBestMatch(
      [new RegExp(`\\b(?:barcode|gtin|ean|itf[\\-\\s]*14)\\s*[:.\\-]?\\s*((?=[0-9OIlSBZ]*\\d)[0-9OIlSBZ]{8}|(?=[0-9OIlSBZ]*\\d)[0-9OIlSBZ]{12,14})\\b`, 'i')],
      ['Back', 'Side', 'Front']
    ) ||
    findBestMatch(
      [/\b(890\d{10})\b/, /\b(\d{12,14})\b/],
      ['Back', 'Side', 'Front'],
      isNonBarcodeLine
    );

  if (barcodeHit) {
    pushDeclaration({
      field: 'barcode',
      label: 'Barcode / GTIN',
      original_text: barcodeHit.match[0],
      normalized_value: repairNumericOcr(barcodeHit.match[1]),
      confidence: barcodeHit.candidate.line.confidence,
      panel: barcodeHit.candidate.panel,
      matchedLines: [{ line: barcodeHit.candidate.line, spanText: barcodeHit.match[0] }],
    });
  } else if (options.barcodeHint && /^\d{8,14}$/.test(options.barcodeHint.trim())) {
    const fallbackPanel = panels[panels.length - 1] || panels[0];
    if (fallbackPanel) {
      pushDeclaration({
        field: 'barcode',
        label: 'Barcode / GTIN',
        original_text: options.barcodeHint.trim(),
        normalized_value: options.barcodeHint.trim(),
        confidence: 0.8,
        panel: fallbackPanel,
        matchedLines: [],
        notes: 'Matched from inspection GTIN metadata.',
      });
    }
  }

  // 11. FSSAI License (helpful cross-regime context, with OCR digit repair on 14-char Lic No.)
  const fssaiHit = findBestMatch(
    [new RegExp(`\\bfssai\\s*(?:lic\\.?|license)?\\s*(?:no\\.?)?\\s*[:.\\-]?\\s*((?=[0-9OIlSBZ]*\\d)[0-9OIlSBZ]{14})\\b`, 'i')],
    ['Back', 'Side', 'Front']
  );
  if (fssaiHit) {
    pushDeclaration({
      field: 'fssai_license',
      label: 'FSSAI License Number',
      original_text: fssaiHit.match[0],
      normalized_value: repairNumericOcr(fssaiHit.match[1]),
      confidence: fssaiHit.candidate.line.confidence,
      panel: fssaiHit.candidate.panel,
      matchedLines: [{ line: fssaiHit.candidate.line, spanText: fssaiHit.match[0] }],
    });
  } else {
    const fssaiNeighbor = findHeaderValueNeighbor(
      /\bfssai\b/i,
      /\b(\d{14})\b/,
      ['Back', 'Side', 'Front']
    );
    if (fssaiNeighbor) {
      pushDeclaration({
        field: 'fssai_license',
        label: 'FSSAI License Number',
        original_text: `${fssaiNeighbor.headerMatch[0].trim()} ${fssaiNeighbor.valueMatch[1]}`,
        normalized_value: repairNumericOcr(fssaiNeighbor.valueMatch[1]),
        confidence: (fssaiNeighbor.header.line.confidence + fssaiNeighbor.value.line.confidence) / 2,
        panel: fssaiNeighbor.value.panel,
        matchedLines: [
          { line: fssaiNeighbor.header.line, spanText: fssaiNeighbor.headerMatch[0] },
          { line: fssaiNeighbor.value.line, spanText: fssaiNeighbor.valueMatch[1] },
        ],
      });
    }
  }

  // 12. Product Name & Brand inference (strictly excludes Back-panel Nutrition/Statutory prose and crimp noise)
  const isGenericHint = (val?: string) =>
    !val ||
    /^(?:packaged\s*commodity|scanned\s*packaged\s*commodity|captured\s*commodity|unspecified\s*brand|unknown|n\/a)$/i.test(
      val.trim()
    );

  const frontPanel = panels.find((p) => p.image_type === 'Front') || panels[0];
  const isStatutoryHeaderLine = (txt: string) =>
    /^(?:net\s*(?:wt|weight|qty|quantity|vol|volume)|total\s*net|mrp|m\.?r\.?p|max\.?\s*retail|usp|unit\s*sale|mfd|mfg|pkd|packed|manufactured|marketed|imported|best\s*before|use\s*by|exp|batch|lot|b\.?\s*no|country\s*of\s*origin|fssai|toll\s*free|helpline|consumer|customer|email|ingredients|nutritional|nutrition\s*facts|100%\s*veg|\d{8,14}$)/i.test(
      txt.trim()
    );

  const isNonTitleLine = (txt: string) => {
    const t = (txt || '').trim();
    if (isStatutoryHeaderLine(t) || isNutritionOrUspLine(t)) return true;
    if (
      /\b(?:ingredients|allergen|contains\s+(?:wheat|milk|soy|nuts|gluten)|storage|store\s+in|cool\s+and\s+dry|keep\s+away|do\s+not|proprietary\s+food|vegetarian|non-veg|kcal|per\s*serve|serving\s*size|www\.|\.com|\.in|@|road|street|dist\.|industrial|plot\s*no)\b/i.test(
        t
      )
    ) {
      return true;
    }
    if (/\b\d{6}\b/.test(t)) return true;
    const digits = (t.match(/\d/g) || []).length;
    const letters = (t.match(/[a-zA-Z]/g) || []).length;
    if (letters < 3 || digits > letters) return true;
    if (t.split(/\s+/).length > 7) return true;
    return false;
  };

  const isLikelyCrimpOrNoise = (c: LineCandidate) => {
    const txt = (c.line.text || '').trim();
    if (txt.length <= 2 && c.line.confidence < 0.85) return true;
    if (txt.length <= 3 && c.line.confidence < 0.72) return true;
    if (c.line.confidence < 0.50) return true;
    const b = c.line.bbox;
    if (b && txt.length <= 5 && (b.xmin > 85 || b.xmax < 12) && c.line.confidence < 0.85) return true;
    return false;
  };

  const frontPanelLines = frontPanel
    ? allLines.filter((c) => c.panel.image_id === frontPanel.image_id)
    : [];
  const frontPanelHasDenseBackContent =
    frontPanel?.image_type === 'Back' ||
    frontPanelLines.filter((c) => isStatutoryHeaderLine(c.line.text) || isNutritionOrUspLine(c.line.text)).length >= 3;

  const hasCommodityNoun = (txt: string) =>
    /\b(?:biscuits?|cookies?|wafers?|crackers?|rusk|bread|cakes?|chips|crisps|namkeen|snacks?|noodles?|pasta|macaroni|vermicelli|chocolates?|cand(?:y|ies)|sweets?|cereals?|oats|muesli|flakes|flour|atta|maida|besan|rice|dal|pulses?|oil|ghee|butter|cheese|paneer|milk|curd|yogurt|juices?|drinks?|beverages?|tea|coffee|water|soda|squash|syrup|ketchup|sauce|jam|honey|pickles?|spices?|masala|powder|paste|soap|shampoo|conditioner|lotion|cream|gel|serum|wash|detergent|cleaner|sanitiz(?:er|ing)|toothpaste|brush|diapers?|wipes?|tablets?|capsules?)\b/i.test(
      (txt || '').trim()
    );

  const isVariantBadgeOnly = (txt: string) =>
    /^(?:original|classic|regular|fresh|new|rich|special|pure|natural|hi-?fibre|high\s*fibre|digestive|chocolatey?|choco|vanilla|strawberry|butter|salted|masala|spicy|hot|sweet|crispy|crunchy|tasty|yummy|family\s*pack|value\s*pack|saver\s*pack|super\s*saver|more\s*pack|\d+%?\s*extra)$/i.test(
      (txt || '').trim()
    );

  const prodHit = findBestMatch(
    [/\b(?:product|commodity(?:\s*name)?|name\s*of\s*commodity)\s*[:.\-]\s*(.+)/i],
    ['Front', 'Back']
  );
  let inferredProductName = !isGenericHint(options.productHint) ? options.productHint!.trim() : undefined;

  if (prodHit) {
    const val = (prodHit.match[1] || '').trim();
    inferredProductName = val;
    pushDeclaration({
      field: 'product_name',
      label: 'Generic / Common Product Name',
      original_text: prodHit.candidate.line.text,
      normalized_value: val,
      confidence: prodHit.candidate.line.confidence,
      panel: prodHit.candidate.panel,
      matchedLines: [{ line: prodHit.candidate.line, spanText: prodHit.match[0] }],
    });
  } else if (frontPanel) {
    const frontCandidates = frontPanelHasDenseBackContent
      ? []
      : frontPanelLines.filter(
          (c) =>
            (c.line.text || '').trim().length >= 3 &&
            /[a-zA-Z]{3,}/.test(c.line.text || '') &&
            !isNonTitleLine(c.line.text || '') &&
            !isLikelyCrimpOrNoise(c)
        );

    // Score front PDP title/commodity candidates: generic commodity nouns boost priority, single-word variant badges yield
    const prominenceScore = (c: LineCandidate) => {
      const txt = (c.line.text || '').trim();
      const b = c.line.bbox;
      const height = b ? Math.max(1, b.ymax - b.ymin) : 4;
      const words = txt.split(/\s+/).length;
      const inCenter = b && b.xmin >= 8 && b.xmax <= 92 ? 1.15 : 0.8;
      const commodityBoost = hasCommodityNoun(txt) ? 1.65 : 1.0;
      const variantPenalty = isVariantBadgeOnly(txt) ? 0.52 : 1.0;
      return height * (0.4 + c.line.confidence) * inCenter * (words <= 4 ? 1.1 : 0.9) * commodityBoost * variantPenalty;
    };

    const areVerticallyStacked = (top: LocalOcrLine, bottom?: LocalOcrLine) => {
      if (!bottom) return false;
      if (!top.bbox || !bottom.bbox) return true;
      const horizAligned =
        Math.abs(top.bbox.xmin - bottom.bbox.xmin) < 22 ||
        Math.min(top.bbox.xmax, bottom.bbox.xmax) - Math.max(top.bbox.xmin, bottom.bbox.xmin) > 5;
      const vertGap = bottom.bbox.ymin - top.bbox.ymax;
      return horizAligned && vertGap >= -3 && vertGap < 14;
    };

    if (frontCandidates.length >= 2) {
      // Pick the most visually prominent PDP candidate as primary product line, plus tight stacked pair if present
      const ranked = [...frontCandidates].sort((a, b) => prominenceScore(b) - prominenceScore(a));
      const anchor = ranked[0];
      const anchorIdx = frontCandidates.findIndex((c) => c.lineIndex === anchor.lineIndex);
      const nextCand = anchorIdx >= 0 ? frontCandidates[anchorIdx + 1] : undefined;
      const prevCand = anchorIdx > 0 ? frontCandidates[anchorIdx - 1] : undefined;

      let titleLines: LocalOcrLine[] = [anchor.line];
      if (nextCand && areVerticallyStacked(anchor.line, nextCand.line) && !isVariantBadgeOnly(nextCand.line.text || '')) {
        const hRatio =
          anchor.line.bbox && nextCand.line.bbox
            ? (nextCand.line.bbox.ymax - nextCand.line.bbox.ymin) /
              Math.max(1, anchor.line.bbox.ymax - anchor.line.bbox.ymin)
            : 1;
        if (hRatio >= 0.45 && hRatio <= 2.2) {
          titleLines = [anchor.line, nextCand.line];
        }
      } else if (
        prevCand &&
        areVerticallyStacked(prevCand.line, anchor.line) &&
        frontCandidates.length === 2 &&
        !isVariantBadgeOnly(prevCand.line.text || '')
      ) {
        const hRatio =
          prevCand.line.bbox && anchor.line.bbox
            ? (prevCand.line.bbox.ymax - prevCand.line.bbox.ymin) /
              Math.max(1, anchor.line.bbox.ymax - anchor.line.bbox.ymin)
            : 1;
        if (hRatio >= 0.5) {
          titleLines = [prevCand.line, anchor.line];
        }
      }

      const combinedTitle = titleLines.map((l) => (l.text || '').trim()).join(' ');
      inferredProductName = inferredProductName || combinedTitle;
      const avgTitleConf = titleLines.reduce((s, l) => s + l.confidence, 0) / titleLines.length;
      pushDeclaration({
        field: 'product_name',
        label: 'Generic / Common Product Name',
        original_text: combinedTitle,
        normalized_value: combinedTitle,
        confidence: avgTitleConf,
        panel: frontPanel,
        matchedLines: titleLines,
      });
    } else if (frontCandidates[0]) {
      const prominentLine = frontCandidates[0].line;
      inferredProductName = inferredProductName || prominentLine.text;
      pushDeclaration({
        field: 'product_name',
        label: 'Generic / Common Product Name',
        original_text: prominentLine.text,
        normalized_value: prominentLine.text,
        confidence: prominentLine.confidence,
        panel: frontPanel,
        matchedLines: [prominentLine],
      });
    } else if (inferredProductName) {
      pushDeclaration({
        field: 'product_name',
        label: 'Generic / Common Product Name',
        original_text: inferredProductName,
        normalized_value: inferredProductName,
        confidence: 0.78,
        panel: frontPanel,
        matchedLines: [],
        notes: 'Captured from inspection metadata because front label text was not clearly segmented.',
      });
    }
  }

  const brandHit = findBestMatch(
    [/\bbrand\s*(?:name)?\s*[:.\-]\s*([A-Za-z0-9&\s'.-]{2,40})/i],
    ['Front', 'Back']
  );
  let inferredBrand = !isGenericHint(options.brandHint) ? options.brandHint!.trim() : undefined;

  const isValidBrandCandidate = (c: LineCandidate) => {
    const txt = (c.line.text || '').trim();
    if (txt.length < 3 || !/[a-zA-Z]{3,}/.test(txt)) return false;
    if (isNonTitleLine(txt) || isLikelyCrimpOrNoise(c) || isVariantBadgeOnly(txt)) return false;
    if (inferredProductName) {
      const prodLower = inferredProductName.toLowerCase();
      const txtLower = txt.toLowerCase();
      if (txtLower === prodLower || prodLower.includes(txtLower) || txtLower.includes(prodLower)) return false;
    }
    const words = txt.split(/\s+/);
    // Reject clipped all-lowercase OCR fragments (e.g., "latey" from "Chocolatey") unless high-conf multi-word
    const hasUpper = /[A-Z]/.test(txt);
    if (!hasUpper && (words.length === 1 || txt.length < 6 || c.line.confidence < 0.88)) {
      return false;
    }
    if (words.length === 1 && txt.length === 3 && !/^[A-Z]{3}$/.test(txt)) {
      return false;
    }
    const bh = c.line.bbox ? c.line.bbox.ymax - c.line.bbox.ymin : 4;
    if (bh < 1.6 && c.line.confidence < 0.82) return false;
    return true;
  };

  if (brandHit) {
    inferredBrand = (brandHit.match[1] || '').split('|')[0].trim();
    pushDeclaration({
      field: 'brand_name',
      label: 'Brand Name / Trademark',
      original_text: brandHit.candidate.line.text,
      normalized_value: inferredBrand,
      confidence: brandHit.candidate.line.confidence,
      panel: brandHit.candidate.panel,
      matchedLines: [{ line: brandHit.candidate.line, spanText: brandHit.match[0] }],
    });
  } else if (frontPanel && !frontPanelHasDenseBackContent) {
    const brandCandidates = frontPanelLines.filter(isValidBrandCandidate);
    const rankedBrands = [...brandCandidates].sort((a, b) => {
      const scoreBrand = (c: LineCandidate) => {
        const txt = (c.line.text || '').trim();
        const b = c.line.bbox;
        const height = b ? Math.max(1, b.ymax - b.ymin) : 3;
        const isAllCaps = /^[A-Z0-9&'.\-\s]{3,}$/.test(txt) ? 1.3 : /^[A-Z]/.test(txt) ? 1.15 : 0.75;
        const inCenter = b && b.xmin >= 8 && b.xmax <= 92 ? 1.15 : 0.85;
        const matchesHint =
          inferredBrand && txt.toLowerCase().includes(inferredBrand.toLowerCase()) ? 2.0 : 1.0;
        return height * (0.4 + c.line.confidence) * isAllCaps * inCenter * matchesHint;
      };
      return scoreBrand(b) - scoreBrand(a);
    });

    const bestBrand = rankedBrands[0];
    const hintMatchesBest =
      !inferredBrand ||
      (bestBrand &&
        ((bestBrand.line.text || '').toLowerCase().includes(inferredBrand.toLowerCase()) ||
          inferredBrand.toLowerCase().includes((bestBrand.line.text || '').toLowerCase())));

    if (bestBrand && hintMatchesBest) {
      inferredBrand = inferredBrand || (bestBrand.line.text || '').trim();
      pushDeclaration({
        field: 'brand_name',
        label: 'Brand Name / Trademark',
        original_text: bestBrand.line.text,
        normalized_value: (bestBrand.line.text || '').trim(),
        confidence: bestBrand.line.confidence,
        panel: frontPanel,
        matchedLines: [bestBrand.line],
      });
    } else if (inferredBrand) {
      pushDeclaration({
        field: 'brand_name',
        label: 'Brand Name / Trademark',
        original_text: inferredBrand,
        normalized_value: inferredBrand,
        confidence: 0.78,
        panel: frontPanel,
        matchedLines: [],
        notes: 'Captured from inspection metadata because stylized brand artwork was not recognized locally.',
      });
    } else if (bestBrand) {
      inferredBrand = (bestBrand.line.text || '').trim();
      pushDeclaration({
        field: 'brand_name',
        label: 'Brand Name / Trademark',
        original_text: bestBrand.line.text,
        normalized_value: inferredBrand,
        confidence: bestBrand.line.confidence,
        panel: frontPanel,
        matchedLines: [bestBrand.line],
      });
    }
  } else if (frontPanel && inferredBrand) {
    pushDeclaration({
      field: 'brand_name',
      label: 'Brand Name / Trademark',
      original_text: inferredBrand,
      normalized_value: inferredBrand,
      confidence: 0.78,
      panel: frontPanel,
      matchedLines: [],
      notes: 'Captured from inspection metadata.',
    });
  }

  const totalTextChars = panels.reduce((sum, p) => sum + (p.text || '').replace(/\s+/g, '').length, 0);
  const avgConfidence =
    panels.length > 0
      ? Number((panels.reduce((s, p) => s + (p.confidence || 0), 0) / panels.length).toFixed(3))
      : 0;

  const hasPoorImage = panels.some((p) => p.quality?.overall === 'POOR');
  const lowConfidenceDetected =
    hasPoorImage ||
    avgConfidence < minConf ||
    declarations.some((d) => d.status === 'UNCERTAIN') ||
    totalTextChars < 20;

  if (totalTextChars < 20) {
    warnings.push(
      'Local OCR extracted very limited readable text. Image clarity or framing may require manual officer inspection.'
    );
  } else if (lowConfidenceDetected) {
    warnings.push(
      'One or more OCR declarations fell below the automated confidence threshold and were flagged UNCERTAIN for manual verification.'
    );
  }

  return {
    declarations,
    inferredProduct: {
      name: inferredProductName,
      brand: inferredBrand,
    },
    avgConfidence,
    lowConfidenceDetected,
    warnings,
  };
}
