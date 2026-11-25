import {
  InspectionRecord,
  InspectionImage,
  DashboardStats,
  RuleDefinition,
  ProductCategory,
  ComplianceCertificate,
  SystemAuditLogEntry,
  SystemNotification,
  ManufacturerRiskProfile,
  GtinLookupResult,
  AuthUser,
  ComplianceStatus,
  AiEngineStatusSnapshot,
  AiAnalysisStatus,
  AnalysisExecutionMetadata,
  LocalOcrPanelResult,
  ExtractedDeclaration
} from '../types/index';
import {
  cacheDashboardSnapshot,
  cacheInspection,
  cacheInspectionsBatch,
  getCachedDashboardSnapshot,
  getCachedInspectionById,
  getRecentCachedInspections,
} from '../utils/inspectionCache';

const API_BASE = '/api';

export const ADVISORY_AI_UNAVAILABLE =
  'AI-assisted analysis is temporarily unavailable. Local OCR and compliance validation are continuing.';

export function sanitizeErrorMessage(raw?: string): string {
  const msg = String(raw || '').trim();
  if (!msg) return 'Request could not be completed. Local OCR and rule validation remain available.';
  if (/429|503|resource_exhausted|quota\s*exceeded|rate\s*limit|model\s*unavailable|high\s*demand/i.test(msg)) {
    return ADVISORY_AI_UNAVAILABLE;
  }
  return msg;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(data.error || 'Authentication failed');
  }
  return res.json();
}

export async function logoutUser(token?: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ token })
  });
  return res.ok;
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Session invalid');
  return res.json();
}

export async function fetchDemoAccounts(): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE}/auth/demo-accounts`);
  if (!res.ok) throw new Error('Failed to fetch statutory demo accounts');
  return res.json();
}

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAiSettings(): Promise<AiEngineStatusSnapshot> {
  const res = await fetch(`${API_BASE}/settings/ai`);
  if (!res.ok) throw new Error('Failed to fetch AI configuration status');
  return res.json();
}

export async function updateAiSettings(
  payload: {
    primaryModel?: string;
    fallbackModel?: string;
    aiEnabled?: boolean;
    timeoutMs?: number;
    maxRetries?: number;
  },
  token?: string | null
): Promise<{ success: boolean; ai_engine: AiEngineStatusSnapshot }> {
  const res = await fetch(`${API_BASE}/settings/ai`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update AI settings' }));
    throw new Error(sanitizeErrorMessage(err.error || 'Failed to update AI settings'));
  }
  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats & { _fromCache?: boolean; _cachedAt?: string }> {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    const data: DashboardStats = await res.json();
    void cacheDashboardSnapshot(data);
    return data;
  } catch (err) {
    const cached = await getCachedDashboardSnapshot();
    if (cached.stats) {
      return { ...cached.stats, _fromCache: true, _cachedAt: cached.cachedAt };
    }
    throw err;
  }
}

export async function fetchInspections(params?: {
  status?: string;
  category?: string;
  query?: string;
}): Promise<InspectionRecord[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/inspections`);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.category) url.searchParams.set('category', params.category);
  if (params?.query) url.searchParams.set('query', params.query);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch inspections');
    const data: InspectionRecord[] = await res.json();
    void cacheInspectionsBatch(data);
    return data;
  } catch (err) {
    const cached = await getRecentCachedInspections(params);
    if (cached.length > 0) {
      return cached;
    }
    throw err;
  }
}

export async function fetchInspectionById(id: string): Promise<InspectionRecord> {
  try {
    const res = await fetch(`${API_BASE}/inspections/${id}`);
    if (!res.ok) throw new Error(`Inspection ${id} not found`);
    const data: InspectionRecord = await res.json();
    void cacheInspection(data);
    return data;
  } catch (err) {
    const cached = await getCachedInspectionById(id);
    if (cached) {
      return cached;
    }
    throw err;
  }
}

export async function createInspection(data: Partial<InspectionRecord>): Promise<InspectionRecord> {
  const res = await fetch(`${API_BASE}/inspections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create inspection record');
  const created: InspectionRecord = await res.json();
  void cacheInspection(created);
  return created;
}

const inFlightAnalyzeMap = new Map<string, Promise<any>>();
const analyzeResultCache = new Map<string, { timestamp: number; data: any }>();
const ANALYZE_CACHE_TTL_MS = 10 * 60 * 1000;

export async function analyzeInspection(
  id: string,
  imagesOrPayload?: any[] | {
    images?: any[];
    package_level?: string;
    bulk_box_details?: any;
    demo_preset_id?: string;
    scan_id?: string;
    skip_ai?: boolean;
    calibration?: any;
    local_ocr?: {
      panels: LocalOcrPanelResult[];
      declarations: ExtractedDeclaration[];
      avgConfidence: number;
      lowConfidenceDetected: boolean;
      warnings: string[];
    };
  },
  timeoutMs: number = 65000,
  externalSignal?: AbortSignal
): Promise<{
  success: boolean;
  inspection: InspectionRecord;
  ai_source: string;
  ai_status?: AiAnalysisStatus;
  advisory_message?: string;
  analysis_meta?: AnalysisExecutionMetadata;
  certificate?: any;
}> {
  const payload = Array.isArray(imagesOrPayload)
    ? { images: imagesOrPayload }
    : (imagesOrPayload || {});

  const fingerprint = JSON.stringify({
    id,
    demo: payload.demo_preset_id,
    skipAi: !!payload.skip_ai,
    pkg: payload.package_level,
    imgs: (payload.images || []).map((img: any) => img.sha256 || img.id || img.name),
    ocrCount: payload.local_ocr?.panels?.length || 0,
  });

  const cached = analyzeResultCache.get(fingerprint);
  if (cached && Date.now() - cached.timestamp < ANALYZE_CACHE_TTL_MS) {
    return cached.data;
  }

  const existingInFlight = inFlightAnalyzeMap.get(fingerprint);
  if (existingInFlight) {
    return existingInFlight;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Screening cancelled', 'AbortError');
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const requestPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/inspections/${id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(sanitizeErrorMessage(err.error || 'Inspection analysis failed'));
      }
      const data = await res.json();
      if (data?.inspection) {
        void cacheInspection(data.inspection);
      }
      analyzeResultCache.set(fingerprint, { timestamp: Date.now(), data });
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new DOMException('Screening cancelled', 'AbortError');
        }
        throw new Error(`Screening analysis timed out after ${Math.round(timeoutMs / 1000)}s. Please retry or use local OCR screening.`);
      }
      throw new Error(sanitizeErrorMessage(error?.message));
    } finally {
      externalSignal?.removeEventListener('abort', onExternalAbort);
      inFlightAnalyzeMap.delete(fingerprint);
    }
  })();

  inFlightAnalyzeMap.set(fingerprint, requestPromise);
  return requestPromise;
}

export async function verifyInspection(
  id: string,
  verification: {
    rule_id?: string;
    status?: ComplianceStatus;
    overall_status?: ComplianceStatus;
    reason: string;
    officer_name?: string;
    officer_id?: string;
    officer_role?: string;
    general_remarks?: string;
  }
): Promise<{ success: boolean; inspection: InspectionRecord }> {
  const res = await fetch(`${API_BASE}/inspections/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(verification),
  });
  if (!res.ok) throw new Error('Failed to record verification');
  const data = await res.json();
  if (data?.inspection) void cacheInspection(data.inspection);
  return data;
}

export async function recalibrateFrontOcrApi(
  id: string,
  officer_name?: string,
  local_ocr?: {
    panel?: LocalOcrPanelResult;
    declarations?: ExtractedDeclaration[];
  }
): Promise<{
  success: boolean;
  inspection: InspectionRecord;
  ai_status?: AiAnalysisStatus;
  ai_assisted_completed?: boolean;
  advisory_message?: string;
}> {
  const res = await fetch(`${API_BASE}/inspections/${id}/recalibrate-front-ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      officer_name: officer_name || 'Enforcement Officer',
      ...(local_ocr ? { local_ocr } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Recalibration failed' }));
    throw new Error(sanitizeErrorMessage(err.error || 'Failed to recalibrate front OCR'));
  }
  const data = await res.json();
  if (data?.inspection) void cacheInspection(data.inspection);
  return data;
}

export async function calibrateBoxApi(
  id: string,
  calibration: { field: string; bbox?: any; box_2d?: number[]; officer_name?: string }
): Promise<{ success: boolean; inspection: InspectionRecord }> {
  const res = await fetch(`${API_BASE}/inspections/${id}/calibrate-box`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(calibration),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Calibration failed' }));
    throw new Error(err.error || 'Failed to calibrate bounding box');
  }
  const data = await res.json();
  if (data?.inspection) void cacheInspection(data.inspection);
  return data;
}

export async function fetchRules(): Promise<RuleDefinition[]> {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

export async function saveRule(rule: RuleDefinition): Promise<RuleDefinition> {
  const res = await fetch(`${API_BASE}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Failed to save rule');
  return res.json();
}

export async function updateRule(
  id: string,
  updates: Partial<RuleDefinition> & { actor_name?: string; actor_role?: string; rationale?: string }
): Promise<RuleDefinition> {
  const res = await fetch(`${API_BASE}/rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update rule');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo data');
}

export async function updateDisputeStatus(
  id: string,
  data: {
    status: string;
    manufacturer_response?: string;
    officer_decision?: string;
    officer_name?: string;
  }
): Promise<{ success: boolean; inspection: InspectionRecord }> {
  const res = await fetch(`${API_BASE}/inspections/${id}/dispute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update dispute status');
  const data_res = await res.json();
  if (data_res?.inspection) void cacheInspection(data_res.inspection);
  return data_res;
}

export async function fetchRuleAuditLogs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/rules/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch rule audit logs');
  return res.json();
}

export async function submitBulkIntake(data: {
  batch_name?: string;
  officer_name?: string;
  items: any[];
}): Promise<{
  success: boolean;
  batch_name: string;
  processed_count: number;
  successful_count: number;
  failed_count: number;
  items_results: Array<{
    index: number;
    source: string;
    status: 'SUCCESS' | 'ERROR';
    product_name?: string;
    inspection_id?: string;
    error?: string;
    inspection?: InspectionRecord;
  }>;
  inspections: InspectionRecord[];
}> {
  const res = await fetch(`${API_BASE}/bulk-intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to process bulk intake');
  const resData = await res.json();
  if (Array.isArray(resData?.inspections)) {
    void cacheInspectionsBatch(resData.inspections);
  }
  return resData;
}

export async function syncOfflineInspections(
  queued_records: InspectionRecord[]
): Promise<{ success: boolean; synced_count: number; synced_ids: string[]; synced_at: string }> {
  const res = await fetch(`${API_BASE}/inspections/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queued_records }),
  });
  if (!res.ok) throw new Error('Failed to sync offline records');
  void cacheInspectionsBatch(queued_records.map((r) => ({ ...r, sync_status: 'SYNCED' })));
  return res.json();
}

// Certificate of Compliance
export async function fetchCertificates(params?: {
  status?: string;
  query?: string;
  inspection_id?: string;
}): Promise<ComplianceCertificate[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/certificates`);
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.query) url.searchParams.set('query', params.query);
  if (params?.inspection_id) url.searchParams.set('inspection_id', params.inspection_id);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch compliance certificates');
  return res.json();
}

export async function fetchCertificateById(id: string): Promise<ComplianceCertificate> {
  const res = await fetch(`${API_BASE}/certificates/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Certificate not found' }));
    throw new Error(err.error || `Certificate ${id} not found`);
  }
  return res.json();
}

export async function generateCertificate(data: {
  inspection_id: string;
  validity_months?: number;
  officer_name?: string;
  officer_role?: string;
  officer_badge_id?: string;
  inspecting_officer?: {
    name?: string;
    role?: string;
    badge_id?: string;
  };
}): Promise<{ success: boolean; certificate: ComplianceCertificate; already_issued?: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to generate certificate' }));
    throw new Error(err.error || err.reasons?.join(', ') || 'Failed to generate certificate');
  }
  return res.json();
}

export async function revokeCertificate(
  id: string,
  data: {
    revoked_by: string;
    reason: string;
    ref_inspection_id?: string;
  }
): Promise<{ success: boolean; certificate: ComplianceCertificate }> {
  const res = await fetch(`${API_BASE}/certificates/${id}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to revoke certificate' }));
    throw new Error(err.error || 'Failed to revoke certificate');
  }
  return res.json();
}

// Unified System Audit Trail
export async function fetchSystemAuditLogs(category?: string): Promise<SystemAuditLogEntry[]> {
  const url = new URL(`${window.location.origin}${API_BASE}/audit-logs`);
  if (category) url.searchParams.set('category', category);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch system audit logs');
  return res.json();
}

export async function logSystemAuditEntry(entry: Omit<SystemAuditLogEntry, 'id' | 'timestamp'>): Promise<SystemAuditLogEntry> {
  const res = await fetch(`${API_BASE}/audit-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Failed to log system audit entry');
  return res.json();
}

// System Notifications
export async function fetchNotifications(): Promise<SystemNotification[]> {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}

// Repeat Offender / Manufacturer Risk Matrix
export async function fetchManufacturerRiskProfiles(days: number = 90): Promise<ManufacturerRiskProfile[]> {
  try {
    const res = await fetch(`${API_BASE}/risk-scoring?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch manufacturer risk profiles');
    return await res.json();
  } catch (err) {
    const cached = await getCachedDashboardSnapshot();
    if (cached.riskProfiles.length > 0) {
      return cached.riskProfiles;
    }
    throw err;
  }
}

// GTIN / Barcode Cross-Registry Search
export async function searchGtinRegistry(barcode: string): Promise<GtinLookupResult> {
  const res = await fetch(`${API_BASE}/search/gtin/${encodeURIComponent(barcode)}`);
  if (!res.ok) throw new Error('Failed to lookup barcode in registry');
  return res.json();
}

export async function fetchProductFromUrl(url: string): Promise<{
  product_name: string;
  brand: string;
  category: ProductCategory;
  description?: string;
  image: InspectionImage;
  source_url: string;
  platform: string;
  barcode?: string;
  net_quantity?: string;
  mrp?: string;
}> {
  const res = await fetch(`${API_BASE}/intake/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch product from URL' }));
    throw new Error(err.error || 'Failed to fetch product from URL');
  }
  const data = await res.json();
  return data.product;
}

export const getCurrentUser = fetchCurrentUser;
