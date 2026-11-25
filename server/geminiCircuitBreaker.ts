import type { AiEngineStatusSnapshot, AiModelHealthSnapshot } from '../src/types/index';

export const SUPPORTED_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
export type SupportedGeminiModel = (typeof SUPPORTED_MODELS)[number];

export const ADVISORY_AI_UNAVAILABLE =
  'AI-assisted analysis is temporarily unavailable. Local OCR and compliance validation are continuing.';
export const ADVISORY_AI_CONFIG_ERROR =
  'AI-assisted analysis could not be used with the current service configuration. Local OCR and compliance validation are continuing.';
export const ADVISORY_AI_SKIPPED =
  'Scan completed using local OCR and deterministic Legal Metrology rule validation.';

export type GeminiErrorCategory =
  | 'RATE_LIMIT_MINUTE'
  | 'RATE_LIMIT_DAILY'
  | 'SERVICE_UNAVAILABLE'
  | 'CONFIG_OR_AUTH_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory;
  httpStatus?: number;
  retryAfterMs?: number;
  retryable: boolean;
  dailyExhausted: boolean;
  safeReason: string;
}

interface ModelRuntimeState {
  cooldownUntil: number | null;
  cooldownReason?: string;
  dailyExhaustedUntil: number | null;
  lastErrorCategory?: GeminiErrorCategory;
  consecutiveFailures: number;
}

interface RuntimeConfigState {
  primaryModel: string;
  fallbackModel: string;
  timeoutMs: number;
  maxRetries: number;
  aiEnabled: boolean;
  lastConfigError?: string;
}

function resolveSupportedModel(candidate: string | undefined, defaultModel: SupportedGeminiModel): string {
  const cleaned = (candidate || '').trim();
  if ((SUPPORTED_MODELS as readonly string[]).includes(cleaned)) {
    return cleaned;
  }
  return defaultModel;
}

const state: {
  config: RuntimeConfigState;
  models: Map<string, ModelRuntimeState>;
  responseCache: Map<string, { value: any; expiresAt: number }>;
  inFlight: Map<string, Promise<any>>;
} = {
  config: {
    primaryModel: resolveSupportedModel(process.env.GEMINI_MODEL, 'gemini-4-hydrogen'),
    fallbackModel: resolveSupportedModel(process.env.GEMINI_FALLBACK_MODEL, 'gemini-3.1-flash-lite'),
    timeoutMs: Math.max(5000, Math.min(60000, Number(process.env.GEMINI_TIMEOUT_MS) || 18000)),
    maxRetries: Math.max(1, Math.min(3, Number(process.env.GEMINI_MAX_RETRIES) || 2)),
    aiEnabled: process.env.AI_ASSISTED_ANALYSIS_ENABLED !== 'false',
  },
  models: new Map(),
  responseCache: new Map(),
  inFlight: new Map(),
};

function getOrCreateModelState(model: string): ModelRuntimeState {
  let entry = state.models.get(model);
  if (!entry) {
    entry = {
      cooldownUntil: null,
      dailyExhaustedUntil: null,
      consecutiveFailures: 0,
    };
    state.models.set(model, entry);
  }
  return entry;
}

function nextUtcMidnightMs(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0, 0);
  return Math.max(next, Date.now() + 6 * 3600 * 1000);
}

function parseRetryDelayMs(rawDelay: unknown): number | undefined {
  if (typeof rawDelay === 'number' && Number.isFinite(rawDelay) && rawDelay > 0) {
    return rawDelay < 1000 ? rawDelay * 1000 : rawDelay;
  }
  if (typeof rawDelay !== 'string') return undefined;
  const trimmed = rawDelay.trim().toLowerCase();
  const msMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*ms$/);
  if (msMatch) return Math.round(parseFloat(msMatch[1]));
  const secMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*s$/);
  if (secMatch) return Math.round(parseFloat(secMatch[1]) * 1000);
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) return Math.round(parseFloat(numMatch[1]) * 1000);
  return undefined;
}

function tryParseEmbeddedJson(msg: string): any | null {
  const start = msg.indexOf('{');
  const end = msg.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(msg.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function classifyGeminiError(err: any): ClassifiedGeminiError {
  const rawMessage = String(err?.message || err || '');
  const embedded = tryParseEmbeddedJson(rawMessage);
  const errorObj = err?.error || embedded?.error || err;

  const statusNum =
    Number(err?.status) ||
    Number(err?.statusCode) ||
    Number(errorObj?.code) ||
    (rawMessage.includes('429')
      ? 429
      : rawMessage.includes('503')
      ? 503
      : rawMessage.includes('401')
      ? 401
      : rawMessage.includes('403')
      ? 403
      : rawMessage.includes('400')
      ? 400
      : undefined);

  const grpcStatus = String(errorObj?.status || err?.code || '').toUpperCase();
  const details: any[] = Array.isArray(errorObj?.details)
    ? errorObj.details
    : Array.isArray(err?.details)
    ? err.details
    : [];

  let retryAfterMs: number | undefined;
  let isDailyQuota = false;
  let isMinuteQuota = false;

  for (const detail of details) {
    const typeStr = String(detail?.['@type'] || '');
    if (typeStr.includes('RetryInfo') || detail?.retryDelay !== undefined) {
      retryAfterMs = parseRetryDelayMs(detail.retryDelay) ?? retryAfterMs;
    }
    if (typeStr.includes('QuotaFailure') || Array.isArray(detail?.violations)) {
      const violations = Array.isArray(detail?.violations) ? detail.violations : [];
      const blob = JSON.stringify(violations).toLowerCase();
      if (
        blob.includes('requestsperday') ||
        blob.includes('perday') ||
        blob.includes('daily') ||
        blob.includes('limit: 0') ||
        blob.includes('limit_value:0')
      ) {
        isDailyQuota = true;
      }
      if (blob.includes('perminute') || blob.includes('rpm') || blob.includes('tpm')) {
        isMinuteQuota = true;
      }
    }
  }

  if (!retryAfterMs) {
    const retryTextMatch = rawMessage.match(/retry\s*(?:in|after)\s*(\d+(?:\.\d+)?)\s*(ms|s|sec|seconds)?/i);
    if (retryTextMatch) {
      const val = parseFloat(retryTextMatch[1]);
      const unit = (retryTextMatch[2] || 's').toLowerCase();
      retryAfterMs = unit.startsWith('ms') ? Math.round(val) : Math.round(val * 1000);
    }
  }

  const lower = rawMessage.toLowerCase();
  if (
    lower.includes('requestsperday') ||
    lower.includes('per_day') ||
    lower.includes('daily quota') ||
    lower.includes('limit: 0') ||
    lower.includes('free_tier_requests') && lower.includes('day')
  ) {
    isDailyQuota = true;
  }

  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('abort')) {
    return {
      category: 'TIMEOUT',
      httpStatus: statusNum,
      retryAfterMs: 20_000,
      retryable: false,
      dailyExhausted: false,
      safeReason: 'AI request timed out; local OCR and compliance engine completed the scan.',
    };
  }

  if (
    statusNum === 400 ||
    statusNum === 401 ||
    statusNum === 403 ||
    grpcStatus === 'INVALID_ARGUMENT' ||
    grpcStatus === 'UNAUTHENTICATED' ||
    grpcStatus === 'PERMISSION_DENIED' ||
    lower.includes('api key not valid') ||
    lower.includes('permission denied') ||
    lower.includes('unauthenticated')
  ) {
    return {
      category: 'CONFIG_OR_AUTH_ERROR',
      httpStatus: statusNum,
      retryable: false,
      dailyExhausted: false,
      safeReason: 'AI request rejected due to model or credential configuration.',
    };
  }

  if (statusNum === 429 || grpcStatus === 'RESOURCE_EXHAUSTED' || lower.includes('resource_exhausted') || lower.includes('quota')) {
    if (isDailyQuota && !isMinuteQuota) {
      return {
        category: 'RATE_LIMIT_DAILY',
        httpStatus: 429,
        retryAfterMs: nextUtcMidnightMs() - Date.now(),
        retryable: false,
        dailyExhausted: true,
        safeReason: 'Daily AI quota reached; model paused until reset.',
      };
    }
    return {
      category: 'RATE_LIMIT_MINUTE',
      httpStatus: 429,
      retryAfterMs: Math.max(5_000, Math.min(300_000, retryAfterMs || 45_000)),
      retryable: false,
      dailyExhausted: false,
      safeReason: 'Per-minute AI rate limit reached; model placed on brief cooldown.',
    };
  }

  if (
    statusNum === 503 ||
    grpcStatus === 'UNAVAILABLE' ||
    lower.includes('unavailable') ||
    lower.includes('overloaded') ||
    lower.includes('high demand')
  ) {
    return {
      category: 'SERVICE_UNAVAILABLE',
      httpStatus: 503,
      retryAfterMs: 30_000,
      retryable: true,
      dailyExhausted: false,
      safeReason: 'AI service temporarily busy; bounded retries exhausted.',
    };
  }

  return {
    category: 'UNKNOWN',
    httpStatus: statusNum,
    retryAfterMs: 20_000,
    retryable: false,
    dailyExhausted: false,
    safeReason: 'AI enhancement could not complete; local OCR results preserved.',
  };
}

export function isModelHealthy(model: string): boolean {
  const now = Date.now();
  const m = getOrCreateModelState(model);
  if (m.dailyExhaustedUntil && now < m.dailyExhaustedUntil) return false;
  if (m.cooldownUntil && now < m.cooldownUntil) return false;
  return true;
}

export function recordModelFailure(model: string, classified: ClassifiedGeminiError): void {
  const m = getOrCreateModelState(model);
  m.lastErrorCategory = classified.category;
  m.consecutiveFailures += 1;

  if (classified.category === 'RATE_LIMIT_DAILY' || classified.dailyExhausted) {
    const until = nextUtcMidnightMs();
    m.dailyExhaustedUntil = until;
    m.cooldownUntil = until;
    m.cooldownReason = classified.safeReason;
  } else if (classified.category === 'RATE_LIMIT_MINUTE') {
    m.cooldownUntil = Date.now() + (classified.retryAfterMs || 45_000);
    m.cooldownReason = classified.safeReason;
  } else if (classified.category === 'SERVICE_UNAVAILABLE' || classified.category === 'TIMEOUT') {
    m.cooldownUntil = Date.now() + (classified.retryAfterMs || 30_000);
    m.cooldownReason = classified.safeReason;
  } else if (classified.category === 'CONFIG_OR_AUTH_ERROR') {
    state.config.lastConfigError = classified.safeReason;
    m.cooldownUntil = Date.now() + 120_000;
    m.cooldownReason = classified.safeReason;
  }
}

export function recordModelSuccess(model: string): void {
  const m = getOrCreateModelState(model);
  m.cooldownUntil = null;
  m.dailyExhaustedUntil = null;
  m.cooldownReason = undefined;
  m.lastErrorCategory = undefined;
  m.consecutiveFailures = 0;
  state.config.lastConfigError = undefined;
}

export function getOrderedCandidateModels(): string[] {
  const candidates = [state.config.primaryModel, state.config.fallbackModel].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );
  return candidates.filter((m) => isModelHealthy(m));
}

export function getAiRuntimeConfig(): RuntimeConfigState {
  return { ...state.config };
}

export function updateAiSettings(updates: {
  primaryModel?: string;
  fallbackModel?: string;
  aiEnabled?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
}): AiEngineStatusSnapshot {
  if (updates.primaryModel !== undefined) {
    if (!(SUPPORTED_MODELS as readonly string[]).includes(updates.primaryModel)) {
      throw new Error(`Unsupported model "${updates.primaryModel}". Allowed: ${SUPPORTED_MODELS.join(', ')}`);
    }
    state.config.primaryModel = updates.primaryModel;
  }
  if (updates.fallbackModel !== undefined) {
    if (!(SUPPORTED_MODELS as readonly string[]).includes(updates.fallbackModel)) {
      throw new Error(`Unsupported fallback model "${updates.fallbackModel}". Allowed: ${SUPPORTED_MODELS.join(', ')}`);
    }
    state.config.fallbackModel = updates.fallbackModel;
  }
  if (typeof updates.aiEnabled === 'boolean') {
    state.config.aiEnabled = updates.aiEnabled;
  }
  if (typeof updates.timeoutMs === 'number' && Number.isFinite(updates.timeoutMs)) {
    state.config.timeoutMs = Math.max(5000, Math.min(60000, Math.round(updates.timeoutMs)));
  }
  if (typeof updates.maxRetries === 'number' && Number.isFinite(updates.maxRetries)) {
    state.config.maxRetries = Math.max(1, Math.min(3, Math.round(updates.maxRetries)));
  }
  return getAiStatusSnapshot();
}

export function getAiStatusSnapshot(): AiEngineStatusSnapshot {
  const configured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  const now = Date.now();
  const trackedModels = Array.from(
    new Set<string>([...SUPPORTED_MODELS, state.config.primaryModel, state.config.fallbackModel])
  );

  const models: AiModelHealthSnapshot[] = trackedModels.map((model) => {
    const m = getOrCreateModelState(model);
    const activeCooldown = m.cooldownUntil && now < m.cooldownUntil ? new Date(m.cooldownUntil).toISOString() : null;
    const activeDaily =
      m.dailyExhaustedUntil && now < m.dailyExhaustedUntil ? new Date(m.dailyExhaustedUntil).toISOString() : null;
    return {
      model,
      available: configured && state.config.aiEnabled && !activeCooldown && !activeDaily,
      cooldownUntil: activeCooldown,
      cooldownReason: activeCooldown ? m.cooldownReason : undefined,
      dailyExhaustedUntil: activeDaily,
      lastErrorCategory: m.lastErrorCategory,
    };
  });

  const healthyCount = models.filter((m) => m.available).length;
  const available = configured && state.config.aiEnabled && healthyCount > 0;

  let advisoryMessage: string | undefined;
  if (!state.config.aiEnabled) {
    advisoryMessage = ADVISORY_AI_SKIPPED;
  } else if (!configured || state.config.lastConfigError) {
    advisoryMessage = ADVISORY_AI_UNAVAILABLE;
  } else if (healthyCount === 0) {
    advisoryMessage = ADVISORY_AI_UNAVAILABLE;
  }

  return {
    configured,
    aiEnabled: state.config.aiEnabled,
    available,
    primaryModel: state.config.primaryModel,
    fallbackModel: state.config.fallbackModel,
    supportedModels: [...SUPPORTED_MODELS],
    timeoutMs: state.config.timeoutMs,
    maxRetries: state.config.maxRetries,
    advisoryMessage,
    models,
  };
}

export function getCachedAnalysisResponse<T>(cacheKey: string): T | undefined {
  const entry = state.responseCache.get(cacheKey);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    state.responseCache.delete(cacheKey);
    return undefined;
  }
  return entry.value as T;
}

export function setCachedAnalysisResponse<T>(cacheKey: string, value: T, ttlMs = 15 * 60 * 1000): void {
  if (state.responseCache.size >= 100) {
    const oldestKey = state.responseCache.keys().next().value;
    if (oldestKey) state.responseCache.delete(oldestKey);
  }
  state.responseCache.set(cacheKey, { value, expiresAt: Date.now() + ttlMs });
}

export function getInFlightAnalysis<T>(cacheKey: string): Promise<T> | undefined {
  return state.inFlight.get(cacheKey) as Promise<T> | undefined;
}

export function setInFlightAnalysis<T>(cacheKey: string, promise: Promise<T>): void {
  state.inFlight.set(cacheKey, promise);
  promise.finally(() => {
    state.inFlight.delete(cacheKey);
  });
}

export function resetAiCircuitState(): void {
  state.models.clear();
  state.responseCache.clear();
  state.inFlight.clear();
  state.config.lastConfigError = undefined;
  state.config.primaryModel = resolveSupportedModel(process.env.GEMINI_MODEL, 'gemini-4-hydrogen');
  state.config.fallbackModel = resolveSupportedModel(process.env.GEMINI_FALLBACK_MODEL, 'gemini-3.1-flash-lite');
  state.config.timeoutMs = Math.max(5000, Math.min(60000, Number(process.env.GEMINI_TIMEOUT_MS) || 18000));
  state.config.maxRetries = Math.max(1, Math.min(3, Number(process.env.GEMINI_MAX_RETRIES) || 2));
  state.config.aiEnabled = process.env.AI_ASSISTED_ANALYSIS_ENABLED !== 'false';
}
