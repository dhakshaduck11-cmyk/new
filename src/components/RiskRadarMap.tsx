import { useCallback, useEffect, useRef, useState } from 'react';
import L from '../utils/leafletSetup';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { HeatLayer } from 'leaflet.heat';
import {
  Crosshair,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type {
  AssessedDetection,
  DebrisCategory,
  FocusTarget,
  HotspotCluster,
  RadarLayers,
} from '../types/anomasea';
import { LEGEND_CATEGORIES, resolveDebrisIcon } from '../utils/debrisIcons';

interface RiskRadarMapProps {
  detections: AssessedDetection[];
  hotspots: HotspotCluster[];
  layers: RadarLayers;
  onToggleLayer: (layer: keyof RadarLayers) => void;
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  onInspectBreakdown: (id: string) => void;
  onSelectHotspot: (hotspot: HotspotCluster) => void;
  focusTarget: FocusTarget | null;
  onMapCenterChange?: (lat: number, lng: number, zoom: number) => void;
}

const DEFAULT_CENTER: [number, number] = [36.75, -121.9];
const DEFAULT_ZOOM = 10;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getRiskRank(riskColor: string): number {
  if (riskColor === '#DC2626') return 4;
  if (riskColor === '#EA580C') return 3;
  if (riskColor === '#EAB308') return 2;
  return 1;
}

function getColorByRank(rank: number): string {
  if (rank >= 4) return '#DC2626';
  if (rank === 3) return '#EA580C';
  if (rank === 2) return '#EAB308';
  return '#16A34A';
}

function createDetectionIcon(
  detection: AssessedDetection,
  isSelected: boolean,
): L.DivIcon {
  const size = isSelected ? 36 : 32;
  const iconDef = resolveDebrisIcon(
    detection.catalogueClassId,
    detection.objectName,
    detection.category,
  );
  return L.divIcon({
    className: 'anomasea-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) + 2],
    html: `
      <div
        title="${escapeHtml(detection.objectName)} (${escapeHtml(detection.riskLevel)} Risk: ${detection.riskScore}/100)"
        style="
          position:relative;
          width:${size}px;height:${size}px;
          border-radius:9999px;
          background:#FFFFFF;
          color:#0F172A;
          border:${isSelected ? '3px' : '2.5px'} solid ${detection.riskColor};
          box-shadow:${
            isSelected
              ? '0 0 0 3px #0F172A, 0 4px 12px rgba(15,23,42,0.42)'
              : '0 2px 8px rgba(15,23,42,0.28)'
          };
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
        "
      >
        ${iconDef.svg}
        <span style="
          position:absolute;top:-2px;right:-2px;
          width:9px;height:9px;border-radius:9999px;
          background:${detection.riskColor};
          border:1.5px solid #FFFFFF;
        "></span>
      </div>
    `,
  });
}

function LegendCategoryIcon({ category }: { category: DebrisCategory }) {
  switch (category) {
    case 'Plastic, Rubber and Glass Debris':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 text-slate-800 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 2h4v2.5l2 2.5v3.5c0 .6-.4 1-.4 1.5s.4.9.4 1.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6.5c0-.6.4-1 .4-1.5s-.4-.9-.4-1.5V7l2-2.5V2z" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'Fishing Nets, Ropes and Abandoned Fishing Equipment':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 text-slate-800 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 10l6-6M3 16l12-12M9 18L21 6" />
          <path d="M21 10l-6-6M21 16L9 4M15 18L3 6" />
        </svg>
      );
    case 'Metal, Electronic and Shipwreck Debris':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 text-slate-800 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="5" rx="6.5" ry="2" />
          <path d="M5.5 5v14c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2V5" />
          <path d="M5.5 11.5c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 text-slate-800 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 10l8-4 8 4v8l-8 4-8-4v-8z" />
          <path d="M4 10l8 4 8-4M12 14v8" />
        </svg>
      );
  }
}

export function RiskRadarMap({
  detections,
  hotspots,
  layers,
  onToggleLayer,
  selectedDetectionId,
  onSelectDetection,
  onInspectBreakdown,
  onSelectHotspot,
  focusTarget,
  onMapCenterChange,
}: RiskRadarMapProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const gpsLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
  const detectionMapRef = useRef<Map<string, AssessedDetection>>(new Map());

  const selectedIdRef = useRef(selectedDetectionId);
  const onSelectDetectionRef = useRef(onSelectDetection);
  const onInspectBreakdownRef = useRef(onInspectBreakdown);
  const onSelectHotspotRef = useRef(onSelectHotspot);
  const onMapCenterChangeRef = useRef(onMapCenterChange);

  selectedIdRef.current = selectedDetectionId;
  onSelectDetectionRef.current = onSelectDetection;
  onInspectBreakdownRef.current = onInspectBreakdown;
  onSelectHotspotRef.current = onSelectHotspot;
  onMapCenterChangeRef.current = onMapCenterChange;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    const container = mapHostRef.current;
    if (!container || mapRef.current) return;

    const initialCenter: [number, number] =
      detections.length > 0
        ? [
            detections.reduce((s, d) => s + d.lat, 0) / detections.length,
            detections.reduce((s, d) => s + d.lng, 0) / detections.length,
          ]
        : DEFAULT_CENTER;

    const map = L.map(container, {
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      worldCopyJump: true,
      inertia: true,
      wheelDebounceTime: 40,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.scale({ position: 'bottomright' }).addTo(map);

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMapCenterChangeRef.current?.(
        Number(center.lat.toFixed(5)),
        Number(center.lng.toFixed(5)),
        map.getZoom(),
      );
    };

    const handleMouseMove = (event: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(event.latlng.lat.toFixed(5)),
        lng: Number(event.latlng.lng.toFixed(5)),
      });
    };

    map.on('moveend', handleMoveEnd);
    map.on('mousemove', handleMouseMove);
    handleMoveEnd();

    mapRef.current = map;

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('mousemove', handleMouseMove);
      map.remove();
      mapRef.current = null;
    };
    // Intentionally initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep map size synchronized with container resizing
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // GPS Uncertainty Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (gpsLayerRef.current) {
      map.removeLayer(gpsLayerRef.current);
      gpsLayerRef.current = null;
    }

    if (!layers.gpsUncertainty || detections.length === 0) return;

    const group = L.layerGroup();
    for (const d of detections) {
      L.circle([d.lat, d.lng], {
        radius: Math.max(1, d.gpsUncertaintyMeters),
        color: '#0284C7',
        weight: 1.2,
        dashArray: '4 4',
        fillColor: '#38BDF8',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(group);
    }
    group.addTo(map);
    gpsLayerRef.current = group;

    return () => {
      if (gpsLayerRef.current) {
        map.removeLayer(gpsLayerRef.current);
        gpsLayerRef.current = null;
      }
    };
  }, [detections, layers.gpsUncertainty]);

  // DBSCAN Hotspot Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hotspotLayerRef.current) {
      map.removeLayer(hotspotLayerRef.current);
      hotspotLayerRef.current = null;
    }

    if (!layers.hotspots || hotspots.length === 0) return;

    const group = L.layerGroup();
    for (const hs of hotspots) {
      const popupHtml = `
        <div style="padding:12px 14px;font-family:'DM Sans',sans-serif;color:#0f172a;min-width:250px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
            <span style="font-weight:700;font-size:13px;">${escapeHtml(hs.id)} · ${escapeHtml(hs.regionLabel)}</span>
            <span style="font-size:11px;font-weight:700;color:${hs.severityColor};">${escapeHtml(hs.overallSeverity)}</span>
          </div>
          <div style="font-size:12px;color:#475569;margin-bottom:8px;">
            Dominant: <strong style="color:#0f172a;">${escapeHtml(hs.dominantCategory)}</strong>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;border-top:1px solid #e2e8f0;padding-top:8px;">
            <div>Detections: <strong style="font-family:'JetBrains Mono',monospace;">${hs.detectionCount}</strong></div>
            <div>Density: <strong style="font-family:'JetBrains Mono',monospace;">${hs.detectionDensityPerKm2}/km²</strong></div>
            <div>Accum. Risk: <strong style="font-family:'JetBrains Mono',monospace;">${hs.accumulatedRisk}</strong></div>
            <div>Peak Risk: <strong style="font-family:'JetBrains Mono',monospace;">${hs.highestIndividualRisk}/100</strong></div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:#0369a1;font-weight:600;">
            ${escapeHtml(hs.recommendedPriority)}
          </div>
        </div>
      `;

      const circle = L.circle([hs.centroid.lat, hs.centroid.lng], {
        radius: hs.radiusMeters,
        color: hs.severityColor,
        weight: 2,
        dashArray: '6 4',
        fillColor: hs.severityColor,
        fillOpacity: 0.14,
      });
      circle.bindPopup(popupHtml);
      circle.on('click', () => onSelectHotspotRef.current(hs));
      circle.addTo(group);

      const centroidMarker = L.circleMarker([hs.centroid.lat, hs.centroid.lng], {
        radius: 5,
        color: '#0F172A',
        weight: 1.5,
        fillColor: hs.severityColor,
        fillOpacity: 1,
      });
      centroidMarker.bindPopup(popupHtml);
      centroidMarker.on('click', () => onSelectHotspotRef.current(hs));
      centroidMarker.addTo(group);
    }

    group.addTo(map);
    hotspotLayerRef.current = group;

    return () => {
      if (hotspotLayerRef.current) {
        map.removeLayer(hotspotLayerRef.current);
        hotspotLayerRef.current = null;
      }
    };
  }, [hotspots, layers.hotspots]);

  // Environmental Risk Heatmap Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!layers.heatmap || detections.length === 0) return;

    const size = map.getSize();
    if (size.x === 0 || size.y === 0) {
      map.invalidateSize();
    }

    const heatPoints = detections.map(
      (d) =>
        [
          d.lat,
          d.lng,
          Math.max(0.15, Math.min(1, d.riskScore / 100)),
        ] as [number, number, number],
    );

    const heat = new HeatLayer(heatPoints, {
      radius: 30,
      blur: 22,
      maxZoom: 16,
      max: 1,
      minOpacity: 0.32,
      gradient: {
        0.2: '#16A34A',
        0.45: '#EAB308',
        0.7: '#EA580C',
        1.0: '#DC2626',
      },
    }) as unknown as L.Layer;

    heat.addTo(map);
    heatLayerRef.current = heat;

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [detections, layers.heatmap]);

  // Markers & Clustering Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }
    markerMapRef.current.clear();
    detectionMapRef.current.clear();

    if (!layers.markers || detections.length === 0) return;

    const hasClusterPlugin =
      typeof (L as unknown as { markerClusterGroup?: unknown })
        .markerClusterGroup === 'function';

    const containerGroup: L.LayerGroup =
      layers.clustering && hasClusterPlugin
        ? L.markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 16,
            maxClusterRadius: 42,
            iconCreateFunction: (cluster) => {
              const children = cluster.getAllChildMarkers();
              let maxRank = 1;
              for (const child of children) {
                const rank =
                  (child.options as L.MarkerOptions & { riskRank?: number })
                    .riskRank ?? 1;
                if (rank > maxRank) maxRank = rank;
              }
              const borderColor = getColorByRank(maxRank);
              const count = cluster.getChildCount();
              return L.divIcon({
                className: 'anomasea-cluster-icon',
                iconSize: [38, 38],
                html: `
                  <div style="
                    width:38px;height:38px;border-radius:9999px;
                    background:#0F172A;color:#FFFFFF;
                    border:3px solid ${borderColor};
                    display:flex;align-items:center;justify-content:center;
                    font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;
                    box-shadow:0 4px 12px rgba(15,23,42,0.28);
                  ">${count}</div>
                `,
              });
            },
          })
        : L.layerGroup();

    for (const d of detections) {
      const icon = createDetectionIcon(d, d.id === selectedIdRef.current);
      const marker = L.marker([d.lat, d.lng], {
        icon,
        ...({ riskRank: getRiskRank(d.riskColor) } as L.MarkerOptions),
      });

      const topFactorsHtml = [...d.contributingFactors]
        .filter((f) => f.weightPercent > 0)
        .sort((a, b) => b.weightedContribution - a.weightedContribution)
        .slice(0, 3)
        .map(
          (f) => `
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#334155;">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(f.label)}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-weight:600;flex-shrink:0;">${f.rawScore}/100</span>
            </div>
          `,
        )
        .join('');

      const popupHtml = `
        <div style="padding:12px 14px;font-family:'DM Sans',sans-serif;color:#0f172a;min-width:270px;max-width:300px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b;margin-bottom:3px;">
            <span>${escapeHtml(d.id)}</span>
            <span>${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</span>
          </div>
          <div style="font-weight:700;font-size:13px;line-height:1.3;margin-bottom:3px;">
            ${escapeHtml(d.objectName)}
          </div>
          <div style="font-size:11px;color:#475569;margin-bottom:8px;">
            ${escapeHtml(d.category)}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:8px;">
            <div>
              <div style="font-size:10px;color:#64748b;">Env. Risk Score</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:${d.riskColor};">
                ${d.riskScore}/100 · ${escapeHtml(d.riskLevel)}
              </div>
            </div>
            <div>
              <div style="font-size:10px;color:#64748b;">AI Confidence</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#0f172a;">
                ${d.aiConfidence.toFixed(1)}%
              </div>
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <div style="font-size:10px;font-weight:600;color:#64748b;margin-bottom:3px;">
              Top Contributing Risk Factors
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              ${topFactorsHtml}
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-bottom:10px;">
            <span>Condition: <strong style="color:#0f172a;">${escapeHtml(d.condition)}</strong></span>
            <span>GPS: <strong style="font-family:'JetBrains Mono',monospace;">±${d.gpsUncertaintyMeters}m</strong></span>
          </div>
          <button
            type="button"
            data-inspect-detection="${escapeHtml(d.id)}"
            style="
              width:100%;padding:7px 10px;border-radius:6px;border:none;
              background:#0F172A;color:#FFFFFF;font-size:12px;font-weight:600;
              cursor:pointer;
            "
          >
            Inspect Full Risk Breakdown
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectDetectionRef.current(d.id);
      });
      marker.on('popupopen', (event) => {
        const inspectBtn = event.popup
          .getElement()
          ?.querySelector<HTMLButtonElement>('[data-inspect-detection]');
        if (inspectBtn) {
          inspectBtn.onclick = (clickEvt) => {
            clickEvt.preventDefault();
            clickEvt.stopPropagation();
            onSelectDetectionRef.current(d.id);
            onInspectBreakdownRef.current(d.id);
          };
        }
      });

      marker.addTo(containerGroup);
      markerMapRef.current.set(d.id, marker);
      detectionMapRef.current.set(d.id, d);
    }

    containerGroup.addTo(map);
    markerLayerRef.current = containerGroup;

    return () => {
      if (markerLayerRef.current) {
        map.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }
    };
  }, [detections, layers.markers, layers.clustering]);

  // Update selected marker highlight without rebuilding cluster group
  useEffect(() => {
    markerMapRef.current.forEach((marker, id) => {
      const detection = detectionMapRef.current.get(id);
      if (detection) {
        marker.setIcon(createDetectionIcon(detection, id === selectedDetectionId));
      }
    });
  }, [selectedDetectionId]);

  // Fly to focus target when requested
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    map.flyTo([focusTarget.lat, focusTarget.lng], focusTarget.zoom ?? 14, {
      duration: 0.65,
    });
  }, [focusTarget]);

  const handleResetBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (detections.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(detections.map((d) => [d.lat, d.lng]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 13 });
  }, [detections]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    try {
      if (next && wrapper.requestFullscreen) {
        await wrapper.requestFullscreen();
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback to CSS fixed fullscreen if browser disallows native Fullscreen API in iframe
    }
  }, [isFullscreen]);

  return (
    <div
      ref={wrapperRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col'
          : 'relative w-full h-[560px] lg:h-[620px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100'
      }
    >
      {/* Leaflet Mount */}
      <div ref={mapHostRef} className="w-full h-full" />

      {/* Top-Left Map Layers Overlay */}
      <div className="absolute top-3 left-3 z-[400] max-w-[240px]">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setLayersOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Map Layers</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {layersOpen ? 'Hide' : 'Show'}
            </span>
          </button>

          {layersOpen && (
            <div className="px-3 pb-2.5 pt-1 border-t border-slate-100 space-y-1.5">
              {(
                [
                  { key: 'markers', label: 'Detection Markers' },
                  { key: 'clustering', label: 'Marker Clustering' },
                  { key: 'heatmap', label: 'Environmental Risk Heatmap' },
                  { key: 'hotspots', label: 'DBSCAN Hotspot Overlays' },
                  { key: 'gpsUncertainty', label: 'GPS Uncertainty Circles' },
                ] as const
              ).map((item) => {
                const disabled = item.key === 'clustering' && !layers.markers;
                return (
                  <label
                    key={item.key}
                    className={`flex items-center justify-between gap-2 text-xs select-none py-0.5 ${
                      disabled
                        ? 'opacity-45 cursor-not-allowed'
                        : 'text-slate-700 cursor-pointer'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={layers[item.key]}
                      disabled={disabled}
                      onChange={() => onToggleLayer(item.key)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top-Right Zoom, Reset, & Fullscreen Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        <div className="flex items-center bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-r border-slate-200 transition-colors cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetBounds}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50 shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Reset map bounds to active detections"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset Map</span>
        </button>

        <button
          type="button"
          onClick={() => void handleToggleFullscreen()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/95 text-xs font-medium text-white hover:bg-slate-800 shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom-Left Legend & Live Coordinates */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col gap-1.5 max-w-[360px]">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setLegendOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>Map Legend</span>
            <span className="font-mono text-slate-500 font-normal">
              {legendOpen ? 'Hide' : 'Show'}
            </span>
          </button>

          {legendOpen && (
            <div className="px-3 pb-2.5 pt-1.5 border-t border-slate-100 space-y-2">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 mb-1">
                  Object Icons · Debris Category
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700">
                  {LEGEND_CATEGORIES.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center gap-1.5 min-w-0"
                    >
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0">
                        <LegendCategoryIcon category={item.category} />
                      </span>
                      <span className="truncate">{item.shortLabel}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-4 h-4 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0 font-mono font-bold text-slate-700">
                    ?
                  </span>
                  <span>
                    Unidentified object icons mark unknown underwater anomalies
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100">
                <div className="text-[10px] font-semibold text-slate-500 mb-1">
                  Marker Border &amp; Accent · Environmental Risk
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-white border-2 border-[#16A34A] shrink-0" />
                    <span>0–24 Low</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-white border-2 border-[#EAB308] shrink-0" />
                    <span>25–49 Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-white border-2 border-[#EA580C] shrink-0" />
                    <span>50–74 High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-white border-2 border-[#DC2626] shrink-0" />
                    <span>75–100 Critical</span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-sky-600 bg-sky-400/20 shrink-0" />
                  GPS ±m
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-red-600 bg-red-500/15 shrink-0" />
                  DBSCAN Hotspot
                </span>
              </div>
            </div>
          )}
        </div>

        {cursorCoords && (
          <div className="inline-flex items-center gap-1.5 self-start bg-slate-900/90 text-slate-100 px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums">
            <Crosshair className="w-3 h-3 text-sky-400" />
            <span>
              {cursorCoords.lat.toFixed(5)}°, {cursorCoords.lng.toFixed(5)}°
            </span>
          </div>
        )}
      </div>

      {/* Empty Filter Overlay */}
      {detections.length === 0 && (
        <div className="absolute inset-0 z-[350] pointer-events-none flex items-center justify-center p-6">
          <div className="bg-white/95 border border-slate-200 rounded-lg px-5 py-4 text-center shadow-sm max-w-sm">
            <p className="text-sm font-semibold text-slate-900">
              No detections match current filters
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Adjust category, risk level, or confidence filters to restore
              spatial markers and hotspot analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
