import {
  DashboardStats,
  InspectionRecord,
  ManufacturerRiskProfile,
} from '../types/index';

const DB_NAME = 'legalmetrix_cache_v1';
const DB_VERSION = 1;
const STORE_INSPECTIONS = 'inspections';
const STORE_META = 'dashboard_meta';
const MAX_CACHED_INSPECTIONS = 100;

interface CachedInspectionEntry extends InspectionRecord {
  _cached_at: string;
  _sort_ts: number;
}

interface CachedMetaEntry<T = unknown> {
  key: string;
  value: T;
  cached_at: string;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openCacheDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbSupported()) {
    return Promise.resolve(null);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_INSPECTIONS)) {
          const store = db.createObjectStore(STORE_INSPECTIONS, { keyPath: 'id' });
          store.createIndex('by_sort_ts', '_sort_ts', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        console.warn('[LegalMetrix IndexedDB] Cache open failed, using runtime fallback.');
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

function toSortTimestamp(record: InspectionRecord): number {
  const raw = record.updated_at || record.created_at;
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

async function pruneOldInspections(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readwrite');
      const store = tx.objectStore(STORE_INSPECTIONS);
      const countReq = store.count();

      countReq.onsuccess = () => {
        const count = countReq.result || 0;
        if (count <= MAX_CACHED_INSPECTIONS) {
          resolve();
          return;
        }
        let toDelete = count - MAX_CACHED_INSPECTIONS;
        const index = store.index('by_sort_ts');
        const cursorReq = index.openCursor(null, 'next');
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && toDelete > 0) {
            cursor.delete();
            toDelete--;
            cursor.continue();
          }
        };
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function cacheInspection(record: InspectionRecord | null | undefined): Promise<void> {
  if (!record || !record.id) return;
  const db = await openCacheDb();
  if (!db) return;

  const entry: CachedInspectionEntry = {
    ...record,
    _cached_at: new Date().toISOString(),
    _sort_ts: toSortTimestamp(record),
  };

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readwrite');
      tx.objectStore(STORE_INSPECTIONS).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });

  await pruneOldInspections(db);
}

export async function cacheInspectionsBatch(records: InspectionRecord[]): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;
  const db = await openCacheDb();
  if (!db) return;

  const nowIso = new Date().toISOString();
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readwrite');
      const store = tx.objectStore(STORE_INSPECTIONS);
      for (const rec of records) {
        if (!rec || !rec.id) continue;
        const entry: CachedInspectionEntry = {
          ...rec,
          _cached_at: nowIso,
          _sort_ts: toSortTimestamp(rec),
        };
        store.put(entry);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });

  await pruneOldInspections(db);
}

export async function getCachedInspectionById(id: string): Promise<InspectionRecord | null> {
  if (!id) return null;
  const db = await openCacheDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readonly');
      const req = tx.objectStore(STORE_INSPECTIONS).get(id);
      req.onsuccess = () => {
        const res = req.result as CachedInspectionEntry | undefined;
        if (!res) {
          resolve(null);
          return;
        }
        const { _cached_at: _c, _sort_ts: _s, ...record } = res;
        resolve(record as InspectionRecord);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getRecentCachedInspections(params?: {
  status?: string;
  category?: string;
  query?: string;
  limit?: number;
}): Promise<InspectionRecord[]> {
  const db = await openCacheDb();
  if (!db) return [];

  const limit = params?.limit ?? 100;
  const allEntries = await new Promise<CachedInspectionEntry[]>((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readonly');
      const index = tx.objectStore(STORE_INSPECTIONS).index('by_sort_ts');
      const items: CachedInspectionEntry[] = [];
      const cursorReq = index.openCursor(null, 'prev');

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          items.push(cursor.value as CachedInspectionEntry);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
      cursorReq.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });

  const statusFilter = params?.status && params.status !== 'ALL' ? params.status.toUpperCase() : null;
  const categoryFilter = params?.category && params.category !== 'ALL' ? params.category : null;
  const q = params?.query?.trim().toLowerCase() || '';

  const filtered = allEntries
    .filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (q) {
        const hay = `${item.id} ${item.product_name || ''} ${item.brand || ''} ${item.officer_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .slice(0, limit)
    .map(({ _cached_at: _c, _sort_ts: _s, ...record }) => record as InspectionRecord);

  return filtered;
}

export async function removeCachedInspection(id: string): Promise<void> {
  if (!id) return;
  const db = await openCacheDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readwrite');
      tx.objectStore(STORE_INSPECTIONS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function cacheDashboardSnapshot(
  stats: DashboardStats,
  riskProfiles?: ManufacturerRiskProfile[]
): Promise<void> {
  const db = await openCacheDb();
  if (!db) return;

  const nowIso = new Date().toISOString();
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readwrite');
      const store = tx.objectStore(STORE_META);
      store.put({ key: 'latest_stats', value: stats, cached_at: nowIso } as CachedMetaEntry<DashboardStats>);
      if (riskProfiles) {
        store.put({
          key: 'risk_profiles',
          value: riskProfiles,
          cached_at: nowIso,
        } as CachedMetaEntry<ManufacturerRiskProfile[]>);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });

  if (stats?.recent_inspections?.length) {
    await cacheInspectionsBatch(stats.recent_inspections);
  }
}

export async function getCachedDashboardSnapshot(): Promise<{
  stats: DashboardStats | null;
  riskProfiles: ManufacturerRiskProfile[];
  cachedAt?: string;
}> {
  const db = await openCacheDb();
  if (!db) return { stats: null, riskProfiles: [] };

  const meta = await new Promise<{
    statsEntry?: CachedMetaEntry<DashboardStats>;
    riskEntry?: CachedMetaEntry<ManufacturerRiskProfile[]>;
  }>((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const statsReq = store.get('latest_stats');
      const riskReq = store.get('risk_profiles');
      let statsEntry: CachedMetaEntry<DashboardStats> | undefined;
      let riskEntry: CachedMetaEntry<ManufacturerRiskProfile[]> | undefined;

      statsReq.onsuccess = () => {
        statsEntry = statsReq.result;
      };
      riskReq.onsuccess = () => {
        riskEntry = riskReq.result;
      };
      tx.oncomplete = () => resolve({ statsEntry, riskEntry });
      tx.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });

  if (meta.statsEntry?.value) {
    return {
      stats: meta.statsEntry.value,
      riskProfiles: meta.riskEntry?.value || [],
      cachedAt: meta.statsEntry.cached_at,
    };
  }

  // Synthesize minimal DashboardStats from cached inspections if stats snapshot has not been stored yet
  const cachedInspections = await getRecentCachedInspections({ limit: 50 });
  if (cachedInspections.length === 0) {
    return { stats: null, riskProfiles: [] };
  }

  const passed = cachedInspections.filter((i) => i.status === 'PASS').length;
  const failed = cachedInspections.filter((i) => i.status === 'FAIL').length;
  const review = cachedInspections.filter((i) => i.status === 'REVIEW').length;
  const total = cachedInspections.length;
  const avgScore =
    total > 0
      ? Math.round(cachedInspections.reduce((sum, i) => sum + (i.screening_score || 0), 0) / total)
      : 0;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return {
    stats: {
      total_inspections: total,
      compliant_count: passed,
      non_compliant_count: failed,
      review_count: review,
      average_screening_score: avgScore,
      status_distribution: [
        { status: 'PASS', count: passed, percentage: pct(passed) },
        { status: 'FAIL', count: failed, percentage: pct(failed) },
        { status: 'REVIEW', count: review, percentage: pct(review) },
      ],
      violations_by_declaration: [],
      inspections_over_time: [],
      category_distribution: [],
      dispute_stats: {
        open_count: cachedInspections.filter((i) => i.dispute_status === 'OPEN').length,
        under_review_count: cachedInspections.filter((i) => i.dispute_status === 'UNDER_MANUFACTURER_REVIEW').length,
        resolved_count: cachedInspections.filter((i) =>
          i.dispute_status === 'RESOLVED_UPHELD' ||
          i.dispute_status === 'RESOLVED_DISMISSED' ||
          i.dispute_status === 'COMPOUNDED'
        ).length,
      },
      calibration_stats: {
        calibrated_count: cachedInspections.filter((i) => i.readability_analysis?.is_calibrated).length,
        uncalibrated_count: cachedInspections.filter((i) => !i.readability_analysis?.is_calibrated).length,
      },
      recent_inspections: cachedInspections.slice(0, 10),
    },
    riskProfiles: meta.riskEntry?.value || [],
  };
}

export async function getIndexedDbCacheStats(): Promise<{ count: number; lastCachedAt?: string }> {
  const db = await openCacheDb();
  if (!db) return { count: 0 };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_INSPECTIONS, 'readonly');
      const store = tx.objectStore(STORE_INSPECTIONS);
      const countReq = store.count();
      const index = store.index('by_sort_ts');
      const latestReq = index.openCursor(null, 'prev');

      let count = 0;
      let lastCachedAt: string | undefined;

      countReq.onsuccess = () => {
        count = countReq.result || 0;
      };
      latestReq.onsuccess = () => {
        const cursor = latestReq.result;
        if (cursor?.value?._cached_at) {
          lastCachedAt = cursor.value._cached_at;
        }
      };

      tx.oncomplete = () => resolve({ count, lastCachedAt });
      tx.onerror = () => resolve({ count: 0 });
    } catch {
      resolve({ count: 0 });
    }
  });
}

export async function clearInspectionCache(): Promise<void> {
  const db = await openCacheDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE_INSPECTIONS, STORE_META], 'readwrite');
      tx.objectStore(STORE_INSPECTIONS).clear();
      tx.objectStore(STORE_META).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
