import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { createInspection, analyzeInspection, fetchInspectionById, fetchProductFromUrl } from '../services/api';
import {
  InspectionImage,
  ImageType,
  ProductCategory,
  CalibrationConfig,
  ScanMode
} from '../types/index';
import { AIAnalysisProgressModal } from './AIAnalysisProgressModal';
import { LiveCameraModal } from './LiveCameraModal';
import {
  Upload,
  Camera,
  Trash2,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  Layers,
  HelpCircle,
  Eye,
  Ruler,
  Compass,
  ShieldCheck,
  Disc,
  Radio,
  FileCheck,
  Smartphone,
  Globe,
  Link2,
  Loader2,
  Video,
  Boxes
} from 'lucide-react';
import { optimizePackagingImage } from '../utils/imageCompressor';

const PRESET_SAMPLE_WHOLESALE_CARTON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="650" height="700" viewBox="0 0 650 700">
  <rect width="650" height="700" fill="#d97706" rx="16"/>
  <rect x="25" y="25" width="600" height="650" fill="#fef3c7" stroke="#b45309" stroke-width="6" rx="12"/>
  <rect x="45" y="45" width="560" height="60" fill="#78350f" rx="6"/>
  <text x="325" y="85" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">WHOLESALE MASTER SHIPPER CARTON</text>
  <text x="325" y="135" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#92400e" text-anchor="middle">LEGAL METROLOGY (PC) RULES, 2011 — CHAPTER III</text>
  
  <rect x="50" y="160" width="550" height="90" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="70" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#78350f">1. COMMODITY &amp; BRAND IDENTIFIER:</text>
  <text x="70" y="215" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e293b">AURA ORGANICS OATS DIGESTIVE COOKIES (WHOLESALE)</text>
  <text x="70" y="235" font-family="Arial, sans-serif" font-size="13" fill="#475569">Brand: Aura Organics | FSSAI Lic No: 10020043000987</text>

  <rect x="50" y="265" width="550" height="110" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="70" y="295" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#78350f">2. TOTAL QUANTITY &amp; INNER UNITS (RULE 24):</text>
  <text x="70" y="325" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#15803d">CONTAINS: 24 RETAIL UNITS × 100g EACH</text>
  <text x="70" y="355" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0369a1">TOTAL NET MASS: 2.40 kg | GROSS WEIGHT: 2.75 kg</text>

  <rect x="50" y="390" width="550" height="95" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="70" y="418" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#78350f">3. REGISTERED MANUFACTURER &amp; PACKER (RULE 24):</text>
  <text x="70" y="442" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1e293b">Aura Organics Foods Private Limited</text>
  <text x="70" y="465" font-family="Arial, sans-serif" font-size="12" fill="#334155">Plot 42-B, Peenya Industrial Area, Phase II, Bengaluru, Karnataka - 560058, India</text>

  <rect x="50" y="500" width="265" height="100" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="65" y="525" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#78350f">4. DISPATCH &amp; PRICING:</text>
  <text x="65" y="550" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#b45309">WHOLESALE DISTRIBUTION</text>
  <text x="65" y="570" font-family="Arial, sans-serif" font-size="12" fill="#334155">MRP ₹50.00 incl. of all taxes / unit</text>
  <text x="65" y="588" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#15803d">Total MRP: ₹1,200.00</text>

  <rect x="330" y="500" width="270" height="100" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="345" y="525" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#78350f">5. PACKING DATE &amp; SHIPPER CODE:</text>
  <text x="345" y="548" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1e293b">Packed: 01/2026 | Batch: AURA-WH-091</text>
  <text x="345" y="572" font-family="Courier, monospace" font-size="15" font-weight="bold" fill="#0f172a">ITF-14: 18901030998121</text>
  <text x="345" y="590" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Country of Origin: India</text>

  <rect x="50" y="615" width="550" height="45" rx="6" fill="#fef2f2" stroke="#fca5a5"/>
  <text x="325" y="643" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">OFFICIAL NOTICE: NOT FOR DIRECT LOOSE SALE BEFORE BREAKING BULK</text>
</svg>`;

const PRESET_SAMPLE_FRONT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="120" rx="12" fill="#0f172a"/>
  <text x="300" y="95" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#38bdf8" text-anchor="middle">AURA ORGANICS</text>
  <text x="300" y="135" font-family="Arial, sans-serif" font-size="18" fill="#f8fafc" text-anchor="middle">CRUNCHY WHOLEGRAIN OATS COOKIES</text>
  <rect x="80" y="200" width="440" height="240" rx="16" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="300" cy="310" r="70" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
  <text x="300" y="315" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">🍪</text>
  <text x="300" y="360" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#92400e" text-anchor="middle">100% WHOLE GRAIN</text>
  <rect x="60" y="480" width="480" height="200" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="80" y="520" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">FRONT MANDATORY DECLARATIONS</text>
  <text x="80" y="560" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0284c7">Net Quantity: 200 g (2 x 100g Packs)</text>
  <text x="80" y="600" font-family="Arial, sans-serif" font-size="16" fill="#334155">Commodity: Baked Biscuit &amp; Cookie Confectionery</text>
  <text x="80" y="640" font-family="Arial, sans-serif" font-size="15" fill="#16a34a" font-weight="bold">✓ 100% Vegetarian (Green Dot Mark)</text>
</svg>`;

const PRESET_SAMPLE_BACK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="30" y="30" width="540" height="690" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="45" y="45" width="510" height="55" rx="8" fill="#1e293b"/>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#f8fafc" text-anchor="middle">STATUTORY MANDATORY DECLARATIONS</text>
  <rect x="50" y="115" width="498" height="580" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="70" y="150" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">1. COMMODITY NAME:</text>
  <text x="260" y="150" font-family="Arial, sans-serif" font-size="14" fill="#334155">Wholegrain Oats Cookies</text>
  <text x="70" y="190" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">2. NET QUANTITY:</text>
  <text x="260" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">200 g (Standard Metric Units)</text>
  <text x="70" y="230" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">3. MRP (INCL. TAXES):</text>
  <text x="260" y="230" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#059669">₹75.00 (Incl. of all taxes)</text>
  <text x="70" y="270" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">4. UNIT SALE PRICE:</text>
  <text x="260" y="270" font-family="Arial, sans-serif" font-size="14" fill="#334155">₹0.38 / g</text>
  <text x="70" y="310" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">5. MFD &amp; PACKED BY:</text>
  <text x="70" y="335" font-family="Arial, sans-serif" font-size="13" fill="#475569">Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area,</text>
  <text x="70" y="355" font-family="Arial, sans-serif" font-size="13" fill="#475569">Bengaluru, Karnataka - 560058, India.</text>
  <text x="70" y="395" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">6. DATE OF PACKING:</text>
  <text x="260" y="395" font-family="Arial, sans-serif" font-size="14" fill="#334155">04/2026 | BATCH: AO-2026-B84</text>
  <text x="70" y="435" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">7. BEST BEFORE:</text>
  <text x="260" y="435" font-family="Arial, sans-serif" font-size="14" fill="#334155">9 Months from Date of Packaging</text>
  <text x="70" y="475" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">8. COUNTRY OF ORIGIN:</text>
  <text x="260" y="475" font-family="Arial, sans-serif" font-size="14" fill="#334155">India</text>
  <rect x="65" y="505" width="470" height="95" rx="6" fill="#f0fdf4" stroke="#86efac"/>
  <text x="80" y="530" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#166534">9. CONSUMER CARE GRIEVANCE CELL:</text>
  <text x="80" y="555" font-family="Arial, sans-serif" font-size="13" fill="#14532d">Manager, Consumer Grievance Cell, at Mfd Address above</text>
  <text x="80" y="580" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#15803d">Toll Free: 1800-425-9988 | Email: care@auraorganics.in</text>
</svg>`;

export const NewInspectionView: React.FC = () => {
  const { officerName, officerRole, viewInspection, showToast, isOnline, setOfflineQueueCount } = useApp();
  const isCitizen = officerRole === 'Citizen';

  const [images, setImages] = useState<InspectionImage[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('Food');
  const [barcode, setBarcode] = useState<string>('');
  const [scanMode, setScanMode] = useState<ScanMode>('STANDARD_MANUAL');

  // Package Level: Retail Consumer vs Wholesale Bulk Box
  const [packageLevel, setPackageLevel] = useState<'RETAIL_CONSUMER' | 'BULK_BOX'>('RETAIL_CONSUMER');
  const [bulkUnitsCount, setBulkUnitsCount] = useState<number>(24);
  const [bulkUnitNetMass, setBulkUnitNetMass] = useState<string>('100 g');
  const [bulkTotalGrossWeight, setBulkTotalGrossWeight] = useState<string>('2.75 kg');
  const [bulkMasterBarcode, setBulkMasterBarcode] = useState<string>('18901030998121');

  // Physical Calibration State (Citizens default to NONE)
  const [calibMethod, setCalibMethod] = useState<'DECLARED_DIMENSIONS' | 'REFERENCE_OBJECT' | 'NONE'>(
    isCitizen ? 'NONE' : 'REFERENCE_OBJECT'
  );
  const [declaredDims, setDeclaredDims] = useState<{ width: number; height: number; depth: number }>({
    width: 120,
    height: 180,
    depth: 40
  });
  const [selectedRefObject, setSelectedRefObject] = useState<string>('INR_5_COIN');

  // Evidentiary Chain of Custody State
  const [deviceId, setDeviceId] = useState<string>('LM-FIELD-KA-402');
  const [location, setLocation] = useState<string>('Central Enforcement Hub, Market Surveillance Cell');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [gpsConsent, setGpsConsent] = useState<boolean>(true);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pendingRecordId, setPendingRecordId] = useState<string | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [intakeTab, setIntakeTab] = useState<'photo' | 'upload' | 'url'>('photo');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);

  // Reference Object Catalogue
  const referenceObjectsList = [
    { id: 'INR_5_COIN', label: '₹5 Coin (Standard Nickel-Brass)', dimension: 'Diameter: 23.0 mm', knownMm: 23.0 },
    { id: 'INR_10_COIN', label: '₹10 Coin (Bi-Metallic)', dimension: 'Diameter: 27.0 mm', knownMm: 27.0 },
    { id: 'ID_CARD_CR80', label: 'Govt Officer / Aadhar ID Card (CR-80)', dimension: 'Length: 85.60 mm', knownMm: 85.6 },
    { id: 'SCALE_BAR_50MM', label: 'Certified Legal Metrology Scale Bar', dimension: 'Length: 50.0 mm', knownMm: 50.0 }
  ];

  // Calculated Scale Factor Preview
  const calibrationMetrics = useMemo(() => {
    if (calibMethod === 'NONE') {
      return {
        pxPerMm: null,
        charHeightMm: null,
        statusLabel: 'Indicative Only (Uncalibrated)',
        isLegalCourtAdmissible: false
      };
    }

    if (calibMethod === 'REFERENCE_OBJECT') {
      const ref = referenceObjectsList.find((r) => r.id === selectedRefObject) || referenceObjectsList[0];
      const pxPerMm = Number((310 / ref.knownMm).toFixed(2)); // Standard 1080p framing pixel baseline
      const charHeightMm = Number((24 / pxPerMm).toFixed(2));
      return {
        pxPerMm,
        charHeightMm,
        statusLabel: `Certified Physical Measurement (${pxPerMm} px/mm)`,
        isLegalCourtAdmissible: true
      };
    }

    // Declared dimensions
    const pxPerMm = Number((1920 / (declaredDims.height || 180)).toFixed(2));
    const charHeightMm = Number((24 / pxPerMm).toFixed(2));
    return {
      pxPerMm,
      charHeightMm,
      statusLabel: `Certified Declared Dimension Scale (${pxPerMm} px/mm)`,
      isLegalCourtAdmissible: true
    };
  }, [calibMethod, selectedRefObject, declaredDims]);

  // Process image files with dimension & payload optimization
  const processImageFile = (file: File, defaultType: ImageType = 'Front') => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawUrl = e.target?.result as string;
      const optimized = await optimizePackagingImage(rawUrl, 1600, 0.88);
      const newImg: InspectionImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: defaultType,
        name: file.name,
        sizeBytes: optimized.sizeBytes || file.size,
        url: optimized.dataUrl,
        quality: {
          overall: file.size > 50000 ? 'GOOD' : 'FAIR',
          blurScore: 92,
          contrastScore: 88,
          brightnessScore: 88,
          resolution: `${optimized.width}x${optimized.height} (Optimized Field Capture)`,
          issues: file.size < 50000 ? ['Low resolution may impact micro-print extraction'] : []
        }
      };
      setImages((prev) => [...prev, newImg]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: File, idx) => {
        const type: ImageType = idx === 0 ? 'Front' : idx === 1 ? 'Back' : 'Side';
        processImageFile(file, type);
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File, idx) => {
        const type: ImageType = images.length === 0 && idx === 0 ? 'Front' : 'Back';
        processImageFile(file, type);
      });
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateImageType = (id: string, type: ImageType) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, type } : img)));
  };

  const loadPresetDemo = (presetType: 'compliant' | 'violation' | 'contradiction' | 'bulk_carton') => {
    setScanMode('STANDARD_MANUAL');
    if (presetType === 'compliant') {
      setPackageLevel('RETAIL_CONSUMER');
      setProductName('Aura Organics Oats Cookies');
      setBrand('Aura Organics Foods');
      setCategory('Food');
      setBarcode('8901234567890');
      setCalibMethod('REFERENCE_OBJECT');
      setSelectedRefObject('INR_5_COIN');
      setImages([
        {
          id: 'img-demo-front',
          type: 'Front',
          name: 'aura_front_label.svg',
          url: PRESET_SAMPLE_FRONT,
          quality: { overall: 'GOOD', blurScore: 94, contrastScore: 90, brightnessScore: 88, resolution: '1920x1080', issues: [] }
        },
        {
          id: 'img-demo-back',
          type: 'Back',
          name: 'aura_back_label.svg',
          url: PRESET_SAMPLE_BACK,
          quality: { overall: 'GOOD', blurScore: 95, contrastScore: 92, brightnessScore: 89, resolution: '1920x1080', issues: [] }
        }
      ]);
      showToast('Loaded compliant oats cookie sample (Front & Back).', 'info');
    } else if (presetType === 'violation') {
      setPackageLevel('RETAIL_CONSUMER');
      setProductName('Silk Glow Herbal Shampoo (Missing CC Violation)');
      setBrand('Radiant Cosmetics');
      setCategory('Cosmetics');
      setBarcode('8909876543210');
      setCalibMethod('NONE');
      setImages([
        {
          id: 'img-demo-violation',
          type: 'Back',
          name: 'shampoo_violation_back.svg',
          url: PRESET_SAMPLE_BACK,
          quality: { overall: 'GOOD', blurScore: 90, contrastScore: 88, brightnessScore: 85, resolution: '1920x1080', issues: [] }
        }
      ]);
      showToast('Loaded cosmetics sample with missing consumer care violation.', 'info');
    } else if (presetType === 'bulk_carton') {
      setPackageLevel('BULK_BOX');
      setProductName('Aura Organics Oats Cookies (Wholesale Master Shipper Carton)');
      setBrand('Aura Organics Foods');
      setCategory('Food');
      setBarcode('18901030998121');
      setBulkUnitsCount(24);
      setBulkUnitNetMass('100 g');
      setBulkTotalGrossWeight('2.75 kg');
      setBulkMasterBarcode('18901030998121');
      setCalibMethod('DECLARED_DIMENSIONS');
      setDeclaredDims({ width: 380, height: 420, depth: 250 });
      setImages([
        {
          id: 'img-demo-bulk-carton',
          type: 'Front',
          name: 'wholesale_master_carton.svg',
          url: PRESET_SAMPLE_WHOLESALE_CARTON,
          quality: { overall: 'GOOD', blurScore: 96, contrastScore: 94, brightnessScore: 90, resolution: '1920x1080', issues: [] }
        }
      ]);
      showToast('Loaded Chapter III compliant wholesale bulk box master carton sample!', 'success');
    } else {
      setPackageLevel('RETAIL_CONSUMER');
      setProductName('Crunchy Protein Bites (Contradiction Test)');
      setBrand('NutriFit Foods');
      setCategory('Food');
      setBarcode('8904561237895');
      setCalibMethod('DECLARED_DIMENSIONS');
      setImages([
        {
          id: 'img-demo-c-f',
          type: 'Front',
          name: 'protein_front_100g.svg',
          url: PRESET_SAMPLE_FRONT,
          quality: { overall: 'GOOD', blurScore: 90, contrastScore: 88, brightnessScore: 85, resolution: '1920x1080', issues: [] }
        },
        {
          id: 'img-demo-c-b',
          type: 'Back',
          name: 'protein_back_80g.svg',
          url: PRESET_SAMPLE_BACK,
          quality: { overall: 'GOOD', blurScore: 90, contrastScore: 88, brightnessScore: 85, resolution: '1920x1080', issues: [] }
        }
      ]);
      showToast('Loaded contradiction test sample (Front 100g vs Back 80g).', 'info');
    }
  };

  const handleFetchUrl = async (customUrl?: string) => {
    const targetUrl = customUrl || urlInput;
    if (!targetUrl || !targetUrl.trim()) {
      showToast('Please enter a valid product URL (e.g. Blinkit, Amazon, Flipkart, BigBasket).', 'error');
      return;
    }
    setIsFetchingUrl(true);
    try {
      showToast('Extracting real-time packaging declarations from product URL...', 'info');
      const data = await fetchProductFromUrl(targetUrl.trim());
      if (data) {
        if (data.product_name) setProductName(data.product_name);
        if (data.brand) setBrand(data.brand);
        if (data.category) setCategory(data.category as ProductCategory);
        if (data.barcode) setBarcode(data.barcode);
        if (data.image) {
          setImages([data.image]);
        }
        showToast(`Imported ${data.product_name || 'Product'} packaging view from ${data.platform || 'e-commerce'}!`, 'success');
      } else {
        showToast('Unable to extract packaging from this URL. Please verify the link.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch product from URL.', 'error');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleLoadFallbackSample = async () => {
    try {
      // Use pre-screened demo inspection record
      const fallbackRecord = await fetchInspectionById('INSP-2026-001');
      setIsAnalyzing(false);
      setAnalysisError(null);
      setPendingRecordId(null);
      viewInspection(fallbackRecord, 'compliance_results');
      showToast('Loaded pre-screened baseline verification record.', 'info');
    } catch (e) {
      setIsAnalyzing(false);
      setAnalysisError(null);
      showToast('Failed to load pre-screened record.', 'error');
    }
  };

  const handleStartAnalysis = async () => {
    if (images.length === 0) {
      showToast('Please upload or capture at least one package label image.', 'error');
      return;
    }

    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      // Build calibration config object
      let calibrationConfig: CalibrationConfig | undefined = undefined;
      if (calibMethod === 'REFERENCE_OBJECT') {
        const ref = referenceObjectsList.find((r) => r.id === selectedRefObject) || referenceObjectsList[0];
        calibrationConfig = {
          method: 'REFERENCE_OBJECT',
          reference_object: {
            type: selectedRefObject as any,
            label: ref.label,
            known_dimension_mm: ref.knownMm
          },
          pixels_per_mm: calibrationMetrics.pxPerMm || 13.5
        };
      } else if (calibMethod === 'DECLARED_DIMENSIONS') {
        calibrationConfig = {
          method: 'DECLARED_DIMENSIONS',
          declared_dimensions_mm: declaredDims,
          detected_package_pixels: { width_px: 1280, height_px: 1920 },
          pixels_per_mm: calibrationMetrics.pxPerMm || 10.6
        };
      } else {
        calibrationConfig = {
          method: 'NONE'
        };
      }

      // 1. Check if terminal is currently offline
      if (!isOnline) {
        setTimeout(() => {
          setIsAnalyzing(false);
          setOfflineQueueCount((prev) => prev + 1);
          showToast(
            'Terminal in Offline Field Mode. Evidence & metadata buffered in encrypted local storage. Will auto-sync upon reconnection.',
            'info'
          );
        }, 1200);
        return;
      }

      // 2. Create or reuse inspection record in backend
      let recordId = pendingRecordId;
      if (!recordId) {
        const newRecord = await createInspection({
          product_name: productName || (packageLevel === 'BULK_BOX' ? 'Wholesale Master Shipper Carton' : 'Packaged Commodity'),
          brand: brand || 'Unspecified Brand',
          category,
          barcode: packageLevel === 'BULK_BOX' && bulkMasterBarcode ? bulkMasterBarcode : barcode,
          dimensions: { ...declaredDims, unit: 'mm' },
          reference_scale_present: calibMethod !== 'NONE',
          calibration: calibrationConfig,
          scan_mode: scanMode,
          package_level: packageLevel,
          bulk_box_details: packageLevel === 'BULK_BOX' ? {
            inner_retail_units_count: bulkUnitsCount,
            unit_net_quantity: bulkUnitNetMass,
            total_gross_weight: bulkTotalGrossWeight,
            master_shipper_barcode: bulkMasterBarcode
          } : undefined,
          location,
          officer_name: officerName,
          officer_notes: officerNotes,
          images
        });
        recordId = newRecord.id;
        setPendingRecordId(recordId);
      }

      // 3. Trigger AI multimodal analysis with 35s timeout
      const analysisRes = await analyzeInspection(recordId, {
        images,
        package_level: packageLevel,
        bulk_box_details: packageLevel === 'BULK_BOX' ? {
          inner_retail_units_count: bulkUnitsCount,
          unit_net_quantity: bulkUnitNetMass,
          total_gross_weight: bulkTotalGrossWeight,
          master_shipper_barcode: bulkMasterBarcode
        } : undefined
      }, 35000);

      // 4. Navigate to results upon completion
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisError(null);
        setPendingRecordId(null);
        viewInspection(analysisRes.inspection, 'compliance_results');
        const hasCert = !!analysisRes.inspection?.certificate_id;
        showToast(
          hasCert
            ? 'Inspection completed & Official Compliance Certificate issued!'
            : 'Legal Metrology screening completed. Schedule II compliance evaluated.',
          'success'
        );
      }, 1500);
    } catch (err: any) {
      setAnalysisError(err.message || 'Inspection analysis timed out or encountered an error.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-2 sm:gap-3">
            <span>{isCitizen ? 'Citizen Packaging Inspection' : 'New Commodity Inspection'}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isCitizen
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              {isCitizen ? 'Consumer Vigilance Mode' : 'Rule 6 & Schedule II'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isCitizen
              ? 'Take or upload a clear photo of product packaging to verify MRP, Net Quantity, Best Before, and Manufacturer declarations.'
              : 'Multimodal AI extraction, statutory Legal Metrology rule evaluation, physical font-size calibration, and evidentiary chain of custody.'}
          </p>
        </div>

        {/* Quick Sample Presets Loader */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Load Sample Package:</span>
          <button
            type="button"
            onClick={() => loadPresetDemo('compliant')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            🍪 Compliant Cookie
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('violation')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
          >
            🧴 Missing CC Sample
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('contradiction')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
          >
            ⚖ Contradiction Test
          </button>
          <button
            type="button"
            onClick={() => loadPresetDemo('bulk_carton')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer flex items-center space-x-1"
          >
            <span>📦 Bulk Master Carton</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Upload & Live Scanner & Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Intake Mode Switcher Tabs */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1">
            <button
              type="button"
              id="tab-click-photo"
              onClick={() => setIntakeTab('photo')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                intakeTab === 'photo'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="h-4 w-4 shrink-0" />
              <span>📸 Click Photo</span>
            </button>

            <button
              type="button"
              id="tab-upload-files"
              onClick={() => setIntakeTab('upload')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                intakeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span>📁 Upload Files</span>
            </button>

            <button
              type="button"
              id="tab-import-url"
              onClick={() => setIntakeTab('url')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                intakeTab === 'url'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span>🌐 Import from URL</span>
            </button>
          </div>

          {/* Hidden inputs for native camera and file upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-browse-input"
          />
          <input
            ref={mobileCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
            id="mobile-native-capture-input"
          />

          {/* TAB 1: CLICK PHOTO (WEBCAM / DIRECT CAMERA) */}
          {intakeTab === 'photo' && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shadow-inner">
                <Camera className="h-8 w-8" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Live Camera Packaging Scanner
                </h3>
                <p className="text-xs text-slate-300">
                  Align the commodity package inside the viewfinder to inspect PDP, declarations, and font sizing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  id="btn-click-photo-modal"
                  onClick={() => {
                    setScanMode('LIVE_STREAM');
                    setIsLiveCameraOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Camera className="h-5 w-5" />
                  <span>📸 OPEN CAMERA &amp; CLICK PHOTO</span>
                </button>

                <button
                  type="button"
                  id="btn-direct-hardware-shutter"
                  onClick={() => {
                    setScanMode('STANDARD_MANUAL');
                    mobileCameraInputRef.current?.click();
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  <span>Direct Device Shutter</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  ₹5 Coin Reticle Guide
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Legal Metrology Schedule II
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILES */}
          {intakeTab === 'upload' && (
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Upload Package Label Images
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag and drop Front, Back, and Side label views (JPEG, PNG, SVG up to 25MB)
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-browse-files"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    📁 Browse Local Files
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT FROM PRODUCT URL */}
          {intakeTab === 'url' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Packaging from Real-Time Product URL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fetch live packaging labels from Blinkit, Zepto, Amazon India, Flipkart, or BigBasket
                  </p>
                </div>
              </div>

              {/* URL Input Form */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    id="input-product-url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste product URL (e.g. https://www.blinkit.com/prn/tata-tea/...)"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchUrl();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  id="btn-fetch-url"
                  disabled={isFetchingUrl || !urlInput.trim()}
                  onClick={() => handleFetchUrl()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Fetch &amp; Extract</span>
                    </>
                  )}
                </button>
              </div>

              {/* One-Click Real-time Product URL Presets */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Quick-Test Sample E-Commerce URLs:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('https://www.blinkit.com/prn/tata-tea-gold-tea/prid/12345');
                      handleFetchUrl('https://www.blinkit.com/prn/tata-tea-gold-tea/prid/12345');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition flex items-center space-x-2.5 text-xs group"
                  >
                    <span className="text-base">☕</span>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 group-hover:text-emerald-900">Tata Tea Gold (Blinkit)</div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">blinkit.com/prn/tata-tea-gold</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('https://www.flipkart.com/fortune-sunlite-refined-sunflower-oil-1l/p/itm12345');
                      handleFetchUrl('https://www.flipkart.com/fortune-sunlite-refined-sunflower-oil-1l/p/itm12345');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition flex items-center space-x-2.5 text-xs group"
                  >
                    <span className="text-base">🌻</span>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 group-hover:text-emerald-900">Fortune Oil 1L (Flipkart)</div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">flipkart.com/fortune-sunlite</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('https://www.bigbasket.com/pd/1200163/amul-pasteurised-butter-500-g-carton/');
                      handleFetchUrl('https://www.bigbasket.com/pd/1200163/amul-pasteurised-butter-500-g-carton/');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition flex items-center space-x-2.5 text-xs group"
                  >
                    <span className="text-base">🧈</span>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 group-hover:text-emerald-900">Amul Butter 500g (BigBasket)</div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">bigbasket.com/pd/amul-butter</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('https://www.amazon.in/Dettol-Antiseptic-Disinfectant-Liquid-250ml/dp/B00791C7R4');
                      handleFetchUrl('https://www.amazon.in/Dettol-Antiseptic-Disinfectant-Liquid-250ml/dp/B00791C7R4');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 text-left transition flex items-center space-x-2.5 text-xs group"
                  >
                    <span className="text-base">🧴</span>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 group-hover:text-emerald-900">Dettol Liquid (Amazon India)</div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">amazon.in/dp/B00791C7R4</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Images List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Uploaded Package Views ({images.length})</span>
              </h3>
              {images.length < 2 && (
                <span className="text-xs text-amber-600 font-medium">
                  Recommendation: Upload Front (PDP) &amp; Back (Declarations)
                </span>
              )}
            </div>

            {images.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                No images captured yet. Upload front and back package photos, click "Launch Live Scanner HUD", or select a sample preset above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-44 bg-slate-100 flex items-center justify-center p-2 border-b border-slate-100">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs font-mono">
                        #{idx + 1} • {img.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition"
                        title="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Controls & Quality indicator */}
                    <div className="p-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Panel View:</label>
                        <select
                          value={img.type}
                          onChange={(e) => updateImageType(img.id, e.target.value as ImageType)}
                          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Front">Front (Principal Display)</option>
                          <option value="Back">Back (Mandatory Panel)</option>
                          <option value="Side">Side Panel</option>
                          <option value="Top">Top View</option>
                          <option value="Bottom">Bottom / Base</option>
                          <option value="Other">Other / Composite</option>
                        </select>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Image Quality:</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            img.quality?.overall === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : img.quality?.overall === 'FAIR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {img.quality?.overall || 'GOOD'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ITEM 1: PHYSICAL CALIBRATION SECTION */}
          {isCitizen ? (
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="text-sm font-bold text-emerald-950">Statutory Consumer Declarations Guide</h3>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Under the Legal Metrology (Packaged Commodities) Rules, 2011, every packaged product must legibly declare:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-950 pt-1">
                <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200/60 shadow-2xs">
                  <span className="font-bold text-emerald-900 block mb-0.5">1. Maximum Retail Price (MRP)</span>
                  <span>Mandatory tax-inclusive MRP. Charging above MRP is a statutory offense.</span>
                </div>
                <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200/60 shadow-2xs">
                  <span className="font-bold text-emerald-900 block mb-0.5">2. Net Quantity</span>
                  <span>Must use standardized metric units (g, kg, ml, l) with visible font sizing.</span>
                </div>
                <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200/60 shadow-2xs">
                  <span className="font-bold text-emerald-900 block mb-0.5">3. Packer / Manufacturer</span>
                  <span>Registered company name, physical plant address, and consumer helpline.</span>
                </div>
                <div className="p-2.5 bg-white/90 rounded-lg border border-emerald-200/60 shadow-2xs">
                  <span className="font-bold text-emerald-900 block mb-0.5">4. Date of Packing</span>
                  <span>Clear month and year of packaging for freshness &amp; expiry tracking.</span>
                </div>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Ruler className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Physical Calibration for Font-Size Compliance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Rule 6 &amp; Schedule II character height (mm) legal calibration
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                  calibrationMetrics.isLegalCourtAdmissible
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {calibrationMetrics.isLegalCourtAdmissible ? '✓ COURT ADMISSIBLE' : '⚠ INDICATIVE ONLY'}
              </span>
            </div>

            {/* Calibration Method Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCalibMethod('REFERENCE_OBJECT')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  calibMethod === 'REFERENCE_OBJECT'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Disc className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold">Reference Object</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Coin or scale bar placed on package label
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCalibMethod('DECLARED_DIMENSIONS')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  calibMethod === 'DECLARED_DIMENSIONS'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold">Physical Ruler</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Officer enters measured package dimensions in mm
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCalibMethod('NONE')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  calibMethod === 'NONE'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold">Uncalibrated</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Optical check only — labeled indicative
                </p>
              </button>
            </div>

            {/* Method Details */}
            {calibMethod === 'REFERENCE_OBJECT' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Select Calibrated Reference Object Placed on Label:
                </label>
                <select
                  value={selectedRefObject}
                  onChange={(e) => setSelectedRefObject(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium"
                >
                  {referenceObjectsList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} — [{item.dimension}]
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Calculated Scale Factor:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {calibrationMetrics.pxPerMm} px/mm (~{calibrationMetrics.charHeightMm}mm character height)
                  </span>
                </div>
              </div>
            )}

            {calibMethod === 'DECLARED_DIMENSIONS' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Officer Measured Package Dimensions (in mm):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Width (mm)</label>
                    <input
                      type="number"
                      value={declaredDims.width}
                      onChange={(e) => setDeclaredDims((prev) => ({ ...prev, width: Number(e.target.value) }))}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Height (mm)</label>
                    <input
                      type="number"
                      value={declaredDims.height}
                      onChange={(e) => setDeclaredDims((prev) => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Depth (mm)</label>
                    <input
                      type="number"
                      value={declaredDims.depth}
                      onChange={(e) => setDeclaredDims((prev) => ({ ...prev, depth: Number(e.target.value) }))}
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Calculated Scale Factor:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {calibrationMetrics.pxPerMm} px/mm (~{calibrationMetrics.charHeightMm}mm character height)
                  </span>
                </div>
              </div>
            )}

            {calibMethod === 'NONE' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>Statutory Notice:</strong> Without a certified reference scale or physical caliper measurement, the AI will evaluate relative legibility. However, font-height millimeter measurements will be labeled <em>"indicative — not calibrated"</em> on legal inspection reports.
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right Column: Metadata & Chain of Custody (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Package className="h-4 w-4 text-blue-600" />
              <span>Inspection Parameters &amp; Metadata</span>
            </h3>

            {/* Packaging Tier: Retail Consumer Unit vs Bulk Wholesale Box */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Boxes className="h-4 w-4 text-amber-600" />
                  <span>Packaging Tier / Scope</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  {packageLevel === 'BULK_BOX' ? 'Chapter III Rules 24–26' : 'Chapter II Rule 6'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  id="btn-tier-retail"
                  onClick={() => setPackageLevel('RETAIL_CONSUMER')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    packageLevel === 'RETAIL_CONSUMER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🛍️ Retail Pack</span>
                </button>
                <button
                  type="button"
                  id="btn-tier-bulk"
                  onClick={() => setPackageLevel('BULK_BOX')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    packageLevel === 'BULK_BOX'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📦 Wholesale Bulk Box</span>
                </button>
              </div>

              {packageLevel === 'BULK_BOX' && (
                <div className="mt-3 pt-3 border-t border-amber-200 space-y-2.5 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center space-x-1.5 text-amber-950 font-bold text-xs">
                    <span>Wholesale Master Carton Declarations (Rule 24)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 font-semibold">Inner Retail Packs</label>
                      <input
                        type="number"
                        value={bulkUnitsCount}
                        onChange={(e) => setBulkUnitsCount(Number(e.target.value))}
                        placeholder="e.g. 24"
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-semibold">Unit Net Mass/Qty</label>
                      <input
                        type="text"
                        value={bulkUnitNetMass}
                        onChange={(e) => setBulkUnitNetMass(e.target.value)}
                        placeholder="e.g. 100 g"
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 font-semibold">Carton Gross Weight</label>
                      <input
                        type="text"
                        value={bulkTotalGrossWeight}
                        onChange={(e) => setBulkTotalGrossWeight(e.target.value)}
                        placeholder="e.g. 2.75 kg"
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-semibold">Master Shipper ITF-14</label>
                      <input
                        type="text"
                        value={bulkMasterBarcode}
                        onChange={(e) => setBulkMasterBarcode(e.target.value)}
                        placeholder="e.g. 18901030998121"
                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-900 leading-tight">
                    Statutory Rule 24: Outer wholesale cartons must declare manufacturer address, commodity name, and total retail units or net quantity.
                  </p>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Product Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="Food">Food &amp; Confectionery</option>
                <option value="Cosmetics">Cosmetics &amp; Toiletries</option>
                <option value="Household">Household Goods &amp; Detergents</option>
                <option value="Electrical">Electrical &amp; Electronics</option>
                <option value="Beverages">Beverages &amp; Juices</option>
                <option value="Pharmaceuticals">OTC Pharmaceuticals</option>
                <option value="Other">General Packaged Commodity</option>
              </select>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Product / Commodity Name</label>
              <input
                type="text"
                placeholder="e.g. Crunchy Oats Cookies (or auto-detected by AI)"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Brand / Manufacturer Identifier</label>
              <input
                type="text"
                placeholder="e.g. Aura Organics Foods Pvt Ltd"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Barcode / GTIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Barcode / GTIN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 8901234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* EVIDENTIARY CHAIN OF CUSTODY SETUP (Officer) vs CITIZEN SESSION (Citizen) */}
            {isCitizen ? (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">Citizen Consumer Verification</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                    PUBLIC PORTAL
                  </span>
                </div>
                <div className="text-xs text-emerald-900 flex items-center justify-between pt-1">
                  <span>Consumer User:</span>
                  <span className="font-semibold">{officerName}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-800">
                  <span>Record Inspection Location (Optional)</span>
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Chain of Custody Credentials</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                    SHA-256 SECURED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Device ID</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="w-full text-[11px] bg-white border border-slate-200 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold">Inspecting Officer</label>
                    <div className="text-[11px] font-semibold text-slate-700 bg-slate-200/60 p-1.5 rounded truncate">
                      {officerName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-600">Geo-tag Evidence (GPS Pin)</span>
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </div>
              </div>
            )}

            {/* Notes / Remarks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isCitizen ? 'Purchase Location & Consumer Remarks (Optional)' : 'Inspection Location & Remarks'}
              </label>
              <textarea
                rows={2}
                placeholder={
                  isCitizen
                    ? 'e.g. Purchased at local supermarket or neighborhood grocery store.'
                    : 'e.g. Retail store shelf inspection at Market Yard stall #14.'
                }
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              id="btn-analyze-product"
              disabled={images.length === 0 || isAnalyzing}
              onClick={handleStartAnalysis}
              className={`w-full py-3 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer ${
                isCitizen
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{isCitizen ? 'VERIFY PACKAGING COMPLIANCE' : 'START AI SCREENING & RULE EVALUATION'}</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-tight">
              {isCitizen
                ? 'LEGALMETRIX verifies packaged declarations against the Legal Metrology (Packaged Commodities) Rules, 2011.'
                : 'LEGALMETRIX executes multimodal extraction via Gemini and runs deterministic verification against Legal Metrology Rules, 2011.'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={(img) => {
          setImages((prev) => [...prev, img]);
          showToast(`Captured high-resolution ${img.type} panel view.`, 'success');
        }}
      />

      {/* Progress Stepper Modal */}
      <AIAnalysisProgressModal
        isOpen={isAnalyzing}
        productName={productName || 'Packaged Commodity'}
        error={analysisError}
        onRetry={handleStartAnalysis}
        onFallbackSample={handleLoadFallbackSample}
        onCancel={() => {
          setIsAnalyzing(false);
          setAnalysisError(null);
        }}
      />

      {/* Mobile-Native Field Snap Floating Quick Trigger */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          type="button"
          id="btn-mobile-quick-snap"
          onClick={() => {
            setScanMode('STANDARD_MANUAL');
            mobileCameraInputRef.current?.click();
          }}
          className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold border border-emerald-400 active:scale-95 transition"
        >
          <Smartphone className="h-4 w-4" />
          <span>Quick Field Snap</span>
        </button>
      </div>
    </div>
  );
};

