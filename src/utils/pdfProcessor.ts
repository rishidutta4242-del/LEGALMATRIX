import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { InspectionImage, ImageType } from '../types/index';
import { computeSha256Hex, preprocessImageInBrowser } from './imagePreprocessor';

// Configure bundled PDF.js web worker cleanly for Vite SPA
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfRenderResult {
  images: InspectionImage[];
  pageCount: number;
  renderedCount: number;
  pdfSha256: string;
  embeddedTextByPage: string[];
}

/**
 * Renders a multi-page PDF packaging document into high-resolution raster images
 * preprocessed for local Tesseract.js OCR.
 */
export async function renderPdfToInspectionImages(
  file: File,
  options: { maxPages?: number; scale?: number; onProgress?: (page: number, total: number) => void } = {}
): Promise<PdfRenderResult> {
  const maxPages = options.maxPages ?? 10;
  const scale = options.scale ?? 2.0;

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error(`PDF file "${file.name}" is empty.`);
  }

  // Basic PDF magic header verification
  const headerBytes = new Uint8Array(buffer.slice(0, 5));
  const headerText = String.fromCharCode(...headerBytes);
  if (!headerText.startsWith('%PDF-')) {
    throw new Error(`File "${file.name}" is not a valid PDF document.`);
  }

  const pdfSha256 = await computeSha256Hex(buffer);

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes('password')) {
      throw new Error(`PDF "${file.name}" is password-protected. Please upload an unlocked PDF or image.`);
    }
    throw new Error(`Unable to read PDF "${file.name}". Please ensure the document is not corrupted.`);
  }

  const pageCount = pdfDoc.numPages || 0;
  if (pageCount === 0) {
    throw new Error(`PDF "${file.name}" contains no readable pages.`);
  }

  const renderedCount = Math.min(pageCount, maxPages);
  const images: InspectionImage[] = [];
  const embeddedTextByPage: string[] = [];

  for (let pageNum = 1; pageNum <= renderedCount; pageNum++) {
    options.onProgress?.(pageNum, renderedCount);
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Extract any embedded PDF text layer as supplemental hint
    try {
      const textContent = await page.getTextContent();
      const pageText = (textContent.items || [])
        .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
        .filter(Boolean)
        .join(' ')
        .trim();
      embeddedTextByPage.push(pageText);
    } catch {
      embeddedTextByPage.push('');
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable for PDF page rendering.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    const rawDataUrl = canvas.toDataURL('image/png');
    const prepped = await preprocessImageInBrowser(rawDataUrl);

    const viewType: ImageType = pageNum === 1 ? 'Front' : pageNum === 2 ? 'Back' : 'Side';

    images.push({
      id: `img-pdf-${Date.now()}-${pageNum}-${Math.random().toString(36).slice(2, 6)}`,
      type: viewType,
      name: `${file.name} (Page ${pageNum}/${pageCount})`,
      mimeType: 'application/pdf',
      pageNumber: pageNum,
      sizeBytes: prepped.sizeBytes,
      sha256: prepped.sha256,
      url: prepped.displayUrl,
      preprocessed_url: prepped.preprocessedUrl,
      thresholded_url: prepped.thresholdedUrl,
      preprocessing_steps: [`PDF.js Render (${scale}x)`, ...prepped.steps],
      quality: prepped.quality,
    });
  }

  if (typeof (pdfDoc as any).destroy === 'function') {
    await (pdfDoc as any).destroy();
  }

  return {
    images,
    pageCount,
    renderedCount,
    pdfSha256,
    embeddedTextByPage,
  };
}
