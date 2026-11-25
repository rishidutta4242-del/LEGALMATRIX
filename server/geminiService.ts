import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  AiAnalysisStatus,
  ExtractedDeclaration,
  InspectionImage,
  LocalOcrPanelResult,
  ProductCategory,
  DeclarationStatus,
} from "../src/types/index";
import {
  normalizeMRP,
  normalizeNetQuantity,
  normalizeDate,
  normalizePhone,
  normalizeEmail,
} from "./normalizer";
import { prepareMultimodalImageParts } from "./imagePreprocessor";
import { getDemoFallbackExtraction, getDemoFrontRecalibration, isDemoPresetId } from "./demoProfiles";
import { extractDeclarationsFromOcrPanels } from "../src/utils/ocrFieldParser";
import {
  ADVISORY_AI_CONFIG_ERROR,
  ADVISORY_AI_SKIPPED,
  ADVISORY_AI_UNAVAILABLE,
  classifyGeminiError,
  getAiRuntimeConfig,
  getCachedAnalysisResponse,
  getInFlightAnalysis,
  getOrderedCandidateModels,
  recordModelFailure,
  recordModelSuccess,
  setCachedAnalysisResponse,
  setInFlightAnalysis,
} from "./geminiCircuitBreaker";

let aiClient: GoogleGenAI | null = null;
let testClientOverride: any | null = null;

export function __setGeminiClientForTest(mockClient: any | null): void {
  testClientOverride = mockClient;
}

function getGeminiClient(): GoogleGenAI | null {
  if (testClientOverride) {
    return testClientOverride;
  }
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI:", err);
        aiClient = null;
      }
    }
  }
  return aiClient;
}

export interface LocalOcrContext {
  panels?: LocalOcrPanelResult[];
  declarations?: ExtractedDeclaration[];
  avgConfidence?: number;
  lowConfidenceDetected?: boolean;
}

export interface AnalysisExecutionOptions {
  allowFallback?: boolean;
  skipAi?: boolean;
  scanId?: string;
  requestCacheKey?: string;
  localOcr?: LocalOcrContext;
  maxRetriesOverride?: number;
  retryBaseDelayMsOverride?: number;
}

export interface MultimodalAnalysisResult {
  is_package_detected?: boolean;
  product: {
    name: string;
    brand: string;
    category: string;
  };
  declarations: ExtractedDeclaration[];
  image_quality: {
    overall: "GOOD" | "FAIR" | "POOR";
    issues: string[];
  };
  warnings: string[];
  ai_notes: string;
  is_fallback: boolean;
  ocr_completed?: boolean;
  ai_assisted_completed?: boolean;
  ai_status?: AiAnalysisStatus;
  ai_model_used?: string;
  advisory_message?: string;
  ocr_panels?: LocalOcrPanelResult[];
  preprocessed_images?: Array<{
    id: string;
    type: string;
    originalUri: string;
    preprocessedUri: string;
    thresholdedUri: string;
    steps: string[];
    dimensions: string;
  }>;
}

/**
 * Safely strips markdown code blocks (```json ... ```) and extracts valid JSON substring.
 */
function cleanJsonText(raw: string): string {
  let text = (raw || "").trim();
  if (text.startsWith("```json")) {
    text = text.substring(7);
  } else if (text.startsWith("```")) {
    text = text.substring(3);
  }
  if (text.endsWith("```")) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  text = text.replace(/,\s*([}\]])/g, "$1");
  return text;
}

/**
 * Universal bounding box normalizer.
 */
export function normalizeBbox(
  raw: any,
  isExplicitBox2d = false
): { ymin: number; xmin: number; ymax: number; xmax: number } | undefined {
  if (!raw) return undefined;

  let ymin = 0;
  let xmin = 0;
  let ymax = 0;
  let xmax = 0;

  if (Array.isArray(raw)) {
    if (raw.length >= 4) {
      ymin = Number(raw[0]) || 0;
      xmin = Number(raw[1]) || 0;
      ymax = Number(raw[2]) || 0;
      xmax = Number(raw[3]) || 0;

      if (isExplicitBox2d) {
        ymin = (ymin / 1000) * 100;
        xmin = (xmin / 1000) * 100;
        ymax = (ymax / 1000) * 100;
        xmax = (xmax / 1000) * 100;
      } else {
        const maxVal = Math.max(ymin, xmin, ymax, xmax);
        if (maxVal > 100) {
          ymin = (ymin / 1000) * 100;
          xmin = (xmin / 1000) * 100;
          ymax = (ymax / 1000) * 100;
          xmax = (xmax / 1000) * 100;
        } else if (maxVal <= 1.0 && maxVal > 0) {
          ymin = ymin * 100;
          xmin = xmin * 100;
          ymax = ymax * 100;
          xmax = xmax * 100;
        }
      }
    } else {
      return undefined;
    }
  } else if (typeof raw === "object") {
    ymin = Number(raw.ymin ?? raw.top ?? raw.y ?? raw.y1 ?? 0);
    xmin = Number(raw.xmin ?? raw.left ?? raw.x ?? raw.x1 ?? 0);
    ymax = Number(
      raw.ymax ??
        raw.bottom ??
        raw.y2 ??
        (raw.y !== undefined && raw.height !== undefined ? Number(raw.y) + Number(raw.height) : 0)
    );
    xmax = Number(
      raw.xmax ??
        raw.right ??
        raw.x2 ??
        (raw.x !== undefined && raw.width !== undefined ? Number(raw.x) + Number(raw.width) : 0)
    );

    const maxVal = Math.max(ymin, xmin, ymax, xmax);
    if (maxVal > 100) {
      ymin = (ymin / 1000) * 100;
      xmin = (xmin / 1000) * 100;
      ymax = (ymax / 1000) * 100;
      xmax = (xmax / 1000) * 100;
    } else if (maxVal <= 1.0 && maxVal > 0) {
      ymin = ymin * 100;
      xmin = xmin * 100;
      ymax = ymax * 100;
      xmax = xmax * 100;
    }
  } else {
    return undefined;
  }

  if (ymin > ymax) {
    const tmp = ymin;
    ymin = ymax;
    ymax = tmp;
  }
  if (xmin > xmax) {
    const tmp = xmin;
    xmin = xmax;
    xmax = tmp;
  }

  ymin = Math.max(0, Math.min(99, Math.round(ymin * 10) / 10));
  xmin = Math.max(0, Math.min(99, Math.round(xmin * 10) / 10));
  ymax = Math.max(ymin + 1, Math.min(100, Math.round(ymax * 10) / 10));
  xmax = Math.max(xmin + 1, Math.min(100, Math.round(xmax * 10) / 10));

  if (ymax - ymin < 0.5 && xmax - xmin < 0.5) {
    return undefined;
  }
  if (ymin >= 98 && xmin >= 98) {
    return undefined;
  }

  return { ymin, xmin, ymax, xmax };
}

function tokenizeForMatch(text?: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9₹]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function snapDeclarationToLocalOcrBox(
  decl: ExtractedDeclaration,
  panels?: LocalOcrPanelResult[]
): { bbox: NonNullable<ExtractedDeclaration['bbox']>; box_2d: [number, number, number, number] } | null {
  if (!panels || panels.length === 0) return null;
  const panel =
    panels.find((p) => p.image_id === decl.image_id) ||
    panels.find((p) => p.image_type?.toLowerCase() === decl.image_type?.toLowerCase()) ||
    (panels.length === 1 ? panels[0] : undefined);
  if (!panel?.lines?.length) return null;

  const targetTokens = tokenizeForMatch(decl.original_text || decl.normalized_value);
  if (targetTokens.length === 0) return null;

  let bestLineScore = 0;
  let bestLine: LocalOcrPanelResult['lines'][number] | null = null;
  for (const line of panel.lines) {
    if (!line?.bbox || !line.text) continue;
    const lineTokens = tokenizeForMatch(line.text);
    if (lineTokens.length === 0) continue;
    const matches = targetTokens.filter((t) => lineTokens.some((lt) => lt === t || (t.length >= 3 && lt.includes(t)))).length;
    const score = matches / targetTokens.length;
    if (score > bestLineScore) {
      bestLineScore = score;
      bestLine = line;
    }
  }

  if (bestLine && bestLineScore >= 0.6) {
    const b = bestLine.bbox;
    return {
      bbox: b,
      box_2d: bestLine.box_2d || [
        Math.round(b.ymin * 10),
        Math.round(b.xmin * 10),
        Math.round(b.ymax * 10),
        Math.round(b.xmax * 10),
      ],
    };
  }
  return null;
}

export function mergeLocalAndGeminiDeclarations(
  localDecls: ExtractedDeclaration[],
  geminiDecls: ExtractedDeclaration[],
  localPanels?: LocalOcrPanelResult[]
): ExtractedDeclaration[] {
  if (localDecls.length === 0 && (!localPanels || localPanels.length === 0)) return geminiDecls;
  if (geminiDecls.length === 0) return localDecls;

  const merged: ExtractedDeclaration[] = geminiDecls.map((gDecl) => {
    const localMatch = localDecls.find(
      (l) => l.field === gDecl.field && (!gDecl.image_id || l.image_id === gDecl.image_id)
    );

    if (localMatch?.bbox) {
      const gTokens = tokenizeForMatch(gDecl.original_text || gDecl.normalized_value);
      const lTokens = tokenizeForMatch(localMatch.original_text || localMatch.normalized_value);
      const overlapCount = gTokens.filter((t) => lTokens.some((lt) => lt === t || (t.length >= 3 && lt.includes(t)))).length;
      const textsAgree = gTokens.length === 0 || lTokens.length === 0 || overlapCount > 0;
      const gArea = gDecl.bbox ? (gDecl.bbox.ymax - gDecl.bbox.ymin) * (gDecl.bbox.xmax - gDecl.bbox.xmin) : 0;

      // Prefer verified Tesseract pixel boxes ONLY when local & Gemini text agree (never clobber stylized AI logo boxes like OREO with mismatched local fragments)
      if (textsAgree && (!gDecl.bbox || gArea > 1800 || localMatch.bbox)) {
        return {
          ...gDecl,
          bbox: localMatch.bbox,
          box_2d: localMatch.box_2d,
          original_text: gDecl.original_text || localMatch.original_text,
          normalized_value: gDecl.normalized_value || localMatch.normalized_value,
        };
      }
    }

    // If Gemini found a declaration local parser missed (or texts differed), try snapping to exact local OCR line coordinates
    const snapped = snapDeclarationToLocalOcrBox(gDecl, localPanels);
    if (snapped) {
      return {
        ...gDecl,
        bbox: snapped.bbox,
        box_2d: snapped.box_2d,
        original_text: gDecl.original_text || localMatch?.original_text || '',
        normalized_value: gDecl.normalized_value || localMatch?.normalized_value || '',
      };
    }

    if (!localMatch) return gDecl;

    const gTokensFallback = tokenizeForMatch(gDecl.original_text || gDecl.normalized_value);
    const lTokensFallback = tokenizeForMatch(localMatch.original_text || localMatch.normalized_value);
    const fallbackAgree =
      gTokensFallback.length === 0 ||
      lTokensFallback.length === 0 ||
      gTokensFallback.some((t) => lTokensFallback.some((lt) => lt === t || (t.length >= 3 && lt.includes(t))));

    return {
      ...gDecl,
      bbox: gDecl.bbox || (fallbackAgree ? localMatch.bbox : undefined),
      box_2d: gDecl.bbox ? gDecl.box_2d : fallbackAgree ? localMatch.box_2d : undefined,
      original_text: gDecl.original_text || localMatch.original_text,
      normalized_value: gDecl.normalized_value || localMatch.normalized_value,
    };
  });

  // Preserve any valid declarations found by local Tesseract OCR that Gemini skipped
  for (const local of localDecls) {
    const alreadyPresent = merged.some(
      (m) => m.field === local.field && (m.found || m.image_id === local.image_id)
    );
    if (!alreadyPresent && local.found) {
      merged.push(local);
    }
  }

  return merged;
}

function deriveImageQualityFromInputs(
  images: InspectionImage[],
  panels?: LocalOcrPanelResult[],
  hasLocalOcrText?: boolean
): { overall: "GOOD" | "FAIR" | "POOR"; issues: string[] } {
  const issues: string[] = [];
  let hasPoor = false;
  let hasFair = false;

  for (const img of images) {
    if (img.quality?.overall === "POOR") hasPoor = true;
    if (img.quality?.overall === "FAIR") hasFair = true;
    if (img.quality?.issues?.length) {
      issues.push(...img.quality.issues);
    }
  }
  for (const p of panels || []) {
    if (p.quality?.overall === "POOR") hasPoor = true;
    if (p.quality?.overall === "FAIR") hasFair = true;
  }

  if (issues.length === 0 && !hasLocalOcrText) {
    issues.push("Automated text readability could not be verified without manual check.");
  }

  return {
    overall: hasPoor ? "POOR" : hasFair ? "FAIR" : "GOOD",
    issues: Array.from(new Set(issues)),
  };
}

export async function analyzePackageImagesWithGemini(
  images: InspectionImage[],
  category: ProductCategory,
  metadata?: { productName?: string; brand?: string; barcode?: string; demoPresetId?: string },
  allowFallbackOrOptions: boolean | AnalysisExecutionOptions = true
): Promise<MultimodalAnalysisResult> {
  const options: AnalysisExecutionOptions =
    typeof allowFallbackOrOptions === "boolean"
      ? { allowFallback: allowFallbackOrOptions }
      : allowFallbackOrOptions || {};

  const demoPresetId = metadata?.demoPresetId || images.find((image) => image.demo_preset_id)?.demo_preset_id;
  let preprocessedImages: MultimodalAnalysisResult["preprocessed_images"] = undefined;

  // 1. Calibrated demo presets bypass Gemini entirely
  if (demoPresetId && isDemoPresetId(demoPresetId)) {
    try {
      const prep = await prepareMultimodalImageParts(images);
      preprocessedImages = prep.preprocessedImages;
    } catch {
      // SVG demo presets can skip sharp preprocessing
    }
    const demoResult = getDemoFallbackExtraction(demoPresetId, images);
    if (demoResult) {
      return {
        ...demoResult,
        ocr_completed: true,
        ai_assisted_completed: false,
        ai_status: "DEMO_PRESET",
        preprocessed_images: preprocessedImages,
      };
    }
  }

  // 2. Check response cache & in-flight deduplication when cacheKey is supplied
  if (options.requestCacheKey) {
    const cached = getCachedAnalysisResponse<MultimodalAnalysisResult>(options.requestCacheKey);
    if (cached) return cached;

    const existingPromise = getInFlightAnalysis<MultimodalAnalysisResult>(options.requestCacheKey);
    if (existingPromise) return existingPromise;
  }

  const execute = async (): Promise<MultimodalAnalysisResult> => {
    const runtimeConfig = getAiRuntimeConfig();
    const client = getGeminiClient();

    // Respect admin toggle or explicit skipAi flag
    if (options.skipAi || !runtimeConfig.aiEnabled) {
      try {
        const prep = await prepareMultimodalImageParts(images);
        preprocessedImages = prep.preprocessedImages;
      } catch {
        // Optional sharp preview enrichment
      }
      return generateFallbackExtraction(
        images,
        category,
        metadata,
        preprocessedImages,
        options.localOcr,
        "SKIPPED",
        ADVISORY_AI_SKIPPED
      );
    }

    const candidateModels = getOrderedCandidateModels();
    if (!client || candidateModels.length === 0) {
      try {
        const prep = await prepareMultimodalImageParts(images);
        preprocessedImages = prep.preprocessedImages;
      } catch {
        // Optional sharp preview enrichment
      }
      const advisory = ADVISORY_AI_UNAVAILABLE;
      return generateFallbackExtraction(
        images,
        category,
        metadata,
        preprocessedImages,
        options.localOcr,
        "UNAVAILABLE",
        advisory
      );
    }

    try {
      const parts: any[] = [];
      try {
        const prepResult = await prepareMultimodalImageParts(images);
        preprocessedImages = prepResult.preprocessedImages;
        parts.push(...prepResult.parts);
      } catch (prepErr) {
        // If Sharp cannot decode an exotic payload, still allow text-augmented Gemini analysis if OCR text exists
        if (!options.localOcr?.panels?.length) {
          throw prepErr;
        }
      }

      const localOcrTextSummary = (options.localOcr?.panels || [])
        .map((p, idx) => {
          const snippet = (p.text || "").trim().slice(0, 1400);
          return snippet
            ? `Panel #${idx} (${p.image_type}, OCR conf ${Math.round((p.confidence || 0) * 100)}%):\n${snippet}`
            : "";
        })
        .filter(Boolean)
        .join("\n\n");

      const systemPrompt = `You are LEGALMETRIX, an AI-assisted Legal Metrology Multimodal Compliance Engine built for the Department of Consumer Affairs (DoCA), Government of India (SIH 2026 - PS 26034).

Your objective is to inspect consumer packaging labels (and assist local Tesseract OCR text where provided), extract mandatory statutory declarations required under the Legal Metrology (Packaged Commodities) Rules, 2011, and output structured JSON with precise 2D bounding boxes.

CRITICAL VISION EXTRACTION PROTOCOLS:
1. Set "is_package_detected": false ONLY if the image contains no retail packaged product.
2. Extract verbatim text; mark degraded/obscured text as "UNCERTAIN" (confidence 0.35-0.65).
3. Provide "box_2d": [ymin, xmin, ymax, xmax] on 0-1000 scale tightly enclosing text or stylized brand wordmarks on the exact "image_index", "image_id", and "image_type".
4. ALWAYS extract stylized/3D/illustrated trademarks on the Front panel (e.g. OREO, Cadbury, Britannia, Maggi, Lay's, Parle, Amul) as "brand_name" with tight box_2d around the brand logo — NEVER mistake flavor/variant badges (e.g. "Original", "Classic") or clipped fragments for brand_name or product_name. Extract the generic commodity description (e.g. "Chocolatey Sandwich Biscuits", "Digestive Biscuits") as "product_name".
5. Strictly separate Front vs Back panel declarations (no cross-panel bleed).
6. Return ONLY raw JSON matching:
{
  "is_package_detected": true,
  "product": { "name": "", "brand": "", "category": "" },
  "declarations": [
    {
      "field": "product_name|brand_name|sub_brand|front_claims|veg_non_veg|net_quantity|manufacturer_name|packer_name|importer_name|country_of_origin|mrp|unit_sale_price|mfg_date|best_before|use_by|consumer_care|consumer_care_phone|consumer_care_email|batch_number|barcode",
      "label": "",
      "original_text": "",
      "original_script_text": null,
      "script": null,
      "translated_en": null,
      "found": true,
      "status": "FOUND|NOT_FOUND|UNCERTAIN",
      "confidence": 0.95,
      "image_index": 0,
      "image_id": "img-id",
      "image_type": "Front|Back|Side",
      "box_2d": [0, 0, 100, 100]
    }
  ],
  "image_quality": { "overall": "GOOD|FAIR|POOR", "issues": [] },
  "ai_notes": ""
}`;

      const userPrompt = `Analyze the attached ${images.length} packaged commodity image(s) for Legal Metrology Rule 6 & Schedule II declarations.
Category Hint: ${category}
Provided Metadata: Name=${metadata?.productName || "Auto-detect"}, Brand=${metadata?.brand || "Auto-detect"}, Barcode=${metadata?.barcode || "None"}
Images: ${images.map((im, i) => `Image #${i} [id: "${im.id}", view: "${im.type || "Panel"}"]`).join(", ")}
${localOcrTextSummary ? `\nLocal Tesseract OCR pre-extracted text (verify and enhance semantically):\n${localOcrTextSummary}\n` : ""}
Return strictly raw JSON.`;

      parts.push({ text: userPrompt });

      const maxRetries = options.maxRetriesOverride ?? runtimeConfig.maxRetries;
      const baseDelayMs = options.retryBaseDelayMsOverride ?? 700;

      let response: any = null;
      let successfulModel = "";
      let lastAiStatus: AiAnalysisStatus = "UNAVAILABLE";
      let lastAdvisory = ADVISORY_AI_UNAVAILABLE;

      for (const modelName of candidateModels) {
        const thinkingLevel = modelName === "gemini-3.1-flash-lite" ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;
        const maxAttemptsFor503 = Math.max(1, Math.min(3, maxRetries)) + 1; // 1 initial + up to maxRetries retries on 503
        let stopAllCandidates = false;

        for (let attempt = 0; attempt < maxAttemptsFor503; attempt++) {
          let timerId: ReturnType<typeof setTimeout> | undefined;
          try {
            const timeoutPromise = new Promise((_, reject) => {
              timerId = setTimeout(
                () => reject(new Error(`Model ${modelName} timed out after ${runtimeConfig.timeoutMs}ms`)),
                runtimeConfig.timeoutMs
              );
            });

            const callPromise = client.models.generateContent({
              model: modelName,
              contents: { parts },
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingLevel },
              },
            });

            const res: any = await Promise.race([callPromise, timeoutPromise]);
            if (timerId) clearTimeout(timerId);

            if (res && res.text) {
              response = res;
              successfulModel = modelName;
              recordModelSuccess(modelName);
              break;
            }
            recordModelFailure(modelName, {
              category: "UNKNOWN",
              retryable: false,
              dailyExhausted: false,
              safeReason: "Empty model response",
            });
            break;
          } catch (err: any) {
            if (timerId) clearTimeout(timerId);
            const classified = classifyGeminiError(err);

            if (classified.category === "SERVICE_UNAVAILABLE" && attempt < maxAttemptsFor503 - 1) {
              const backoffMs = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
              console.log(
                `[LegalMetrix Vision] Model ${modelName} transient unavailability; retry ${attempt + 1}/${maxAttemptsFor503 - 1} in ${backoffMs}ms.`
              );
              await new Promise((r) => setTimeout(r, backoffMs));
              continue;
            }

            recordModelFailure(modelName, classified);
            console.log(
              `[LegalMetrix Vision] Model ${modelName} skipped (${classified.category}): ${classified.safeReason}`
            );

            if (classified.category === "CONFIG_OR_AUTH_ERROR") {
              lastAiStatus = "CONFIG_ERROR";
              lastAdvisory = ADVISORY_AI_CONFIG_ERROR;
              stopAllCandidates = true;
            } else {
              lastAiStatus = "UNAVAILABLE";
              lastAdvisory = ADVISORY_AI_UNAVAILABLE;
            }
            break;
          }
        }

        if ((response && response.text) || stopAllCandidates) break;
      }

      if (!response || !response.text) {
        return generateFallbackExtraction(
          images,
          category,
          metadata,
          preprocessedImages,
          options.localOcr,
          lastAiStatus,
          lastAdvisory
        );
      }

      let parsed: any;
      try {
        const cleanedJson = cleanJsonText(response.text);
        parsed = JSON.parse(cleanedJson);
      } catch (parseErr: any) {
        console.log(
          "[LegalMetrix Vision] Failed to parse Gemini JSON output; preserving local OCR declarations:",
          parseErr?.message || parseErr
        );
        return generateFallbackExtraction(
          images,
          category,
          metadata,
          preprocessedImages,
          options.localOcr,
          "UNAVAILABLE",
          ADVISORY_AI_UNAVAILABLE
        );
      }

      let isPackageDetected = parsed.is_package_detected !== false;
      const hasAnyFoundDeclarations = (parsed.declarations || []).some(
        (d: any) => d.found && d.original_text && d.original_text.trim().length > 0
      );
      const hasProductInfo = !!(typeof parsed.product?.name === 'string' && !parsed.product.name.toLowerCase().includes("non-packaged"));
      if (
        !isPackageDetected &&
        (hasAnyFoundDeclarations ||
          hasProductInfo ||
          (options.localOcr?.declarations?.length || 0) > 0 ||
          (metadata?.productName && metadata.productName !== "Packaged Commodity"))
      ) {
        isPackageDetected = true;
      }

      const backImg = images.find(
        (img) => img.type?.trim().toLowerCase() === "back" || img.id?.toLowerCase().includes("back")
      );
      const frontImg =
        images.find((img) => img.type?.trim().toLowerCase() === "front" || img.id?.toLowerCase().includes("front")) ||
        images[0];

      const geminiDeclarations: ExtractedDeclaration[] = (parsed.declarations || []).map((decl: any, index: number) => {
        let targetImg: InspectionImage | undefined = undefined;
        if (decl.image_id) targetImg = images.find((img) => img.id === decl.image_id);
        if (!targetImg && typeof decl.image_index === "number" && images[decl.image_index]) {
          targetImg = images[decl.image_index];
        }
        if (!targetImg && decl.image_type) {
          targetImg = images.find((img) => img.type?.trim().toLowerCase() === decl.image_type?.trim().toLowerCase());
        }

        const isBackPanelField = [
          "manufacturer_name",
          "packer_name",
          "importer_name",
          "consumer_care",
          "consumer_care_phone",
          "consumer_care_email",
          "barcode",
          "batch_number",
          "best_before",
          "use_by",
          "fssai_license",
        ].includes(decl.field);

        if (backImg && isBackPanelField) {
          if (!targetImg || targetImg.id === frontImg?.id || targetImg.type?.toLowerCase() === "front") {
            targetImg = backImg;
          }
        }

        const isFrontPanelField = [
          "product_name",
          "brand",
          "brand_name",
          "sub_brand",
          "front_claims",
          "veg_non_veg",
        ].includes(decl.field);
        if (frontImg && isFrontPanelField && (!targetImg || targetImg.id === backImg?.id)) {
          targetImg = frontImg;
        }

        if (!targetImg) {
          targetImg = images[0] || { id: "img-0", type: "Front", url: "", name: "Front Panel" };
        }

        let normVal = decl.original_text || "";
        if (decl.found && decl.original_text) {
          if (decl.field === "mrp") normVal = normalizeMRP(decl.original_text).normalized;
          else if (decl.field === "net_quantity") normVal = normalizeNetQuantity(decl.original_text).normalized;
          else if (decl.field === "mfg_date" || decl.field === "best_before")
            normVal = normalizeDate(decl.original_text).normalized;
          else if (decl.field === "consumer_care_phone") normVal = normalizePhone(decl.original_text);
          else if (decl.field === "consumer_care_email") normVal = normalizeEmail(decl.original_text);
        }

        const rawConf =
          typeof decl.confidence === "number" ? (decl.confidence > 1 ? decl.confidence / 100 : decl.confidence) : 0.85;
        let statusVal: DeclarationStatus = "FOUND";
        if (!decl.found || !isPackageDetected) {
          statusVal = "NOT_FOUND";
        } else if (rawConf < 0.7 || decl.status === "UNCERTAIN") {
          statusVal = "UNCERTAIN";
        }

        const rawField = typeof decl.field === "string" ? decl.field.trim().toLowerCase() : "";
        const canonicalField =
          rawField === "brand" || rawField === "trademark" || rawField === "brand_owner"
            ? "brand_name"
            : rawField === "commodity" ||
              rawField === "commodity_name" ||
              rawField === "generic_name" ||
              rawField === "product"
            ? "product_name"
            : rawField;

        const rawBox = decl.box_2d ?? decl.bbox ?? decl.bounds;
        const isFromBox2d = Array.isArray(decl.box_2d) && decl.box_2d.length >= 4;
        const normalizedBox = normalizeBbox(rawBox, isFromBox2d);

        return {
          id: `decl-${index + 1}`,
          field: canonicalField || decl.field,
          label: decl.label || canonicalField || decl.field,
          original_text: decl.original_text || "",
          original_script_text: decl.original_script_text,
          script: decl.script,
          transliterated_en: decl.transliterated_en || decl.translated_en,
          translated_en: decl.translated_en,
          normalized_value: normVal,
          found: isPackageDetected && !!decl.found,
          status: statusVal,
          confidence: isPackageDetected ? Math.min(1.0, Math.max(0.0, rawConf)) : 0.0,
          image_id: targetImg.id,
          image_type: targetImg.type,
          bbox: normalizedBox,
          box_2d: normalizedBox
            ? [
                Math.round(normalizedBox.ymin * 10),
                Math.round(normalizedBox.xmin * 10),
                Math.round(normalizedBox.ymax * 10),
                Math.round(normalizedBox.xmax * 10),
              ]
            : undefined,
        };
      });

      // Ensure brand identified in parsed.product.brand isn't replaced by a noisy local OCR fragment
      const parsedBrand = typeof parsed.product?.brand === "string" ? parsed.product.brand.trim() : "";
      const hasValidParsedBrand =
        Boolean(parsedBrand) && !/^(?:packaged brand|unspecified brand|n\/a|unknown)$/i.test(parsedBrand);
      if (hasValidParsedBrand && !geminiDeclarations.some((d) => d.field === "brand_name" && d.found)) {
        const brandDecl: ExtractedDeclaration = {
          id: `decl-brand-${geminiDeclarations.length + 1}`,
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: parsedBrand,
          normalized_value: parsedBrand,
          found: isPackageDetected,
          status: isPackageDetected ? "FOUND" : "NOT_FOUND",
          confidence: 0.9,
          image_id: frontImg?.id || images[0]?.id || "img-0",
          image_type: frontImg?.type || "Front",
        };
        const snappedBrand = snapDeclarationToLocalOcrBox(brandDecl, options.localOcr?.panels);
        if (snappedBrand) {
          brandDecl.bbox = snappedBrand.bbox;
          brandDecl.box_2d = snappedBrand.box_2d;
        }
        geminiDeclarations.push(brandDecl);
      }

      // Merge local OCR declarations with Gemini output so local pixel-accurate boxes are never clobbered
      const localDecls = options.localOcr?.declarations || [];
      const mergedDeclarations = mergeLocalAndGeminiDeclarations(
        localDecls,
        geminiDeclarations,
        options.localOcr?.panels
      );

      const finalResult: MultimodalAnalysisResult = {
        is_package_detected: isPackageDetected,
        product: {
          name:
            parsed.product?.name ||
            metadata?.productName ||
            (isPackageDetected ? "Inspected Packaged Item" : "Non-Packaged Commodity"),
          brand: parsed.product?.brand || metadata?.brand || (isPackageDetected ? "Packaged Brand" : "N/A"),
          category: parsed.product?.category || category,
        },
        declarations: mergedDeclarations,
        image_quality: {
          overall: (parsed.image_quality?.overall as "GOOD" | "FAIR" | "POOR") || "GOOD",
          issues: parsed.image_quality?.issues || [],
        },
        warnings:
          parsed.warnings ||
          (isPackageDetected ? [] : ["No retail packaged commodity or statutory declarations detected in image"]),
        ai_notes: parsed.ai_notes || `Hybrid screening completed using local OCR and ${successfulModel}.`,
        is_fallback: false,
        ocr_completed: Boolean(options.localOcr?.panels?.length || localDecls.length),
        ai_assisted_completed: true,
        ai_status: "COMPLETED",
        ai_model_used: successfulModel,
        ocr_panels: options.localOcr?.panels,
        preprocessed_images: preprocessedImages,
      };

      if (options.requestCacheKey) {
        setCachedAnalysisResponse(options.requestCacheKey, finalResult);
      }
      return finalResult;
    } catch (error: any) {
      const classified = classifyGeminiError(error);
      const aiStatus: AiAnalysisStatus =
        classified.category === "CONFIG_OR_AUTH_ERROR" ? "CONFIG_ERROR" : "UNAVAILABLE";
      const advisory =
        classified.category === "CONFIG_OR_AUTH_ERROR" ? ADVISORY_AI_CONFIG_ERROR : ADVISORY_AI_UNAVAILABLE;

      console.log("[LegalMetrix Vision] Engaging resilient local OCR fallback:", classified.safeReason);
      return generateFallbackExtraction(
        images,
        category,
        metadata,
        preprocessedImages,
        options.localOcr,
        aiStatus,
        advisory
      );
    }
  };

  const promise = execute();
  if (options.requestCacheKey) {
    setInFlightAnalysis(options.requestCacheKey, promise);
  }
  return promise;
}

export function generateFallbackExtraction(
  images: InspectionImage[],
  category: ProductCategory,
  metadata?: { productName?: string; brand?: string; barcode?: string; demoPresetId?: string },
  preprocessedImages?: MultimodalAnalysisResult["preprocessed_images"],
  localOcr?: LocalOcrContext,
  aiStatus: AiAnalysisStatus = "UNAVAILABLE",
  advisoryMessage: string = ADVISORY_AI_UNAVAILABLE
): MultimodalAnalysisResult {
  const demoPresetId = metadata?.demoPresetId || images.find((image) => image.demo_preset_id)?.demo_preset_id;
  const demoProfile = getDemoFallbackExtraction(demoPresetId, images);
  if (demoProfile) {
    return {
      ...demoProfile,
      ocr_completed: true,
      ai_assisted_completed: false,
      ai_status: "DEMO_PRESET",
      preprocessed_images: preprocessedImages || demoProfile.preprocessed_images,
    };
  }

  // 1. Local OCR & Deterministic Rule-Based Extraction (Primary non-Gemini source)
  const panels = localOcr?.panels || [];
  const hasLocalPanelText = panels.some((p) => (p.text || "").trim().length > 0);
  let resolvedDeclarations = localOcr?.declarations ? [...localOcr.declarations] : [];
  let inferredName: string | undefined;
  let inferredBrand: string | undefined;
  let localWarnings: string[] = [];

  if (resolvedDeclarations.length === 0 && hasLocalPanelText) {
    const parsed = extractDeclarationsFromOcrPanels(panels, {
      productHint: metadata?.productName,
      brandHint: metadata?.brand,
      barcodeHint: metadata?.barcode,
    });
    resolvedDeclarations = parsed.declarations;
    inferredName = parsed.inferredProduct.name;
    inferredBrand = parsed.inferredProduct.brand;
    localWarnings = parsed.warnings;
  } else if (resolvedDeclarations.length > 0) {
    inferredName = resolvedDeclarations.find((d) => d.field === "product_name")?.normalized_value;
    inferredBrand = resolvedDeclarations.find((d) => d.field === "brand_name")?.normalized_value;
  }

  if (resolvedDeclarations.length > 0 || hasLocalPanelText) {
    const prodName = metadata?.productName?.trim() || inferredName || "Scanned Packaged Commodity";
    const brandName = metadata?.brand?.trim() || inferredBrand || "Unspecified Brand";
    const quality = deriveImageQualityFromInputs(images, panels, hasLocalPanelText);

    return {
      is_package_detected: true,
      product: {
        name: prodName,
        brand: brandName,
        category,
      },
      declarations: resolvedDeclarations,
      image_quality: quality,
      warnings: Array.from(new Set([...localWarnings])),
      ai_notes:
        aiStatus === "SKIPPED"
          ? "Local Tesseract.js OCR extraction and deterministic Legal Metrology validation completed."
          : "Local Tesseract.js OCR extraction and deterministic Legal Metrology validation completed while AI enhancement was unavailable.",
      is_fallback: true,
      ocr_completed: true,
      ai_assisted_completed: false,
      ai_status: aiStatus,
      advisory_message: advisoryMessage,
      ocr_panels: panels,
      preprocessed_images: preprocessedImages,
    };
  }

  // 2. Last-resort manual inspection template when neither local OCR text nor Gemini was available
  const frontImg =
    images.find((i) => i.type === "Front") || images[0] || { id: "img-front", type: "Front", url: "", name: "" };
  const backImg = images.find((i) => i.type === "Back") || images[1] || frontImg;

  const prodName = metadata?.productName?.trim() || "Captured Commodity";
  const brandName = metadata?.brand?.trim() || "Unspecified Brand";

  const declarations: ExtractedDeclaration[] = [
    {
      id: "decl-1",
      field: "product_name",
      label: "Generic / Common Product Name",
      original_text: metadata?.productName || "",
      normalized_value: metadata?.productName || "",
      found: !!metadata?.productName,
      status: metadata?.productName ? "FOUND" : "UNCERTAIN",
      confidence: metadata?.productName ? 0.85 : 0.25,
      image_id: frontImg.id,
      image_type: frontImg.type,
      notes: "Metadata entry pending visual label verification.",
    },
    {
      id: "decl-2",
      field: "net_quantity",
      label: "Net Quantity",
      original_text: "",
      normalized_value: "",
      found: false,
      status: "NOT_FOUND",
      confidence: 0.0,
      image_id: frontImg.id,
      image_type: frontImg.type,
      notes: "Could not be automatically verified from image. Officer manual review required.",
    },
    {
      id: "decl-3",
      field: "mrp",
      label: "Maximum Retail Price (MRP)",
      original_text: "",
      normalized_value: "",
      found: false,
      status: "NOT_FOUND",
      confidence: 0.0,
      image_id: backImg.id,
      image_type: backImg.type,
      notes: "Could not be automatically verified from image. Officer manual review required.",
    },
    {
      id: "decl-4",
      field: "manufacturer_name",
      label: "Manufacturer Name & Address",
      original_text: metadata?.brand || "",
      normalized_value: metadata?.brand || "",
      found: !!metadata?.brand,
      status: metadata?.brand ? "UNCERTAIN" : "NOT_FOUND",
      confidence: metadata?.brand ? 0.55 : 0.0,
      image_id: backImg.id,
      image_type: backImg.type,
      notes: "Full postal address required under Rule 6(1)(a).",
    },
    {
      id: "decl-5",
      field: "mfg_date",
      label: "Month & Year of Manufacture",
      original_text: "",
      normalized_value: "",
      found: false,
      status: "NOT_FOUND",
      confidence: 0.0,
      image_id: backImg.id,
      image_type: backImg.type,
    },
    {
      id: "decl-6",
      field: "consumer_care",
      label: "Consumer Care Details",
      original_text: "",
      normalized_value: "",
      found: false,
      status: "NOT_FOUND",
      confidence: 0.0,
      image_id: backImg.id,
      image_type: backImg.type,
    },
    {
      id: "decl-7",
      field: "country_of_origin",
      label: "Country of Origin",
      original_text: "",
      normalized_value: "",
      found: false,
      status: "NOT_FOUND",
      confidence: 0.0,
      image_id: backImg.id,
      image_type: backImg.type,
    },
  ];

  return {
    is_package_detected: true,
    product: {
      name: prodName,
      brand: brandName,
      category,
    },
    declarations,
    image_quality: deriveImageQualityFromInputs(images, panels, false),
    warnings: [
      "No machine-readable text could be extracted automatically from the uploaded image.",
      "Declarations flagged for manual physical verification.",
    ],
    ai_notes:
      "Image capture recorded in secure chain of custody. Mandatory declarations pending officer physical inspection.",
    is_fallback: true,
    ocr_completed: false,
    ai_assisted_completed: false,
    ai_status: aiStatus,
    advisory_message: advisoryMessage,
    preprocessed_images: preprocessedImages,
  };
}

export interface FrontRecalibrationResult {
  declarations: ExtractedDeclaration[];
  ai_status: AiAnalysisStatus;
  ai_assisted_completed: boolean;
  advisory_message?: string;
  ai_model_used?: string;
}

/**
 * Specialized Front Panel OCR Recalibration Engine.
 * Uses local OCR + Gemini enhancement when healthy, and falls back gracefully without failing on 429/503.
 */
export async function recalibrateFrontOcr(
  frontImage: InspectionImage,
  metadata?: {
    productName?: string;
    brand?: string;
    category?: ProductCategory;
    barcode?: string;
    demoPresetId?: string;
    localOcr?: LocalOcrContext;
  }
): Promise<FrontRecalibrationResult> {
  const demoPresetId = metadata?.demoPresetId || frontImage.demo_preset_id;
  if (demoPresetId && isDemoPresetId(demoPresetId)) {
    const presetDeclarations = getDemoFrontRecalibration(demoPresetId, frontImage);
    if (presetDeclarations) {
      return {
        declarations: presetDeclarations,
        ai_status: "DEMO_PRESET",
        ai_assisted_completed: false,
      };
    }
  }

  const result = await analyzePackageImagesWithGemini(
    [frontImage],
    metadata?.category || "Food",
    { productName: metadata?.productName, brand: metadata?.brand, barcode: metadata?.barcode },
    {
      allowFallback: true,
      localOcr: metadata?.localOcr,
    }
  );

  return {
    declarations: result.declarations.filter(
      (declaration) => declaration.image_id === frontImage.id || declaration.image_type === "Front"
    ),
    ai_status: result.ai_status,
    ai_assisted_completed: result.ai_assisted_completed,
    advisory_message: result.advisory_message,
    ai_model_used: result.ai_model_used,
  };
}
