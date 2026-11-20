import { assessDetection } from '../engine/riskEngine';
import type {
  AssessedDetection,
  BackendConnectionStatus,
  HotspotCluster,
  RawDetectionRecord,
  RiskConfig,
  SurveyReport,
} from '../types/anomasea';

const API_BASE_URL_STORAGE_KEY = 'anomasea_api_base_url';

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id?: string | number;
    geometry?: {
      type: string;
      coordinates?: [number, number, ...number[]];
    };
    properties?: Partial<RawDetectionRecord> & Record<string, unknown>;
  }>;
}

export const FASTAPI_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/risk/geojson',
    desc: 'Survey detections FeatureCollection',
  },
  {
    method: 'GET',
    path: '/api/risk/hotspots',
    desc: 'DBSCAN spatial cluster metrics',
  },
  {
    method: 'GET',
    path: '/api/risk/heatmap',
    desc: 'Risk-weighted [lat, lng, intensity] array',
  },
  {
    method: 'GET',
    path: '/api/risk/summary',
    desc: 'Aggregated survey statistics',
  },
  {
    method: 'POST',
    path: '/api/risk/assess',
    desc: 'Score individual detection (0–100)',
  },
  {
    method: 'POST',
    path: '/api/risk/report',
    desc: 'Archive or generate survey report',
  },
] as const;

export function getEnvApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  return typeof envUrl === 'string' ? envUrl.trim().replace(/\/+$/, '') : '';
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored.trim().replace(/\/+$/, '');
    }
  }
  return getEnvApiBaseUrl();
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const normalized = url.trim().replace(/\/+$/, '');
  if (normalized) {
    window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized);
  } else {
    window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
  }
}

async function fetchJsonWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 3500,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export function parseGeoJsonFeatures(
  fc: GeoJsonFeatureCollection,
): RawDetectionRecord[] {
  return fc.features
    .filter(
      (feature) =>
        feature.geometry?.type === 'Point' &&
        Array.isArray(feature.geometry.coordinates) &&
        feature.geometry.coordinates.length >= 2,
    )
    .map((feature, index) => {
      const [lng, lat] = feature.geometry!.coordinates!;
      const props = feature.properties ?? {};
      return {
        id:
          (typeof props.id === 'string' && props.id) ||
          String(feature.id ?? `OBS-${index + 1}`),
        catalogueClassId:
          (typeof props.catalogueClassId === 'string' && props.catalogueClassId) ||
          'unknown_reflective',
        objectName:
          (typeof props.objectName === 'string' && props.objectName) ||
          'Unclassified Object',
        category:
          (props.category as RawDetectionRecord['category']) ||
          'Unknown Underwater Anomalies',
        lat: Number(lat),
        lng: Number(lng),
        gpsUncertaintyMeters: Number(props.gpsUncertaintyMeters ?? 10),
        aiConfidence: Number(props.aiConfidence ?? 75),
        condition:
          (props.condition as RawDetectionRecord['condition']) ||
          'Partially Degraded',
        size: (props.size as RawDetectionRecord['size']) || 'Medium',
        verificationStatus:
          (props.verificationStatus as RawDetectionRecord['verificationStatus']) ||
          'Pending Review',
        observedAt:
          (typeof props.observedAt === 'string' && props.observedAt) ||
          new Date().toISOString(),
        surveyZone:
          (typeof props.surveyZone === 'string' && props.surveyZone) ||
          'Coastal Survey Sector',
        depthMeters:
          props.depthMeters !== undefined ? Number(props.depthMeters) : undefined,
        observationCount:
          props.observationCount !== undefined
            ? Number(props.observationCount)
            : 1,
        notes: typeof props.notes === 'string' ? props.notes : undefined,
        isSynthetic: Boolean(props.isSynthetic ?? false),
      };
    });
}

export const riskApi = {
  async fetchGeoJson(baseUrl = getApiBaseUrl()): Promise<RawDetectionRecord[]> {
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL not configured');
    }
    const payload = await fetchJsonWithTimeout<GeoJsonFeatureCollection>(
      `${baseUrl}/api/risk/geojson`,
    );
    return parseGeoJsonFeatures(payload);
  },

  async fetchHotspots(baseUrl = getApiBaseUrl()): Promise<HotspotCluster[]> {
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL not configured');
    }
    return fetchJsonWithTimeout<HotspotCluster[]>(`${baseUrl}/api/risk/hotspots`);
  },

  async fetchHeatmap(
    baseUrl = getApiBaseUrl(),
  ): Promise<Array<[number, number, number]>> {
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL not configured');
    }
    return fetchJsonWithTimeout<Array<[number, number, number]>>(
      `${baseUrl}/api/risk/heatmap`,
    );
  },

  async fetchSummary(
    baseUrl = getApiBaseUrl(),
  ): Promise<Record<string, unknown>> {
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL not configured');
    }
    return fetchJsonWithTimeout<Record<string, unknown>>(
      `${baseUrl}/api/risk/summary`,
    );
  },

  async assessDetection(
    detection: RawDetectionRecord,
    config: RiskConfig,
    baseUrl = getApiBaseUrl(),
  ): Promise<{ assessed: AssessedDetection; fromBackend: boolean }> {
    if (!baseUrl) {
      return { assessed: assessDetection(detection, config), fromBackend: false };
    }
    try {
      const assessed = await fetchJsonWithTimeout<AssessedDetection>(
        `${baseUrl}/api/risk/assess`,
        {
          method: 'POST',
          body: JSON.stringify({ detection, config }),
        },
      );
      return { assessed, fromBackend: true };
    } catch {
      return { assessed: assessDetection(detection, config), fromBackend: false };
    }
  },

  async submitReport(
    report: SurveyReport,
    baseUrl = getApiBaseUrl(),
  ): Promise<{ sentToBackend: boolean; response?: unknown }> {
    if (!baseUrl) {
      return { sentToBackend: false };
    }
    try {
      const response = await fetchJsonWithTimeout<unknown>(
        `${baseUrl}/api/risk/report`,
        {
          method: 'POST',
          body: JSON.stringify(report),
        },
      );
      return { sentToBackend: true, response };
    } catch {
      return { sentToBackend: false };
    }
  },

  async testConnection(
    baseUrl = getApiBaseUrl(),
  ): Promise<BackendConnectionStatus> {
    if (!baseUrl) {
      return {
        connected: false,
        baseUrl: '',
        message:
          'No backend URL configured. Operating in Local Demonstration Mode with clearly labelled synthetic records.',
      };
    }
    const start = performance.now();
    try {
      await fetchJsonWithTimeout<unknown>(`${baseUrl}/api/risk/summary`);
      return {
        connected: true,
        baseUrl,
        latencyMs: Math.round(performance.now() - start),
        message: `Connected to FastAPI Risk Engine at ${baseUrl}.`,
      };
    } catch (error) {
      return {
        connected: false,
        baseUrl,
        message: `FastAPI backend unreachable (${
          error instanceof Error ? error.message : 'Connection failed'
        }). Using Local Demonstration Mode fallback.`,
      };
    }
  },
};
