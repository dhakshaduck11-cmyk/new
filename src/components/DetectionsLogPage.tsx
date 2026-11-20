import { useRef, useState } from 'react';
import {
  AlertCircle,
  MapPin,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react';
import {
  VERIFICATION_STATUSES,
} from '../engine/riskEngine';
import {
  parseGeoJsonFeatures,
  type GeoJsonFeatureCollection,
} from '../services/riskApi';
import type {
  AssessedDetection,
  RawDetectionRecord,
  SourceMode,
  VerificationStatus,
} from '../types/anomasea';

interface DetectionsLogPageProps {
  detections: AssessedDetection[];
  sourceMode: SourceMode;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onUpdateVerification: (id: string, status: VerificationStatus) => void;
  onLocateOnRadar: (detection: AssessedDetection) => void;
  onImportRecords: (records: RawDetectionRecord[]) => void;
  onRestoreDemoRecords: () => void;
}

export function DetectionsLogPage({
  detections,
  sourceMode,
  searchQuery,
  onSearchChange,
  onUpdateVerification,
  onLocateOnRadar,
  onImportRecords,
  onRestoreDemoRecords,
}: DetectionsLogPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportNotice(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      let records: RawDetectionRecord[] = [];
      if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed as GeoJsonFeatureCollection).type === 'FeatureCollection' &&
        Array.isArray((parsed as GeoJsonFeatureCollection).features)
      ) {
        records = parseGeoJsonFeatures(parsed as GeoJsonFeatureCollection);
      } else if (Array.isArray(parsed)) {
        records = parsed
          .filter(
            (item): item is Partial<RawDetectionRecord> =>
              Boolean(item) &&
              typeof item === 'object' &&
              typeof (item as RawDetectionRecord).lat === 'number' &&
              typeof (item as RawDetectionRecord).lng === 'number',
          )
          .map((item, idx) => ({
            id: item.id ?? `IMP-${idx + 1}`,
            catalogueClassId: item.catalogueClassId ?? 'unknown_reflective',
            objectName: item.objectName ?? 'Imported Marine Object',
            category: item.category ?? 'Unknown Underwater Anomalies',
            lat: Number(item.lat),
            lng: Number(item.lng),
            gpsUncertaintyMeters: Number(item.gpsUncertaintyMeters ?? 10),
            aiConfidence: Number(item.aiConfidence ?? 75),
            condition: item.condition ?? 'Partially Degraded',
            size: item.size ?? 'Medium',
            verificationStatus: item.verificationStatus ?? 'Pending Review',
            observedAt: item.observedAt ?? new Date().toISOString(),
            surveyZone: item.surveyZone ?? 'Imported Survey Sector',
            depthMeters:
              item.depthMeters !== undefined
                ? Number(item.depthMeters)
                : undefined,
            observationCount: item.observationCount ?? 1,
            notes: item.notes,
            isSynthetic: false,
          }));
      }

      if (records.length === 0) {
        setImportError(
          'No valid Point features or detection records found in the uploaded file.',
        );
        return;
      }

      onImportRecords(records);
      setImportNotice(
        `Loaded ${records.length} detections from ${file.name}.`,
      );
    } catch (err) {
      setImportError(
        err instanceof Error
          ? `Failed to parse GeoJSON / JSON: ${err.message}`
          : 'Failed to parse uploaded file.',
      );
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Import Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">
              Survey Record Inventory ·{' '}
              {sourceMode === 'live-api'
                ? 'Live FastAPI Dataset'
                : sourceMode === 'imported-survey'
                  ? 'Imported Field Survey GeoJSON'
                  : 'Local Demonstration Mode (Synthetic Records)'}
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
              Underwater Detections Log &amp; GeoJSON Importer
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Inspect verified detections, update analyst verification status inline,
              locate records on the Risk Radar, or import field survey GeoJSON/JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.geojson,application/geo+json,application/json"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Survey GeoJSON</span>
            </button>

            {sourceMode === 'imported-survey' && (
              <button
                type="button"
                onClick={() => {
                  setImportError(null);
                  setImportNotice(null);
                  onRestoreDemoRecords();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Records</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search ID, object, zone, or category..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="text-xs font-mono text-slate-600 tabular-nums">
            Showing {detections.length} active detections
          </div>
        </div>

        {importError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importNotice && (
          <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-900">
            {importNotice}
          </div>
        )}
      </div>

      {/* Responsive Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Object &amp; Category</th>
                <th className="px-4 py-3 font-semibold">Survey Zone</th>
                <th className="px-4 py-3 font-semibold text-right">Env. Risk</th>
                <th className="px-4 py-3 font-semibold text-right">AI Conf.</th>
                <th className="px-4 py-3 font-semibold">Condition</th>
                <th className="px-4 py-3 font-semibold text-right">GPS ±m</th>
                <th className="px-4 py-3 font-semibold">Verification</th>
                <th className="px-4 py-3 font-semibold text-right">Radar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detections.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No detections match the active filters or search query.
                  </td>
                </tr>
              ) : (
                detections.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                      <div>{d.id}</div>
                      {d.isSynthetic && (
                        <div className="text-[10px] text-amber-700 font-sans">
                          Synthetic
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-semibold text-slate-900">
                        {d.objectName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[260px]">
                        {d.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <div>{d.surveyZone}</div>
                      <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                        {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span
                        className="font-bold text-sm"
                        style={{ color: d.riskColor }}
                      >
                        {d.riskScore}
                      </span>
                      <div className="text-[10px] font-sans text-slate-500">
                        {d.riskLevel}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {d.aiConfidence.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      <div>{d.condition}</div>
                      <div className="text-[10px] text-slate-400">{d.size}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      ±{d.gpsUncertaintyMeters}m
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={d.verificationStatus}
                        onChange={(e) =>
                          onUpdateVerification(
                            d.id,
                            e.target.value as VerificationStatus,
                          )
                        }
                        aria-label={`Verification status for ${d.id}`}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                      >
                        {VERIFICATION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onLocateOnRadar(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>Locate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
