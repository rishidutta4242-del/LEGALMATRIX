import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { verifyInspection, recalibrateFrontOcrApi, calibrateBoxApi } from '../services/api';
import { ExtractedDeclaration, ImageBoundingBox } from '../types/index';
import { runTesseractOcrOnImage } from '../utils/tesseractOcr';
import { extractDeclarationsFromOcrPanels } from '../utils/ocrFieldParser';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowLeft,
  CameraOff,
  PackageOpen,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Gavel,
  Database,
  FileCheck,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Tag,
  Hash,
  Crosshair,
  Info,
  Eye
} from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUtils';
import { PREDEFINED_DEMO_PACKAGES } from '../data/demoPackages';

export function getShortFieldLabel(field: string, originalLabel: string): string {
  const map: Record<string, string> = {
    brand_name: 'Brand',
    product_name: 'Commodity',
    sub_brand: 'Sub-Brand',
    net_quantity: 'Net Qty',
    mrp: 'MRP',
    unit_sale_price: 'Unit Price',
    manufacturer_name: 'Manufacturer',
    packer_name: 'Packer',
    importer_name: 'Importer',
    mfg_date: 'Pack/Mfg Date',
    best_before: 'Best Before',
    use_by: 'Use By',
    consumer_care: 'Consumer Care',
    consumer_care_phone: 'Care Phone',
    consumer_care_email: 'Care Email',
    country_of_origin: 'Origin',
    batch_number: 'Batch No',
    barcode: 'Barcode',
    veg_non_veg: 'Veg Mark',
    front_claims: 'Claims'
  };
  return map[field] || originalLabel.split(' ')[0] || field;
}

function normalizeBbox(
  raw: any,
  isExplicitBox2d = false,
  isExplicitPctBbox = false
): { ymin: number; xmin: number; ymax: number; xmax: number } | null {
  if (!raw) return null;

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
        // Gemini / Tesseract box_2d is strictly 0..1000 integer scale
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
        } else if (!isExplicitPctBbox && maxVal <= 1.0 && maxVal > 0) {
          ymin = ymin * 100;
          xmin = xmin * 100;
          ymax = ymax * 100;
          xmax = xmax * 100;
        }
      }
    } else {
      return null;
    }
  } else if (typeof raw === 'object') {
    ymin = Number(raw.ymin ?? raw.top ?? raw.y ?? raw.y1 ?? 0);
    xmin = Number(raw.xmin ?? raw.left ?? raw.x ?? raw.x1 ?? 0);
    ymax = Number(
      (raw.ymax ?? raw.bottom ?? (raw.y !== undefined && raw.height !== undefined ? Number(raw.y) + Number(raw.height) : raw.y2)) ?? 0
    );
    xmax = Number(
      (raw.xmax ?? raw.right ?? (raw.x !== undefined && raw.width !== undefined ? Number(raw.x) + Number(raw.width) : raw.x2)) ?? 0
    );

    const maxVal = Math.max(ymin, xmin, ymax, xmax);
    if (maxVal > 100) {
      ymin = (ymin / 1000) * 100;
      xmin = (xmin / 1000) * 100;
      ymax = (ymax / 1000) * 100;
      xmax = (xmax / 1000) * 100;
    } else if (!isExplicitPctBbox && maxVal <= 1.0 && maxVal > 0) {
      ymin = ymin * 100;
      xmin = xmin * 100;
      ymax = ymax * 100;
      xmax = xmax * 100;
    }
  } else {
    return null;
  }

  // Ensure min < max
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

  // Round to 1 decimal place and clamp between 0 and 100
  ymin = Math.max(0, Math.min(99, Math.round(ymin * 10) / 10));
  xmin = Math.max(0, Math.min(99, Math.round(xmin * 10) / 10));
  ymax = Math.max(ymin + 1, Math.min(100, Math.round(ymax * 10) / 10));
  xmax = Math.max(xmin + 1, Math.min(100, Math.round(xmax * 10) / 10));

  // If the box is completely collapsed, return null
  if (ymax - ymin < 0.5 && xmax - xmin < 0.5) {
    return null;
  }
  if (ymin >= 98 && xmin >= 98) {
    return null;
  }

  return { ymin, xmin, ymax, xmax };
}

export const EvidenceViewer: React.FC = () => {
  const {
    currentInspection,
    setCurrentInspection,
    selectedEvidenceField,
    setSelectedEvidenceField,
    officerName,
    officerRole,
    showToast,
    setActiveView
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [boxDisplayMode, setBoxDisplayMode] = useState<'tags' | 'pins' | 'reticles'>('tags');
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [selectedDeclId, setSelectedDeclId] = useState<string | null>(null);
  const [isRecalibrating, setIsRecalibrating] = useState<boolean>(false);
  const [officerNote, setOfficerNote] = useState<string>('');
  const [showPredefinedBenchmark, setShowPredefinedBenchmark] = useState<boolean>(true);
  const [imageLayer, setImageLayer] = useState<'original' | 'enhanced' | 'threshold'>('original');
  const [isPreprocessing, setIsPreprocessing] = useState<boolean>(false);

  // Overall Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideStatus, setOverrideStatus] = useState<'PASS' | 'FAIL' | 'REVIEW'>('PASS');
  const [overrideRemarks, setOverrideRemarks] = useState<string>('');

  const matchedPreset = useMemo(() => {
    return currentInspection?.demo_preset_id
      ? PREDEFINED_DEMO_PACKAGES.find((preset) => preset.id === currentInspection.demo_preset_id) || null
      : null;
  }, [currentInspection]);

  const activeImage = currentInspection?.images?.[activeImageIndex] || currentInspection?.images?.[0];
  const isNoPackageDetected =
    currentInspection?.status === 'NO_PACKAGE_DETECTED' ||
    currentInspection?.is_package_detected === false ||
    activeImage?.quality?.issues?.some((issue) => (issue || '').toLowerCase().includes('no statutory package') || (issue || '').toLowerCase().includes('no package'));

  // Auto switch active image when a user selects a declaration in the side list
  useEffect(() => {
    if (!selectedEvidenceField || !currentInspection?.images?.length) return;
    const decl = currentInspection.declarations?.find((d) => d.field === selectedEvidenceField);
    if (!decl) return;

    let targetIdx = -1;
    if (decl.image_id) {
      targetIdx = currentInspection.images.findIndex((img) => img.id === decl.image_id);
    }
    if (targetIdx === -1 && decl.image_type) {
      targetIdx = currentInspection.images.findIndex(
        (img) => (img.type || '').trim().toLowerCase() === (decl.image_type || '').trim().toLowerCase()
      );
    }
    if (targetIdx === -1 && currentInspection.images.length > 1) {
      const isBackField = [
        'manufacturer_name',
        'packer_name',
        'importer_name',
        'consumer_care',
        'consumer_care_phone',
        'consumer_care_email',
        'barcode',
        'batch_number',
        'best_before',
        'use_by',
        'fssai_license',
      ].includes(decl.field);
      if (isBackField) {
        targetIdx = currentInspection.images.findIndex((img) => img.type?.toLowerCase() === 'back');
      } else {
        targetIdx = currentInspection.images.findIndex((img) => img.type?.toLowerCase() === 'front');
      }
    }
    if (targetIdx !== -1 && targetIdx !== activeImageIndex) {
      setActiveImageIndex(targetIdx);
    }
  }, [selectedEvidenceField, currentInspection?.declarations, currentInspection?.images]);

  // Filter declarations for this active image strictly to prevent cross-image hallucination
  const declarationsOnImage = useMemo(() => {
    if (!currentInspection?.declarations || !activeImage) return [];
    const isCurrentFront = activeImage.type?.toLowerCase() === 'front' || activeImageIndex === 0;

    const strictBackFields = [
      'manufacturer_name',
      'packer_name',
      'importer_name',
      'consumer_care',
      'consumer_care_phone',
      'consumer_care_email',
      'barcode',
      'batch_number',
      'best_before',
      'use_by',
      'fssai_license',
      'mrp',
      'unit_sale_price',
      'country_of_origin',
      'mfg_date'
    ];

    const strictFrontFields = ['sub_brand', 'front_claims', 'veg_non_veg'];

    return currentInspection.declarations.filter((d) => {
      // If explicit image_id matches
      if (d.image_id && activeImage.id) {
        if (d.image_id === activeImage.id) return true;
        // If image_id belongs to another image, do not display
        if (currentInspection.images.some((img) => img.id === d.image_id && img.id !== activeImage.id)) {
          return false;
        }
      }

      // If explicit image_type matches
      if (d.image_type && activeImage.type) {
        const dType = (d.image_type || '').trim().toLowerCase();
        const aType = (activeImage.type || '').trim().toLowerCase();
        if (dType === aType) return true;
        if (dType !== aType && ['front', 'back'].includes(dType) && ['front', 'back'].includes(aType)) {
          return false;
        }
      }

      // Single image inspection fallback
      if (currentInspection.images.length === 1) {
        return true;
      }

      // Panel partition enforcement
      if (isCurrentFront) {
        return !strictBackFields.includes(d.field);
      } else {
        return !strictFrontFields.includes(d.field);
      }
    });
  }, [currentInspection?.declarations, currentInspection?.images, activeImage, activeImageIndex]);

  // Anti-collision layout solver for bounding boxes and external CAD micro-tags
  const layoutBoxes = useMemo(() => {
    if (!showBoundingBoxes || isNoPackageDetected || !declarationsOnImage) return [];

    const valid = declarationsOnImage.filter((decl) => {
      const rawBox = decl.bbox ?? (decl as any).box_2d;
      return Boolean(rawBox) && decl.status !== 'NOT_FOUND' && decl.found !== false;
    });

    const mapped = valid
      .map((decl, idx) => {
        const rawBox = decl.bbox ?? (decl as any).box_2d;
        const isBox2d = !decl.bbox && Array.isArray((decl as any).box_2d);
        const isPctBbox = Boolean(decl.bbox);
        const bbox = normalizeBbox(rawBox, isBox2d, isPctBbox);
        if (!bbox) return null;

        const evalItem = currentInspection?.rule_evaluations?.find((r) => r.field === decl.field);
        const status: 'PASS' | 'FAIL' | 'REVIEW' =
          (evalItem?.status as any) || (decl.status === 'FOUND' ? 'PASS' : 'FAIL');

        const top = Math.max(0.5, Math.min(96.5, bbox.ymin));
        const left = Math.max(0.5, Math.min(96.5, bbox.xmin));
        const width = Math.max(2.5, Math.min(99.5 - left, bbox.xmax - bbox.xmin));
        const height = Math.max(2.0, Math.min(99.5 - top, bbox.ymax - bbox.ymin));

        const declId = decl.id || `${decl.field}-${decl.image_id || activeImage?.id || idx}`;

        return {
          decl,
          id: declId,
          field: decl.field,
          label: decl.label,
          shortLabel: getShortFieldLabel(decl.field, decl.label),
          confidence: decl.confidence,
          original_text: decl.original_text,
          normalized_value: decl.normalized_value,
          ruleCitation: evalItem?.rule_id || 'Rule 6(1)',
          ruleTitle: evalItem?.title || decl.label,
          status,
          top,
          left,
          width,
          height,
          bottom: top + height,
          right: left + width
        };
      })
      .filter(Boolean) as any[];

    // Sort top-to-bottom, left-to-right for deterministic pin numbering & clean sweep
    mapped.sort((a, b) => a.top - b.top || a.left - b.left);

    const overlapArea = (
      a: { t: number; l: number; b: number; r: number },
      b: { t: number; l: number; b: number; r: number }
    ) => {
      const ix = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
      const iy = Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
      return ix * iy;
    };

    const placedTags: Array<{ t: number; l: number; b: number; r: number }> = [];
    const placedPins: Array<{ t: number; l: number; b: number; r: number }> = [];
    const boxRects = mapped.map((m) => ({ id: m.id, t: m.top, l: m.left, b: m.bottom, r: m.right }));

    return mapped.map((box, idx) => {
      const pinNumber = idx + 1;
      // Estimate external tag size in % coordinates so tags never collide or cover underlying label text
      const tagW = Math.min(30, Math.max(15, 7 + box.shortLabel.length * 1.35));
      const tagH = 4.6;
      const gap = 0.7;

      const anchorX = box.left;
      const anchorY = box.top;

      const rawCandidates: Array<{ t: number; l: number; ax: number; ay: number }> = [
        // Primary cardinal slots immediately outside the box
        { t: box.top - tagH - gap, l: box.left, ax: box.left, ay: box.top },
        { t: box.bottom + gap, l: box.left, ax: box.left, ay: box.bottom },
        { t: box.top - tagH - gap, l: box.right - tagW, ax: box.right, ay: box.top },
        { t: box.bottom + gap, l: box.right - tagW, ax: box.right, ay: box.bottom },
        { t: box.top, l: box.right + gap, ax: box.right, ay: box.top + box.height / 2 },
        { t: box.top, l: box.left - tagW - gap, ax: box.left, ay: box.top + box.height / 2 },
        // Secondary horizontal shifts along top/bottom tracks
        { t: box.top - tagH - gap, l: box.left + box.width * 0.45, ax: box.left + box.width * 0.5, ay: box.top },
        { t: box.bottom + gap, l: box.left + box.width * 0.45, ax: box.left + box.width * 0.5, ay: box.bottom },
        // Tertiary multi-row fan-out slots when lines are tightly stacked
        { t: box.top - tagH * 2 - gap * 2, l: box.left, ax: box.left, ay: box.top },
        { t: box.bottom + tagH + gap * 2, l: box.left, ax: box.left, ay: box.bottom },
        { t: box.top - tagH - gap, l: box.right + gap, ax: box.right, ay: box.top },
        { t: box.bottom + gap, l: box.right + gap, ax: box.right, ay: box.bottom },
        { t: box.top - tagH - gap, l: box.left - tagW - gap, ax: box.left, ay: box.top },
        { t: box.bottom + gap, l: box.left - tagW - gap, ax: box.left, ay: box.bottom },
        { t: box.top + box.height / 2 - tagH / 2, l: 99 - tagW, ax: box.right, ay: box.top + box.height / 2 },
        { t: box.top + box.height / 2 - tagH / 2, l: 1, ax: box.left, ay: box.top + box.height / 2 }
      ];

      let bestTag = {
        t: Math.max(0.5, Math.min(99.5 - tagH, box.top - tagH - gap)),
        l: Math.max(0.5, Math.min(99.5 - tagW, box.left)),
        ax: anchorX,
        ay: anchorY
      };
      let bestScore = Infinity;

      for (const cand of rawCandidates) {
        const t = Math.max(0.5, Math.min(99.2 - tagH, cand.t));
        const l = Math.max(0.5, Math.min(99.2 - tagW, cand.l));
        const rect = { t, l, b: t + tagH, r: l + tagW };

        let score = 0;
        // Hard penalty for overlapping any previously placed external tag
        for (const pt of placedTags) {
          const padPt = { t: pt.t - 0.5, l: pt.l - 0.6, b: pt.b + 0.5, r: pt.r + 0.6 };
          const area = overlapArea(rect, padPt);
          if (area > 0) score += 2500 + area * 800;
        }
        // Medium penalty for covering any OCR bounding box text area
        for (const br of boxRects) {
          const area = overlapArea(rect, br);
          if (area > 0) score += (br.id === box.id ? 260 : 180) + area * 20;
        }
        // Prefer shortest distance to its own box edge
        const dist = Math.hypot(l - cand.l, t - cand.t) + Math.hypot((l + tagW / 2) - cand.ax, (t + tagH / 2) - cand.ay) * 0.25;
        score += dist;

        if (score < bestScore) {
          bestScore = score;
          bestTag = { t, l, ax: cand.ax, ay: cand.ay };
        }
      }

      placedTags.push({ t: bestTag.t, l: bestTag.l, b: bestTag.t + tagH, r: bestTag.l + tagW });

      // Collision-free circular pin position (top-left, top-right, bottom-left, bottom-right)
      const pinW = 4.2;
      const pinH = 4.2;
      const pinCandidates = [
        { t: box.top - 2.0, l: box.left - 2.0 },
        { t: box.top - 2.0, l: box.right - 2.0 },
        { t: box.bottom - 2.0, l: box.left - 2.0 },
        { t: box.bottom - 2.0, l: box.right - 2.0 },
        { t: box.top - 2.0, l: box.left + 2.8 }
      ];
      let bestPin = pinCandidates[0];
      let bestPinScore = Infinity;
      for (const pc of pinCandidates) {
        const pt = Math.max(0.3, Math.min(99.5 - pinH, pc.t));
        const pl = Math.max(0.3, Math.min(99.5 - pinW, pc.l));
        const rect = { t: pt, l: pl, b: pt + pinH, r: pl + pinW };
        let pScore = 0;
        for (const pp of placedPins) {
          const area = overlapArea(rect, pp);
          if (area > 0) pScore += 1000 + area * 500;
        }
        if (pScore < bestPinScore) {
          bestPinScore = pScore;
          bestPin = { t: pt, l: pl };
        }
      }
      placedPins.push({ t: bestPin.t, l: bestPin.l, b: bestPin.t + pinH, r: bestPin.l + pinW });

      const tagCenterX = Math.max(bestTag.l, Math.min(bestTag.l + tagW, bestTag.ax));
      const tagCenterY = Math.max(bestTag.t, Math.min(bestTag.t + tagH, bestTag.ay));

      return {
        ...box,
        pinNumber,
        tagTop: Math.round(bestTag.t * 10) / 10,
        tagLeft: Math.round(bestTag.l * 10) / 10,
        pinTop: Math.round(bestPin.t * 10) / 10,
        pinLeft: Math.round(bestPin.l * 10) / 10,
        leaderX1: Math.round(bestTag.ax * 10) / 10,
        leaderY1: Math.round(bestTag.ay * 10) / 10,
        leaderX2: Math.round(tagCenterX * 10) / 10,
        leaderY2: Math.round(tagCenterY * 10) / 10
      };
    });
  }, [declarationsOnImage, showBoundingBoxes, isNoPackageDetected, currentInspection?.rule_evaluations, activeImage?.id]);

  const handleRecalibrateFront = async () => {
    if (!currentInspection) return;
    setIsRecalibrating(true);
    try {
      const frontImage =
        currentInspection.images.find((img) => img.type?.toLowerCase() === 'front') ||
        currentInspection.images[0];

      let localOcrPayload: { panel: any; declarations: ExtractedDeclaration[] } | undefined = undefined;
      if (frontImage && !frontImage.url.startsWith('data:image/svg+xml')) {
        try {
          const panel = await runTesseractOcrOnImage(frontImage);
          const isGenericPlaceholder = (val?: string) =>
            !val ||
            /^(?:packaged\s*commodity|scanned\s*packaged\s*commodity|captured\s*commodity|unspecified\s*brand|unknown|n\/a)$/i.test(
              val.trim()
            );
          const parsed = extractDeclarationsFromOcrPanels([panel], {
            productHint: isGenericPlaceholder(currentInspection.product_name)
              ? undefined
              : currentInspection.product_name,
            brandHint: isGenericPlaceholder(currentInspection.brand)
              ? undefined
              : currentInspection.brand,
            barcodeHint: currentInspection.barcode,
          });
          localOcrPayload = { panel, declarations: parsed.declarations };
        } catch (ocrErr) {
          console.warn('Local Tesseract front recalibration warning:', ocrErr);
        }
      }

      const res = await recalibrateFrontOcrApi(currentInspection.id, officerName, localOcrPayload);
      if (res.success && res.inspection) {
        setCurrentInspection(res.inspection);
        if (res.advisory_message && !res.ai_assisted_completed) {
          showToast(`Front Panel local OCR recalibrated. ${res.advisory_message}`, 'info');
        } else {
          showToast('Front Panel OCR recalibrated with precision bounding boxes!', 'success');
        }
        const frontIdx = res.inspection.images.findIndex((img) => img.type?.toLowerCase() === 'front');
        if (frontIdx >= 0) setActiveImageIndex(frontIdx);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to recalibrate Front OCR', 'error');
    } finally {
      setIsRecalibrating(false);
    }
  };

  const handleRunOcrPreprocessing = async () => {
    if (!activeImage?.url) return;
    setIsPreprocessing(true);
    try {
      const res = await fetch('/api/images/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: activeImage.url, name: activeImage.name })
      });
      const data = await res.json();
      if (data.success) {
        const updatedImages = currentInspection.images.map((img, idx) => {
          if (idx === activeImageIndex) {
            return {
              ...img,
              deskewAngleDeg: 0,
              preprocessed_url: data.data.preprocessed_url,
              thresholded_url: data.data.thresholded_url,
              preprocessing_steps: data.data.steps
            };
          }
          return img;
        });
        setCurrentInspection({
          ...currentInspection,
          images: updatedImages
        });
        setImageLayer('enhanced');
        showToast('Sharp OCR Preprocessing Complete: Grayscale + Dynamic Contrast + Otsu Thresholding Applied', 'success');
      } else {
        showToast(data.error || 'Preprocessing failed', 'error');
      }
    } catch (err: any) {
      showToast('Failed to execute backend image preprocessing: ' + err.message, 'error');
    } finally {
      setIsPreprocessing(false);
    }
  };

  const displayedImageUrl = useMemo(() => {
    if (!activeImage) return '';
    if (imageLayer === 'enhanced' && activeImage.preprocessed_url) {
      return activeImage.preprocessed_url;
    }
    if (imageLayer === 'threshold' && activeImage.thresholded_url) {
      return activeImage.thresholded_url;
    }
    return normalizeImageUrl(activeImage.url);
  }, [imageLayer, activeImage]);

  const selectedDeclaration =
    (selectedDeclId && currentInspection?.declarations?.find((d) => d.id === selectedDeclId)) ||
    declarationsOnImage.find((d) => d.field === selectedEvidenceField) ||
    currentInspection?.declarations?.find((d) => d.field === selectedEvidenceField) ||
    declarationsOnImage[0] ||
    currentInspection?.declarations?.[0];

  const selectedEvaluation = currentInspection?.rule_evaluations?.find(
    (r) => r.field === selectedDeclaration?.field
  );

  const handleVerifyDeclaration = async (status: 'PASS' | 'FAIL' | 'REVIEW') => {
    if (!selectedEvaluation) return;

    try {
      const res = await verifyInspection(currentInspection.id, {
        rule_id: selectedEvaluation.rule_id,
        status,
        reason: officerNote || `Officer verified as ${status}`,
        officer_name: officerName
      });
      setCurrentInspection(res.inspection);
      showToast(`Rule ${selectedEvaluation.rule_id} marked as ${status} (Score updated: ${res.inspection.screening_score}%).`, 'success');
      setOfficerNote('');
    } catch (err) {
      showToast('Failed to record verification.', 'error');
    }
  };

  const handleApplyOverallOverride = async () => {
    try {
      const res = await verifyInspection(currentInspection.id, {
        overall_status: overrideStatus,
        status: overrideStatus,
        reason: overrideRemarks || 'Enforcement Officer statutory determination from Visual Evidence chain',
        officer_name: officerName,
        officer_role: officerRole,
        general_remarks: overrideRemarks
      });
      setCurrentInspection(res.inspection);
      setShowOverrideModal(false);
      setOverrideRemarks('');
      showToast(`Overall inspection overridden to ${overrideStatus} (Score: ${res.inspection.screening_score}%).`, 'success');
    } catch (err) {
      showToast('Failed to record statutory override.', 'error');
    }
  };

  const passCount = (currentInspection?.rule_evaluations || []).filter((r) => r.status === 'PASS').length;
  const failCount = (currentInspection?.rule_evaluations || []).filter((r) => r.status === 'FAIL').length;
  const reviewCount = (currentInspection?.rule_evaluations || []).filter((r) => r.status === 'REVIEW').length;

  const zoomIn = () => setZoomLevel((z) => Math.min(4, Number((z + 0.5).toFixed(1))));
  const zoomOut = () => setZoomLevel((z) => Math.max(0.5, Number((z - 0.5).toFixed(1))));
  const resetZoom = () => setZoomLevel(1);

  if (!currentInspection || !currentInspection.images || currentInspection.images.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 space-y-4 shadow-xl">
        <CameraOff className="h-12 w-12 mx-auto text-amber-400" />
        <h2 className="text-lg font-bold text-white">Incomplete Evidence Capture</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No package label images are archived for this inspection record ({currentInspection?.id || 'New'}). Please capture or attach packaging panels before conducting optical evidence review.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={() => setActiveView('compliance_results')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            ← Return to Compliance Screen
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveView('compliance_results')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Results</span>
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {currentInspection.id}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">• Visual Evidence Chain &amp; OCR Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentInspection.product_name}
          </h1>
        </div>

        {/* View Switcher Tabs (Front / Back / Side) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {currentInspection.images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeImageIndex === idx
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200 ring-1 ring-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <div className="h-5 w-5 rounded bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300 shrink-0">
                <img
                  src={normalizeImageUrl(img.url)}
                  alt={img.type}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span>{img.type} View</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                {img.quality?.overall || 'HD'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Status & Unified Enforcement Override Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Live Status:</span>
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                currentInspection.status === 'PASS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentInspection.status === 'FAIL'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentInspection.status === 'PASS' ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : currentInspection.status === 'FAIL' ? (
                <ShieldAlert className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              <span>{currentInspection.status}</span>
            </span>
          </div>

          {/* Compliance Score */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Score:</span>
            <span className="text-xs font-mono font-bold text-slate-900">{currentInspection.screening_score}%</span>
          </div>

          {/* Live Declaration / Rule Counters */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>{passCount} Passed</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold border border-red-200">
              <XCircle className="h-3 w-3" />
              <span>{failCount} Violations</span>
            </span>
            {reviewCount > 0 && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                <AlertTriangle className="h-3 w-3" />
                <span>{reviewCount} Review</span>
              </span>
            )}
            {currentInspection.analysis_meta?.ocr_completed && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <span>OCR Completed</span>
              </span>
            )}
            {currentInspection.analysis_meta && !currentInspection.analysis_meta.ai_assisted_completed && !currentInspection.demo_preset_id && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                <span>Local OCR Mode</span>
              </span>
            )}
          </div>
        </div>

        {/* Override Entire Inspection Button */}
        <button
          onClick={() => {
            setOverrideStatus(currentInspection.status === 'FAIL' ? 'PASS' : 'FAIL');
            setShowOverrideModal(true);
          }}
          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Gavel className="h-3.5 w-3.5 text-amber-400" />
          <span>Override Entire Inspection</span>
        </button>
      </div>

      {/* No Package Detected Warning Banner */}
      {isNoPackageDetected && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start space-x-3 text-red-900 shadow-xs">
          <PackageOpen className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-red-950">Statutory Pre-Packaged Commodity Not Detected</h3>
            <p className="leading-relaxed text-red-800">
              The optical surveillance pipeline did not detect any pre-packaged commodity or statutory labeling panel in the captured frame. OCR bounding box extraction is withheld to prevent false compliance scoring. Please position the product packaging squarely within the optical sensor frame.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Zoomable Image Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between relative min-h-[580px]">
          {/* Canvas Toolbar */}
          <div className="p-3 bg-slate-950/80 backdrop-blur-xs border-b border-slate-800 text-white flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">
                {activeImage.name} ({activeImage.quality?.resolution || 'HD'})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              {/* Sharp OCR Preprocessing Layer Selector */}
              <div className="inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-xs mr-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setImageLayer('original')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    imageLayer === 'original' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Original full-color RGB packaging panel"
                >
                  RGB Color
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!activeImage.preprocessed_url) {
                      await handleRunOcrPreprocessing();
                    } else {
                      setImageLayer('enhanced');
                    }
                  }}
                  disabled={isPreprocessing}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer ${
                    imageLayer === 'enhanced' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sharp OCR Enhanced: Grayscale (BT.709) + Normalized Contrast + Unsharp Mask"
                >
                  <span>Enhanced (Sharp)</span>
                  {isPreprocessing && <span className="animate-spin text-[10px]">↻</span>}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!activeImage.thresholded_url) {
                      await handleRunOcrPreprocessing();
                    }
                    setImageLayer('threshold');
                  }}
                  disabled={isPreprocessing}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    imageLayer === 'threshold' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sharp Otsu-Binarized: High-contrast monochrome text isolation"
                >
                  Binarized
                </button>
              </div>

              {(activeImage.type?.toLowerCase() === 'front' || activeImageIndex === 0) && (
                <button
                  type="button"
                  onClick={handleRecalibrateFront}
                  disabled={isRecalibrating || isNoPackageDetected}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                    isRecalibrating
                      ? 'bg-indigo-900 text-indigo-200 cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                  }`}
                  title="Run specialized high-precision OCR recalibration on Front Principal Display Panel (PDP)"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isRecalibrating ? 'animate-spin' : 'text-indigo-200'}`} />
                  <span>{isRecalibrating ? 'Calibrating...' : 'Recalibrate Front OCR'}</span>
                </button>
              )}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  disabled={isNoPackageDetected}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                    isNoPackageDetected
                      ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                      : showBoundingBoxes
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Boxes {showBoundingBoxes && !isNoPackageDetected ? 'ON' : 'OFF'}</span>
                </button>

                {showBoundingBoxes && !isNoPackageDetected && (
                  <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded p-0.5 space-x-0.5">
                    <button
                      type="button"
                      onClick={() => setBoxDisplayMode('tags')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer ${
                        boxDisplayMode === 'tags'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Standard Mode: Smart micro-labels with anti-overlap placement"
                    >
                      <Tag className="h-3 w-3" />
                      <span>Tags</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBoxDisplayMode('pins')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer ${
                        boxDisplayMode === 'pins'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Numbered Pins Mode: Ultra-clean 100% zero-overlap circular markers"
                    >
                      <Hash className="h-3 w-3" />
                      <span>Pins</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBoxDisplayMode('reticles')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer ${
                        boxDisplayMode === 'reticles'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Focus Reticle Mode: CAD corner brackets, shows details on hover"
                    >
                      <Crosshair className="h-3 w-3" />
                      <span>Focus</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={zoomOut}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={zoomIn}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Optional Pipeline Badge Bar */}
          {imageLayer !== 'original' && (
            <div className="px-3 py-1 bg-amber-950/70 border-b border-amber-800/60 text-amber-200 text-[11px] flex items-center justify-between">
              <span className="font-mono flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  Backend Sharp Pipeline Active: {imageLayer === 'enhanced' ? 'Grayscale (BT.709) + Linear Contrast Boost (1.15) + Unsharp Mask' : 'Otsu Dynamic Thresholding (Binarized)'}
                </span>
              </span>
              <span className="text-[10px] text-amber-300/80">
                {currentInspection.analysis_meta?.ai_assisted_completed
                  ? 'Hybrid Local OCR + Gemini Enhancement'
                  : 'Local OCR Optical Enhancement Layer'}
              </span>
            </div>
          )}

          {/* Interactive Image Viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[460px] relative">
            <div
              className="relative inline-block transition-transform duration-150 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={displayedImageUrl}
                alt={activeImage.name}
                className="max-h-[500px] max-w-full w-auto h-auto rounded-lg shadow-2xl border border-slate-700 block select-none"
              />

              {/* CAD Leader Callout Lines for External Tags */}
              {showBoundingBoxes && !isNoPackageDetected && boxDisplayMode === 'tags' && layoutBoxes.length > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {layoutBoxes.map((box) => {
                    const dist = Math.hypot(box.leaderX2 - box.leaderX1, box.leaderY2 - box.leaderY1);
                    if (dist < 1.5) return null;
                    const strokeColor =
                      box.status === 'PASS' ? '#34d399' : box.status === 'FAIL' ? '#fb7185' : '#fbbf24';
                    return (
                      <line
                        key={`leader-${box.id}`}
                        x1={box.leaderX1}
                        y1={box.leaderY1}
                        x2={box.leaderX2}
                        y2={box.leaderY2}
                        stroke={strokeColor}
                        strokeWidth="0.35"
                        strokeDasharray="0.9 0.7"
                        strokeOpacity="0.85"
                      />
                    );
                  })}
                </svg>
              )}

              {/* Bounding Boxes Overlay: Render precision calibrated boxes */}
              {showBoundingBoxes &&
                !isNoPackageDetected &&
                layoutBoxes.map((box) => {
                  const isSelected = selectedDeclaration?.id
                    ? selectedDeclaration.id === box.id
                    : selectedDeclaration?.field === box.field;
                  const isHovered = hoveredBoxId === box.id;

                  const borderColor =
                    box.status === 'PASS'
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : box.status === 'FAIL'
                      ? 'border-rose-400 bg-rose-500/15'
                      : 'border-amber-400 bg-amber-500/15';

                  return (
                    <div
                      key={box.id}
                      onClick={() => {
                        setSelectedDeclId(box.id);
                        setSelectedEvidenceField(box.field);
                      }}
                      onMouseEnter={() => setHoveredBoxId(box.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`absolute cursor-pointer rounded-xs transition-all duration-150 ${borderColor} ${
                        isSelected
                          ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-950 z-30 border-2 shadow-lg'
                          : isHovered
                          ? 'ring-2 ring-cyan-300 z-20 border-2 shadow-md'
                          : 'border-[1.5px] hover:border-2 z-10'
                      }`}
                      style={{
                        top: `${box.top}%`,
                        left: `${box.left}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                    >
                      {/* CAD Corner Ticks for high-precision technical feel */}
                      <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-white/90 pointer-events-none" />
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-white/90 pointer-events-none" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-white/90 pointer-events-none" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-white/90 pointer-events-none" />
                    </div>
                  );
                })}

              {/* Collision-Free External Tags & Pins Layer */}
              {showBoundingBoxes &&
                !isNoPackageDetected &&
                layoutBoxes.map((box) => {
                  const isSelected = selectedDeclaration?.id
                    ? selectedDeclaration.id === box.id
                    : selectedDeclaration?.field === box.field;
                  const isHovered = hoveredBoxId === box.id;

                  const badgeColor =
                    box.status === 'PASS'
                      ? 'bg-emerald-600 text-white border border-emerald-300/60'
                      : box.status === 'FAIL'
                      ? 'bg-rose-600 text-white border border-rose-300/60'
                      : 'bg-amber-600 text-white border border-amber-300/60';

                  if (boxDisplayMode === 'tags') {
                    return (
                      <button
                        key={`tag-${box.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedDeclId(box.id);
                          setSelectedEvidenceField(box.field);
                        }}
                        onMouseEnter={() => setHoveredBoxId(box.id)}
                        onMouseLeave={() => setHoveredBoxId(null)}
                        className={`absolute flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-md whitespace-nowrap cursor-pointer transition-all ${badgeColor} ${
                          isSelected
                            ? 'ring-2 ring-white z-40 scale-105'
                            : isHovered
                            ? 'ring-1 ring-cyan-300 z-35'
                            : 'z-20'
                        }`}
                        style={{
                          top: `${box.tagTop}%`,
                          left: `${box.tagLeft}%`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        <span className="truncate max-w-[115px]">{box.shortLabel}</span>
                        <span className="opacity-85 font-normal">({Math.round(box.confidence * 100)}%)</span>
                      </button>
                    );
                  }

                  if (boxDisplayMode === 'pins') {
                    return (
                      <button
                        key={`pin-${box.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedDeclId(box.id);
                          setSelectedEvidenceField(box.field);
                        }}
                        onMouseEnter={() => setHoveredBoxId(box.id)}
                        onMouseLeave={() => setHoveredBoxId(null)}
                        className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shadow-md cursor-pointer transition-transform ${badgeColor} ${
                          isSelected || isHovered ? 'scale-125 ring-2 ring-white z-40' : 'z-20'
                        }`}
                        style={{
                          top: `${box.pinTop}%`,
                          left: `${box.pinLeft}%`,
                        }}
                      >
                        {box.pinNumber}
                      </button>
                    );
                  }

                  if (boxDisplayMode === 'reticles' && (isSelected || isHovered)) {
                    return (
                      <div
                        key={`reticle-${box.id}`}
                        className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shadow-md z-40 ring-2 ring-white pointer-events-none ${badgeColor}`}
                        style={{
                          top: `${box.pinTop}%`,
                          left: `${box.pinLeft}%`,
                        }}
                      >
                        {box.pinNumber}
                      </div>
                    );
                  }

                  return null;
                })}

              {/* Floating Live HUD Tooltip on Hover or Selection */}
              {showBoundingBoxes &&
                !isNoPackageDetected &&
                (() => {
                  const activeHovered =
                    (hoveredBoxId && layoutBoxes.find((b) => b.id === hoveredBoxId)) ||
                    (selectedDeclaration?.id && layoutBoxes.find((b) => b.id === selectedDeclaration.id)) ||
                    layoutBoxes.find((b) => b.field === selectedEvidenceField);
                  if (!activeHovered) return null;
                  return (
                    <div className="absolute bottom-3 right-3 max-w-xs bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl p-3 shadow-2xl text-slate-200 z-40 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold font-mono flex items-center justify-center">
                            {activeHovered.pinNumber}
                          </span>
                          <span className="font-bold text-xs text-white truncate">{activeHovered.label}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            activeHovered.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : activeHovered.status === 'FAIL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {activeHovered.status} • {Math.round(activeHovered.confidence * 100)}%
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">OCR Extracted:</span>
                          <p className="font-mono bg-slate-900/90 px-2 py-1 rounded border border-slate-800 text-slate-100 mt-0.5 line-clamp-2">
                            "{activeHovered.original_text || 'None detected'}"
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>Rule: {activeHovered.ruleCitation}</span>
                          <span className="text-blue-400">Click to inspect</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Interactive Pin & Tag Legend Rail */}
          {showBoundingBoxes && !isNoPackageDetected && layoutBoxes.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center space-x-1">
                <Hash className="h-3 w-3 text-blue-400" />
                <span>OCR Fields ({layoutBoxes.length}):</span>
              </span>
              {layoutBoxes.map((box) => {
                const isSelected = selectedDeclaration?.id
                  ? selectedDeclaration.id === box.id
                  : selectedEvidenceField === box.field;
                const isHovered = hoveredBoxId === box.id;
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeclId(box.id);
                      setSelectedEvidenceField(box.field);
                    }}
                    onMouseEnter={() => setHoveredBoxId(box.id)}
                    onMouseLeave={() => setHoveredBoxId(null)}
                    className={`px-2 py-0.5 rounded-full flex items-center space-x-1.5 transition shrink-0 cursor-pointer text-[10px] font-mono ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-300'
                        : isHovered
                        ? 'bg-slate-800 text-white ring-1 ring-cyan-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold ${
                        box.status === 'PASS'
                          ? 'bg-emerald-600 text-white'
                          : box.status === 'FAIL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {box.pinNumber}
                    </span>
                    <span>{box.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Packaging Panel Evidence Gallery Bar */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                <span>Panels ({currentInspection.images.length}):</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
              {currentInspection.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex items-center space-x-2 p-1.5 rounded-lg border text-left transition shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'bg-blue-950/80 border-blue-500 ring-1 ring-blue-400 text-white'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="h-9 w-9 rounded bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                    <img
                      src={normalizeImageUrl(img.url)}
                      alt={img.type}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-[10px] leading-tight pr-1">
                    <div className="font-bold text-slate-200">{img.type} Panel</div>
                    <div className="text-slate-400 font-mono text-[9px]">
                      {img.quality?.resolution || 'HD'} • {img.quality?.overall || 'GOOD'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Bottom Legend */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between px-4">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Pass</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>Violation</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>Review</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Click any mapped box or list item to inspect declaration</span>
          </div>
        </div>

        {/* Right: Field Inspection & Officer Verification Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Predefined Statutory Benchmark & Fields Reference (For Predefined Packages) */}
          {matchedPreset && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-700 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-blue-950">
                      Predefined Statutory Benchmark ({matchedPreset.predefinedFields.length} Fields)
                    </h3>
                    <p className="text-[10px] text-blue-800">
                      Dataset: {matchedPreset.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPredefinedBenchmark(!showPredefinedBenchmark)}
                  className="text-xs text-blue-700 hover:text-blue-900 p-1 rounded hover:bg-blue-100/60 transition cursor-pointer"
                >
                  {showPredefinedBenchmark ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {showPredefinedBenchmark && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 pr-1">
                  {matchedPreset.predefinedFields.map((field, fIdx) => (
                    <div
                      key={fIdx}
                      onClick={() => {
                        setSelectedEvidenceField(field.field);
                        const targetImgIdx = currentInspection.images.findIndex(
                          (img) => img.type?.toLowerCase() === field.panel?.toLowerCase()
                        );
                        if (targetImgIdx >= 0) setActiveImageIndex(targetImgIdx);
                      }}
                      className="p-2 bg-white/90 hover:bg-white rounded-lg border border-blue-100 cursor-pointer text-xs flex items-center justify-between gap-2 transition hover:shadow-2xs"
                    >
                      <div className="truncate space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{field.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {field.panel} Panel
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 truncate">
                          {field.value}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            field.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : field.status === 'FAIL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {field.status}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{field.ruleCitation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Declarations selector pill list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Extracted Mandatory Declarations ({currentInspection.declarations.length})
              </h3>
            </div>

            {currentInspection.declarations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                <PackageOpen className="h-6 w-6 mx-auto text-slate-300" />
                <p>No mandatory declarations extracted from this scene.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {currentInspection.declarations.map((decl, idx) => {
                  const evalItem = currentInspection.rule_evaluations.find((r) => r.field === decl.field);
                  const declKey = decl.id || `${decl.field}-${decl.image_id || idx}`;
                  const isSelected = selectedDeclaration?.id
                    ? selectedDeclaration.id === decl.id
                    : selectedDeclaration?.field === decl.field;
                  const status = evalItem?.status || (decl.status === 'FOUND' ? 'PASS' : 'FAIL');
                  const rawBox = decl.bbox ?? (decl as any).box_2d;
                  const isBox2d = !decl.bbox && Array.isArray((decl as any).box_2d);
                  const hasOverlay =
                    !!normalizeBbox(rawBox, isBox2d) && decl.status !== 'NOT_FOUND' && decl.found !== false;

                  return (
                    <button
                      key={declKey}
                      onClick={() => {
                        setSelectedDeclId(decl.id || null);
                        setSelectedEvidenceField(decl.field);
                        const targetIdx = currentInspection.images.findIndex(
                          (img) =>
                            (decl.image_id && img.id === decl.image_id) ||
                            (decl.image_type && img.type?.toLowerCase() === decl.image_type?.toLowerCase())
                        );
                        if (targetIdx >= 0 && targetIdx !== activeImageIndex) {
                          setActiveImageIndex(targetIdx);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-300 text-blue-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            status === 'PASS' ? 'bg-emerald-500' : status === 'FAIL' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        ></span>
                        <span className="truncate">{decl.label}</span>
                        {decl.image_type && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 uppercase shrink-0">
                            {decl.image_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {hasOverlay ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                            Overlay
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono">
                            No overlay
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500 font-normal">
                          {Math.round(decl.confidence * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Declaration Detail & Officer Audit Card */}
          {selectedDeclaration && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    {selectedEvaluation?.rule_id || 'STATUTORY REQUIREMENT'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{selectedDeclaration.label}</h3>
                </div>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded uppercase ${
                    selectedEvaluation?.status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedEvaluation?.status === 'FAIL'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedEvaluation?.status || 'FOUND'}
                </span>
              </div>

              {/* Text Values */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Raw Extracted OCR Text:</span>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 break-words mt-1">
                    {selectedDeclaration.original_text || <span className="italic text-slate-400">Declaration not found on label</span>}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Normalized Statutory Value:</span>
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 font-semibold text-blue-900 mt-1">
                    {selectedDeclaration.normalized_value || '—'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Legal Metrology Citation &amp; Evaluation:</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    {selectedEvaluation?.reason || 'Evaluated against Legal Metrology (Packaged Commodities) Rules, 2011.'}
                  </p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    {selectedEvaluation?.normative_reference}
                  </p>
                </div>
              </div>

              {/* Officer Verification Override Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Enforcement Officer Action</span>
                </span>

                <input
                  type="text"
                  placeholder="Enter remarks for this declaration..."
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleVerifyDeclaration('PASS')}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition"
                  >
                    ✓ Pass
                  </button>
                  <button
                    onClick={() => handleVerifyDeclaration('FAIL')}
                    className="py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition"
                  >
                    ✕ Violation
                  </button>
                  <button
                    onClick={() => handleVerifyDeclaration('REVIEW')}
                    className="py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition"
                  >
                    ⚠ Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Officer Overall Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Gavel className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold">Officer Statutory Determination</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Record manual legal determination for this entire inspection. Overriding to <strong>PASS</strong> marks all mandatory declarations as verified and harmonizes the compliance score to 100%.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Determination Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
              >
                <option value="PASS">PASS (Compliant — Overrule All Violations)</option>
                <option value="FAIL">FAIL (Confirmed Statutory Violation / Issue Notice)</option>
                <option value="REVIEW">REVIEW (Lab Sample Testing / Advisory Hold)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Officer Legal Remarks &amp; Statutory Ground</label>
              <textarea
                rows={3}
                placeholder="State statutory rationale under Legal Metrology Act..."
                value={overrideRemarks}
                onChange={(e) => setOverrideRemarks(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyOverallOverride}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Confirm Determination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
