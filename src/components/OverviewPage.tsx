import { ArrowRight, MapPin, Radar } from 'lucide-react';
import type {
  AssessedDetection,
  HotspotCluster,
  SourceMode,
  SurveyAnalytics,
} from '../types/anomasea';

interface OverviewPageProps {
  analytics: SurveyAnalytics;
  hotspots: HotspotCluster[];
  sourceMode: SourceMode;
  onOpenRiskRadar: () => void;
  onInspectDetectionOnRadar: (detection: AssessedDetection) => void;
  onFocusHotspotOnRadar: (hotspot: HotspotCluster) => void;
}

export function OverviewPage({
  analytics,
  hotspots,
  sourceMode,
  onOpenRiskRadar,
  onInspectDetectionOnRadar,
  onFocusHotspotOnRadar,
}: OverviewPageProps) {
  const sourceLabel =
    sourceMode === 'live-api'
      ? 'Live FastAPI Survey Telemetry'
      : sourceMode === 'imported-survey'
        ? 'Imported Field Survey GeoJSON'
        : 'Local Demonstration Mode (Synthetic Records)';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>AnomaSea Marine Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>{sourceLabel}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1 text-balance">
            Marine Debris Survey Overview &amp; Risk Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Real-time operational summary computed directly from active underwater
            detection records, separating AI recognition confidence from multi-factor
            environmental hazard severity.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenRiskRadar}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto cursor-pointer"
        >
          <Radar className="w-4 h-4 text-sky-400" />
          <span>Open Environmental Risk Radar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Detections</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
            {analytics.totalDetections}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            Mean AI Conf {analytics.meanAiConfidence}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Critical Risk</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#DC2626] mt-1">
            {analytics.criticalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Score 75–100</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">High Risk</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#EA580C] mt-1">
            {analytics.highCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Score 50–74</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Moderate Risk</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#CA8A04] mt-1">
            {analytics.moderateCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Score 25–49</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Low Risk</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#16A34A] mt-1">
            {analytics.lowCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Score 0–24</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Total Hotspots</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-sky-700 mt-1">
            {analytics.totalHotspots}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            DBSCAN Spatial Clusters
          </div>
        </div>
      </div>

      {/* Category & Severity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Category-Wise Debris Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Computed from active survey detections across the 5 AnomaSea classes
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
              Mean Risk {analytics.meanRiskScore}/100
            </span>
          </div>

          <div className="space-y-3.5">
            {analytics.categoryDistribution.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <span className="font-medium text-slate-800 truncate">
                    {item.category}
                  </span>
                  <span className="font-mono tabular-nums text-slate-700 shrink-0">
                    {item.count} ({item.percentage}%) · Avg {item.meanRisk}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Risk Severity Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Environmental risk classification independent of AI confidence
            </p>
            <div className="space-y-3">
              {analytics.severityDistribution.map((item) => (
                <div key={item.level}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.level}</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-700">
                      {item.count} detections ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Mean GPS Uncertainty:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                ±{analytics.meanGpsUncertaintyMeters}m
              </strong>
            </span>
            <button
              type="button"
              onClick={onOpenRiskRadar}
              className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Inspect on Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highest-Risk Objects & Geographical Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Highest-Risk Objects
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Select a record to jump directly to its coordinates on the Risk Radar
          </p>
          <div className="divide-y divide-slate-100">
            {analytics.highestRiskObjects.length === 0 ? (
              <p className="py-6 text-xs text-slate-500 text-center">
                No records available under current filters.
              </p>
            ) : (
              analytics.highestRiskObjects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onInspectDetectionOnRadar(item)}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {item.objectName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {item.id} · {item.surveyZone} · AI{' '}
                      {item.aiConfidence.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-sm font-mono font-bold tabular-nums"
                      style={{ color: item.riskColor }}
                    >
                      {item.riskScore}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.riskLevel}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Geographical Risk Summaries
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Survey zone risk aggregation and active DBSCAN hotspot centroids
            </p>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Survey Zone</th>
                    <th className="px-3 py-2 font-semibold text-right">Det.</th>
                    <th className="px-3 py-2 font-semibold text-right">
                      Mean Risk
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">Peak</th>
                    <th className="px-3 py-2 font-semibold">
                      Dominant Category
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      GPS ±m
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.geographicalSummaries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No survey zones match current filters.
                      </td>
                    </tr>
                  ) : (
                    analytics.geographicalSummaries.map((zone) => (
                      <tr key={zone.surveyZone} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {zone.surveyZone}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {zone.detectionCount}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                          {zone.meanRisk}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {zone.maxRisk}
                        </td>
                        <td className="px-3 py-2 text-slate-600 truncate max-w-[180px]">
                          {zone.dominantCategory}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600">
                          ±{zone.meanGpsUncertaintyMeters}m
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {hotspots.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2">
                Active DBSCAN Spatial Hotspots
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hotspots.map((hs) => (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => onFocusHotspotOnRadar(hs)}
                    className="text-left p-3 rounded-lg border border-slate-200 hover:border-sky-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 truncate">
                        {hs.id} · {hs.regionLabel}
                      </span>
                      <span
                        className="font-bold shrink-0"
                        style={{ color: hs.severityColor }}
                      >
                        {hs.overallSeverity}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-slate-600 tabular-nums">
                      {hs.detectionCount} detections · {hs.detectionDensityPerKm2}
                      /km² · Accum. Risk {hs.accumulatedRisk}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
