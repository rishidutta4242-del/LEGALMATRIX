import { createWorker, PSM, Worker } from 'tesseract.js';
import {
  ImageBoundingBox,
  InspectionImage,
  LocalOcrLine,
  LocalOcrPanelResult,
  LocalOcrWord,
} from '../types/index';
import { computeSha256Hex, preprocessImageInBrowser } from './imagePreprocessor';

export interface TesseractRunOptions {
  language?: string; // e.g. 'eng', extendable to 'eng+hin'
  signal?: AbortSignal;
  onProgress?: (progressPct: number, statusLabel: string) => void;
}

const DEFAULT_OCR_LANG = 'eng';

// Bump cache namespace when OCR preprocessing / pass heuristics improve
const OCR_CACHE_VERSION = 'v7';
const ocrCache = new Map<string, LocalOcrPanelResult>();
const MAX_CACHE_ENTRIES = 64;

let workerPromise: Promise<Worker> | null = null;
let workerLang: string = DEFAULT_OCR_LANG;
let currentProgressHandler: ((pct: number, status: string) => void) | null = null;
let jobChain: Promise<unknown> = Promise.resolve();

async function getOcrWorker(language: string): Promise<Worker> {
  if (workerPromise && workerLang === language) {
    return workerPromise;
  }

  if (workerPromise) {
    try {
      const oldWorker = await workerPromise;
      await oldWorker.terminate();
    } catch {
      // ignore cleanup error
    }
    workerPromise = null;
  }

  workerLang = language;
  workerPromise = (async () => {
    const worker = await createWorker(language, 1, {
      logger: (msg) => {
        if (currentProgressHandler && typeof msg?.progress === 'number') {
          const pct = Math.max(0, Math.min(100, Math.round(msg.progress * 100)));
          currentProgressHandler(pct, msg.status || 'Recognizing label text');
        }
      },
      errorHandler: (err) => {
        console.warn('[LegalMetrix OCR] Worker warning:', err);
      },
    });
    return worker;
  })().catch((err) => {
    workerPromise = null;
    throw err;
  });

  return workerPromise;
}

/**
 * Inverse-rotates normalized [0..100] coordinates back to the original unrotated display frame
 * in exact pixel coordinates so non-square live images do not suffer aspect-ratio shear.
 */
export function inverseRotateNormalizedBox(
  box: ImageBoundingBox,
  rotateAutoDeg: number,
  deskewDeg: number,
  postAutoWidth = 1000,
  postAutoHeight = 1000
): ImageBoundingBox {
  let { ymin, xmin, ymax, xmax } = box;

  // 1. Inverse-map 90/180/270 degree auto-orientation back to 0° pre-rotateAuto frame
  const snapped90 = (((Math.round(rotateAutoDeg / 90) * 90) % 360) + 360) % 360;
  const rotIs90 = snapped90 === 90 || snapped90 === 270;
  if (snapped90 !== 0) {
    const corners: Array<[number, number]> = [
      [xmin, ymin],
      [xmax, ymin],
      [xmax, ymax],
      [xmin, ymax],
    ];
    const mapped = corners.map(([x, y]): [number, number] => {
      if (snapped90 === 90) return [y, 100 - x];
      if (snapped90 === 180) return [100 - x, 100 - y];
      if (snapped90 === 270) return [100 - y, x];
      return [x, y];
    });
    xmin = Math.min(...mapped.map((c) => c[0]));
    xmax = Math.max(...mapped.map((c) => c[0]));
    ymin = Math.min(...mapped.map((c) => c[1]));
    ymax = Math.max(...mapped.map((c) => c[1]));
  }

  // 2. Inverse-map small-angle deskew rotation in pixel coordinates (imagePreprocessor rotated by -deskewDeg)
  if (deskewDeg !== 0 && Math.abs(deskewDeg) <= 10) {
    const preAutoW = Math.max(1, rotIs90 ? postAutoHeight : postAutoWidth);
    const preAutoH = Math.max(1, rotIs90 ? postAutoWidth : postAutoHeight);
    const cx = preAutoW / 2;
    const cy = preAutoH / 2;
    const rad = (deskewDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const x0px = (xmin / 100) * preAutoW;
    const y0px = (ymin / 100) * preAutoH;
    const x1px = (xmax / 100) * preAutoW;
    const y1px = (ymax / 100) * preAutoH;

    const cornersPx: Array<[number, number]> = [
      [x0px - cx, y0px - cy],
      [x1px - cx, y0px - cy],
      [x1px - cx, y1px - cy],
      [x0px - cx, y1px - cy],
    ];
    const rotatedPct = cornersPx.map(([dx, dy]): [number, number] => [
      ((cx + dx * cos - dy * sin) / preAutoW) * 100,
      ((cy + dx * sin + dy * cos) / preAutoH) * 100,
    ]);
    xmin = Math.min(...rotatedPct.map((c) => c[0]));
    xmax = Math.max(...rotatedPct.map((c) => c[0]));
    ymin = Math.min(...rotatedPct.map((c) => c[1]));
    ymax = Math.max(...rotatedPct.map((c) => c[1]));
  }

  ymin = Math.max(0.2, Math.min(98.5, Math.round(ymin * 10) / 10));
  xmin = Math.max(0.2, Math.min(98.5, Math.round(xmin * 10) / 10));
  ymax = Math.max(ymin + 0.8, Math.min(99.8, Math.round(ymax * 10) / 10));
  xmax = Math.max(xmin + 0.8, Math.min(99.8, Math.round(xmax * 10) / 10));

  return { ymin, xmin, ymax, xmax };
}

export function toNormalizedBbox(
  bbox: { x0: number; y0: number; x1: number; y1: number },
  coordWidth: number,
  coordHeight: number,
  rotateAutoDeg: number,
  deskewDeg: number
): { bbox: ImageBoundingBox; box_2d: [number, number, number, number] } {
  const safeW = Math.max(1, coordWidth);
  const safeH = Math.max(1, coordHeight);

  const rawBox: ImageBoundingBox = {
    ymin: Math.max(0, Math.min(99.2, (bbox.y0 / safeH) * 100)),
    xmin: Math.max(0, Math.min(99.2, (bbox.x0 / safeW) * 100)),
    ymax: Math.max(0.5, Math.min(100, (bbox.y1 / safeH) * 100)),
    xmax: Math.max(0.5, Math.min(100, (bbox.x1 / safeW) * 100)),
  };

  const aligned = inverseRotateNormalizedBox(rawBox, rotateAutoDeg, deskewDeg, safeW, safeH);

  return {
    bbox: aligned,
    box_2d: [
      Math.round(aligned.ymin * 10),
      Math.round(aligned.xmin * 10),
      Math.round(aligned.ymax * 10),
      Math.round(aligned.xmax * 10),
    ],
  };
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1000, height: img.naturalHeight || 1000 });
    img.onerror = () => resolve({ width: 1000, height: 1000 });
    img.src = src;
  });
}

function createInvertedGrayCanvasUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(src);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || 1000;
        const h = img.naturalHeight || 1000;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const px = imgData.data;
        const total = w * h;
        const gray = new Uint8Array(total);
        for (let i = 0, p = 0; i < px.length; i += 4, p++) {
          gray[p] = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
        }

        // Preserve exterior white studio backdrop pixels reachable from the image perimeter
        const exteriorWhite = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;
        for (let x = 0; x < w; x++) {
          if (gray[x] >= 228) {
            exteriorWhite[x] = 1;
            queue[tail++] = x;
          }
          const bot = (h - 1) * w + x;
          if (gray[bot] >= 228 && !exteriorWhite[bot]) {
            exteriorWhite[bot] = 1;
            queue[tail++] = bot;
          }
        }
        for (let y = 0; y < h; y++) {
          const left = y * w;
          const right = y * w + (w - 1);
          if (gray[left] >= 228 && !exteriorWhite[left]) {
            exteriorWhite[left] = 1;
            queue[tail++] = left;
          }
          if (gray[right] >= 228 && !exteriorWhite[right]) {
            exteriorWhite[right] = 1;
            queue[tail++] = right;
          }
        }
        while (head < tail) {
          const idx = queue[head++];
          const x = idx % w;
          const y = (idx / w) | 0;
          if (x > 0 && !exteriorWhite[idx - 1] && gray[idx - 1] >= 222) {
            exteriorWhite[idx - 1] = 1;
            queue[tail++] = idx - 1;
          }
          if (x < w - 1 && !exteriorWhite[idx + 1] && gray[idx + 1] >= 222) {
            exteriorWhite[idx + 1] = 1;
            queue[tail++] = idx + 1;
          }
          if (y > 0 && !exteriorWhite[idx - w] && gray[idx - w] >= 222) {
            exteriorWhite[idx - w] = 1;
            queue[tail++] = idx - w;
          }
          if (y < h - 1 && !exteriorWhite[idx + w] && gray[idx + w] >= 222) {
            exteriorWhite[idx + w] = 1;
            queue[tail++] = idx + w;
          }
        }

        for (let i = 0, p = 0; i < px.length; i += 4, p++) {
          const v = exteriorWhite[p] ? 255 : 255 - gray[p];
          px[i] = v;
          px[i + 1] = v;
          px[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function createUpscaledRgbCanvasUrl(
  src: string,
  targetW: number,
  targetH: number
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(src);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = Math.max(targetW, img.naturalWidth || targetW);
        const h = Math.max(targetH, img.naturalHeight || targetH);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function cleanRecognizedToken(text: string): string {
  return (text || '')
    .trim()
    .replace(/^[“”‘’"'|\\/~—«»•·`]+|[“”‘’"'|\\~«»•·`]+$/g, '')
    .trim();
}

function isStrayNoiseToken(text: string, confidence: number): boolean {
  const t = cleanRecognizedToken(text);
  if (!t) return true;
  // Drop standalone non-alphanumeric symbol/border tokens (preserve '/' for USP/dates and '&' for Mfr/Brand names)
  if (!/[a-zA-Z0-9₹%]/.test(t)) {
    if (t === '/' && confidence >= 0.62) return false;
    if (t === '&' && confidence >= 0.78) return false;
    return true;
  }
  // Drop stray single-character graphic artifacts with low confidence (keep metric unit letters >= 60%)
  if (t.length === 1) {
    if (/^[glnu]$/i.test(t) && confidence >= 0.60) return false;
    if (/^\d$/.test(t) && confidence >= 0.65) return false;
    if (confidence < 0.78) return true;
  }
  // Drop vertical-bar crimp stripe hallucinations like "Il", "ll", "iii", "1|", "|1"
  if (/^[Il1|!]{1,3}$/.test(t) && !/^\d+$/.test(t) && confidence < 0.88) {
    return true;
  }
  // Drop low-confidence texture hallucinations (e.g., "A050(0)", "ne)(28)", "ASQ(46)")
  if (confidence < 0.44) return true;
  if (t.length <= 2 && !/^\d+(?:g|l)?$/i.test(t) && confidence < 0.65) {
    return true;
  }
  if (t.length === 3 && !/^\d+(?:g|kg|ml|l)?$/i.test(t) && confidence < 0.56) {
    return true;
  }
  // Drop tokens made mostly of punctuation/noise glyphs (e.g., "se)bs", "§\", "|3")
  const alnum = t.replace(/[^a-zA-Z0-9₹]/g, '');
  if (alnum.length === 0) return true;
  if (t.length >= 2 && alnum.length / t.length < 0.45 && confidence < 0.78) {
    return true;
  }
  return false;
}

export function parseTesseractPage(
  page: any,
  dims: { width: number; height: number },
  deskewDeg: number
): { lines: LocalOcrLine[]; avgConfidence: number; text: string; rotationDeg: number; score: number } {
  const rotDeg = page?.rotateRadians ? Math.round((page.rotateRadians * 180) / Math.PI) : 0;
  const rotIs90 = Math.abs(Math.round(rotDeg / 90) * 90) % 180 === 90;
  let coordW = rotIs90 ? dims.height : dims.width;
  let coordH = rotIs90 ? dims.width : dims.height;

  // Guard against edge cases where Tesseract output coordinates exceed image dimensions
  let maxObservedX = 0;
  let maxObservedY = 0;
  for (const block of page?.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        if (line?.bbox) {
          maxObservedX = Math.max(maxObservedX, line.bbox.x1 || 0);
          maxObservedY = Math.max(maxObservedY, line.bbox.y1 || 0);
        }
      }
    }
  }
  if (maxObservedX > coordW * 1.03) coordW = maxObservedX;
  if (maxObservedY > coordH * 1.03) coordH = maxObservedY;

  const lines: LocalOcrLine[] = [];
  let confSum = 0;
  let confCount = 0;

  for (const block of page?.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        const rawWords = (line.words || [])
          .map((w: any) => {
            const wt = cleanRecognizedToken(w.text || '');
            const wConf = Math.max(0, Math.min(1, (w.confidence ?? 0) / 100));
            return { text: wt, confidence: wConf, rawBbox: w.bbox };
          })
          .filter((w: any) => !isStrayNoiseToken(w.text, w.confidence) && w.rawBbox);

        if (rawWords.length === 0) continue;

        // Sort left-to-right and split multi-column fragments separated by wide horizontal gaps
        const sortedWords = [...rawWords].sort((a: any, b: any) => a.rawBbox.x0 - b.rawBbox.x0);
        const heights = sortedWords
          .map((w: any) => Math.max(6, (w.rawBbox.y1 || 0) - (w.rawBbox.y0 || 0)))
          .sort((a: number, b: number) => a - b);
        const medianWordH = heights[Math.floor(heights.length / 2)] || 16;
        const columnGapPx = Math.max(coordW * 0.065, medianWordH * 3.0);

        const wordSegments: Array<typeof sortedWords> = [];
        let currentSegment: typeof sortedWords = [sortedWords[0]];
        for (let wi = 1; wi < sortedWords.length; wi++) {
          const prevW = sortedWords[wi - 1];
          const curW = sortedWords[wi];
          const gap = (curW.rawBbox.x0 || 0) - (prevW.rawBbox.x1 || 0);
          if (gap > columnGapPx) {
            wordSegments.push(currentSegment);
            currentSegment = [curW];
          } else {
            currentSegment.push(curW);
          }
        }
        wordSegments.push(currentSegment);

        for (const segWordsRaw of wordSegments) {
          // Prune stray giant/border-edge graphic tokens inside multi-word segments so tight line boxes stay sharp
          let segWords = segWordsRaw;
          if (segWordsRaw.length >= 2) {
            const segHeights = segWordsRaw
              .map((w: any) => Math.max(4, (w.rawBbox.y1 || 0) - (w.rawBbox.y0 || 0)))
              .sort((a: number, b: number) => a - b);
            const segMedH = segHeights[Math.floor(segHeights.length / 2)] || 16;
            const segCentersY = segWordsRaw
              .map((w: any) => ((w.rawBbox.y0 || 0) + (w.rawBbox.y1 || 0)) / 2)
              .sort((a: number, b: number) => a - b);
            const segMedCy = segCentersY[Math.floor(segCentersY.length / 2)] || 0;
            const filtered = segWordsRaw.filter((w: any) => {
              const wh = Math.max(4, (w.rawBbox.y1 || 0) - (w.rawBbox.y0 || 0));
              const wcy = ((w.rawBbox.y0 || 0) + (w.rawBbox.y1 || 0)) / 2;
              const isHeightOutlier = wh > segMedH * 3.0 && w.confidence < 0.75;
              const isOffsetOutlier = Math.abs(wcy - segMedCy) > segMedH * 1.8 && w.confidence < 0.78;
              return !isHeightOutlier && !isOffsetOutlier;
            });
            if (filtered.length > 0) segWords = filtered;
          }

          const cleanLine = segWords.map((w: any) => w.text).join(' ').trim();
          const cleanAlnum = cleanLine.replace(/[^a-zA-Z0-9₹]/g, '');
          if (!cleanLine || cleanAlnum.length < 2) continue;

          const words: LocalOcrWord[] = segWords.map((w: any) => {
            const wb = toNormalizedBbox(w.rawBbox, coordW, coordH, rotDeg, deskewDeg);
            return {
              text: w.text,
              confidence: w.confidence,
              bbox: wb.bbox,
            };
          });

          const tightRaw = {
            x0: Math.min(...segWords.map((w: any) => w.rawBbox.x0)),
            y0: Math.min(...segWords.map((w: any) => w.rawBbox.y0)),
            x1: Math.max(...segWords.map((w: any) => w.rawBbox.x1)),
            y1: Math.max(...segWords.map((w: any) => w.rawBbox.y1)),
          };

          const wordAvgConf =
            segWords.reduce((s: number, w: any) => s + w.confidence, 0) / Math.max(1, segWords.length);
          const rawLineConf = Math.max(0, Math.min(1, (line.confidence ?? page?.confidence ?? 0) / 100));
          const computedConf =
            rawLineConf >= 0.22
              ? Math.max(rawLineConf, wordAvgConf * 0.92)
              : cleanAlnum.length >= 4 && wordAvgConf >= 0.62
              ? wordAvgConf * 0.85
              : Math.max(rawLineConf, wordAvgConf * 0.55);
          const lineConf = Number(computedConf.toFixed(3));
          if (cleanAlnum.length <= 2 && lineConf < 0.74) continue;

          const lb = toNormalizedBbox(tightRaw, coordW, coordH, rotDeg, deskewDeg);
          lines.push({
            text: cleanLine,
            confidence: lineConf,
            bbox: lb.bbox,
            box_2d: lb.box_2d,
            words,
          });
          confSum += lineConf;
          confCount++;
        }
      }
    }
  }

  const avgConfidence =
    confCount > 0
      ? Number((confSum / confCount).toFixed(3))
      : Number(Math.max(0, Math.min(1, (page?.confidence ?? 0) / 100)).toFixed(3));

  const text = lines.map((l) => l.text).join('\n').trim();
  const confidentChars = lines.reduce(
    (sum, l) =>
      sum +
      (l.words || [])
        .filter((w) => w.confidence >= 0.5)
        .reduce((ws, w) => ws + (w.text || '').replace(/[^a-zA-Z0-9₹]/g, '').length, 0),
    0
  );
  const score = confidentChars * (0.2 + avgConfidence * avgConfidence);

  return { lines, avgConfidence, text, rotationDeg: rotDeg, score };
}

function setCachedOcr(key: string, value: LocalOcrPanelResult) {
  if (ocrCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ocrCache.keys().next().value;
    if (oldestKey) ocrCache.delete(oldestKey);
  }
  ocrCache.set(key, value);
}

export function clearOcrCache() {
  ocrCache.clear();
}

/**
 * Runs local browser-side Tesseract.js OCR on a single InspectionImage.
 * Multi-pass recognition + inverse deskew/orientation mapping keeps bounding boxes tightly aligned.
 */
export async function runTesseractOcrOnImage(
  image: InspectionImage,
  options: TesseractRunOptions = {}
): Promise<LocalOcrPanelResult> {
  if (options.signal?.aborted) {
    throw new DOMException('OCR scan cancelled', 'AbortError');
  }

  const language = options.language || DEFAULT_OCR_LANG;
  const sha256 = image.sha256 || (await computeSha256Hex(image.url));
  const cacheKey = `${OCR_CACHE_VERSION}:${sha256}:${language}`;

  const cached = ocrCache.get(cacheKey);
  if (cached) {
    options.onProgress?.(100, 'Loaded cached OCR extraction');
    return {
      ...cached,
      image_id: image.id,
      image_type: image.type,
    };
  }

  let ocrInputUrl = image.preprocessed_url;
  let thresholdedUrl = image.thresholded_url;
  let preprocessingSteps = image.preprocessing_steps;
  let quality = image.quality;
  let deskewDeg = image.deskewAngleDeg ?? 0;

  if (!ocrInputUrl && !image.url.startsWith('data:image/svg+xml')) {
    try {
      const prepped = await preprocessImageInBrowser(image.url);
      ocrInputUrl = prepped.preprocessedUrl;
      thresholdedUrl = prepped.thresholdedUrl;
      preprocessingSteps = prepped.steps;
      quality = image.quality || prepped.quality;
      deskewDeg = prepped.deskewAngleDeg;
    } catch {
      ocrInputUrl = image.url;
    }
  } else if (!image.deskewAngleDeg && preprocessingSteps?.length) {
    const skewStep = preprocessingSteps.find((s) => s.startsWith('Deskew Rotation'));
    const m = skewStep?.match(/([+-]?\d+(?:\.\d+)?)°/);
    if (m) deskewDeg = parseFloat(m[1]) || 0;
  }

  const sourceForOcr = ocrInputUrl || image.url;
  const dims = await getImageDimensions(sourceForOcr);

  const runJob = async (): Promise<LocalOcrPanelResult> => {
    if (options.signal?.aborted) {
      throw new DOMException('OCR scan cancelled', 'AbortError');
    }

    const startedAt = Date.now();
    currentProgressHandler = (pct, status) => {
      options.onProgress?.(pct, status);
    };

    try {
      const worker = await getOcrWorker(language);
      if (options.signal?.aborted) {
        throw new DOMException('OCR scan cancelled', 'AbortError');
      }

      // Pass 1: Standard Automatic Page Segmentation (PSM.AUTO) upright on contrast-enhanced layer
      // (rotateAuto: false prevents vertical wrapper crimp logos from mis-orienting upright labels)
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        user_defined_dpi: '300',
      });
      const resAuto = await worker.recognize(
        sourceForOcr,
        { rotateAuto: false },
        { blocks: true, text: true }
      );
      let best = parseTesseractPage(resAuto.data, dims, deskewDeg);
      let passMode: 'AUTO' | 'SPARSE_BINARIZED' = 'AUTO';

      const fuseNonOverlappingLines = (
        base: typeof best,
        extra: typeof best,
        minExtraLineConf: number
      ): typeof best => {
        const additions = extra.lines.filter((rl) => {
          const rlNorm = rl.text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (rl.confidence < minExtraLineConf || rlNorm.length < 4) return false;
          const rw = Math.max(0.5, rl.bbox.xmax - rl.bbox.xmin);
          const rh = Math.max(0.5, rl.bbox.ymax - rl.bbox.ymin);
          return !base.lines.some((bl) => {
            const blNorm = bl.text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (blNorm === rlNorm) return true;
            const bw = Math.max(0.5, bl.bbox.xmax - bl.bbox.xmin);
            const bh = Math.max(0.5, bl.bbox.ymax - bl.bbox.ymin);
            const similarScale = Math.max(bh, rh) < Math.min(bh, rh) * 3.0;
            const overlapX = Math.min(bl.bbox.xmax, rl.bbox.xmax) - Math.max(bl.bbox.xmin, rl.bbox.xmin);
            const overlapY = Math.min(bl.bbox.ymax, rl.bbox.ymax) - Math.max(bl.bbox.ymin, rl.bbox.ymin);
            if (overlapY > Math.min(bh, rh) * 0.3 && (blNorm.includes(rlNorm) || rlNorm.includes(blNorm))) {
              return true;
            }
            return similarScale && overlapX > Math.min(bw, rw) * 0.42 && overlapY > Math.min(bh, rh) * 0.42;
          });
        });
        if (additions.length === 0) return base;
        const merged = [...base.lines, ...additions].sort(
          (a, b) => (a.bbox.ymin + a.bbox.ymax) / 2 - (b.bbox.ymin + b.bbox.ymax) / 2
        );
        const mergedConf = merged.reduce((s, l) => s + l.confidence, 0) / Math.max(1, merged.length);
        const mergedChars = merged.reduce(
          (sum, l) =>
            sum +
            (l.words || [])
              .filter((w) => w.confidence >= 0.5)
              .reduce((ws, w) => ws + (w.text || '').replace(/[^a-zA-Z0-9₹]/g, '').length, 0),
          0
        );
        return {
          ...base,
          lines: merged,
          text: merged.map((l) => l.text).join('\n').trim(),
          avgConfidence: Number(mergedConf.toFixed(3)),
          score: mergedChars * (0.2 + mergedConf * mergedConf),
        };
      };

      // Pass 2: Run SPARSE_TEXT on contrast-enhanced grayscale when AUTO left gaps or sparse layout
      let alnumLen = best.text.replace(/[^a-zA-Z0-9]/g, '').length;
      if (!options.signal?.aborted && (best.lines.length < 5 || best.avgConfidence < 0.70 || alnumLen < 60)) {
        try {
          options.onProgress?.(68, 'Running sparse-layout label recognition...');
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
            user_defined_dpi: '300',
          });
          const resSparseGray = await worker.recognize(
            sourceForOcr,
            { rotateAuto: false },
            { blocks: true, text: true }
          );
          const grayCandidate = parseTesseractPage(resSparseGray.data, dims, deskewDeg);
          if (grayCandidate.score > best.score * 1.15 && grayCandidate.avgConfidence >= 0.56) {
            const oldBest = best;
            best = fuseNonOverlappingLines(grayCandidate, oldBest, 0.70);
            passMode = 'SPARSE_BINARIZED';
          } else {
            best = fuseNonOverlappingLines(best, grayCandidate, 0.72);
          }
          alnumLen = best.text.replace(/[^a-zA-Z0-9]/g, '').length;
        } catch {
          // Continue to adaptive binarized sparse fallback
        }
      }

      // Pass 3: Adaptive binarized sparse fallback for uneven lighting, glare, or faint inkjet dates
      if (!options.signal?.aborted && (alnumLen < 45 || best.avgConfidence < 0.65)) {
        const sparseInput = thresholdedUrl || sourceForOcr;
        if (sparseInput !== sourceForOcr) {
          const sparseDims = await getImageDimensions(sparseInput);
          try {
            options.onProgress?.(78, 'Running adaptive-contrast sparse text pass...');
            await worker.setParameters({
              tessedit_pageseg_mode: PSM.SPARSE_TEXT,
              user_defined_dpi: '300',
            });
            const resSparseBin = await worker.recognize(
              sparseInput,
              { rotateAuto: false },
              { blocks: true, text: true }
            );
            const binCandidate = parseTesseractPage(resSparseBin.data, sparseDims, deskewDeg);
            if (binCandidate.score > best.score * 1.2 && binCandidate.avgConfidence >= 0.58) {
              const oldBest = best;
              best = fuseNonOverlappingLines(binCandidate, oldBest, 0.72);
              passMode = 'SPARSE_BINARIZED';
            } else {
              best = fuseNonOverlappingLines(best, binCandidate, 0.74);
            }
            alnumLen = best.text.replace(/[^a-zA-Z0-9]/g, '').length;
          } catch {
            // Keep best result so far
          }
        }
      }

      // Pass 4: Color-banner rescue for stylized labels & white-on-color ribbons (e.g. brand headers)
      if (
        !options.signal?.aborted &&
        (alnumLen < 85 || best.lines.length < 5) &&
        image.url &&
        !image.url.startsWith('data:image/svg+xml')
      ) {
        try {
          options.onProgress?.(86, 'Checking color-banner typography...');
          const rgbInput = await createUpscaledRgbCanvasUrl(image.url, dims.width, dims.height);
          const rgbDims = rgbInput === image.url ? await getImageDimensions(image.url) : dims;
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
            user_defined_dpi: '300',
          });
          const resRgb = await worker.recognize(
            rgbInput,
            { rotateAuto: false },
            { blocks: true, text: true }
          );
          const rgbCandidate = parseTesseractPage(resRgb.data, rgbDims, 0);
          best = fuseNonOverlappingLines(best, rgbCandidate, 0.75);
          alnumLen = best.text.replace(/[^a-zA-Z0-9]/g, '').length;
        } catch {
          // Ignore color-banner rescue errors
        }
      }

      // Pass 5: Flood-safe inverted grayscale rescue for white text on dark navy/blue/black/red declaration panels
      if (
        !options.signal?.aborted &&
        (alnumLen < 85 || best.lines.length < 5) &&
        !sourceForOcr.startsWith('data:image/svg+xml')
      ) {
        try {
          options.onProgress?.(91, 'Checking dark-background reversed contrast...');
          const invInput = await createInvertedGrayCanvasUrl(sourceForOcr);
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
            user_defined_dpi: '300',
          });
          const resInv = await worker.recognize(
            invInput,
            { rotateAuto: false },
            { blocks: true, text: true }
          );
          const invCandidate = parseTesseractPage(resInv.data, dims, deskewDeg);
          best = fuseNonOverlappingLines(best, invCandidate, 0.74);
          alnumLen = best.text.replace(/[^a-zA-Z0-9]/g, '').length;
        } catch {
          // Ignore inverted rescue errors
        }
      }

      // Pass 6: Orientation-detection rescue for genuinely sideways (90°/180°/270°) label uploads
      if (!options.signal?.aborted && (alnumLen < 16 || best.avgConfidence < 0.56)) {
        try {
          options.onProgress?.(96, 'Checking 90°/180° label orientation...');
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.AUTO,
            user_defined_dpi: '300',
          });
          const resRot = await worker.recognize(
            sourceForOcr,
            { rotateAuto: true },
            { blocks: true, text: true }
          );
          const rotCandidate = parseTesseractPage(resRot.data, dims, deskewDeg);
          if (rotCandidate.score > best.score * 1.15 && rotCandidate.avgConfidence >= 0.55) {
            best = rotCandidate;
            passMode = 'AUTO';
          }
        } catch {
          // Keep best result so far
        }
      }

      await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO }).catch(() => undefined);

      const panelResult: LocalOcrPanelResult = {
        image_id: image.id,
        image_type: image.type,
        image_sha256: sha256,
        text: best.text,
        confidence: best.avgConfidence,
        width: dims.width,
        height: dims.height,
        rotation_deg: best.rotationDeg,
        deskew_angle_deg: deskewDeg,
        ocr_pass_mode: passMode,
        language,
        engine: 'tesseract.js',
        duration_ms: Date.now() - startedAt,
        lines: best.lines,
        quality,
        preprocessed_url: ocrInputUrl,
        thresholded_url: thresholdedUrl,
        preprocessing_steps: preprocessingSteps,
      };

      setCachedOcr(cacheKey, panelResult);
      options.onProgress?.(100, 'OCR text extraction complete');
      return panelResult;
    } finally {
      currentProgressHandler = null;
    }
  };

  const nextPromise = jobChain.then(runJob, runJob);
  jobChain = nextPromise.catch(() => undefined);
  return nextPromise;
}

/**
 * Runs local Tesseract.js OCR sequentially across all panel images (Front, Back, Side, PDF pages).
 */
export async function runTesseractOcrBatch(
  images: InspectionImage[],
  options: TesseractRunOptions = {}
): Promise<LocalOcrPanelResult[]> {
  const results: LocalOcrPanelResult[] = [];
  const total = Math.max(1, images.length);

  for (let i = 0; i < images.length; i++) {
    if (options.signal?.aborted) {
      throw new DOMException('OCR scan cancelled', 'AbortError');
    }
    const img = images[i];
    const panelRes = await runTesseractOcrOnImage(img, {
      language: options.language,
      signal: options.signal,
      onProgress: (pct, status) => {
        const overall = Math.round(((i + pct / 100) / total) * 100);
        options.onProgress?.(overall, `Panel ${i + 1}/${total} (${img.type}): ${status}`);
      },
    });
    results.push(panelRes);
  }

  return results;
}
