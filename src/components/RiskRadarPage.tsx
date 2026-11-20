import { useMemo, useState } from 'react';
import {
  FileText,
  Filter,
  MapPin,
  PlusCircle,
  Radar,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { DEBRIS_CATEGORIES } from '../data/catalogue';
import {
  DEFAULT_RISK_CONFIG,
  RISK_COLORS,
  RISK_LEVELS,
} from '../engine/riskEngine';
import type {
  AssessedDetection,
  DebrisCategory,
  FocusTarget,
  HotspotCluster,
  RadarFilters,
  RadarLayers,
  RiskConfig,
  RiskLevel,
  SourceMode,
  SurveyAnalytics,
  VerificationStatus,
} from '../types/anomasea';
import { DetectionInspectorPanel } from './DetectionInspectorPanel';
import { RiskBreakdownModal } from './RiskBreakdownModal';
import { RiskRadarMap } from './RiskRadarMap';

interface RiskRadarPageProps {
  detections: AssessedDetection[];
  hotspots: HotspotCluster[];
  analytics: SurveyAnalytics;
  filters: RadarFilters;
  onUpdateFilters: (filters: RadarFilters) => void;
  layers: RadarLayers;
  onToggleLayer: (layer: keyof RadarLayers) => void;
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  onUpdateVerification: (id: string, status: VerificationStatus) => void;
  riskConfig: RiskConfig;
  onUpdateRiskConfig: (config: RiskConfig) => void;
  sourceMode: SourceMode;
  onOpenAssessModal: (center: { lat: number; lng: number }) => void;
  onOpenReportModal: () => void;
  focusTarget: FocusTarget | null;
  onFocusCoordinates: (lat: number, lng: number, zoom?: number) => void;
}

type InspectorTab = 'hotspots' | 'top-risk' | 'calibration';

export function RiskRadarPage({
  detections,
  hotspots,
  analytics,
  filters,
  onUpdateFilters,
  layers,
  onToggleLayer,
  selectedDetectionId,
  onSelectDetection,
  onUpdateVerification,
  riskConfig,
  onUpdateRiskConfig,
  sourceMode,
  onOpenAssessModal,
  onOpenReportModal,
  focusTarget,
  onFocusCoordinates,
}: RiskRadarPageProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('hotspots');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 36.75, lng: -121.9 });

  const selectedDetection = useMemo(
    () => detections.find((d) => d.id === selectedDetectionId) ?? null,
    [detections, selectedDetectionId],
  );

  const handleInspectBreakdown = (id: string) => {
    onSelectDetection(id);
    setBreakdownOpen(true);
  };

  const toggleCategory = (category: DebrisCategory) => {
    const next = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onUpdateFilters({ ...filters, categories: next });
  };

  const toggleRiskLevel = (level: RiskLevel) => {
    const next = filters.riskLevels.includes(level)
      ? filters.riskLevels.filter((l) => l !== level)
      : [...filters.riskLevels, level];
    onUpdateFilters({ ...filters, riskLevels: next });
  };

  const sourceLabel =
    sourceMode === 'live-api'
      ? 'Live FastAPI Survey Feed'
      : sourceMode === 'imported-survey'
        ? 'Imported Survey GeoJSON'
        : 'Demonstration Mode (Synthetic Records)';

  return (
    <div className="space-y-4">
      {/* Control Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Geospatial Monitoring Module</span>
              <span aria-hidden="true">·</span>
              <span>{sourceLabel}</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-0.5">
              Environmental Risk Radar
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersVisible((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-600" />
              <span>{filtersVisible ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAssessModal(mapCenter)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>Assess Detection</span>
            </button>

            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* 6 Live Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-3.5 border-t border-slate-100">
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] text-slate-500">Total Detections</div>
            <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
              {analytics.totalDetections}
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] text-slate-500">Critical (75–100)</div>
            <div className="text-lg font-mono font-bold tabular-nums text-[#DC2626]">
              {analytics.criticalCount}
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] text-slate-500">High (50–74)</div>
            <div className="text-lg font-mono font-bold tabular-nums text-[#EA580C]">
              {analytics.highCount}
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] text-slate-500">Moderate (25–49)</div>
            <div className="text-lg font-mono font-bold tabular-nums text-[#CA8A04]">
              {analytics.moderateCount}
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] text-slate-500">Low (0–24)</div>
            <div className="text-lg font-mono font-bold tabular-nums text-[#16A34A]">
              {analytics.lowCount}
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] text-slate-500">DBSCAN Hotspots</div>
            <div className="text-lg font-mono font-bold tabular-nums text-sky-700">
              {analytics.totalHotspots}
            </div>
          </div>
        </div>

        {/* Collapsible Filter Controls */}
        {filtersVisible && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    onUpdateFilters({ ...filters, searchQuery: e.target.value })
                  }
                  placeholder="Search ID, object, or survey zone..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">Risk Level:</span>
                {RISK_LEVELS.map((level) => {
                  const active = filters.riskLevels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleRiskLevel(level)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: RISK_COLORS[level] }}
                      />
                      <span>{level}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="whitespace-nowrap">Min AI Conf:</span>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={5}
                  value={filters.minAiConfidence}
                  onChange={(e) =>
                    onUpdateFilters({
                      ...filters,
                      minAiConfidence: Number(e.target.value),
                    })
                  }
                  className="w-24 accent-sky-600"
                  aria-label="Minimum AI Confidence"
                />
                <span className="font-mono tabular-nums w-9 text-right text-slate-900 font-medium">
                  {filters.minAiConfidence}%
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    categories: [...DEBRIS_CATEGORIES],
                    riskLevels: ['Critical', 'High', 'Moderate', 'Low'],
                    verificationStatuses: [
                      'Verified',
                      'Pending Review',
                      'Flagged Anomaly',
                    ],
                    searchQuery: '',
                    minAiConfidence: 0,
                  })
                }
                className="text-xs font-medium text-sky-700 hover:text-sky-900 whitespace-nowrap ml-auto cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Categories:</span>
              {DEBRIS_CATEGORIES.map((category) => {
                const active = filters.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-sky-50 text-sky-900 border-sky-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map + Inspector Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-8">
          <RiskRadarMap
            detections={detections}
            hotspots={hotspots}
            layers={layers}
            onToggleLayer={onToggleLayer}
            selectedDetectionId={selectedDetectionId}
            onSelectDetection={onSelectDetection}
            onInspectBreakdown={handleInspectBreakdown}
            onSelectHotspot={(hotspot) => {
              onSelectDetection(null);
              setActiveTab('hotspots');
              onFocusCoordinates(
                hotspot.centroid.lat,
                hotspot.centroid.lng,
                15,
              );
            }}
            focusTarget={focusTarget}
            onMapCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
          />
        </div>

        <div className="xl:col-span-4 flex flex-col min-h-[560px] lg:max-h-[620px]">
          {selectedDetection ? (
            <DetectionInspectorPanel
              detection={selectedDetection}
              onClose={() => onSelectDetection(null)}
              onUpdateVerification={onUpdateVerification}
              onFlyToDetection={(d) => onFocusCoordinates(d.lat, d.lng, 16)}
              onInspectBreakdown={handleInspectBreakdown}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
              {/* Inspector Tabs */}
              <div className="px-3 pt-3 pb-2 border-b border-slate-200 bg-slate-50/70">
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('hotspots')}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'hotspots'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hotspots ({hotspots.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('top-risk')}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'top-risk'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Top Risk ({analytics.highestRiskObjects.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('calibration')}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === 'calibration'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Calibrate
                  </button>
                </div>
              </div>

              {/* Tab Body */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3 anomasea-scroll">
                {activeTab === 'hotspots' && (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        DBSCAN: ε ={' '}
                        <strong className="font-mono text-slate-800">
                          {riskConfig.dbscan.epsilonMeters}m
                        </strong>{' '}
                        · minPts ={' '}
                        <strong className="font-mono text-slate-800">
                          {riskConfig.dbscan.minPoints}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('calibration')}
                        className="text-sky-700 hover:underline font-medium cursor-pointer"
                      >
                        Adjust
                      </button>
                    </div>

                    {hotspots.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg px-4">
                        No spatial clusters satisfy current DBSCAN thresholds.
                        Increase search radius (ε) or broaden active filters.
                      </div>
                    ) : (
                      hotspots.map((hs) => (
                        <button
                          key={hs.id}
                          type="button"
                          onClick={() =>
                            onFocusCoordinates(
                              hs.centroid.lat,
                              hs.centroid.lng,
                              15,
                            )
                          }
                          className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {hs.id} · {hs.regionLabel}
                            </span>
                            <span
                              className="text-xs font-bold shrink-0"
                              style={{ color: hs.severityColor }}
                            >
                              {hs.overallSeverity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 truncate">
                            Dominant: {hs.dominantCategory}
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono tabular-nums">
                            <div>
                              <span className="text-slate-400 block font-sans">
                                Count
                              </span>
                              <span className="text-slate-900 font-semibold">
                                {hs.detectionCount} pts
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-sans">
                                Density
                              </span>
                              <span className="text-slate-900 font-semibold">
                                {hs.detectionDensityPerKm2}/km²
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-sans">
                                Accum. Risk
                              </span>
                              <span className="text-slate-900 font-semibold">
                                {hs.accumulatedRisk}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-sky-700 font-medium">
                              {hs.recommendedPriority}
                            </span>
                            <span className="font-mono text-slate-400">
                              Peak {hs.highestIndividualRisk}/100
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'top-risk' && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-500">
                      Click any marker on the map or select an object below to
                      inspect its complete environmental risk breakdown.
                    </p>
                    {analytics.highestRiskObjects.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                        No detections in current filter.
                      </div>
                    ) : (
                      analytics.highestRiskObjects.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            onSelectDetection(d.id);
                            onFocusCoordinates(d.lat, d.lng, 15);
                          }}
                          className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[11px] font-mono text-slate-500">
                                {d.id} · {d.surveyZone}
                              </div>
                              <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                                {d.objectName}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div
                                className="text-sm font-mono font-bold tabular-nums"
                                style={{ color: d.riskColor }}
                              >
                                {d.riskScore}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                AI {d.aiConfidence.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                            <span>{d.condition}</span>
                            <span className="font-mono">
                              ±{d.gpsUncertaintyMeters}m
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'calibration' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                        <span>Live Risk &amp; DBSCAN Parameters</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateRiskConfig(DEFAULT_RISK_CONFIG)}
                        className="text-sky-700 hover:underline font-medium cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="font-medium text-slate-700">
                        DBSCAN Spatial Clustering
                      </div>

                      <label className="block">
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>Neighborhood Radius (ε)</span>
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {riskConfig.dbscan.epsilonMeters} m
                          </span>
                        </div>
                        <input
                          type="range"
                          min={100}
                          max={2000}
                          step={50}
                          value={riskConfig.dbscan.epsilonMeters}
                          onChange={(e) =>
                            onUpdateRiskConfig({
                              ...riskConfig,
                              dbscan: {
                                ...riskConfig.dbscan,
                                epsilonMeters: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-sky-600"
                        />
                      </label>

                      <label className="block">
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>Minimum Cluster Points</span>
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {riskConfig.dbscan.minPoints}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={5}
                          step={1}
                          value={riskConfig.dbscan.minPoints}
                          onChange={(e) =>
                            onUpdateRiskConfig({
                              ...riskConfig,
                              dbscan: {
                                ...riskConfig.dbscan,
                                minPoints: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-sky-600"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer">
                        <span className="text-slate-700">
                          Account for GPS uncertainty overlap
                        </span>
                        <input
                          type="checkbox"
                          checked={riskConfig.dbscan.accountForGpsUncertainty}
                          onChange={(e) =>
                            onUpdateRiskConfig({
                              ...riskConfig,
                              dbscan: {
                                ...riskConfig.dbscan,
                                accountForGpsUncertainty: e.target.checked,
                              },
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600"
                        />
                      </label>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <div className="font-medium text-slate-700">
                        Environmental Risk Factor Weights
                      </div>
                      {(
                        [
                          { key: 'persistence', label: 'Material Persistence' },
                          { key: 'entanglement', label: 'Entanglement Risk' },
                          { key: 'physicalHazard', label: 'Physical Hazard' },
                          {
                            key: 'chemicalContamination',
                            label: 'Chemical Contamination',
                          },
                          { key: 'ecologicalImpact', label: 'Ecological Impact' },
                        ] as const
                      ).map((factor) => (
                        <label key={factor.key} className="block">
                          <div className="flex justify-between text-slate-600 mb-0.5">
                            <span>{factor.label}</span>
                            <span className="font-mono font-semibold text-slate-900 tabular-nums">
                              {(riskConfig.weights[factor.key] * 100).toFixed(0)}
                              %
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.05}
                            max={0.5}
                            step={0.01}
                            value={riskConfig.weights[factor.key]}
                            onChange={(e) =>
                              onUpdateRiskConfig({
                                ...riskConfig,
                                weights: {
                                  ...riskConfig.weights,
                                  [factor.key]: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full accent-slate-900"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inspector Footer */}
              <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Select any map pin to inspect</span>
                </span>
                <span className="flex items-center gap-1 font-mono tabular-nums">
                  <Radar className="w-3 h-3 text-sky-600" />
                  <span>{detections.length} active</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <RiskBreakdownModal
        isOpen={breakdownOpen}
        detection={selectedDetection}
        riskConfig={riskConfig}
        isLiveBackend={sourceMode === 'live-api'}
        onClose={() => setBreakdownOpen(false)}
      />
    </div>
  );
}
