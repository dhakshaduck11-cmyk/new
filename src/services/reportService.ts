import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  AssessedDetection,
  HotspotCluster,
  RadarFilters,
  RiskConfig,
  SourceMode,
  SurveyAnalytics,
  SurveyReport,
} from '../types/anomasea';

export function buildSurveyReport(
  detections: AssessedDetection[],
  hotspots: HotspotCluster[],
  analytics: SurveyAnalytics,
  config: RiskConfig,
  sourceMode: SourceMode,
  filters: RadarFilters,
): SurveyReport {
  const highPriorityDetections = [...detections]
    .filter((d) => d.riskLevel === 'Critical' || d.riskLevel === 'High')
    .sort((a, b) => b.riskScore - a.riskScore);

  const lowConfidenceDetectionsCount = detections.filter(
    (d) => d.aiConfidence < 70,
  ).length;

  const p1Count = detections.filter(
    (d) => d.recommendedPriority === 'Immediate Action (P1)',
  ).length;
  const p2Count = detections.filter(
    (d) => d.recommendedPriority === 'Scheduled Remediation (P2)',
  ).length;
  const p3Count = detections.filter(
    (d) => d.recommendedPriority === 'Targeted Survey (P3)',
  ).length;
  const p4Count = detections.filter(
    (d) => d.recommendedPriority === 'Routine Monitoring (P4)',
  ).length;

  const fishingCount = detections.filter(
    (d) =>
      d.category === 'Fishing Nets, Ropes and Abandoned Fishing Equipment',
  ).length;
  const pollutionCount = detections.filter(
    (d) =>
      d.category === 'Plastic, Rubber and Glass Debris' ||
      d.category === 'Metal, Electronic and Shipwreck Debris' ||
      d.category === 'Construction, Household and Other Underwater Debris',
  ).length;
  const unknownCount = detections.filter(
    (d) => d.category === 'Unknown Underwater Anomalies',
  ).length;

  const datasetLabel =
    sourceMode === 'live-api'
      ? 'Live Python FastAPI Survey Observations'
      : sourceMode === 'imported-survey'
        ? 'Imported Field Survey GeoJSON / JSON Dataset'
        : 'Local Demonstration Mode (Clearly Labelled Synthetic Survey Records)';

  return {
    generatedAt: new Date().toISOString(),
    sourceMode,
    surveyOverview: {
      title: 'AnomaSea Environmental Risk Radar Survey Report',
      datasetLabel,
      totalDetections: analytics.totalDetections,
      totalHotspots: analytics.totalHotspots,
      meanRiskScore: analytics.meanRiskScore,
      meanAiConfidence: analytics.meanAiConfidence,
      activeFiltersSummary: `Categories: ${filters.categories.length}/5 · Risk Levels: ${filters.riskLevels.join(', ')} · Min AI Confidence: ${filters.minAiConfidence}%`,
    },
    analytics,
    hotspots,
    highPriorityDetections,
    allDetections: detections,
    recommendedInspectionPriorities: [
      {
        priority: 'Immediate Action (P1)',
        targetCount: p1Count,
        actionGuidance:
          'Dispatch dive/ROV recovery team within 72 hours for critical chemical leaching, active ghost gear, or urgent benthic hazards.',
      },
      {
        priority: 'Scheduled Remediation (P2)',
        targetCount: p2Count,
        actionGuidance:
          'Schedule coastal remediation vessel extraction and containment rigging during next calm-weather survey window.',
      },
      {
        priority: 'Targeted Survey (P3)',
        targetCount: p3Count,
        actionGuidance:
          'Conduct optical or side-scan verification pass to resolve flagged anomalies or moderate-risk accumulations.',
      },
      {
        priority: 'Routine Monitoring (P4)',
        targetCount: p4Count,
        actionGuidance:
          'Retain coordinates in longitudinal baseline log for seasonal drift and colonization monitoring.',
      },
    ],
    dataUncertainty: {
      meanGpsUncertaintyMeters: analytics.meanGpsUncertaintyMeters,
      maxGpsUncertaintyMeters: analytics.maxGpsUncertaintyMeters,
      lowConfidenceDetectionsCount,
      methodologyNote:
        'Environmental Risk Score (0–100) evaluates ecological, physical, entanglement, persistence, and chemical hazards independently from AI Detection Confidence (%). GPS uncertainty circles denote horizontal acoustic/GNSS positioning variance in metres.',
    },
    sdg14Relevance: [
      {
        target: 'SDG 14.1',
        title: 'Prevent and Significantly Reduce Marine Pollution',
        relevanceCount: pollutionCount,
        alignmentSummary:
          'Quantifies persistent plastics, rubber, corroded metallic drums, electronics, and construction debris for targeted coastal cleanup.',
      },
      {
        target: 'SDG 14.2',
        title: 'Protect and Restore Marine & Coastal Ecosystems',
        relevanceCount: hotspots.length,
        alignmentSummary:
          'DBSCAN hotspot mapping identifies high-density benthic smothering and chemical leaching zones threatening reef and kelp habitats.',
      },
      {
        target: 'SDG 14.4',
        title: 'Address Derelict & Ghost Fishing Gear Impacts',
        relevanceCount: fishingCount,
        alignmentSummary:
          'Isolates abandoned gillnets, traps, longlines, and FADs driving ghost fishing mortality and marine megafauna entanglement.',
      },
      {
        target: 'SDG 14.a',
        title: 'Increase Scientific Knowledge & Marine Technology',
        relevanceCount: unknownCount + analytics.totalDetections,
        alignmentSummary:
          'Combines standardized debris taxonomy, transparent risk scoring, and spatial uncertainty tracking for reproducible marine monitoring.',
      },
    ],
    configSnapshot: config,
  };
}

function escapeCsvCell(value: unknown): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportReportCsv(report: SurveyReport): void {
  const rows: string[] = [];
  rows.push('ANOMASEA ENVIRONMENTAL RISK RADAR REPORT');
  rows.push(`Generated At,${escapeCsvCell(report.generatedAt)}`);
  rows.push(`Data Source,${escapeCsvCell(report.surveyOverview.datasetLabel)}`);
  rows.push(`Total Detections,${report.analytics.totalDetections}`);
  rows.push(`Total Hotspots,${report.analytics.totalHotspots}`);
  rows.push(`Mean Risk Score,${report.analytics.meanRiskScore}`);
  rows.push(`Mean AI Confidence (%),${report.analytics.meanAiConfidence}`);
  rows.push(
    `Mean GPS Uncertainty (m),${report.dataUncertainty.meanGpsUncertaintyMeters}`,
  );
  rows.push('');

  rows.push('RISK CLASSIFICATION SUMMARY');
  rows.push('Risk Level,Count,Share (%)');
  for (const item of report.analytics.severityDistribution) {
    rows.push(`${item.level},${item.count},${item.percentage}`);
  }
  rows.push('');

  rows.push('DEBRIS CATEGORY DISTRIBUTION');
  rows.push('Category,Count,Share (%),Mean Risk Score,Critical Count');
  for (const item of report.analytics.categoryDistribution) {
    rows.push(
      `${escapeCsvCell(item.category)},${item.count},${item.percentage},${item.meanRisk},${item.criticalCount}`,
    );
  }
  rows.push('');

  rows.push('GEOGRAPHICAL HOTSPOT ANALYSIS (DBSCAN)');
  rows.push(
    'Hotspot ID,Region Label,Centroid Lat,Centroid Lng,Radius (m),Density (/km2),Detections,Accumulated Risk,Highest Risk,Overall Severity,Dominant Category,Recommended Priority',
  );
  for (const hs of report.hotspots) {
    rows.push(
      [
        hs.id,
        escapeCsvCell(hs.regionLabel),
        hs.centroid.lat,
        hs.centroid.lng,
        hs.radiusMeters,
        hs.detectionDensityPerKm2,
        hs.detectionCount,
        hs.accumulatedRisk,
        hs.highestIndividualRisk,
        hs.overallSeverity,
        escapeCsvCell(hs.dominantCategory),
        escapeCsvCell(hs.recommendedPriority),
      ].join(','),
    );
  }
  rows.push('');

  rows.push('DETECTION RECORDS');
  rows.push(
    'ID,Object Name,Category,Survey Zone,Lat,Lng,GPS Uncertainty (m),Depth (m),Environmental Risk Score,Risk Level,AI Confidence (%),Condition,Size,Verification Status,Priority,Observed At,Notes',
  );
  for (const d of report.allDetections) {
    rows.push(
      [
        escapeCsvCell(d.id),
        escapeCsvCell(d.objectName),
        escapeCsvCell(d.category),
        escapeCsvCell(d.surveyZone),
        d.lat,
        d.lng,
        d.gpsUncertaintyMeters,
        d.depthMeters ?? '',
        d.riskScore,
        d.riskLevel,
        d.aiConfidence.toFixed(1),
        escapeCsvCell(d.condition),
        escapeCsvCell(d.size),
        escapeCsvCell(d.verificationStatus),
        escapeCsvCell(d.recommendedPriority),
        escapeCsvCell(d.observedAt),
        escapeCsvCell(d.notes ?? ''),
      ].join(','),
    );
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `anomasea-risk-report-${report.generatedAt.slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportReportPdf(report: SurveyReport): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const getLastY = (): number => {
    const docWithAutoTable = doc as jsPDF & {
      lastAutoTable?: { finalY?: number };
    };
    return docWithAutoTable.lastAutoTable?.finalY ?? 40;
  };

  doc.setFillColor(11, 25, 44);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('AnomaSea — Environmental Risk Radar Report', 14, 12);
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text(`Generated: ${new Date(report.generatedAt).toUTCString()}`, 14, 19);
  doc.text(`Source: ${report.surveyOverview.datasetLabel}`, 14, 24);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('1. Survey Overview & Key Metrics', 14, 36);

  autoTable(doc, {
    startY: 39,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    head: [['Metric', 'Value', 'Metric', 'Value']],
    body: [
      [
        'Total Detections',
        String(report.analytics.totalDetections),
        'DBSCAN Hotspots',
        String(report.analytics.totalHotspots),
      ],
      [
        'Critical Risk (75–100)',
        String(report.analytics.criticalCount),
        'High Risk (50–74)',
        String(report.analytics.highCount),
      ],
      [
        'Moderate Risk (25–49)',
        String(report.analytics.moderateCount),
        'Low Risk (0–24)',
        String(report.analytics.lowCount),
      ],
      [
        'Mean Environmental Risk',
        `${report.analytics.meanRiskScore} / 100`,
        'Mean AI Confidence (Separate)',
        `${report.analytics.meanAiConfidence}%`,
      ],
    ],
  });

  let y = getLastY() + 8;
  doc.setFontSize(11);
  doc.text('2. Debris Category & Risk Severity Distribution', 14, y);
  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    head: [['Debris Category', 'Count', 'Share', 'Mean Risk', 'Critical']],
    body: report.analytics.categoryDistribution.map((c) => [
      c.category,
      String(c.count),
      `${c.percentage}%`,
      String(c.meanRisk),
      String(c.criticalCount),
    ]),
  });

  y = getLastY() + 8;
  doc.setFontSize(11);
  doc.text(
    `3. Geographical Hotspot Analysis (DBSCAN eps=${report.configSnapshot.dbscan.epsilonMeters}m, minPts=${report.configSnapshot.dbscan.minPoints})`,
    14,
    y,
  );
  autoTable(doc, {
    startY: y + 3,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    head: [
      [
        'ID',
        'Region',
        'Centroid',
        'Det.',
        'Density (/km2)',
        'Accum. Risk',
        'Severity',
        'Priority',
      ],
    ],
    body:
      report.hotspots.length > 0
        ? report.hotspots.map((hs) => [
            hs.id,
            hs.regionLabel,
            `${hs.centroid.lat.toFixed(4)}, ${hs.centroid.lng.toFixed(4)}`,
            String(hs.detectionCount),
            String(hs.detectionDensityPerKm2),
            String(hs.accumulatedRisk),
            hs.overallSeverity,
            hs.recommendedPriority,
          ])
        : [
            [
              '—',
              'No spatial clusters met DBSCAN threshold',
              '—',
              '0',
              '0',
              '0',
              '—',
              '—',
            ],
          ],
  });

  y = getLastY() + 8;
  if (y > 240) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(11);
  doc.text('4. High-Priority Detections (Critical & High Risk)', 14, y);
  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    head: [
      [
        'ID',
        'Object',
        'Zone',
        'Risk',
        'AI Conf.',
        'Condition',
        'GPS ±m',
        'Priority',
      ],
    ],
    body:
      report.highPriorityDetections.length > 0
        ? report.highPriorityDetections.slice(0, 15).map((d) => [
            d.id,
            d.objectName,
            d.surveyZone,
            `${d.riskScore} (${d.riskLevel})`,
            `${d.aiConfidence.toFixed(1)}%`,
            d.condition,
            `±${d.gpsUncertaintyMeters}m`,
            d.recommendedPriority,
          ])
        : [['—', 'No high or critical risk detections in active filter', '', '', '', '', '', '']],
  });

  y = getLastY() + 8;
  if (y > 235) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(11);
  doc.text('5. Recommended Inspection Priorities & Data Uncertainty', 14, y);
  autoTable(doc, {
    startY: y + 3,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    head: [['Priority Tier', 'Targets', 'Operational Guidance']],
    body: report.recommendedInspectionPriorities.map((p) => [
      p.priority,
      String(p.targetCount),
      p.actionGuidance,
    ]),
  });

  y = getLastY() + 6;
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const uncertaintyLines = doc.splitTextToSize(
    `Uncertainty & Confidence Note: Mean GPS uncertainty ±${report.dataUncertainty.meanGpsUncertaintyMeters}m (max ±${report.dataUncertainty.maxGpsUncertaintyMeters}m); ${report.dataUncertainty.lowConfidenceDetectionsCount} detections below 70% AI confidence. ${report.dataUncertainty.methodologyNote}`,
    182,
  );
  doc.text(uncertaintyLines, 14, y);
  y = y + uncertaintyLines.length * 4 + 6;
  if (y > 240) {
    doc.addPage();
    y = 16;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('6. UN SDG 14 (Life Below Water) Alignment', 14, y);
  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    head: [['Target', 'Focus Area', 'Observations', 'Relevance Summary']],
    body: report.sdg14Relevance.map((s) => [
      s.target,
      s.title,
      String(s.relevanceCount),
      s.alignmentSummary,
    ]),
  });

  doc.save(`anomasea-risk-report-${report.generatedAt.slice(0, 10)}.pdf`);
}
