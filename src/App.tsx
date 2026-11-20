/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AssessDetectionModal } from './components/AssessDetectionModal';
import { CataloguePage } from './components/CataloguePage';
import { DetectionsLogPage } from './components/DetectionsLogPage';
import { LayoutShell } from './components/LayoutShell';
import { OverviewPage } from './components/OverviewPage';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { ReportsBackendPage } from './components/ReportsBackendPage';
import { RiskRadarPage } from './components/RiskRadarPage';
import { DEBRIS_CATEGORIES, SYNTHETIC_DETECTIONS } from './data/catalogue';
import {
  DEFAULT_RISK_CONFIG,
  assessAllDetections,
  computeDbscanHotspots,
  computeSurveyAnalytics,
} from './engine/riskEngine';
import {
  buildSurveyReport,
  exportReportCsv,
  exportReportPdf,
} from './services/reportService';
import { getApiBaseUrl, riskApi } from './services/riskApi';
import type {
  ActiveSection,
  AssessedDetection,
  BackendConnectionStatus,
  FocusTarget,
  HotspotCluster,
  RadarFilters,
  RadarLayers,
  RawDetectionRecord,
  RiskConfig,
  SourceMode,
  VerificationStatus,
} from './types/anomasea';

const INITIAL_FILTERS: RadarFilters = {
  categories: [...DEBRIS_CATEGORIES],
  riskLevels: ['Critical', 'High', 'Moderate', 'Low'],
  verificationStatuses: ['Verified', 'Pending Review', 'Flagged Anomaly'],
  searchQuery: '',
  minAiConfidence: 0,
};

const INITIAL_LAYERS: RadarLayers = {
  markers: true,
  clustering: true,
  heatmap: true,
  hotspots: true,
  gpsUncertainty: true,
};

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [rawDetections, setRawDetections] = useState<RawDetectionRecord[]>(
    () => SYNTHETIC_DETECTIONS,
  );
  const [sourceMode, setSourceMode] = useState<SourceMode>('demo-synthetic');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<BackendConnectionStatus>({
      connected: false,
      baseUrl: getApiBaseUrl(),
      message:
        'No backend URL configured. Operating in Local Demonstration Mode with clearly labelled synthetic records.',
    });

  const [riskConfig, setRiskConfig] = useState<RiskConfig>(DEFAULT_RISK_CONFIG);
  const [filters, setFilters] = useState<RadarFilters>(INITIAL_FILTERS);
  const [layers, setLayers] = useState<RadarLayers>(INITIAL_LAYERS);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(
    null,
  );
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [assessModalOpen, setAssessModalOpen] = useState(false);
  const [assessCenter, setAssessCenter] = useState({ lat: 36.75, lng: -121.9 });
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const reconnectBackend = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    setLoading(true);
    try {
      const status = await riskApi.testConnection(baseUrl);
      setConnectionStatus(status);
      if (status.connected) {
        const records = await riskApi.fetchGeoJson(baseUrl);
        if (records.length > 0) {
          setRawDetections(records);
          setSourceMode('live-api');
          setSelectedDetectionId(null);
          return;
        }
      }
      setSourceMode((prev) =>
        prev === 'imported-survey' ? 'imported-survey' : 'demo-synthetic',
      );
      if (!baseUrl) {
        setRawDetections(SYNTHETIC_DETECTIONS);
        setSourceMode('demo-synthetic');
      }
    } catch {
      setSourceMode((prev) =>
        prev === 'imported-survey' ? 'imported-survey' : 'demo-synthetic',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getApiBaseUrl()) {
      void reconnectBackend();
    }
  }, [reconnectBackend]);

  const assessedDetections = useMemo(
    () => assessAllDetections(rawDetections, riskConfig),
    [rawDetections, riskConfig],
  );

  const filteredDetections = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    return assessedDetections.filter((item) => {
      if (!filters.categories.includes(item.category)) return false;
      if (!filters.riskLevels.includes(item.riskLevel)) return false;
      if (!filters.verificationStatuses.includes(item.verificationStatus)) {
        return false;
      }
      if (item.aiConfidence < filters.minAiConfidence) return false;
      if (query) {
        const matches =
          item.id.toLowerCase().includes(query) ||
          item.objectName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.surveyZone.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [assessedDetections, filters]);

  const hotspots = useMemo(
    () =>
      computeDbscanHotspots(
        filteredDetections,
        riskConfig.dbscan,
        riskConfig.thresholds,
      ),
    [filteredDetections, riskConfig.dbscan, riskConfig.thresholds],
  );

  const analytics = useMemo(
    () => computeSurveyAnalytics(filteredDetections, hotspots),
    [filteredDetections, hotspots],
  );

  const surveyReport = useMemo(
    () =>
      buildSurveyReport(
        filteredDetections,
        hotspots,
        analytics,
        riskConfig,
        sourceMode,
        filters,
      ),
    [filteredDetections, hotspots, analytics, riskConfig, sourceMode, filters],
  );

  const handleToggleLayer = useCallback((layer: keyof RadarLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleFocusCoordinates = useCallback(
    (lat: number, lng: number, zoom = 15) => {
      setFocusTarget({ lat, lng, zoom, key: Date.now() + Math.random() });
    },
    [],
  );

  const handleUpdateVerification = useCallback(
    (id: string, status: VerificationStatus) => {
      setRawDetections((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, verificationStatus: status } : item,
        ),
      );
    },
    [],
  );

  const handleInspectDetectionOnRadar = useCallback(
    (detection: AssessedDetection) => {
      setSelectedDetectionId(detection.id);
      setActiveSection('risk-radar');
      setFocusTarget({
        lat: detection.lat,
        lng: detection.lng,
        zoom: 16,
        key: Date.now() + Math.random(),
      });
    },
    [],
  );

  const handleFocusHotspotOnRadar = useCallback((hotspot: HotspotCluster) => {
    setSelectedDetectionId(null);
    setActiveSection('risk-radar');
    setFocusTarget({
      lat: hotspot.centroid.lat,
      lng: hotspot.centroid.lng,
      zoom: 15,
      key: Date.now() + Math.random(),
    });
  }, []);

  const handleAssessSubmit = useCallback(
    async (record: RawDetectionRecord) => {
      const { assessed } = await riskApi.assessDetection(record, riskConfig);
      setRawDetections((prev) => [assessed, ...prev]);
      setSelectedDetectionId(assessed.id);
      setActiveSection('risk-radar');
      setFocusTarget({
        lat: assessed.lat,
        lng: assessed.lng,
        zoom: 16,
        key: Date.now() + Math.random(),
      });
    },
    [riskConfig],
  );

  const handleImportRecords = useCallback((records: RawDetectionRecord[]) => {
    setRawDetections(records);
    setSourceMode('imported-survey');
    setSelectedDetectionId(null);
    if (records[0]) {
      setFocusTarget({
        lat: records[0].lat,
        lng: records[0].lng,
        zoom: 12,
        key: Date.now() + Math.random(),
      });
    }
  }, []);

  const handleRestoreDemoRecords = useCallback(() => {
    setRawDetections(SYNTHETIC_DETECTIONS);
    setSourceMode('demo-synthetic');
    setSelectedDetectionId(null);
    setFocusTarget({
      lat: 36.75,
      lng: -121.9,
      zoom: 11,
      key: Date.now() + Math.random(),
    });
  }, []);

  const handleExportPdfAndSync = useCallback(() => {
    exportReportPdf(surveyReport);
    if (sourceMode === 'live-api') {
      void riskApi.submitReport(surveyReport);
    }
  }, [surveyReport, sourceMode]);

  return (
    <LayoutShell
      activeSection={activeSection}
      onNavigate={setActiveSection}
      sourceMode={sourceMode}
      loading={loading}
    >
      {activeSection === 'overview' && (
        <OverviewPage
          analytics={analytics}
          hotspots={hotspots}
          sourceMode={sourceMode}
          onOpenRiskRadar={() => setActiveSection('risk-radar')}
          onInspectDetectionOnRadar={handleInspectDetectionOnRadar}
          onFocusHotspotOnRadar={handleFocusHotspotOnRadar}
        />
      )}

      {activeSection === 'risk-radar' && (
        <RiskRadarPage
          detections={filteredDetections}
          hotspots={hotspots}
          analytics={analytics}
          filters={filters}
          onUpdateFilters={setFilters}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          selectedDetectionId={selectedDetectionId}
          onSelectDetection={setSelectedDetectionId}
          onUpdateVerification={handleUpdateVerification}
          riskConfig={riskConfig}
          onUpdateRiskConfig={setRiskConfig}
          sourceMode={sourceMode}
          onOpenAssessModal={(center) => {
            setAssessCenter(center);
            setAssessModalOpen(true);
          }}
          onOpenReportModal={() => setReportModalOpen(true)}
          focusTarget={focusTarget}
          onFocusCoordinates={handleFocusCoordinates}
        />
      )}

      {activeSection === 'catalogue' && <CataloguePage />}

      {activeSection === 'detections' && (
        <DetectionsLogPage
          detections={filteredDetections}
          sourceMode={sourceMode}
          searchQuery={filters.searchQuery}
          onSearchChange={(searchQuery) =>
            setFilters((prev) => ({ ...prev, searchQuery }))
          }
          onUpdateVerification={handleUpdateVerification}
          onLocateOnRadar={handleInspectDetectionOnRadar}
          onImportRecords={handleImportRecords}
          onRestoreDemoRecords={handleRestoreDemoRecords}
        />
      )}

      {activeSection === 'reports-api' && (
        <ReportsBackendPage
          sourceMode={sourceMode}
          connectionStatus={connectionStatus}
          riskConfig={riskConfig}
          onUpdateRiskConfig={setRiskConfig}
          onReconnectBackend={reconnectBackend}
          onOpenReportModal={() => setReportModalOpen(true)}
          onExportCsv={() => exportReportCsv(surveyReport)}
          onExportPdf={handleExportPdfAndSync}
        />
      )}

      <AssessDetectionModal
        isOpen={assessModalOpen}
        defaultCenter={assessCenter}
        isLiveBackend={sourceMode === 'live-api'}
        onClose={() => setAssessModalOpen(false)}
        onSubmit={handleAssessSubmit}
      />

      <ReportPreviewModal
        isOpen={reportModalOpen}
        report={surveyReport}
        isLiveBackend={sourceMode === 'live-api'}
        onClose={() => setReportModalOpen(false)}
      />
    </LayoutShell>
  );
}
