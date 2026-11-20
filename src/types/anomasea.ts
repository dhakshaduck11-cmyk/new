export type DebrisCategory =
  | 'Plastic, Rubber and Glass Debris'
  | 'Fishing Nets, Ropes and Abandoned Fishing Equipment'
  | 'Metal, Electronic and Shipwreck Debris'
  | 'Construction, Household and Other Underwater Debris'
  | 'Unknown Underwater Anomalies';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type ObjectCondition =
  | 'Intact'
  | 'Partially Degraded'
  | 'Fragmented'
  | 'Heavily Corroded / Leaking';

export type ObjectSize = 'Small' | 'Medium' | 'Large' | 'Massive';

export type VerificationStatus = 'Verified' | 'Pending Review' | 'Flagged Anomaly';

export type SourceMode = 'live-api' | 'imported-survey' | 'demo-synthetic';

export type ActiveSection =
  | 'overview'
  | 'risk-radar'
  | 'catalogue'
  | 'detections'
  | 'reports-api';

export interface BaselineHazardProfile {
  persistence: number;
  entanglement: number;
  physicalHazard: number;
  chemicalContamination: number;
  ecologicalImpact: number;
}

export interface CatalogueClass {
  id: string;
  objectName: string;
  category: DebrisCategory;
  materialComposition: string;
  estimatedPersistenceYears: string;
  sdg14Targets: string[];
  description: string;
  baselineProfile: BaselineHazardProfile;
}

export interface RawDetectionRecord {
  id: string;
  catalogueClassId: string;
  objectName: string;
  category: DebrisCategory;
  lat: number;
  lng: number;
  gpsUncertaintyMeters: number;
  aiConfidence: number;
  condition: ObjectCondition;
  size: ObjectSize;
  verificationStatus: VerificationStatus;
  observedAt: string;
  surveyZone: string;
  depthMeters?: number;
  observationCount?: number;
  notes?: string;
  isSynthetic: boolean;
}

export interface ContributingFactor {
  key: string;
  label: string;
  rawScore: number;
  weightPercent: number;
  weightedContribution: number;
  summary: string;
}

export interface AssessedDetection extends RawDetectionRecord {
  riskScore: number;
  riskLevel: RiskLevel;
  riskColor: string;
  contributingFactors: ContributingFactor[];
  explanation: string;
  recommendedPriority: string;
}

export interface RiskThresholds {
  moderateMin: number;
  highMin: number;
  criticalMin: number;
}

export interface DbscanConfig {
  epsilonMeters: number;
  minPoints: number;
  accountForGpsUncertainty: boolean;
}

export interface RiskConfig {
  weights: BaselineHazardProfile;
  thresholds: RiskThresholds;
  sizeMultiplierImpact: number;
  conditionMultiplierImpact: number;
  evidenceUncertaintyPenalty: number;
  dbscan: DbscanConfig;
}

export interface HotspotCluster {
  id: string;
  label: string;
  regionLabel: string;
  centroid: {
    lat: number;
    lng: number;
  };
  radiusMeters: number;
  areaKm2: number;
  detectionDensityPerKm2: number;
  detectionCount: number;
  totalObservationCount: number;
  accumulatedRisk: number;
  meanRisk: number;
  highestIndividualRisk: number;
  dominantCategory: DebrisCategory;
  overallSeverity: RiskLevel;
  severityColor: string;
  contributingDetectionIds: string[];
  recommendedPriority: string;
  meanGpsUncertaintyMeters: number;
}

export interface RadarFilters {
  categories: DebrisCategory[];
  riskLevels: RiskLevel[];
  verificationStatuses: VerificationStatus[];
  searchQuery: string;
  minAiConfidence: number;
}

export interface RadarLayers {
  markers: boolean;
  clustering: boolean;
  heatmap: boolean;
  hotspots: boolean;
  gpsUncertainty: boolean;
}

export interface CategoryDistributionItem {
  category: DebrisCategory;
  count: number;
  percentage: number;
  meanRisk: number;
  criticalCount: number;
}

export interface SeverityDistributionItem {
  level: RiskLevel;
  color: string;
  count: number;
  percentage: number;
}

export interface GeographicalSummaryItem {
  surveyZone: string;
  detectionCount: number;
  meanRisk: number;
  maxRisk: number;
  criticalAndHighCount: number;
  dominantCategory: DebrisCategory;
  meanGpsUncertaintyMeters: number;
}

export interface SurveyAnalytics {
  totalDetections: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  totalHotspots: number;
  meanRiskScore: number;
  meanAiConfidence: number;
  meanGpsUncertaintyMeters: number;
  maxGpsUncertaintyMeters: number;
  categoryDistribution: CategoryDistributionItem[];
  severityDistribution: SeverityDistributionItem[];
  highestRiskObjects: AssessedDetection[];
  geographicalSummaries: GeographicalSummaryItem[];
}

export interface SurveyReport {
  generatedAt: string;
  sourceMode: SourceMode;
  surveyOverview: {
    title: string;
    datasetLabel: string;
    totalDetections: number;
    totalHotspots: number;
    meanRiskScore: number;
    meanAiConfidence: number;
    activeFiltersSummary: string;
  };
  analytics: SurveyAnalytics;
  hotspots: HotspotCluster[];
  highPriorityDetections: AssessedDetection[];
  allDetections: AssessedDetection[];
  recommendedInspectionPriorities: {
    priority: string;
    targetCount: number;
    actionGuidance: string;
  }[];
  dataUncertainty: {
    meanGpsUncertaintyMeters: number;
    maxGpsUncertaintyMeters: number;
    lowConfidenceDetectionsCount: number;
    methodologyNote: string;
  };
  sdg14Relevance: {
    target: string;
    title: string;
    relevanceCount: number;
    alignmentSummary: string;
  }[];
  configSnapshot: RiskConfig;
}

export interface BackendConnectionStatus {
  connected: boolean;
  baseUrl: string;
  latencyMs?: number;
  message: string;
}

export interface FocusTarget {
  lat: number;
  lng: number;
  zoom?: number;
  key: number;
}
