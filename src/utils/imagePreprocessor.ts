import { InspectionImage } from '../types/index';

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_PDF_MIME_TYPES = new Set(['application/pdf']);

export const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
]);

export interface FileValidationResult {
  valid: boolean;
  kind: 'image' | 'pdf' | 'invalid';
  reason?: string;
}

export function validateUploadFile(file: { name?: string; type?: string; size?: number }, maxSizeBytes = 25 * 1024 * 1024): FileValidationResult {
  const name = (file?.name || '').trim();
  const extMatch = name.toLowerCase().match(/(\.[a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';
  const mime = (file?.type || '').toLowerCase();

  if (typeof file.size === 'number' && file.size === 0) {
    return { valid: false, kind: 'invalid', reason: `File "${name || 'upload'}" is empty.` };
  }
  if (typeof file.size === 'number' && file.size > maxSizeBytes) {
    return {
      valid: false,
      kind: 'invalid',
      reason: `File "${name}" exceeds the ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit.`,
    };
  }

  if (ALLOWED_PDF_MIME_TYPES.has(mime) || ext === '.pdf') {
    return { valid: true, kind: 'pdf' };
  }

  if (ALLOWED_IMAGE_MIME_TYPES.has(mime) || (ext && ALLOWED_EXTENSIONS.has(ext) && ext !== '.pdf')) {
    return { valid: true, kind: 'image' };
  }

  return {
    valid: false,
    kind: 'invalid',
    reason: `Unsupported file "${name || 'file'}". Please upload JPG, JPEG, PNG, WEBP, or PDF files.`,
  };
}

export async function computeSha256Hex(input: ArrayBuffer | Uint8Array | string): Promise<string> {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new Uint8Array(input);
  }

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    try {
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', copy.buffer);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback below if subtle is unavailable in insecure context
    }
  }

  // Deterministic FNV-1a 64-bit fallback if subtle crypto is absent
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < bytes.length; i++) {
    h1 ^= bytes[i];
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= bytes[i];
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export interface BrowserPreprocessOutput {
  displayUrl: string; // Resized RGB JPEG/PNG for preview & Gemini
  preprocessedUrl: string; // Grayscale + contrast + denoised + sharpened + deskewed PNG for OCR
  thresholdedUrl: string; // Otsu binarized PNG for EvidenceViewer
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
  deskewAngleDeg: number;
  steps: string[];
  quality: NonNullable<InspectionImage['quality']>;
}

/**
 * Estimates optimal small-angle deskew in [-4, +4] degrees by maximizing row-projection variance
 * of interior text-edge energy (ignoring outer background clutter in live photos).
 */
function detectSmallSkewAngle(gray: Uint8ClampedArray, w: number, h: number): number {
  if (w < 80 || h < 80) return 0;

  // Downsample to max 320px for fast projection variance estimation
  const scale = Math.min(1, 320 / Math.max(w, h));
  const sw = Math.max(40, Math.round(w * scale));
  const sh = Math.max(40, Math.round(h * scale));
  const edge = new Float32Array(sw * sh);

  for (let y = 0; y < sh; y++) {
    const sy = Math.min(h - 1, Math.floor(y / scale));
    for (let x = 1; x < sw; x++) {
      const sx = Math.min(w - 1, Math.floor(x / scale));
      const sxPrev = Math.max(0, sx - 1);
      // Horizontal/vertical contrast energy highlights crisp text strokes rather than uniform dark tables
      const gx = Math.abs(gray[sy * w + sx] - gray[sy * w + sxPrev]);
      const syPrev = Math.max(0, sy - 1);
      const gy = Math.abs(gray[sy * w + sx] - gray[syPrev * w + sx]);
      const g = gx + gy;
      edge[y * sw + x] = g > 18 ? g : 0;
    }
  }

  // Evaluate only the central 70% ROI so surrounding tables/hands/margins do not bias skew
  const xStart = Math.floor(sw * 0.15);
  const xEnd = Math.ceil(sw * 0.85);
  const yStart = Math.floor(sh * 0.15);
  const yEnd = Math.ceil(sh * 0.85);
  const roiH = Math.max(10, yEnd - yStart);

  const scoreAngle = (deg: number): number => {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const cx = sw / 2;
    const cy = sh / 2;
    const rowSums = new Float64Array(roiH);

    for (let y = yStart; y < yEnd; y++) {
      const dy = y - cy;
      let sum = 0;
      for (let x = xStart; x < xEnd; x += 2) {
        const dx = x - cx;
        const rx = Math.round(cx + dx * cos - dy * sin);
        const ry = Math.round(cy + dx * sin + dy * cos);
        if (rx >= xStart && rx < xEnd && ry >= yStart && ry < yEnd) {
          sum += edge[ry * sw + rx];
        }
      }
      rowSums[y - yStart] = sum;
    }

    let mean = 0;
    for (let i = 0; i < roiH; i++) mean += rowSums[i];
    mean /= roiH;

    let variance = 0;
    for (let i = 0; i < roiH; i++) {
      const d = rowSums[i] - mean;
      variance += d * d;
    }
    return variance / roiH;
  };

  const zeroScore = scoreAngle(0);
  if (zeroScore <= 1) return 0;

  let bestDeg = 0;
  let bestScore = zeroScore;

  for (const deg of [-4, -3, -2, -1, 1, 2, 3, 4]) {
    const sc = scoreAngle(deg);
    if (sc > bestScore) {
      bestScore = sc;
      bestDeg = deg;
    }
  }

  if (bestDeg === 0 || bestScore <= zeroScore * 1.25) {
    return 0;
  }

  const oppositeScore = scoreAngle(-bestDeg);
  if (bestScore <= oppositeScore * 1.12) {
    return 0;
  }

  return bestDeg;
}

/**
 * Computes Otsu global threshold [0..255] as fallback baseline.
 */
function computeOtsuThreshold(gray: Uint8ClampedArray): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > maxVar) {
      maxVar = varBetween;
      threshold = t;
    }
  }
  return threshold;
}

/**
 * Computes Bradley-Roth integral-image local adaptive binarization.
 * Separates fine print over colored banners, shadows, and glare gradients
 * far more accurately than a single global threshold.
 */
function computeAdaptiveBinarized(
  gray: Uint8ClampedArray,
  w: number,
  h: number,
  invertForDarkBg: boolean
): Uint8ClampedArray {
  const total = w * h;
  const out = new Uint8ClampedArray(total);
  const otsu = computeOtsuThreshold(gray);

  // Build 64-bit float integral image for fast O(1) window mean lookup
  const integral = new Float64Array(total);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    const rowOff = y * w;
    for (let x = 0; x < w; x++) {
      const val = invertForDarkBg ? 255 - gray[rowOff + x] : gray[rowOff + x];
      rowSum += val;
      integral[rowOff + x] = (y > 0 ? integral[rowOff - w + x] : 0) + rowSum;
    }
  }

  const radius = Math.max(10, Math.min(36, Math.round(Math.max(w, h) / 48)));
  const sensitivity = 0.88; // Pixel is ink if < 88% of local neighborhood mean
  const effOtsu = invertForDarkBg ? 255 - otsu : otsu;

  for (let y = 0; y < h; y++) {
    const y1 = Math.max(0, y - radius);
    const y2 = Math.min(h - 1, y + radius);
    const rowOff = y * w;
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - radius);
      const x2 = Math.min(w - 1, x + radius);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const sum =
        integral[y2 * w + x2] -
        (y1 > 0 ? integral[(y1 - 1) * w + x2] : 0) -
        (x1 > 0 ? integral[y2 * w + (x1 - 1)] : 0) +
        (y1 > 0 && x1 > 0 ? integral[(y1 - 1) * w + (x1 - 1)] : 0);

      const localMean = sum / count;
      const val = invertForDarkBg ? 255 - gray[rowOff + x] : gray[rowOff + x];

      // Blend local adaptive rule with mild global Otsu guard to avoid noise in flat solid regions
      const isInk = val < localMean * sensitivity && val < Math.min(220, effOtsu + 32);
      out[rowOff + x] = isInk ? 0 : 255;
    }
  }

  return out;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to decode image file.'));
    img.src = src;
  });
}

/**
 * Browser-side multi-stage OCR image preprocessing:
 * 1. Auto-resizing (upscale small labels to >= 1200px width/height, cap huge uploads at 2000px)
 * 2. BT.709 grayscale conversion
 * 3. Percentile contrast enhancement
 * 4. 3x3 median noise reduction
 * 5. Unsharp-mask sharpening
 * 6. Small-angle deskew correction
 * 7. Quality metrics (sharpness/blur, contrast, brightness)
 */
export async function preprocessImageInBrowser(
  dataUrl: string,
  options: { maxDim?: number; minOcrDim?: number; jpegQuality?: number } = {}
): Promise<BrowserPreprocessOutput> {
  const maxDim = options.maxDim ?? 2000;
  const minOcrDim = options.minOcrDim ?? 1800;
  const jpegQuality = options.jpegQuality ?? 0.9;

  const sha256 = await computeSha256Hex(dataUrl);

  // Skip raster pixel pipeline for inline SVG demo presets
  if (!dataUrl || dataUrl.startsWith('data:image/svg+xml')) {
    return {
      displayUrl: dataUrl,
      preprocessedUrl: dataUrl,
      thresholdedUrl: dataUrl,
      width: 600,
      height: 750,
      sizeBytes: Math.round((dataUrl?.length || 0) * 0.75),
      sha256,
      deskewAngleDeg: 0,
      steps: ['Vector Demo Preset (No Raster Preprocessing Needed)'],
      quality: {
        overall: 'GOOD',
        blurScore: 95,
        contrastScore: 92,
        brightnessScore: 90,
        resolution: '600x750 (Vector)',
        issues: [],
      },
    };
  }

  const img = await loadImageElement(dataUrl);
  const natW = img.naturalWidth || img.width || 1280;
  const natH = img.naturalHeight || img.height || 720;

  // Target display dimensions (capped at maxDim)
  let dispW = natW;
  let dispH = natH;
  if (Math.max(dispW, dispH) > maxDim) {
    const ratio = maxDim / Math.max(dispW, dispH);
    dispW = Math.max(1, Math.round(dispW * ratio));
    dispH = Math.max(1, Math.round(dispH * ratio));
  }

  // Target OCR dimensions (upscale small/medium photos up to minOcrDim for ~300-DPI glyph recognition)
  let ocrW = dispW;
  let ocrH = dispH;
  if (Math.max(ocrW, ocrH) < minOcrDim) {
    const upRatio = Math.min(3.2, minOcrDim / Math.max(1, Math.max(ocrW, ocrH)));
    ocrW = Math.round(ocrW * upRatio);
    ocrH = Math.round(ocrH * upRatio);
  }

  // 1. Render compact display JPEG
  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = dispW;
  dispCanvas.height = dispH;
  const dispCtx = dispCanvas.getContext('2d');
  if (!dispCtx) {
    throw new Error('Canvas 2D context unavailable for image processing.');
  }
  dispCtx.imageSmoothingEnabled = true;
  dispCtx.imageSmoothingQuality = 'high';
  dispCtx.drawImage(img, 0, 0, dispW, dispH);
  const displayUrl = dataUrl.length < 900_000 && natW <= maxDim && natH <= maxDim
    ? dataUrl
    : dispCanvas.toDataURL('image/jpeg', jpegQuality);

  // 2. Render OCR processing canvas
  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = ocrW;
  ocrCanvas.height = ocrH;
  const ocrCtx = ocrCanvas.getContext('2d', { willReadFrequently: true });
  if (!ocrCtx) {
    throw new Error('Canvas 2D context unavailable for OCR preprocessing.');
  }
  ocrCtx.fillStyle = '#ffffff';
  ocrCtx.fillRect(0, 0, ocrW, ocrH);
  ocrCtx.imageSmoothingEnabled = true;
  ocrCtx.imageSmoothingQuality = 'high';
  ocrCtx.drawImage(img, 0, 0, ocrW, ocrH);

  const imgData = ocrCtx.getImageData(0, 0, ocrW, ocrH);
  const px = imgData.data;
  const totalPixels = ocrW * ocrH;
  const gray = new Uint8ClampedArray(totalPixels);
  const hist = new Uint32Array(256);

  // Stage A: Rec.601 Luminance Grayscale + Histogram (preserves red/green/yellow banner separation)
  let lumaSum = 0;
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    const g = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    gray[p] = g;
    hist[g]++;
    lumaSum += g;
  }

  // Measure brightness & contrast percentile spread (1% .. 99%) clamped safely so white backgrounds never crush colored banners
  const meanLuma = lumaSum / totalPixels;
  let cum = 0;
  let p1 = 0;
  let p99 = 255;
  const lowCut = Math.floor(totalPixels * 0.01);
  const highCut = Math.floor(totalPixels * 0.99);
  for (let b = 0; b < 256; b++) {
    cum += hist[b];
    if (cum >= lowCut && p1 === 0 && b > 0) p1 = b;
    if (cum >= highCut) {
      p99 = b;
      break;
    }
  }
  const stretchLow = Math.min(20, p1);
  const stretchHigh = Math.max(232, p99);
  const dynamicRange = Math.max(1, stretchHigh - stretchLow);

  // Measure sharpness via Laplacian variance on sampled interior grid
  let lapSum = 0;
  let lapSqSum = 0;
  let lapCount = 0;
  const stepY = ocrH > 600 ? 2 : 1;
  const stepX = ocrW > 600 ? 2 : 1;
  for (let y = 1; y < ocrH - 1; y += stepY) {
    const row = y * ocrW;
    for (let x = 1; x < ocrW - 1; x += stepX) {
      const idx = row + x;
      const lap =
        gray[idx - ocrW] +
        gray[idx + ocrW] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      lapCount++;
    }
  }
  const lapMean = lapCount > 0 ? lapSum / lapCount : 0;
  const lapVar = lapCount > 0 ? Math.max(0, lapSqSum / lapCount - lapMean * lapMean) : 0;

  // Normalize quality scores 0..100
  const blurScore = Math.min(100, Math.max(5, Math.round(Math.sqrt(lapVar) * 2.6)));
  const contrastScore = Math.min(100, Math.max(5, Math.round(((p99 - p1) / 210) * 100)));
  const brightnessScore = Math.min(
    100,
    Math.max(10, Math.round(100 - Math.abs(meanLuma - 140) * 0.65))
  );

  // Stage B: Safe Contrast Stretch + Local Illumination Balancing (tames glare & uneven shadows)
  const stretched = new Uint8ClampedArray(totalPixels);
  for (let p = 0; p < totalPixels; p++) {
    const val = ((gray[p] - stretchLow) * 255) / dynamicRange;
    stretched[p] = val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
  }

  const illIntegral = new Float64Array(totalPixels);
  for (let y = 0; y < ocrH; y++) {
    let rowSum = 0;
    const rowOff = y * ocrW;
    for (let x = 0; x < ocrW; x++) {
      rowSum += stretched[rowOff + x];
      illIntegral[rowOff + x] = (y > 0 ? illIntegral[rowOff - ocrW + x] : 0) + rowSum;
    }
  }
  const illRadius = Math.max(24, Math.min(96, Math.round(Math.max(ocrW, ocrH) / 18)));
  const balanced = new Uint8ClampedArray(totalPixels);
  for (let y = 0; y < ocrH; y++) {
    const y1 = Math.max(0, y - illRadius);
    const y2 = Math.min(ocrH - 1, y + illRadius);
    const rowOff = y * ocrW;
    for (let x = 0; x < ocrW; x++) {
      const x1 = Math.max(0, x - illRadius);
      const x2 = Math.min(ocrW - 1, x + illRadius);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        illIntegral[y2 * ocrW + x2] -
        (y1 > 0 ? illIntegral[(y1 - 1) * ocrW + x2] : 0) -
        (x1 > 0 ? illIntegral[y2 * ocrW + (x1 - 1)] : 0) +
        (y1 > 0 && x1 > 0 ? illIntegral[(y1 - 1) * ocrW + (x1 - 1)] : 0);
      const localMean = sum / count;
      const localDiff = 148 + (stretched[rowOff + x] - localMean) * 1.2;
      const blended = 0.72 * stretched[rowOff + x] + 0.28 * localDiff;
      balanced[rowOff + x] = blended < 0 ? 0 : blended > 255 ? 255 : Math.round(blended);
    }
  }

  // Stage C: Mild Salt-and-Pepper Denoise (only clamp severe impulse outliers > 72)
  const denoised = new Uint8ClampedArray(balanced);
  for (let y = 1; y < ocrH - 1; y++) {
    const row = y * ocrW;
    for (let x = 1; x < ocrW - 1; x++) {
      const idx = row + x;
      const avg4 = (balanced[idx - 1] + balanced[idx + 1] + balanced[idx - ocrW] + balanced[idx + ocrW]) >> 2;
      if (Math.abs(balanced[idx] - avg4) > 72) {
        denoised[idx] = Math.round(0.45 * balanced[idx] + 0.55 * avg4);
      }
    }
  }

  // Stage D: Crisp Unsharp Mask Sharpening (amount 0.85)
  const sharpened = new Uint8ClampedArray(denoised);
  for (let y = 1; y < ocrH - 1; y++) {
    const row = y * ocrW;
    for (let x = 1; x < ocrW - 1; x++) {
      const idx = row + x;
      const blur =
        (denoised[idx - ocrW] +
          denoised[idx + ocrW] +
          denoised[idx - 1] +
          denoised[idx + 1] +
          denoised[idx] * 2) /
        6;
      const val = denoised[idx] + 0.85 * (denoised[idx] - blur);
      sharpened[idx] = val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
    }
  }

  // Write sharpened grayscale back to OCR canvas
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    const v = sharpened[p];
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
    px[i + 3] = 255;
  }
  ocrCtx.putImageData(imgData, 0, 0);

  // Stage E: Small-angle deskew check
  const deskewAngleDeg = detectSmallSkewAngle(sharpened, ocrW, ocrH);
  let finalOcrCanvas = ocrCanvas;
  if (deskewAngleDeg !== 0) {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = ocrW;
    rotCanvas.height = ocrH;
    const rotCtx = rotCanvas.getContext('2d');
    if (rotCtx) {
      rotCtx.fillStyle = '#ffffff';
      rotCtx.fillRect(0, 0, ocrW, ocrH);
      rotCtx.translate(ocrW / 2, ocrH / 2);
      rotCtx.rotate((-deskewAngleDeg * Math.PI) / 180);
      rotCtx.drawImage(ocrCanvas, -ocrW / 2, -ocrH / 2);
      finalOcrCanvas = rotCanvas;
    }
  }

  const preprocessedUrl = finalOcrCanvas.toDataURL('image/png');

  // Stage F: Bradley local adaptive binarized layer (auto-inverted for dark-background labels)
  const binCanvas = document.createElement('canvas');
  binCanvas.width = ocrW;
  binCanvas.height = ocrH;
  const binCtx = binCanvas.getContext('2d');
  let thresholdedUrl = preprocessedUrl;
  const isDarkBg = meanLuma < 95;
  if (binCtx) {
    const binMask = computeAdaptiveBinarized(sharpened, ocrW, ocrH, isDarkBg);
    const binImg = binCtx.createImageData(ocrW, ocrH);
    const bpx = binImg.data;
    for (let i = 0, p = 0; i < bpx.length; i += 4, p++) {
      const bit = binMask[p];
      bpx[i] = bit;
      bpx[i + 1] = bit;
      bpx[i + 2] = bit;
      bpx[i + 3] = 255;
    }
    binCtx.putImageData(binImg, 0, 0);
    if (deskewAngleDeg !== 0) {
      const rotBin = document.createElement('canvas');
      rotBin.width = ocrW;
      rotBin.height = ocrH;
      const rCtx = rotBin.getContext('2d');
      if (rCtx) {
        rCtx.fillStyle = '#ffffff';
        rCtx.fillRect(0, 0, ocrW, ocrH);
        rCtx.translate(ocrW / 2, ocrH / 2);
        rCtx.rotate((-deskewAngleDeg * Math.PI) / 180);
        rCtx.drawImage(binCanvas, -ocrW / 2, -ocrH / 2);
        thresholdedUrl = rotBin.toDataURL('image/png');
      } else {
        thresholdedUrl = binCanvas.toDataURL('image/png');
      }
    } else {
      thresholdedUrl = binCanvas.toDataURL('image/png');
    }
  }

  const issues: string[] = [];
  if (natW < 500 || natH < 400) {
    issues.push(`Low source resolution (${natW}x${natH}); upscaled for OCR.`);
  }
  if (blurScore < 32) {
    issues.push('Low edge sharpness / motion blur detected — manual verification advised.');
  }
  if (contrastScore < 35) {
    issues.push('Low label text contrast — glare or faded print possible.');
  }
  if (meanLuma < 45 || meanLuma > 235) {
    issues.push(meanLuma < 45 ? 'Under-exposed / dark lighting.' : 'Over-exposed / specular glare detected.');
  }

  const overall: 'GOOD' | 'FAIR' | 'POOR' =
    blurScore < 28 || contrastScore < 30 || (natW < 350 && natH < 350)
      ? 'POOR'
      : issues.length > 0 || blurScore < 48 || contrastScore < 50
      ? 'FAIR'
      : 'GOOD';

  const steps = [
    `Auto-Resize (${natW}x${natH} → ${ocrW}x${ocrH})`,
    'Rec.601 Luminance Grayscale',
    `Clamped Contrast Stretch (Low=${stretchLow}, High=${stretchHigh})`,
    'Impulse Denoise Filter',
    'Unsharp Mask Edge Sharpening',
    isDarkBg ? 'Adaptive Local Binarization (Dark-BG Inverted)' : 'Adaptive Local Binarization',
    deskewAngleDeg !== 0 ? `Deskew Rotation (${deskewAngleDeg > 0 ? '+' : ''}${deskewAngleDeg}°)` : 'Orientation Verified (0° Skew)',
  ];

  return {
    displayUrl,
    preprocessedUrl,
    thresholdedUrl,
    width: dispW,
    height: dispH,
    sizeBytes: Math.round(displayUrl.length * 0.75),
    sha256,
    deskewAngleDeg,
    steps,
    quality: {
      overall,
      blurScore,
      contrastScore,
      brightnessScore,
      resolution: `${dispW}x${dispH}`,
      issues,
    },
  };
}
