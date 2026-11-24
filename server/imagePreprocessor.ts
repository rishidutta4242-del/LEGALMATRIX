import sharp from 'sharp';
import { InspectionImage } from '../src/types/index';

export interface ImagePreprocessingOptions {
  enableGrayscale?: boolean;
  enableContrastAdjustment?: boolean;
  enableThresholding?: boolean;
  enableSharpen?: boolean;
  thresholdValue?: number;
  contrastMultiplier?: number;
  brightnessOffset?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface PreprocessedImageResult {
  originalBuffer: Buffer;
  grayscaleContrastBuffer: Buffer;
  thresholdedBuffer: Buffer;
  grayscaleContrastBase64: string;
  thresholdedBase64: string;
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    channels?: number;
  };
  grayscaleDataUri: string;
  thresholdedDataUri: string;
  preprocessingSteps: string[];
}

/**
 * Extracts a Node.js Buffer from varied image inputs (Data URIs, base64 strings, or Buffers).
 */
export function extractBufferFromInput(input: string | Buffer): { buffer: Buffer; mimeType: string } {
  if (Buffer.isBuffer(input)) {
    return { buffer: input, mimeType: 'image/jpeg' };
  }

  const trimmed = input.trim();
  if (trimmed.startsWith('data:image/')) {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx !== -1) {
      const header = trimmed.substring(0, commaIdx);
      const body = trimmed.substring(commaIdx + 1);
      const mimeMatch = header.match(/data:(image\/[a-zA-Z0-9.+-]+)/i);
      const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/jpeg';
      const isBase64 = header.includes(';base64');
      const buffer = isBase64
        ? Buffer.from(body.trim(), 'base64')
        : Buffer.from(decodeURIComponent(body), 'utf-8');
      return { buffer, mimeType };
    }
  }

  // Raw base64 string
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
    return { buffer: Buffer.from(trimmed, 'base64'), mimeType: 'image/jpeg' };
  }

  // Raw SVG XML string
  if (trimmed.startsWith('<svg') || trimmed.includes('xmlns="http://www.w3.org/2000/svg"')) {
    return { buffer: Buffer.from(trimmed, 'utf-8'), mimeType: 'image/svg+xml' };
  }

  // Fallback UTF-8 buffer
  return { buffer: Buffer.from(trimmed, 'utf-8'), mimeType: 'image/jpeg' };
}

/**
 * Executes multi-stage image preprocessing for Legal Metrology OCR text extraction:
 * 1. Grayscale Conversion: Strips chromatic interference and packaging background tint.
 * 2. Contrast Adjustment: Stretches dynamic range (normalize) and applies linear contrast boost + unsharp mask.
 * 3. Thresholding / Binarization: Segments high-contrast character glyphs from complex wrappers.
 */
export async function preprocessImageForOcr(
  input: string | Buffer,
  options: ImagePreprocessingOptions = {}
): Promise<PreprocessedImageResult> {
  const {
    enableGrayscale = true,
    enableContrastAdjustment = true,
    enableThresholding = true,
    enableSharpen = true,
    thresholdValue = 135,
    contrastMultiplier = 1.35,
    brightnessOffset = -12,
    maxWidth = 2048,
    maxHeight = 2048,
  } = options;

  const { buffer: initialBuffer, mimeType } = extractBufferFromInput(input);
  const steps: string[] = [];

  let sharpInstance = sharp(initialBuffer);

  // If input is SVG, convert to PNG raster buffer for pixel-level filtering
  if (mimeType === 'image/svg+xml') {
    const pngBuffer = await sharpInstance.png().toBuffer();
    sharpInstance = sharp(pngBuffer);
    steps.push('Rasterized SVG to PNG buffer');
  }

  const meta = await sharpInstance.metadata();

  // Constrain extreme resolutions to optimal OCR dimensions
  if ((meta.width && meta.width > maxWidth) || (meta.height && meta.height > maxHeight)) {
    sharpInstance = sharpInstance.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
    steps.push(`Normalized dimensions to max ${maxWidth}x${maxHeight}`);
  }

  // STAGE 1: Grayscale + Dynamic Contrast Normalization + High-Frequency Sharpening
  let contrastChain = sharpInstance.clone();
  if (enableGrayscale) {
    contrastChain = contrastChain.grayscale();
    steps.push('Grayscale conversion (chromatic noise suppression)');
  }

  if (enableContrastAdjustment) {
    // Dynamic histogram stretch
    contrastChain = contrastChain.normalize();
    // Linear contrast scaling to accentuate dark ink over light wrappers
    contrastChain = contrastChain.linear(contrastMultiplier, brightnessOffset);
    steps.push(`Contrast boost (multiplier: ${contrastMultiplier}, offset: ${brightnessOffset})`);
  }

  if (enableSharpen) {
    contrastChain = contrastChain.sharpen({
      sigma: 1.2,
      m1: 1.0,
      m2: 0.5,
    });
    steps.push('Unsharp mask edge sharpening (1.2 sigma)');
  }

  const grayscaleContrastBuffer = await contrastChain.png({ quality: 95 }).toBuffer();
  const grayscaleContrastBase64 = grayscaleContrastBuffer.toString('base64');

  // STAGE 2: Thresholding / Binarization for Fine Text & Inkjet Codes
  let thresholdedBuffer: Buffer;
  if (enableThresholding) {
    thresholdedBuffer = await sharp(grayscaleContrastBuffer)
      .threshold(thresholdValue, { grayscale: true })
      .png({ quality: 90 })
      .toBuffer();
    steps.push(`Otsu-style thresholding at luminance ${thresholdValue}`);
  } else {
    thresholdedBuffer = grayscaleContrastBuffer;
  }

  const thresholdedBase64 = thresholdedBuffer.toString('base64');

  return {
    originalBuffer: initialBuffer,
    grayscaleContrastBuffer,
    thresholdedBuffer,
    grayscaleContrastBase64,
    thresholdedBase64,
    metadata: {
      width: meta.width,
      height: meta.height,
      format: meta.format,
      channels: meta.channels,
    },
    grayscaleDataUri: `data:image/png;base64,${grayscaleContrastBase64}`,
    thresholdedDataUri: `data:image/png;base64,${thresholdedBase64}`,
    preprocessingSteps: steps,
  };
}

/**
 * Prepares multimodal input parts with both preprocessed OCR-enhanced images
 * and original color images for the Gemini Multimodal API.
 */
export async function prepareMultimodalImageParts(images: InspectionImage[]): Promise<{
  parts: any[];
  preprocessedImages: Array<{
    id: string;
    type: string;
    originalUri: string;
    preprocessedUri: string;
    thresholdedUri: string;
    steps: string[];
    dimensions: string;
  }>;
}> {
  const parts: any[] = [];
  const preprocessedImages: Array<{
    id: string;
    type: string;
    originalUri: string;
    preprocessedUri: string;
    thresholdedUri: string;
    steps: string[];
    dimensions: string;
  }> = [];

  const imagesToProcess = images.slice(0, 4);

  for (let idx = 0; idx < imagesToProcess.length; idx++) {
    const img = imagesToProcess[idx];
    if (!img || !img.url) continue;

    const imgType = img.type || (idx === 0 ? 'Front' : idx === 1 ? 'Back' : 'Panel');
    const rawUrl = img.url.trim();

    // Check if SVG
    const isSvg =
      rawUrl.startsWith('<svg') ||
      rawUrl.includes('image/svg+xml') ||
      rawUrl.includes('<svg') ||
      img.name?.toLowerCase().endsWith('.svg');

    if (isSvg) {
      let svgContent = rawUrl;
      if (rawUrl.startsWith('data:image/svg+xml')) {
        const commaIdx = rawUrl.indexOf(',');
        if (commaIdx !== -1) {
          const header = rawUrl.substring(0, commaIdx);
          const body = rawUrl.substring(commaIdx + 1);
          if (header.includes(';base64')) {
            try {
              svgContent = Buffer.from(body, 'base64').toString('utf-8');
            } catch {
              svgContent = body;
            }
          } else {
            try {
              svgContent = decodeURIComponent(body);
            } catch {
              svgContent = body;
            }
          }
        }
      }

      // Convert SVG through Sharp for OCR preprocessing as well
      try {
        const preprocessed = await preprocessImageForOcr(Buffer.from(svgContent, 'utf-8'));
        parts.push({
          text: `\n=== PACKAGE IMAGE #${idx} (image_index: ${idx}, image_id: "${img.id}", image_type: "${imgType}") ===
[Preprocessed OCR-Enhanced Image: Grayscale + Dynamic Contrast Normalization + Unsharp Mask]
Attached below is the contrast-optimized preprocessed image for statutory text extraction:`,
        });
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: preprocessed.grayscaleContrastBase64,
          },
        });
        parts.push({
          text: `[Vector SVG Label Structure Content #${idx}]:\n${svgContent}`,
        });

        preprocessedImages.push({
          id: img.id,
          type: imgType,
          originalUri: rawUrl,
          preprocessedUri: preprocessed.grayscaleDataUri,
          thresholdedUri: preprocessed.thresholdedDataUri,
          steps: preprocessed.preprocessingSteps,
          dimensions: `${preprocessed.metadata.width || 600}x${preprocessed.metadata.height || 750}`,
        });
      } catch (err) {
        console.warn('SVG Sharp preprocessing fallback:', err);
        parts.push({
          text: `\n=== PACKAGE IMAGE #${idx} (image_index: ${idx}, image_id: "${img.id}", image_type: "${imgType}") ===\n[Vector SVG Label Layout Content]:\n${svgContent}`,
        });
      }
      continue;
    }

    // Raster image: Apply Sharp Grayscale, Contrast Adjustment & Thresholding
    try {
      const preprocessed = await preprocessImageForOcr(rawUrl);

      // 1. Send Preprocessed OCR-Enhanced Grayscale + Contrast image
      parts.push({
        text: `\n=== PACKAGE IMAGE #${idx} (image_index: ${idx}, image_id: "${img.id}", image_type: "${imgType}") ===
[OCR-Enhanced Preprocessed View #${idx} - Grayscale, Dynamic Contrast Boost, Edge Sharpened]
Notice: This preprocessed image has color background noise removed and ink contrast maximized for statutory label OCR:`,
      });
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: preprocessed.grayscaleContrastBase64,
        },
      });

      // 2. Also send Thresholded Binary View for dense fine-print text & inkjet batch codes
      parts.push({
        text: `[OCR-Binarized Thresholded View #${idx} - Monochrome Text Segmentation]
Notice: This thresholded view isolates high-frequency character strokes (Rule 6 declarations, MRP, dates, batch):`,
      });
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: preprocessed.thresholdedBase64,
        },
      });

      // 3. Send Original Full-Color Image for dietary symbols (Vegetarian Green Dot / Non-Veg mark) & color trademarks
      const { buffer: origBuf, mimeType: origMime } = extractBufferFromInput(rawUrl);
      parts.push({
        text: `[Original Color View #${idx} - Full Spectrum Reference for Color Marks (Green Veg Dot / Brown Non-Veg Mark)]`,
      });
      parts.push({
        inlineData: {
          mimeType: origMime === 'image/svg+xml' ? 'image/png' : origMime,
          data: origBuf.toString('base64'),
        },
      });

      preprocessedImages.push({
        id: img.id,
        type: imgType,
        originalUri: rawUrl.startsWith('data:') ? rawUrl : `data:image/jpeg;base64,${origBuf.toString('base64')}`,
        preprocessedUri: preprocessed.grayscaleDataUri,
        thresholdedUri: preprocessed.thresholdedDataUri,
        steps: preprocessed.preprocessingSteps,
        dimensions: `${preprocessed.metadata.width || 0}x${preprocessed.metadata.height || 0}`,
      });
    } catch (err) {
      console.error(`Sharp preprocessing failed for image #${idx}:`, err);
      // Fallback: send original raw data
      const { buffer: rawBuf, mimeType: rawMime } = extractBufferFromInput(rawUrl);
      parts.push({
        text: `\n=== PACKAGE IMAGE #${idx} (image_index: ${idx}, image_id: "${img.id}", image_type: "${imgType}") ===`,
      });
      parts.push({
        inlineData: {
          mimeType: rawMime,
          data: rawBuf.toString('base64'),
        },
      });
    }
  }

  return { parts, preprocessedImages };
}
