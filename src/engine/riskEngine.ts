import {
  CATALOGUE_BY_ID,
  DEBRIS_CATEGORIES,
  DEBRIS_CATALOGUE,
} from '../data/catalogue';
import type {
  AssessedDetection,
  CatalogueClass,
  ContributingFactor,
  DbscanConfig,
  DebrisCategory,
  HotspotCluster,
  ObjectCondition,
  ObjectSize,
  RawDetectionRecord,
  RiskConfig,
  RiskLevel,
  RiskThresholds,
  SurveyAnalytics,
  VerificationStatus,
} from '../types/anomasea';

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#16A34A',
  Moderate: '#EAB308',
  High: '#EA580C',
  Critical: '#DC2626',
};

export const RISK_LEVELS: RiskLevel[] = ['Critical', 'High', 'Moderate', 'Low'];

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Verified',
  'Pending Review',
  'Flagged Anomaly',
];

export const OBJECT_CONDITIONS: ObjectCondition[] = [
  'Intact',
  'Partially Degraded',
  'Fragmented',
  'Heavily Corroded / Leaking',
];

export const OBJECT_SIZES: ObjectSize[] = ['Small', 'Medium', 'Large', 'Massive'];

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  weights: {
    persistence: 0.2,
    entanglement: 0.24,
    physicalHazard: 0.16,
    chemicalContamination: 0.22,
    ecologicalImpact: 0.18,
  },
  thresholds: {
    moderateMin: 25,
    highMin: 50,
    criticalMin: 75,
  },
  sizeMultiplierImpact: 1,
  conditionMultiplierImpact: 1,
  evidenceUncertaintyPenalty: 0.4,
  dbscan: {
    epsilonMeters: 500,
    minPoints: 2,
    accountForGpsUncertainty: true,
  },
};

const SIZE_DELTAS: Record<ObjectSize, number> = {
  Small: -6,
  Medium: 0,
  Large: 7,
  Massive: 13,
};

const CONDITION_DELTAS: Record<
  ObjectCondition,
  { baseDelta: number; chemicalBoost: number; fragmentationBoost: number }
> = {
  Intact: { baseDelta: 0, chemicalBoost: 0, fragmentationBoost: 0 },
  'Partially Degraded': { baseDelta: 4, chemicalBoost: 5, fragmentationBoost: 4 },
  Fragmented: { baseDelta: 5, chemicalBoost: 4, fragmentationBoost: 9 },
  'Heavily Corroded / Leaking': {
    baseDelta: 11,
    chemicalBoost: 16,
    fragmentationBoost: 6,
  },
};

export const PRIORITY_ACTION_GUIDANCE: Record<string, string> = {
  'Immediate Action (P1)':
    'Dispatch dive/ROV recovery team within 72 hours to mitigate critical ecological, entanglement, or chemical leaching hazards.',
  'Scheduled Remediation (P2)':
    'Include target in next coastal remediation vessel recovery window with appropriate containment/lifting rigging.',
  'Targeted Survey (P3)':
    'Schedule optical or side-scan sonar verification pass to resolve uncertainty, confirm object state, or evaluate removal.',
  'Routine Monitoring (P4)':
    'Retain GPS coordinates in longitudinal survey baseline for seasonal drift and benthic colonization tracking.',
};

export function classifyRiskLevel(
  score: number,
  thresholds: RiskThresholds = DEFAULT_RISK_CONFIG.thresholds,
): { level: RiskLevel; color: string } {
  if (score >= thresholds.criticalMin) {
    return { level: 'Critical', color: RISK_COLORS.Critical };
  }
  if (score >= thresholds.highMin) {
    return { level: 'High', color: RISK_COLORS.High };
  }
  if (score >= thresholds.moderateMin) {
    return { level: 'Moderate', color: RISK_COLORS.Moderate };
  }
  return { level: 'Low', color: RISK_COLORS.Low };
}

export function getRecommendedPriority(
  level: RiskLevel,
  verificationStatus: VerificationStatus,
): string {
  if (level === 'Critical') return 'Immediate Action (P1)';
  if (level === 'High') return 'Scheduled Remediation (P2)';
  if (level === 'Moderate' || verificationStatus === 'Flagged Anomaly') {
    return 'Targeted Survey (P3)';
  }
  return 'Routine Monitoring (P4)';
}

export function resolveCatalogueEntry(record: RawDetectionRecord): CatalogueClass {
  if (CATALOGUE_BY_ID[record.catalogueClassId]) {
    return CATALOGUE_BY_ID[record.catalogueClassId];
  }
  return (
    DEBRIS_CATALOGUE.find((item) => item.category === record.category) ??
    DEBRIS_CATALOGUE[DEBRIS_CATALOGUE.length - 1]
  );
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function assessDetection(
  record: RawDetectionRecord,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): AssessedDetection {
  const cat = resolveCatalogueEntry(record);
  const base = cat.baselineProfile;
  const weightSum =
    config.weights.persistence +
    config.weights.entanglement +
    config.weights.physicalHazard +
    config.weights.chemicalContamination +
    config.weights.ecologicalImpact;
  const divisor = weightSum > 0 ? weightSum : 1;

  const wPersist = config.weights.persistence / divisor;
  const wEntangle = config.weights.entanglement / divisor;
  const wPhysical = config.weights.physicalHazard / divisor;
  const wChemical = config.weights.chemicalContamination / divisor;
  const wEcol = config.weights.ecologicalImpact / divisor;

  const condDelta =
    CONDITION_DELTAS[record.condition] ?? CONDITION_DELTAS['Partially Degraded'];
  const sizeDelta = SIZE_DELTAS[record.size] ?? 0;

  const adjChemical = Math.min(
    100,
    base.chemicalContamination + condDelta.chemicalBoost * config.conditionMultiplierImpact,
  );
  const adjEcological = Math.min(
    100,
    base.ecologicalImpact + condDelta.fragmentationBoost * config.conditionMultiplierImpact,
  );

  const weightedBase =
    base.persistence * wPersist +
    base.entanglement * wEntangle +
    base.physicalHazard * wPhysical +
    adjChemical * wChemical +
    adjEcological * wEcol;

  const sizeConditionModifier =
    sizeDelta * config.sizeMultiplierImpact +
    condDelta.baseDelta * config.conditionMultiplierImpact;

  const lowConfTerm = Math.max(0, 75 - record.aiConfidence) / 25;
  const gpsTerm = Math.min(1, record.gpsUncertaintyMeters / 40);
  const flagTerm = record.verificationStatus === 'Flagged Anomaly' ? 4 : 0;
  const uncertaintyModifier =
    (lowConfTerm * 2.2 + gpsTerm * 2.5 + flagTerm) * config.evidenceUncertaintyPenalty;

  const riskScore = clampScore(weightedBase + sizeConditionModifier + uncertaintyModifier);
  const { level: riskLevel, color: riskColor } = classifyRiskLevel(
    riskScore,
    config.thresholds,
  );

  const contributingFactors: ContributingFactor[] = [
    {
      key: 'persistence',
      label: 'Material & Environmental Persistence',
      rawScore: base.persistence,
      weightPercent: Math.round(wPersist * 100),
      weightedContribution: Number((base.persistence * wPersist).toFixed(1)),
      summary: `${cat.materialComposition} (${cat.estimatedPersistenceYears})`,
    },
    {
      key: 'entanglement',
      label: 'Entanglement Risk',
      rawScore: base.entanglement,
      weightPercent: Math.round(wEntangle * 100),
      weightedContribution: Number((base.entanglement * wEntangle).toFixed(1)),
      summary:
        base.entanglement >= 70
          ? 'Severe active fauna / vessel entanglement potential'
          : base.entanglement >= 35
            ? 'Moderate snagging or entrapment hazard'
            : 'Low direct entanglement morphology',
    },
    {
      key: 'physicalHazard',
      label: 'Physical Hazard',
      rawScore: base.physicalHazard,
      weightPercent: Math.round(wPhysical * 100),
      weightedContribution: Number((base.physicalHazard * wPhysical).toFixed(1)),
      summary:
        base.physicalHazard >= 60
          ? 'Substantial benthic abrasion, crushing, or navigation snag risk'
          : 'Localized physical contact hazard',
    },
    {
      key: 'chemicalContamination',
      label: 'Chemical Contamination Potential',
      rawScore: Math.round(adjChemical),
      weightPercent: Math.round(wChemical * 100),
      weightedContribution: Number((adjChemical * wChemical).toFixed(1)),
      summary:
        adjChemical >= 70
          ? `Elevated toxicant / leachate hazard (${record.condition})`
          : 'Polymer additive or low-rate corrosion leaching profile',
    },
    {
      key: 'ecologicalImpact',
      label: 'Ecological Impact',
      rawScore: Math.round(adjEcological),
      weightPercent: Math.round(wEcol * 100),
      weightedContribution: Number((adjEcological * wEcol).toFixed(1)),
      summary:
        adjEcological >= 70
          ? 'High benthic smothering, trophic ingestion, or mortality impact'
          : 'Localized habitat disturbance',
    },
    {
      key: 'sizeConditionModifier',
      label: 'Object Size & Condition Modifier',
      rawScore: Math.round(sizeConditionModifier),
      weightPercent: 0,
      weightedContribution: Number(sizeConditionModifier.toFixed(1)),
      summary: `${record.size} object · ${record.condition}`,
    },
    {
      key: 'evidenceUncertainty',
      label: 'Evidence & GPS Uncertainty Adjustment',
      rawScore: Math.round(uncertaintyModifier * 10) / 10,
      weightPercent: 0,
      weightedContribution: Number(uncertaintyModifier.toFixed(1)),
      summary: `AI confidence ${record.aiConfidence.toFixed(1)}% · GPS ±${record.gpsUncertaintyMeters.toFixed(1)}m`,
    },
  ];

  const topTwo = [...contributingFactors]
    .filter((factor) => factor.weightPercent > 0)
    .sort((a, b) => b.weightedContribution - a.weightedContribution)
    .slice(0, 2)
    .map((factor) => factor.label.toLowerCase());

  const explanation = `${record.objectName} (${record.size.toLowerCase()}, ${record.condition.toLowerCase()}) scores ${riskScore}/100 (${riskLevel} environmental risk), driven primarily by ${topTwo.join(' and ')}. AI detection confidence (${record.aiConfidence.toFixed(1)}%) reflects classifier certainty only and is evaluated separately from ecological hazard.`;

  return {
    ...record,
    riskScore,
    riskLevel,
    riskColor,
    contributingFactors,
    explanation,
    recommendedPriority: getRecommendedPriority(riskLevel, record.verificationStatus),
  };
}

export function assessAllDetections(
  records: RawDetectionRecord[],
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): AssessedDetection[] {
  return records.map((record) => assessDetection(record, config));
}

export interface MissingFieldNote {
  label: string;
  detail: string;
}

export function computeMissingOrUncertainFields(
  detection: AssessedDetection,
): MissingFieldNote[] {
  const issues: MissingFieldNote[] = [];

  if (detection.depthMeters === undefined || Number.isNaN(detection.depthMeters)) {
    issues.push({
      label: 'Bathymetric Depth Missing',
      detail: 'No depth measurement (m) was recorded with this observation.',
    });
  }
  if (!detection.notes || detection.notes.trim().length === 0) {
    issues.push({
      label: 'Field / ROV Notes Absent',
      detail: 'No operator visual notes or substrate context recorded.',
    });
  }
  if (detection.aiConfidence < 75) {
    issues.push({
      label: 'Moderate / Low AI Classifier Confidence',
      detail: `AI recognition confidence is ${detection.aiConfidence.toFixed(1)}% (< 75% threshold); optical confirmation recommended.`,
    });
  }
  if (detection.gpsUncertaintyMeters > 15) {
    issues.push({
      label: 'Elevated GPS Positional Uncertainty',
      detail: `Horizontal localization variance is ±${detection.gpsUncertaintyMeters.toFixed(1)} m (> 15 m).`,
    });
  }
  if (detection.verificationStatus !== 'Verified') {
    issues.push({
      label: `Verification Status: ${detection.verificationStatus}`,
      detail: 'Target has not yet been marked Verified by a marine analyst.',
    });
  }
  if (detection.category === 'Unknown Underwater Anomalies') {
    issues.push({
      label: 'Unidentified Material Composition',
      detail:
        'Object class is an unknown anomaly; chemical composition and persistence estimates carry higher epistemic uncertainty.',
    });
  }

  return issues;
}

const EARTH_RADIUS_METERS = 6371e3;

export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return EARTH_RADIUS_METERS * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function effectiveDistanceMeters(
  a: AssessedDetection,
  b: AssessedDetection,
  accountForGpsUncertainty: boolean,
): number {
  const raw = haversineDistanceMeters(a.lat, a.lng, b.lat, b.lng);
  if (!accountForGpsUncertainty) return raw;
  const overlapAllowance = Math.min(
    60,
    (a.gpsUncertaintyMeters + b.gpsUncertaintyMeters) * 0.5,
  );
  return Math.max(0, raw - overlapAllowance);
}

function getHotspotPriority(
  level: RiskLevel,
  highestRisk: number,
  density: number,
): string {
  if (level === 'Critical' || highestRisk >= 80) return 'Immediate Action (P1)';
  if (level === 'High' || density >= 15) return 'Scheduled Remediation (P2)';
  if (level === 'Moderate') return 'Targeted Survey (P3)';
  return 'Routine Monitoring (P4)';
}

export function computeDbscanHotspots(
  detections: AssessedDetection[],
  dbscan: DbscanConfig = DEFAULT_RISK_CONFIG.dbscan,
  thresholds: RiskThresholds = DEFAULT_RISK_CONFIG.thresholds,
): HotspotCluster[] {
  if (detections.length === 0) return [];

  const eps = Math.max(25, dbscan.epsilonMeters);
  const minPts = Math.max(2, dbscan.minPoints);
  const n = detections.length;
  const visited = Array<boolean>(n).fill(false);
  const clusterIds = Array<number>(n).fill(-1);
  let currentCluster = 0;

  const regionQuery = (idx: number): number[] => {
    const neighbors: number[] = [];
    for (let j = 0; j < n; j++) {
      if (
        effectiveDistanceMeters(
          detections[idx],
          detections[j],
          dbscan.accountForGpsUncertainty,
        ) <= eps
      ) {
        neighbors.push(j);
      }
    }
    return neighbors;
  };

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const neighbors = regionQuery(i);
    const weightedObsCount = neighbors.reduce(
      (sum, idx) => sum + Math.max(1, detections[idx].observationCount ?? 1),
      0,
    );
    if (neighbors.length < minPts && weightedObsCount < minPts + 1) {
      clusterIds[i] = -1;
      continue;
    }

    const clusterId = currentCluster++;
    clusterIds[i] = clusterId;
    const queue = [...neighbors];
    let head = 0;

    while (head < queue.length) {
      const pointIdx = queue[head++];
      if (!visited[pointIdx]) {
        visited[pointIdx] = true;
        const pointNeighbors = regionQuery(pointIdx);
        if (pointNeighbors.length >= minPts) {
          for (const candidate of pointNeighbors) {
            if (!queue.includes(candidate)) {
              queue.push(candidate);
            }
          }
        }
      }
      if (clusterIds[pointIdx] === -1) {
        clusterIds[pointIdx] = clusterId;
      }
    }
  }

  const grouped = new Map<number, AssessedDetection[]>();
  for (let i = 0; i < n; i++) {
    const cid = clusterIds[i];
    if (cid >= 0) {
      const list = grouped.get(cid) ?? [];
      list.push(detections[i]);
      grouped.set(cid, list);
    }
  }

  const hotspots: HotspotCluster[] = [];

  Array.from(grouped.entries()).forEach(([cid, members]) => {
    if (members.length < 2 && (members[0]?.observationCount ?? 1) < minPts) {
      return;
    }

    const centroidLat =
      members.reduce((sum, item) => sum + item.lat, 0) / members.length;
    const centroidLng =
      members.reduce((sum, item) => sum + item.lng, 0) / members.length;

    let maxRadius = 0;
    for (const member of members) {
      const dist =
        haversineDistanceMeters(centroidLat, centroidLng, member.lat, member.lng) +
        member.gpsUncertaintyMeters;
      if (dist > maxRadius) maxRadius = dist;
    }

    const radiusMeters = Math.max(60, Math.round(maxRadius));
    const areaKm2 = Math.max(0.01, (Math.PI * radiusMeters * radiusMeters) / 1e6);
    const totalObs = members.reduce(
      (sum, item) => sum + Math.max(1, item.observationCount ?? 1),
      0,
    );
    const density = Number((members.length / areaKm2).toFixed(1));
    const accumulatedRisk = members.reduce((sum, item) => sum + item.riskScore, 0);
    const meanRisk = Number((accumulatedRisk / members.length).toFixed(1));
    const highestIndividualRisk = Math.max(...members.map((item) => item.riskScore));

    const categoryTotals = new Map<DebrisCategory, { count: number; risk: number }>();
    for (const member of members) {
      const prev = categoryTotals.get(member.category) ?? { count: 0, risk: 0 };
      categoryTotals.set(member.category, {
        count: prev.count + 1,
        risk: prev.risk + member.riskScore,
      });
    }

    let dominantCategory: DebrisCategory = members[0].category;
    let bestScore = -1;
    for (const [cat, stats] of categoryTotals.entries()) {
      const score = stats.count * 1000 + stats.risk;
      if (score > bestScore) {
        bestScore = score;
        dominantCategory = cat;
      }
    }

    const clusterSizeBoost = Math.min(12, Math.max(0, (members.length - 2) * 3));
    const hotspotComposite = Math.min(
      100,
      Math.round(meanRisk * 0.6 + highestIndividualRisk * 0.4 + clusterSizeBoost),
    );
    const { level: overallSeverity, color: severityColor } = classifyRiskLevel(
      hotspotComposite,
      thresholds,
    );

    const zoneCounts = new Map<string, number>();
    for (const member of members) {
      zoneCounts.set(member.surveyZone, (zoneCounts.get(member.surveyZone) ?? 0) + 1);
    }
    const regionLabel =
      Array.from(zoneCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      `Sector ${centroidLat.toFixed(3)}, ${centroidLng.toFixed(3)}`;

    const meanGpsUncertaintyMeters = Number(
      (
        members.reduce((sum, item) => sum + item.gpsUncertaintyMeters, 0) /
        members.length
      ).toFixed(1),
    );

    hotspots.push({
      id: `HS-${String(cid + 1).padStart(2, '0')}`,
      label: `Hotspot ${cid + 1}: ${regionLabel}`,
      regionLabel,
      centroid: {
        lat: Number(centroidLat.toFixed(6)),
        lng: Number(centroidLng.toFixed(6)),
      },
      radiusMeters,
      areaKm2: Number(areaKm2.toFixed(3)),
      detectionDensityPerKm2: density,
      detectionCount: members.length,
      totalObservationCount: totalObs,
      accumulatedRisk,
      meanRisk,
      highestIndividualRisk,
      dominantCategory,
      overallSeverity,
      severityColor,
      contributingDetectionIds: members.map((m) => m.id),
      recommendedPriority: getHotspotPriority(
        overallSeverity,
        highestIndividualRisk,
        density,
      ),
      meanGpsUncertaintyMeters,
    });
  });

  return hotspots.sort((a, b) => b.accumulatedRisk - a.accumulatedRisk);
}

export function computeSurveyAnalytics(
  detections: AssessedDetection[],
  hotspots: HotspotCluster[],
): SurveyAnalytics {
  const totalDetections = detections.length;
  let criticalCount = 0;
  let highCount = 0;
  let moderateCount = 0;
  let lowCount = 0;

  for (const item of detections) {
    if (item.riskLevel === 'Critical') criticalCount++;
    else if (item.riskLevel === 'High') highCount++;
    else if (item.riskLevel === 'Moderate') moderateCount++;
    else lowCount++;
  }

  const meanRiskScore =
    totalDetections > 0
      ? Number(
          (
            detections.reduce((sum, item) => sum + item.riskScore, 0) / totalDetections
          ).toFixed(1),
        )
      : 0;

  const meanAiConfidence =
    totalDetections > 0
      ? Number(
          (
            detections.reduce((sum, item) => sum + item.aiConfidence, 0) /
            totalDetections
          ).toFixed(1),
        )
      : 0;

  const meanGpsUncertaintyMeters =
    totalDetections > 0
      ? Number(
          (
            detections.reduce((sum, item) => sum + item.gpsUncertaintyMeters, 0) /
            totalDetections
          ).toFixed(1),
        )
      : 0;

  const maxGpsUncertaintyMeters =
    totalDetections > 0
      ? Math.max(...detections.map((item) => item.gpsUncertaintyMeters))
      : 0;

  const categoryDistribution = DEBRIS_CATEGORIES.map((category) => {
    const items = detections.filter((d) => d.category === category);
    const count = items.length;
    const meanRisk =
      count > 0
        ? Number((items.reduce((sum, d) => sum + d.riskScore, 0) / count).toFixed(1))
        : 0;
    const crit = items.filter((d) => d.riskLevel === 'Critical').length;
    return {
      category,
      count,
      percentage:
        totalDetections > 0 ? Number(((count / totalDetections) * 100).toFixed(1)) : 0,
      meanRisk,
      criticalCount: crit,
    };
  });

  const severityTotals: Record<RiskLevel, number> = {
    Critical: criticalCount,
    High: highCount,
    Moderate: moderateCount,
    Low: lowCount,
  };

  const severityDistribution = RISK_LEVELS.map((level) => ({
    level,
    color: RISK_COLORS[level],
    count: severityTotals[level],
    percentage:
      totalDetections > 0
        ? Number(((severityTotals[level] / totalDetections) * 100).toFixed(1))
        : 0,
  }));

  const highestRiskObjects = [...detections]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6);

  const zoneMap = new Map<string, AssessedDetection[]>();
  for (const item of detections) {
    const list = zoneMap.get(item.surveyZone) ?? [];
    list.push(item);
    zoneMap.set(item.surveyZone, list);
  }

  const geographicalSummaries = Array.from(zoneMap.entries())
    .map(([surveyZone, items]) => {
      const catCounts = new Map<DebrisCategory, number>();
      for (const item of items) {
        catCounts.set(item.category, (catCounts.get(item.category) ?? 0) + 1);
      }
      const dominantCategory =
        Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        items[0].category;

      return {
        surveyZone,
        detectionCount: items.length,
        meanRisk: Number(
          (items.reduce((sum, d) => sum + d.riskScore, 0) / items.length).toFixed(1),
        ),
        maxRisk: Math.max(...items.map((d) => d.riskScore)),
        criticalAndHighCount: items.filter(
          (d) => d.riskLevel === 'Critical' || d.riskLevel === 'High',
        ).length,
        dominantCategory,
        meanGpsUncertaintyMeters: Number(
          (
            items.reduce((sum, d) => sum + d.gpsUncertaintyMeters, 0) / items.length
          ).toFixed(1),
        ),
      };
    })
    .sort((a, b) => b.meanRisk - a.meanRisk);

  return {
    totalDetections,
    criticalCount,
    highCount,
    moderateCount,
    lowCount,
    totalHotspots: hotspots.length,
    meanRiskScore,
    meanAiConfidence,
    meanGpsUncertaintyMeters,
    maxGpsUncertaintyMeters,
    categoryDistribution,
    severityDistribution,
    highestRiskObjects,
    geographicalSummaries,
  };
}
