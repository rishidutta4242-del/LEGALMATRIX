export interface ImageBoundingBox {
  ymin: number; // 0 - 100 percentage
  xmin: number;
  ymax: number;
  xmax: number;
}

export type DeclarationStatus = 'FOUND' | 'NOT_FOUND' | 'NOT_APPLICABLE' | 'UNCERTAIN';
export type ComplianceStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'INCOMPLETE_CAPTURE' | 'NO_PACKAGE_DETECTED';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ImageType = 'Front' | 'Back' | 'Side' | 'Top' | 'Bottom' | 'Other';
export type ProductCategory = 'Food' | 'Cosmetics' | 'Household' | 'Electrical' | 'Beverages' | 'Pharmaceuticals' | 'Other';
export type DisputeStatus = 'NONE' | 'OPEN' | 'UNDER_MANUFACTURER_REVIEW' | 'RESOLVED_UPHELD' | 'RESOLVED_DISMISSED' | 'COMPOUNDED';
export type SyncStatus = 'SYNCED' | 'PENDING_SYNC';
export type ScanMode = 'LIVE' | 'DEMO_PRESET' | 'STANDARD_MANUAL' | 'LIVE_STREAM' | 'BULK_BATCH';
export type CalibrationMethod = 'DECLARED_DIMENSIONS' | 'REFERENCE_OBJECT' | 'NONE';
export type ReferenceObjectType = 'COIN_INR_5' | 'COIN_INR_1' | 'INR_5_COIN' | 'INR_10_COIN' | 'ID_CARD_CR80' | 'SCALE_BAR_50MM' | 'STANDARD_CARD' | 'RULER_METRIC' | 'CUSTOM';

export type UserRole = 'Inspector' | 'Deputy Controller' | 'Director General' | 'Administrator' | 'Citizen';

export interface CitizenReport {
  id: string;
  citizen_name: string;
  citizen_phone?: string;
  product_name: string;
  brand?: string;
  store_name: string;
  store_location: string;
  violation_category: 'MISSING_MRP' | 'EXPIRED_COMMODITY' | 'MISSING_MFG_DATE' | 'MISSING_CONSUMER_CARE' | 'NET_QUANTITY_SHORTFALL' | 'OVERCHARGING_ABOVE_MRP' | 'UNREADABLE_LABELS' | 'OTHER';
  description: string;
  image_urls: string[];
  status: 'SUBMITTED' | 'UNDER_INVESTIGATION' | 'VERIFIED_VIOLATION' | 'ACTION_TAKEN' | 'DISMISSED';
  submitted_at: string;
  investigating_officer?: string;
  action_remarks?: string;
  case_reference_id?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  badge_number: string;
  jurisdiction: string;
  division: string;
  phone?: string;
  token?: string;
}

export interface InspectionImage {
  id: string;
  type: ImageType;
  url: string; // base64 or data URL
  name: string;
  sizeBytes?: number;
  sha256?: string;
  quality?: {
    overall: 'GOOD' | 'FAIR' | 'POOR';
    blurScore: number; // 0-100 (higher = sharper)
    contrastScore: number; // 0-100
    brightnessScore: number; // 0-100
    resolution: string;
    issues: string[];
  };
}

export interface ExtractedDeclaration {
  id: string;
  field: string;
  label: string;
  original_text: string;
  normalized_value: string;
  found: boolean;
  status: DeclarationStatus;
  confidence: number; // 0.0 - 1.0
  image_id: string;
  image_type?: ImageType;
  bbox?: ImageBoundingBox;
  notes?: string;
  // Multilingual / Regional-Script Support
  script?: 'Latin' | 'Devanagari' | 'Tamil' | 'Telugu' | 'Bengali' | 'Other';
  original_script_text?: string;
  transliterated_en?: string;
  translated_en?: string;
}

export interface RuleVersionHistoryItem {
  version: string;
  effective_from: string;
  effective_to?: string | null;
  gazette_ref: string;
  summary: string;
}

export interface RuleDefinition {
  rule_id: string;
  title: string;
  field: string;
  description: string;
  requirement: string;
  applicability: string;
  severity: SeverityLevel;
  validation_type: 'PRESENCE' | 'FORMAT' | 'QUANTITY' | 'MRP' | 'DATE' | 'CONSUMER_CARE' | 'CROSS_IMAGE' | 'READABILITY' | 'CUSTOM';
  source: string;
  version: string;
  effective_date: string; // backwards compatibility alias for effective_from
  effective_from: string;
  effective_to?: string | null;
  min_font_height_mm?: number;
  gazette_notification_no?: string;
  version_history?: RuleVersionHistoryItem[];
  active: boolean;
}

export interface RuleAuditLogEntry {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action: 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'ACTIVATE';
  rule_id: string;
  rule_title: string;
  changes: { field: string; before?: any; after?: any }[];
  rationale: string;
}

export interface RuleEvaluation {
  rule_id: string;
  field: string;
  title: string;
  status: ComplianceStatus;
  reason: string;
  confidence: number;
  severity: SeverityLevel;
  evidence_images: string[];
  evidence_text: string;
  normative_reference: string;
  applicable_version?: string;
  version_in_force_note?: string;
  officer_override?: {
    status: ComplianceStatus;
    reason: string;
    officer_name: string;
    timestamp: string;
  };
}

export interface CrossImageConsistencyCheck {
  field: string;
  label: string;
  front_value: string;
  back_value: string;
  is_consistent: boolean;
  status: ComplianceStatus;
  details: string;
}

export interface CalibrationConfig {
  is_calibrated?: boolean;
  method: CalibrationMethod;
  declared_dimensions_mm?: { width: number; height: number; depth?: number };
  reference_object?: { type: ReferenceObjectType; label: string; known_dimension_mm: number };
  pixels_per_mm?: number;
  detected_package_pixels?: { width_px: number; height_px: number };
  calibrated_by?: string;
  calibration_date?: string;
}

export interface ReadabilityAnalysis {
  characterHeightPxEstimated: number;
  referenceScalePresent: boolean;
  is_calibrated: boolean;
  calibration_label: string; // e.g. "Certified Physical Measurement (12.4 px/mm)" or "indicative — not calibrated"
  scale_factor_px_per_mm?: number;
  estimatedCharHeightMm?: number;
  requiredMinHeightMm: number;
  contrastRatio: number;
  sharpness: number;
  status: ComplianceStatus;
  message: string;
}

export interface ChainOfCustodyRecord {
  capture_timestamp: string;
  device_id: string;
  device_type?: string;
  gps_consent: boolean;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
    accuracy_meters?: number;
    location_label?: string;
  };
  image_sha256: string;
  custody_officer: string;
  tamper_verification_hash: string;
  integrity_status: 'VERIFIED_INTACT' | 'UNVERIFIED';
}

export interface CrossRegimeNotice {
  regime: 'FSSAI' | 'CDSCO' | 'BEE_BIS' | 'E_WASTE';
  title: string;
  description: string;
  statutory_body: string;
  exemption_disclaimer: string;
}

export interface PipelineStageStatus {
  stage: 'OCR_EXTRACTION' | 'FIELD_CLASSIFICATION' | 'MULTILINGUAL_TRANSLATION' | 'RULE_VALIDATION' | 'REPORT_GENERATION';
  label: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  duration_ms?: number;
  details?: string;
}

export interface InspectionRecord {
  id: string;
  product_name: string;
  brand: string;
  category: ProductCategory;
  barcode?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit?: string;
  };
  reference_scale_present: boolean;
  package_level?: 'RETAIL_UNIT' | 'WHOLESALE_BULK_BOX' | 'RETAIL_CONSUMER' | 'BULK_BOX';
  bulk_box_details?: {
    box_type?: string; // e.g. "Master Corrugated Shipper Carton", "Wholesale Outer Case"
    retail_units_count?: number; // e.g. 24
    inner_retail_units_count?: number;
    unit_net_weight?: string; // e.g. "100 g"
    unit_net_quantity?: string;
    total_carton_weight?: string; // e.g. "2.4 kg"
    total_gross_weight?: string;
    shipper_packer?: string;
    master_barcode?: string;
    master_shipper_barcode?: string;
  };
  calibration?: CalibrationConfig;
  scan_mode?: ScanMode;
  location?: string;
  officer_id: string;
  officer_name: string;
  officer_notes?: string;
  created_at: string;
  updated_at: string;
  mfg_date_stated?: string; // e.g. "2026-04" or "2021-08" for temporal rule evaluation
  status: ComplianceStatus;
  screening_score: number; // 0 - 100
  images: InspectionImage[];
  declarations: ExtractedDeclaration[];
  rule_evaluations: RuleEvaluation[];
  cross_image_checks: CrossImageConsistencyCheck[];
  readability_analysis?: ReadabilityAnalysis;
  chain_of_custody?: ChainOfCustodyRecord;
  cross_regime_notices?: CrossRegimeNotice[];
  pipeline_stages?: PipelineStageStatus[];
  dispute_status: DisputeStatus;
  dispute_details?: {
    dispute_id: string;
    filed_at: string;
    manufacturer_name: string;
    manufacturer_response: string;
    officer_decision?: string;
    resolving_officer?: string;
    resolved_at?: string;
  };
  sync_status: SyncStatus;
  plain_language_summary?: string;
  ai_notes?: string;
  warnings: string[];
  is_demo?: boolean;
  is_package_detected?: boolean;
  original_ai_verdict?: ComplianceStatus;
  original_ai_score?: number;
  officer_determination?: {
    status: ComplianceStatus;
    officer_name: string;
    officer_id?: string;
    officer_role?: string;
    timestamp: string;
    remarks: string;
  };
  verified_by?: string;
  verification_timestamp?: string;
  verification_remarks?: string;
  certificate_id?: string;
  certificate?: ComplianceCertificate;
}

export interface BulkIntakeItem {
  id: string;
  source_type: 'IMAGE_UPLOAD' | 'ECOMMERCE_URL' | 'SKU_CATALOG';
  source_url_or_name: string;
  product_name?: string;
  brand?: string;
  category: ProductCategory;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  inspection_id?: string;
  result_status?: ComplianceStatus;
  screening_score?: number;
  violations_count?: number;
}

export interface DashboardStats {
  total_inspections: number;
  compliant_count: number;
  non_compliant_count: number;
  review_count: number;
  average_screening_score: number;
  status_distribution: {
    status: ComplianceStatus;
    count: number;
    percentage: number;
  }[];
  violations_by_declaration: {
    declaration: string;
    count: number;
  }[];
  inspections_over_time: {
    date: string;
    count: number;
    pass: number;
    fail: number;
    review: number;
  }[];
  category_distribution: {
    category: ProductCategory;
    count: number;
  }[];
  dispute_stats: {
    open_count: number;
    under_review_count: number;
    resolved_count: number;
  };
  calibration_stats: {
    calibrated_count: number;
    uncalibrated_count: number;
  };
  recent_inspections: InspectionRecord[];
}

export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface ComplianceCertificate {
  certificate_id: string; // e.g. "CERT-LM-2026-00412"
  inspection_id: string;
  gtin_barcode?: string;
  product_name: string;
  brand: string;
  category: ProductCategory;
  net_quantity?: string;
  mrp?: string;
  manufacturer_details: {
    name: string;
    address: string;
    state?: string;
    pin_code?: string;
    email?: string;
    phone?: string;
  };
  inspecting_officer: {
    name: string;
    role: string;
    badge_id: string;
  };
  issued_at: string;
  validity_months: number;
  expires_at: string;
  rule_repository_version: string;
  screening_score: number;
  chain_of_custody_hash: string;
  tamper_digest: string;
  status: CertificateStatus;
  revocation_details?: {
    revoked_at: string;
    revoked_by: string;
    reason: string;
    reference_inspection_id?: string;
  };
  statutory_disclaimer: string;
  public_verification_url: string;
}

export interface SystemAuditLogEntry {
  id: string;
  timestamp: string;
  category: 'RULE_CHANGE' | 'CONFIG_CHANGE' | 'ROLE_ASSIGNMENT' | 'CERTIFICATE_ACTION' | 'SECURITY';
  actor_name: string;
  actor_role: string;
  action: string;
  target: string;
  changes: { field: string; before?: any; after?: any }[];
  rationale: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'DISPUTE' | 'RULE_CHANGE' | 'CERTIFICATE' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'ALERT';
  read: boolean;
  linkView?: string;
  inspectionId?: string;
  certificateId?: string;
}

export interface ManufacturerRiskProfile {
  brand_or_mfr: string;
  total_inspections: number;
  passed_count: number;
  violations_count: number;
  disputes_count: number;
  risk_score: number; // 0 - 100
  risk_level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  top_violated_rules: string[];
  recommended_action: string;
  last_inspected: string;
}

export interface GtinLookupResult {
  barcode: string;
  found: boolean;
  product_name?: string;
  brand?: string;
  category?: ProductCategory;
  inspections: InspectionRecord[];
  certificates: ComplianceCertificate[];
  latest_status?: ComplianceStatus;
  risk_level?: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
}
